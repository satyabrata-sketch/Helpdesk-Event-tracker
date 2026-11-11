import fs from 'fs';
import { pathToFileURL } from 'url';

const {
  isValidEventRow,
  deriveBuilding,
  normalizeSite,
  matchesMonthFilter,
  matchesPaxFilter,
  parsePax,
  parseDate,
  getYearStr,
  getCalendarQuarter,
  getTodayIST
} = await import(pathToFileURL('./src/lib/dateUtils.js').href);

export function applyEventFilters(allRows, filters = {}, kpiId = null) {
  if (!Array.isArray(allRows)) return [];

  const todayStr = getTodayIST();
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

  return allRows.filter((row) => {
    // 1. Mandatory Valid Event Check (4 strict rules)
    if (!isValidEventRow(row)) return false;

    const dateVal = row['Event Date'] || row['Booking Date'] || row['Date'];
    const eDate = parseDate(dateVal);

    // 2. Year Filter
    const activeYear = filters.year;
    if (activeYear && activeYear !== 'all') {
      const yStr = String(row['Year'] || getYearStr(dateVal) || '');
      if (!yStr.includes(activeYear)) return false;
    }

    // 3. Quarter Filter
    const activeQuarter = filters.quarter;
    if (activeQuarter && activeQuarter !== 'all') {
      const qStr = getCalendarQuarter(dateVal);
      if (qStr && qStr !== activeQuarter) return false;
    }

    // 4. Month Filter (handles selectedMonths array or month string)
    if (Array.isArray(filters.selectedMonths) && filters.selectedMonths.length > 0) {
      if (!matchesMonthFilter(dateVal, filters.selectedMonths, row)) return false;
    } else if (filters.month && filters.month !== 'all') {
      if (!matchesMonthFilter(dateVal, [filters.month], row)) return false;
    }

    // 5. Site / Building Filter
    const activeSite = filters.site || filters.building;
    if (activeSite && activeSite !== 'all') {
      const rowSite = deriveBuilding(row);
      const targetSite = normalizeSite(activeSite);
      if (rowSite !== targetSite) return false;
    }

    // 6. Pax Range Filter
    const activePax = filters.paxRange || filters.pax;
    if (activePax && activePax !== 'all' && activePax !== 'All Sizes' && activePax !== 'All Pax') {
      const rawPax = row['Capacity / Pax'] !== undefined ? row['Capacity / Pax'] : row['Capacity'];
      if (!matchesPaxFilter(rawPax, activePax)) return false;
    }

    // 7. Event Type / Category Filter
    const activeCategory = filters.eventType || filters.category;
    if (activeCategory && activeCategory !== 'all') {
      const cat = (
        String(row['Category'] || '') + ' ' +
        String(row['Event Type / Title'] || '') + ' ' +
        String(row['Event Type'] || '')
      ).toLowerCase();
      if (!cat.includes(activeCategory.toLowerCase())) return false;
    }

    // 8. Organizer Filter
    if (filters.organizer && filters.organizer !== 'all') {
      const org = String(row['Booked By'] || '').toLowerCase();
      if (!org.includes(filters.organizer.toLowerCase())) return false;
    }

    // 9. Venue / Floor Filter
    const activeVenue = filters.venue || filters.floor;
    if (activeVenue && activeVenue !== 'all') {
      const ven = (
        String(row['Floor'] || '') + ' ' +
        String(row['Location'] || '')
      ).toLowerCase();
      if (!ven.includes(activeVenue.toLowerCase())) return false;
    }

    // 10. Status / KPI Double-Click Filter
    const rawStatus = String(row['Calendar Booking Status'] || row['Status'] || '').toLowerCase();

    if (kpiId) {
      if (kpiId === 'confirmed_events') {
        const isDone = rawStatus.includes('confirmed') || rawStatus.includes('done') || rawStatus.includes('completed');
        if (!isDone || rawStatus.includes('cancel')) return false;
      } else if (kpiId === 'pending_events') {
        const isDone = rawStatus.includes('confirmed') || rawStatus.includes('done') || rawStatus.includes('completed');
        if (isDone || rawStatus.includes('cancel')) return false;
      } else if (kpiId === 'cancelled_events') {
        if (!rawStatus.includes('cancel')) return false;
      } else if (kpiId === 'upcoming_events') {
        if (rawStatus.includes('cancel')) return false;
        if (!eDate || eDate.getTime() < todayStart) return false;
      } else if (kpiId === 'today_events') {
        const rowDateStr = eDate ? eDate.toISOString().slice(0, 10) : '';
        if (rowDateStr !== todayStr) return false;
      }
    } else if (filters.status && filters.status !== 'all') {
      const s = filters.status.toLowerCase();
      if (s === 'completed' || s === 'confirmed') {
        const isDone = rawStatus.includes('confirmed') || rawStatus.includes('done') || rawStatus.includes('completed');
        if (!isDone || rawStatus.includes('cancel')) return false;
      } else if (s === 'cancelled' || s === 'canceled') {
        if (!rawStatus.includes('cancel')) return false;
      } else if (s === 'pending') {
        const isDone = rawStatus.includes('confirmed') || rawStatus.includes('done') || rawStatus.includes('completed');
        if (isDone || rawStatus.includes('cancel')) return false;
      } else if (s === 'upcoming') {
        if (rawStatus.includes('cancel')) return false;
        if (!eDate || eDate.getTime() < todayStart) return false;
      } else {
        if (!rawStatus.includes(s)) return false;
      }
    }

    // 11. Search Keyword Filter
    if (filters.searchKeyword && filters.searchKeyword.trim()) {
      const q = filters.searchKeyword.toLowerCase().trim();
      const fullText = (
        String(row['Event ID'] || '') + ' ' +
        String(row['Category'] || '') + ' ' +
        String(row['Event Title / Purpose'] || '') + ' ' +
        String(row['Booked By'] || '') + ' ' +
        String(row['Location'] || '') + ' ' +
        String(row['Floor'] || '')
      ).toLowerCase();
      if (!fullText.includes(q)) return false;
    }

    return true;
  });
}

// RUN TESTS
const seed = JSON.parse(fs.readFileSync('./src/data/seedData.json', 'utf8'));
const allRows = seed.events.rows;

console.log('--- TEST 1: Jul-26 + Downtown-3 + 100+ (Townhall) ---');
const t1Filters = {
  selectedMonths: ['Jul-26'],
  site: 'Downtown-3',
  paxRange: '100+ (Townhall)'
};
const t1Rows = applyEventFilters(allRows, t1Filters);
console.log('Result count (Expected 13):', t1Rows.length);

console.log('--- TEST 2: Double-Click Confirmed KPI with t1Filters ---');
const t2Rows = applyEventFilters(allRows, t1Filters, 'confirmed_events');
console.log('Result count (Expected 13):', t2Rows.length);
console.log('Any 2027 rows? (Expected 0):', t2Rows.filter(r => String(r['Event Date']).includes('2027')).length);
console.log('Any Small rows? (Expected 0):', t2Rows.filter(r => parsePax(r['Capacity / Pax']) < 100).length);

console.log('--- TEST 3: Aug-26 + 100+ (Townhall) ---');
const t3Rows = applyEventFilters(allRows, { selectedMonths: ['Aug-26'], paxRange: '100+ (Townhall)' });
console.log('Result count (Expected 21):', t3Rows.length);

console.log('--- TEST 4: Year 2026 + 100+ (Townhall) ---');
const t4Rows = applyEventFilters(allRows, { year: '2026', paxRange: '100+ (Townhall)' });
console.log('Result count (Expected 160):', t4Rows.length);

console.log('--- TEST 5: All Valid Rows (Expected 2015) ---');
const t5Rows = applyEventFilters(allRows, {});
console.log('Result count (Expected 2015):', t5Rows.length);
