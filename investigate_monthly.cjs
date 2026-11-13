const xlsx = require('xlsx');

const wb = xlsx.readFile('HELP DESK TRACKER FY 25-26 - Master.xlsx', { cellFormula: false, cellHTML: false });

console.log('--- Summary & Drilldown Table 7 ---');
const summaryWs = wb.Sheets['Summary & Drilldown'];
const summaryRows = xlsx.utils.sheet_to_json(summaryWs, { header: 1, defval: '' });

// Look for monthly table in Summary & Drilldown
for (let i = 0; i < summaryRows.length; i++) {
  const r = summaryRows[i];
  if (r.some(c => String(c).toLowerCase().includes('monthly') || String(c).toLowerCase().includes('january 2026') || String(c).toLowerCase().includes('trend'))) {
    console.log(`R${i}:`, r.filter(c => c !== '').slice(0, 12));
  }
}

// Let's print rows 70 to 86 of Summary & Drilldown
for (let i = 70; i <= 86; i++) {
  if (summaryRows[i]) {
    console.log(`R${i}:`, summaryRows[i].filter(c => c !== ''));
  }
}
