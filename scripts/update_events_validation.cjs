const XLSX = require('xlsx');
const fs = require('fs');

console.log('Loading Excel workbook...');
const wb = XLSX.readFile('Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx');

function excelDateToIso(val) {
  if (typeof val === 'number') {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(epoch.getTime() + val * 86400000);
    return d.toISOString().slice(0, 10);
  }
  if (!val) return '';
  const s = String(val).trim();
  return s;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function computeWeekday(isoDateStr, excelDay) {
  if (excelDay && typeof excelDay === 'string') {
    const t = excelDay.trim();
    const match = DAYS.find(d => d.toLowerCase() === t.slice(0, 3).toLowerCase());
    if (match) return match;
  }
  if (!isoDateStr) return '';
  const d = new Date(isoDateStr);
  if (isNaN(d.getTime())) return '';
  return DAYS[d.getDay()];
}

function parseSheet(sheetName, bldDefault) {
  const ws = wb.Sheets[sheetName];
  if (!ws) {
    console.warn(`Sheet ${sheetName} not found!`);
    return [];
  }
  const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }).slice(2);
  return json.map((r, idx) => {
    const evtId = String(r[0] || '').trim();
    const dateRaw = r[1];
    const dateIso = excelDateToIso(dateRaw);
    const excelDay = String(r[2] || '').trim();
    const day = computeWeekday(dateIso, excelDay);
    const loc = String(r[3] || '').trim();
    const floor = String(r[4] || '').trim();
    const title = String(r[5] || '').trim();
    const rawPax = r[6];
    let pax = null;
    if (rawPax !== '' && rawPax !== null && rawPax !== undefined && !isNaN(Number(rawPax))) {
      pax = Number(rawPax);
    }
    const scale = String(r[7] || '').trim();
    const startTime = r[8] || '';
    const endTime = r[9] || '';
    const fb = r[10] || '';
    const logistic = r[11] || '';
    const bookedBy = String(r[12] || '').trim();
    const requesterEmail = String(r[13] || '').trim();

    return {
      'Event ID': evtId,
      'Year': 2026,
      'Month': 'Nov',
      'Event Date': dateIso,
      'Day': day,
      'Building': bldDefault,
      'Floor': floor,
      'Location': loc,
      'Event Title / Purpose': title,
      'Category': title || '',
      'Capacity / Pax': pax,
      'Event Scale': scale || (pax >= 100 ? 'Big Event' : 'Small Event'),
      'Start Time': startTime,
      'End Time': endTime,
      'F&B Support': fb,
      'Logistic Support': logistic,
      'Booked By': bookedBy,
      'Requester Email': requesterEmail,
      'Calendar Booking Status': 'Confirmed (Done)',
      'Feedback Form': 'Not Required',
      'Booking Date': dateIso,
      'sheet': sheetName,
      'excelRow': idx + 3
    };
  });
}

console.log('Parsing DT-4 Nov26 and DT-3 Nov26...');
const dt4NovRows = parseSheet('DT-4 Nov26', 'Downtown-4');
const dt3NovRows = parseSheet('DT-3 Nov26', 'Downtown-3');

console.log(`DT-4 Nov26: ${dt4NovRows.length} rows`);
console.log(`DT-3 Nov26: ${dt3NovRows.length} rows`);

// Check Row 43 in DT-4 Nov26
const row43 = dt4NovRows.find(r => r.excelRow === 43);
console.log('Row 43 in DT-4 Nov26:', row43);

// Check Row 44 in DT-4 Nov26
const row44 = dt4NovRows.find(r => r.excelRow === 44);
console.log('Row 44 in DT-4 Nov26:', row44);

// Load existing seedData.json
const seed = JSON.parse(fs.readFileSync('src/data/seedData.json', 'utf8'));
const existingRows = seed.events.rows;
console.log(`Existing event rows in seedData: ${existingRows.length}`);

// Fix day in all non-Nov rows so weekday matches calendar
const updatedNonNovRows = existingRows
  .filter(r => (r['Month'] || '').toLowerCase() !== 'nov' && !String(r['Event Date'] || '').includes('2026-11'))
  .map(r => {
    const dStr = r['Event Date'] || r['Booking Date'];
    const correctedDay = computeWeekday(dStr, r['Day']);
    return {
      ...r,
      'Day': correctedDay || r['Day']
    };
  });

console.log(`Non-Nov rows retained: ${updatedNonNovRows.length}`);

// Combine non-Nov rows with the real Nov rows from DT-3 and DT-4 Nov26
const combinedEventRows = [
  ...updatedNonNovRows,
  ...dt3NovRows,
  ...dt4NovRows
];

console.log(`New total event rows in seedData: ${combinedEventRows.length}`);

// Verify classification
let valid = 0, placeholder = 0, blank = 0, incomplete = 0;
let novValid = 0, novPlaceholder = 0, novBlank = 0, novIncomplete = 0;
let nov8Valid = 0, nov8Placeholder = 0;
let nov9Valid = 0;

combinedEventRows.forEach(r => {
  const isNov = (r['Month'] || '').toLowerCase() === 'nov' || String(r['Event Date'] || '').includes('2026-11');
  const evtId = String(r['Event ID'] || '').trim();
  const dateStr = r['Event Date'] || r['Booking Date'];
  const loc = String(r['Location'] || '').trim();
  const floor = String(r['Floor'] || '').trim();
  const title = String(r['Event Title / Purpose'] || '').trim();
  const cat = String(r['Category'] || '').trim();

  const isAllBlank = !evtId && !dateStr && !loc && !floor && !title && !cat;
  const hasEvt = evtId.length > 0 && evtId.startsWith('EVT-');
  const hasDate = !!dateStr && !isNaN(new Date(dateStr).getTime());
  const hasLoc = loc.length > 0 || floor.length > 0;
  const hasTitle = title.length > 0 || cat.length > 0;

  const isValid = hasEvt && hasDate && hasLoc && hasTitle;
  const isPlaceholder = !hasEvt && hasDate;
  const isIncomplete = hasEvt && (!hasLoc || !hasTitle);

  if (isValid) valid++;
  else if (isPlaceholder) placeholder++;
  else if (isIncomplete) incomplete++;
  else blank++;

  if (isNov) {
    if (isValid) novValid++;
    else if (isPlaceholder) novPlaceholder++;
    else if (isIncomplete) novIncomplete++;
    else novBlank++;

    if (String(dateStr).includes('2026-11-08')) {
      if (isValid) nov8Valid++;
      if (isPlaceholder) nov8Placeholder++;
    }
    if (String(dateStr).includes('2026-11-09')) {
      if (isValid) nov9Valid++;
    }
  }
});

console.log('Global Stats:', { total: combinedEventRows.length, valid, placeholder, blank, incomplete });
console.log('Nov Stats:', { total: dt3NovRows.length + dt4NovRows.length, novValid, novPlaceholder, novBlank, novIncomplete });
console.log('Nov 8 (Sunday):', { nov8Valid, nov8Placeholder });
console.log('Nov 9 (Monday):', { nov9Valid });

// Write to seedData.json
seed.events.rows = combinedEventRows;
fs.writeFileSync('src/data/seedData.json', JSON.stringify(seed, null, 2), 'utf8');
console.log('Successfully written updated seedData.json!');
