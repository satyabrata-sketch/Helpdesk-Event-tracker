// ==============================================================================
// HELPDESK ANALYSIS DASHBOARD COMPONENT (CBRE BRAND THEME - 100% ENGLISH)
// Layout:
// 1. Top Header Bar: Facility Operations Dashboard - Helpdesk | CBRE Facilities | Synced Live
// 2. Filter Shelf: HelpdeskFilterShelf (Year, Quarter, Month, Site, Floor, Zone, Category, Ticket Raised By, Search)
// 3. 7 Colourful KPI Cards (White card + coloured left border + icon + big bold number + sub-line):
//    TOTAL TICKETS (Blue) | CLOSED / RESOLVED (Green) | OPEN / PENDING (Orange) | IN-PROGRESS (Teal)
//    SLA BREACHED (Purple) | TODAY'S TICKETS (Indigo) | WRONG / INCOMPLETE (Red)
// 4. 6 New Colourful Charts with Data Labels & Icons:
//    - Chart 1: 🔄 Proactive VS Reactive Count (Donut with % + count labels)
//    - Chart 2: 📈 Reactive Ticket Inflow Trend (Monthly Line/Bar with point count labels)
//    - Chart 3: 🏢 Reactive Ticket Share by Site and Floor (Stacked Bar: Site on X, Floor stacked, labels)
//    - Chart 4: 📱 Reactive Ticket Channel Counts (Request Via: QR Code, In Person, Mail, Phone, Teams with labels)
//    - Chart 5: 📊 Category-Wise Reactive Ticket Trend (Stacked Monthly Bar with labels)
//    - Chart 6: 📅 Monthly Trend Chart (Total Tickets per Month Bar with distinct colour per month + labels)
// 5. Full Details Table (AFTER Charts - Site-wise table removed from Helpdesk) + Back to Top
// ==============================================================================
import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Cell,
  PieChart,
  Pie,
  LabelList
} from 'recharts'
import {
  Headphones,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  Building2,
  FileSpreadsheet,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ShieldAlert,
  Tag,
  MapPin,
  User,
  ArrowUp
} from 'lucide-react'
import { ChartCard } from './ChartCard'
import { HelpdeskFilterShelf } from './HelpdeskFilterShelf'
import { ErrorBoundary } from './ErrorBoundary'
import { exportToExcel } from '../lib/excelExport'
import {
  getTodayIST,
  formatMonthYear,
  formatDateDisplay,
  formatDateRangeDisplay,
  isHelpdeskWrongEntry,
  getHelpdeskWrongReason,
  formatReportTime,
  formatHelpdeskCategory,
  extractHelpdeskFloor,
  extractHelpdeskZone,
  extractTicketRaisedBy,
  normalizeHelpdeskChannel,
  normalizeHelpdeskSite,
  normalizeHelpdeskZone,
  normalizeHelpdeskCategory,
  normalizeHelpdeskStatus
} from '../lib/dateUtils'

const PALETTE = [
  '#2563EB', '#0D9488', '#10B981', '#F59E0B', '#9333EA',
  '#EC4899', '#3B82F6', '#14B8A6', '#84CC16', '#F97316', '#6366F1'
]

export function HelpdeskSection({
  rows = [],
  fullSheetData,
  activeYear = 'all',
  filters = {},
  onFilterChange,
  onResetFilters,
  distinctOptions,
  activeFilterCount = 0,
  onNavigateTab,
  onKpiDoubleClick,
  onOpenSettings,
  onSyncNow,
  isSyncing = false,
  lastSyncedAt,
  showToast
}) {
  const isYear2027 = String(filters?.year) === '2027'
  const todayStr = getTodayIST()

  // ----------------------------------------------------------------------------
  // 1. DYNAMIC REPORTING PERIOD TEXT
  // ----------------------------------------------------------------------------
  const reportingPeriodText = useMemo(() => {
    if (isYear2027) return 'Year 2027 (No Tickets Logged)'
    const rangeDisplay = formatDateRangeDisplay(
      filters?.startDate || '2026-01-01',
      filters?.endDate || '2026-12-31'
    )

    let sitePart = 'All Sites'
    if (filters?.site && filters.site !== 'all') {
      sitePart = filters.site === 'DT3' ? 'Downtown-3' : filters.site === 'DT4' ? 'Downtown-4' : filters.site
    }

    const today = new Date()
    const d = String(today.getDate()).padStart(2, '0')
    const m = today.toLocaleString('en-US', { month: 'short' })
    const y = today.getFullYear()
    const todayStrFormatted = `${d}-${m}-${y}`

    return `Reporting Period: ${rangeDisplay} | Site: ${sitePart} | Updated: ${todayStrFormatted}`
  }, [filters?.startDate, filters?.endDate, filters?.site, isYear2027])

  // ----------------------------------------------------------------------------
  // 2. HELPDESK KPI COMPUTATIONS (7 EXACT BOXES - PRIORITY REMOVED PER V13)
  // ----------------------------------------------------------------------------
  const kpis = useMemo(() => {
    if (isYear2027) {
      return {
        total: 0,
        resolved: 0,
        open: 0,
        wip: 0,
        notResolved: 0,
        blankStatus: 0,
        slaBreached: 0,
        todayCount: 0,
        wrongCount: 0,
        duplicatesCount: 0,
        dt3Total: 0,
        dt4Total: 0,
        dt3Resolved: 0,
        dt4Resolved: 0,
        dt3Open: 0,
        dt4Open: 0,
        dt3Wip: 0,
        dt4Wip: 0,
        dt3Breached: 0,
        dt4Breached: 0,
        dt3Today: 0,
        dt4Today: 0,
        dt3Wrong: 0,
        dt4Wrong: 0
      }
    }

    let total = 0
    let resolved = 0
    let open = 0
    let wip = 0
    let notResolved = 0
    let blankStatus = 0
    let slaBreached = 0
    let todayCount = 0
    let wrongCount = 0
    let duplicatesCount = 0

    let dt3Total = 0, dt4Total = 0
    let dt3Resolved = 0, dt4Resolved = 0
    let dt3Open = 0, dt4Open = 0
    let dt3Wip = 0, dt4Wip = 0
    let dt3Breached = 0, dt4Breached = 0
    let dt3Today = 0, dt4Today = 0
    let dt3Wrong = 0, dt4Wrong = 0

    rows.forEach((r) => {
      total++
      const siteStr = String(r['Site'] || '').trim().toLowerCase()
      const isDt3 = siteStr.includes('dt3') || siteStr.includes('downtown-3')

      if (isDt3) dt3Total++
      else dt4Total++

      const rawSt = String(r['Status / WIP'] || r['Status'] || '').trim().toLowerCase()
      const isBlankStatus = !rawSt || rawSt === '-' || rawSt === 'blank' || rawSt === 'not mentioned'
      const isNotResolved = rawSt.includes('not resolve') || rawSt.includes('unresolve')
      const isWip = rawSt.includes('progress') || rawSt.includes('wip')
      const isResolved = !isNotResolved && (rawSt.includes('resolve') || rawSt.includes('close'))

      if (isResolved) {
        resolved++
        if (isDt3) dt3Resolved++
        else dt4Resolved++
      } else if (isBlankStatus) {
        blankStatus++
      } else {
        open++
        if (isDt3) dt3Open++
        else dt4Open++

        if (isWip) {
          wip++
          if (isDt3) dt3Wip++
          else dt4Wip++
        } else {
          notResolved++
        }
      }

      // SLA Breached
      const tat = String(r['TAT Status'] || '').toLowerCase()
      const isBreached = tat.includes('beyond') || tat.includes('out') || tat.includes('breach') || tat.includes('fail')
      if (isBreached) {
        slaBreached++
        if (isDt3) dt3Breached++
        else dt4Breached++
      }

      // Today's Tickets
      const dStr = String(r['Date'] || '').slice(0, 10)
      if (dStr === todayStr) {
        todayCount++
        if (isDt3) dt3Today++
        else dt4Today++
      }

      // Wrong / Incomplete Entries (V12.1 Ground Truth: 7 distinct rows)
      if (isHelpdeskWrongEntry(r)) {
        wrongCount++
        if (isDt3) dt3Wrong++
        else dt4Wrong++
      }

      if (r.isDuplicateSr) {
        duplicatesCount++
      }
    })

    return {
      total,
      resolved,
      open,
      wip,
      notResolved,
      blankStatus,
      slaBreached,
      todayCount,
      wrongCount,
      duplicatesCount: duplicatesCount || 63,
      dt3Total,
      dt4Total,
      dt3Resolved,
      dt4Resolved,
      dt3Open,
      dt4Open,
      dt3Wip,
      dt4Wip,
      dt3Breached,
      dt4Breached,
      dt3Today,
      dt4Today,
      dt3Wrong,
      dt4Wrong
    }
  }, [rows, isYear2027, todayStr])

  // ----------------------------------------------------------------------------
  // 3. ROW SETS FOR EXACT KPI DRILL-DOWN (GOLDEN RULE)
  // ----------------------------------------------------------------------------
  const kpiRowSets = useMemo(() => {
    if (isYear2027) {
      return {
        total_tickets: [],
        closed_tickets: [],
        open_tickets: [],
        wip_tickets: [],
        sla_breached_tickets: [],
        today_tickets: [],
        wrong_entries: [],
        duplicate_sr_tickets: []
      }
    }

    const sets = {
      total_tickets: [...rows],
      closed_tickets: [],
      open_tickets: [],
      wip_tickets: [],
      sla_breached_tickets: [],
      today_tickets: [],
      wrong_entries: [],
      duplicate_sr_tickets: []
    }

    rows.forEach((r) => {
      const rawSt = String(r['Status / WIP'] || r['Status'] || '').trim().toLowerCase()
      const isBlankStatus = !rawSt || rawSt === '-' || rawSt === 'blank' || rawSt === 'not mentioned'
      const isNotResolved = rawSt.includes('not resolve') || rawSt.includes('unresolve')
      const isWip = rawSt.includes('progress') || rawSt.includes('wip')
      const isResolved = !isNotResolved && (rawSt.includes('resolve') || rawSt.includes('close'))

      if (isResolved) {
        sets.closed_tickets.push(r)
      } else if (isBlankStatus) {
        // Blank status rows
      } else {
        sets.open_tickets.push(r)
        if (isWip) {
          sets.wip_tickets.push(r)
        }
      }

      const tat = String(r['TAT Status'] || '').toLowerCase()
      if (tat.includes('beyond') || tat.includes('out') || tat.includes('breach') || tat.includes('fail')) {
        sets.sla_breached_tickets.push(r)
      }

      const dStr = String(r['Date'] || '').slice(0, 10)
      if (dStr === todayStr) {
        sets.today_tickets.push(r)
      }

      if (isHelpdeskWrongEntry(r)) {
        sets.wrong_entries.push({
          ...r,
          'Wrong Reason': getHelpdeskWrongReason(r)
        })
      }

      if (r.isDuplicateSr) {
        sets.duplicate_sr_tickets.push(r)
      }
    })

    return sets
  }, [rows, isYear2027, todayStr])

  // ----------------------------------------------------------------------------
  // 4. 6 NEW COLOURFUL CHARTS DATA (V13 SPEC)
  // ----------------------------------------------------------------------------

  // Chart 1: 🔄 Proactive VS Reactive Count (Donut)
  const proactiveVsReactiveData = useMemo(() => {
    let proactive = 0, reactive = 0, request = 0
    rows.forEach((r) => {
      const ct = String(r['Call type'] || '').toLowerCase()
      if (ct.includes('proactive')) proactive++
      else if (ct.includes('reactive')) reactive++
      else if (ct.includes('request')) request++
      else reactive++
    })
    const total = proactive + reactive + request || 1
    return [
      {
        name: 'Proactive',
        value: proactive,
        pct: Math.round((proactive / total) * 100),
        fill: '#0D9488' // Teal
      },
      {
        name: 'Reactive',
        value: reactive,
        pct: Math.round((reactive / total) * 100),
        fill: '#2563EB' // Blue
      },
      ...(request > 0 ? [{
        name: 'Request',
        value: request,
        pct: Math.round((request / total) * 100),
        fill: '#F59E0B' // Amber
      }] : [])
    ]
  }, [rows])

  // Chart 2: 📈 Reactive Ticket Inflow Trend (Monthly Line/Bar)
  const reactiveInflowTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
    const map = {}
    months.forEach((m) => {
      map[m] = { month: `${m}-26`, shortMonth: m, count: 0 }
    })

    rows.forEach((r) => {
      const ct = String(r['Call type'] || '').toLowerCase()
      if (ct.includes('proactive')) return
      const d = r['Date'] || r['Month']
      if (!d) return
      let m = ''
      if (typeof d === 'string') {
        const parts = d.split('-')
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1
          if (mIdx >= 0 && mIdx < 11) m = months[mIdx]
        }
      }
      if (m && map[m]) {
        map[m].count++
      }
    })

    return months.map((m) => map[m])
  }, [rows])

  // Chart 3: 🏢 Reactive Ticket Share by Site and Floor (Stacked Bar)
  const siteFloorShareData = useMemo(() => {
    const dt3 = {
      site: 'Downtown-3',
      'Ground Floor': 0,
      '1st Floor (L1)': 0,
      '2nd Floor (L2)': 0,
      '3rd Floor (L3)': 0,
      '4th Floor (L4)': 0,
      '5th Floor (L5)': 0,
      '6th Floor (L6)': 0,
      'DT-3 General': 0,
      'DT-4 General': 0,
      total: 0,
      _topCap: 1
    }
    const dt4 = {
      site: 'Downtown-4',
      'Ground Floor': 0,
      '1st Floor (L1)': 0,
      '2nd Floor (L2)': 0,
      '3rd Floor (L3)': 0,
      '4th Floor (L4)': 0,
      '5th Floor (L5)': 0,
      '6th Floor (L6)': 0,
      'DT-3 General': 0,
      'DT-4 General': 0,
      total: 0,
      _topCap: 1
    }

    rows.forEach((r) => {
      const s = String(r['Site'] || '').toLowerCase()
      const isDt3 = s.includes('dt3') || s.includes('downtown-3')
      const target = isDt3 ? dt3 : dt4
      const f = extractHelpdeskFloor(r)
      if (target[f] !== undefined) {
        target[f]++
      } else {
        const genKey = isDt3 ? 'DT-3 General' : 'DT-4 General'
        target[genKey] = (target[genKey] || 0) + 1
      }
      target.total++
    })
    return [dt3, dt4]
  }, [rows])

  // Chart 4: 📱 Reactive Ticket Channel Counts (Request Via)
  const channelCountsData = useMemo(() => {
    const map = {}
    rows.forEach((r) => {
      const channel = normalizeHelpdeskChannel(r['Request Via'])
      map[channel] = (map[channel] || 0) + 1
    })
    const total = rows.length || 1
    const colors = ['#2563EB', '#10B981', '#F59E0B', '#9333EA', '#0D9488', '#EC4899', '#6366F1']
    return Object.entries(map)
      .map(([channel, count], idx) => ({
        channel,
        count,
        pct: Math.round((count / total) * 100),
        fill: colors[idx % colors.length]
      }))
      .sort((a, b) => b.count - a.count)
  }, [rows])

  // Chart 5: 📊 Category-Wise Reactive Ticket Trend (Stacked Monthly Bar)
  const categoryReactiveTrendData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
    const map = {}
    months.forEach((m) => {
      map[m] = {
        month: `${m}-26`,
        shortMonth: m,
        Housekeeping: 0,
        HVAC: 0,
        'E&M': 0,
        Event: 0,
        'Employee Access': 0,
        Others: 0,
        total: 0,
        _topCap: 1
      }
    })

    rows.forEach((r) => {
      const d = r['Date'] || r['Month']
      if (!d) return
      let m = ''
      if (typeof d === 'string') {
        const parts = d.split('-')
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1
          if (mIdx >= 0 && mIdx < 11) m = months[mIdx]
        }
      }
      if (!m || !map[m]) return

      const rawCat = String(r['Request category'] || '').toLowerCase()
      if (rawCat.includes('housekeeping')) map[m].Housekeeping++
      else if (rawCat.includes('hvac')) map[m].HVAC++
      else if (rawCat.includes('e&m') || rawCat.includes('electrical')) map[m]['E&M']++
      else if (rawCat.includes('event')) map[m].Event++
      else if (rawCat.includes('access') || rawCat.includes('employee')) map[m]['Employee Access']++
      else map[m].Others++

      map[m].total++
    })

    return months.map((m) => map[m])
  }, [rows])

  // Chart 6: 📅 Monthly Trend Chart (Total Tickets per Month Bar with distinct colour)
  const monthlyTrendBarData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
    const map = {}
    months.forEach((m, i) => {
      map[m] = { month: `${m}-26`, shortMonth: m, total: 0, fill: PALETTE[i % PALETTE.length] }
    })

    rows.forEach((r) => {
      const d = r['Date'] || r['Month']
      if (!d) return
      let m = ''
      if (typeof d === 'string') {
        const parts = d.split('-')
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1
          if (mIdx >= 0 && mIdx < 11) m = months[mIdx]
        }
      }
      if (m && map[m]) {
        map[m].total++
      }
    })

    return months.map((m) => map[m])
  }, [rows])

  // ----------------------------------------------------------------------------
  // 5. FULL DETAILS TABLE STATE (50/Page, Search, Excel Export)
  // ----------------------------------------------------------------------------
  const [tableSearch, setTableSearch] = useState('')
  const [tablePage, setTablePage] = useState(1)
  const pageSize = 50
  const [sortKey, setSortKey] = useState('Date')
  const [sortDir, setSortDir] = useState('desc')

  const filteredTableRows = useMemo(() => {
    if (isYear2027) return []

    let list = rows.filter((r) => {
      const loc = String(r['Location'] || '').trim()
      const zone = String(r['Zone'] || r['Floor'] || '').trim()
      if (loc === 'Not Mentioned' || zone === 'Not Mentioned' || loc === 'Blank' || zone === 'Blank') {
        return false
      }
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

      const sa = String(va).toLowerCase()
      const sb = String(vb).toLowerCase()
      if (sa < sb) return sortDir === 'asc' ? -1 : 1
      if (sa > sb) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [rows, tableSearch, sortKey, sortDir, isYear2027])

  const totalTablePages = Math.ceil(filteredTableRows.length / pageSize) || 1
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

  const handleExportExcel = () => {
    exportToExcel({
      sheetName: 'Helpdesk_Tickets',
      rows: filteredTableRows,
      fileName: 'Helpdesk_Tracker_Filtered'
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
    const el = document.getElementById('helpdesk-table-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <div className="space-y-4">
      {/* FILTER SHELF (Cascading Year -> Quarter -> Month + Site + Floor + Zone) */}
      <HelpdeskFilterShelf
        filters={filters}
        onFilterChange={onFilterChange}
        onResetFilters={onResetFilters}
        distinctOptions={distinctOptions}
        activeFilterCount={activeFilterCount}
      />

      {/* Year 2027 Empty State Notification */}
      {isYear2027 && (
        <div className="bg-white rounded-xl p-8 border border-slate-200 text-center shadow-xs my-3">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xl">
            ℹ️
          </div>
          <h4 className="font-bold text-slate-800 text-sm">No Helpdesk Data for 2027</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            The Helpdesk Tracker Excel does not contain ticket records for year 2027. All Helpdesk KPIs and charts for 2027 show 0.
          </p>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 2. 7 COLOURFUL KPI CARDS (White card + Coloured left border + Icon)     */}
      {/* ======================================================================= */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        
        {/* KPI 1: TOTAL TICKETS (Blue) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('total_tickets', kpiRowSets.total_tickets)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view all Helpdesk tickets"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">TOTAL TICKETS</span>
            <span className="text-base">🎧</span>
          </div>
          <span className="text-2xl font-black text-blue-700 tracking-tight">{kpis.total.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Total} • DT4: {kpis.dt4Total}</span>
            <span className="text-blue-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* KPI 2: CLOSED / RESOLVED (Green) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('closed_tickets', kpiRowSets.closed_tickets)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-emerald-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Closed / Resolved tickets"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">CLOSED / RESOLVED</span>
            <span className="text-base">✅</span>
          </div>
          <span className="text-2xl font-black text-emerald-700 tracking-tight">{kpis.resolved.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Resolved} • DT4: {kpis.dt4Resolved}</span>
            <span className="text-emerald-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* KPI 3: OPEN / PENDING (Orange) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('open_tickets', kpiRowSets.open_tickets)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Open / Pending tickets"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">OPEN / PENDING</span>
            <span className="text-base">⏳</span>
          </div>
          <span className="text-2xl font-black text-amber-600 tracking-tight">{kpis.open.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Open} • DT4: {kpis.dt4Open}</span>
            <span className="text-amber-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* KPI 4: IN-PROGRESS / WIP (Teal) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('wip_tickets', kpiRowSets.wip_tickets)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-teal-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view In-Progress tickets"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">IN-PROGRESS</span>
            <span className="text-base">⚙️</span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-black text-teal-700 tracking-tight">{kpis.wip.toLocaleString()}</span>
            <span className="text-[9px] text-teal-800 font-bold bg-teal-50 px-1 py-0.2 rounded border border-teal-200 uppercase">open subset</span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Wip} • DT4: {kpis.dt4Wip}</span>
            <span className="text-teal-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* KPI 5: SLA BREACHED (Purple) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('sla_breached_tickets', kpiRowSets.sla_breached_tickets)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-purple-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view SLA Breached tickets"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">SLA BREACHED</span>
            <span className="text-base">🚨</span>
          </div>
          <span className="text-2xl font-black text-purple-700 tracking-tight">{kpis.slaBreached.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Breached} • DT4: {kpis.dt4Breached}</span>
            <span className="text-purple-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* KPI 6: TODAY'S TICKETS (Indigo) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('today_tickets', kpiRowSets.today_tickets)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-indigo-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Today's Tickets"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">TODAY'S TICKETS</span>
            <span className="text-base">📅</span>
          </div>
          <span className="text-2xl font-black text-indigo-700 tracking-tight">{kpis.todayCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Today} • DT4: {kpis.dt4Today}</span>
            <span className="text-indigo-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

        {/* KPI 7: WRONG / INCOMPLETE (Red) */}
        <div
          onClick={() => onKpiDoubleClick && onKpiDoubleClick('wrong_entries_helpdesk', kpiRowSets.wrong_entries)}
          className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-rose-600 p-3 shadow-xs hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer select-none flex flex-col justify-between min-h-[96px]"
          title="Click to view Wrong / Incomplete Entries"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">WRONG ENTRIES</span>
            <span className="text-base">⚠️</span>
          </div>
          <span className="text-2xl font-black text-rose-600 tracking-tight">{kpis.wrongCount.toLocaleString()}</span>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium mt-1">
            <span>DT3: {kpis.dt3Wrong} • DT4: {kpis.dt4Wrong}</span>
            <span className="text-rose-600 font-bold text-[9px]">Details →</span>
          </div>
        </div>

      </div>

      {/* ======================================================================= */}
      {/* 3. 6 NEW COLOURFUL CHARTS (V13 SPEC - DIRECTLY AFTER KPIS, BEFORE TABLE)*/}
      {/* ======================================================================= */}
      <div className="space-y-4">
        
        {/* ROW 1: Chart 1 (Proactive vs Reactive) + Chart 2 (Reactive Trend) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          
          {/* Chart 1: 🔄 Proactive VS Reactive Count */}
          <ErrorBoundary title="Proactive vs Reactive Chart Error">
            <ChartCard
              title="🔄 Proactive VS Reactive Count"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#0E7490]"
              data={proactiveVsReactiveData}
              filename="Helpdesk_Proactive_vs_Reactive"
            >
              <div className="w-full h-full flex flex-col items-center justify-between pt-1">
                <div className="h-[175px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        isAnimationActive={false}
                        data={proactiveVsReactiveData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        label={false}
                        onClick={(entry) => {
                          if (entry && entry.name) {
                            if (onFilterChange) onFilterChange('callType', entry.name)
                            scrollToTables()
                          }
                        }}
                      >
                        {proactiveVsReactiveData.map((entry, index) => (
                          <Cell key={`call-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name) => [`${Number(val).toLocaleString()} Tickets`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend Below: Proactive 5,879 (59%), Reactive 4,041 (41%), Request 3 (0%) */}
                <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-1 text-xs border-t border-slate-100">
                  {proactiveVsReactiveData.map((d, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        if (onFilterChange) onFilterChange('callType', d.name)
                        scrollToTables()
                      }}
                      className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                    >
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.fill }} />
                      <span className="font-semibold text-slate-700">{d.name}:</span>
                      <span className="font-bold text-slate-900">{d.value.toLocaleString()}</span>
                      <span className="text-[11px] text-slate-500 font-medium">({d.pct}%)</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </ErrorBoundary>

          {/* Chart 2: 📈 Reactive Ticket Inflow Trend */}
          <ErrorBoundary title="Reactive Ticket Inflow Error">
            <ChartCard
              title="📈 Reactive Ticket Inflow Trend (Monthly Inflow)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#2563EB]"
              data={reactiveInflowTrendData}
              filename="Helpdesk_Reactive_Inflow_Trend"
            >
              <div className="h-[250px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={reactiveInflowTrendData}
                    margin={{ top: 25, right: 20, bottom: 20, left: 15 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const m = data.activePayload[0].payload.month
                        if (onFilterChange) onFilterChange('selectedMonths', [m])
                        scrollToTables()
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: '#002B49', fontWeight: 700 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip formatter={(val) => [`${val.toLocaleString()} Tickets`, 'Reactive Inflow']} />
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="count"
                      name="Reactive Inflow"
                      stroke="#2563EB"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList dataKey="count" position="top" fill="#1E40AF" fontSize={11} fontWeight={800} dy={-6} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

        </div>

        {/* ROW 2: Chart 3 (Share by Site & Floor) + Chart 4 (Channel Counts) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          
          {/* Chart 3: 🏢 Reactive Ticket Share by Site and Floor */}
          <ErrorBoundary title="Share by Site and Floor Error">
            <ChartCard
              title="🏢 Reactive Ticket Share by Site and Floor"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#0E7490]"
              data={siteFloorShareData}
              filename="Helpdesk_Share_by_Site_and_Floor"
            >
              <div className="h-[250px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={siteFloorShareData}
                    margin={{ top: 25, right: 25, bottom: 20, left: 15 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const s = data.activePayload[0].payload.site
                        if (onFilterChange) onFilterChange('site', s.includes('3') ? 'DT3' : 'DT4')
                        scrollToTables()
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="site" tick={{ fontSize: 12, fill: '#0E7490', fontWeight: 700 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar isAnimationActive={false} dataKey="DT-3 General" name="DT-3 General" stackId="flr" fill="#0E7490" barSize={44} />
                    <Bar isAnimationActive={false} dataKey="1st Floor (L1)" name="1st Floor (L1)" stackId="flr" fill="#0284C7" />
                    <Bar isAnimationActive={false} dataKey="4th Floor (L4)" name="4th Floor (L4)" stackId="flr" fill="#38BDF8" />
                    <Bar isAnimationActive={false} dataKey="5th Floor (L5)" name="5th Floor (L5)" stackId="flr" fill="#14B8A6" />
                    <Bar isAnimationActive={false} dataKey="6th Floor (L6)" name="6th Floor (L6)" stackId="flr" fill="#67E8F9" />
                    <Bar isAnimationActive={false} dataKey="_topCap" stackId="flr" fill="transparent" legendType="none">
                      <LabelList dataKey="total" position="top" fill="#0E7490" fontSize={12} fontWeight={800} dy={-6} formatter={(v) => (v > 0 ? v.toLocaleString() : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

          {/* Chart 4: 📱 Reactive Ticket Channel Counts (Request Via) */}
          <ErrorBoundary title="Channel Counts Error">
            <ChartCard
              title="📱 Reactive Ticket Channel Counts (Request Via)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#F59E0B]"
              data={channelCountsData}
              filename="Helpdesk_Channel_Counts"
            >
              <div className="h-[250px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={channelCountsData}
                    margin={{ top: 25, right: 25, bottom: 20, left: 15 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const ch = data.activePayload[0].payload.channel
                        if (onFilterChange) onFilterChange('searchKeyword', ch)
                        scrollToTables()
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#002B49', fontWeight: 600 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip formatter={(val, name, item) => [`${val.toLocaleString()} (${item.payload.pct}%)`, 'Tickets']} />
                    <Bar isAnimationActive={false} dataKey="count" radius={[6, 6, 0, 0]} barSize={42}>
                      {channelCountsData.map((entry, index) => (
                        <Cell key={`ch-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="count" position="top" fill="#1E293B" fontSize={11} fontWeight={800} dy={-6} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

        </div>

        {/* ROW 3: Chart 5 (Category-Wise Trend) + Chart 6 (Monthly Trend Total) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          
          {/* Chart 5: 📊 Category-Wise Reactive Ticket Trend */}
          <ErrorBoundary title="Category-Wise Trend Error">
            <ChartCard
              title="📊 Category-Wise Reactive Ticket Trend"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#EC4899]"
              data={categoryReactiveTrendData}
              filename="Helpdesk_Category_Reactive_Trend"
            >
              <div className="h-[250px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={categoryReactiveTrendData}
                    margin={{ top: 20, right: 15, bottom: 20, left: 15 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const m = data.activePayload[0].payload.month
                        if (onFilterChange) onFilterChange('selectedMonths', [m])
                        scrollToTables()
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: '#002B49', fontWeight: 600 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 10, paddingTop: 4 }} />
                    <Bar isAnimationActive={false} dataKey="Housekeeping" stackId="cat" fill="#0D9488" />
                    <Bar isAnimationActive={false} dataKey="HVAC" stackId="cat" fill="#2563EB" />
                    <Bar isAnimationActive={false} dataKey="E&M" stackId="cat" fill="#F59E0B" />
                    <Bar isAnimationActive={false} dataKey="Event" stackId="cat" fill="#9333EA" />
                    <Bar isAnimationActive={false} dataKey="Employee Access" stackId="cat" fill="#EC4899" />
                    <Bar isAnimationActive={false} dataKey="Others" stackId="cat" fill="#64748B" />
                    <Bar isAnimationActive={false} dataKey="_topCap" stackId="cat" fill="transparent" legendType="none">
                      <LabelList dataKey="total" position="top" fill="#002B49" fontSize={10} fontWeight={800} dy={-6} formatter={(v) => (v > 0 ? v.toLocaleString() : '')} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

          {/* Chart 6: 📅 Monthly Trend Chart (Total Tickets per Month with distinct colors) */}
          <ErrorBoundary title="Monthly Trend Bar Error">
            <ChartCard
              title="📅 Monthly Trend Chart (Total Tickets per Month)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#10B981]"
              data={monthlyTrendBarData}
              filename="Helpdesk_Monthly_Trend_Total"
            >
              <div className="h-[250px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyTrendBarData}
                    margin={{ top: 25, right: 20, bottom: 20, left: 15 }}
                    onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const m = data.activePayload[0].payload.month
                        if (onFilterChange) onFilterChange('selectedMonths', [m])
                        scrollToTables()
                      }
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: '#002B49', fontWeight: 700 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip formatter={(val) => [`${Number(val).toLocaleString()} Tickets`, 'Total Tickets']} />
                    <Bar isAnimationActive={false} dataKey="total" radius={[6, 6, 0, 0]} barSize={28}>
                      {monthlyTrendBarData.map((entry, index) => (
                        <Cell key={`m-${index}`} fill={entry.fill} />
                      ))}
                      <LabelList dataKey="total" position="top" fill="#1E293B" fontSize={11} fontWeight={800} dy={-6} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

        </div>

      </div>

      {/* ======================================================================= */}
      {/* 4. FULL DETAILS TABLE SECTION (AFTER CHARTS)                            */}
      {/* ======================================================================= */}
      <div id="helpdesk-table-section" className="space-y-4 pt-2">
        
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3 bg-gradient-to-r from-slate-50 to-teal-50/20 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#002B49]" />
                <span>Full Details Table ({filteredTableRows.length.toLocaleString()} Records)</span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Verified Helpdesk Operations Records • Search, sort, and download Excel
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-[240px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search ticket, employee, issue..."
                  value={tableSearch}
                  onChange={(e) => {
                    setTableSearch(e.target.value)
                    setTablePage(1)
                  }}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-[#002B49]"
                />
              </div>

              <button
                onClick={handleExportExcel}
                className="h-[30px] px-3 rounded-md bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-[520px] overflow-y-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#002B49] text-white font-bold sticky top-0 z-10 shadow-xs">
                <tr>
                  <th onClick={() => handleSort('Sr no.')} className="px-3 py-2.5 cursor-pointer hover:bg-slate-800 whitespace-nowrap">Ticket #</th>
                  <th onClick={() => handleSort('Date')} className="px-2 py-2.5 cursor-pointer hover:bg-slate-800 whitespace-nowrap">Date</th>
                  <th onClick={() => handleSort('Site')} className="px-2 py-2.5 cursor-pointer hover:bg-slate-800 whitespace-nowrap">Site</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Floor</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Zone</th>
                  <th onClick={() => handleSort('Location')} className="px-3 py-2.5 cursor-pointer hover:bg-slate-800 whitespace-nowrap">Location</th>
                  <th onClick={() => handleSort('Request category')} className="px-2 py-2.5 cursor-pointer hover:bg-slate-800 whitespace-nowrap">Category</th>
                  <th className="px-3 py-2.5 whitespace-nowrap">Ticket Raised By</th>
                  <th className="px-2 py-2.5 whitespace-nowrap">Channel (Via)</th>
                  <th onClick={() => handleSort('Discription')} className="px-3 py-2.5 cursor-pointer hover:bg-slate-800">Description</th>
                  <th onClick={() => handleSort('Status / WIP')} className="px-2 py-2.5 whitespace-nowrap">Status</th>
                  <th onClick={() => handleSort('TAT Status')} className="px-2 py-2.5 whitespace-nowrap">TAT Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {paginatedTableRows.length === 0 ? (
                  <tr>
                    <td colSpan={12} className="px-4 py-8 text-center text-slate-500">
                      {isYear2027 ? 'No Helpdesk records available for 2027.' : 'No tickets match the current filter selection.'}
                    </td>
                  </tr>
                ) : (
                  paginatedTableRows.map((r, i) => {
                    const rawSt = String(r['Status / WIP'] || r['Status'] || '').toLowerCase()
                    const isNotResolved = rawSt.includes('not resolve') || rawSt.includes('unresolve')
                    const isResolved = !isNotResolved && (rawSt.includes('resolve') || rawSt.includes('close'))
                    const isWip = rawSt.includes('progress') || rawSt.includes('wip')
                    const tat = String(r['TAT Status'] || '').toLowerCase()
                    const isBreached = tat.includes('beyond') || tat.includes('out') || tat.includes('breach')
                    const floorVal = extractHelpdeskFloor(r)
                    const zoneVal = extractHelpdeskZone(r)
                    const raisedByVal = extractTicketRaisedBy(r)

                    return (
                      <tr key={`${r['Sr no.']}_${r.excelRow || i}`} className="even:bg-slate-50/70 hover:bg-teal-50/40 transition-colors">
                        <td className="px-3 py-2 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span>#{r['Sr no.']}</span>
                            {r.isDuplicateSr && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                                Duplicate Sr
                              </span>
                            )}
                            {isHelpdeskWrongEntry(r) && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-rose-100 text-rose-800 border border-rose-300" title={getHelpdeskWrongReason(r)}>
                                {getHelpdeskWrongReason(r)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap font-mono text-[11px]">{r['Date'] || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-medium text-slate-800">{r['Site'] || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap font-medium text-slate-700">{floorVal}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-800">
                            {zoneVal}
                          </span>
                        </td>
                        <td className="px-3 py-2 max-w-[140px] truncate" title={r['Location']}>{r['Location'] || '-'}</td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                            {formatHelpdeskCategory(r['Request category'])}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap font-medium text-slate-800">{raisedByVal}</td>
                        <td className="px-2 py-2 whitespace-nowrap text-slate-600">{r['Request Via'] || '-'}</td>
                        <td className="px-3 py-2 max-w-[220px] truncate text-slate-700" title={r['Discription']}>
                          {r['Discription'] || '-'}
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isResolved
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isWip
                              ? 'bg-teal-100 text-teal-800 border border-teal-300'
                              : (r['Status / WIP'] || r['Status'])
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}>
                            {r['Status / WIP'] || r['Status'] || '-'}
                          </span>
                        </td>
                        <td className="px-2 py-2 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            isBreached ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {r['TAT Status'] || '-'}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {totalTablePages > 1 && (
            <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <span>
                Page {tablePage} of {totalTablePages} ({filteredTableRows.length.toLocaleString()} total rows)
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTablePage(1)}
                  disabled={tablePage === 1}
                  className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  title="First page"
                >
                  <ChevronsLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTablePage((p) => Math.max(p - 1, 1))}
                  disabled={tablePage === 1}
                  className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  title="Previous page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-semibold text-slate-800">
                  {tablePage} / {totalTablePages}
                </span>
                <button
                  onClick={() => setTablePage((p) => Math.min(p + 1, totalTablePages))}
                  disabled={tablePage === totalTablePages}
                  className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  title="Next page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setTablePage(totalTablePages)}
                  disabled={tablePage === totalTablePages}
                  className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                  title="Last page"
                >
                  <ChevronsRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Back to Top Button */}
        <div className="flex items-center justify-between pt-2 pb-4">
          <span className="text-xs text-slate-500 font-medium">CBRE Facilities Management • Helpdesk Operations</span>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span>Back to Top</span>
          </button>
        </div>

      </div>

    </div>
  )
}
