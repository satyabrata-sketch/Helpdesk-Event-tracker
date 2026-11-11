const fs = require('fs');

const seed = JSON.parse(fs.readFileSync('src/data/seedData.json', 'utf8'));
const rows = seed.helpdesk.rows;
console.log('Total input rows:', rows.length);

const reactiveRows = rows.filter(r => r['Call type'] === 'Reactive');
const proactiveRows = rows.filter(r => r['Call type'] === 'Proactive');

console.log('Reactive rows count:', reactiveRows.length);
console.log('Proactive rows count:', proactiveRows.length);

const monthTargets = [
  { m: 'Jan-26', monthNum: 1, reactive: 42, proactive: 48, total: 90 },
  { m: 'Feb-26', monthNum: 2, reactive: 41, proactive: 47, total: 88 },
  { m: 'Mar-26', monthNum: 3, reactive: 48, proactive: 54, total: 102 },
  { m: 'Apr-26', monthNum: 4, reactive: 45, proactive: 51, total: 96 },
  { m: 'May-26', monthNum: 5, reactive: 43, proactive: 49, total: 92 },
  { m: 'Jun-26', monthNum: 6, reactive: 44, proactive: 50, total: 94 },
  { m: 'Jul-26', monthNum: 7, reactive: 49, proactive: 56, total: 105 },
  { m: 'Aug-26', monthNum: 8, reactive: 46, proactive: 52, total: 98 },
  { m: 'Sep-26', monthNum: 9, reactive: 47, proactive: 53, total: 100 },
  { m: 'Oct-26', monthNum: 10, reactive: 44, proactive: 51, total: 95 },
  { m: 'Nov-26', monthNum: 11, reactive: 40, proactive: 46, total: 86 },
  { m: 'Dec-26', monthNum: 12, reactive: 38, proactive: 47, total: 85 }
];

let rIdx = 0;
let pIdx = 0;

const updatedRows = [];

for (const target of monthTargets) {
  const mStr = String(target.monthNum).padStart(2, '0');
  
  // Assign reactive rows
  for (let i = 0; i < target.reactive; i++) {
    const row = { ...reactiveRows[rIdx++] };
    const day = String((i % 28) + 1).padStart(2, '0');
    row['Month'] = target.m;
    row['Date'] = `2026-${mStr}-${day}`;
    row['Date close'] = `2026-${mStr}-${day}`;
    updatedRows.push(row);
  }

  // Assign proactive rows
  for (let i = 0; i < target.proactive; i++) {
    const row = { ...proactiveRows[pIdx++] };
    const day = String((i % 28) + 1).padStart(2, '0');
    row['Month'] = target.m;
    row['Date'] = `2026-${mStr}-${day}`;
    row['Date close'] = `2026-${mStr}-${day}`;
    updatedRows.push(row);
  }
}

// Exactly 1,129 Resolved and 2 Open
// Mark all as Resolved except the last 2 tickets
for (let i = 0; i < updatedRows.length; i++) {
  if (i === updatedRows.length - 1) {
    updatedRows[i]['Status / WIP'] = 'Open';
  } else if (i === updatedRows.length - 2) {
    updatedRows[i]['Status / WIP'] = 'Work In Progress';
  } else {
    updatedRows[i]['Status / WIP'] = 'Resolved';
  }
}

console.log('Updated total rows:', updatedRows.length);
console.log('Updated reactive rows:', updatedRows.filter(r => r['Call type'] === 'Reactive').length);
console.log('Updated proactive rows:', updatedRows.filter(r => r['Call type'] === 'Proactive').length);
console.log('Updated resolved rows:', updatedRows.filter(r => r['Status / WIP'] === 'Resolved').length);
console.log('Updated open/wip rows:', updatedRows.filter(r => r['Status / WIP'] !== 'Resolved').length);

seed.helpdesk.rows = updatedRows;
fs.writeFileSync('src/data/seedData.json', JSON.stringify(seed, null, 2), 'utf8');
console.log('seedData.json successfully updated with 12-month distribution!');
