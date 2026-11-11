// ==============================================================================
// FACILITY OPERATIONS DASHBOARD - STACKED OVERVIEW (V16 GROUND TRUTH)
// Single Page App • CBRE Facilities • Downtown-3 & Downtown-4
// Section A (Top): HELPDESK OVERVIEW (Blue/Teal Theme #0E7490)
// Section B (Bottom): EVENT OVERVIEW (Orange/Green Theme #EA580C)
// Connected with Shared Date & Site Filter Engine
// ==============================================================================
import React, { useState, useMemo } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList
} from 'recharts'
import {
  Headphones,
  CalendarDays,
  ArrowRight,
  Filter,
  RotateCcw,
  Search,
  Calendar,
  Building2,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react'
import { ChartCard } from './ChartCard'
import { ErrorBoundary } from './ErrorBoundary'
import { CustomDateRangePicker } from './CustomDateRangePicker'
import {
  parseDate,
  formatDateDisplay,
  formatDateRangeDisplay,
  formatMonthYear,
  getTodayIST,
  normalizeFloor,
  deriveBuilding,
  cleanSite,
  getScale,
  parsePax,
  isValidEvent,
  getSmartStatusString,
  getEventDerivedStatus,
  deriveEventCategory,
  extractHelpdeskFloor,
  isHelpdeskWrongEntry,
  getHelpdeskWrongReason
} from '../lib/dateUtils'

export function OverviewSection({
  helpdeskRows = [],
  eventRows = [],
  onNavigateTab,
  onKpiDoubleClick,
  onSyncNow,
  lastSyncedAt,
  isSyncing = false
}) {
  // ----------------------------------------------------------------------------
  // 1. SHARED OVERVIEW FILTERS (Controls BOTH Helpdesk & Event sections)
  // ----------------------------------------------------------------------------
  const [startDate, setStartDate] = useState('2026-01-01')
  const [endDate, setEndDate] = useState('2026-12-31')
  const [selectedSite, setSelectedSite] = useState('All') // 'All' | 'Downtown-3' | 'Downtown-4'
  const [searchKeyword, setSearchKeyword] = useState('')

  const todayStr = useMemo(() => getTodayIST(), [])

  // Quick reset
  const handleResetFilters = () => {
    setStartDate('2026-01-01')
    setEndDate('2026-12-31')
    setSelectedSite('All')
    setSearchKeyword('')
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (startDate !== '2026-01-01' || endDate !== '2026-12-31') count++
    if (selectedSite !== 'All') count++
    if (searchKeyword.trim()) count++
    return count
  }, [startDate, endDate, selectedSite, searchKeyword])

  // Filter Subtitle Text
  const reportingPeriodText = useMemo(() => {
    const dText = formatDateRangeDisplay(startDate || '2026-01-01', endDate || '2026-12-31')
    const sText = selectedSite === 'All' ? 'All Sites' : selectedSite
    return `Period: ${dText} | Site: ${sText}`
  }, [startDate, endDate, selectedSite])

  // Scroll to Event section helper
  const scrollToEventSection = () => {
    const el = document.getElementById('overview-event-section')
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  // ----------------------------------------------------------------------------
  // 2. HELPDESK FILTERED DATA & KPIS (Section A)
  // ----------------------------------------------------------------------------
  const filteredHelpdesk = useMemo(() => {
    return helpdeskRows.filter((r) => {
      // Site filter
      const s = String(r['Site'] || '').toLowerCase()
      if (selectedSite === 'Downtown-3' && !s.includes('dt3') && !s.includes('downtown-3')) return false
      if (selectedSite === 'Downtown-4' && !s.includes('dt4') && !s.includes('downtown-4')) return false

      // Date filter
      const dStr = String(r['Date'] || r['Month'] || '').slice(0, 10)
      if (datePreset === 'today' && dStr !== todayStr) return false
      if (datePreset === 'nov26' && (dStr < '2026-11-01' || dStr > '2026-11-10')) return false
      if (startDate && dStr && dStr < startDate) return false
      if (endDate && dStr && dStr > endDate) return false

      // Search keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim()
        const full = (
          String(r['Sr no.'] || '') + ' ' +
          String(r['Discription'] || '') + ' ' +
          String(r['Employee Name'] || '') + ' ' +
          String(r['Request category'] || '') + ' ' +
          String(r['Site'] || '')
        ).toLowerCase()
        if (!full.includes(q)) return false
      }

      return true
    })
  }, [helpdeskRows, selectedSite, datePreset, startDate, endDate, searchKeyword, todayStr])

  const helpdeskKpis = useMemo(() => {
    let total = 0
    let closed = 0
    let open = 0
    let wip = 0
    let breached = 0
    let wrong = 0

    filteredHelpdesk.forEach((r) => {
      total++
      const rawSt = String(r['Status / WIP'] || r['Status'] || '').trim().toLowerCase()
      const isBlankStatus = !rawSt || rawSt === '-' || rawSt === 'blank' || rawSt === 'not mentioned'
      const isNotResolved = rawSt.includes('not resolve') || rawSt.includes('unresolve')
      const isWipTicket = rawSt.includes('progress') || rawSt.includes('wip')
      const isResolved = !isNotResolved && (rawSt.includes('resolve') || rawSt.includes('close'))

      if (isResolved) {
        closed++
      } else if (!isBlankStatus) {
        open++
        if (isWipTicket) wip++
      }

      const tat = String(r['TAT Status'] || '').toLowerCase()
      if (tat.includes('beyond') || tat.includes('out') || tat.includes('breach') || tat.includes('fail')) {
        breached++
      }

      if (isHelpdeskWrongEntry(r)) {
        wrong++
      }
    })

    return { total, closed, open, wip, breached, wrong }
  }, [filteredHelpdesk])

  // Helpdesk Chart 1: Proactive vs Reactive (Donut with bottom legend)
  const hdProactiveVsReactive = useMemo(() => {
    let proactive = 0, reactive = 0, request = 0
    filteredHelpdesk.forEach((r) => {
      const ct = String(r['Call type'] || '').toLowerCase()
      if (ct.includes('proactive')) proactive++
      else if (ct.includes('reactive')) reactive++
      else if (ct.includes('request')) request++
      else reactive++
    })
    const total = proactive + reactive + request || 1
    return [
      { name: 'Proactive', value: proactive, pct: Math.round((proactive / total) * 100), fill: '#0E7490' },
      { name: 'Reactive', value: reactive, pct: Math.round((reactive / total) * 100), fill: '#0284C7' },
      ...(request > 0 ? [{ name: 'Request', value: request, pct: Math.round((request / total) * 100), fill: '#F59E0B' }] : [])
    ]
  }, [filteredHelpdesk])

  // Helpdesk Chart 2: Monthly Inflow Trend (Line Chart)
  const hdMonthlyInflow = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov']
    const map = {}
    months.forEach((m) => {
      map[m] = { month: `${m}-26`, shortMonth: m, count: 0 }
    })

    filteredHelpdesk.forEach((r) => {
      const ct = String(r['Call type'] || '').toLowerCase()
      if (ct.includes('proactive')) return
      const d = r['Date'] || r['Month']
      if (!d) return
      if (typeof d === 'string') {
        const parts = d.split('-')
        if (parts.length >= 2) {
          const mIdx = parseInt(parts[1], 10) - 1
          if (mIdx >= 0 && mIdx < 11) {
            const m = months[mIdx]
            if (map[m]) map[m].count++
          }
        }
      }
    })

    return months.map((m) => map[m])
  }, [filteredHelpdesk])

  // Helpdesk Chart 3: Share by Site and Floor (Stacked Bar - zero buckets hidden)
  const hdSiteFloorShare = useMemo(() => {
    const dt3 = { site: 'Downtown-3', 'DT-3 General': 0, '1st Floor (L1)': 0, '4th Floor (L4)': 0, '5th Floor (L5)': 0, '6th Floor (L6)': 0, total: 0 }
    const dt4 = { site: 'Downtown-4', 'DT-3 General': 0, '1st Floor (L1)': 0, '4th Floor (L4)': 0, '5th Floor (L5)': 0, '6th Floor (L6)': 0, total: 0 }

    filteredHelpdesk.forEach((r) => {
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
  }, [filteredHelpdesk])

  // Helpdesk Chart 4: Channel Counts (Request Via)
  const hdChannelCounts = useMemo(() => {
    const map = {}
    filteredHelpdesk.forEach((r) => {
      let via = String(r['Request Via'] || '').trim()
      if (!via || via === '-' || via.toLowerCase() === 'unspecified') via = 'Other'
      if (via.toLowerCase() === 'in person') via = 'In Person'
      map[via] = (map[via] || 0) + 1
    })
    const colors = ['#0E7490', '#0284C7', '#38BDF8', '#67E8F9', '#14B8A6']
    return Object.entries(map)
      .map(([channel, count], idx) => ({
        channel,
        count,
        fill: colors[idx % colors.length]
      }))
      .sort((a, b) => b.count - a.count)
  }, [filteredHelpdesk])

  // ----------------------------------------------------------------------------
  // 3. EVENT FILTERED DATA & KPIS (Section B)
  // ----------------------------------------------------------------------------
  const { validEvents, wrongEvents } = useMemo(() => {
    const valid = []
    const wrong = []

    eventRows.forEach((r) => {
      // 1. Mandatory Valid Event Rule (V15/V16)
      const isValid = isValidEvent(r)

      // 2. Site filter
      const b = deriveBuilding(r)
      if (selectedSite === 'Downtown-3' && b !== 'Downtown-3') return
      if (selectedSite === 'Downtown-4' && b !== 'Downtown-4') return

      // 3. Date filter
      const dRaw = r['Event Date'] || r['Booking Date'] || r['Date']
      const p = parseDate(dRaw)
      const dStr = p ? `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}` : ''

      if (datePreset === 'today' && dStr !== todayStr) return
      if (datePreset === 'nov26' && (dStr < '2026-11-01' || dStr > '2026-11-10')) return
      if (startDate && dStr && dStr < startDate) return
      if (endDate && dStr && dStr > endDate) return

      // 4. Search keyword
      if (searchKeyword.trim()) {
        const q = searchKeyword.toLowerCase().trim()
        const full = (
          String(r['Event ID'] || '') + ' ' +
          String(r['Category'] || '') + ' ' +
          String(r['Event Title / Purpose'] || '') + ' ' +
          String(r['Booked By'] || '') + ' ' +
          String(r['Location'] || '') + ' ' +
          String(r['Floor'] || '')
        ).toLowerCase()
        if (!full.includes(q)) return
      }

      if (isValid) valid.push(r)
      else wrong.push(r)
    })

    return { validEvents: valid, wrongEvents: wrong }
  }, [eventRows, selectedSite, datePreset, startDate, endDate, searchKeyword, todayStr])

  const eventKpis = useMemo(() => {
    let total = 0
    let completed = 0
    let cancelled = 0
    let upcoming = 0
    let big = 0
    let small = 0
    let todayCount = 0

    validEvents.forEach((r) => {
      total++
      const smartSt = getSmartStatusString(r)
      if (smartSt === 'Completed' || smartSt === 'Completed (Auto)') completed++
      else if (smartSt === 'Cancelled') cancelled++
      else if (smartSt === 'Upcoming') upcoming++

      const rawPax = r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : r['Capacity']
      if (getScale(rawPax) === 'Big Event') big++
      else small++

      const dRaw = r['Event Date'] || r['Booking Date'] || r['Date']
      const p = parseDate(dRaw)
      const dStr = p ? `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}` : ''
      if (dStr === todayStr) todayCount++
    })

    return {
      total,
      completed,
      cancelled,
      upcoming,
      big,
      small,
      todayCount,
      wrongCount: wrongEvents.length
    }
  }, [validEvents, wrongEvents, todayStr])

  // Event Chart 1: Site-Wise Bifurcation (Donut DT-3 vs DT-4)
  const eventSiteBifurcation = useMemo(() => {
    let dt3 = 0, dt4 = 0
    validEvents.forEach((r) => {
      const b = deriveBuilding(r)
      if (b === 'Downtown-3') dt3++
      else dt4++
    })
    const total = dt3 + dt4 || 1
    const res = []
    if (dt3 > 0 || dt4 === 0) {
      res.push({
        name: 'Downtown-3 (DT-3)',
        shortName: 'DT-3',
        value: dt3,
        percent: `${((dt3 / total) * 100).toFixed(1)}%`,
        fill: '#1F2937' // DT-3 Dark Charcoal
      })
    }
    if (dt4 > 0 || dt3 === 0) {
      res.push({
        name: 'Downtown-4 (DT-4)',
        shortName: 'DT-4',
        value: dt4,
        percent: `${((dt4 / total) * 100).toFixed(1)}%`,
        fill: '#16A34A' // DT-4 Green
      })
    }
    return res
  }, [validEvents])

  // Event Chart 2: Events by Floor (Stacked Bar - ZERO-ONLY BUCKETS HIDDEN)
  const eventFloorData = useMemo(() => {
    const floorOrder = ['Ground', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6']
    const map = {}
    floorOrder.forEach((fl) => {
      map[fl] = { floor: fl, dt3: 0, dt4: 0, total: 0 }
    })

    validEvents.forEach((r) => {
      const b = deriveBuilding(r)
      const fl = normalizeFloor(r['Floor'])
      if (fl && map[fl]) {
        if (b === 'Downtown-3') map[fl].dt3++
        else map[fl].dt4++
        map[fl].total++
      }
    })

    // Hide zero-only buckets per V18 Spec!
    return floorOrder
      .filter((fl) => map[fl].total > 0)
      .map((fl) => map[fl])
  }, [validEvents])

  // Event Chart 3: Events by Category (Horizontal Bar)
  const eventCategoryData = useMemo(() => {
    const map = {}
    validEvents.forEach((r) => {
      const cat = deriveEventCategory(r)
      map[cat] = (map[cat] || 0) + 1
    })
    return Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
  }, [validEvents])

  // Event Chart 4: Monthly Trend (Line + Bar Combo)
  const eventMonthlyTrend = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const map = {}
    monthNames.forEach((m) => {
      map[m] = { month: `${m}-26`, shortMonth: m, dt3: 0, dt4: 0, total: 0 }
    })

    validEvents.forEach((r) => {
      const m = String(r['Month'] || '').slice(0, 3)
      if (map[m]) {
        const b = deriveBuilding(r)
        if (b === 'Downtown-3') map[m].dt3++
        else map[m].dt4++
        map[m].total++
      }
    })

    return monthNames.map((m) => map[m])
  }, [validEvents])

  return (
    <div className="space-y-6">
      
      {/* ======================================================================= */}
      {/* 1. TOP SHARED OVERVIEW FILTER SHELF                                     */}
      {/* ======================================================================= */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Overview Shared Filters
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              (Controls both Helpdesk &amp; Event sections)
            </span>
            {activeFilterCount > 0 && (
              <span className="bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {activeFilterCount} active
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-xs border border-rose-300 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 font-bold px-2.5 py-1 rounded transition-colors shadow-2xs cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 text-xs">
          {/* Custom Date Range Picker */}
          <div className="flex-1 max-w-xl">
            <CustomDateRangePicker
              startDate={startDate}
              endDate={endDate}
              accent="teal"
              onApply={({ startDate: s, endDate: e }) => {
                setStartDate(s)
                setEndDate(e)
              }}
              onReset={() => {
                setStartDate('2026-01-01')
                setEndDate('2026-12-31')
              }}
            />
          </div>

          {/* Site Selection */}
          <div className="w-full sm:w-64">
            <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#003231]" />
              <span>Site / Building</span>
            </label>
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-2.5 py-1 text-xs text-slate-800 font-semibold focus:ring-1 focus:ring-[#003231] shadow-2xs"
            >
              <option value="All">All Sites (Downtown-3 &amp; Downtown-4)</option>
              <option value="Downtown-3">Downtown-3 (DT-3)</option>
              <option value="Downtown-4">Downtown-4 (DT-4)</option>
            </select>
          </div>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* SECTION A (TOP): "HELPDESK OVERVIEW" (Blue Theme #0E7490)               */}
      {/* ======================================================================= */}
      <section className="bg-white border-2 border-[#0E7490]/30 rounded-2xl shadow-sm p-4 space-y-4">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-[#0E7490] to-[#0284C7] text-white p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg shrink-0">
              <Headphones className="w-5 h-5 text-cyan-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight uppercase">HELPDESK OVERVIEW</h2>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                  Section A
                </span>
              </div>
              <p className="text-xs text-cyan-100 font-medium">{reportingPeriodText}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('helpdesk')}
              className="px-3.5 py-1.5 bg-white text-[#0E7490] hover:bg-cyan-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>View Full Helpdesk</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Helpdesk KPIs (6 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* 1. Total Tickets */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('total_tickets', filteredHelpdesk)}
            className="bg-slate-50 hover:bg-cyan-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-[#0E7490] shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0E7490]">TOTAL TICKETS</span>
            <span className="text-2xl font-black text-[#0E7490] mt-1">{helpdeskKpis.total.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">All logged tickets</span>
          </div>

          {/* 2. Closed / Resolved */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('closed_tickets')}
            className="bg-slate-50 hover:bg-cyan-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-[#0284C7] shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">RESOLVED</span>
            <span className="text-2xl font-black text-[#0284C7] mt-1">{helpdeskKpis.closed.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">99.7% Resolution</span>
          </div>

          {/* 3. Open / Pending */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('open_tickets')}
            className="bg-slate-50 hover:bg-amber-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-amber-500 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">OPEN / PENDING</span>
            <span className="text-2xl font-black text-amber-700 mt-1">{helpdeskKpis.open.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Active operational</span>
          </div>

          {/* 4. WIP */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('wip_tickets')}
            className="bg-slate-50 hover:bg-purple-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-purple-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">IN PROGRESS</span>
            <span className="text-2xl font-black text-purple-700 mt-1">{helpdeskKpis.wip.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">WIP tickets</span>
          </div>

          {/* 5. SLA Breached */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('sla_breached_tickets')}
            className="bg-slate-50 hover:bg-red-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-red-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">SLA BREACHED</span>
            <span className="text-2xl font-black text-red-600 mt-1">{helpdeskKpis.breached.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Target overdue</span>
          </div>

          {/* 6. Wrong Entries */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('wrong_entries_helpdesk')}
            className="bg-slate-50 hover:bg-rose-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-rose-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">WRONG ENTRIES</span>
            <span className="text-2xl font-black text-rose-600 mt-1">{helpdeskKpis.wrong.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Quality issues</span>
          </div>
        </div>

        {/* Helpdesk Charts (2x2 Grid) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* Chart 1: Proactive vs Reactive (Donut with bottom legend) */}
          <ErrorBoundary title="Proactive vs Reactive Chart Error">
            <ChartCard
              title="🔄 Proactive VS Reactive Count"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#0E7490]"
              data={hdProactiveVsReactive}
              filename="Overview_Helpdesk_Proactive_vs_Reactive"
            >
              <div className="w-full h-full flex flex-col items-center justify-between pt-1">
                <div className="h-[175px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        isAnimationActive={false}
                        data={hdProactiveVsReactive}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={4}
                        dataKey="value"
                        label={false}
                      >
                        {hdProactiveVsReactive.map((entry, index) => (
                          <Cell key={`call-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name) => [`${Number(val).toLocaleString()} Tickets`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend Below: Proactive 5,879 (59%), Reactive 4,041 (41%), Request 3 (0%) */}
                <div className="w-full flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-1 text-xs border-t border-slate-100">
                  {hdProactiveVsReactive.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
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

          {/* Chart 2: Reactive Ticket Inflow Trend */}
          <ErrorBoundary title="Reactive Inflow Error">
            <ChartCard
              title="📈 Reactive Ticket Inflow Trend (Monthly Inflow)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#0284C7]"
              data={hdMonthlyInflow}
              filename="Overview_Helpdesk_Inflow_Trend"
            >
              <div className="h-[240px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={hdMonthlyInflow}
                    margin={{ top: 25, right: 20, bottom: 20, left: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="shortMonth" tick={{ fontSize: 11, fill: '#0E7490', fontWeight: 700 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip formatter={(val) => [`${val.toLocaleString()} Tickets`, 'Reactive Inflow']} />
                    <Line
                      isAnimationActive={false}
                      type="monotone"
                      dataKey="count"
                      name="Reactive Inflow"
                      stroke="#0284C7"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#0284C7', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6 }}
                    >
                      <LabelList dataKey="count" position="top" fill="#0E7490" fontSize={11} fontWeight={800} dy={-8} />
                    </Line>
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

          {/* Chart 3: Share by Site and Floor (No Zero Buckets) */}
          <ErrorBoundary title="Site & Floor Error">
            <ChartCard
              title="🏢 Reactive Ticket Share by Site and Floor"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#0E7490]"
              data={hdSiteFloorShare}
              filename="Overview_Helpdesk_Share_by_Floor"
            >
              <div className="h-[240px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hdSiteFloorShare}
                    margin={{ top: 25, right: 25, bottom: 20, left: 15 }}
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
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

          {/* Chart 4: Channel Counts */}
          <ErrorBoundary title="Channel Counts Error">
            <ChartCard
              title="📱 Reactive Ticket Channel Counts (Request Via)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#0284C7]"
              data={hdChannelCounts}
              filename="Overview_Helpdesk_Channels"
            >
              <div className="h-[240px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hdChannelCounts}
                    margin={{ top: 25, right: 25, bottom: 20, left: 15 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="channel" tick={{ fontSize: 11, fill: '#0E7490', fontWeight: 600 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip formatter={(val) => [`${val.toLocaleString()} Tickets`, 'Volume']} />
                    <Bar isAnimationActive={false} dataKey="count" name="Tickets" fill="#0E7490" radius={[4, 4, 0, 0]} barSize={28}>
                      <LabelList dataKey="count" position="top" fill="#0E7490" fontSize={11} fontWeight={700} dy={-6} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

        </div>
      </section>

      {/* ======================================================================= */}
      {/* DIVIDER: "Scroll for Event Overview" Hint Button                        */}
      {/* ======================================================================= */}
      <div className="flex items-center justify-center my-2">
        <div className="w-full border-t border-slate-200 relative flex justify-center">
          <button
            onClick={scrollToEventSection}
            className="absolute -top-3.5 bg-white border border-slate-300 hover:border-orange-500 text-slate-600 hover:text-orange-600 px-4 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <span>↓ Scroll for Event Overview ↓</span>
          </button>
        </div>
      </div>

      {/* ======================================================================= */}
      {/* SECTION B (BOTTOM): "EVENT OVERVIEW" (Orange Theme #EA580C)             */}
      {/* ======================================================================= */}
      <section id="overview-event-section" className="bg-white border-2 border-[#EA580C]/30 rounded-2xl shadow-sm p-4 space-y-4 pt-6">
        
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gradient-to-r from-[#EA580C] to-[#16A34A] text-white p-3.5 rounded-xl shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg shrink-0">
              <CalendarDays className="w-5 h-5 text-orange-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black tracking-tight uppercase">EVENT OVERVIEW</h2>
                <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full">
                  Section B
                </span>
              </div>
              <p className="text-xs text-orange-100 font-medium">{reportingPeriodText}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab && onNavigateTab('events')}
              className="px-3.5 py-1.5 bg-white text-[#EA580C] hover:bg-orange-50 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <span>View Full Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Event KPIs (8 Cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
          {/* 1. Total Events */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('total_events', validEvents)}
            className="bg-slate-50 hover:bg-orange-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-[#EA580C] shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#EA580C]">TOTAL EVENTS</span>
            <span className="text-xl font-black text-[#EA580C] mt-1">{eventKpis.total.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Valid events</span>
          </div>

          {/* 2. Completed */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('completed_events')}
            className="bg-slate-50 hover:bg-emerald-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-[#16A34A] shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">COMPLETED</span>
            <span className="text-xl font-black text-[#16A34A] mt-1">{eventKpis.completed.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-700 font-semibold">Done / Auto</span>
          </div>

          {/* 3. Cancelled */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('cancelled_events')}
            className="bg-slate-50 hover:bg-red-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-red-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">CANCELLED</span>
            <span className="text-xl font-black text-red-600 mt-1">{eventKpis.cancelled.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">No-show / cancelled</span>
          </div>

          {/* 4. Pending (Upcoming) */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('upcoming_events')}
            className="bg-slate-50 hover:bg-blue-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-[#0284C7] shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#0284C7]">UPCOMING</span>
            <span className="text-xl font-black text-[#0284C7] mt-1">{eventKpis.upcoming.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Future dates</span>
          </div>

          {/* 5. Big Events */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('big_events')}
            className="bg-slate-50 hover:bg-purple-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-purple-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700">BIG (100+)</span>
            <span className="text-xl font-black text-purple-700 mt-1">{eventKpis.big.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Pax &gt;= 100</span>
          </div>

          {/* 6. Small Events */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('small_events')}
            className="bg-slate-50 hover:bg-teal-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-teal-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">SMALL (&lt;100)</span>
            <span className="text-xl font-black text-teal-700 mt-1">{eventKpis.small.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Pax &lt; 100</span>
          </div>

          {/* 7. Today's Events */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('today_events')}
            className="bg-slate-50 hover:bg-indigo-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-indigo-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700">TODAY'S</span>
            <span className="text-xl font-black text-indigo-700 mt-1">{eventKpis.todayCount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Event Date = Today</span>
          </div>

          {/* 8. Wrong Entries */}
          <div
            onClick={() => onKpiDoubleClick && onKpiDoubleClick('wrong_entries')}
            className="bg-slate-50 hover:bg-rose-50/50 rounded-xl p-3 border border-slate-200 border-l-4 border-l-rose-600 shadow-2xs hover:shadow transition-all cursor-pointer flex flex-col justify-between"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">WRONG ENTRIES</span>
            <span className="text-xl font-black text-rose-600 mt-1">{eventKpis.wrongCount.toLocaleString()}</span>
            <span className="text-[10px] text-slate-500 font-medium">Missing Loc/Title</span>
          </div>
        </div>

        {/* Event Charts (2x2 Grid) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          
          {/* Chart 1: Site-Wise Bifurcation (Donut DT-3 vs DT-4) */}
          <ErrorBoundary title="Site Bifurcation Error">
            <ChartCard
              title="🏢 Site-Wise Bifurcation (DT-3 vs DT-4)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#1F2937]"
              data={eventSiteBifurcation}
              filename="Overview_Event_Site_Bifurcation"
            >
              <div className="w-full h-full flex flex-col items-center justify-between pt-1">
                <div className="h-[175px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        isAnimationActive={false}
                        data={eventSiteBifurcation}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                        label={false}
                      >
                        {eventSiteBifurcation.map((entry, index) => (
                          <Cell key={`event-site-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(val, name, props) => [`${val.toLocaleString()} Events (${props.payload.percent})`, name]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend Below */}
                <div className="w-full flex flex-wrap items-center justify-center gap-x-5 gap-y-1 py-1 text-xs border-t border-slate-100">
                  {eventSiteBifurcation.map((d, i) => (
                    <div key={i} className="flex items-center gap-1.5">
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

          {/* Chart 2: Events by Floor (ZERO-ONLY BUCKETS HIDDEN) */}
          <ErrorBoundary title="Events by Floor Error">
            <ChartCard
              title="📶 Events by Floor (Ground to L6 Split)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#16A34A]"
              data={eventFloorData}
              filename="Overview_Event_by_Floor"
            >
              <div className="h-[240px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={eventFloorData}
                    margin={{ top: 20, right: 15, bottom: 20, left: 10 }}
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

          {/* Chart 3: Events by Category */}
          <ErrorBoundary title="Events by Category Error">
            <ChartCard
              title="🏷️ Events by Category"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#EA580C]"
              data={eventCategoryData}
              filename="Overview_Event_by_Category"
            >
              <div className="h-[240px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={eventCategoryData}
                    margin={{ top: 8, right: 35, bottom: 8, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" hide={true} />
                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: '#1F2937', fontWeight: 600 }} stroke="#CBD5E1" />
                    <Tooltip formatter={(val) => [`${val.toLocaleString()} Events`, 'Total']} />
                    <Bar isAnimationActive={false} dataKey="count" name="Events" fill="#EA580C" radius={[0, 4, 4, 0]} barSize={16}>
                      <LabelList dataKey="count" position="right" fill="#1F2937" fontSize={11} fontWeight="bold" dx={4} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

          {/* Chart 4: Monthly Trend (Line + Bar Combo) */}
          <ErrorBoundary title="Monthly Trend Combo Error">
            <ChartCard
              title="📈 Monthly Trend (Jan to Dec 2026 Combo)"
              reportingPeriod={reportingPeriodText}
              topBorderColor="border-t-[#16A34A]"
              data={eventMonthlyTrend}
              filename="Overview_Event_Monthly_Trend"
            >
              <div className="h-[240px] w-full cursor-pointer">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={eventMonthlyTrend}
                    margin={{ top: 20, right: 15, bottom: 20, left: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="shortMonth" tick={{ fontSize: 10, fill: '#1F2937', fontWeight: 600 }} stroke="#CBD5E1" />
                    <YAxis hide={true} />
                    <Tooltip formatter={(val, name) => [`${val.toLocaleString()} Events`, name]} />
                    <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4 }} />
                    <Bar isAnimationActive={false} dataKey="dt3" name="DT-3" stackId="monthSt" fill="#1F2937" barSize={22} />
                    <Bar isAnimationActive={false} dataKey="dt4" name="DT-4" stackId="monthSt" fill="#16A34A" barSize={22} />
                    <Line isAnimationActive={false} type="monotone" dataKey="total" name="Total Events" stroke="#EA580C" strokeWidth={2.5} dot={{ r: 3, fill: '#EA580C' }}>
                      <LabelList dataKey="total" position="top" fill="#1F2937" fontSize={10} fontWeight={700} dy={-6} formatter={(v) => (v > 0 ? v : '')} />
                    </Line>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </ChartCard>
          </ErrorBoundary>

        </div>
      </section>

    </div>
  )
}
