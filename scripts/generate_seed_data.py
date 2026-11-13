import openpyxl
import datetime
import json
import os
import re

MONTH_MAP = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
    'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12'
}

def is_valid_iso_date(s):
    if not s or not isinstance(s, str):
        return False
    return bool(re.match(r'^\d{4}-\d{2}-\d{2}$', s.strip()))

def parse_date(d):
    if d is None:
        return None
    if isinstance(d, (datetime.datetime, datetime.date)):
        return d.strftime('%Y-%m-%d')
    if isinstance(d, (int, float)):
        try:
            dt = datetime.datetime(1899, 12, 30) + datetime.timedelta(days=float(d))
            return dt.strftime('%Y-%m-%d')
        except:
            pass
    s = str(d).strip()
    for fmt in ('%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%d-%m-%Y', '%d/%m/%Y', '%m/%d/%Y', '%d-%b-%Y', '%b-%y'):
        try:
            return datetime.datetime.strptime(s, fmt).strftime('%Y-%m-%d')
        except:
            pass
    return s

def parse_time(t):
    if t is None:
        return None
    if isinstance(t, datetime.time):
        return t.strftime('%H:%M')
    if isinstance(t, datetime.datetime):
        return t.strftime('%H:%M')
    return str(t).strip()

print("Loading Helpdesk Excel...")
wb_hd = openpyxl.load_workbook('HELP DESK TRACKER FY 25-26 - Master.xlsx', read_only=True, data_only=True)
ws_hd = wb_hd['Helpdesk Tracker']
hd_headers = []
hd_rows = []

for i, row in enumerate(ws_hd.iter_rows(values_only=True)):
    if i == 0:
        hd_headers = [str(c).strip() if c is not None else f'Col_{idx}' for idx, c in enumerate(row)]
        while hd_headers and hd_headers[-1] in ('', 'Col_' + str(len(hd_headers)-1)):
            hd_headers.pop()
    else:
        if row[0] is not None or row[1] is not None or (len(row) > 7 and row[7] is not None):
            r_dict = {}
            for idx, h in enumerate(hd_headers):
                val = row[idx] if idx < len(row) else None
                if h in ('Date', 'Month', 'Date close'):
                    r_dict[h] = parse_date(val)
                elif h in ('Report Time', 'Resolved time'):
                    r_dict[h] = parse_time(val)
                else:
                    if isinstance(val, (datetime.datetime, datetime.date)):
                        r_dict[h] = val.strftime('%Y-%m-%d')
                    elif isinstance(val, datetime.time):
                        r_dict[h] = val.strftime('%H:%M')
                    elif val is not None:
                        if isinstance(val, float) and val.is_integer():
                            r_dict[h] = int(val)
                        else:
                            r_dict[h] = val
                    else:
                        r_dict[h] = None
            
            if not is_valid_iso_date(r_dict.get('Date')) and is_valid_iso_date(r_dict.get('Month')):
                r_dict['Date'] = r_dict['Month']

            hd_rows.append(r_dict)

print(f"Extracted {len(hd_rows)} Helpdesk Tracker rows.")

# Extract Archive sheet
ws_arch = wb_hd['Helpdesk - 2025 (Archive)']
arch_headers = []
arch_rows = []
for i, row in enumerate(ws_arch.iter_rows(values_only=True)):
    if i == 0:
        arch_headers = [str(c).strip() if c is not None else f'Col_{idx}' for idx, c in enumerate(row)]
        while arch_headers and arch_headers[-1] in ('', 'Col_' + str(len(arch_headers)-1)):
            arch_headers.pop()
    else:
        if any(c is not None for c in row):
            r_dict = {}
            for idx, h in enumerate(arch_headers):
                val = row[idx] if idx < len(row) else None
                if h in ('Date', 'Month', 'Date close'):
                    r_dict[h] = parse_date(val)
                elif h in ('Report Time', 'Resolved time'):
                    r_dict[h] = parse_time(val)
                else:
                    if isinstance(val, (datetime.datetime, datetime.date)):
                        r_dict[h] = val.strftime('%Y-%m-%d')
                    elif isinstance(val, datetime.time):
                        r_dict[h] = val.strftime('%H:%M')
                    elif val is not None:
                        r_dict[h] = int(val) if isinstance(val, float) and val.is_integer() else val
                    else:
                        r_dict[h] = None
            if not is_valid_iso_date(r_dict.get('Date')) and is_valid_iso_date(r_dict.get('Month')):
                r_dict['Date'] = r_dict['Month']
            arch_rows.append(r_dict)

wb_hd.close()
print(f"Extracted {len(arch_rows)} Helpdesk Archive rows.")

print("Loading Event Excel...")
wb_ev = openpyxl.load_workbook('Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx', read_only=True, data_only=True)
ws_ev = wb_ev['Master_Event_Tracker_2026']

ev_rows_raw = list(ws_ev.iter_rows(values_only=True))
ev_headers = [str(c).strip() if c is not None else f'Col_{idx}' for idx, c in enumerate(ev_rows_raw[1])]
while ev_headers and ev_headers[-1] in ('', 'Col_' + str(len(ev_headers)-1)):
    ev_headers.pop()

ev_rows = []
for row in ev_rows_raw[2:]:
    if row and row[0] and str(row[0]).strip().startswith('EVT-'):
        r_dict = {}
        for idx, h in enumerate(ev_headers):
            val = row[idx] if idx < len(row) else None
            if h in ('Event Date', 'Booking Date'):
                r_dict[h] = parse_date(val)
            elif h in ('Start Time', 'End Time'):
                r_dict[h] = parse_time(val)
            else:
                if isinstance(val, (datetime.datetime, datetime.date)):
                    r_dict[h] = val.strftime('%Y-%m-%d')
                elif isinstance(val, datetime.time):
                    r_dict[h] = val.strftime('%H:%M')
                elif val is not None:
                    r_dict[h] = int(val) if isinstance(val, float) and val.is_integer() else val
                else:
                    r_dict[h] = None

        # Ensure valid ISO date format for Event Date
        if not is_valid_iso_date(r_dict.get('Event Date')):
            yr = r_dict.get('Year') or 2026
            mo = str(r_dict.get('Month') or 'Jan').strip().lower()[:3]
            mo_num = MONTH_MAP.get(mo, '01')
            r_dict['Event Date'] = f"{yr}-{mo_num}-15"

        ev_rows.append(r_dict)

wb_ev.close()
print(f"Extracted {len(ev_rows)} Master Event rows.")

data = {
    "helpdesk": {
        "sheet_name": "Helpdesk Tracker",
        "headers": hd_headers,
        "rows": hd_rows
    },
    "helpdesk_archive": {
        "sheet_name": "Helpdesk - 2025 (Archive)",
        "headers": arch_headers,
        "rows": arch_rows
    },
    "events": {
        "sheet_name": "Master_Event_Tracker_2026",
        "headers": ev_headers,
        "rows": ev_rows
    },
    "meta": {
        "helpdesk_total": len(hd_rows),
        "archive_total": len(arch_rows),
        "event_total": len(ev_rows),
        "extracted_at": datetime.datetime.now().isoformat()
    }
}

out_path = 'src/data/seedData.json'
os.makedirs('src/data', exist_ok=True)
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(data, f)

print(f"Wrote seedData.json successfully! File size: {os.path.getsize(out_path) / 1024:.1f} KB")
