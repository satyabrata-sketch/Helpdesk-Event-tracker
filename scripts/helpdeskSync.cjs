// ==============================================================================
// HELPDESK ONEDRIVE / EXCEL TO SUPABASE LIVE SYNC ENGINE
// Syncs Excel "HELP DESK TRACKER FY 25-26 - Master" directly to Supabase public.helpdesk
// Upserts changed rows based on sr_no, preserves old rows, logs to tracker_sync_logs
// ==============================================================================
global.WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://rtegucaglwrvhharkxet.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function excelDateToStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    if (val > 30000 && val < 60000) {
      const d = new Date(Math.round((val - 25569) * 86400 * 1000));
      return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
    }
    return String(val);
  }
  let s = String(val).trim();
  const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (m1) {
    const d = m1[1].padStart(2, '0');
    const m = m1[2].padStart(2, '0');
    const y = m1[3];
    return `${y}-${m}-${d}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const yr = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    return `${yr}-${mm}-${dd}`;
  }
  return s;
}

function excelTimeToStr(val) {
  if (!val && val !== 0) return '';
  if (typeof val === 'number') {
    if (val >= 0 && val < 1) {
      const totalMinutes = Math.round(val * 24 * 60);
      let h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }
  }
  return String(val).trim();
}

function resolveHelpdeskFilePath(customPath = null) {
  if (customPath && typeof customPath === 'string' && fs.existsSync(customPath)) {
    return customPath;
  }

  const candidatePaths = [
    'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/apps/Dashboard/Helpdesk & Event/CBRE-Sync/HELP DESK TRACKER FY 25-26 - Master.xlsx',
    path.resolve(__dirname, '../CBRE-Sync/HELP DESK TRACKER FY 25-26 - Master.xlsx'),
    path.resolve('./CBRE-Sync/HELP DESK TRACKER FY 25-26 - Master.xlsx'),
    'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/apps/Dashboard/Helpdesk & Event/HELP DESK TRACKER FY 25-26 - Master.xlsx',
    path.resolve('./HELP DESK TRACKER FY 25-26 - Master.xlsx'),
    'C:/Users/SMohanty6/OneDrive - CBRE, Inc/Desktop/Trackers/Event/HELP DESK TRACKER FY 25-26 - Master.xlsx',
    'C:/Users/SMohanty6/OneDrive - CBRE, Inc/HELP DESK TRACKER FY 25-26 - Master.xlsx'
  ];

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }

  return null;
}

function extractHelpdeskFileIdAndUrl(customUrl = null, customId = null) {
  let fileWebUrl = customUrl || process.env.VITE_HELPDESK_TRACKER_URL || 'https://cbre-my.sharepoint.com/:x:/r/personal/alwajid_ansari_cbre_com/Documents/Attachments/HELP%20DESK%20TRACKER%20FY%2025-26%20-%20Master.xlsx?d=w5dc43c3ec1674b61b95cbfbe614ffbc5&csf=1&web=1&e=3aSaZb';
  let fileId = customId || process.env.VITE_HELPDESK_FILE_ID || '';
  if (!fileId && fileWebUrl) {
    try {
      const u = new URL(fileWebUrl);
      fileId = u.searchParams.get('d') || '';
    } catch (_e) {}
  }
  if (!fileId) fileId = 'w5dc43c3ec1674b61b95cbfbe614ffbc5';
  return { fileId, fileWebUrl };
}

async function syncHelpdeskFromExcel(options = {}) {
  const startTime = Date.now();
  const { customFileUrl, customFileId, customFilePath } = options;
  const filePath = resolveHelpdeskFilePath(customFilePath);

  if (!filePath) {
    throw new Error('FILE_NOT_FOUND: Helpdesk Excel file not found on OneDrive / disk path.');
  }

  const { fileId, fileWebUrl } = extractHelpdeskFileIdAndUrl(customFileUrl, customFileId);
  const fileName = path.basename(filePath);
  const fileStat = fs.statSync(filePath);

  console.log(`[HelpdeskSync] Reading ${fileName} from ${filePath}`);
  const wb = xlsx.readFile(filePath, { cellDates: true });
  const ws = wb.Sheets['Helpdesk Tracker'] || wb.Sheets[wb.SheetNames[0]];
  if (!ws) {
    throw new Error('SHEET_NOT_FOUND: Sheet "Helpdesk Tracker" not found in Excel workbook.');
  }

  const rawRows = xlsx.utils.sheet_to_json(ws, { defval: '', raw: false });
  console.log(`[HelpdeskSync] Read ${rawRows.length} raw rows from sheet`);

  // Map to Supabase public.helpdesk schema
  const cleanRows = [];
  for (const r of rawRows) {
    const rawSr = r['Sr no.'] !== undefined && r['Sr no.'] !== null ? String(r['Sr no.']).trim() : '';
    if (!rawSr || rawSr === 'Sr no.' || rawSr === 'undefined' || rawSr === 'null') continue;

    // Normalize sr_no (strip trailing decimals if any e.g. "5072.0" -> "5072")
    const sr_no = rawSr.split('.')[0];
    const statusVal = String(r['Status / WIP'] || r['Status'] || r['status'] || '').trim();

    cleanRows.push({
      sr_no,
      zone: String(r['Zone'] || '').trim(),
      site: String(r['Site'] || '').trim(),
      month: String(r['Month'] || '').trim(),
      location: String(r['Location'] || '').trim(),
      report_time: excelTimeToStr(r['Report Time']),
      date: excelDateToStr(r['Date']),
      employee_name: String(r['Employee Name'] || '').trim(),
      request_category: String(r['Request category'] || r['Category'] || '').trim(),
      description: String(r['Discription'] || r['Description'] || '').trim(),
      request_via: String(r['Request Via'] || '').trim(),
      date_close: excelDateToStr(r['Date close']),
      action_taken: String(r['Action taken'] || '').trim(),
      status: statusVal,
      status_wip: statusVal,
      resolved_time: excelTimeToStr(r['Resolved time']),
      call_type: String(r['Call type'] || '').trim(),
      request_from: String(r['Request from'] || '').trim(),
      defined_tat: String(r['Defined TAT (Hrs)'] || r['Defined TAT'] || '').trim(),
      remark: String(r['Remark'] || r['Remarks'] || '').trim(),
      closure_duration: String(r['Closure Duration'] || '').trim(),
      closure_time: String(r['Closure Time (Hrs)'] || r['Closure Time'] || '').trim(),
      tat_status: String(r['TAT Status'] || '').trim(),
      raw: {
        ...r,
        'Status / WIP': statusVal,
        'Status': statusVal,
        'status': statusVal
      }
    });
  }

  console.log(`[HelpdeskSync] Filtered valid tickets with Sr no: ${cleanRows.length}`);

  // Fetch existing rows from Supabase public.helpdesk with range pagination
  console.log('[HelpdeskSync] Fetching existing rows from Supabase public.helpdesk...');
  const existingMap = new Map();
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data: pageData, error: pageErr } = await supabase
      .from('helpdesk')
      .select('id, sr_no, status, date_close, action_taken')
      .range(page * pageSize, (page + 1) * pageSize - 1);

    if (pageErr) {
      console.error('[HelpdeskSync] Error fetching page:', pageErr);
      throw pageErr;
    }
    if (!pageData || pageData.length === 0) break;
    for (const item of pageData) {
      if (item.sr_no) {
        existingMap.set(String(item.sr_no).trim(), item);
      }
    }
    if (pageData.length < pageSize) break;
    page++;
  }
  console.log(`[HelpdeskSync] Loaded ${existingMap.size} existing records from Supabase`);

  // Deduplicate clean rows by sr_no so duplicate Sr numbers don't oscillate
  const excelMap = new Map();
  for (const r of cleanRows) {
    excelMap.set(r.sr_no, r);
  }

  console.log(`[HelpdeskSync] Unique tickets from Excel: ${excelMap.size}`);

  let updatedCount = 0;
  let newCount = 0;
  let unchangedCount = 0;
  const changedList = [];

  for (const row of excelMap.values()) {
    const ex = existingMap.get(row.sr_no);
    if (ex) {
      // Check if status changed
      const currentDbStatus = String(ex.status || '').trim();
      const newStatus = String(row.status || '').trim();
      const isStatusChanged = currentDbStatus.toLowerCase() !== newStatus.toLowerCase();

      if (isStatusChanged) {
        changedList.push({
          sr_no: row.sr_no,
          oldStatus: currentDbStatus,
          newStatus: newStatus,
          payload: {
            status: row.status,
            status_wip: row.status_wip,
            action_taken: row.action_taken,
            date_close: row.date_close,
            resolved_time: row.resolved_time,
            raw: row.raw
          }
        });
      } else {
        unchangedCount++;
      }
    } else {
      // New row not present in DB
      newCount++;
      changedList.push({
        sr_no: row.sr_no,
        isNew: true,
        payload: row
      });
    }
  }

  console.log(`[HelpdeskSync] Detected ${changedList.length} changed/new rows (${unchangedCount} unchanged)`);

  // Apply updates in Supabase
  for (const item of changedList) {
    if (item.isNew) {
      const { error: insErr } = await supabase.from('helpdesk').insert(item.payload);
      if (insErr) {
        console.warn(`[HelpdeskSync] Insert failed for Sr ${item.sr_no}:`, insErr.message);
      }
    } else {
      const { error: updErr } = await supabase
        .from('helpdesk')
        .update(item.payload)
        .eq('sr_no', item.sr_no);

      if (updErr) {
        console.warn(`[HelpdeskSync] Update failed for Sr ${item.sr_no}:`, updErr.message);
      } else {
        updatedCount++;
        console.log(`[HelpdeskSync] Updated Sr ${item.sr_no}: "${item.oldStatus}" -> "${item.newStatus}"`);
      }
    }
  }

  const durationMs = Date.now() - startTime;
  const syncTimestamp = new Date().toISOString();

  // Update tracker_configs in Supabase
  try {
    const { error: cfgErr } = await supabase
      .from('tracker_configs')
      .update({
        last_sync_status: 'success',
        last_sync_error: null,
        last_synced_at: syncTimestamp,
        total_rows: cleanRows.length,
        updated_at: syncTimestamp
      })
      .eq('id', 'helpdesk_tracker');

    if (cfgErr) console.warn('[HelpdeskSync] Could not update tracker_configs:', cfgErr.message);
  } catch (ce) {
    console.warn('[HelpdeskSync] Config update error:', ce.message);
  }

  // Update tracker_sheets in Supabase
  try {
    await supabase.from('tracker_sheets').upsert({
      id: 'helpdesk_tracker:Helpdesk Tracker',
      tracker_id: 'helpdesk_tracker',
      sheet_name: 'Helpdesk Tracker',
      column_order: Object.keys(cleanRows[0] || {}),
      row_count: cleanRows.length,
      last_synced_at: syncTimestamp
    });
  } catch (_se) {}

  // Log in tracker_sync_logs
  try {
    const logMsg = `Successfully synced Helpdesk: ${updatedCount} rows updated, ${newCount} new rows. Total records: ${cleanRows.length}.`;
    await supabase.from('tracker_sync_logs').insert({
      tracker_id: 'helpdesk_tracker',
      status: 'success',
      duration_ms: durationMs,
      message: logMsg,
      sheets_synced: [{ sheet_name: 'Helpdesk Tracker', rows_count: cleanRows.length }]
    });
  } catch (le) {
    console.warn('[HelpdeskSync] Log insert error:', le.message);
  }

  console.log(`[HelpdeskSync] COMPLETED in ${durationMs}ms. Updated: ${updatedCount}, New: ${newCount}, Unchanged: ${unchangedCount}`);

  return {
    success: true,
    fileId,
    fileName,
    fileWebUrl,
    filePath,
    fileLastModified: fileStat.mtime.toISOString(),
    lastSyncedAt: syncTimestamp,
    updatedCount,
    newCount,
    unchangedCount,
    totalValidRows: cleanRows.length,
    durationMs,
    changedList: changedList.map(c => ({ sr_no: c.sr_no, oldStatus: c.oldStatus, newStatus: c.newStatus }))
  };
}

module.exports = {
  syncHelpdeskFromExcel,
  resolveHelpdeskFilePath,
  extractHelpdeskFileIdAndUrl
};
