import fs from 'fs';
import { pathToFileURL } from 'url';

const {
  isValidEventRow,
  deriveBuilding,
  normalizeSite,
  matchesMonthFilter,
  matchesPaxFilter,
  parsePax
} = await import(pathToFileURL('./src/lib/dateUtils.js').href);

const seed = JSON.parse(fs.readFileSync('./src/data/seedData.json', 'utf8'));
const ev = seed.events.rows;

const filters = {
  selectedMonths: ['Jul-26'],
  site: 'Downtown-3',
  paxRange: '100+ (Townhall)',
  status: 'all',
  year: 'all',
  quarter: 'all',
  eventType: 'all',
  organizer: 'all',
  venue: 'all',
  searchKeyword: ''
};

const filtered = ev.filter(r => {
  if (!isValidEventRow(r)) return false;
  const dateVal = r['Event Date'] || r['Booking Date'];
  if (!matchesMonthFilter(dateVal, filters.selectedMonths, r)) return false;
  const rowSite = deriveBuilding(r);
  const targetSite = normalizeSite(filters.site);
  if (rowSite !== targetSite) return false;
  const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity'];
  if (!matchesPaxFilter(rawPax, filters.paxRange)) return false;
  return true;
});

console.log('Filtered rows count with current seedData:', filtered.length);
filtered.forEach((r, i) => {
  const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity'];
  console.log(`${i+1}. ${r['Event ID']} | ${r['Event Date']} | ${r['Day']} | ${deriveBuilding(r)} | ${r['Event Title / Purpose']} | Pax: ${rawPax} | ${r['Calendar Booking Status']}`);
});

const totalPax = filtered.reduce((acc, r) => {
  const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity'];
  return acc + parsePax(rawPax);
}, 0);
console.log('Total Pax:', totalPax, 'Avg Pax:', Math.round(totalPax / filtered.length));
