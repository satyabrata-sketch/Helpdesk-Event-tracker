// ==============================================================================
// SUPABASE EDGE FUNCTION: sync-onedrive
// Auto-syncs OneDrive/SharePoint Excel trackers to Supabase Postgres database
// Preserves all sheets, all columns, and column order.
// ==============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncResult {
  tracker_id: string;
  name: string;
  status: "success" | "error" | "access_revoked";
  message: string;
  sheets: { sheet_name: string; rows_count: number; columns_count: number }[];
  total_rows: number;
}

// Convert SharePoint / OneDrive share URL to direct download URL
function convertToDirectDownloadUrl(shareUrl: string): string {
  if (!shareUrl) return "";
  try {
    const urlObj = new URL(shareUrl);

    // If it's already a download link
    if (urlObj.searchParams.get("download") === "1") {
      return shareUrl;
    }

    // SharePoint link with :x:/r/ or personal drive
    if (urlObj.hostname.includes("sharepoint.com") || urlObj.hostname.includes("onedrive.live.com")) {
      // Replace or set download=1
      urlObj.searchParams.set("download", "1");
      return urlObj.toString();
    }

    // Default: append download=1
    return shareUrl.includes("?") ? `${shareUrl}&download=1` : `${shareUrl}?download=1`;
  } catch (_e) {
    return shareUrl;
  }
}

// Microsoft Graph sharing token generator
function getGraphSharingToken(shareUrl: string): string {
  const base64 = btoa(unescape(encodeURIComponent(shareUrl)));
  return "u!" + base64.replace(/=/g, "").replace(/\//g, "_").replace(/\+/g, "-");
}

// Get Azure AD App token if credentials are provided
async function getAzureAccessToken(): Promise<string | null> {
  const tenantId = Deno.env.get("AZURE_TENANT_ID");
  const clientId = Deno.env.get("AZURE_CLIENT_ID");
  const clientSecret = Deno.env.get("AZURE_CLIENT_SECRET");

  if (!tenantId || !clientId || !clientSecret) return null;

  try {
    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
        scope: "https://graph.microsoft.com/.default",
      }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.access_token || null;
  } catch (err) {
    console.error("Failed to acquire Azure AD token:", err);
    return null;
  }
}

// Download Excel file from OneDrive / SharePoint
async function fetchExcelBuffer(shareUrl: string): Promise<Uint8Array> {
  const downloadUrl = convertToDirectDownloadUrl(shareUrl);
  const bearerToken = await getAzureAccessToken();

  const headers: Record<string, string> = {
    "User-Agent": "CBRE-Facility-Sync-Bot/1.0",
  };
  if (bearerToken) {
    headers["Authorization"] = `Bearer ${bearerToken}`;
  }

  // 1. Try direct download URL
  let res = await fetch(downloadUrl, { headers, redirect: "follow" });

  // 2. If blocked or direct download requires Graph shares API
  if (!res.ok && bearerToken) {
    const sharingToken = getGraphSharingToken(shareUrl);
    const graphUrl = `https://graph.microsoft.com/v1.0/shares/${sharingToken}/driveItem/content`;
    res = await fetch(graphUrl, { headers });
  }

  if (res.status === 401 || res.status === 403) {
    throw new Error("ACCESS_REVOKED: HTTP " + res.status + " Access Denied or Revoked");
  }

  if (!res.ok) {
    throw new Error(`Failed to fetch file: HTTP ${res.status} ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}

// Parse Excel Workbook using SheetJS
function parseWorkbook(buffer: Uint8Array) {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const result: Record<string, { headers: string[]; rows: Record<string, any>[] }> = {};

  for (const sheetName of workbook.SheetNames) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    // Convert sheet to json array of arrays to find header row safely
    const rawData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });
    if (!rawData || rawData.length === 0) continue;

    // Find the header row (skip top title rows if any)
    let headerRowIdx = 0;
    for (let i = 0; i < Math.min(6, rawData.length); i++) {
      const row = rawData[i];
      if (
        row &&
        (row.includes("Sr no.") ||
          row.includes("Sr No.") ||
          row.includes("Event ID") ||
          row.includes("Site") ||
          row.includes("Building"))
      ) {
        headerRowIdx = i;
        break;
      }
    }

    const headerRow = rawData[headerRowIdx] || [];
    const headers: string[] = headerRow.map((c: any, idx: number) => {
      const val = c !== null && c !== undefined ? String(c).trim() : "";
      return val || `Col_${idx + 1}`;
    });

    const rows: Record<string, any>[] = [];
    for (let r = headerRowIdx + 1; r < rawData.length; r++) {
      const row = rawData[r];
      if (!row || row.length === 0) continue;

      // Filter out completely blank rows
      const hasData = row.some((c: any) => c !== null && c !== undefined && String(c).trim() !== "");
      if (!hasData) continue;

      const rowObj: Record<string, any> = {};
      headers.forEach((h: string, colIdx: number) => {
        let val = row[colIdx];
        if (val instanceof Date) {
          val = val.toISOString();
        }
        rowObj[h] = val !== undefined ? val : null;
      });
      rows.push(rowObj);
    }

    result[sheetName] = { headers, rows };
  }

  return result;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || "";
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: SyncResult[] = [];

  try {
    // 1. Fetch tracker configurations from database
    const { data: configs, error: configErr } = await supabase
      .from("tracker_configs")
      .select("*")
      .order("id");

    if (configErr) throw configErr;

    // 2. Process each tracker independently (File 1 failure doesn't stop File 2, File 2 access revocation doesn't stop File 1)
    for (const tracker of configs || []) {
      const trackerStart = Date.now();
      try {
        console.log(`Starting sync for tracker: ${tracker.name} (${tracker.id})`);
        const fileBuffer = await fetchExcelBuffer(tracker.share_url);
        const parsedSheets = parseWorkbook(fileBuffer);

        const sheetSummaries: { sheet_name: string; rows_count: number; columns_count: number }[] = [];
        let trackerTotalRows = 0;

        // Ingest each sheet
        for (const [sheetName, sheetData] of Object.entries(parsedSheets)) {
          sheetSummaries.push({
            sheet_name: sheetName,
            rows_count: sheetData.rows.length,
            columns_count: sheetData.headers.length,
          });
          trackerTotalRows += sheetData.rows.length;

          // Upsert sheet metadata
          await supabase.from("tracker_sheets").upsert({
            id: `${tracker.id}:${sheetName}`,
            tracker_id: tracker.id,
            sheet_name: sheetName,
            column_order: sheetData.headers,
            column_metadata: { column_count: sheetData.headers.length },
            row_count: sheetData.rows.length,
            last_synced_at: new Date().toISOString(),
          });

          // Delete old rows for this sheet and insert latest batch (up to 500 per batch)
          await supabase
            .from("tracker_rows")
            .delete()
            .match({ tracker_id: tracker.id, sheet_name: sheetName });

          const batchSize = 250;
          for (let i = 0; i < sheetData.rows.length; i += batchSize) {
            const chunk = sheetData.rows.slice(i, i + batchSize).map((r, idx) => ({
              tracker_id: tracker.id,
              sheet_name: sheetName,
              row_index: i + idx + 1,
              data: r,
            }));
            await supabase.from("tracker_rows").insert(chunk);
          }

          // Ingest primary structured tables
          if (tracker.id === "helpdesk_tracker" && sheetName.includes("Helpdesk")) {
            await supabase.from("helpdesk_tickets").delete().neq("id", 0);
            const structuredTickets = sheetData.rows.map((r) => ({
              sr_no: String(r["Sr no."] || r["Sr No."] || ""),
              site: r["Site"] ? String(r["Site"]).trim() : "Unknown",
              zone: r["Zone"] ? String(r["Zone"]) : null,
              location: r["Location"] ? String(r["Location"]) : null,
              month: r["Month"] ? String(r["Month"]) : null,
              ticket_date: r["Date"] ? new Date(r["Date"]).toISOString() : null,
              report_time: r["Report Time"] ? String(r["Report Time"]) : null,
              request_category: r["Request category"] ? String(r["Request category"]).trim() : "Other",
              employee_name: r["Employee Name"] ? String(r["Employee Name"]) : null,
              request_via: r["Request Via"] ? String(r["Request Via"]) : null,
              description: r["Discription"] || r["Description"] || "",
              action_taken: r["Action taken"] || "",
              date_close: r["Date close"] ? new Date(r["Date close"]).toISOString() : null,
              resolved_time: r["Resolved time"] ? String(r["Resolved time"]) : null,
              status: r["Status / WIP"] || r["Status"] || "Open",
              request_from: r["Request from"] ? String(r["Request from"]) : null,
              call_type: r["Call type"] ? String(r["Call type"]) : null,
              remark: r["Remark"] ? String(r["Remark"]) : null,
              tat_status: r["TAT Status"] ? String(r["TAT Status"]) : null,
              raw_data: r,
              synced_at: new Date().toISOString(),
            }));

            for (let i = 0; i < structuredTickets.length; i += 250) {
              await supabase.from("helpdesk_tickets").insert(structuredTickets.slice(i, i + 250));
            }
          }

          if (tracker.id === "event_tracker" && sheetName.includes("Master_Event_Tracker")) {
            await supabase.from("event_operations").delete().neq("id", 0);
            const structuredEvents = sheetData.rows.map((r) => ({
              event_id: String(r["Event ID"] || ""),
              year: parseInt(r["Year"]) || 2026,
              month: r["Month"] ? String(r["Month"]) : null,
              event_date: r["Event Date"] ? new Date(r["Event Date"]).toISOString() : null,
              day: r["Day"] ? String(r["Day"]) : null,
              building: r["Building"] ? String(r["Building"]).trim() : "Downtown",
              floor: r["Floor"] ? String(r["Floor"]) : null,
              location: r["Location"] ? String(r["Location"]) : null,
              title: r["Event Title / Purpose"] || r["Event Type / Title"] || "",
              category: r["Category"] ? String(r["Category"]).trim() : "Other",
              capacity_pax: parseInt(r["Capacity / Pax"] || r["Capacity"]) || 0,
              event_scale: r["Event Scale"] || "Small Event",
              start_time: r["Start Time"] || r["Event Start Time"] || null,
              end_time: r["End Time"] || r["Event End Time"] || null,
              fb_support: r["F&B Support"] || r["F& B"] || null,
              logistic_support: r["Logistic Support"] || null,
              booked_by: r["Booked By"] || null,
              requester_email: r["Requester Email"] || null,
              booking_status: r["Calendar Booking Status"] || "Confirmed (Done)",
              feedback_form: r["Feedback Form"] || null,
              booking_date: r["Booking Date"] ? new Date(r["Booking Date"]).toISOString() : null,
              remarks: r["Remarks"] || null,
              raw_data: r,
              synced_at: new Date().toISOString(),
            }));

            for (let i = 0; i < structuredEvents.length; i += 250) {
              await supabase.from("event_operations").insert(structuredEvents.slice(i, i + 250));
            }
          }
        }

        // Update success config
        await supabase
          .from("tracker_configs")
          .update({
            last_sync_status: "success",
            last_sync_error: null,
            last_synced_at: new Date().toISOString(),
            total_rows: trackerTotalRows,
            sheet_count: sheetSummaries.length,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tracker.id);

        // Log success
        await supabase.from("tracker_sync_logs").insert({
          tracker_id: tracker.id,
          status: "success",
          duration_ms: Date.now() - trackerStart,
          message: `Successfully synced ${sheetSummaries.length} sheets and ${trackerTotalRows} rows.`,
          sheets_synced: sheetSummaries,
        });

        results.push({
          tracker_id: tracker.id,
          name: tracker.name,
          status: "success",
          message: `Synced ${trackerTotalRows} rows across ${sheetSummaries.length} sheets.`,
          sheets: sheetSummaries,
          total_rows: trackerTotalRows,
        });
      } catch (trackerErr: any) {
        const isAccessRevoked =
          trackerErr.message?.includes("ACCESS_REVOKED") ||
          trackerErr.message?.includes("401") ||
          trackerErr.message?.includes("403");

        const statusType = isAccessRevoked ? "access_revoked" : "error";
        const errorMsg = isAccessRevoked
          ? "File 2 Access Revoked - Contact Owner"
          : trackerErr.message || "Unknown sync error";

        console.error(`Error syncing ${tracker.id}:`, errorMsg);

        // Update config status
        await supabase
          .from("tracker_configs")
          .update({
            last_sync_status: statusType,
            last_sync_error: errorMsg,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tracker.id);

        // Log error
        await supabase.from("tracker_sync_logs").insert({
          tracker_id: tracker.id,
          status: statusType,
          duration_ms: Date.now() - trackerStart,
          message: errorMsg,
        });

        results.push({
          tracker_id: tracker.id,
          name: tracker.name,
          status: statusType,
          message: errorMsg,
          sheets: [],
          total_rows: 0,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        duration_ms: Date.now() - startTime,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Fatal sync error",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
