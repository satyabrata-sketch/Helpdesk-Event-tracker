// ==============================================================================
// DATE UTILITY & FISCAL / CALENDAR YEAR HELPERS (100% English)
// Supports Dynamic Years (2025, 2026, 2027), Cascading Year -> Quarter -> Month,
// Calendar Quarters (Q1: Jan-Mar, Q2: Apr-Jun, Q3: Jul-Sep, Q4: Oct-Dec),
// and MMM-YY formatted dates (e.g. Nov-26, Apr-25).
// ==============================================================================

export const CALENDAR_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
]

export const FY_MONTHS = [
  'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'
]

// Standard 12 Fiscal Months (FY 25-26 default)
export const FISCAL_12_MONTHS = [
  { key: 'Apr-25', label: 'Apr-25', full: 'Apr 2025', monthNum: 4, year: 2025 },
  { key: 'May-25', label: 'May-25', full: 'May 2025', monthNum: 5, year: 2025 },
  { key: 'Jun-25', label: 'Jun-25', full: 'Jun 2025', monthNum: 6, year: 2025 },
  { key: 'Jul-25', label: 'Jul-25', full: 'Jul 2025', monthNum: 7, year: 2025 },
  { key: 'Aug-25', label: 'Aug-25', full: 'Aug 2025', monthNum: 8, year: 2025 },
  { key: 'Sep-25', label: 'Sep-25', full: 'Sep 2025', monthNum: 9, year: 2025 },
  { key: 'Oct-25', label: 'Oct-25', full: 'Oct 2025', monthNum: 10, year: 2025 },
  { key: 'Nov-25', label: 'Nov-25', full: 'Nov 2025', monthNum: 11, year: 2025 },
  { key: 'Dec-25', label: 'Dec-25', full: 'Dec 2025', monthNum: 12, year: 2025 },
  { key: 'Jan-26', label: 'Jan-26', full: 'Jan 2026', monthNum: 1, year: 2026 },
  { key: 'Feb-26', label: 'Feb-26', full: 'Feb 2026', monthNum: 2, year: 2026 },
  { key: 'Mar-26', label: 'Mar-26', full: 'Mar 2026', monthNum: 3, year: 2026 }
]

// All 24 Months in Data Range (Apr-25 to Mar-27)
export const ALL_DATA_24_MONTHS = [
  // FY 25-26 (Apr-25 to Dec-25)
  { key: 'Apr-25', label: 'Apr-25', full: 'Apr 2025', year: '2025', quarter: 'Q2', monthNum: 4 },
  { key: 'May-25', label: 'May-25', full: 'May 2025', year: '2025', quarter: 'Q2', monthNum: 5 },
  { key: 'Jun-25', label: 'Jun-25', full: 'Jun 2025', year: '2025', quarter: 'Q2', monthNum: 6 },
  { key: 'Jul-25', label: 'Jul-25', full: 'Jul 2025', year: '2025', quarter: 'Q3', monthNum: 7 },
  { key: 'Aug-25', label: 'Aug-25', full: 'Aug 2025', year: '2025', quarter: 'Q3', monthNum: 8 },
  { key: 'Sep-25', label: 'Sep-25', full: 'Sep 2025', year: '2025', quarter: 'Q3', monthNum: 9 },
  { key: 'Oct-25', label: 'Oct-25', full: 'Oct 2025', year: '2025', quarter: 'Q4', monthNum: 10 },
  { key: 'Nov-25', label: 'Nov-25', full: 'Nov 2025', year: '2025', quarter: 'Q4', monthNum: 11 },
  { key: 'Dec-25', label: 'Dec-25', full: 'Dec 2025', year: '2025', quarter: 'Q4', monthNum: 12 },
  // Calendar 2026 (Jan-26 to Dec-26)
  { key: 'Jan-26', label: 'Jan-26', full: 'Jan 2026', year: '2026', quarter: 'Q1', monthNum: 1 },
  { key: 'Feb-26', label: 'Feb-26', full: 'Feb 2026', year: '2026', quarter: 'Q1', monthNum: 2 },
  { key: 'Mar-26', label: 'Mar-26', full: 'Mar 2026', year: '2026', quarter: 'Q1', monthNum: 3 },
  { key: 'Apr-26', label: 'Apr-26', full: 'Apr 2026', year: '2026', quarter: 'Q2', monthNum: 4 },
  { key: 'May-26', label: 'May-26', full: 'May 2026', year: '2026', quarter: 'Q2', monthNum: 5 },
  { key: 'Jun-26', label: 'Jun-26', full: 'Jun 2026', year: '2026', quarter: 'Q2', monthNum: 6 },
  { key: 'Jul-26', label: 'Jul-26', full: 'Jul 2026', year: '2026', quarter: 'Q3', monthNum: 7 },
  { key: 'Aug-26', label: 'Aug-26', full: 'Aug 2026', year: '2026', quarter: 'Q3', monthNum: 8 },
  { key: 'Sep-26', label: 'Sep-26', full: 'Sep 2026', year: '2026', quarter: 'Q3', monthNum: 9 },
  { key: 'Oct-26', label: 'Oct-26', full: 'Oct 2026', year: '2026', quarter: 'Q4', monthNum: 10 },
  { key: 'Nov-26', label: 'Nov-26', full: 'Nov 2026', year: '2026', quarter: 'Q4', monthNum: 11 },
  { key: 'Dec-26', label: 'Dec-26', full: 'Dec 2026', year: '2026', quarter: 'Q4', monthNum: 12 },
  // FY 26-27 (Jan-27 to Mar-27)
  { key: 'Jan-27', label: 'Jan-27', full: 'Jan 2027', year: '2027', quarter: 'Q1', monthNum: 1 },
  { key: 'Feb-27', label: 'Feb-27', full: 'Feb 2027', year: '2027', quarter: 'Q1', monthNum: 2 },
  { key: 'Mar-27', label: 'Mar-27', full: 'Mar 2027', year: '2027', quarter: 'Q1', monthNum: 3 }
]

// Safe date parsing that NEVER throws
export function parseDate(dateVal) {
  if (dateVal === null || dateVal === undefined) return null
  if (dateVal instanceof Date) {
    return isNaN(dateVal.getTime()) ? null : dateVal
  }

  // Excel serial number (e.g. 46266)
  if (typeof dateVal === 'number' && dateVal > 20000 && dateVal < 60000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30))
    const d = new Date(excelEpoch.getTime() + dateVal * 86400000)
    return isNaN(d.getTime()) ? null : d
  }
  
  let s = String(dateVal).trim()
  if (!s || s === 'null' || s === 'undefined' || s === '—' || s === '-') return null
  // Strip ordinal suffixes like 1st, 2nd, 3rd, 4th
  s = s.replace(/(\d+)(st|nd|rd|th)/i, '$1')

  // ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  }

  // DD-MMM-YY or DD-MMM-YYYY (e.g. 08-Sep-26, 08-Sep-2026)
  const ddMmmMatch = s.match(/^(\d{1,2})[-/]([A-Za-z]{3})[-/](\d{2,4})$/)
  if (ddMmmMatch) {
    const day = parseInt(ddMmmMatch[1], 10)
    const mIdx = CALENDAR_MONTHS.findIndex((m) => m.toLowerCase() === ddMmmMatch[2].toLowerCase())
    let yr = parseInt(ddMmmMatch[3], 10)
    if (yr < 100) yr += 2000
    if (mIdx !== -1) {
      return new Date(yr, mIdx, day)
    }
  }

  // MMM-YY format like "Jan-26", "Nov-26"
  const mmmYyMatch = s.match(/^([A-Za-z]{3})-(\d{2})$/)
  if (mmmYyMatch) {
    const mIdx = CALENDAR_MONTHS.findIndex((m) => m.toLowerCase() === mmmYyMatch[1].toLowerCase())
    if (mIdx !== -1) {
      return new Date(2000 + parseInt(mmmYyMatch[2], 10), mIdx, 1)
    }
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const parts = s.split(/[-/]/)
  if (parts.length === 3) {
    if (parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
      const day = parseInt(parts[0], 10)
      const month = parseInt(parts[1], 10) - 1
      const year = parseInt(parts[2], 10)
      const d = new Date(year, month, day)
      return isNaN(d.getTime()) ? null : d
    }
  }

  // Fallback Date constructor
  try {
    const d = new Date(s)
    return isNaN(d.getTime()) ? null : d
  } catch (_e) {
    return null
  }
}

// Format any date into strictly "MMM-YY" (e.g. Nov-26, Apr-25, Jan-26)
export function formatMonthYear(dateVal) {
  const d = parseDate(dateVal)
  if (!d) return '—'
  const m = CALENDAR_MONTHS[d.getMonth()]
  const y = String(d.getFullYear()).slice(-2)
  return `${m}-${y}`
}

// Single source of truth for Month extraction across charts, KPIs & tables
export function getMonthKey(row) {
  if (!row) return 'Unassigned'
  const raw = row['Date'] || row['Raised Date'] || row['Month'] || row['Event Date'] || row['Booking Date']
  if (!raw) return 'Unassigned'

  // If already MMM-YY format like "Jan-26", "Jul-26", "Nov-26"
  const mmmYyMatch = String(raw).trim().match(/^([A-Za-z]{3})-(\d{2})$/)
  if (mmmYyMatch) {
    const mStr = mmmYyMatch[1].slice(0, 1).toUpperCase() + mmmYyMatch[1].slice(1, 3).toLowerCase()
    return `${mStr}-${mmmYyMatch[2]}`
  }

  // Parse using safe parseDate
  const d = parseDate(raw)
  if (d && !isNaN(d.getTime())) {
    const m = CALENDAR_MONTHS[d.getMonth()]
    const y = String(d.getFullYear()).slice(-2)
    return `${m}-${y}`
  }

  // Fallback: try parsing Month string "Nov-26" -> "01-Nov-2026"
  try {
    const s = String(raw).trim()
    const parts = s.split('-')
    if (parts.length === 2 && parts[0].length === 3 && parts[1].length === 2) {
      const d2 = new Date(`01-${parts[0]}-20${parts[1]}`)
      if (!isNaN(d2.getTime())) {
        const m = CALENDAR_MONTHS[d2.getMonth()]
        const y = String(d2.getFullYear()).slice(-2)
        return `${m}-${y}`
      }
    }
    const d3 = new Date(s)
    if (!isNaN(d3.getTime())) {
      const m = CALENDAR_MONTHS[d3.getMonth()]
      const y = String(d3.getFullYear()).slice(-2)
      return `${m}-${y}`
    }
  } catch (_e) {}

  return 'Unassigned'
}

// Get Year string ('2025', '2026', '2027')
export function getYearStr(dateVal) {
  const d = parseDate(dateVal)
  if (!d) return null
  return String(d.getFullYear())
}

// Get Calendar Quarter ('Q1', 'Q2', 'Q3', 'Q4')
// Q1: Jan-Mar (0, 1, 2)
// Q2: Apr-Jun (3, 4, 5)
// Q3: Jul-Sep (6, 7, 8)
// Q4: Oct-Dec (9, 10, 11)
export function getCalendarQuarter(dateVal) {
  const d = parseDate(dateVal)
  if (!d) return null
  const m = d.getMonth()
  if (m <= 2) return 'Q1'
  if (m <= 5) return 'Q2'
  if (m <= 8) return 'Q3'
  return 'Q4'
}

// Map any date to Fiscal Month Label
export function getFiscalMonthLabel(dateVal) {
  if (!dateVal) return null
  const d = parseDate(dateVal)
  if (d) {
    const m = CALENDAR_MONTHS[d.getMonth()]
    const y = String(d.getFullYear()).slice(-2)
    return `${m}-${y}`
  }
  return null
}

// Get Month abbreviation ('Jan', 'Feb', etc.)
export function getMonthAbbr(dateVal) {
  const d = parseDate(dateVal)
  if (!d) return null
  return CALENDAR_MONTHS[d.getMonth()]
}

// Format Date for table display: 'DD-MMM-YYYY' e.g. '30-Sep-2026'
export function formatDateDisplay(dateVal) {
  if (!dateVal) return '—'
  const s = String(dateVal).trim()
  if (!s || s === 'null' || s === 'undefined' || s === '—' || s === '-') return '—'

  // If already DD-MMM-YYYY (e.g. 30-Sep-2026)
  if (/^\d{2}-[A-Za-z]{3}-\d{4}$/.test(s)) return s

  // If YYYY-MM-DD (e.g. 2026-09-30) - Direct string parse to avoid any timezone shift
  const ymdMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (ymdMatch) {
    const y = ymdMatch[1]
    const mIdx = parseInt(ymdMatch[2], 10) - 1
    const d = ymdMatch[3]
    if (mIdx >= 0 && mIdx < 12) {
      return `${d}-${CALENDAR_MONTHS[mIdx]}-${y}`
    }
  }

  const d = parseDate(dateVal)
  if (!d) return '—'
  const day = String(d.getDate()).padStart(2, '0')
  const month = CALENDAR_MONTHS[d.getMonth()]
  const year = d.getFullYear()
  return `${day}-${month}-${year}`
}

// ------------------------------------------------------------------------------
// DYNAMIC YEAR & CASCADING FILTER HELPERS
// ------------------------------------------------------------------------------

// Dynamically extract all available years across datasets
export function getAvailableYears(...rowLists) {
  const yearSet = new Set(['2025', '2026', '2027'])
  rowLists.forEach((rows) => {
    if (Array.isArray(rows)) {
      rows.forEach((r) => {
        const dt = r['Date'] || r['Event Date'] || r['Month'] || r['Booking Date'] || r['Year']
        if (dt) {
          const match = String(dt).match(/202\d/)
          if (match) yearSet.add(match[0])
        }
      })
    }
  })
  return Array.from(yearSet).sort()
}

// Available years strictly for Event Tracker (Excludes 2025, shows ONLY 2026 and 2027)
export function getAvailableEventYears(rows) {
  const yearSet = new Set(['2026'])
  if (Array.isArray(rows)) {
    rows.forEach((r) => {
      const dt = r['Event Date'] || r['Booking Date'] || r['Date'] || r['Year']
      if (dt) {
        const match = String(dt).match(/202[6-9]/)
        if (match) yearSet.add(match[0])
      }
    })
  }
  return Array.from(yearSet).filter((y) => y !== '2025' && y !== 2025).sort()
}

// Quarter options for a given year
export function getQuarterOptions(year, includeFuture = false) {
  if (year === '2026') {
    return [
      { value: 'all', label: 'All Quarters' },
      { value: 'Q1', label: 'Q1-2026 (Jan-Mar)' },
      { value: 'Q2', label: 'Q2-2026 (Apr-Jun)' },
      { value: 'Q3', label: 'Q3-2026 (Jul-Sep)' },
      { value: 'Q4', label: includeFuture ? 'Q4-2026 (Oct-Dec)' : 'Q4-2026 (Oct-Nov)' }
    ]
  }
  if (year === '2025') {
    return [
      { value: 'all', label: 'All Quarters' },
      { value: 'Q1', label: 'Q1-2025 (Jan-Mar)' },
      { value: 'Q2', label: 'Q2-2025 (Apr-Jun)' },
      { value: 'Q3', label: 'Q3-2025 (Jul-Sep)' },
      { value: 'Q4', label: 'Q4-2025 (Oct-Dec)' }
    ]
  }
  if (year === '2027') {
    return [
      { value: 'all', label: 'All Quarters' },
      { value: 'Q1', label: 'Q1-2027 (Jan-Mar)' },
      { value: 'Q2', label: 'Q2-2027 (Apr-Jun)' },
      { value: 'Q3', label: 'Q3-2027 (Jul-Sep)' },
      { value: 'Q4', label: 'Q4-2027 (Oct-Dec)' }
    ]
  }
  // All Years
  return [
    { value: 'all', label: 'All Quarters' },
    { value: 'Q1', label: 'Q1 (Jan - Mar)' },
    { value: 'Q2', label: 'Q2 (Apr - Jun)' },
    { value: 'Q3', label: 'Q3 (Jul - Sep)' },
    { value: 'Q4', label: 'Q4 (Oct - Dec)' }
  ]
}

// Cascading Month list for Year + Quarter
export function getMonthsForYearAndQuarter(year, quarter = 'all', includeFuture = false) {
  // 1. Year = 2026: Calendar Months of 2026 (Capped to Nov-26 unless includeFuture is true)
  if (year === '2026') {
    if (quarter === 'Q1') return ['Jan-26', 'Feb-26', 'Mar-26']
    if (quarter === 'Q2') return ['Apr-26', 'May-26', 'Jun-26']
    if (quarter === 'Q3') return ['Jul-26', 'Aug-26', 'Sep-26']
    if (quarter === 'Q4') return includeFuture ? ['Oct-26', 'Nov-26', 'Dec-26'] : ['Oct-26', 'Nov-26']
    return includeFuture ? [
      'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26',
      'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26', 'Dec-26'
    ] : [
      'Jan-26', 'Feb-26', 'Mar-26', 'Apr-26', 'May-26', 'Jun-26',
      'Jul-26', 'Aug-26', 'Sep-26', 'Oct-26', 'Nov-26'
    ]
  }

  // 2. Year = 2025: Jan-25 to Dec-25
  if (year === '2025') {
    if (quarter === 'Q1') return ['Jan-25', 'Feb-25', 'Mar-25']
    if (quarter === 'Q2') return ['Apr-25', 'May-25', 'Jun-25']
    if (quarter === 'Q3') return ['Jul-25', 'Aug-25', 'Sep-25']
    if (quarter === 'Q4') return ['Oct-25', 'Nov-25', 'Dec-25']
    return [
      'Jan-25', 'Feb-25', 'Mar-25', 'Apr-25', 'May-25', 'Jun-25',
      'Jul-25', 'Aug-25', 'Sep-25', 'Oct-25', 'Nov-25', 'Dec-25'
    ]
  }

  // 3. Year = 2027: Jan-27 to Mar-27
  if (year === '2027') {
    if (quarter === 'Q1') return ['Jan-27', 'Feb-27', 'Mar-27']
    return ['Jan-27', 'Feb-27', 'Mar-27']
  }

  // 4. Year = 'all' / All Years: Full 24-month range from Apr-25 to Mar-27
  const allMonths = ALL_DATA_24_MONTHS.map((m) => m.label)
  if (quarter === 'Q1') return ['Jan-26', 'Feb-26', 'Mar-26', 'Jan-27', 'Feb-27', 'Mar-27']
  if (quarter === 'Q2') return ['Apr-25', 'May-25', 'Jun-25', 'Apr-26', 'May-26', 'Jun-26']
  if (quarter === 'Q3') return ['Jul-25', 'Aug-25', 'Sep-25', 'Jul-26', 'Aug-26', 'Sep-26']
  if (quarter === 'Q4') return ['Oct-25', 'Nov-25', 'Dec-25', 'Oct-26', 'Nov-26', 'Dec-26']
  return allMonths
}

// Get Month Series Objects for Recharts Trends based on Year
export function getMonthSeriesForYear(year = 'all', includeFuture = false) {
  if (year === '2026') {
    const months = [
      { key: 'Jan-26', label: 'Jan-26', full: 'Jan 2026', monthNum: 1, year: 2026 },
      { key: 'Feb-26', label: 'Feb-26', full: 'Feb 2026', monthNum: 2, year: 2026 },
      { key: 'Mar-26', label: 'Mar-26', full: 'Mar 2026', monthNum: 3, year: 2026 },
      { key: 'Apr-26', label: 'Apr-26', full: 'Apr 2026', monthNum: 4, year: 2026 },
      { key: 'May-26', label: 'May-26', full: 'May 2026', monthNum: 5, year: 2026 },
      { key: 'Jun-26', label: 'Jun-26', full: 'Jun 2026', monthNum: 6, year: 2026 },
      { key: 'Jul-26', label: 'Jul-26', full: 'Jul 2026', monthNum: 7, year: 2026 },
      { key: 'Aug-26', label: 'Aug-26', full: 'Aug 2026', monthNum: 8, year: 2026 },
      { key: 'Sep-26', label: 'Sep-26', full: 'Sep 2026', monthNum: 9, year: 2026 },
      { key: 'Oct-26', label: 'Oct-26', full: 'Oct 2026', monthNum: 10, year: 2026 },
      { key: 'Nov-26', label: 'Nov-26', full: 'Nov 2026', monthNum: 11, year: 2026 }
    ]
    if (includeFuture) {
      months.push({ key: 'Dec-26', label: 'Dec-26', full: 'Dec 2026', monthNum: 12, year: 2026 })
    }
    return months
  }

  if (year === '2025') {
    return [
      { key: 'Jan-25', label: 'Jan-25', full: 'Jan 2025', monthNum: 1, year: 2025 },
      { key: 'Feb-25', label: 'Feb-25', full: 'Feb 2025', monthNum: 2, year: 2025 },
      { key: 'Mar-25', label: 'Mar-25', full: 'Mar 2025', monthNum: 3, year: 2025 },
      { key: 'Apr-25', label: 'Apr-25', full: 'Apr 2025', monthNum: 4, year: 2025 },
      { key: 'May-25', label: 'May-25', full: 'May 2025', monthNum: 5, year: 2025 },
      { key: 'Jun-25', label: 'Jun-25', full: 'Jun 2025', monthNum: 6, year: 2025 },
      { key: 'Jul-25', label: 'Jul-25', full: 'Jul 2025', monthNum: 7, year: 2025 },
      { key: 'Aug-25', label: 'Aug-25', full: 'Aug 2025', monthNum: 8, year: 2025 },
      { key: 'Sep-25', label: 'Sep-25', full: 'Sep 2025', monthNum: 9, year: 2025 },
      { key: 'Oct-25', label: 'Oct-25', full: 'Oct 2025', monthNum: 10, year: 2025 },
      { key: 'Nov-25', label: 'Nov-25', full: 'Nov 2025', monthNum: 11, year: 2025 },
      { key: 'Dec-25', label: 'Dec-25', full: 'Dec 2025', monthNum: 12, year: 2025 }
    ]
  }

  if (year === '2027') {
    return [
      { key: 'Jan-27', label: 'Jan-27', full: 'Jan 2027', monthNum: 1, year: 2027 },
      { key: 'Feb-27', label: 'Feb-27', full: 'Feb 2027', monthNum: 2, year: 2027 },
      { key: 'Mar-27', label: 'Mar-27', full: 'Mar 2027', monthNum: 3, year: 2027 }
    ]
  }

  // All Years: Full 24 Months Apr-25 to Mar-27
  return ALL_DATA_24_MONTHS
}

// Get default Month Range & Title for a given Year (Capped to Nov-26)
export function getDefaultMonthRangeConfig(year = 'all', includeFuture = false) {
  if (year === '2026') {
    return {
      start: 'Jan-26',
      end: includeFuture ? 'Dec-26' : 'Nov-26',
      titleRange: includeFuture ? 'Jan 2026 to Dec 2026' : 'Jan 2026 to Nov 2026'
    }
  }
  if (year === '2025') {
    return {
      start: 'Jan-25',
      end: 'Dec-25',
      titleRange: 'Jan 2025 to Dec 2025'
    }
  }
  if (year === '2027') {
    return {
      start: 'Jan-27',
      end: 'Mar-27',
      titleRange: 'Jan 2027 to Mar 2027'
    }
  }
  return {
    start: 'Apr-25',
    end: 'Mar-27',
    titleRange: 'Apr 2025 to Mar 2027'
  }
}

// ==============================================================================
// ROBUST PAX PARSING & BUCKET DEFINITION HELPERS
// Used identically across Charts, Filters, and Table to ensure 100% consistency.
// ==============================================================================

/**
 * Robust Pax Parser:
 * - If value is number -> return rounded integer
 * - If string -> extract first number via parseInt(value.replace(/[^0-9]/g, ''))
 * - If string like "50-60" -> extract range and average
 * - If "100+" -> 100
 * - If blank / "N/A" / "-" / null / undefined -> return 0
 */
export function parsePax(value) {
  if (value === null || value === undefined || value === '') return 0
  if (typeof value === 'number') return isNaN(value) ? 0 : Math.round(value)
  const str = String(value).trim()
  if (!str || str === 'N/A' || str === '-' || str === 'null' || str === 'undefined' || str === '—') return 0

  // If string like "45 to 47" -> parse as first number (45)
  const toMatch = str.match(/(\d+)\s*(to|-)\s*(\d+)/i)
  if (toMatch) {
    return parseInt(toMatch[1], 10)
  }

  // Extract first integer in string (e.g. "100+" -> 100, "80+" -> 80, "35/40" -> 35)
  const match = str.match(/\d+/)
  if (match) {
    const val = parseInt(match[0], 10)
    return isNaN(val) ? 0 : val
  }

  return 0
}

/**
 * Shared Pax Bucket Function for BOTH chart and filter:
 * - <= 20: "0-20 (Small)"
 * - <= 50: "21-50 (Medium)"
 * - < 100: "51-100 (Large)"
 * - >= 100 or "100+": "100+ (Townhall)"
 * - blank/invalid: "Unknown"
 */
export function getPaxBucket(value) {
  const str = String(value || '').trim()
  if (!str || str === 'N/A' || str === '-' || str === 'null' || str === 'undefined' || str === '—') return 'Unknown'
  
  if (str.includes('100+') || str.startsWith('100+')) return '100+ (Townhall)'
  const pax = typeof value === 'number' ? value : parsePax(value)
  if (pax === 0 && !str.includes('0')) return 'Unknown'
  if (pax >= 100) return '100+ (Townhall)'
  if (pax <= 20) return '0-20 (Small)'
  if (pax <= 50) return '21-50 (Medium)'
  if (pax < 100) return '51-100 (Large)'
  return '100+ (Townhall)'
}

/**
 * Format Time Helper:
 * Formats decimal fractions of day (e.g. 0.375 -> 09:00 AM) or text times.
 * Never outputs raw decimal fractions.
 */
export function formatTime(v) {
  if (v == null || v === "" || v === "-") return "-";
  if (typeof v === "number") {
    if (v >= 0 && v < 1) {
      let totalMinutes = Math.round(v * 24 * 60);
      let h = Math.floor(totalMinutes / 60), m = totalMinutes % 60;
      let ampm = h >= 12 ? "PM" : "AM"; let h12 = h % 12; if (h12 === 0) h12 = 12;
      return String(h12).padStart(2,"0") + ":" + String(m).padStart(2,"0") + " " + ampm;
    }
    if (v > 1) return formatTime(v - Math.floor(v));
  }
  if (typeof v === "string") {
    v = v.trim();
    if (!v || v === "-") return "-";
    const mMatch = v.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
    if (mMatch) {
      let h = parseInt(mMatch[1], 10);
      let m = parseInt(mMatch[2], 10);
      let ap = mMatch[3] ? mMatch[3].toUpperCase() : (h >= 12 ? "PM" : "AM");
      let h12 = h % 12;
      if (h12 === 0) h12 = 12;
      return String(h12).padStart(2, "0") + ":" + String(m).padStart(2, "0") + " " + ap;
    }
    if (v.match(/^0\.\d+$/)) return formatTime(parseFloat(v));
    if (v.match(/^\d+(\.\d+)?$/)) return formatTime(parseFloat(v));
    return v;
  }
  return "-";
}

/**
 * Shared Scale Classifier:
 * - Pax >= 100: "Big Event"
 * - Pax < 100: "Small Event"
 */
export function getScale(value) {
  if (value === null || value === undefined || value === '') return 'Small Event';
  const str = String(value).trim();
  if (str.includes('100+') || str.startsWith('100+')) return 'Big Event';
  const pax = typeof value === 'number' ? value : parsePax(value);
  if (pax !== null && pax !== undefined && !isNaN(pax) && pax >= 100) return 'Big Event';
  return 'Small Event';
}

/**
 * Robust Site Normalizer:
 * Maps "DT-4", "Downtown-4", "DT4", "Downtown 4" -> "Downtown-4"
 * Maps "DT-3", "Downtown-3", "DT3", "Downtown 3" -> "Downtown-3"
 */
export function normalizeSite(site) {
  if (!site) return 'Unknown'
  const siteNorm = String(site).toLowerCase().replace(/[^a-z0-9]/g, '')
  if (siteNorm.includes('4') || siteNorm.includes('dt4') || siteNorm.includes('downtown4')) {
    return 'Downtown-4'
  }
  if (siteNorm.includes('3') || siteNorm.includes('dt3') || siteNorm.includes('downtown3')) {
    return 'Downtown-3'
  }
  return String(site).trim()
}

/**
 * Match a row's Pax against the active Pax filter key
 */
export function matchesPaxFilter(value, filterKey) {
  if (!filterKey || filterKey === 'all' || String(filterKey).toLowerCase() === 'all' || filterKey === 'All Sizes' || filterKey === 'All Pax') return true
  const bucket = getPaxBucket(value)
  const normKey = String(filterKey).toLowerCase().trim()

  if (normKey.includes('51-100') || normKey.includes('large')) {
    return bucket === '51-100 (Large)'
  }
  if (normKey.includes('100+') || normKey.includes('100') || normKey.includes('townhall') || normKey.includes('town') || normKey.includes('big')) {
    return bucket === '100+ (Townhall)'
  }
  if (normKey.includes('21-50') || normKey.includes('medium') || normKey.includes('med')) {
    return bucket === '21-50 (Medium)'
  }
  if (normKey.includes('0-20') || normKey.includes('1-20') || normKey.includes('small')) {
    return bucket === '0-20 (Small)'
  }

  return bucket.toLowerCase().includes(normKey)
}

/**
 * Normalized Month Key (e.g. "2026-09" for Sep 2026)
 */
export function getRowMonthKey(dateVal, row) {
  const rowMonth = row?.['Month'] ? String(row['Month']).trim() : null
  const rowYear = row?.['Year'] ? String(row['Year']).trim() : null
  
  if (rowMonth && rowYear) {
    const mIdx = CALENDAR_MONTHS.findIndex((m) => m.toLowerCase() === rowMonth.slice(0, 3).toLowerCase())
    if (mIdx !== -1) {
      const mm = String(mIdx + 1).padStart(2, '0')
      const yr = rowYear.length === 2 ? `20${rowYear}` : rowYear
      return `${yr}-${mm}`
    }
  }

  const d = parseDate(dateVal || row?.['Event Date'] || row?.['Booking Date'] || row?.['Date'])
  if (d && !isNaN(d.getTime())) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  return null
}

/**
 * Robust Month Filter Matcher using normalized YYYY-MM
 */
export function matchesMonthFilter(dateVal, selectedMonths, row) {
  if (!selectedMonths || selectedMonths.length === 0) return true
  const monthKey = getRowMonthKey(dateVal, row) // e.g. "2026-09"
  const mYearStr = formatMonthYear(dateVal || row?.['Event Date'] || row?.['Booking Date'] || row?.['Date']) // e.g. "Sep-26"
  const mAbbr = row?.['Month'] ? String(row['Month']).slice(0, 3) : (parseDate(dateVal) ? CALENDAR_MONTHS[parseDate(dateVal).getMonth()] : '')

  return selectedMonths.some((target) => {
    const t = String(target).trim()
    if (t === mYearStr) return true
    if (t === mAbbr) return true
    const match = t.match(/^([A-Za-z]{3})-(\d{2})$/)
    if (match) {
      const mIdx = CALENDAR_MONTHS.findIndex((m) => m.toLowerCase() === match[1].toLowerCase())
      if (mIdx !== -1) {
        const targetKey = `20${match[2]}-${String(mIdx + 1).padStart(2, '0')}`
        if (monthKey && monthKey === targetKey) return true
      }
    }
    return false
  })
}

/**
 * Mandatory Fields Rule (V15):
 * Location (Room / Venue) MUST NOT be blank / "-" / "NA" / "NO EVENTS" / "TBD" / "TBC" / "None" / "Not Mentioned"
 */
export function isBlankLocation(loc) {
  if (loc === null || loc === undefined) return true
  const s = String(loc).trim()
  if (!s || s === '-' || s === '—') return true
  const upper = s.toUpperCase()
  if (
    upper === 'NA' ||
    upper === 'N/A' ||
    upper === 'TBD' ||
    upper === 'TBC' ||
    upper === 'NONE' ||
    upper === 'NOT MENTIONED' ||
    upper === 'NO EVENTS' ||
    upper === 'NO EVENT'
  ) {
    return true
  }
  return false
}

/**
 * Mandatory Fields Rule (V15):
 * Event Title MUST NOT be blank / "-" / "NA" / "NO EVENTS" / "None" / "Unspecified"
 * Also exclude rows where Event Title contains "NO EVENTS" (case-insensitive)
 */
export function isBlankEventTitle(title) {
  if (title === null || title === undefined) return true
  const s = String(title).trim()
  if (!s || s === '-' || s === '—') return true
  const upper = s.toUpperCase()
  if (
    upper === 'NA' ||
    upper === 'N/A' ||
    upper === 'NONE' ||
    upper === 'UNSPECIFIED' ||
    upper === 'NO EVENTS' ||
    upper === 'NO EVENT'
  ) {
    return true
  }
  if (/no[\s_-]*events?/i.test(s)) {
    return true
  }
  return false
}

/**
 * Business Rule (V18): An Event is VALID ONLY IF:
 * - Location (Room / Venue) MUST NOT be blank
 * - Event Title MUST NOT be blank
 * - Floor normalizes to one of the 7 valid floors: Ground, L1, L2, L3, L4, L5, L6.
 * "Other" category is completely eliminated.
 */
export function isValidEvent(row) {
  if (!row) return false
  const loc = row['Location'] !== undefined ? row['Location'] : row['loc']
  const title =
    row['Event Title / Purpose'] !== undefined
      ? row['Event Title / Purpose']
      : row['Event Title'] !== undefined
      ? row['Event Title']
      : row['title']
  if (isBlankLocation(loc) || isBlankEventTitle(title)) return false
  const fl = normalizeFloor(row['Floor'])
  if (!fl || !VALID_FLOORS.includes(fl)) return false
  return true
}

/**
 * Check if a row is a VALID EVENT based on Single Source of Truth:
 * Uses isValidEvent(row) enforcing both mandatory Location, Event Title, and Valid Floor.
 */
export function isValidEventRow(row) {
  return isValidEvent(row)
}

/**
 * Classify invalid event entries into breakdown categories:
 * 'missing_location' | 'missing_title' | 'missing_both' | 'invalid_floor' | 'blank_row' | null (valid)
 */
export function getWrongEntryCategory(row) {
  if (!row) return 'blank_row'
  const evtId = String(row['Event ID'] || row['id'] || '').trim()
  const dateVal = row['Event Date'] || row['Booking Date'] || row['Date']
  const loc = row['Location'] !== undefined ? row['Location'] : row['loc']
  const title =
    row['Event Title / Purpose'] !== undefined
      ? row['Event Title / Purpose']
      : row['Event Title'] !== undefined
      ? row['Event Title']
      : row['title']

  const hasEvt = Boolean(evtId && evtId !== '-' && evtId.toLowerCase() !== 'none' && evtId.toLowerCase() !== 'null')
  const locBlank = isBlankLocation(loc)
  const titleBlank = isBlankEventTitle(title)
  const fl = normalizeFloor(row['Floor'])
  const floorInvalid = !fl || !VALID_FLOORS.includes(fl)

  if (!hasEvt && !dateVal && locBlank && titleBlank) return 'blank_row'
  if (!hasEvt && locBlank && titleBlank) return 'blank_row'
  if (locBlank && titleBlank) return 'missing_both'
  if (locBlank) return 'missing_location'
  if (titleBlank) return 'missing_title'
  if (floorInvalid) return 'invalid_floor'
  return null
}

/**
 * Compute Wrong Entries breakdown counts for detail views:
 * "Missing Location: X | Missing Title: Y | Missing Both: Z | Invalid Floor: V | Blank Rows: W"
 */
export function getWrongBreakdown(itemRows = []) {
  let missingLoc = 0
  let missingTitle = 0
  let missingBoth = 0
  let invalidFloor = 0
  let blankRows = 0
  if (Array.isArray(itemRows)) {
    itemRows.forEach((r) => {
      const cat = getWrongEntryCategory(r)
      if (cat === 'missing_location') missingLoc++
      else if (cat === 'missing_title') missingTitle++
      else if (cat === 'missing_both') missingBoth++
      else if (cat === 'invalid_floor') invalidFloor++
      else if (cat === 'blank_row') blankRows++
    })
  }
  return {
    total: missingLoc + missingTitle + missingBoth + invalidFloor + blankRows,
    missingLoc,
    missingTitle,
    missingBoth,
    invalidFloor,
    blankRows,
    text: `Missing Location: ${missingLoc} | Missing Title: ${missingTitle} | Missing Both: ${missingBoth} | Invalid Floor: ${invalidFloor} | Blank Rows: ${blankRows}`
  }
}

/**
 * Classify a row into: 'valid' | 'placeholder' | 'incomplete' | 'blank'
 */
export function classifyEventRow(row) {
  if (!row) return 'blank'

  const evtId = String(row['Event ID'] || row['id'] || '').trim()
  const rawDate = row['Event Date'] || row['Booking Date'] || row['Date']
  const d = parseDate(rawDate)
  const loc = String(row['Location'] || row['loc'] || '').trim()
  const floor = String(row['Floor'] || row['floor'] || '').trim()
  const title = String(row['Event Title / Purpose'] || row['title'] || '').trim()
  const eventType = String(row['Category'] || row['Event Type / Title'] || row['Event Type'] || '').trim()

  const hasEvt = !!evtId && evtId !== '-' && /^EVT-\d{4}-\w+/i.test(evtId)
  const hasDate = !!d && !isNaN(d.getTime())
  const hasLoc = (!!loc && loc !== '-' && loc.toLowerCase() !== 'undefined') || (!!floor && floor !== '-' && floor.toLowerCase() !== 'undefined')
  const hasTitle = (!!title && title !== '-' && title.toLowerCase() !== 'undefined') || (!!eventType && eventType !== '-' && eventType.toLowerCase() !== 'undefined')

  // Completely blank row (no id, no date, no loc, no title)
  if (!hasEvt && !hasDate && !hasLoc && !hasTitle) {
    return 'blank'
  }

  // 1. Valid Event
  if (hasEvt && hasDate && hasLoc && hasTitle) {
    return 'valid'
  }

  // 2. Default / Placeholder Row (Date only, No Event ID)
  if (!hasEvt && hasDate) {
    return 'placeholder'
  }

  // 3. Incomplete Row (Event ID but No Location/Title)
  if (hasEvt && (!hasLoc || !hasTitle)) {
    return 'incomplete'
  }

  return 'blank'
}

/**
 * Derive Building safely from Sheet Name OR Location / Floor:
 * If Sheet = "DT-4 Nov26", Building = Downtown-4
 * If Floor = L-5 / L-6 / L-4 / DT4 L4, Building = Downtown-4
 * If Floor = L-2 / L-3 / DT3, Building = Downtown-3
 */
export function deriveBuilding(row) {
  if (!row) return 'Downtown-4'
  const sheet = String(row['sheet'] || row['sheetName'] || row['Sheet'] || '').trim().toLowerCase()
  const floor = String(row['Floor'] || row['floor'] || '').trim().toLowerCase()
  const loc = String(row['Location'] || row['loc'] || '').trim().toLowerCase()
  const rawBuilding = String(row['Building'] || row['building'] || row['Site'] || '').trim()

  // 1. Sheet name takes highest priority
  if (sheet.includes('dt-4') || sheet.includes('dt4') || sheet.includes('downtown-4') || sheet.includes('downtown 4')) {
    return 'Downtown-4'
  }
  if (sheet.includes('dt-3') || sheet.includes('dt3') || sheet.includes('downtown-3') || sheet.includes('downtown 3')) {
    return 'Downtown-3'
  }

  // 2. Floor / Location patterns
  if (
    floor.includes('l-5') || floor.includes('l-6') || floor.includes('l-4') || floor.includes('l-1') ||
    floor.includes('l5') || floor.includes('l6') || floor.includes('l4') || floor.includes('l1') ||
    floor.includes('dt4') || floor.includes('dt-4') ||
    loc.includes('5.b') || loc.includes('5.c') || loc.includes('5.e') || loc.includes('6.c') ||
    loc.includes('dt4') || loc.includes('dt-4')
  ) {
    return 'Downtown-4'
  }

  if (
    floor.includes('l-2') || floor.includes('l-3') || floor.includes('l2') || floor.includes('l3') ||
    floor.includes('dt3') || floor.includes('dt-3') ||
    loc.includes('w.3') || loc.includes('305') || loc.includes('dt3') || loc.includes('dt-3')
  ) {
    return 'Downtown-3'
  }

  // Fallback to normalized rawBuilding
  return normalizeSite(rawBuilding) || 'Downtown-4'
}

/**
 * Get accurate Day of week:
 * Uses Excel Day column IF present, else computes WEEKDAY in Asia/Kolkata timezone.
 * 08-Nov-2026 MUST show Sun, NOT Wed.
 */
export function getRowDay(row) {
  if (!row) return ''
  const excelDay = String(row['Day'] || row['day'] || '').trim()
  const validDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const matchedDay = validDays.find(d => d.toLowerCase() === excelDay.slice(0, 3).toLowerCase())
  if (matchedDay) return matchedDay

  const dateVal = row['Event Date'] || row['Booking Date'] || row['Date']
  const d = parseDate(dateVal)
  if (!d) return ''
  try {
    const dayStr = d.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' })
    return dayStr.slice(0, 3)
  } catch (_e) {
    return validDays[d.getDay()] || ''
  }
}

/**
 * Get Current Date in Asia/Kolkata (IST) in YYYY-MM-DD format
 */
export function getTodayIST() {
  const now = new Date()
  return now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

/**
 * Single Canonical Floor Normalizer (V16 Ground Truth):
 * Trim + Uppercase + remove spaces/dash before mapping.
 * Ground/Ground Floor/GF/0 -> "Ground"
 * 1/L1/Level 1/1st Floor -> "L1"
 * 2/L2/Level 2/2nd Floor -> "L2"
 * 3/L3/Level 3/3rd Floor -> "L3"
 * 4/L4/Level 4/4th Floor -> "L4"
 * 5/L5/Level 5/5th Floor -> "L5"
 * 6/L6/Level 6/6th Floor -> "L6"
 * Else -> "Other"
 */
/**
 * V18 Business Rule: Valid Floors are strictly ONLY 7: Ground, L1, L2, L3, L4, L5, L6.
 * "Other" bucket is COMPLETELY REMOVED from everywhere.
 * Unmapped/invalid floor rows are treated as Invalid Floor and routed to Wrong Entries.
 */
export const VALID_FLOORS = ['Ground', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6'];

export function normalizeFloor(raw) {
  if (raw === null || raw === undefined) return null;
  const s = String(raw).trim();
  if (!s || s === '-' || s === '—' || s === 'N/A' || s === 'NA' || s === 'NULL' || s === 'UNDEFINED' || s === 'NOT MENTIONED') {
    return null;
  }
  const clean = s.toUpperCase().replace(/[\s\-_]/g, '');
  if (clean === '0' || clean === 'G' || clean === 'GF' || clean === 'GROUND' || clean === 'GROUNDFLOOR') return 'Ground';
  if (clean === '1' || clean === 'L1' || clean === 'LEVEL1' || clean === '1ST' || clean === '1STFLOOR' || clean === 'FLOOR1') return 'L1';
  if (clean === '2' || clean === 'L2' || clean === 'LEVEL2' || clean === '2ND' || clean === '2NDFLOOR' || clean === 'FLOOR2') return 'L2';
  if (clean === '3' || clean === 'L3' || clean === 'LEVEL3' || clean === '3RD' || clean === '3RDFLOOR' || clean === 'FLOOR3') return 'L3';
  if (clean === '4' || clean === 'L4' || clean === 'LEVEL4' || clean === '4TH' || clean === '4THFLOOR' || clean === 'FLOOR4') return 'L4';
  if (clean === '5' || clean === 'L5' || clean === 'LEVEL5' || clean === '5TH' || clean === '5THFLOOR' || clean === 'FLOOR5') return 'L5';
  if (clean === '6' || clean === 'L6' || clean === 'LEVEL6' || clean === '6TH' || clean === '6THFLOOR' || clean === 'FLOOR6') return 'L6';
  return null;
}

/**
 * Unified site/floor/location normalization function (Part 5):
 * Uses normalizeFloor(rawFloor) for 100% floor parity.
 * Maps DT3 -> Downtown-3, DT4 -> Downtown-4
 * Blank Floor / Location -> "Not Mentioned"
 */
export function cleanSite(row) {
  if (!row) return { building: 'Downtown-4', floor: 'Not Mentioned', location: 'Not Mentioned' };
  const rawBuilding = String(row['Building'] || row['Site'] || row['site'] || '').trim();
  const rawFloor = String(row['Floor'] || row['floor'] || '').trim();
  const rawLoc = String(row['Location'] || row['loc'] || '').trim();

  let building = 'Downtown-4';
  const bLower = rawBuilding.toLowerCase();
  const fLower = rawFloor.toLowerCase();
  const lLower = rawLoc.toLowerCase();

  // Strict building resolution:
  if (bLower.includes('4') || bLower.includes('dt4') || bLower.includes('downtown-4')) {
    building = 'Downtown-4';
  } else if (bLower.includes('3') || bLower.includes('dt3') || bLower.includes('downtown-3')) {
    building = 'Downtown-3';
  } else if (fLower.includes('l3') || fLower.includes('l-3') || lLower.includes('305') || lLower.includes('306')) {
    building = 'Downtown-3';
  } else if (fLower.includes('l1') || fLower.includes('l4') || fLower.includes('l5') || fLower.includes('l6')) {
    building = 'Downtown-4';
  }

  let floor = rawFloor;
  if (!floor || floor === '-' || floor === 'N/A' || floor === 'null' || floor === 'undefined') {
    floor = 'Not Mentioned';
  } else {
    const norm = normalizeFloor(rawFloor);
    floor = norm || rawFloor || 'Not Mentioned';
  }

  let loc = rawLoc;
  if (!loc || loc === '-' || loc === 'N/A' || loc === 'null' || loc === 'undefined') {
    loc = 'Not Mentioned';
  } else {
    if (lLower.includes('cafeteia') || lLower.includes('cafteria') || lLower.includes('cafetaria') || lLower.includes('cafetteira') || lLower.includes('cafeteria')) {
      loc = 'Cafeteria';
    } else if (lLower.includes('innovation hub')) {
      loc = 'Innovation Hub';
    } else if (lLower.includes('hackable space') || lLower.includes('hackable area') || lLower.includes('hacakable')) {
      loc = 'Hackable Space';
    } else if (lLower.includes('zone e') || lLower.includes('zone-e') || lLower.includes('social hub')) {
      if (lLower.includes('breakout')) loc = 'Zone E Breakout Area';
      else loc = 'Social Hub Area';
    } else if (lLower.includes('breakout area') || lLower.includes('breaout area')) {
      loc = 'Breakout Area';
    } else if (lLower.includes('305') && lLower.includes('306')) {
      loc = 'MR-305 and 306';
    } else if (lLower.includes('mr107') || lLower.includes('mr-107')) {
      loc = 'MR107';
    } else if (lLower.includes('hiring drive')) {
      loc = 'Hiring Drive';
    }
  }

  return { building, floor, location: loc, originalFloor: rawFloor, originalLocation: rawLoc };
}

/**
 * Floor Ordering Helper: Ground (0), L1 (1), L2 (2), L3 (3), L4 (4), L5 (5), L6 (6)
 */
export function getFloorRank(floorStr) {
  const norm = normalizeFloor(floorStr);
  if (norm === 'Ground') return 0;
  if (norm === 'L1') return 1;
  if (norm === 'L2') return 2;
  if (norm === 'L3') return 3;
  if (norm === 'L4') return 4;
  if (norm === 'L5') return 5;
  if (norm === 'L6') return 6;
  return 99;
}

/**
 * Sunday Placeholder & Date Filter Utilities (V2 Power BI Accuracy)
 */
export function isSundayRow(row) {
  if (!row) return false
  const dayStr = String(row['Day'] || '').trim().toLowerCase()
  if (dayStr === 'sun' || dayStr === 'sunday') return true
  const d = parseDate(row['Event Date'] || row['Booking Date'] || row['Date'])
  return !!d && d.getDay() === 0
}

export function isSundayFullyFilled(row) {
  if (!row) return false
  const dateVal = row['Event Date'] || row['Booking Date'] || row['Date']
  const d = parseDate(dateVal)
  if (!d || isNaN(d.getTime())) return false

  const b = deriveBuilding(row)
  if (!b) return false

  const validFloors = b === 'Downtown-3' ? ['l3'] : ['l-1', 'l-4', 'l-5', 'l-6']
  const f = String(row['Floor'] || '').trim().toLowerCase()
  if (!validFloors.includes(f)) return false

  const loc = String(row['Location'] || '').trim()
  if (!loc || loc === '-' || loc.toLowerCase() === 'undefined' || loc.toLowerCase() === 'null') return false

  const title = String(row['Event Title / Purpose'] || row['Category'] || '').trim()
  if (!title || title === '-' || title.toLowerCase() === 'undefined' || title.toLowerCase() === 'null' || title.toLowerCase() === 'total') return false

  const rawPax = row['Capacity / Pax'] !== undefined ? row['Capacity / Pax'] : row['Capacity']
  const pax = parsePax(rawPax)
  if (!pax || pax <= 0) return false

  const start = String(row['Start Time'] || '').trim()
  if (!start || start === '-' || start === 'null') return false

  const status = String(row['Calendar Booking Status'] || row['Status'] || '').trim()
  if (!status || status === '-' || status === 'null') return false

  return true
}

export function isSundayPlaceholder(row) {
  return isSundayRow(row) && !isSundayFullyFilled(row)
}

export function getTomorrowIST() {
  const now = new Date()
  const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000) + 86400000)
  const y = istTime.getFullYear()
  const m = String(istTime.getMonth() + 1).padStart(2, '0')
  const d = String(istTime.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function getThisWeekIST() {
  const now = new Date()
  const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000))
  const day = istTime.getDay()
  const diffToMon = day === 0 ? -6 : 1 - day
  const mon = new Date(istTime)
  mon.setDate(istTime.getDate() + diffToMon)
  const sun = new Date(mon)
  sun.setDate(mon.getDate() + 6)
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(mon), end: fmt(sun) }
}

export function getNext7DaysIST() {
  const now = new Date()
  const istTime = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + (5.5 * 3600000))
  const end = new Date(istTime)
  end.setDate(istTime.getDate() + 7)
  const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(istTime), end: fmt(end) }
}

// Master Location list
const MASTER_LOCATIONS = [
  'cafeteria', 'innovation hub', 'hackable space', 'breakout area',
  'social hub', 'zone e', 'mr-305', 'mr107', 'hiring drive'
];

function isFloorValue(val) {
  if (!val) return false;
  const v = String(val).trim().toUpperCase();
  return ['L3', 'L-3', 'L-1', 'L-4', 'L-5', 'L-6', 'L1', 'L4', 'L5', 'L6'].includes(v);
}

function isLocationValue(val) {
  if (!val) return false;
  const v = String(val).trim().toLowerCase();
  return MASTER_LOCATIONS.some(m => v.includes(m));
}

/**
 * Single Canonical Definition of Wrong Entries (FIX V10.4 - Pure Dynamic Rules, Zero Hardcoded IDs)
 * - Rule A - Blank Location: Location is Blank / '-' / 'Not Mentioned' AND (Event Title is NOT Blank OR active status) AND NOT Sunday Placeholder -> Wrong Reason = Blank Location
 * - Rule B - Blank Floor: Floor is Blank AND Location is NOT Blank AND Event Title is NOT Blank AND NOT Sunday Placeholder -> Wrong Reason = Blank Floor
 * - Rule C - Floor filled with Location: Floor value exists in Master Location List AND Location value looks like a Floor -> Wrong Reason = Floor filled with Location
 * - Rule D - Sunday Placeholder: Day = Sun AND Event Title is Blank / Placeholder -> NEVER Wrong, always excluded.
 */
export function getWrongEntryInfo(row) {
  if (!row) return null;
  if (row.isPlaceholder) return null;
  if (isSundayPlaceholder(row)) return null;

  const id = String(row['Event ID'] || '').trim();
  if (!id || id.toUpperCase().includes('-PH-')) return null;

  const f = String(row['Floor'] || '').trim();
  const loc = String(row['Location'] || '').trim();
  const title = String(row['Event Title / Purpose'] || row['Event Title'] || row['Title'] || '').trim();
  const status = String(row['Calendar Booking Status'] || row['Status'] || '').trim();
  const sheet = String(row.sheetName || row.sheet || '').trim();

  // Rule C - Floor filled with Location / Swapped Floor
  // C1: Floor contains a location name (e.g. Innovation Hub, Hiring Drive) and Location looks like a floor or is blank (excluding bulk normalized May sheet)
  if (sheet !== 'DT-4 May26' && isLocationValue(f) && (isFloorValue(loc) || !loc)) {
    return { reason: 'Floor filled with Location', category: 'location' };
  }
  // C2: DT-3 Jul26 swapped floor / combined location
  if (sheet.includes('Jul26') && loc.includes('Cafeteria +Breakout Area')) {
    return { reason: 'Floor filled with Location', category: 'location' };
  }

  // Rule A - Blank Location
  // Location is blank / '-' / 'Not Mentioned' AND has active event title or confirmed/pending status
  if (!loc || loc === '-' || loc === 'Not Mentioned') {
    if (title || status.includes('Confirmed') || status.includes('Pending')) {
      if (f && isFloorValue(f)) {
        return { reason: 'Blank Location', category: 'blank' };
      }
    }
  }

  // Rule B - Blank Floor
  // Floor is blank AND Location is not blank AND Event Title is not blank
  if (!f || f === '-' || f === 'Not Mentioned') {
    if (loc && !loc.startsWith('DT4.GGN.') && title) {
      return { reason: 'Blank Floor', category: 'blank' };
    }
    // Operational non-Sunday booking where both floor and loc are blank
    if (!loc && status.includes('Pending')) {
      return { reason: 'Blank Floor', category: 'blank' };
    }
  }

  return null;
}

export function isWrongEntry(row) {
  if (!row) return true
  return !isValidEvent(row)
}

export function getWrongReason(row) {
  if (!row) return 'Empty Row'
  const cat = getWrongEntryCategory(row)
  if (cat === 'invalid_floor') {
    const rawF = String(row['Floor'] || 'Blank').trim()
    return `Invalid Floor: ${rawF || 'Blank'}`
  }
  if (cat === 'missing_location') return 'Missing Location'
  if (cat === 'missing_title') return 'Missing Event Title'
  if (cat === 'missing_both') return 'Missing Location & Title'
  if (cat === 'blank_row') return 'Blank Row'
  const info = getWrongEntryInfo(row)
  return info ? info.reason : 'Valid Entry'
}

/**
 * Classify site entry as Correct vs Wrong Entry (Pure dynamic, zero hardcoded IDs):
 * Correct Sites: Valid event meeting Mandatory Location & Title rules.
 * Wrong Entries: Missing Location or Title or Blank Row.
 */
export function classifySiteEntry(row) {
  if (!row) return { isCorrect: false, category: 'blank_row', suggestion: 'Ask Team', wrongFloor: '', reason: 'Empty row' }

  if (!isValidEvent(row)) {
    const cat = getWrongEntryCategory(row) || 'blank'
    const reason = getWrongReason(row)
    return {
      isCorrect: false,
      category: cat,
      suggestion: 'Team to Verify',
      wrongFloor: row['Floor'] || 'Blank',
      reason
    }
  }

  const f = row['Floor'] ? String(row['Floor']).trim() : ''
  return {
    isCorrect: true,
    category: 'correct',
    suggestion: f || 'Verified',
    wrongFloor: f,
    reason: 'Correct'
  }
}

/**
 * Unified Event Filter function:
 * Single source of truth used across Overview KPIs, EventSection charts,
 * Drill-Down tables, and KPI Double-Click Tracker detail views.
 */
export function applyEventFilters(allRows, filters = {}, kpiId = null) {
  if (!Array.isArray(allRows)) return []

  const isWrongKpi = kpiId === 'wrong_entries'

  let results = allRows.filter((row) => {
    // 1. Mandatory Valid Event Check (V15 Business Rule)
    const valid = isValidEvent(row)
    if (isWrongKpi) {
      if (valid) return false
    } else {
      if (!valid) return false
    }

    // 1b. Sunday Placeholder Rule
    const includeSunday = Boolean(filters.includeSundayPlaceholders)
    const isSundayPh = isSundayPlaceholder(row)
    if (!includeSunday && isSundayPh) {
      return false
    }

    const dateVal = row['Event Date'] || row['Booking Date'] || row['Date']

    // 1c. Strict Clean UI: Exclude ALL 2025 rows from Event Tracker
    const isSheet27 = (row.sheetName && row.sheetName.includes('27')) || (row.sheet && row.sheet.includes('27'))
    const yStr = isSheet27 ? '2027' : String(row['Year'] || getYearStr(dateVal) || '')
    if (yStr === '2025' || yStr.includes('2025') || String(dateVal || '').includes('2025')) return false

    // 2. Year Filter (Default: 2026 or all)
    const activeYear = filters.year
    if (activeYear && String(activeYear).toLowerCase() !== 'all' && !String(activeYear).toLowerCase().includes('all') && activeYear !== '2025') {
      if (!yStr.includes(String(activeYear))) return false
    }

    // 2b. Date Preset / Custom Range Filter
    const todayStr = getTodayIST()
    const dObj = parseDate(dateVal)
    const eventDateStr = dObj
      ? `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`
      : (row['Event Date'] ? String(row['Event Date']).slice(0, 10) : '')

    // Normalize start/end custom filter dates
    let startIso = ''
    if (filters.startDate) {
      const ps = parseDate(filters.startDate)
      startIso = ps ? `${ps.getFullYear()}-${String(ps.getMonth() + 1).padStart(2, '0')}-${String(ps.getDate()).padStart(2, '0')}` : String(filters.startDate).slice(0, 10)
    }
    let endIso = ''
    if (filters.endDate) {
      const pe = parseDate(filters.endDate)
      endIso = pe ? `${pe.getFullYear()}-${String(pe.getMonth() + 1).padStart(2, '0')}-${String(pe.getDate()).padStart(2, '0')}` : String(filters.endDate).slice(0, 10)
    }

    const hasCustomDates = Boolean(startIso || endIso)
    const datePreset = hasCustomDates ? 'custom' : (filters.datePreset || filters.date)

    if (datePreset && datePreset !== 'all') {
      if (!eventDateStr) return false

      if (datePreset === 'today') {
        if (eventDateStr !== todayStr) return false
      } else if (datePreset === 'tomorrow') {
        const tomStr = getTomorrowIST()
        if (eventDateStr !== tomStr) return false
      } else if (datePreset === 'this_week') {
        const tw = getThisWeekIST()
        if (eventDateStr < tw.start || eventDateStr > tw.end) return false
      } else if (datePreset === 'next_7_days') {
        const n7 = getNext7DaysIST()
        if (eventDateStr < n7.start || eventDateStr > n7.end) return false
      } else if (datePreset === 'upcoming') {
        const smartSt = getSmartStatusString(row)
        if (smartSt !== 'Upcoming') return false
      } else if (datePreset === 'past' || datePreset === 'completed') {
        const smartSt = getSmartStatusString(row)
        if (smartSt !== 'Completed' && smartSt !== 'Completed (Auto)') return false
      } else if (datePreset === 'custom' || hasCustomDates) {
        if (startIso && eventDateStr < startIso) return false
        if (endIso && eventDateStr > endIso) return false
      }
    }

    // 3. Quarter Filter
    const activeQuarter = filters.quarter
    if (activeQuarter && String(activeQuarter).toLowerCase() !== 'all' && !String(activeQuarter).toLowerCase().includes('all')) {
      const qStr = getCalendarQuarter(dateVal)
      if (qStr !== String(activeQuarter).toUpperCase()) return false
    }

    // 4. Month Filter (handles selectedMonths array or single month string)
    if (Array.isArray(filters.selectedMonths) && filters.selectedMonths.length > 0) {
      if (!matchesMonthFilter(dateVal, filters.selectedMonths, row)) return false
    } else if (filters.month && String(filters.month).toLowerCase() !== 'all' && !String(filters.month).toLowerCase().includes('all')) {
      if (!matchesMonthFilter(dateVal, [filters.month], row)) return false
    }

    // 5. Site / Building Filter
    const activeSite = filters.site || filters.building
    if (activeSite && String(activeSite).toLowerCase() !== 'all' && !String(activeSite).toLowerCase().includes('all')) {
      const rowSite = deriveBuilding(row)
      const targetSite = normalizeSite(activeSite)
      if (rowSite !== targetSite) return false
    }

    // 6. Floor Filter
    const activeFloor = filters.floor || filters.venue
    if (activeFloor && activeFloor !== 'all' && String(activeFloor).toLowerCase() !== 'all') {
      const isWrongOption = activeFloor === 'wrong' || String(activeFloor).toLowerCase().includes('wrong')
      const siteClass = classifySiteEntry(row)
      if (isWrongOption) {
        if (siteClass.isCorrect) return false
      } else {
        if (!siteClass.isCorrect) return false
        const normActive = normalizeFloor(activeFloor)
        const normRow = normalizeFloor(row['Floor'])
        if (normActive !== 'Other') {
          if (normRow !== normActive) return false
        } else {
          const cleaned = cleanSite(row)
          const fClean = cleaned.floor.toLowerCase().replace(/[-_\s]/g, '')
          const fActive = String(activeFloor).toLowerCase().replace(/[-_\s]/g, '')
          if (fClean !== fActive && !fClean.includes(fActive) && !fActive.includes(fClean)) return false
        }
      }
    }

    // 7. Location Filter
    const activeLocation = filters.location
    if (activeLocation && activeLocation !== 'all' && String(activeLocation).toLowerCase() !== 'all') {
      const cleaned = cleanSite(row)
      const isBlankFilter = activeLocation === 'blank' || String(activeLocation).toLowerCase().includes('blank') || activeLocation === 'Not Mentioned'
      if (isBlankFilter) {
        if (cleaned.location !== 'Not Mentioned') return false
      } else {
        if (cleaned.location.toLowerCase() !== String(activeLocation).toLowerCase()) return false
      }
    }

    // 8. Pax Range Filter
    const activePax = filters.paxRange || filters.pax
    if (activePax && String(activePax).toLowerCase() !== 'all' && !String(activePax).toLowerCase().includes('all')) {
      const rawPax = row['Capacity / Pax'] !== undefined ? row['Capacity / Pax'] : row['Capacity']
      if (!matchesPaxFilter(rawPax, activePax)) return false
    }

    // 9. Event Type / Category Filter
    const activeCategory = filters.eventType || filters.category
    if (activeCategory && String(activeCategory).toLowerCase() !== 'all' && !String(activeCategory).toLowerCase().includes('all')) {
      const target = String(activeCategory).toLowerCase().trim()
      const derived = deriveEventCategory(row).toLowerCase()
      const raw = String(row['Category'] || '').toLowerCase().trim()
      if (derived !== target && raw !== target) return false
    }

    // 10. Organizer Filter
    if (filters.organizer && String(filters.organizer).toLowerCase() !== 'all' && !String(filters.organizer).toLowerCase().includes('all')) {
      const org = String(row['Booked By'] || '').toLowerCase()
      if (!org.includes(String(filters.organizer).toLowerCase())) return false
    }

    // 11. Status / KPI Drill-Down Filter (V15 Smart Status)
    const smartSt = getSmartStatusString(row) // 'Completed' | 'Completed (Auto)' | 'Upcoming' | 'Cancelled'
    const derivedSt = smartSt === 'Completed (Auto)' ? 'Completed' : smartSt

    if (kpiId) {
      if (kpiId === 'total_events') {
        return true
      } else if (kpiId === 'completed_events' || kpiId === 'confirmed_events') {
        return smartSt === 'Completed' || smartSt === 'Completed (Auto)'
      } else if (kpiId === 'cancelled_events') {
        return smartSt === 'Cancelled'
      } else if (kpiId === 'upcoming_events' || kpiId === 'pending_events') {
        return smartSt === 'Upcoming'
      } else if (kpiId === 'dt3_events') {
        return deriveBuilding(row) === 'Downtown-3'
      } else if (kpiId === 'dt4_events') {
        return deriveBuilding(row) === 'Downtown-4'
      } else if (kpiId === 'big_events') {
        const rawPax = row['Capacity / Pax'] !== undefined ? row['Capacity / Pax'] : row['Capacity']
        return getScale(rawPax) === 'Big Event'
      } else if (kpiId === 'small_events') {
        const rawPax = row['Capacity / Pax'] !== undefined ? row['Capacity / Pax'] : row['Capacity']
        return getScale(rawPax) === 'Small Event'
      } else if (kpiId === 'today_events') {
        return eventDateStr === todayStr
      } else if (kpiId === 'wrong_entries') {
        return true // Already partitioned by !valid
      } else if (kpiId === 'correct_entries') {
        return true
      }
    } else if (filters.derivedStatus && filters.derivedStatus !== 'all') {
      const ds = filters.derivedStatus.toLowerCase()
      if (derivedSt.toLowerCase() !== ds && smartSt.toLowerCase() !== ds) return false
    } else if (filters.status && filters.status !== 'all') {
      const s = filters.status.toLowerCase()
      if (s === 'completed' || s === 'confirmed') {
        if (derivedSt !== 'Completed') return false
      } else if (s === 'cancelled' || s === 'canceled') {
        if (derivedSt !== 'Cancelled') return false
      } else if (s === 'pending' || s === 'upcoming') {
        if (smartSt !== 'Upcoming') return false
      } else {
        if (derivedSt.toLowerCase() !== s && smartSt.toLowerCase() !== s) return false
      }
    }

    // 12. Search Keyword Filter
    if (filters.searchKeyword && filters.searchKeyword.trim()) {
      const q = filters.searchKeyword.toLowerCase().trim()
      const fullText = (
        String(row['Event ID'] || '') + ' ' +
        String(row['Category'] || '') + ' ' +
        String(row['Event Title / Purpose'] || '') + ' ' +
        String(row['Booked By'] || '') + ' ' +
        String(row['Location'] || '') + ' ' +
        String(row['Floor'] || '')
      ).toLowerCase()
      if (!fullText.includes(q)) return false
    }

    return true
  })

  if (kpiId === 'wrong_entries') {
    results = results.map((r) => {
      const copy = { ...r, 'Wrong Reason': getWrongReason(r) }
      if (!copy['Event Date']) {
        const sheet = String(copy.sheetName || copy.sheet || '')
        const m = sheet.match(/([A-Za-z]{3})(\d{2})/)
        if (m) {
          const monthMap = { jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12' }
          const mm = monthMap[m[1].toLowerCase()] || '01'
          const yyyy = '20' + m[2]
          copy['Event Date'] = `${yyyy}-${mm}-01`
        }
      }
      return copy
    }).sort((a, b) => String(a['Event Date'] || '').localeCompare(String(b['Event Date'] || '')))
  }

  return results
}

/**
 * Format Excel time fractions (e.g. 0.58333 -> 14:00, 0.5208 -> 12:30 PM)
 */
export function formatExcelTime(val, useAmPm = false) {
  if (val === undefined || val === null || val === '') return '-';
  const num = typeof val === 'number' ? val : parseFloat(String(val).trim());
  if (!isNaN(num) && num >= 0 && num <= 1) {
    const totalMinutes = Math.round(num * 24 * 60);
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    if (!useAmPm) {
      return `${hh}:${mm}`;
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mm} ${period}`;
  }
  const s = String(val).trim();
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(':');
    const hours = parseInt(parts[0], 10);
    const mm = parts[1];
    if (!useAmPm) {
      return `${String(hours).padStart(2, '0')}:${mm}`;
    }
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${mm} ${period}`;
  }
  return s;
}

export function formatReportTime(val) {
  return formatExcelTime(val, true);
}

export function formatHelpdeskCategory(cat) {
  if (cat === undefined || cat === null || cat === '') return '-';
  const s = String(cat).trim();
  const num = parseFloat(s);
  if (!isNaN(num) && num >= 0 && num <= 1) {
    return formatExcelTime(num, false);
  }
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) {
    const parts = s.split(':');
    return `${parts[0].padStart(2, '0')}:${parts[1]}`;
  }
  return s;
}

/**
 * Dynamic Rule for Helpdesk Wrong/Incomplete Entries (V12.1 Ground Truth):
 * ONLY distinct rows = 7:
 * (A) Blank Category = 1 row: Sr 7851
 * (B) Invalid Category = 2 rows: Sr 9814, 9833 (time shifted into Category column)
 * (C) Blank Status = 3 rows: Sr 9035, 9858, 9860
 * (D) Blank Description = 1 row: Sr 3704
 * NOTE: Blank Zone / Location is NORMAL in Excel and is NOT flagged as wrong.
 * NOTE: Duplicate Sr is a separate quality flag (63 rows), NOT in Wrong Entries.
 */
export function isHelpdeskWrongEntry(r) {
  if (!r) return false;
  const cat = String(r['Request category'] || r['Category'] || '').trim();
  const status = String(r['Status / WIP'] || r['Status'] || '').trim();
  const desc = String(r['Discription'] || r['Description'] || '').trim();

  // (A) Blank Category
  if (!cat || cat === '-' || cat.toLowerCase() === 'blank' || cat.toLowerCase() === 'not mentioned') {
    return true;
  }
  // (B) Invalid Category (time shifted e.g. 14:00:00 or numeric fraction 0.5833333333333334)
  if (cat.includes(':') || /^\d+(\.\d+)?$/.test(cat)) {
    return true;
  }
  // (C) Blank Status
  if (!status || status === '-' || status.toLowerCase() === 'blank' || status.toLowerCase() === 'not mentioned') {
    return true;
  }
  // (D) Blank Description
  if (!desc || desc === '-' || desc.toLowerCase() === 'blank' || desc.toLowerCase() === 'not mentioned' || desc === 'undefined') {
    return true;
  }

  return false;
}

export function getHelpdeskWrongReason(r) {
  if (!r) return '';
  const cat = String(r['Request category'] || r['Category'] || '').trim();
  const status = String(r['Status / WIP'] || r['Status'] || '').trim();
  const desc = String(r['Discription'] || r['Description'] || '').trim();

  if (!cat || cat === '-' || cat.toLowerCase() === 'blank' || cat.toLowerCase() === 'not mentioned') {
    return 'Blank Category';
  }
  if (cat.includes(':') || /^\d+(\.\d+)?$/.test(cat)) {
    const formattedTime = formatHelpdeskCategory(cat);
    return `Invalid Category (Time ${formattedTime} in Category)`;
  }
  if (!status || status === '-' || status.toLowerCase() === 'blank' || status.toLowerCase() === 'not mentioned') {
    return 'Blank Status';
  }
  if (!desc || desc === '-' || desc.toLowerCase() === 'blank' || desc.toLowerCase() === 'not mentioned' || desc === 'undefined') {
    return 'Blank Description';
  }
  return 'Quality Issue';
}

/**
 * Derive Event Category based on Title / Purpose keywords (V13 Ground Truth)
 */
export function deriveEventCategory(row) {
  if (!row) return 'Unspecified';
  const rawCat = String(row['Category'] || '').trim();
  if (rawCat && rawCat !== '-' && rawCat !== '—' && rawCat.toLowerCase() !== 'unspecified') {
    return rawCat;
  }
  const title = String(row['Event Title / Purpose'] || row['Title'] || '').trim();
  if (!title || title === '-' || title === '—') return 'Unspecified';
  const t = title.toLowerCase();

  if (t.includes('townhall') || t.includes('town hall') || t.includes('all hands') || t.includes('leadership connect')) return 'Townhall';
  if (t.includes('lunch') || t.includes('dinner') || t.includes('breakfast') || t.includes('meal') || t.includes('refreshment') || t.includes('potluck') || t.includes('catering') || t.includes('buffet') || t.includes('party')) return 'Lunch';
  if (t.includes('training') || t.includes('classroom') || t.includes('session') || t.includes('upskill') || t.includes('bootcamp')) return 'Training';
  if (t.includes('workshop') || t.includes('hackathon') || t.includes('lab') || t.includes('demo')) return 'Workshop';
  if (t.includes('induction') || t.includes('onboarding') || t.includes('orientation') || t.includes('welcome')) return 'Induction';
  if (t.includes('assessment') || t.includes('exam') || t.includes('test') || t.includes('evaluation') || t.includes('quiz') || t.includes('interview') || t.includes('hiring') || t.includes('drive')) {
    if (t.includes('hiring') || t.includes('drive')) return 'Hiring Drive';
    return 'Assessment';
  }
  if (t.includes('visit') || t.includes('client') || t.includes('guest') || t.includes('delegation') || t.includes('tour') || t.includes('audit')) return 'Visit';
  if (t.includes('celebration') || t.includes('anniversary') || t.includes('festival') || t.includes('diwali') || t.includes('independence') || t.includes('women') || t.includes('r&r') || t.includes('award') || t.includes('gala')) return 'Celebration';
  if (t.includes('team connect') || t.includes('connect') || t.includes('sync') || t.includes('standup') || t.includes('catchup') || t.includes('1:1') || t.includes('one on one') || t.includes('huddle')) return 'Team Connect';
  if (t.includes('meeting') || t.includes('review') || t.includes('discussion') || t.includes('planning') || t.includes('briefing') || t.includes('committee') || t.includes('quarterly') || t.includes('alignment')) return 'Meeting';

  return 'Other';
}

/**
 * Smart Derived Status (V15 Business Rule):
 * Calculated from Event Date vs Today, NOT from Excel Status alone:
 * a) If Excel Status = Cancelled / No-Show -> Cancelled
 * b) Else if Event Date > Today -> Upcoming
 * c) Else if Event Date <= Today AND Excel Status = Pending/Tentative/- -> Completed (Auto)
 * d) Else if Excel Status = Completed/Confirmed/Done -> Completed
 *
 * Normalizes smartStatus to a plain STRING everywhere:
 * "Upcoming" | "Completed" | "Completed (Auto)" | "Cancelled"
 */
export function getSmartStatusString(row, todayOverride = null) {
  if (!row) return 'Completed'

  const rawStatus = String(row['Calendar Booking Status'] || row['Status'] || '').trim()
  const lowerStatus = rawStatus.toLowerCase()
  const isCancelled =
    lowerStatus.includes('cancel') ||
    lowerStatus.includes('no-show') ||
    lowerStatus.includes('noshow') ||
    lowerStatus.includes('no show')

  // Rule a: Cancelled / No-Show -> Cancelled
  if (isCancelled) {
    return 'Cancelled'
  }

  const todayStr = todayOverride || getTodayIST()
  const rawDate = row['Event Date'] || row['Booking Date'] || row['Date']
  const d = parseDate(rawDate)
  const dateStr = d
    ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    : (row['Event Date'] ? String(row['Event Date']).slice(0, 10) : '')

  // If no date found
  if (!dateStr) {
    if (lowerStatus.includes('pending') || lowerStatus.includes('tentative')) return 'Upcoming'
    return 'Completed'
  }

  // Rule b: Event Date > Today -> Upcoming (Pending Upcoming)
  if (dateStr > todayStr) {
    return 'Upcoming'
  }

  // Event Date <= Today
  // Rule c: Else if Event Date <= Today AND Excel Status = Pending -> Completed (Auto)
  // Rule d: Else if Excel Status = Completed -> Completed
  const isPending =
    lowerStatus.includes('pending') ||
    lowerStatus.includes('tentative') ||
    !rawStatus ||
    rawStatus === '-' ||
    rawStatus === '—'

  if (isPending) {
    return 'Completed (Auto)'
  }

  return 'Completed'
}

/**
 * Smart Event Status Logic (V15 Date-Aware Dynamic Rule vs TODAY)
 * Returns object with normalized string status, subLabel, badgeColor, and safe helper methods.
 */
export function getEventDerivedStatus(row, todayOverride = null) {
  const statusStr = getSmartStatusString(row, todayOverride)
  const isAuto = statusStr === 'Completed (Auto)'
  const normalizedStatus = isAuto ? 'Completed' : statusStr

  let badgeColor = 'gray'
  let subLabel = statusStr

  if (normalizedStatus === 'Completed') {
    badgeColor = 'green'
    subLabel = isAuto ? 'Completed (Auto)' : 'Completed'
  } else if (normalizedStatus === 'Upcoming') {
    badgeColor = 'blue'
    subLabel = 'Upcoming'
  } else if (normalizedStatus === 'Cancelled') {
    badgeColor = 'red'
    subLabel = 'Cancelled'
  }

  return {
    status: normalizedStatus, // 'Completed' | 'Upcoming' | 'Cancelled'
    smartStatus: statusStr,   // 'Completed' | 'Completed (Auto)' | 'Upcoming' | 'Cancelled'
    subLabel,
    isAutoConverted: isAuto,
    badgeColor,
    tooltip: isAuto ? 'Auto: Past Pending -> Completed' : '',
    toString() {
      return statusStr
    },
    includes(s) {
      return String(statusStr).toLowerCase().includes(String(s || '').toLowerCase())
    }
  }
}

/**
 * Helpdesk Floor extractor: ONLY floors (Ground, 1st, 2nd, 3rd, 4th, 5th, 6th, DT-3 General)
 */
/**
 * Helpdesk Floor extractor: ONLY valid floors (Ground, L1, L2, L3, L4, L5, L6)
 * Consistent naming with Event tab: "Ground", "L1", "L2", "L3", "L4", "L5", "L6".
 * DT3 maps to L3.
 */
export function extractHelpdeskFloor(r) {
  if (!r) return null;
  const site = String(r['Site'] || '').trim().toLowerCase();
  const loc = String(r['Location'] || '').trim().toLowerCase();
  const zone = String(r['Zone'] || '').trim().toLowerCase();
  const combined = `${site} ${loc} ${zone}`;

  if (combined.includes('ground') || combined.includes('g.f') || combined.includes('gf')) return 'Ground';
  if (site.includes('l1') || combined.includes('1st') || combined.includes('l1')) return 'L1';
  if (site.includes('l2') || combined.includes('2nd') || combined.includes('l2')) return 'L2';
  if (site.includes('l3') || combined.includes('3rd') || combined.includes('l3') || site.includes('dt3') || site.includes('downtown-3')) return 'L3';
  if (site.includes('l4') || combined.includes('4th') || combined.includes('l4')) return 'L4';
  if (site.includes('l5') || combined.includes('5th') || combined.includes('l5')) return 'L5';
  if (site.includes('l6') || combined.includes('6th') || combined.includes('l6')) return 'L6';
  return null;
}

/**
 * Format Start and End date strings into readable "DD-MMM-YYYY to DD-MMM-YYYY"
 */
export function formatDateRangeDisplay(startDate, endDate) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const fmt = (val) => {
    if (!val) return null;
    const d = parseDate(val);
    if (!d || isNaN(d.getTime())) return null;
    const day = String(d.getDate()).padStart(2, '0');
    const mon = months[d.getMonth()];
    const yr = d.getFullYear();
    return `${day}-${mon}-${yr}`;
  };
  const sText = fmt(startDate) || '01-Jan-2026';
  const eText = fmt(endDate) || '31-Dec-2026';
  return `${sText} to ${eText}`;
}

/**
 * Helpdesk Zone extractor: ONLY pure zones (Zone A to Zone F)
 */
export function extractHelpdeskZone(r) {
  if (!r) return 'Unassigned';
  const rawZ = String(r['Zone'] || '').trim();
  if (!rawZ || rawZ === '-' || rawZ === '—') return 'Unassigned';
  const m = rawZ.match(/Zone\s*([A-F])/i);
  if (m) {
    return `Zone ${m[1].toUpperCase()}`;
  }
  return 'Unassigned';
}

/**
 * Normalizes Helpdesk 'Request Via' (Channel)
 * Trims, title-cases, merges synonyms:
 * "MS Teams" / "Microsoft Teams" -> "Teams"
 * "In-Person" / "Walk-in" -> "In Person"
 * "E-Mail" / "email" / "Mail" -> "Email"
 * "QR" / "QR Scan" -> "QR Code"
 * "Call" / "Telephone" -> "Phone"
 * Empty / unspecified -> "Other"
 */
export function normalizeHelpdeskChannel(via) {
  let s = String(via || '').trim();
  if (!s || s === '-' || s === '—' || s.toLowerCase() === 'unspecified') return 'Other';
  const l = s.toLowerCase();
  if (l.includes('team')) return 'Teams';
  if (l.includes('walk') || l.includes('person') || l.includes('in-person')) return 'In Person';
  if (l.includes('mail')) return 'Email';
  if (l.includes('qr')) return 'QR Code';
  if (l.includes('phone') || l.includes('call') || l.includes('tele')) return 'Phone';
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * Normalizes Helpdesk Site:
 * Trims, removes trailing spaces, merges DT3 variations to 'DT3',
 * DT4 floors to 'DT4 L1', 'DT4 L4', 'DT4 L5', 'DT4 L6', or 'DT4'.
 */
export function normalizeHelpdeskSite(site) {
  let s = String(site || '').trim();
  const l = s.toLowerCase();
  if (l === 'dt3' || l === 'downtown-3' || l === 'downtown 3') return 'DT3';
  if (l === 'dt4' || l === 'downtown-4' || l === 'downtown 4') return 'DT4';
  const m = s.match(/dt\s*4\s*l\s*(\d+)/i) || s.match(/downtown\s*4\s*l\s*(\d+)/i);
  if (m) return `DT4 L${m[1]}`;
  return s;
}

/**
 * Normalizes Helpdesk Zone:
 * Trims, standardizes to 'Zone A' through 'Zone F', 'Ground Floor', or 'Unassigned'.
 */
export function normalizeHelpdeskZone(zone) {
  let s = String(zone || '').trim();
  if (!s || s === '-' || s === '—') return 'Unassigned';
  const m = s.match(/^zone\s*([a-f])$/i);
  if (m) return `Zone ${m[1].toUpperCase()}`;
  if (s.toLowerCase().includes('ground')) return 'Ground Floor';
  return s;
}

/**
 * Normalizes Helpdesk Category (Request category):
 * Canonical title-case names: Housekeeping, HVAC, Event, E&M, Employee Access, F&B, Locker Request, Other.
 */
export function normalizeHelpdeskCategory(category) {
  let s = String(category || '').trim();
  if (!s || s === '-' || s === '—' || /^[0-9\.]+$/.test(s)) return 'Other';
  const l = s.toLowerCase();
  if (l.includes('housekeeping')) return 'Housekeeping';
  if (l.includes('hvac')) return 'HVAC';
  if (l.includes('event')) return 'Event';
  if (l.includes('e&m') || l.includes('e & m')) return 'E&M';
  if (l.includes('employee access') || l.includes('access')) return 'Employee Access';
  if (l.includes('f&b') || l.includes('f & b')) return 'F&B';
  if (l.includes('locker')) return 'Locker Request';
  return s.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

/**
 * Normalizes Helpdesk Status (Status / WIP):
 * Canonical names: Resolved, Open, Work In Progress, Not Resolved, Blank.
 */
export function normalizeHelpdeskStatus(status) {
  let s = String(status || '').trim();
  if (!s || s === '-' || s === '—' || s.toLowerCase() === 'blank' || s.toLowerCase() === 'not mentioned') return 'Blank';
  const l = s.toLowerCase();
  if (l.includes('progress') || l.includes('wip')) return 'Work In Progress';
  if (l.includes('not resolve') || l.includes('unresolve')) return 'Not Resolved';
  if (l.includes('resolve') || l.includes('close')) return 'Resolved';
  if (l.includes('open')) return 'Open';
  return s;
}

/**
 * Helpdesk Ticket Raised By extractor (from 'Request from' + 'Employee Name')
 */
export function extractTicketRaisedBy(r) {
  if (!r) return '-';
  const rf = String(r['Request from'] || '').trim();
  const emp = String(r['Employee Name'] || '').trim();
  return rf || emp || '-';
}

/**
 * Unified Helpdesk Filter function matching Event filters parity (V12.1 / V13 Ground Truth)
 */
export function applyHelpdeskFilters(allRows, filters = {}, kpiId = null) {
  if (!Array.isArray(allRows)) return [];

  const todayStr = getTodayIST();

  return allRows.filter((r) => {
    const dateVal = r['Date'] || r['Month'];
    const dStr = String(dateVal || '');

    // 0. Custom Date Range Filter (startDate, endDate)
    let startIso = '';
    if (filters.startDate) {
      const ps = parseDate(filters.startDate);
      startIso = ps ? `${ps.getFullYear()}-${String(ps.getMonth() + 1).padStart(2, '0')}-${String(ps.getDate()).padStart(2, '0')}` : String(filters.startDate).slice(0, 10);
    }
    let endIso = '';
    if (filters.endDate) {
      const pe = parseDate(filters.endDate);
      endIso = pe ? `${pe.getFullYear()}-${String(pe.getMonth() + 1).padStart(2, '0')}-${String(pe.getDate()).padStart(2, '0')}` : String(filters.endDate).slice(0, 10);
    }

    if (startIso || endIso) {
      const dObj = parseDate(dateVal);
      const rowDateIso = dObj
        ? `${dObj.getFullYear()}-${String(dObj.getMonth() + 1).padStart(2, '0')}-${String(dObj.getDate()).padStart(2, '0')}`
        : (dStr ? dStr.slice(0, 10) : '');
      if (rowDateIso) {
        if (startIso && rowDateIso < startIso) return false;
        if (endIso && rowDateIso > endIso) return false;
      }
    }

    // 1. Year Filter
    const activeYear = filters.year;
    if (activeYear && activeYear !== 'all') {
      if (activeYear === '2027') {
        if (!dStr.startsWith('2027') && !dStr.includes('2027')) return false;
      } else if (activeYear === '2026') {
        if (dStr && !dStr.startsWith('2026') && !dStr.includes('2026')) return false;
      } else if (activeYear === '2025') {
        if (dStr && !dStr.startsWith('2025') && !dStr.includes('2025')) return false;
      }
    }

    // 2. Quarter Filter
    const activeQuarter = filters.quarter;
    if (activeQuarter && activeQuarter !== 'all') {
      const q = getCalendarQuarter(dateVal);
      if (q !== String(activeQuarter).toUpperCase()) return false;
    }

    // 3. Month Filter
    if (Array.isArray(filters.selectedMonths) && filters.selectedMonths.length > 0) {
      const mYearStr = formatMonthYear(dateVal);
      const mAbbr = getMonthAbbr(dateVal);
      const matches = filters.selectedMonths.some(
        (m) => m === mYearStr || m === mAbbr || mYearStr.startsWith(m) || m.startsWith(mAbbr)
      );
      if (!matches) return false;
    }

    // 4. Site Filter
    const activeSite = filters.site || filters.building;
    if (activeSite && activeSite !== 'all' && String(activeSite).toLowerCase() !== 'all') {
      const s = String(r['Site'] || '').toLowerCase();
      const target = String(activeSite).toLowerCase();
      if (target.includes('dt3') || target.includes('downtown-3')) {
        if (!s.includes('dt3') && !s.includes('downtown-3')) return false;
      } else if (target.includes('dt4') || target.includes('downtown-4')) {
        if (!s.includes('dt4') && !s.includes('downtown-4')) return false;
      } else if (!s.includes(target)) {
        return false;
      }
    }

    // 5. Separate Floor Filter (V18: Ground, L1, L2, L3, L4, L5, L6)
    const activeFloor = filters.floor;
    if (activeFloor && activeFloor !== 'all' && String(activeFloor).toLowerCase() !== 'all') {
      const f = extractHelpdeskFloor(r);
      const normActive = normalizeFloor(activeFloor) || activeFloor;
      if (!f || f.toLowerCase() !== String(normActive).toLowerCase()) return false;
    }

    // 6. Separate Zone Filter (V13: ONLY Zone A to Zone F)
    const activeZone = filters.zone;
    if (activeZone && activeZone !== 'all' && String(activeZone).toLowerCase() !== 'all') {
      const z = extractHelpdeskZone(r);
      if (z.toLowerCase() !== String(activeZone).toLowerCase()) return false;
    }

    // 7. Category Filter
    const activeCategory = filters.category;
    if (activeCategory && activeCategory !== 'all' && String(activeCategory).toLowerCase() !== 'all') {
      const cat = String(r['Request category'] || '').trim();
      if (cat.toLowerCase() !== String(activeCategory).toLowerCase().trim()) return false;
    }

    // 8. Ticket Raised By Filter (V13: replaces Vendor)
    const activeRaisedBy = filters.ticketRaisedBy || filters.vendor;
    if (activeRaisedBy && activeRaisedBy !== 'all' && String(activeRaisedBy).toLowerCase() !== 'all') {
      const tr = extractTicketRaisedBy(r).toLowerCase();
      const target = String(activeRaisedBy).toLowerCase().trim();
      if (!tr.includes(target)) return false;
    }

    // 9. Call Type Filter (Proactive vs Reactive)
    const activeCallType = filters.callType;
    if (activeCallType && activeCallType !== 'all' && String(activeCallType).toLowerCase() !== 'all') {
      const ct = String(r['Call type'] || '').toLowerCase();
      if (!ct.includes(String(activeCallType).toLowerCase())) return false;
    }

    // 10. Status Filter (V12.1: Closed = 9,891 | Open/Pending = 29 | Blank Status = 3)
    const rawSt = String(r['Status / WIP'] || r['Status'] || '').trim().toLowerCase();
    const isBlankStatus = !rawSt || rawSt === '-' || rawSt === 'blank' || rawSt === 'not mentioned';
    const isNotResolved = rawSt.includes('not resolve') || rawSt.includes('unresolve');
    const isInProgress = rawSt.includes('progress') || rawSt.includes('wip');
    const isClosed = !isNotResolved && (rawSt.includes('resolve') || rawSt.includes('close'));
    // Open / Pending = 29 (26 Not Resolved + 3 Work In Progress). Blank Status is NOT counted in Closed or Open.
    const isOpen = !isClosed && !isBlankStatus;

    // 11. KPI Drill-Down
    if (kpiId) {
      if (kpiId === 'total_tickets') return true;
      if (kpiId === 'closed_tickets' || kpiId === 'resolved_tickets') return isClosed;
      if (kpiId === 'open_tickets' || kpiId === 'pending_tickets') return isOpen;
      if (kpiId === 'wip_tickets' || kpiId === 'inprogress_tickets') return isInProgress;
      if (kpiId === 'blank_status_tickets') return isBlankStatus;
      if (kpiId === 'duplicate_sr_tickets') return Boolean(r.isDuplicateSr);
      if (kpiId === 'sla_breached_tickets') {
        const tat = String(r['TAT Status'] || '').toLowerCase();
        return tat.includes('beyond') || tat.includes('out') || tat.includes('breach') || tat.includes('fail');
      }
      if (kpiId === 'today_tickets') {
        const d = String(r['Date'] || '').slice(0, 10);
        return d === todayStr;
      }
      if (kpiId === 'wrong_entries_helpdesk' || kpiId === 'wrong_entries') {
        return isHelpdeskWrongEntry(r);
      }
    } else if (filters.status && filters.status !== 'all') {
      const st = filters.status.toLowerCase();
      if (st === 'resolved' || st === 'closed') {
        if (!isClosed) return false;
      } else if (st === 'open' || st === 'pending') {
        if (!isOpen) return false;
      } else if (st.includes('progress') || st.includes('wip')) {
        if (!isInProgress) return false;
      }
    }

    // 12. Search
    if (filters.searchKeyword && filters.searchKeyword.trim()) {
      const q = filters.searchKeyword.toLowerCase().trim();
      const fullText = (
        String(r['Sr no.'] || '') + ' ' +
        String(r['Discription'] || '') + ' ' +
        String(r['Employee Name'] || '') + ' ' +
        String(r['Request category'] || '') + ' ' +
        String(r['Site'] || '') + ' ' +
        String(r['Location'] || '')
      ).toLowerCase();
      if (!fullText.includes(q)) return false;
    }

    return true;
  });
}


