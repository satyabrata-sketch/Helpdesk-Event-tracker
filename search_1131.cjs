const xlsx = require('xlsx');

const wb = xlsx.readFile('HELP DESK TRACKER FY 25-26 - Master (4).xlsx', { cellFormula: false, cellHTML: false });

console.log('--- Checking all sheets for 1131 or month distributions ---');
for (const s of wb.SheetNames) {
  const ws = wb.Sheets[s];
  const rows = xlsx.utils.sheet_to_json(ws, { header: 1, defval: '' });
  rows.forEach((r, idx) => {
    if (r.some(c => c === 1131 || c === '1131' || c === 527 || c === '527')) {
      console.log(`Sheet "${s}" Row ${idx}:`, r.filter(c => c !== ''));
    }
  });
}
