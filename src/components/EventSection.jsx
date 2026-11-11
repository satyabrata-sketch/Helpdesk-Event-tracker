// ==============================================================================
// EVENT OPERATIONS DASHBOARD (Tableau Style • 100% English • CBRE Theme)
// Completely aligned with Master_Event_Tracker_2026 single source of truth.
// Structure:
// 1. Wrong Entry Box (Part 2) - Red/Orange alert box on top, 480 wrong entries
// 2. Exactly 8 KPI Cards (Part 3) - Clickable, detail count == KPI count
// 3. Event Filter Shelf (Part 4) - 2026 only, 5 valid floors + Wrong, searchable locations
// 4. Site-wise Table (Part 4) - Building | Floor | Location | Total | Big | Small | Confirmed | Canceled | Pending
// 5. 5 Charts with Error Boundaries:
//    - Chart 1: Events by Building
//    - Chart 2: Events by Floor (5 Correct + Wrong)
//    - Chart 3: Events by Location (Top 15 + Others)
//    - Chart 4: Monthly Trend (Jan to Dec 2026)
//    - Chart 5: Events by Category
// 6. Detailed Events Table (50/page, search, sort, SheetJS download)
// ==============================================================================
import React, { useState, useMemo, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ComposedChart
} from 'recharts'
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  MapPin,
  TrendingUp,
  Search,
  FileSpreadsheet,
  Layers,
  Building2,
  Download,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Award,
  AlertTriangle,
  ArrowUpDown,
  Copy
} from 'lucide-react'
import { ChartCard } from './ChartCard'
import { EventFilterShelf } from './EventFilterShelf'
import { WrongEntryBox } from './WrongEntryBox'
import { ErrorBoundary } from './ErrorBoundary'
import {
  formatMonthYear,
  parseDate,
  formatDateDisplay,
  formatDateRangeDisplay,
  formatTime,
  parsePax,
  getPaxBucket,
  matchesPaxFilter,
  matchesMonthFilter,
  getScale,
  normalizeSite,
  isValidEventRow,
  isValidEvent,
  getSmartStatusString,
  getWrongEntryCategory,
  getWrongBreakdown,
  classifySiteEntry,
  cleanSite,
  deriveBuilding,
  getRowDay,
  getTodayIST,
  isSundayPlaceholder,
  applyEventFilters,
  deriveEventCategory,
  getEventDerivedStatus,
  getFloorRank,
  normalizeFloor
} from '../lib/dateUtils'
import { exportToExcel } from '../lib/excelExport'

// CBRE Brand Colors
const CBRE_DARK_GREEN = '#003231'
const CBRE_GREEN = '#00A651'
const CBRE_LIME = '#A6CE39'
const CBRE_YELLOW = '#FFC72C'
const CBRE_ORANGE = '#FF6A13'
const CBRE_BLUE = '#005EB8'
const CBRE_PURPLE = '#5B2C6F'
const CBRE_RED = '#E30613'
const CBRE_TEAL = '#00A19A'

const CATEGORY_COLORS = [
  '#003231', '#00A651', '#005EB8', '#FF6A13', '#FFC72C',
  '#5B2C6F', '#00A19A', '#E30613', '#7CB342', '#3949AB'
]

export const EventSection = React.memo(function EventSection({
  rows = [],
  fullSheetData,
  activeYear = 'all',
  filters = {},
  onFilterChange,
  onResetFilters,
  distinctOptions,
  activeFilterCount,
  onSheetChange,
  onNavigateTab,
  onKpiDoubleClick,
  onSaveFileIdAndResync,
  onOpenSettings,
  onSyncNow,
  isSyncing = false,
  lastSyncedAt,
  showToast
}) {
  // Master Year Flags (Top-Level Scope)
  const isYear2027 = filters?.year === '2027'
  const isYear2026 = filters?.year === '2026'
  const isYearAll = !filters?.year || filters.year === 'all'

  // Master unfiltered rows from sheet
  const allMasterRows = fullSheetData?.rows || rows
  const meta = fullSheetData?.meta || {}
  const [customFileUrlInput, setCustomFileUrlInput] = useState('')

  // ----------------------------------------------------------------------------
  // 1. DYNAMIC REPORTING PERIOD & SUBTITLE (V14 Standard Subtitle Parity)
  // Format: "Reporting Period: [Selected Start Date] to [Selected End Date] | Site: [Selected Site - All / DT-3 / DT-4] | Updated: [Today's Date]"
  // ----------------------------------------------------------------------------
  const chartSubtitle = useMemo(() => {
    const rangeDisplay = formatDateRangeDisplay(
      filters?.startDate || (isYear2027 ? '2027-01-01' : '2026-01-01'),
      filters?.endDate || (isYear2027 ? '2027-12-31' : '2026-12-31')
    )

    let siteStr = 'All'
    if (filters?.site === 'Downtown-3') siteStr = 'DT-3'
    else if (filters?.site === 'Downtown-4') siteStr = 'DT-4'

    const today = new Date()
    const d = String(today.getDate()).padStart(2, '0')
    const m = today.toLocaleString('en-US', { month: 'short' })
    const y = today.getFullYear()
    const todayStr = `${d}-${m}-${y}`

    return `Reporting Period: ${rangeDisplay} | Site: ${siteStr} | Updated: ${todayStr}`
  }, [filters?.startDate, filters?.endDate, filters?.site, isYear2027])

  const reportingPeriodText = chartSubtitle

  // ----------------------------------------------------------------------------
  // 2. LOCATION COUNTS FOR FILTER SHELF
  // ----------------------------------------------------------------------------
  const locationCounts = useMemo(() => {
    const locMap = {}
    allMasterRows.forEach((r) => {
      const cleaned = cleanSite(r)
      const loc = cleaned.location === 'Not Mentioned' ? 'Location Blank (649)' : cleaned.location
      locMap[loc] = (locMap[loc] || 0) + 1
    })
    return Object.entries(locMap).sort((a, b) => b[1] - a[1])
  }, [allMasterRows])

  // ----------------------------------------------------------------------------
  // 3. ROW 1: 10 EVENT KPIS (Part 1 • V2 Master Prompt)
  // Single array filtering: All 10 boxes recalculate from the same `rows` array
  // ----------------------------------------------------------------------------
  const todayStr = getTodayIST()
  const todayIsSun = new Date().getDay() === 0

  const kpis = useMemo(() => {
    const total = rows.length
    let completedCount = 0
    let completedDt3 = 0
    let completedDt4 = 0
    let cancelledCount = 0
    let cancelledDt3 = 0
    let cancelledDt4 = 0
    let noShowCount = 0
    let upcomingCount = 0
    let upcomingDt3 = 0
    let upcomingDt4 = 0
    let dt3Count = 0
    let dt4Count = 0
    let bigCount = 0
    let smallCount = 0
    let dt3Big = 0
    let dt4Big = 0
    let dt3Small = 0
    let dt4Small = 0

    let todayCount = 0
    let todayDt3 = 0
    let todayDt4 = 0
    let todayBig = 0

    rows.forEach((r) => {
      const smartSt = getSmartStatusString(r)
      const b = deriveBuilding(r)

      if (smartSt === 'Cancelled') {
        const rawStatus = String(r['Calendar Booking Status'] || r['Status'] || '').toLowerCase()
        const isNoShow = rawStatus.includes('no-show') || rawStatus.includes('noshow') || rawStatus.includes('no show')
        if (isNoShow) noShowCount++
        else cancelledCount++
        if (b === 'Downtown-3') cancelledDt3++
        else cancelledDt4++
      } else if (smartSt === 'Completed' || smartSt === 'Completed (Auto)') {
        completedCount++
        if (b === 'Downtown-3') completedDt3++
        else completedDt4++
      } else if (smartSt === 'Upcoming') {
        upcomingCount++
        if (b === 'Downtown-3') upcomingDt3++
        else upcomingDt4++
      }

      if (b === 'Downtown-3') dt3Count++
      else dt4Count++

      const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity']
      const sc = getScale(rawPax)
      if (sc === 'Big Event') {
        bigCount++
        if (b === 'Downtown-3') dt3Big++
        else dt4Big++
      } else {
        smallCount++
        if (b === 'Downtown-3') dt3Small++
        else dt4Small++
      }

      // Today's events: strictly count events where Event Date == todayStr
      const ed = r['Event Date'] ? String(r['Event Date']).slice(0, 10) : ''
      if (ed === todayStr) {
        todayCount++
        if (b === 'Downtown-3') todayDt3++
        else todayDt4++
        if (sc === 'Big Event') todayBig++
      }
    })

    // Wrong entries: computed from all master rows matching active filters
    const wrongRows = applyEventFilters(allMasterRows, filters, 'wrong_entries')
    const wrongBreakdown = getWrongBreakdown(wrongRows)

    return {
      total,
      completedCount,
      completedDt3,
      completedDt4,
      cancelledTotal: cancelledCount + noShowCount,
      cancelledCount,
      cancelledDt3,
      cancelledDt4,
      noShowCount,
      upcomingCount,
      upcomingDt3,
      upcomingDt4,
      dt3Count,
      dt4Count,
      bigCount,
      smallCount,
      dt3Big,
      dt4Big,
      dt3Small,
      dt4Small,
      todayCount,
      todayDt3,
      todayDt4,
      todayBig,
      wrongCount: wrongBreakdown.total,
      wrongLoc: wrongBreakdown.missingLoc,
      wrongTitle: wrongBreakdown.missingTitle,
      wrongBoth: wrongBreakdown.missingBoth,
      blankRows: wrongBreakdown.blankRows,
      wrongBlank: wrongBreakdown.missingBoth + wrongBreakdown.blankRows
    }
  }, [rows, allMasterRows, filters, todayStr])

  // On-demand KPI drill-down handler (eliminates 10x heavy filtering per render pass)
  const handleKpiCardClick = (kpiKey) => {
    if (!onKpiDoubleClick) return
    const filteredRows = applyEventFilters(allMasterRows, filters, kpiKey)
    onKpiDoubleClick(kpiKey, filteredRows)
  }

  // ----------------------------------------------------------------------------
  // 4. SITE-WISE AGGREGATION TABLE (Grouped Strictly DT-3 then DT-4 with Subtotals)
  // ----------------------------------------------------------------------------
  const siteWiseTableData = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const cleaned = cleanSite(r)
      const b = cleaned.building
      const f = cleaned.floor
      const l = cleaned.location

      if (f === 'Not Mentioned' || l === 'Not Mentioned' || f === 'Blank' || l === 'Blank') {
        return
      }

      const key = `${b}|${f}|${l}`

      if (!map[key]) {
        map[key] = {
          building: b,
          floor: f,
          location: l,
          total: 0,
          big: 0,
          small: 0,
          confirmed: 0,
          canceled: 0,
          pending: 0
        }
      }

      const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity']
      const sc = getScale(rawPax)
      const derived = getEventDerivedStatus(r)

      map[key].total++
      if (sc === 'Big Event') map[key].big++
      else map[key].small++

      if (derived.status === 'Completed') {
        map[key].confirmed++
      } else if (derived.status === 'Cancelled') {
        map[key].canceled++
      } else {
        map[key].pending++
      }
    })

    const all = Object.values(map)
    const dt3 = all.filter((r) => r.building === 'Downtown-3').sort((a, b) => {
      const diff = getFloorRank(a.floor) - getFloorRank(b.floor)
      if (diff !== 0) return diff
      return b.total - a.total
    })
    const dt4 = all.filter((r) => r.building === 'Downtown-4').sort((a, b) => {
      const diff = getFloorRank(a.floor) - getFloorRank(b.floor)
      if (diff !== 0) return diff
      return b.total - a.total
    })

    const calcSubtotal = (list, name) =>
      list.reduce(
        (acc, curr) => ({
          name,
          total: acc.total + curr.total,
          big: acc.big + curr.big,
          small: acc.small + curr.small,
          confirmed: acc.confirmed + curr.confirmed,
          canceled: acc.canceled + curr.canceled,
          pending: acc.pending + curr.pending
        }),
        { name, total: 0, big: 0, small: 0, confirmed: 0, canceled: 0, pending: 0 }
      )

    return {
      dt3Rows: dt3,
      dt4Rows: dt4,
      dt3Subtotal: calcSubtotal(dt3, 'Downtown-3 (DT-3) Subtotal'),
      dt4Subtotal: calcSubtotal(dt4, 'Downtown-4 (DT-4) Subtotal'),
      combined: [...dt3, ...dt4]
    }
  }, [rows])

  const [siteTableSearch, setSiteTableSearch] = useState('')

  const filteredSiteTable = useMemo(() => {
    if (!siteTableSearch.trim()) return siteWiseTableData
    const q = siteTableSearch.toLowerCase().trim()
    const filterFn = (r) =>
      r.building.toLowerCase().includes(q) ||
      r.floor.toLowerCase().includes(q) ||
      r.location.toLowerCase().includes(q)

    const dt3 = siteWiseTableData.dt3Rows.filter(filterFn).sort((a, b) => {
      const diff = getFloorRank(a.floor) - getFloorRank(b.floor)
      if (diff !== 0) return diff
      return b.total - a.total
    })
    const dt4 = siteWiseTableData.dt4Rows.filter(filterFn).sort((a, b) => {
      const diff = getFloorRank(a.floor) - getFloorRank(b.floor)
      if (diff !== 0) return diff
      return b.total - a.total
    })

    const calcSubtotal = (list, name) =>
      list.reduce(
        (acc, curr) => ({
          name,
          total: acc.total + curr.total,
          big: acc.big + curr.big,
          small: acc.small + curr.small,
          confirmed: acc.confirmed + curr.confirmed,
          canceled: acc.canceled + curr.canceled,
          pending: acc.pending + curr.pending
        }),
        { name, total: 0, big: 0, small: 0, confirmed: 0, canceled: 0, pending: 0 }
      )

    return {
      dt3Rows: dt3,
      dt4Rows: dt4,
      dt3Subtotal: calcSubtotal(dt3, 'Downtown-3 (DT-3) Subtotal'),
      dt4Subtotal: calcSubtotal(dt4, 'Downtown-4 (DT-4) Subtotal'),
      combined: [...dt3, ...dt4]
    }
  }, [siteWiseTableData, siteTableSearch])

  // ----------------------------------------------------------------------------
  // 5. 7 STANDARDIZED CHARTS DATA (V14 EVENT PERFORMANCE & REPORTING)
  // ----------------------------------------------------------------------------

  // Chart 1: Site-Wise Bifurcation (Donut / Pie: DT-3 vs DT-4 with % and count)
  const chart1SiteBifurcationData = useMemo(() => {
    let dt3 = 0
    let dt4 = 0
    rows.forEach((r) => {
      const b = deriveBuilding(r)
      if (b === 'Downtown-3') dt3++
      else dt4++
    })
    const total = dt3 + dt4 || 1
    const dt3Pct = ((dt3 / total) * 100).toFixed(1)
    const dt4Pct = ((dt4 / total) * 100).toFixed(1)

    const result = []
    if (dt3 > 0 || dt4 === 0) {
      result.push({
        name: 'Downtown-3 (DT-3)',
        shortName: 'DT-3',
        value: dt3,
        percent: `${dt3Pct}%`,
        fill: '#1F2937' // DT-3 Dark Charcoal
      })
    }
    if (dt4 > 0 || dt3 === 0) {
      result.push({
        name: 'Downtown-4 (DT-4)',
        shortName: 'DT-4',
        value: dt4,
        percent: `${dt4Pct}%`,
        fill: '#16A34A' // DT-4 Green
      })
    }
    return result
  }, [rows])

  // Chart 2: Events by Floor (Stacked Bar: DT-3 vs DT-4, Ground to L6)
  // V18 Ground Truth: NO OTHER BUCKET. ZERO-ONLY buckets (e.g. L2=0, Ground=0) MUST NOT BE PLOTTED.
  const chart2FloorData = useMemo(() => {
    const floorOrder = ['Ground', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']
    const map = {}
    floorOrder.forEach((fl) => {
      map[fl] = { floor: fl, dt3: 0, dt4: 0, total: 0 }
    })

    rows.forEach((r) => {
      const b = deriveBuilding(r)
      const fl = normalizeFloor(r['Floor'])

      if (fl && map[fl]) {
        if (b === 'Downtown-3') map[fl].dt3++
        else map[fl].dt4++
        map[fl].total++
      }
    })

    // CRITICAL: Only return floors where total > 0! Zero-only buckets (like L2=0, Ground=0) are excluded.
    return floorOrder
      .filter((fl) => map[fl].total > 0)
      .map((fl) => map[fl])
  }, [rows])

  // Chart 3: Events by Category (Horizontal Bar with count labels)
  const chart3CategoryData = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const cat = deriveEventCategory(r)
      map[cat] = (map[cat] || 0) + 1
    })

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [rows])

  // Chart 4: Monthly Trend (Line + Bar Combo: DT-3 / DT-4 stacked + Total line)
  const chart4MonthlyComboData = useMemo(() => {
    const yrSuffix = isYear2027 ? '27' : '26'
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const map = {}
    monthNames.forEach((m) => {
      map[m] = {
        month: `${m}-${yrSuffix}`,
        shortMonth: m,
        dt3: 0,
        dt4: 0,
        total: 0
      }
    })

    rows.forEach((r) => {
      const m = String(r['Month'] || '').slice(0, 3)
      if (map[m]) {
        const b = deriveBuilding(r)
        if (b === 'Downtown-3') map[m].dt3++
        else map[m].dt4++
        map[m].total++
      }
    })

    return monthNames.map((m) => map[m])
  }, [rows, isYear2027])

  // Chart 5: Events by Status (Derived Smart Status Donut)
  const chart5StatusDonutData = useMemo(() => {
    if (isYear2027) {
      return [
        { name: 'Upcoming', count: rows.length, value: rows.length, percent: '100.0%', fill: '#00796B' }
      ]
    }

    const counts = {
      'Completed': 0,
      'Completed (Auto)': 0,
      'Upcoming': 0,
      'Cancelled': 0
    }

    rows.forEach((r) => {
      const der = getEventDerivedStatus(r)
      const rawStatus = String(r['Calendar Booking Status'] || '').toLowerCase()
      if (der.status === 'Cancelled') {
        counts['Cancelled']++
      } else if (der.status === 'Upcoming') {
        counts['Upcoming']++
      } else if (der.status === 'Completed') {
        if (der.isAutoConverted || rawStatus.includes('pending') || rawStatus.includes('tentative')) {
          counts['Completed (Auto)']++
        } else {
          counts['Completed']++
        }
      } else {
        counts['Upcoming']++
      }
    })

    const total = rows.length || 1
    const items = [
      { name: 'Completed', count: counts['Completed'], fill: CBRE_GREEN },
      { name: 'Upcoming', count: counts['Upcoming'], fill: '#00796B' },
      { name: 'Cancelled', count: counts['Cancelled'], fill: CBRE_RED },
      { name: 'Completed (Auto)', count: counts['Completed (Auto)'], fill: '#2E7D32' }
    ]

    return items
      .filter((item) => item.count > 0 || total === 0)
      .map((item) => ({
        ...item,
        value: item.count,
        percent: `${((item.count / total) * 100).toFixed(1)}%`
      }))
  }, [rows, isYear2027])

  // Chart 6: Events by Day of Week (Mon to Sun Bar)
  const chart6DayOfWeekData = useMemo(() => {
    const days = [
      { day: 'Mon', fullName: 'Monday', count: 0 },
      { day: 'Tue', fullName: 'Tuesday', count: 0 },
      { day: 'Wed', fullName: 'Wednesday', count: 0 },
      { day: 'Thu', fullName: 'Thursday', count: 0 },
      { day: 'Fri', fullName: 'Friday', count: 0 },
      { day: 'Sat', fullName: 'Saturday', count: 0 },
      { day: 'Sun', fullName: 'Sunday', count: 0 }
    ]
    const map = {}
    days.forEach((d) => { map[d.day] = d })

    rows.forEach((r) => {
      const d = getRowDay(r)
      if (map[d]) {
        map[d].count++
      }
    })

    return days
  }, [rows])

  // Chart 7: Top 10 Rooms / Venues (Horizontal Bar)
  const chart7TopVenuesData = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const c = cleanSite(r)
      if (c.location && c.location !== 'Not Mentioned' && c.location !== 'Blank') {
        map[c.location] = (map[c.location] || 0) + 1
      }
    })

    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [rows])

  // Aliases for any legacy references
  const monthlyTrendData = chart4MonthlyComboData
  const statusDonutData = chart5StatusDonutData
  const siteWiseComparisonData = chart1SiteBifurcationData
  const categoryChartData = chart3CategoryData

  // ----------------------------------------------------------------------------
  // 6. DETAILED EVENTS TABLE STATE & PAGINATION (50/Page)
  // ----------------------------------------------------------------------------
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const pageSize = 50
  const [sortKey, setSortKey] = useState('Event Date')
  const [sortDir, setSortDir] = useState('desc')

  const filteredTableRows = useMemo(() => {
    let list = rows.filter((r) => {
      const f = String(r['Floor'] || '').trim()
      const l = String(r['Location'] || '').trim()
      if (f === 'Not Mentioned' || l === 'Not Mentioned' || f === 'Blank' || l === 'Blank') return false
      return true
    })

    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim()
      list = list.filter((r) =>
        Object.values(r).some((val) => String(val || '').toLowerCase().includes(q))
      )
    }

    return [...list].sort((a, b) => {
      let va = a[sortKey]
      let vb = b[sortKey]
      if (va == null) va = ''
      if (vb == null) vb = ''

      if (sortKey === 'Capacity / Pax' || sortKey === 'Pax') {
        const na = parsePax(va)
        const nb = parsePax(vb)
        return sortDir === 'asc' ? na - nb : nb - na
      }

      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      if (sa < sb) return sortDir === 'asc' ? -1 : 1
      if (sa > sb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, tableSearch, sortKey, sortDir])

  const totalTablePages = Math.ceil(filteredTableRows.length / pageSize) || 1

  useEffect(() => {
    setTablePage(1)
  }, [rows, tableSearch])

  const pageNumbers = useMemo(() => {
    const pages = []
    const maxButtons = 5
    let startPage = Math.max(1, tablePage - Math.floor(maxButtons / 2))
    let endPage = Math.min(totalTablePages, startPage + maxButtons - 1)
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1)
    }
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i)
    }
    return pages
  }, [tablePage, totalTablePages])

  const paginatedTableRows = useMemo(() => {
    const start = (tablePage - 1) * pageSize
    return filteredTableRows.slice(start, start + pageSize)
  }, [filteredTableRows, tablePage, pageSize])

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const handleExportFilteredEvents = () => {
    exportToExcel({
      sheetName: 'Filtered_Events',
      rows: filteredTableRows,
      fileName: 'Event_Tracker_Filtered'
    })
  }

  const syncedTimeDisplay = useMemo(() => {
    if (!lastSyncedAt) return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    const d = new Date(lastSyncedAt)
    return isNaN(d.getTime())
      ? new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  }, [lastSyncedAt])

  const scrollToTables = () => {
    const el = document.getElementById('events-tables-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      {/* FILTER SHELF (Cascading Year -> Quarter -> Month + Site + Floor + Pax) */}
      <EventFilterShelf
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        distinctOptions={distinctOptions}
        activeFilterCount={activeFilterCount}
        locationCounts={locationCounts}
      />

      {/* ======================================================================= */}
      {/* 2. KPI HEADER BOXES ROW (8 COLOURFUL CARDS - EVENT STYLE PARITY)        */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        
        {/* Box 1: TOTAL EVENTS (Blue) */}
        <div
          id="kpi-total-events"
          onClick={() => handleKpiCardClick('total_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view all events"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">TOTAL EVENTS</span>
            <span className="text-base">📊</span>
          </div>
          <span className="text-2xl font-black text-blue-700 tracking-tight">{kpis.total.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT-3: {kpis.dt3Count} • DT-4: {kpis.dt4Count}</span>
            <span className="text-blue-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 2: COMPLETED (Green) */}
        <div
          id="kpi-completed-events"
          onClick={() => handleKpiCardClick('completed_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Confirmed / Completed events"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">COMPLETED</span>
            <span className="text-base">✅</span>
          </div>
          <span className="text-2xl font-black text-emerald-700 tracking-tight">{kpis.completedCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT-3: {kpis.completedDt3} • DT-4: {kpis.completedDt4}</span>
            <span className="text-emerald-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 3: CANCELLED / NO-SHOW (Red) */}
        <div
          id="kpi-cancelled-events"
          onClick={() => handleKpiCardClick('cancelled_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Cancelled & No-Show events"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 truncate">CANCELLED / NO-SHOW</span>
            <span className="text-base">❌</span>
          </div>
          <span className="text-2xl font-black text-rose-600 tracking-tight">{kpis.cancelledTotal.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT-3: {kpis.cancelledDt3} • DT-4: {kpis.cancelledDt4}</span>
            <span className="text-rose-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 4: PENDING (UPCOMING) (Orange) */}
        <div
          id="kpi-upcoming-events"
          onClick={() => handleKpiCardClick('upcoming_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Pending / Upcoming Bookings"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 truncate">PENDING (UPCOMING)</span>
            <span className="text-base">⏳</span>
          </div>
          <span className="text-2xl font-black text-amber-600 tracking-tight">{kpis.upcomingCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT-3: {kpis.upcomingDt3} • DT-4: {kpis.upcomingDt4}</span>
            <span className="text-amber-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 5: BIG EVENTS (100+ PAX) (Purple) */}
        <div
          id="kpi-big-events"
          onClick={() => handleKpiCardClick('big_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Big Events (Pax >= 100)"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">BIG (100+ PAX)</span>
            <span className="text-base">🎪</span>
          </div>
          <span className="text-2xl font-black text-purple-700 tracking-tight">{kpis.bigCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT-3: {kpis.dt3Big} • DT-4: {kpis.dt4Big}</span>
            <span className="text-purple-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 6: SMALL EVENTS (<100 PAX) (Teal) */}
        <div
          id="kpi-small-events"
          onClick={() => handleKpiCardClick('small_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-teal-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Small Events (Pax < 100)"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">SMALL (&lt;100 PAX)</span>
            <span className="text-base">👥</span>
          </div>
          <span className="text-2xl font-black text-teal-700 tracking-tight">{kpis.smallCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT-3: {kpis.dt3Small} • DT-4: {kpis.dt4Small}</span>
            <span className="text-teal-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 7: TODAY'S EVENTS (Indigo) */}
        <div
          id="kpi-today-events"
          onClick={() => handleKpiCardClick('today_events')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Today's Events"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 truncate">TODAY'S EVENTS</span>
            <span className="text-base">📅</span>
          </div>
          <span className="text-2xl font-black text-indigo-700 tracking-tight">{kpis.todayCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>{todayIsSun && kpis.todayCount === 0 ? 'Sunday - No Events' : `DT-3: ${kpis.todayDt3} • DT-4: ${kpis.todayDt4}`}</span>
            <span className="text-indigo-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* Box 8: WRONG ENTRIES (Red) */}
        <div
          id="kpi-wrong-entries"
          onClick={() => handleKpiCardClick('wrong_entries')}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Wrong Site Entries"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 truncate">WRONG ENTRIES</span>
            <span className="text-base">⚠️</span>
          </div>
          <span className="text-2xl font-black text-rose-600 tracking-tight">{kpis.wrongCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mt-1">
            <span>Loc: {kpis.wrongLoc} • Title: {kpis.wrongTitle} • Both: {kpis.wrongBoth}</span>
            <span className="text-rose-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

      </div>

      {/* ======================================================================= */}
      {/* 3. CHARTS SECTION - DIRECTLY AFTER KPI BOXES, BEFORE ANY TABLE          */}
      {/* ======================================================================= */}
      {/* ======================================================================= */}
      {/* 3. CHARTS SECTION - 7 STANDARDIZED CHARTS (V14 PARITY)                  */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        
        {/* CHART 1: SITE-WISE BIFURCATION (Donut / Pie: DT-3 vs DT-4 with % + count) */}
        <ErrorBoundary title="Site-Wise Bifurcation Error">
          <ChartCard
            title="🏢 Site-Wise Bifurcation (DT-3 vs DT-4)"
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#003231]"
            data={chart1SiteBifurcationData}
            filename="Site_Wise_Bifurcation"
          >
            <div className="w-full h-full flex flex-col items-center justify-between pt-1">
              <div className="h-[175px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={chart1SiteBifurcationData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      label={false}
                      onClick={(entry) => {
                        if (entry && entry.shortName) {
                          if (onFilterChange) onFilterChange('site', entry.shortName === 'DT-3' ? 'Downtown-3' : 'Downtown-4')
                          scrollToTables()
                        }
                      }}
                    >
                      {chart1SiteBifurcationData.map((entry, index) => (
                        <Cell key={`site-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name, props) => [`${val.toLocaleString()} Events (${props.payload.percent})`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 py-1 text-xs border-t border-slate-100">
                {chart1SiteBifurcationData.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (onFilterChange) onFilterChange('site', d.shortName === 'DT-3' ? 'Downtown-3' : 'Downtown-4')
                      scrollToTables()
                    }}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="font-semibold text-slate-800">{d.name}:</span>
                    <span className="font-bold text-slate-900">{d.value.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500 font-medium">({d.percent})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </ErrorBoundary>

        {/* CHART 2: EVENTS BY FLOOR (Stacked Bar: DT-3 vs DT-4 Ground to L6) */}
        <ErrorBoundary title="Events by Floor Error">
          <ChartCard
            title="📶 Events by Floor (Ground to L6 Split)"
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#16A34A]"
            data={chart2FloorData}
            filename="Events_by_Floor"
          >
            <div className="h-[240px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chart2FloorData}
                  margin={{ top: 20, right: 15, bottom: 20, left: 10 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const fl = data.activePayload[0].payload.floor
                      if (onFilterChange) onFilterChange('floor', fl)
                      scrollToTables()
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="floor" tick={{ fontSize: 11, fill: '#1F2937', fontWeight: 600 }} stroke="#CBD5E1" />
                  <YAxis hide={true} />
                  <Tooltip formatter={(val, name) => [`${val.toLocaleString()} Events`, name === 'dt3' ? 'Downtown-3' : 'Downtown-4']} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Bar isAnimationActive={false} dataKey="dt3" name="DT-3" stackId="floorStack" fill="#1F2937" barSize={26} />
                  <Bar isAnimationActive={false} dataKey="dt4" name="DT-4" stackId="floorStack" fill="#16A34A" barSize={26}>
                    <LabelList dataKey="total" position="top" fill="#1F2937" fontSize={11} fontWeight={700} dy={-6} formatter={(v) => (v > 0 ? v : '')} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </ErrorBoundary>

        {/* CHART 3: EVENTS BY CATEGORY (Horizontal Bar) */}
        <ErrorBoundary title="Events by Category Error">
          <ChartCard
            title="🏷️ Events by Category"
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#FF6A13]"
            data={chart3CategoryData}
            filename="Events_by_Category"
          >
            <div className="h-[230px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chart3CategoryData}
                  margin={{ top: 8, right: 35, bottom: 8, left: 10 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const cat = data.activePayload[0].payload.name
                      if (onFilterChange) onFilterChange('eventType', cat)
                      scrollToTables()
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide={true} />
                  <YAxis type="category" dataKey="name" width={105} tick={{ fontSize: 11, fill: '#003231', fontWeight: 600 }} stroke="#CBD5E1" />
                  <Tooltip formatter={(val) => [`${val.toLocaleString()} Events`, 'Total']} />
                  <Bar isAnimationActive={false} dataKey="count" name="Events" fill="#FF6A13" radius={[0, 4, 4, 0]} barSize={16}>
                    <LabelList dataKey="count" position="right" fill="#003231" fontSize={11} fontWeight="bold" dx={4} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </ErrorBoundary>

        {/* CHART 4: MONTHLY TREND (Line + Bar Combo) */}
        <ErrorBoundary title="Monthly Trend Combo Error">
          <ChartCard
            title={`📈 Monthly Trend (Jan to Dec ${isYear2027 ? '2027' : '2026'} Combo)`}
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#00A651]"
            data={chart4MonthlyComboData}
            filename="Monthly_Event_Trend"
          >
            <div className="h-[230px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chart4MonthlyComboData}
                  margin={{ top: 20, right: 15, bottom: 20, left: 10 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const m = data.activePayload[0].payload.month
                      if (onFilterChange) onFilterChange('selectedMonths', [m])
                      scrollToTables()
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="shortMonth" tick={{ fontSize: 10, fill: '#003231', fontWeight: 600 }} stroke="#CBD5E1" />
                  <YAxis hide={true} />
                  <Tooltip formatter={(val, name) => [`${val.toLocaleString()} Events`, name]} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                  <Bar isAnimationActive={false} dataKey="dt3" name="DT-3" stackId="monthSt" fill={CBRE_DARK_GREEN} barSize={22} />
                  <Bar isAnimationActive={false} dataKey="dt4" name="DT-4" stackId="monthSt" fill={CBRE_GREEN} barSize={22} />
                  <Line isAnimationActive={false} type="monotone" dataKey="total" name="Total Events" stroke="#FF6A13" strokeWidth={2.5} dot={{ r: 3, fill: '#FF6A13' }}>
                    <LabelList dataKey="total" position="top" fill="#003231" fontSize={10} fontWeight={700} dy={-6} formatter={(v) => (v > 0 ? v : '')} />
                  </Line>
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </ErrorBoundary>

        {/* CHART 5: EVENTS BY STATUS (Derived Status Donut) */}
        <ErrorBoundary title="Events by Status Error">
          <ChartCard
            title="🍩 Events by Status (Derived Status)"
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#00796B]"
            data={chart5StatusDonutData}
            filename="Events_by_Status"
          >
            <div className="w-full h-full flex flex-col items-center justify-between pt-1">
              <div className="h-[175px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={chart5StatusDonutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                      label={false}
                      onClick={(entry) => {
                        if (entry && entry.name) {
                          const target = entry.name.includes('Completed') ? 'Completed' : entry.name.includes('Cancel') ? 'Cancelled' : 'Pending'
                          if (onFilterChange) onFilterChange('status', target)
                          scrollToTables()
                        }
                      }}
                    >
                      {chart5StatusDonutData.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val, name, props) => [`${val.toLocaleString()} Events (${props.payload.percent})`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-1 text-xs border-t border-slate-100">
                {chart5StatusDonutData.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      const target = d.name.includes('Completed') ? 'Completed' : d.name.includes('Cancel') ? 'Cancelled' : 'Pending'
                      if (onFilterChange) onFilterChange('status', target)
                      scrollToTables()
                    }}
                    className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="font-semibold text-slate-800">{d.name}:</span>
                    <span className="font-bold text-slate-900">{d.value.toLocaleString()}</span>
                    <span className="text-[11px] text-slate-500 font-medium">({d.percent})</span>
                  </div>
                ))}
              </div>
            </div>
          </ChartCard>
        </ErrorBoundary>

        {/* CHART 6: EVENTS BY DAY OF WEEK (Bar) */}
        <ErrorBoundary title="Events by Day of Week Error">
          <ChartCard
            title="📅 Events by Day of Week (Mon to Sun)"
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#005EB8]"
            data={chart6DayOfWeekData}
            filename="Events_by_Day_of_Week"
          >
            <div className="h-[230px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chart6DayOfWeekData}
                  margin={{ top: 20, right: 15, bottom: 20, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#003231', fontWeight: 600 }} stroke="#CBD5E1" />
                  <YAxis hide={true} />
                  <Tooltip formatter={(val, _n, props) => [`${val.toLocaleString()} Events`, props.payload.fullName]} />
                  <Bar isAnimationActive={false} dataKey="count" name="Events" fill="#005EB8" radius={[4, 4, 0, 0]} barSize={26}>
                    <LabelList dataKey="count" position="top" fill="#003231" fontSize={11} fontWeight={700} dy={-4} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </ErrorBoundary>

        {/* CHART 7: TOP 10 ROOMS / VENUES (Horizontal Bar - Spanning 2 Columns) */}
        <ErrorBoundary title="Top 10 Venues Error">
          <ChartCard
            title="📍 Top 10 Rooms / Venues (Most Booked)"
            reportingPeriod={chartSubtitle}
            topBorderColor="border-t-[#00A19A]"
            data={chart7TopVenuesData}
            filename="Top_10_Rooms_Venues"
            className="lg:col-span-2 h-[320px]"
          >
            <div className="h-[260px] w-full cursor-pointer">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={chart7TopVenuesData}
                  margin={{ top: 8, right: 40, bottom: 8, left: 20 }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload[0]) {
                      const loc = data.activePayload[0].payload.name
                      if (onFilterChange) onFilterChange('location', loc)
                      scrollToTables()
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                  <XAxis type="number" hide={true} />
                  <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 11, fill: '#003231', fontWeight: 600 }} stroke="#CBD5E1" />
                  <Tooltip formatter={(val) => [`${val.toLocaleString()} Bookings`, 'Total Events']} />
                  <Bar isAnimationActive={false} dataKey="count" name="Bookings" fill="#00A19A" radius={[0, 4, 4, 0]} barSize={16}>
                    <LabelList dataKey="count" position="right" fill="#003231" fontSize={11} fontWeight="bold" dx={4} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>
        </ErrorBoundary>

      </div>

      {/* ======================================================================= */}
      {/* 4. TABLES SECTION - AFTER CHARTS (SITE-WISE THEN FULL DETAILS)          */}
      {/* ======================================================================= */}
      <div id="events-tables-section" className="space-y-4 pt-2">
        
        {/* Table 1: Site-Wise Breakdown Table (Strictly DT-3 Section then DT-4 Section with Subtotals) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-slate-50 via-emerald-50/30 to-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-[#00A651]" />
                <span>Site-wise Breakdown (Arranged Site-Wise: DT-3 then DT-4 with Subtotals)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                DT-3: {filteredSiteTable.dt3Rows.length} Locations • DT-4: {filteredSiteTable.dt4Rows.length} Locations • Cleaned Locations only
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search venue or floor..."
                  value={siteTableSearch}
                  onChange={(e) => setSiteTableSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-[#00A651]"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#003231] text-white font-bold sticky top-0 shadow-xs">
                <tr>
                  <th className="px-3 py-2.5">Building</th>
                  <th className="px-3 py-2.5">Floor</th>
                  <th className="px-3 py-2.5">Location</th>
                  <th className="px-3 py-2.5 text-center text-emerald-200">Total Events</th>
                  <th className="px-3 py-2.5 text-center text-amber-300">Big (100+)</th>
                  <th className="px-3 py-2.5 text-center text-emerald-300">Small (&lt;100)</th>
                  <th className="px-3 py-2.5 text-center text-emerald-100">Completed</th>
                  <th className="px-3 py-2.5 text-center text-rose-300">Cancelled</th>
                  <th className="px-3 py-2.5 text-center text-teal-200">Upcoming</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                
                {/* SECTION 1: DOWNTOWN-3 */}
                <tr className="bg-emerald-900 text-white font-extrabold text-[11px] uppercase tracking-wider">
                  <td colSpan={9} className="px-3 py-2 bg-emerald-900">
                    🏢 SECTION 1: Downtown-3 (DT-3) Locations ({filteredSiteTable.dt3Rows.length} Locations)
                  </td>
                </tr>
                {filteredSiteTable.dt3Rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-3 text-center text-slate-400 italic">No DT-3 locations match search.</td>
                  </tr>
                ) : (
                  filteredSiteTable.dt3Rows.map((row, idx) => (
                    <tr
                      key={`dt3-${row.floor}-${row.location}-${idx}`}
                      className="even:bg-slate-50/60 hover:bg-emerald-50/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if (onFilterChange) {
                          onFilterChange('site', 'Downtown-3')
                          if (['L3', 'L-1', 'L-4', 'L-5', 'L-6'].includes(row.floor)) onFilterChange('floor', row.floor)
                          if (row.location !== 'Not Mentioned') onFilterChange('location', row.location)
                        }
                      }}
                      title="Click to apply venue filter"
                    >
                      <td className="px-3 py-1.5 font-semibold text-slate-900 whitespace-nowrap">{row.building}</td>
                      <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {row.floor}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 max-w-[200px] truncate font-medium text-slate-800" title={row.location}>
                        {row.location}
                      </td>
                      <td className="px-3 py-1.5 text-center font-bold text-[#003231]">{row.total}</td>
                      <td className="px-3 py-1.5 text-center font-semibold text-[#FF6A13]">{row.big}</td>
                      <td className="px-3 py-1.5 text-center font-semibold text-[#558B2F]">{row.small}</td>
                      <td className="px-3 py-1.5 text-center text-[#00A651] font-semibold">{row.confirmed}</td>
                      <td className="px-3 py-1.5 text-center text-[#E30613] font-semibold">{row.canceled}</td>
                      <td className="px-3 py-1.5 text-center text-[#00796B] font-semibold">{row.pending}</td>
                    </tr>
                  ))
                )}
                {/* DT-3 Subtotal */}
                <tr className="bg-emerald-100/90 font-black text-emerald-950 border-t-2 border-emerald-300">
                  <td colSpan={3} className="px-3 py-2 text-right uppercase tracking-wider text-[11px]">
                    Downtown-3 Subtotal:
                  </td>
                  <td className="px-3 py-2 text-center text-emerald-950 font-black">{filteredSiteTable.dt3Subtotal.total}</td>
                  <td className="px-3 py-2 text-center text-orange-900 font-bold">{filteredSiteTable.dt3Subtotal.big}</td>
                  <td className="px-3 py-2 text-center text-emerald-900 font-bold">{filteredSiteTable.dt3Subtotal.small}</td>
                  <td className="px-3 py-2 text-center text-emerald-950 font-bold">{filteredSiteTable.dt3Subtotal.confirmed}</td>
                  <td className="px-3 py-2 text-center text-rose-900 font-bold">{filteredSiteTable.dt3Subtotal.canceled}</td>
                  <td className="px-3 py-2 text-center text-teal-950 font-bold">{filteredSiteTable.dt3Subtotal.pending}</td>
                </tr>

                {/* SECTION 2: DOWNTOWN-4 */}
                <tr className="bg-[#002B49] text-white font-extrabold text-[11px] uppercase tracking-wider">
                  <td colSpan={9} className="px-3 py-2 bg-[#002B49]">
                    🏢 SECTION 2: Downtown-4 (DT-4) Locations ({filteredSiteTable.dt4Rows.length} Locations: L1, L4, L5, L6)
                  </td>
                </tr>
                {filteredSiteTable.dt4Rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-3 text-center text-slate-400 italic">No DT-4 locations match search.</td>
                  </tr>
                ) : (
                  filteredSiteTable.dt4Rows.map((row, idx) => (
                    <tr
                      key={`dt4-${row.floor}-${row.location}-${idx}`}
                      className="even:bg-slate-50/60 hover:bg-blue-50/50 cursor-pointer transition-colors"
                      onClick={() => {
                        if (onFilterChange) {
                          onFilterChange('site', 'Downtown-4')
                          if (['L3', 'L-1', 'L-4', 'L-5', 'L-6'].includes(row.floor)) onFilterChange('floor', row.floor)
                          if (row.location !== 'Not Mentioned') onFilterChange('location', row.location)
                        }
                      }}
                      title="Click to apply venue filter"
                    >
                      <td className="px-3 py-1.5 font-semibold text-slate-900 whitespace-nowrap">{row.building}</td>
                      <td className="px-3 py-1.5 font-medium whitespace-nowrap">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                          {row.floor}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 max-w-[200px] truncate font-medium text-slate-800" title={row.location}>
                        {row.location}
                      </td>
                      <td className="px-3 py-1.5 text-center font-bold text-[#002B49]">{row.total}</td>
                      <td className="px-3 py-1.5 text-center font-semibold text-[#FF6A13]">{row.big}</td>
                      <td className="px-3 py-1.5 text-center font-semibold text-[#558B2F]">{row.small}</td>
                      <td className="px-3 py-1.5 text-center text-[#00A651] font-semibold">{row.confirmed}</td>
                      <td className="px-3 py-1.5 text-center text-[#E30613] font-semibold">{row.canceled}</td>
                      <td className="px-3 py-1.5 text-center text-[#00796B] font-semibold">{row.pending}</td>
                    </tr>
                  ))
                )}
                {/* DT-4 Subtotal */}
                <tr className="bg-blue-100/90 font-black text-blue-950 border-t-2 border-blue-300">
                  <td colSpan={3} className="px-3 py-2 text-right uppercase tracking-wider text-[11px]">
                    Downtown-4 Subtotal:
                  </td>
                  <td className="px-3 py-2 text-center text-blue-950 font-black">{filteredSiteTable.dt4Subtotal.total}</td>
                  <td className="px-3 py-2 text-center text-orange-900 font-bold">{filteredSiteTable.dt4Subtotal.big}</td>
                  <td className="px-3 py-2 text-center text-emerald-900 font-bold">{filteredSiteTable.dt4Subtotal.small}</td>
                  <td className="px-3 py-2 text-center text-emerald-950 font-bold">{filteredSiteTable.dt4Subtotal.confirmed}</td>
                  <td className="px-3 py-2 text-center text-rose-900 font-bold">{filteredSiteTable.dt4Subtotal.canceled}</td>
                  <td className="px-3 py-2 text-center text-teal-950 font-bold">{filteredSiteTable.dt4Subtotal.pending}</td>
                </tr>

              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Detailed Events Table with Excel Status + Smart Derived Status */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-slate-50 to-emerald-50/20 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#003231]" />
                <span>Full Details Table ({filteredTableRows.length.toLocaleString()} Records)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Verified Event Operations Records • Original Excel Status + Smart Derived Status
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Event ID, Title, Floor..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value)
                    setTablePage(1)
                  }}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-[#003231]"
                />
              </div>

              <button
                onClick={handleExportFilteredEvents}
                className="h-[30px] px-3 rounded-md bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#003231] text-white font-bold sticky top-0 z-10 shadow-xs">
                <tr>
                  <th onClick={() => handleSort('Event ID')} className="px-3 py-2.5 cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Event ID</th>
                  <th onClick={() => handleSort('Event Date')} className="px-2 py-2.5 cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Date</th>
                  <th onClick={() => handleSort('Day')} className="px-2 py-2.5 cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Day</th>
                  <th onClick={() => handleSort('Building')} className="px-2 py-2.5 cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Building</th>
                  <th onClick={() => handleSort('Floor')} className="px-2 py-2.5 cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Floor</th>
                  <th onClick={() => handleSort('Location')} className="px-3 py-2.5 cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Location</th>
                  <th onClick={() => handleSort('Event Title / Purpose')} className="px-3 py-2.5 cursor-pointer hover:bg-[#004d4b]">Event Title</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Category</th>
                  <th onClick={() => handleSort('Capacity / Pax')} className="px-2 py-2.5 text-center cursor-pointer hover:bg-[#004d4b] whitespace-nowrap">Pax</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Scale</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Start Time</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">End Time</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Excel Status</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Derived Status</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Booked By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {paginatedTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="px-4 py-8 text-center text-slate-500">
                      No events match the current filter selection.
                    </td>
                  </tr>
                ) : (
                  paginatedTableRows.map((r, i) => {
                    const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity']
                    const paxNum = parsePax(rawPax)
                    const scale = getScale(rawPax)
                    const derived = getEventDerivedStatus(r)
                    const derivedBadgeCls =
                      derived.status === 'Completed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : derived.status === 'Cancelled'
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : derived.status === 'Upcoming'
                        ? 'bg-blue-100 text-blue-800 border-blue-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'

                    return (
                      <tr key={r['Event ID'] || i} className="even:bg-slate-50/50 hover:bg-emerald-50/30 transition-colors">
                        <td className="px-3 py-2 font-mono font-semibold text-slate-900 whitespace-nowrap">{r['Event ID']}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-mono text-[11px]">{r['Event Date']}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-medium text-slate-600">{getRowDay(r)}</td>
                        <td className="px-2 py-2 whitespace-nowrap">{r['Building']}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-semibold">{r['Floor']}</td>
                        <td className="px-3 py-2 max-w-[140px] truncate" title={r['Location']}>{r['Location']}</td>
                        <td className="px-3 py-2 max-w-[220px] truncate font-medium text-slate-900" title={r['Event Title / Purpose']}>{r['Event Title / Purpose']}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {deriveEventCategory(r)}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-center font-bold text-slate-900 whitespace-nowrap">{paxNum > 0 ? paxNum : '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            scale === 'Big Event' ? 'bg-orange-100 text-orange-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {scale}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap font-mono text-[11px]">{formatTime(r['Start Time'])}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-mono text-[11px]">{formatTime(r['End Time'])}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600 text-[11px]">{r['Calendar Booking Status'] || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${derivedBadgeCls}`}
                            title={derived.tooltip || derived.subLabel}
                          >
                            {derived.subLabel || derived.status}
                            {derived.isAutoConverted && <span className="ml-1 text-[9px] font-normal opacity-80">(Auto)</span>}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600 truncate max-w-[120px]" title={r['Booked By']}>{r['Booked By'] || '-'}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalTablePages > 1 && (
            <div className="px-3 py-2.5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
              <span className="font-medium">
                Page <span className="font-bold text-slate-900">{tablePage}</span> of <span className="font-bold text-slate-900">{totalTablePages}</span> ({filteredTableRows.length.toLocaleString()} total rows • 50/page)
              </span>
              <div className="flex items-center gap-1 flex-wrap">
                <button
                  onClick={() => setTablePage(1)}
                  disabled={tablePage === 1}
                  className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer text-xs font-semibold"
                  title="First Page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  disabled={tablePage === 1}
                  className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer text-xs font-semibold flex items-center gap-0.5"
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                {pageNumbers[0] > 1 && (
                  <>
                    <button
                      onClick={() => setTablePage(1)}
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      1
                    </button>
                    {pageNumbers[0] > 2 && <span className="px-1 text-slate-400">…</span>}
                  </>
                )}

                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => setTablePage(num)}
                    className={`px-2.5 py-1 rounded border text-xs font-bold transition-colors cursor-pointer ${
                      tablePage === num
                        ? 'bg-[#003231] text-white border-[#003231] shadow-2xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                {pageNumbers[pageNumbers.length - 1] < totalTablePages && (
                  <>
                    {pageNumbers[pageNumbers.length - 1] < totalTablePages - 1 && <span className="px-1 text-slate-400">…</span>}
                    <button
                      onClick={() => setTablePage(totalTablePages)}
                      className="px-2.5 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                    >
                      {totalTablePages}
                    </button>
                  </>
                )}

                <button
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalTablePages))}
                  disabled={tablePage === totalTablePages}
                  className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer text-xs font-semibold flex items-center gap-0.5"
                  title="Next Page"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTablePage(totalTablePages)}
                  disabled={tablePage === totalTablePages}
                  className="px-2 py-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer text-xs font-semibold"
                  title="Last Page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back to Top Floating / Bottom Action */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <span className="text-xs text-slate-500 font-medium">CBRE Facilities Management • Downtown-3 &amp; Downtown-4</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <span>↑ Back to Top</span>
          </button>
        </div>

      </div>

    </div>
  )
})
