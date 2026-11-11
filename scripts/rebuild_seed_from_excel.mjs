import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

console.log('Loading Excel workbook "Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx"...');
const wb = XLSX.readFile('Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx');

function excelDateToIso(val) {
  if (typeof val === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + val * 86400000);
    return d.toISOString().slice(0, 10);
  }
  if (!val) return '';
  const s = String(val).trim();
  // check if already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  return s;
}

function parsePax(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : Math.round(val);
  const s = String(val).trim();
  if (!s || s === '-' || s.toLowerCase() === 'na' || s.toLowerCase() === 'n/a') return null;
  // match first number
  const match = s.match(/\d+/);
  if (match) return parseInt(match[0], 10);
  return null;
}

function formatTime(v) {
  if (v == null || v === "" || v === "-") return "-";
  if (typeof v === "number") {
    if (v >= 0 && v < 1) {
      let totalMinutes = Math.round(v * 24 * 60);
      let h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
      let ampm = h >= 12 ? "PM" : "AM"; let h12 = h % 12; if (h12 === 0) h12 = 12;
      return String(h12).padStart(2,"0") + ":" + String(m).padStart(2,"0") + " " + ampm;
    }
    if (v > 1) return formatTime(v - Math.floor(v));
  }
  if (typeof v === "string") {
    v = v.trim();
    if (!v || v === "-") return "-";
    const mMatch = v.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
    if (mMatch) {
      let h = parseInt(mMatch[1], 10);
      let m = parseInt(mMatch[2], 10);
      let ap = mMatch[3] ? mMatch[3].toUpperCase() : (h >= 12 ? "PM" : "AM");
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return String(h12).padStart(2, "0") + ":" + String(m).padStart(2, "0") + " " + ap;
    }
    if (v.match(/^0\.\d+$/)) return formatTime(parseFloat(v));
    if (v.match(/^\d+(\.\d+)?$/)) return formatTime(parseFloat(v));
    return v;
  }
  return "-";
}

const allEvents = [];

const monthlySheets = wb.SheetNames.filter(n => {
  return (
    (n.startsWith('DT-3') || n.startsWith('DT-4')) &&
    !n.includes('25') &&
    (n.includes('26') || n.includes('27'))
  ) && !['Dashboard', 'Master_Event_Tracker_2026'].includes(n);
});

console.log(`Processing ${monthlySheets.length} monthly sheets...`);

monthlySheets.forEach(sheetName => {
  let building = 'Unknown';
  if (sheetName.includes('DT-3') || sheetName.includes('Downtown-3')) building = 'Downtown-3';
  else if (sheetName.includes('DT-4') || sheetName.includes('Downtown-4')) building = 'Downtown-4';

  let year = 2026;
  let monthAbbr = 'Jan';
  const mMatch = sheetName.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*['\s]*(\d{2})/i);
  if (mMatch) {
    const rawM = mMatch[1].slice(0, 3);
    monthAbbr = rawM[0].toUpperCase() + rawM.slice(1).toLowerCase();
    year = 2000 + parseInt(mMatch[2], 10);
  } else {
    const y24 = sheetName.match(/(\d{2})/);
    if (y24) year = 2000 + parseInt(y24[1], 10);
  }

  const ws = wb.Sheets[sheetName];
  if (!ws) return;
  const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
  if (data.length < 2) return;

  const rawHeaders = (data[1] || []).map(h => String(h || '').trim());

  const findCol = (namePatterns) => {
    return rawHeaders.findIndex(h => {
      const norm = String(h || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return namePatterns.some(p => norm.includes(p.toLowerCase().replace(/[^a-z0-9]/g, '')));
    });
  };

  const idIdx = findCol(['Event ID', 'EventID', 'ID']);
  const dateIdx = findCol(['Event Date', 'EventDate', 'Date']);
  const dayIdx = findCol(['Day', 'Weekday']);
  const locIdx = findCol(['Location', 'Venue']);
  const floorIdx = findCol(['Floor', 'Level']);
  const titleIdx = findCol(['Event Type / Title', 'Event Type', 'Title', 'Purpose']);
  const capIdx = findCol(['Capacity', 'Capacity / Pax', 'Pax']);
  const scaleIdx = findCol(['Event Scale', 'Scale']);
  const startIdx = findCol(['Start Time', 'Event Start Time']);
  const endIdx = findCol(['End Time', 'Event End Time']);
  const fbIdx = findCol(['F&B', 'F& B', 'FB']);
  const logIdx = findCol(['Logistic Support', 'Logistic']);
  const bookedByIdx = findCol(['Booked By', 'BookedBy']);
  const emailIdx = findCol(['Requester Email', 'Email']);
  const statusIdx = findCol(['Calendar Booking Status', 'Status']);
  const fbFormIdx = findCol(['Feedback Form', 'Feedback']);
  const bookDateIdx = findCol(['Booking Date']);
  const remarksIdx = findCol(['Remarks', 'Remark']);
  const takenByIdx = findCol(['Booking Taken By', 'Taken By']);

  for (let r = 2; r < data.length; r++) {
    const row = data[r];
    if (!row || !row.length) continue;

    const evtId = idIdx >= 0 && row[idIdx] !== undefined ? String(row[idIdx]).trim() : '';
    const rawDate = dateIdx >= 0 ? row[dateIdx] : '';
    const dateIso = excelDateToIso(rawDate);
    const day = dayIdx >= 0 && row[dayIdx] !== undefined ? String(row[dayIdx]).trim() : '';
    const loc = locIdx >= 0 && row[locIdx] !== undefined ? String(row[locIdx]).trim() : '';
    const floor = floorIdx >= 0 && row[floorIdx] !== undefined ? String(row[floorIdx]).trim() : '';
    const title = titleIdx >= 0 && row[titleIdx] !== undefined ? String(row[titleIdx]).trim() : '';
    const rawCap = capIdx >= 0 ? row[capIdx] : '';
    const pax = parsePax(rawCap);
    const scale = scaleIdx >= 0 && row[scaleIdx] !== undefined ? String(row[scaleIdx]).trim() : '';
    const startTime = startIdx >= 0 ? row[startIdx] : '';
    const endTime = endIdx >= 0 ? row[endIdx] : '';
    const fb = fbIdx >= 0 ? row[fbIdx] : '';
    const log = logIdx >= 0 ? row[logIdx] : '';
    const bookedBy = bookedByIdx >= 0 && row[bookedByIdx] !== undefined ? String(row[bookedByIdx]).trim() : '';
    const email = emailIdx >= 0 && row[emailIdx] !== undefined ? String(row[emailIdx]).trim() : '';
    const status = statusIdx >= 0 && row[statusIdx] !== undefined ? String(row[statusIdx]).trim() : '';
    const fbForm = fbFormIdx >= 0 && row[fbFormIdx] !== undefined ? String(row[fbFormIdx]).trim() : '';
    const bookingDate = bookDateIdx >= 0 ? excelDateToIso(row[bookDateIdx]) : '';
    const remarks = remarksIdx >= 0 && row[remarksIdx] !== undefined ? String(row[remarksIdx]).trim() : '';
    const takenBy = takenByIdx >= 0 && row[takenByIdx] !== undefined ? String(row[takenByIdx]).trim() : '';

    // If completely empty row, ignore
    if (!evtId && !rawDate && !loc && !title) continue;

    allEvents.push({
      'Event ID': evtId,
      'Year': year,
      'Month': monthAbbr,
      'MonthYear': `${monthAbbr}-${String(year).slice(2)}`,
      'Event Date': dateIso,
      'Day': day || '-',
      'Building': building,
      'Floor': floor || '-',
      'Location': loc || '-',
      'Event Title / Purpose': title || '-',
      'Category': title || '-',
      'Capacity / Pax': pax,
      'Raw Capacity': rawCap !== undefined && rawCap !== null ? String(rawCap) : '-',
      'Event Scale': (pax !== null && pax >= 100) ? 'Big Event' : 'Small Event',
      'Start Time': formatTime(startTime),
      'End Time': formatTime(endTime),
      'F&B Support': fb,
      'Logistic Support': log,
      'Booked By': bookedBy || '-',
      'Requester Email': email || '-',
      'Calendar Booking Status': status || 'Confirmed (Done)',
      'Feedback Form': fbForm || 'Not Required',
      'Booking Date': bookingDate,
      'Remarks': remarks,
      'Booking Taken By': takenBy,
      'sheet': sheetName,
      'excelRow': r + 1
    });
  }
});

console.log(`\nSuccessfully extracted ${allEvents.length} events from real monthly sheets.`);

// Validate DT-3 Jul26
const julDt3 = allEvents.filter(e => e.sheet === 'DT-3 Jul26');
const julDt3Valid = julDt3.filter(e => e['Event ID'].startsWith('EVT-') && e['Location'] !== '-' && e['Event Title / Purpose'] !== '-');
console.log('\n--- VALIDATION FOR DT-3 Jul26 ---');
console.log('Total sheet rows:', julDt3.length);
console.log('Valid rows (Event ID NOT blank + Location NOT blank + Title NOT blank):', julDt3Valid.length);
console.log('Unique Floors:', [...new Set(julDt3Valid.map(e => e.Floor))]);
console.log('Locations sample:', [...new Set(julDt3Valid.map(e => e.Location))].slice(0, 10));
console.log('Pax >= 100 rows in DT-3 Jul26:');
julDt3Valid.filter(e => e['Capacity / Pax'] >= 100).forEach(e => {
  console.log(`  ${e['Event ID']} | ${e['Event Date']} | ${e['Floor']} | ${e['Location']} | ${e['Event Title / Purpose']} | Pax: ${e['Capacity / Pax']}`);
});

// Validate DT-4 Nov26 Sunday 08-Nov-2026
const dt4Nov8 = allEvents.filter(e => e.sheet === 'DT-4 Nov26' && String(e['Event Date']).includes('2026-11-08'));
console.log('\n--- VALIDATION FOR DT-4 Nov26 Sunday 08-Nov-2026 ---');
console.log('Rows found:', dt4Nov8.length);
dt4Nov8.forEach(e => {
  console.log(`  ${e['Event ID'] || '[BLANK ID]'} | Date: ${e['Event Date']} | Day: ${e['Day']} | Loc: ${e['Location']} | Valid: ${Boolean(e['Event ID'] && e['Location'] !== '-')}`);
});

// Load existing seedData.json to keep helpdesk intact
const existingSeed = JSON.parse(fs.readFileSync('src/data/seedData.json', 'utf8'));
console.log(`\nExisting helpdesk rows count: ${existingSeed.helpdesk.rows.length} (UNCHANGED)`);

const newSeed = {
  ...existingSeed,
  events: {
    sheet_name: "Yearly Event Tracker- DT-3 and DT-4 Updated",
    headers: [
      "Event ID", "Year", "Month", "MonthYear", "Event Date", "Day",
      "Building", "Floor", "Location", "Event Title / Purpose", "Category",
      "Capacity / Pax", "Raw Capacity", "Event Scale", "Start Time", "End Time",
      "F&B Support", "Logistic Support", "Booked By", "Requester Email",
      "Calendar Booking Status", "Feedback Form", "Booking Date", "Remarks",
      "Booking Taken By", "sheet", "excelRow"
    ],
    rows: allEvents
  },
  meta: {
    ...existingSeed.meta,
    event_total: allEvents.length,
    valid_events_total: allEvents.filter(e => e['Event ID'].startsWith('EVT-') && e['Location'] !== '-' && e['Event Title / Purpose'] !== '-').length,
    extracted_from_monthly_sheets: true,
    last_rebuild: new Date().toISOString()
  }
};

fs.writeFileSync('src/data/seedData.json', JSON.stringify(newSeed, null, 2), 'utf8');
console.log('\nSUCCESSFULLY SAVED NEW seedData.json with 100% REAL Excel Monthly Data!');
