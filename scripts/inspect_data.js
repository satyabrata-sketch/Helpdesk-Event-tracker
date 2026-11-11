const fs = require('fs');
const seed = JSON.parse(fs.readFileSync('./src/data/seedData.json', 'utf8'));
const hd = seed.helpdesk;
console.log('Total rows:', hd.rows.length);
console.log('Headers:', Object.keys(hd.rows[0]));
console.log('Row 0 sample:', hd.rows[0]);

const callTypes = {};
const sites = {};
const zones = {};
const categories = {};
const requestVia = {};
const requestFrom = {};
const statuses = {};
let inTAT = 0;
let outTAT = 0;
let noTAT = 0;

hd.rows.forEach(r => {
  const ct = r['Call type'] || '(blank)';
  callTypes[ct] = (callTypes[ct] || 0) + 1;

  const st = r['Site'] || '(blank)';
  sites[st] = (sites[st] || 0) + 1;

  const z = r['Zone'] || '(blank)';
  zones[z] = (zones[z] || 0) + 1;

  const cat = r['Request category'] || '(blank)';
  categories[cat] = (categories[cat] || 0) + 1;

  const rv = r['Request Via'] || r['Request via'] || '(blank)';
  requestVia[rv] = (requestVia[rv] || 0) + 1;

  const rf = r['Request from'] || '(blank)';
  requestFrom[rf] = (requestFrom[rf] || 0) + 1;

  const s = r['Status / WIP'] || r['Status'] || '(blank)';
  statuses[s] = (statuses[s] || 0) + 1;

  const defTAT = parseFloat(r['Defined TAT (Hrs)'] || r['Defined TAT (hrs)']);
  const cloTime = parseFloat(r['Closure Time (Hrs)'] || r['Closure Time (hrs)']);
  if (!isNaN(defTAT) && !isNaN(cloTime)) {
    if (cloTime <= defTAT) inTAT++;
    else outTAT++;
  } else {
    noTAT++;
  }
});

console.log('Call types:', callTypes);
console.log('Top Sites:', Object.entries(sites).sort((a,b)=>b[1]-a[1]).slice(0, 10));
console.log('Zones:', zones);
console.log('Top Categories:', Object.entries(categories).sort((a,b)=>b[1]-a[1]).slice(0, 8));
console.log('Request Via:', requestVia);
console.log('Request From:', requestFrom);
console.log('Statuses:', statuses);
console.log('TAT breakdown (all):', { inTAT, outTAT, noTAT, inTATPct: ((inTAT / (inTAT + outTAT)) * 100).toFixed(2) + '%' });
