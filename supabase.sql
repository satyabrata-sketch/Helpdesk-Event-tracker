-- ==============================================================================
-- FACILITY MANAGEMENT TABLEAU DASHBOARD - SUPABASE SQL SCHEMA
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (Dashboard -> SQL Editor -> New Query -> Run)

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "pg_net";

-- ------------------------------------------------------------------------------
-- 1. TRACKER CONFIGURATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracker_configs (
    id TEXT PRIMARY KEY,                       -- 'event_tracker' or 'helpdesk_tracker'
    name TEXT NOT NULL,                        -- Human readable name
    share_url TEXT NOT NULL,                   -- OneDrive / SharePoint share link
    is_owned BOOLEAN DEFAULT true,             -- true for File 1, false for File 2
    owner_info TEXT,                           -- e.g. 'satyabrata_mohanty1@cbre.com' or 'alwajid_ansari@cbre.com'
    last_sync_status TEXT DEFAULT 'pending',   -- 'success', 'error', 'access_revoked', 'pending'
    last_sync_error TEXT,                      -- Detailed error message if failed
    last_synced_at TIMESTAMPTZ,                -- Timestamp of last successful sync
    total_rows INT DEFAULT 0,
    sheet_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default configs with user's OneDrive links
INSERT INTO public.tracker_configs (id, name, share_url, is_owned, owner_info, last_sync_status)
VALUES 
(
    'event_tracker',
    'Yearly Event Tracker (DT-3 & DT-4)',
    'https://cbre-my.sharepoint.com/:x:/r/personal/satyabrata_mohanty1_cbre_com/Documents/Desktop/Trackers/Event/Yearly%20Event%20Tracker-%20DT-3%20and%20DT-4%20Updated.xlsx?d=w127269eeb7804048a6df5674c2479aaf&csf=1&web=1&e=pByDSJ',
    true,
    'satyabrata_mohanty1@cbre.com (Self Owned)',
    'pending'
),
(
    'helpdesk_tracker',
    'HELP DESK TRACKER FY 25-26 - Master.xlsx',
    'https://cbre-my.sharepoint.com/:x:/r/personal/satyabrata_mohanty1_cbre_com/Documents/Desktop/Trackers/HELP%20DESK%20TRACKER%20FY%2025-26%20-%20Master.xlsx?d=w9923cb7e81249fa81f4a938c10fa2e4&csf=1&web=1&e=satyabrata',
    true,
    'satyabrata_mohanty1@cbre.com (Self Owned)',
    'success'
)
ON CONFLICT (id) DO UPDATE SET
    share_url = EXCLUDED.share_url,
    updated_at = NOW();

-- ------------------------------------------------------------------------------
-- 2. TRACKER SYNC LOGS & MANUAL UPLOAD HISTORY TABLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracker_sync_logs (
    id BIGSERIAL PRIMARY KEY,
    tracker_id TEXT REFERENCES public.tracker_configs(id) ON DELETE CASCADE,
    status TEXT NOT NULL,                     -- 'success', 'error', 'access_revoked'
    duration_ms INT,
    message TEXT,
    sheets_synced JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_logs_tracker_id ON public.tracker_sync_logs(tracker_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.tracker_sync_logs(created_at DESC);

-- Manual Excel Upload History
CREATE TABLE IF NOT EXISTS public.upload_history (
    id BIGSERIAL PRIMARY KEY,
    tracker_id TEXT NOT NULL,                  -- 'helpdesk' or 'event'
    file_name TEXT NOT NULL,
    file_size INT,
    sheet_count INT DEFAULT 1,
    total_rows INT DEFAULT 0,
    uploaded_by TEXT DEFAULT 'Admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upload_history_tracker ON public.upload_history(tracker_id);
CREATE INDEX IF NOT EXISTS idx_upload_history_created_at ON public.upload_history(created_at DESC);

-- ------------------------------------------------------------------------------
-- 3. DYNAMIC MULTI-SHEET STORAGE TABLES
-- Preserves EVERY sheet and EVERY column exactly in original order without truncation
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tracker_sheets (
    id TEXT PRIMARY KEY,                      -- e.g. 'helpdesk_tracker:Helpdesk Tracker'
    tracker_id TEXT NOT NULL REFERENCES public.tracker_configs(id) ON DELETE CASCADE,
    sheet_name TEXT NOT NULL,
    column_order JSONB NOT NULL,              -- Array of exact column names in order
    column_metadata JSONB,                    -- Column stats & sample types
    row_count INT DEFAULT 0,
    last_synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tracker_rows (
    id BIGSERIAL PRIMARY KEY,
    tracker_id TEXT NOT NULL REFERENCES public.tracker_configs(id) ON DELETE CASCADE,
    sheet_name TEXT NOT NULL,
    row_index INT NOT NULL,
    data JSONB NOT NULL,                      -- Key-value matching exact Excel column names
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_tracker_sheet_row UNIQUE(tracker_id, sheet_name, row_index)
);

CREATE INDEX IF NOT EXISTS idx_tracker_rows_lookup ON public.tracker_rows(tracker_id, sheet_name);
CREATE INDEX IF NOT EXISTS idx_tracker_rows_data_gin ON public.tracker_rows USING gin (data);

-- ------------------------------------------------------------------------------
-- 4. STRUCTURED HELPDESK TICKETS TABLE (For high-speed KPI & Recharts querying)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.helpdesk_tickets (
    id BIGSERIAL PRIMARY KEY,
    sr_no TEXT,
    site TEXT,
    zone TEXT,
    location TEXT,
    month TEXT,
    ticket_date TIMESTAMPTZ,
    report_time TEXT,
    request_category TEXT,
    employee_name TEXT,
    request_via TEXT,
    description TEXT,
    action_taken TEXT,
    date_close TIMESTAMPTZ,
    resolved_time TEXT,
    status TEXT,                               -- 'Resolved', 'Work In Progress', 'Not Resolved'
    request_from TEXT,
    call_type TEXT,                            -- 'Proactive', 'Reactive'
    remark TEXT,
    defined_tat_hrs NUMERIC,
    closure_time_hrs NUMERIC,
    closure_duration TEXT,
    tat_status TEXT,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_helpdesk_site ON public.helpdesk_tickets(site);
CREATE INDEX IF NOT EXISTS idx_helpdesk_status ON public.helpdesk_tickets(status);
CREATE INDEX IF NOT EXISTS idx_helpdesk_category ON public.helpdesk_tickets(request_category);
CREATE INDEX IF NOT EXISTS idx_helpdesk_date ON public.helpdesk_tickets(ticket_date);

-- ------------------------------------------------------------------------------
-- 5. STRUCTURED EVENT OPERATIONS TABLE (For high-speed KPI & Recharts querying)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_operations (
    id BIGSERIAL PRIMARY KEY,
    event_id TEXT,
    year INT,
    month TEXT,
    event_date TIMESTAMPTZ,
    day TEXT,
    building TEXT,
    floor TEXT,
    location TEXT,
    title TEXT,
    category TEXT,
    capacity_pax INT DEFAULT 0,
    event_scale TEXT,                          -- 'Small Event', 'Medium Event', 'Large Event'
    start_time TEXT,
    end_time TEXT,
    fb_support TEXT,
    logistic_support TEXT,
    booked_by TEXT,
    requester_email TEXT,
    booking_status TEXT,                       -- 'Confirmed (Done)', 'Pending', 'Canceled'
    feedback_form TEXT,
    booking_date TIMESTAMPTZ,
    remarks TEXT,
    raw_data JSONB,
    synced_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_building ON public.event_operations(building);
CREATE INDEX IF NOT EXISTS idx_event_category ON public.event_operations(category);
CREATE INDEX IF NOT EXISTS idx_event_date ON public.event_operations(event_date);
CREATE INDEX IF NOT EXISTS idx_event_status ON public.event_operations(booking_status);

-- ------------------------------------------------------------------------------
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- Anyone with public link can VIEW (SELECT) without login
-- Only authenticated users (Supabase Auth Admin) or service_role can modify
-- ------------------------------------------------------------------------------

ALTER TABLE public.tracker_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.upload_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracker_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_operations ENABLE ROW LEVEL SECURITY;

-- Anonymous public read policies
CREATE POLICY "Public Read tracker_configs" ON public.tracker_configs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read tracker_sync_logs" ON public.tracker_sync_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read upload_history" ON public.upload_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read tracker_sheets" ON public.tracker_sheets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read tracker_rows" ON public.tracker_rows FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read helpdesk_tickets" ON public.helpdesk_tickets FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read event_operations" ON public.event_operations FOR SELECT TO anon, authenticated USING (true);

-- Authenticated Admin / Service Role write policies
CREATE POLICY "Admin Write tracker_configs" ON public.tracker_configs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write tracker_sync_logs" ON public.tracker_sync_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write upload_history" ON public.upload_history FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write tracker_sheets" ON public.tracker_sheets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write tracker_rows" ON public.tracker_rows FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write helpdesk_tickets" ON public.helpdesk_tickets FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Admin Write event_operations" ON public.event_operations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 7. SUPABASE REALTIME ENABLEMENT
-- Allows dashboard to automatically update on live sync without manual refresh
-- ------------------------------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracker_configs;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tracker_sheets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.helpdesk_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_operations;

-- ------------------------------------------------------------------------------
-- 8. PG_CRON SCHEDULE (Auto sync every 5 minutes)
-- Invokes the sync-onedrive Edge Function every 5 minutes
-- ------------------------------------------------------------------------------
-- NOTE: Replace YOUR_SUPABASE_PROJECT_REF and YOUR_ANON_OR_SERVICE_KEY below if setting up pg_cron:
/*
SELECT cron.schedule(
    'sync-onedrive-every-5-min',
    '* /5 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.functions.supabase.co/sync-onedrive',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
        body := '{"source": "pg_cron"}'::jsonb
    ) AS request_id;
    $$
);
*/
