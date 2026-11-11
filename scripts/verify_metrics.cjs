const fs = require('fs');
const seed = JSON.parse(fs.readFileSync('./src/data/seedData.json', 'utf8'));
const hd = seed.helpdesk.rows;

let totalReactive = 0;
let totalProactive = 0;
const siteCounts = {};
const reactiveCatCounts = {};
const reactiveRequestVia = {};
let inTATCount = 0;
let outTATCount = 0;
let noTATCount = 0;
let resolvedCount = 0;
let wipCount = 0;
let openCount = 0;

hd.forEach(r => {
  const rawCt = String(r['Call type'] || '').trim().toLowerCase();
  const isProactive = rawCt.includes('proactive');
  const ct = isProactive ? 'Proactive' : 'Reactive';

  if (ct === 'Reactive') {
    totalReactive++;

    // Category
    const cat = String(r['Request category'] || 'Other').trim();
    reactiveCatCounts[cat] = (reactiveCatCounts[cat] || 0) + 1;

    // Request Via
    const via = String(r['Request Via'] || r['Request via'] || 'Mail').trim();
    reactiveRequestVia[via] = (reactiveRequestVia[via] || 0) + 1;

    // Status
    const st = String(r['Status / WIP'] || r['Status'] || '').trim().toLowerCase();
    if (st.includes('resolve') || st.includes('close')) resolvedCount++;
    else if (st.includes('wip') || st.includes('progress')) wipCount++;
    else openCount++;

    // TAT
    const def = parseFloat(r['Defined TAT (Hrs)'] || r['Defined TAT (hrs)']);
    const clo = parseFloat(r['Closure Time (Hrs)'] || r['Closure Time (hrs)']);
    if (!isNaN(def) && !isNaN(clo)) {
      if (clo <= def) inTATCount++;
      else outTATCount++;
    } else {
      noTATCount++;
    }
  } else {
    totalProactive++;
  }

  // Site (Trimmed)
  const site = String(r['Site'] || 'Unknown').trim();
  siteCounts[site] = (siteCounts[site] || 0) + 1;
});

const sortedSites = Object.entries(siteCounts).sort((a,b)=>b[1]-a[1]);
const sortedCats = Object.entries(reactiveCatCounts).sort((a,b)=>b[1]-a[1]);
const inTATPct = ((inTATCount / (inTATCount + outTATCount)) * 100).toFixed(2);

console.log('=== VERIFICATION METRICS ===');
console.log('Total Reactive:', totalReactive);
console.log('Total Proactive:', totalProactive);
console.log('Top Site:', sortedSites[0][0], `(${sortedSites[0][1]} tickets)`);
console.log('Top Category (Reactive):', sortedCats[0][0], `(${sortedCats[0][1]} tickets)`);
console.log('Reactive Request Via breakdown:', reactiveRequestVia);
console.log('Mail count:', reactiveRequestVia['Mail'] || 0);
console.log('Phone count:', reactiveRequestVia['Phone'] || 0);
console.log('In TAT Count:', inTATCount);
console.log('Out TAT Count:', outTATCount);
console.log('In TAT %:', inTATPct + '%');
console.log('Resolved:', resolvedCount, 'WIP:', wipCount, 'Open:', openCount);
console.log('Closure Rate:', ((resolvedCount / totalReactive) * 100).toFixed(2) + '%');
