const path = require('path');
const xlsx = require(path.resolve('./node_modules/xlsx'));

const wb = xlsx.readFile('./Yearly Event Tracker- DT-3 and DT-4 Updated.xlsx', { cellDates: true });
const ws = wb.Sheets['Master_Event_Tracker_2026'];
const rawRows = xlsx.utils.sheet_to_json(ws, { header: 1 });
const headers = rawRows[1].map(h => String(h || '').trim());

const events = [];
for (let i = 2; i < rawRows.length; i++) {
  const rowArr = rawRows[i];
  if (!rowArr || rowArr.length === 0) continue;
  const obj = { excelRow: i + 1 };
  headers.forEach((h, colIdx) => {
    obj[h] = rowArr[colIdx] !== undefined ? rowArr[colIdx] : '';
  });
  const evtId = String(obj['Event ID'] || '').trim();
  if (evtId !== '' && evtId !== '-' && evtId !== 'None') {
    events.push(obj);
  }
}

console.log('Total Valid Events:', events.length);

// Correct Sites Check
let correctCount = 0;
let dt3_L3 = 0;
let dt4_L1 = 0;
let dt4_L4 = 0;
let dt4_L5 = 0;
let dt4_L6 = 0;
const wrongEntries = [];

events.forEach(e => {
  const b = String(e['Building'] || '').trim();
  const f = String(e['Floor'] || '').trim();

  let isCorrect = false;
  if (b === 'Downtown-3' && f === 'L3') {
    dt3_L3++;
    isCorrect = true;
  } else if (b === 'Downtown-4') {
    if (f === 'L-1') { dt4_L1++; isCorrect = true; }
    else if (f === 'L-4') { dt4_L4++; isCorrect = true; }
    else if (f === 'L-5') { dt4_L5++; isCorrect = true; }
    else if (f === 'L-6') { dt4_L6++; isCorrect = true; }
  }

  if (isCorrect) {
    correctCount++;
  } else {
    wrongEntries.push(e);
  }
});

console.log('Correct Sites Breakdown:');
console.log('  DT-3 (L3):', dt3_L3);
console.log('  DT-4 (L-1):', dt4_L1);
console.log('  DT-4 (L-4):', dt4_L4);
console.log('  DT-4 (L-5):', dt4_L5);
console.log('  DT-4 (L-6):', dt4_L6);
console.log('Total Correct:', correctCount);
console.log('Total Wrong:', wrongEntries.length);

// Categorize Wrong Entries
let floorBlank = 0;
let floorSpelling = 0;
let floorLocation = 0;
const spellingVariants = ['l5', 'l_5', 'l4', 'l_4', 'l6', '5th floor'];

wrongEntries.forEach(e => {
  const f = String(e['Floor'] || '').trim();
  const fLower = f.toLowerCase();
  if (f === '' || f === '-' || f === 'None') {
    floorBlank++;
  } else if (spellingVariants.includes(fLower)) {
    floorSpelling++;
  } else {
    floorLocation++;
  }
});

console.log('\nWrong Entries Categorization:');
console.log('  Floor Blank:', floorBlank);
console.log('  Floor Spelling Wrong:', floorSpelling);
console.log('  Floor = Location:', floorLocation);
console.log('  Sum of Wrong:', floorBlank + floorSpelling + floorLocation);

// Wrong entries by Month
const wrongByMonth = {};
wrongEntries.forEach(e => {
  const m = String(e['Month'] || '').slice(0, 3);
  wrongByMonth[m] = (wrongByMonth[m] || 0) + 1;
});
console.log('\nWrong Entries by Month:');
Object.entries(wrongByMonth).sort((a,b) => b[1] - a[1]).forEach(([m, c]) => {
  console.log('  ' + m + ': ' + c);
});

// Check location counts across all events
const locCounts = {};
let locBlank = 0;
events.forEach(e => {
  const l = String(e['Location'] || '').trim();
  if (l === '' || l === '-' || l === 'None') {
    locBlank++;
  } else {
    locCounts[l] = (locCounts[l] || 0) + 1;
  }
});

console.log('\nTotal Location Blank:', locBlank);
console.log('Top 15 Locations:');
Object.entries(locCounts).sort((a,b) => b[1] - a[1]).slice(0, 15).forEach(([k, v]) => {
  console.log('  ' + k + ': ' + v);
});
