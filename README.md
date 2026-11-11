# 🏢 CBRE Facility Operations Dashboard
### Tableau-Style Live Web App with OneDrive & SharePoint Auto-Sync
**Downtown-3 & Downtown-4 Facilities • Live Operations & Analytics**

---

## 🌟 Overview

This web application provides a **public, shareable, live Tableau-style facility operations dashboard** backed by two daily-updated Excel trackers stored in Microsoft OneDrive / SharePoint Online.

### Key Capabilities:
- **No Login Required for Viewers**: Anyone with your public web link can open and explore the full dashboard, interactive filters, KPI metrics, charts, and data tables.
- **Admin Control**: Secure login for facility managers to update OneDrive URLs, trigger manual syncs, and adjust sync intervals.
- **OneDrive Live Sync**:
  - Automatically fetches files using direct SharePoint download URL conversion and Microsoft Graph sharing tokens.
  - Multi-sheet support: Ingests all sheets into Supabase Postgres while preserving **every sheet name, column name, and original column order**.
  - Auto-updates without manual page refresh via Supabase Realtime and periodic background polling.
  - "Last Synced: X min ago" with pulsing green live status indicator.
- **Access Revocation Fault-Tolerance**: If File 2 (Helpdesk Tracker, shared with you) access is ever revoked by the owner, a prominent warning is shown (`File 2 Access Revoked - Contact Owner`), while **File 1 (Event Tracker, owned by you) continues operating without interruption**.
- **NEW: Manual Excel Upload / Override Sync**:
  - Prominent **"Upload Excel to Update Dashboard"** button on Dashboard Header & Settings Modal.
  - Admin-only protection (requires password `admin123`).
  - Drag-and-drop or file browser supporting multi-sheet `.xlsx` and `.xls` files up to 10MB.
  - Tracker target selector: upload either **Helpdesk Tracker** or **Event Tracker** independently.
  - Overwrites only the selected tracker; leaves the other tracker completely untouched.
  - **Highest Sync Priority**: Pauses OneDrive auto-sync for that tracker for 30 minutes to protect your manual updates.
  - Column validation with mismatch warnings and "Upload Anyway" capability.
  - **Download Current Excel Template** button to download exact formats.
  - Header status updates to `"Last Updated: Manual Upload - Today, [Time] by Admin"`.
  - Full upload history logging (Date, File Name, Target Tracker, Rows, Uploaded By) displayed in Settings.
- **Tableau-Style Interactive Features**:
  - Top Filter Shelf: Cross-filter by Date Range, Site, Category, Status, TAT Priority, Assigned Staff, and Tracker Scope.
  - 7 KPI Cards: Total Tickets, Open, WIP, Closed, Overdue, Today's Events, and Total Events.
  - 6 Recharts Charts: Site-wise tickets, Category distribution, 30-Day trend, Status breakdown, Technician workload, and Event operations.
  - Multi-sheet interactive table with search, sorting, column visibility toggle, and pagination.
  - **SheetJS Export**: 1-click export to Excel in the exact original format with applied filters preserved.

---

## 🚀 Quick Start (Local Run)

The application includes pre-bundled seed data from both CBRE trackers, so you can launch and test it immediately without configuring Supabase first!

```bash
# 1. Install dependencies
npm install

# 2. Start local development server
npm run dev
```

Visit **`http://localhost:3000`** in your browser.

---

## 📋 Step-by-Step Setup Guide

Follow these 6 steps to connect your own Supabase database, deploy the Edge Function for 5-minute auto-sync, and deploy to Vercel:

---

### Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and click **"New Project"**.
2. Give your project a name (e.g., `cbre-facility-dashboard`).
3. Set a strong database password and select a region close to your users (e.g., `ap-south-1` Mumbai or `ap-southeast-1` Singapore).
4. Once the project is created, navigate to **Project Settings** (gear icon) -> **API**:
   - Copy the **Project URL** (`https://<project-ref>.supabase.co`)
   - Copy the **`anon` `public` key**
   - Copy the **`service_role` `secret` key** (keep this confidential)

---

### Step 2: Run `supabase.sql`

1. In your Supabase Dashboard, click on **SQL Editor** in the left sidebar.
2. Click **"New Query"**.
3. Open the file `supabase.sql` from this repository, copy its entire contents, and paste it into the query window.
4. Click **Run**.
5. This creates:
   - `tracker_configs`: Stores OneDrive links and sync states.
   - `tracker_sync_logs`: Tracks sync history and errors.
   - `tracker_sheets`: Metadata for all sheets and original column ordering.
   - `tracker_rows`: Dynamic JSONB storage for every row without losing columns.
   - `helpdesk_tickets` & `event_operations`: High-speed structured tables.
   - Row-Level Security (RLS) policies allowing public read and authenticated admin edit.
   - Supabase Realtime publication.

---

### Step 3: Set `.env` Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
3. Your OneDrive URLs are already pre-configured:
   - **File 1 (Event Tracker)**:
     `https://cbre-my.sharepoint.com/:x:/r/personal/satyabrata_mohanty1_cbre_com/Documents/Desktop/Trackers/Event/Yearly%20Event%20Tracker-%20DT-3%20and%20DT-4%20Updated.xlsx?d=w127269eeb7804048a6df5674c2479aaf&csf=1&web=1&e=pByDSJ`
   - **File 2 (Helpdesk Tracker)**:
     `https://cbre-my.sharepoint.com/:x:/r/personal/alwajid_ansari_cbre_com/Documents/Attachments/HELP%20DESK%20TRACKER%20FY%2025-26%20-%20Master.xlsx?d=w5dc43c3ec1674b61b95cbfbe614ffbc5&csf=1&web=1&e=3aSaZb`

---

### Step 4: Deploy the Supabase Edge Function

The Edge Function (`supabase/functions/sync-onedrive/index.ts`) fetches the Excel files from OneDrive, parses them via SheetJS, and ingests them into Postgres.

1. Install the Supabase CLI (if not already installed):
   ```bash
   # Windows PowerShell (via Scoop or npm)
   npm install -g supabase
   ```
2. Log in and link your project:
   ```bash
   supabase login
   supabase link --project-ref your-project-ref
   ```
3. Deploy the Edge Function:
   ```bash
   supabase functions deploy sync-onedrive --no-verify-jwt
   ```
4. Set function secrets in Supabase (Dashboard -> Edge Functions -> Secrets):
   - `SUPABASE_URL`: Your project URL
   - `SUPABASE_SERVICE_ROLE_KEY`: Your service role key
5. Enable the 5-Minute Cron Trigger:
   In Supabase **SQL Editor**, run:
   ```sql
   SELECT cron.schedule(
       'sync-onedrive-every-5-min',
       '*/5 * * * *',
       $$
       SELECT net.http_post(
           url := 'https://<your-project-ref>.functions.supabase.co/sync-onedrive',
           headers := '{"Content-Type": "application/json", "Authorization": "Bearer <YOUR_SERVICE_ROLE_KEY>"}'::jsonb,
           body := '{"source": "pg_cron"}'::jsonb
       ) AS request_id;
       $$
   );
   ```

---

### Step 5: How to Manage OneDrive Links in the UI

You can update your OneDrive share links anytime directly from the web app without redeploying:

1. Click **"Admin Login"** in the top right header.
2. Enter your Supabase user credentials (or demo password `admin123`).
3. Under **OneDrive / SharePoint Share Links**:
   - Paste the new sharing URL for File 1 or File 2.
   - Click **"Save Tracker Links"**.
4. Click **"Trigger Sync Now"** to immediately refresh all data.
5. You can also drag-and-drop or upload `.xlsx` files directly from this modal for instant offline testing!

---

### Step 6: Deploy to Vercel (or Netlify)

1. Push your code to GitHub / GitLab:
   ```bash
   git init
   git add .
   git commit -m "Facility Management Tableau Dashboard"
   git remote add origin https://github.com/<your-username>/facility-dashboard.git
   git push -u origin main
   ```
2. Go to [https://vercel.com](https://vercel.com) and click **"Add New Project"**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_EVENT_TRACKER_URL`
   - `VITE_HELPDESK_TRACKER_URL`
   - `VITE_SYNC_INTERVAL_MINUTES=5`
5. Click **Deploy**.
6. Vercel will give you a public URL (e.g. `https://facility-dashboard.vercel.app`).
7. Share this URL with your team—anyone with the link can view live analytics without logging in!

---

## 📊 Dashboard Views & Architecture

### 1. Header (`Header.jsx`)
- Professional CBRE `#1F4E79` navy bar.
- Pulsing green indicator showing live sync or manual upload status (`Last Updated: Manual Upload - Today, 12:30 PM by Admin`).
- **Prominent Button**: `"Upload Excel to Update Dashboard"`
- **Share** button: copies link to clipboard with toast notification.
- **Sync Now** button: triggers on-demand data refresh from OneDrive.
- **Admin Panel** button: opens secure settings.

### 2. Manual Excel Upload & Override Sync (`ManualUploadModal.jsx`)
- **Admin Password Gate**: Enter `admin123` to authorize upload.
- **Target Tracker Selection**: Dropdown to choose between `Helpdesk Tracker` or `Event Tracker`.
- **Drag & Drop / File Browser**: Supports multi-sheet `.xlsx` and `.xls` files up to 10MB with progress feedback.
- **Multi-Sheet Preview**: Displays total rows, sheets detected, and row breakdown before confirming.
- **Column Validation**: Compares uploaded sheet headers against expected tracker columns and warns if columns are missing while still offering an `"Upload Anyway"` option.
- **Sync Priority & 30-Minute Hold**: Overwrites only the selected tracker while leaving the other tracker untouched. Automatically holds OneDrive auto-sync for 30 minutes to prevent overwriting manual data.
- **Template Download**: Dedicated button to download clean `.xlsx` templates with original headers.
- **Upload History**: Logs date, file name, rows, and uploader in Settings.

### 3. Tableau Filter Shelf (`FilterBar.jsx`)
- **Date Range**: Presets (Today, Last 7 Days, Last 30 Days, This Month, Last 90 Days) + Custom Start/End picker.
- **Site**: DT3, DT4 L1, DT4 L4, DT4 L5, DT4 L6, Downtown-3, Downtown-4.
- **Category**: Housekeeping, E&M, HVAC, Locker Issue, F&B, Event, Team Meeting, etc.
- **Status**: Resolved, WIP, Not Resolved, Confirmed, Pending, Canceled.
- **TAT / Call Type**: Within TAT, Beyond TAT (Overdue), Proactive, Reactive.
- **Assigned To / Requester**: Filter by technician or booking manager.
- **Tracker Scope**: All Trackers, Helpdesk Only, Events Only.
- **Instant Reactivity**: Every filter updates all KPI cards, Recharts, and data tables immediately.

### 3. KPI Cards (`KpiCards.jsx`)
- Total Tickets (with % resolution rate)
- Open / Unassigned Tickets
- In-Progress (WIP) Tickets
- Closed / Resolved Tickets
- Overdue / Beyond TAT Tickets
- Today's Events
- Total Events (with aggregate Pax capacity)

### 4. Interactive Charts (`ChartsSection.jsx`)
- **Bar Chart**: Site-wise Ticket Volume
- **Pie Chart**: Category-wise Ticket Distribution
- **Area Chart**: 30-Day Daily Ticket & Resolution Velocity
- **Donut Chart**: Status-wise Breakdown
- **Horizontal Bar Chart**: Technician / Assigned Workload
- **Bar Chart**: Event Operations Distribution (Downtown-3 vs Downtown-4)

### 5. Multi-Sheet Tracker Tables (`TrackerTableView.jsx`)
- Multi-sheet tab navigation (`Helpdesk Tracker`, `Archive`, `Master_Event_Tracker`, etc.).
- Global search bar filtering across all columns.
- Clickable column sorting (ascending / descending).
- Column visibility selector (toggle any of the 23+ columns on/off).
- Pagination with 15, 25, 50, 100 rows per page.
- **Export to Excel**: SheetJS-powered download preserving original sheet names, column names, and column orders while respecting all active filters.

---

## 🔒 Security & Access Matrix

| Role | Access Level | Capabilities |
| :--- | :--- | :--- |
| **Viewer** (Anyone with link) | Public Read-Only | View dashboard, filter data, search tables, export to Excel. No login required. |
| **Admin** (Facility Manager) | Authenticated | Access settings, change OneDrive URLs, trigger cloud sync, upload files. |

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS 3
- **Data Visualizations**: Recharts
- **Excel Engine**: SheetJS (`xlsx`)
- **Icons**: Lucide React
- **Backend & Storage**: Supabase (PostgreSQL, Edge Functions, pg_cron, Row-Level Security)
- **Deployment**: Vercel / Netlify / Supabase Hosting
