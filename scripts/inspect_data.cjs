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

let reactiveCount = 0;
let proactiveCount = 0;

let inTAT = 0;
let outTAT = 0;
let noTAT = 0;

let reactiveInTAT = 0;
let reactiveOutTAT = 0;
let reactiveResolved = 0;
let reactiveOpen = 0;
let reactiveWIP = 0;

hd.rows.forEach(r => {
  const rawCt = (r['Call type'] || '').trim();
  const ct = rawCt ? (rawCt.toLowerCase().includes('proactive') ? 'Proactive' : 'Reactive') : 'Reactive';
  callTypes[ct] = (callTypes[ct] || 0) + 1;

  if (ct === 'Reactive') reactiveCount++;
  else proactiveCount++;

  const st = r['Site'] || '(blank)';
  sites[st] = (sites[st] || 0) + 1;

  const z = r['Zone'] || '(blank)';
  zones[z] = (zones[z] || 0) + 1;

  const cat = r['Request category'] || '(blank)';
  categories[cat] = (categories[cat] || 0) + 1;

  const rv = (r['Request Via'] || r['Request via'] || 'Mail').trim();
  requestVia[rv] = (requestVia[rv] || 0) + 1;

  const rf = (r['Request from'] || 'Employee').trim();
  requestFrom[rf] = (requestFrom[rf] || 0) + 1;

  const rawStatus = (r['Status / WIP'] || r['Status'] || '').trim().toLowerCase();
  let s = 'Open';
  if (rawStatus.includes('resolve') || rawStatus.includes('close')) s = 'Resolved';
  else if (rawStatus.includes('wip') || rawStatus.includes('progress')) s = 'WIP';
  statuses[s] = (statuses[s] || 0) + 1;

  const defTAT = parseFloat(r['Defined TAT (Hrs)'] || r['Defined TAT (hrs)']);
  const cloTime = parseFloat(r['Closure Time (Hrs)'] || r['Closure Time (hrs)']);
  
  if (ct === 'Reactive') {
    if (s === 'Resolved') reactiveResolved++;
    else if (s === 'WIP') reactiveWIP++;
    else reactiveOpen++;

    if (!isNaN(defTAT) && !isNaN(cloTime)) {
      if (cloTime <= defTAT) reactiveInTAT++;
      else reactiveOutTAT++;
    }
  }

  if (!isNaN(defTAT) && !isNaN(cloTime)) {
    if (cloTime <= defTAT) inTAT++;
    else outTAT++;
  } else {
    noTAT++;
  }
});

console.log('Call types:', callTypes);
console.log('Reactive count:', reactiveCount, 'Proactive count:', proactiveCount);
console.log('Top Sites:', Object.entries(sites).sort((a,b)=>b[1]-a[1]).slice(0, 10));
console.log('Zones:', zones);
console.log('Top Categories:', Object.entries(categories).sort((a,b)=>b[1]-a[1]).slice(0, 8));
console.log('Request Via:', requestVia);
console.log('Request From:', requestFrom);
console.log('Statuses:', statuses);
console.log('Reactive KPIs:', {
  totalReactive: reactiveCount,
  resolved: reactiveResolved,
  open: reactiveOpen,
  wip: reactiveWIP,
  openWip: reactiveOpen + reactiveWIP,
  inTAT: reactiveInTAT,
  outTAT: reactiveOutTAT,
  inTATPct: ((reactiveInTAT / (reactiveInTAT + reactiveOutTAT)) * 100).toFixed(2) + '%',
  closureRate: ((reactiveResolved / reactiveCount) * 100).toFixed(2) + '%'
});

const reactive = hd.rows.filter(r => (r['Call type']||'').toLowerCase().includes('reactive') || !(r['Call type']||'').toLowerCase().includes('proactive'));
const rvReactive = {};
const rfReactive = {};
reactive.forEach(r => {
  const v = (r['Request Via'] || r['Request via'] || 'Other').trim();
  rvReactive[v] = (rvReactive[v] || 0) + 1;
  const f = (r['Request from'] || 'Other').trim();
  rfReactive[f] = (rfReactive[f] || 0) + 1;
});
console.log('Reactive Request Via breakdown:', rvReactive);
console.log('Reactive Request From sample:', Object.entries(rfReactive).slice(0, 6));

// Check Month values
const months = {};
hd.rows.forEach(r => {
  const m = r['Month'] || r['Date'];
  months[m] = (months[m] || 0) + 1;
});
console.log('Sample Months from data (first 8):', Object.entries(months).slice(0, 8));
