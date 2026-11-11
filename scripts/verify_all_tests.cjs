const fs = require('fs');

const seed = JSON.parse(fs.readFileSync('src/data/seedData.json', 'utf8'));
const hd = seed.helpdesk.rows;
const ev = seed.events.rows;

console.log('====================================================');
console.log('1. HELPDESK INTEGRITY VERIFICATION');
console.log('====================================================');
const reactive = hd.filter(r => r['Call type'] === 'Reactive').length;
const proactive = hd.filter(r => r['Call type'] === 'Proactive').length;
const resolved = hd.filter(r => r['Status / WIP'] === 'Resolved').length;
const nonResolved = hd.filter(r => r['Status / WIP'] !== 'Resolved').length;
console.log(`Total: ${hd.length} | Reactive: ${reactive} | Proactive: ${proactive} | Resolved: ${resolved} | Open/WIP: ${nonResolved}`);

console.log('\n====================================================');
console.log('2. DT-4 NOV26 SHEET VERIFICATION');
console.log('====================================================');
const dt4NovRows = ev.filter(r => r.sheet === 'DT-4 Nov26');
console.log(`DT-4 Nov26 Total Rows: ${dt4NovRows.length}`);

function isValid(r) {
  const evtId = String(r['Event ID'] || '').trim();
  const dStr = r['Event Date'] || r['Booking Date'];
  const loc = String(r['Location'] || '').trim();
  const floor = String(r['Floor'] || '').trim();
  const title = String(r['Event Title / Purpose'] || '').trim();
  const cat = String(r['Category'] || '').trim();

  const hasEvt = evtId.length > 0 && evtId.startsWith('EVT-');
  const hasDate = !!dStr && !isNaN(new Date(dStr).getTime());
  const hasLoc = loc.length > 0 || floor.length > 0;
  const hasTitle = title.length > 0 || cat.length > 0;

  return hasEvt && hasDate && hasLoc && hasTitle;
}

function classify(r) {
  const evtId = String(r['Event ID'] || '').trim();
  const dStr = r['Event Date'] || r['Booking Date'];
  const loc = String(r['Location'] || '').trim();
  const floor = String(r['Floor'] || '').trim();
  const title = String(r['Event Title / Purpose'] || '').trim();
  const cat = String(r['Category'] || '').trim();

  const hasEvt = evtId.length > 0 && evtId.startsWith('EVT-');
  const hasDate = !!dStr && !isNaN(new Date(dStr).getTime());
  const hasLoc = loc.length > 0 || floor.length > 0;
  const hasTitle = title.length > 0 || cat.length > 0;

  if (!evtId && !hasDate && !hasLoc && !hasTitle) return 'blank';
  if (hasEvt && hasDate && hasLoc && hasTitle) return 'valid';
  if (!hasEvt && hasDate) return 'placeholder';
  if (hasEvt && (!hasLoc || !hasTitle)) return 'incomplete';
  return 'blank';
}

let dt4Valid = 0, dt4Placeholder = 0, dt4Blank = 0, dt4Incomplete = 0;
dt4NovRows.forEach(r => {
  const c = classify(r);
  if (c === 'valid') dt4Valid++;
  else if (c === 'placeholder') dt4Placeholder++;
  else if (c === 'incomplete') dt4Incomplete++;
  else dt4Blank++;
});
console.log(`DT-4 Nov26 Breakdown: Valid: ${dt4Valid} | Placeholder: ${dt4Placeholder} | Blank: ${dt4Blank} | Incomplete: ${dt4Incomplete}`);

const r43 = dt4NovRows.find(r => r.excelRow === 43);
console.log('Row 43 in DT-4 Nov26:', {
  excelRow: r43?.excelRow,
  date: r43?.['Event Date'],
  day: r43?.['Day'],
  evtId: r43?.['Event ID'],
  location: r43?.['Location'],
  title: r43?.['Event Title / Purpose'],
  classification: classify(r43)
});

console.log('\n====================================================');
console.log('3. SUNDAY 08-NOV-2026 & MONDAY 09-NOV-2026 VERIFICATION');
console.log('====================================================');
const nov8Events = ev.filter(r => String(r['Event Date'] || '').includes('2026-11-08'));
const nov8Valid = nov8Events.filter(r => isValid(r));
const nov8Placeholders = nov8Events.filter(r => classify(r) === 'placeholder');

console.log(`Sunday 08-Nov-2026: Valid Events = ${nov8Valid.length} (Expected: 0)`);
console.log(`Sunday 08-Nov-2026: Placeholder Rows = ${nov8Placeholders.length} (Expected: 2)`);
nov8Placeholders.forEach(r => {
  console.log(`  - Sheet: ${r.sheet}, Row: ${r.excelRow}, Date: ${r['Event Date']}, Day: ${r['Day']}, ID: '${r['Event ID']}'`);
});

const nov9Events = ev.filter(r => String(r['Event Date'] || '').includes('2026-11-09'));
const nov9Valid = nov9Events.filter(r => isValid(r));
const nov9Dt4Valid = nov9Valid.filter(r => r.sheet === 'DT-4 Nov26' || r.Building === 'Downtown-4');

console.log(`Monday 09-Nov-2026: Total Valid Events = ${nov9Valid.length}`);
console.log(`Monday 09-Nov-2026: DT-4 Valid Events = ${nov9Dt4Valid.length} (Expected: 1, EVT-2026-1509)`);
nov9Dt4Valid.forEach(r => {
  console.log(`  - DT-4 Event: ID: ${r['Event ID']}, Date: ${r['Event Date']}, Day: ${r['Day']}, Loc: ${r['Location']}, Title: ${r['Event Title / Purpose']}, Pax: ${r['Capacity / Pax']}`);
});

console.log('\n====================================================');
console.log('4. NOVEMBER COMBINED VALID VS PLACEHOLDER');
console.log('====================================================');
const novRows = ev.filter(r => (r['Month'] || '').toLowerCase() === 'nov' || String(r['Event Date'] || '').includes('2026-11'));
let novV = 0, novP = 0, novB = 0, novI = 0;
novRows.forEach(r => {
  const c = classify(r);
  if (c === 'valid') novV++;
  else if (c === 'placeholder') novP++;
  else if (c === 'incomplete') novI++;
  else novB++;
});
console.log(`Nov Total Rows: ${novRows.length} | Valid: ${novV} | Placeholder: ${novP} | Blank: ${novB} | Incomplete: ${novI}`);
console.log('====================================================');
