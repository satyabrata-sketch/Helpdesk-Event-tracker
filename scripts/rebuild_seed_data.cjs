const fs = require('fs');
const path = require('path');
const xlsx = require(path.resolve('./node_modules/xlsx'));

function parsePax(v) {
  if (v == null || v === '' || v === '-') return 0;
  if (typeof v === 'number') return isNaN(v) ? 0 : Math.round(v);
  const m = String(v).match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}

function getScale(pax) {
  const p = typeof pax === 'number' ? pax : parsePax(pax);
  return p >= 100 ? 'Big Event' : 'Small Event';
}

function formatTime(v) {
  if (v == null || v === '' || v === '-') return '-';
  if (typeof v === 'string') {
    const s = v.trim();
    if (!s || s === '-') return '-';
    if (/^\d{1,2}:\d{2}(\s*(AM|PM))?$/i.test(s)) return s.toUpperCase();
    const num = parseFloat(s);
    if (!isNaN(num) && String(num) === s) v = num;
    else return s;
  }
  if (typeof v === 'number') {
    let fraction = v;
    if (fraction > 1) fraction = fraction - Math.floor(fraction);
    if (fraction >= 0 && fraction < 1) {
      const totalMinutes = Math.round(fraction * 24 * 60);
      let h = Math.floor(totalMinutes / 60) % 24;
      const m = totalMinutes % 60;
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h === 0) h = 12;
      return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ' ' + ampm;
    }
  }
  return String(v);
}

function excelDateToStr(val) {
  if (!val) return '';
  if (val instanceof Date) {
    const y = val.getUTCFullYear();
    const m = String(val.getUTCMonth() + 1).padStart(2, '0');
    const d = String(val.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (typeof val === 'number') {
    const d = new Date(Date.UTC(1899, 11, 30 + Math.floor(val)));
    return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toISOString().slice(0, 10);
}

console.log('--- 1. Processing Master_Event_Tracker_2026 ---');
const eventBuf = fs.readFileSync('./Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx');
const wbEvent = xlsx.read(eventBuf, { type: 'buffer' });
const wsEvent = wbEvent.Sheets['Master_Event_Tracker_2026'];
const rawEvent = xlsx.utils.sheet_to_json(wsEvent, { header: 1 });
const eventHeaders = rawEvent[1].map(h => String(h || '').trim());

const events = [];
for (let i = 2; i < rawEvent.length; i++) {
  const r = rawEvent[i];
  if (!r) continue;
  const evtId = String(r[0] || '').trim();
  if (!evtId || evtId === '-' || evtId === 'None') continue;

  const rawPax = r[10];
  const pax = parsePax(rawPax);
  const eventDateStr = excelDateToStr(r[3]);
  const monthStr = String(r[2] || '').trim();

  events.push({
    'Event ID': evtId,
    Year: 2026,
    Month: monthStr,
    MonthYear: `${monthStr}-26`,
    'Event Date': eventDateStr,
    Day: String(r[4] || '').trim(),
    Building: String(r[5] || '').trim(),
    Floor: String(r[6] || '').trim(),
    Location: String(r[7] || '').trim(),
    'Event Title / Purpose': String(r[8] || '').trim(),
    Category: String(r[9] || '').trim(),
    'Capacity / Pax': pax,
    'Event Scale': getScale(pax),
    'Start Time': formatTime(r[12]),
    'End Time': formatTime(r[13]),
    'F&B Support': String(r[14] || '').trim(),
    'Logistic Support': String(r[15] || '').trim(),
    'Booked By': String(r[16] || '').trim(),
    'Requester Email': String(r[17] || '').trim(),
    'Calendar Booking Status': String(r[18] || '').trim(),
    'Feedback Form': String(r[19] || '').trim(),
    'Booking Date': excelDateToStr(r[20]),
    Remarks: String(r[21] || '').trim(),
    'Booking Taken By': String(r[22] || '').trim(),
    sheet: 'Master_Event_Tracker_2026',
    excelRow: i + 1
  });
}

console.log(`Processed ${events.length} valid events (Expected: 2093)`);

console.log('--- 2. Processing Helpdesk Tracker ---');
const helpBuf = fs.readFileSync('./HELP DESK TRACKER FY 25-26 - Master.xlsx');
const wbHelp = xlsx.read(helpBuf, { type: 'buffer' });
const wsHelp = wbHelp.Sheets['Helpdesk Tracker'];
const rawHelp = xlsx.utils.sheet_to_json(wsHelp, { header: 1 });
const helpHeaders = rawHelp[0].map(h => String(h || '').trim());

const helpdeskTickets = [];
for (let i = 1; i < rawHelp.length; i++) {
  const r = rawHelp[i];
  if (!r) continue;
  const obj = { excelRow: i + 1 };
  let hasAnyData = false;
  helpHeaders.forEach((h, colIdx) => {
    let val = r[colIdx];
    if (val !== undefined && val !== null && String(val).trim() !== '') {
      hasAnyData = true;
    }
    if (h.toLowerCase().includes('date') && val) {
      val = excelDateToStr(val);
    }
    obj[h] = val !== undefined && val !== null ? val : '';
  });

  if (hasAnyData && (obj['Sr no.'] || obj['Date'] || obj['Site'])) {
    helpdeskTickets.push(obj);
  }
}

console.log(`Processed ${helpdeskTickets.length} valid helpdesk tickets`);

const fullSeed = {
  meta: {
    lastUpdated: new Date().toISOString(),
    eventSource: 'Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx',
    eventSheet: 'Master_Event_Tracker_2026',
    helpdeskSource: 'HELP DESK TRACKER FY 25-26 - Master.xlsx',
    helpdeskSheet: 'Helpdesk Tracker',
    totalValidEvents: events.length,
    totalValidHelpdesk: helpdeskTickets.length
  },
  events: {
    sheet_name: 'Master_Event_Tracker_2026',
    headers: eventHeaders,
    rows: events
  },
  helpdesk: {
    sheet_name: 'Helpdesk Tracker',
    headers: helpHeaders,
    rows: helpdeskTickets
  }
};

fs.writeFileSync('./src/data/seedData.json', JSON.stringify(fullSeed, null, 2));
console.log('Successfully wrote src/data/seedData.json! Size:', fs.statSync('./src/data/seedData.json').size, 'bytes');
