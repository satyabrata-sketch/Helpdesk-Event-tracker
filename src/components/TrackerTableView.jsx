// ==============================================================================
// AUTHENTIC EXCEL-STYLE TRACKER TABLE VIEW (100% English)
// Dedicated Tracker View for Tab 4 (Helpdesk) & Tab 5 (Event) + KPI Double-Click
// Features:
// 1. Pure Excel look (#F1F5F9 header, #E2E8F0 borders, frozen sticky header)
// 2. Default Sorting: Latest First (Descending) - Row 1 = 05-Nov-2026 (Helpdesk) / 31-Mar-2027 (Event)
// 3. Month Column: Position directly after Raised Date, formatted as MMM-YY (e.g. Nov-26)
//    Chronological sorting on Month column (not alphabetical)
// 4. Cascading Top Filters: Year -> Quarter -> Month + Site + Category + Status + Global Search
// 5. 50 Rows/Page Strict Pagination, Side Drawer Row Inspector, SheetJS Excel Export
// ==============================================================================
import React, { useState, useMemo } from 'react'
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileSpreadsheet,
  X,
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  Calendar
} from 'lucide-react'
import { exportToExcel, exportWrongEntriesToExcel } from '../lib/excelExport'
import {
  parseDate,
  formatDateDisplay,
  formatMonthYear,
  getYearStr,
  getCalendarQuarter,
  getQuarterOptions,
  getMonthsForYearAndQuarter,
  getAvailableYears,
  getAvailableEventYears,
  formatTime,
  parsePax,
  getScale,
  deriveBuilding,
  getRowDay,
  applyEventFilters,
  classifySiteEntry,
  getWrongReason,
  applyHelpdeskFilters,
  isHelpdeskWrongEntry,
  getHelpdeskWrongReason,
  formatReportTime,
  formatHelpdeskCategory,
  deriveEventCategory,
  getEventDerivedStatus,
  getSmartStatusString,
  getWrongBreakdown,
  getWrongEntryCategory,
  extractHelpdeskFloor,
  extractHelpdeskZone,
  extractTicketRaisedBy
} from '../lib/dateUtils'

export function TrackerTableView({
  title = 'Master Operations Sheet',
  subtitle = '',
  trackerType = 'helpdesk', // 'helpdesk' | 'event'
  rows = [],
  allRows = null, // Full master rows for dynamic filtering without record loss
  headers = [],
  activeSheet,
  sheetNames = [],
  onSheetChange,
  originalTrackerName = 'Tracker',
  highlightColumn = null,
  onBack = null, // If provided, shows "← Back to Overview" banner
  initialSortKey = null,
  initialSortDir = 'desc',
  activeFilters = null, // Full filter state passed from parent
  kpiFilteredCount = null, // Expected count from KPI card (e.g. 13)
  breadcrumb = '', // Precomputed breadcrumb string
  breadcrumbChips = [], // Filter chips for breadcrumb
  kpiId = null, // Specific KPI id (e.g. 'confirmed_events')
  onFilterChange = null, // Two-way sync filter callback
  onResetAllFilters = null // Two-way sync reset callback
}) {
  const defaultSortKey = initialSortKey || (trackerType === 'helpdesk' ? 'Date' : 'Event Date')
  const [sortConfig, setSortConfig] = useState({ key: defaultSortKey, direction: initialSortDir })
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 50 // Fixed 50 rows per page for speed and zero lag
  const [selectedRow, setSelectedRow] = useState(null)
  const [copiedKey, setCopiedKey] = useState(null)

  // Use full master rows if provided, otherwise fallback to rows
  const sourceRows = (allRows && allRows.length > 0) ? allRows : rows

  // URL search parameter helper for refresh resilience & deep linking
  const getSearchParam = (param) => {
    try {
      const sp = new URLSearchParams(window.location.search)
      return sp.get(param)
    } catch (_e) {
      return null
    }
  }

  const urlMonth = getSearchParam('month')
  const urlPax = getSearchParam('pax')
  const urlBuilding = getSearchParam('building') || getSearchParam('site')
  const urlStatus = getSearchParam('status')
  const urlYear = getSearchParam('year')
  const urlQuarter = getSearchParam('quarter')
  const urlKpi = getSearchParam('kpi')

  const effectiveKpi = kpiId || urlKpi

  // Initial values derived from parent activeFilters, kpiId, or directly from URL params
  const initialYear = activeFilters?.year !== undefined && activeFilters?.year !== '2025'
    ? activeFilters.year
    : (urlYear && urlYear !== '2025' ? urlYear : 'all')

  const initialQuarter = activeFilters?.quarter !== undefined && activeFilters?.quarter !== 'all'
    ? activeFilters.quarter
    : (urlQuarter && urlQuarter !== 'all' ? urlQuarter : 'all')

  const initialMonth = (Array.isArray(activeFilters?.selectedMonths) && activeFilters.selectedMonths[0])
    || (activeFilters?.month && activeFilters.month !== 'all' ? activeFilters.month : null)
    || (urlMonth && urlMonth !== 'all' ? urlMonth : 'all')

  const initialSite = (() => {
    const s = activeFilters?.site || activeFilters?.building || urlBuilding
    if (!s || s === 'all' || String(s).toLowerCase() === 'all' || String(s).toLowerCase() === 'all buildings') return 'all'
    if (String(s).includes('3')) return 'Downtown-3'
    if (String(s).includes('4')) return 'Downtown-4'
    return s
  })()

  const initialCategory = activeFilters?.eventType || activeFilters?.category || 'all'

  const initialPaxRange = useMemo(() => {
    const raw = String(activeFilters?.paxRange || activeFilters?.pax || urlPax || 'all').trim()
    if (raw.includes('100+')) return '100+'
    if (raw.includes('51-100')) return '51-100'
    if (raw.includes('21-50')) return '21-50'
    if (raw.includes('0-20')) return '0-20'
    return raw
  }, [activeFilters?.paxRange, activeFilters?.pax, urlPax])

  const initialStatus = useMemo(() => {
    if (effectiveKpi === 'confirmed_events') return 'Confirmed'
    if (effectiveKpi === 'pending_events') return 'Pending'
    if (effectiveKpi === 'cancelled_events') return 'Cancelled'
    if (effectiveKpi === 'upcoming_events') return 'Upcoming'
    if (activeFilters?.status && activeFilters.status !== 'all') return activeFilters.status
    if (urlStatus && urlStatus !== 'all') return urlStatus
    return 'all'
  }, [effectiveKpi, activeFilters?.status, urlStatus])

  // Top Table Filters (Cascading Year -> Quarter -> Month + Pax + Category + Status)
  const [searchTerm, setSearchTerm] = useState(activeFilters?.searchKeyword || '')
  const [filterYear, setFilterYear] = useState(initialYear)
  const [filterQuarter, setFilterQuarter] = useState(initialQuarter)
  const [filterMonth, setFilterMonth] = useState(initialMonth)
  const [filterSite, setFilterSite] = useState(initialSite)
  const [filterCategory, setFilterCategory] = useState(initialCategory)
  const [filterStatus, setFilterStatus] = useState(initialStatus)
  const [filterPaxRange, setFilterPaxRange] = useState(initialPaxRange)

  // Dynamic Available Years from source rows (Excludes 2025 for Event Tracker)
  const availableYears = useMemo(() => {
    if (trackerType === 'event') {
      return getAvailableEventYears(sourceRows)
    }
    return getAvailableYears(sourceRows)
  }, [sourceRows, trackerType])

  // Cascading Quarters & Months based on selected Year
  const quarterOptions = useMemo(() => {
    return getQuarterOptions(filterYear)
  }, [filterYear])

  const availableMonths = useMemo(() => {
    return getMonthsForYearAndQuarter(filterYear, filterQuarter)
  }, [filterYear, filterQuarter])

  // Keep internal filter state synced when activeFilters changes
  React.useEffect(() => {
    if (activeFilters) {
      if (activeFilters.year !== undefined && activeFilters.year !== '2025') setFilterYear(activeFilters.year)
      if (activeFilters.quarter !== undefined && activeFilters.quarter !== 'all') setFilterQuarter(activeFilters.quarter)
      const m = (Array.isArray(activeFilters.selectedMonths) && activeFilters.selectedMonths[0]) || (activeFilters.month && activeFilters.month !== 'all' ? activeFilters.month : null)
      if (m) setFilterMonth(m)
      const s = activeFilters.site || activeFilters.building
      if (s) {
        if (s === 'all' || s.toLowerCase() === 'all' || s.toLowerCase() === 'all buildings') setFilterSite('all')
        else if (s.includes('3')) setFilterSite('Downtown-3')
        else if (s.includes('4')) setFilterSite('Downtown-4')
        else setFilterSite(s)
      }
      const c = activeFilters.eventType || activeFilters.category
      if (c && c !== 'all') setFilterCategory(c)
      const p = String(activeFilters.paxRange || activeFilters.pax || '').trim()
      if (p && p !== 'all') {
        if (p.includes('100+')) setFilterPaxRange('100+')
        else if (p.includes('51-100')) setFilterPaxRange('51-100')
        else if (p.includes('21-50')) setFilterPaxRange('21-50')
        else if (p.includes('0-20')) setFilterPaxRange('0-20')
        else setFilterPaxRange(p)
      }
      if (activeFilters.searchKeyword !== undefined) setSearchTerm(activeFilters.searchKeyword || '')
    }
  }, [activeFilters])

  // Helper to push URL query changes cleanly in 2-way sync
  const updateUrlParam = (key, val) => {
    try {
      const url = new URL(window.location.href)
      if (val && val !== 'all') {
        url.searchParams.set(key, val)
      } else {
        url.searchParams.delete(key)
      }
      window.history.replaceState({}, '', url.toString())
    } catch (_e) {}
  }

  // Two-Way Sync Filter Handlers
  const handleYearChange = (newYear) => {
    setFilterYear(newYear)
    setFilterQuarter('all')
    setFilterMonth('all')
    updateUrlParam('year', newYear)
    updateUrlParam('quarter', 'all')
    updateUrlParam('month', 'all')
    if (onFilterChange) {
      onFilterChange('year', newYear)
      onFilterChange('quarter', 'all')
      onFilterChange('selectedMonths', [])
    }
  }

  const handleQuarterChange = (newQuarter) => {
    setFilterQuarter(newQuarter)
    setFilterMonth('all')
    updateUrlParam('quarter', newQuarter)
    updateUrlParam('month', 'all')
    if (onFilterChange) {
      onFilterChange('quarter', newQuarter)
      onFilterChange('selectedMonths', [])
    }
  }

  const handleMonthChange = (newMonth) => {
    setFilterMonth(newMonth)
    updateUrlParam('month', newMonth)
    if (onFilterChange) {
      onFilterChange('selectedMonths', newMonth === 'all' ? [] : [newMonth])
      onFilterChange('month', newMonth)
    }
  }

  const handleSiteChange = (newSite) => {
    setFilterSite(newSite)
    try {
      const url = new URL(window.location.href)
      url.searchParams.set('building', newSite !== 'all' ? newSite : 'All')
      window.history.replaceState({}, '', url.toString())
    } catch (_e) {}
    if (onFilterChange) {
      onFilterChange('site', newSite)
    }
  }

  const handleCategoryChange = (newCat) => {
    setFilterCategory(newCat)
    updateUrlParam('eventType', newCat)
    if (onFilterChange) {
      onFilterChange('eventType', newCat)
    }
  }

  const handleStatusChange = (newStatus) => {
    setFilterStatus(newStatus)
    updateUrlParam('status', newStatus)
    if (onFilterChange) {
      onFilterChange('status', newStatus)
    }
  }

  const handlePaxRangeChange = (newPax) => {
    setFilterPaxRange(newPax)
    updateUrlParam('pax', newPax)
    if (onFilterChange) {
      onFilterChange('paxRange', newPax)
    }
  }

  // Exact Folder Excel Columns
  // Month column is placed directly after Raised Date ('Date')
  const helpdeskExactHeaders = [
    'Sr no.', 'Site', 'Floor', 'Zone', 'Location', 'Date', 'Month', 'Report Time',
    'Request category', 'Ticket Raised By', 'Request Via', 'Discription', 'Action taken',
    'Date close', 'Resolved time', 'Status / WIP', 'Call type',
    'Remark', 'Defined TAT (Hrs)', 'Closure Time (Hrs)', 'Closure Duration', 'TAT Status'
  ]

  const eventExactHeaders = [
    'Event ID', 'Year', 'Month', 'Event Date', 'Day', 'Building', 'Floor',
    'Location', 'Event Title / Purpose', 'Category', 'Capacity / Pax', 'Event Scale',
    'Start Time', 'End Time', 'F&B Support', 'Logistic Support', 'Booked By',
    'Requester Email', 'Excel Status', 'Derived Status', 'Feedback Form', 'Booking Date',
    'Remarks', 'Booking Taken By'
  ]

  const activeHeaders = useMemo(() => {
    let list
    if (trackerType === 'helpdesk') {
      if (headers && headers.length > 0) {
        list = headers.filter(h => h !== 'Priority' && h !== 'Technician')
        list = list.map(h => (h === 'Vendor' || h === 'Request from' || h === 'Employee Name') ? 'Ticket Raised By' : h)
        list = [...new Set(list)]
        if (!list.includes('Floor')) {
          const zIdx = list.indexOf('Zone')
          if (zIdx !== -1) {
            list.splice(zIdx, 0, 'Floor')
          } else {
            list.splice(2, 0, 'Floor')
          }
        }
      } else {
        list = [...helpdeskExactHeaders]
      }
    } else {
      if (headers && headers.length > 0) {
        list = [...headers]
        const stIdx = list.indexOf('Calendar Booking Status')
        if (stIdx !== -1) {
          list.splice(stIdx, 1, 'Excel Status', 'Derived Status')
        } else if (!list.includes('Derived Status')) {
          list.push('Derived Status')
        }
      } else {
        list = [...eventExactHeaders]
      }
    }

    const dIdx = list.indexOf('Date')
    const mIdx = list.indexOf('Month')
    if (dIdx !== -1 && mIdx !== -1 && mIdx !== dIdx + 1) {
      list.splice(mIdx, 1)
      list.splice(dIdx + 1, 0, 'Month')
    }

    if (effectiveKpi === 'wrong_entries' || effectiveKpi === 'wrong_entries_helpdesk' || activeFilters?.floor === 'wrong') {
      if (!list.includes('Wrong Reason')) {
        const locIdx = list.indexOf('Location')
        if (locIdx !== -1) {
          list.splice(locIdx + 1, 0, 'Wrong Reason')
        } else {
          list.push('Wrong Reason')
        }
      }
    }
    return list
  }, [headers, trackerType, effectiveKpi, activeFilters?.floor])

  // Distinct options for top filters
  const filterOptions = useMemo(() => {
    const sites = new Set()
    const categories = new Set()
    const statuses = new Set()

    sourceRows.forEach((r) => {
      const s = r['Site'] || r['Building']
      if (s) sites.add(String(s).trim())

      const c = r['Request category'] || r['Category']
      if (c) categories.add(String(c).trim())

      const st = r['Status / WIP'] || r['Calendar Booking Status'] || r['Status']
      if (st) statuses.add(String(st).trim())
    })

    return {
      sites: Array.from(sites).filter(Boolean).sort(),
      categories: Array.from(categories).filter(Boolean).sort(),
      statuses: Array.from(statuses).filter(Boolean).sort()
    }
  }, [sourceRows])

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterYear, filterQuarter, filterMonth, filterSite, filterCategory, filterStatus, filterPaxRange])

  // Reset all top filters
  const handleResetFilters = () => {
    setSearchTerm('')
    setFilterYear('all')
    setFilterQuarter('all')
    setFilterMonth('all')
    setFilterSite('all')
    setFilterCategory('all')
    setFilterStatus('all')
    setFilterPaxRange('all')
    setSortConfig({ key: defaultSortKey, direction: initialSortDir })
    if (onResetAllFilters) {
      onResetAllFilters()
    }
  }

  const hasUserOverriddenFilters = Boolean(
    searchTerm.trim() ||
    filterYear !== initialYear ||
    filterQuarter !== initialQuarter ||
    filterMonth !== initialMonth ||
    filterSite !== initialSite ||
    filterCategory !== initialCategory ||
    filterStatus !== initialStatus ||
    filterPaxRange !== initialPaxRange
  )

  const hasActiveFilters = Boolean(
    searchTerm || filterYear !== 'all' || filterQuarter !== 'all' ||
    filterMonth !== 'all' || filterSite !== 'all' || filterCategory !== 'all' ||
    filterStatus !== 'all' || filterPaxRange !== 'all'
  )

  // Sort Handler
  const handleSort = (columnKey) => {
    setSortConfig((prev) => {
      if (prev.key === columnKey) {
        return { key: columnKey, direction: prev.direction === 'desc' ? 'asc' : 'desc' }
      }
      return { key: columnKey, direction: 'desc' }
    })
  }

  // Filter rows (Using unified applyEventFilters & applyHelpdeskFilters)
  const filteredRows = useMemo(() => {
    // Exact KPI drill-down preservation: Detail Count MUST == KPI Count, SAME filtered array (Part 3)
    if (kpiFilteredCount !== null && !hasUserOverriddenFilters) {
      return rows || []
    }

    if (trackerType === 'event') {
      const activeFilterObj = {
        year: filterYear,
        quarter: filterQuarter,
        month: filterMonth,
        site: filterSite,
        category: filterCategory,
        status: filterStatus,
        paxRange: filterPaxRange,
        searchKeyword: searchTerm
      }
      return applyEventFilters(sourceRows, activeFilterObj, effectiveKpi)
    }

    if (trackerType === 'helpdesk') {
      const activeFilterObj = {
        year: filterYear,
        quarter: filterQuarter,
        selectedMonths: filterMonth && filterMonth !== 'all' ? [filterMonth] : [],
        site: filterSite,
        category: filterCategory,
        status: filterStatus,
        searchKeyword: searchTerm
      }
      return applyHelpdeskFilters(sourceRows, activeFilterObj, effectiveKpi)
    }

    return sourceRows.filter((r) => {
      const dateVal = r['Date'] || r['Event Date'] || r['Month']

      // 1. Year Filter
      if (filterYear !== 'all') {
        const yStr = getYearStr(dateVal) || String(r['Year'] || '')
        if (!yStr.includes(filterYear)) return false
      }

      // 2. Quarter Filter (Calendar Quarter)
      if (filterQuarter !== 'all') {
        const qStr = getCalendarQuarter(dateVal)
        if (qStr !== filterQuarter) return false
      }

      // 3. Month Filter (Matched against MMM-YY)
      if (filterMonth !== 'all') {
        const mStr = formatMonthYear(dateVal)
        if (mStr !== filterMonth) return false
      }

      // 4. Site Filter
      if (filterSite !== 'all') {
        const s = String(r['Site'] || r['Building'] || '').trim().toLowerCase()
        if (!s.includes(filterSite.toLowerCase())) return false
      }

      // 5. Category Filter
      if (filterCategory !== 'all') {
        const c = String(r['Request category'] || r['Category'] || '').trim()
        if (c !== filterCategory) return false
      }

      // 6. Status Filter
      if (filterStatus !== 'all') {
        const st = String(r['Status / WIP'] || r['Calendar Booking Status'] || r['Status'] || '').trim().toLowerCase()
        if (!st.includes(filterStatus.toLowerCase())) return false
      }

      // 7. Global Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim()
        const match = Object.values(r).some((v) => {
          if (v === null || v === undefined) return false
          return String(v).toLowerCase().includes(q)
        })
        if (!match) return false
      }

      return true
    })
  }, [sourceRows, trackerType, filterYear, filterQuarter, filterMonth, filterSite, filterCategory, filterStatus, filterPaxRange, searchTerm, effectiveKpi])

  // Diagnostic Console Log for Filter Verification
  React.useEffect(() => {
    if (trackerType === 'event') {
      const expectedCount = kpiFilteredCount !== null && kpiFilteredCount !== undefined ? kpiFilteredCount : filteredRows.length
      const isMatch = filteredRows.length === expectedCount ? 'Yes' : 'No'
      console.log(`Detail: URL Params = ${JSON.stringify({ month: filterMonth, pax: filterPaxRange, building: filterSite, status: filterStatus })}, Filtered Count = ${filteredRows.length}, KPI Count = ${expectedCount}, Match = ${isMatch}`)
    }
  }, [filterMonth, filterPaxRange, filterSite, filterStatus, filteredRows.length, kpiFilteredCount, trackerType])

  // Filter Summary Chips for Dynamic Breadcrumb
  const filterSummaryChips = useMemo(() => {
    const chips = []
    if (filterYear !== 'all') chips.push(filterYear)
    else chips.push('All Years')
    if (filterQuarter !== 'all') chips.push(filterQuarter)
    if (filterMonth !== 'all') chips.push(filterMonth)
    if (filterSite !== 'all' && filterSite !== 'All') chips.push(filterSite)
    if (trackerType === 'event' && filterPaxRange !== 'all') {
      chips.push(filterPaxRange.includes('100+') ? '100+' : filterPaxRange)
    }
    if (filterCategory !== 'all') chips.push(filterCategory)
    if (filterStatus !== 'all' && !['confirmed_events', 'pending_events', 'cancelled_events', 'upcoming_events'].includes(effectiveKpi)) {
      chips.push(filterStatus)
    }
    if (searchTerm.trim()) chips.push(`"${searchTerm.trim()}"`)
    return chips
  }, [filterYear, filterQuarter, filterMonth, filterSite, filterPaxRange, filterCategory, filterStatus, searchTerm, trackerType, effectiveKpi])

  // Sort rows (Chronological for Month & Date, Default Latest First)
  const sortedRows = useMemo(() => {
    const list = [...filteredRows]
    const key = sortConfig.key || defaultSortKey
    const dir = sortConfig.direction || 'desc'

    return list.sort((a, b) => {
      const valA = a[key]
      const valB = b[key]

      if (valA === valB) return 0
      if (valA === null || valA === undefined || valA === '') return 1
      if (valB === null || valB === undefined || valB === '') return -1

      // Chronological Month comparison (Nov-26 top in desc, Apr-25 bottom)
      if (key === 'Month') {
        const dtA = a['Date'] || a['Event Date'] || a['Month']
        const dtB = b['Date'] || b['Event Date'] || b['Month']
        const dA = parseDate(dtA)?.getTime() || 0
        const dB = parseDate(dtB)?.getTime() || 0
        return dir === 'desc' ? dB - dA : dA - dB
      }

      // Date comparison (Latest First + tie-breaker on Sr no. DESC)
      if (key.includes('Date')) {
        const dA = parseDate(valA)?.getTime() || 0
        const dB = parseDate(valB)?.getTime() || 0
        if (dA !== dB) {
          return dir === 'desc' ? dB - dA : dA - dB
        }
        const srA = Number(a['Sr no.']) || 0
        const srB = Number(b['Sr no.']) || 0
        return dir === 'desc' ? srB - srA : srA - srB
      }

      // Number comparison
      const numA = Number(valA)
      const numB = Number(valB)
      if (!isNaN(numA) && !isNaN(numB)) {
        return dir === 'desc' ? numB - numA : numA - numB
      }

      // String comparison
      const strA = String(valA).toLowerCase()
      const strB = String(valB).toLowerCase()
      return dir === 'desc' ? strB.localeCompare(strA) : strA.localeCompare(strB)
    })
  }, [filteredRows, sortConfig, defaultSortKey])

  // Pagination (Strict 50 rows per page)
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return sortedRows.slice(start, start + pageSize)
  }, [sortedRows, currentPage])

  // Copy helper
  const handleCopy = (text, key) => {
    if (!text) return
    navigator.clipboard?.writeText(String(text))
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Handle Export with Month in MMM-YY format, formatted Times and Scale
  const handleExport = () => {
    if (effectiveKpi === 'wrong_entries' || activeFilters?.floor === 'wrong') {
      exportWrongEntriesToExcel(sortedRows)
      return
    }
    const formattedData = sortedRows.map((r) => {
      const copy = { ...r }
      const dt = r['Date'] || r['Event Date'] || r['Month']
      copy['Month'] = formatMonthYear(dt)
      if (copy['Start Time'] !== undefined) copy['Start Time'] = formatTime(copy['Start Time'])
      if (copy['End Time'] !== undefined) copy['End Time'] = formatTime(copy['End Time'])
      const cap = copy['Capacity / Pax'] !== undefined ? copy['Capacity / Pax'] : copy['Capacity']
      if (cap !== undefined) {
        copy['Event Scale'] = getScale(cap)
        copy['Capacity / Pax'] = parsePax(cap)
      }
      return copy
    })
    exportToExcel(formattedData, activeHeaders, `${title.replace(/\s+/g, '_')}_Filtered`)
  }

  // Wrong entries breakdown banner calculation (V15)
  const wrongBreakdown = useMemo(() => {
    if (effectiveKpi !== 'wrong_entries') return null
    return getWrongBreakdown(sortedRows)
  }, [effectiveKpi, sortedRows])

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden mb-8">
      
      {/* Top Banner & Control Bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50/80">
        
        {/* KPI Drilldown Return Banner & Breadcrumb */}
        {onBack && (
          <div className="flex flex-col md:flex-row md:items-center justify-between bg-slate-900 text-white rounded-lg p-3 mb-3 gap-3 shadow-md border border-slate-800">
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#00A651] hover:bg-[#008f45] text-white text-xs font-bold rounded shadow-xs transition-colors shrink-0 cursor-pointer"
                title="Return to Overview Dashboard"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>← Back to Overview</span>
              </button>
              <div className="text-xs text-slate-200 flex items-center gap-1.5 flex-wrap">
                <span className="text-slate-400 font-medium">Showing details for:</span>
                <strong className="font-extrabold text-white text-sm">
                  {title.replace('— Full Details from Tracker', '').trim()}
                </strong>
                {filterSummaryChips.length > 0 && (
                  <span className="text-slate-500">•</span>
                )}
                {filterSummaryChips.map((chip, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-emerald-400 border border-slate-700"
                  >
                    {chip}
                  </span>
                ))}
                <span className="text-slate-300 font-bold ml-1">
                  ({sortedRows.length.toLocaleString()} rows found)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-amber-300 hover:text-amber-200 font-bold px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 rounded transition-colors cursor-pointer"
                title="Clear all filters to view full dataset"
              >
                [Clear Filter]
              </button>
            </div>
          </div>
        )}

        {/* Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#003231]/10 rounded text-[#003231]">
              <FileSpreadsheet className="w-5 h-5 text-[#003231]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-extrabold text-slate-900">{title}</h2>
                <span className="bg-[#003231] text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                  {sortedRows.length.toLocaleString()} Records
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing: {title.replace('— Full Details from Tracker', '').trim()}{filterSummaryChips.length > 0 ? ` • ${filterSummaryChips.join(' • ')}` : ''} ({sortedRows.length.toLocaleString()} Records)
              </p>
            </div>
          </div>

          {/* Export Button & Sheet Switcher */}
          <div className="flex items-center gap-2">
            {sheetNames.length > 1 && (
              <div className="flex items-center gap-1.5 text-xs bg-white border border-slate-300 rounded px-2.5 py-1.5">
                <span className="text-slate-500 font-semibold">Sheet:</span>
                <select
                  value={activeSheet}
                  onChange={(e) => onSheetChange && onSheetChange(e.target.value)}
                  className="bg-transparent font-bold text-[#0B3D91] focus:outline-none cursor-pointer"
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0B3D91] hover:bg-blue-900 text-white text-xs font-bold rounded shadow-xs transition-colors"
              title="Download currently filtered Excel sheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{effectiveKpi === 'wrong_entries' ? 'Download Wrong Entries Excel' : 'Download Excel'}</span>
            </button>
          </div>
        </div>

        {/* Wrong Entries Breakdown Banner (V15) */}
        {effectiveKpi === 'wrong_entries' && wrongBreakdown && (
          <div className="mb-3 px-3.5 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-900 flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-rose-700 font-extrabold text-sm">⚠️ Wrong Entries Breakdown:</span>
              <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-rose-300 text-rose-800">
                {wrongBreakdown.text}
              </span>
            </div>
            <span className="text-rose-700 text-[11px] font-medium">
              Rows missing mandatory Location or Event Title are excluded from event operations & KPI totals.
            </span>
          </div>
        )}

        {/* Cascading Filter Bar: Search, Year, Quarter, Month, Site, Pax (Event), Category, Status, Reset */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 ${trackerType === 'event' ? 'lg:grid-cols-9' : 'lg:grid-cols-8'} gap-2 text-xs pt-2 border-t border-slate-200`}>
          
          {/* 1. Global Search (col-span-2 on mobile) */}
          <div className="relative col-span-2 sm:col-span-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search all columns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded pl-8 pr-6 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* 2. Dynamic Cascading Year Filter */}
          <div>
            <select
              value={filterYear}
              onChange={(e) => handleYearChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
            >
              <option value="all">All Years</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>{yr}</option>
              ))}
            </select>
          </div>

          {/* 3. Cascading Quarter Filter */}
          <div>
            <select
              value={filterQuarter}
              onChange={(e) => handleQuarterChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              {quarterOptions.map((q) => (
                <option key={q.value} value={q.value}>{q.label}</option>
              ))}
            </select>
          </div>

          {/* 4. Cascading Month Filter (MMM-YY Format) */}
          <div>
            <select
              value={filterMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">All Months</option>
              {filterMonth !== 'all' && !availableMonths.includes(filterMonth) && (
                <option value={filterMonth}>{filterMonth}</option>
              )}
              {availableMonths.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* 5. Site / Building Filter */}
          <div>
            <select
              value={filterSite}
              onChange={(e) => handleSiteChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">{trackerType === 'event' ? 'All Buildings' : 'All Sites'}</option>
              {trackerType === 'event' ? (
                <>
                  <option value="Downtown-3">Downtown-3</option>
                  <option value="Downtown-4">Downtown-4</option>
                </>
              ) : (
                filterOptions.sites.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))
              )}
            </select>
          </div>

          {/* 6. Pax Range Filter (for Event Tracker) */}
          {trackerType === 'event' && (
            <div>
              <select
                value={filterPaxRange}
                onChange={(e) => handlePaxRangeChange(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none"
              >
                <option value="all">All Sizes</option>
                <option value="0-20">0 - 20 Pax (Small)</option>
                <option value="21-50">21 - 50 Pax (Medium)</option>
                <option value="51-100">51 - 100 Pax (Large)</option>
                <option value="100+">100+ Pax (Townhall)</option>
              </select>
            </div>
          )}

          {/* 7. Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">All Categories</option>
              {filterOptions.categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* 8. Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {trackerType === 'event' ? (
                <>
                  <option value="Confirmed">Confirmed / Done</option>
                  <option value="Pending">Pending Booking</option>
                  <option value="Cancelled">Cancelled</option>
                </>
              ) : (
                filterOptions.statuses.map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))
              )}
            </select>
          </div>

          {/* 9. Reset Filters */}
          <div className="flex items-center">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-bold px-2 py-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

        </div>

      </div>

      {/* Main Excel-Style Table Grid (Frozen Sticky Header, Alternating Rows) */}
      <div className="relative overflow-x-auto max-h-[640px] border-b border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          {/* Frozen / Sticky Header Row (CBRE Primary Dark Green #003231) */}
          <thead className="bg-[#003231] text-white font-bold sticky top-0 z-20 shadow-xs border-b border-[#002524]">
            <tr>
              <th className="py-2.5 px-3 border-r border-[#004d4b] text-center w-12 text-[10px] text-white/80 bg-[#003231]">
                #
              </th>
              {activeHeaders.map((header) => {
                const isSorted = sortConfig.key === header
                const isHighlighted = highlightColumn === header
                return (
                  <th
                    key={header}
                    onClick={() => handleSort(header)}
                    className={`py-2.5 px-3 border-r border-[#004d4b] select-none cursor-pointer whitespace-nowrap hover:bg-[#004d4b] transition-colors ${
                      isHighlighted ? 'bg-[#004d4b] text-white font-bold' : 'bg-[#003231] text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="text-white font-bold">{header}</span>
                      <span className="text-white/70">
                        {isSorted ? (
                          sortConfig.direction === 'desc' ? (
                            <ArrowDown className="w-3 h-3 text-white" />
                          ) : (
                            <ArrowUp className="w-3 h-3 text-white" />
                          )
                        ) : (
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                        )}
                      </span>
                    </div>
                  </th>
                )
              })}
            </tr>
          </thead>

          {/* Table Body (50 rows per page, null-safe, CBRE Alternate Rows #F2F7F2) */}
          <tbody className="divide-y divide-slate-200 bg-white">
            {sourceRows.length === 0 ? (
              <tr>
                <td
                  colSpan={activeHeaders.length + 1}
                  className="py-12 text-center text-slate-500 text-xs font-medium"
                >
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet className="w-8 h-8 text-slate-300" />
                    <span className="font-bold text-slate-700 text-sm">No data - Connect OneDrive</span>
                    <span className="text-slate-400 text-xs">Please connect OneDrive to populate live event records.</span>
                  </div>
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={activeHeaders.length + 1}
                  className="py-12 text-center text-slate-400 text-xs font-medium"
                >
                  No matching records found. Please adjust your filters or search keywords.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, idx) => {
                const rowIndex = (currentPage - 1) * pageSize + idx + 1
                const isEven = idx % 2 === 1
                return (
                  <tr
                    key={idx}
                    onClick={() => setSelectedRow(row)}
                    onDoubleClick={() => setSelectedRow(row)}
                    className={`cursor-pointer transition-colors ${
                      isEven ? 'bg-[#F2F7F2]' : 'bg-white'
                    } hover:bg-[#F1F8E9]`}
                    title="Click or double-click to view complete row detail in Side Drawer"
                  >
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-[10px] text-slate-400 font-mono">
                      {rowIndex}
                    </td>

                    {activeHeaders.map((header) => {
                      const val = row[header]
                      let displayVal = '—'
                      const isHighlighted = highlightColumn === header

                      // Wrong Reason column
                      if (header === 'Wrong Reason') {
                        const reason = row['Wrong Reason'] || (trackerType === 'helpdesk' ? getHelpdeskWrongReason(row) : getWrongReason(row))
                        return (
                          <td key={header} className="py-2 px-3 border-r border-slate-200 text-xs font-bold text-rose-700 bg-rose-50/70">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10.5px] font-extrabold bg-rose-100 text-rose-800 border border-rose-300">
                              {reason}
                            </span>
                          </td>
                        )
                      }

                      // Derived Status column (V15 Date-Aware Smart Status)
                      if (header === 'Derived Status') {
                        const smartStatus = getSmartStatusString(row)
                        let badgeCls = 'bg-slate-100 text-slate-700'
                        const statusStr = String(smartStatus || '')
                        const statusLower = statusStr.toLowerCase()
                        if (statusLower.includes('completed')) {
                          badgeCls = 'bg-emerald-100 text-emerald-800'
                        } else if (statusLower.includes('upcoming')) {
                          badgeCls = 'bg-blue-100 text-blue-800'
                        } else if (statusLower.includes('cancel')) {
                          badgeCls = 'bg-rose-100 text-rose-800'
                        } else if (statusLower.includes('ongoing') || statusLower.includes('today')) {
                          badgeCls = 'bg-amber-100 text-amber-800'
                        }
                        return (
                          <td
                            key={header}
                            className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap ${
                              isHighlighted ? 'bg-blue-50 font-bold' : ''
                            }`}
                          >
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${badgeCls}`}>
                              {statusStr}
                            </span>
                          </td>
                        )
                      }

                      // 1. Month column derived in MMM-YY format
                      if (header === 'Month') {
                        const dateVal = row['Date'] || row['Event Date'] || row['Month']
                        displayVal = formatMonthYear(dateVal)
                      } else if (header === 'Building' && trackerType === 'event') {
                        displayVal = deriveBuilding(row)
                      } else if (header === 'Day' && trackerType === 'event') {
                        displayVal = getRowDay(row)
                      } else if (header === 'Floor' && trackerType === 'event') {
                        const siteCls = classifySiteEntry(row)
                        displayVal = val ? String(val) : 'Blank'
                        if (!siteCls.isCorrect) {
                          return (
                            <td key={header} className="py-2 px-3 border-r border-slate-200 text-xs font-bold text-rose-600 bg-rose-50/70">
                              <span className="inline-flex items-center gap-1.5 flex-wrap">
                                <span className="underline decoration-rose-400 font-extrabold">{displayVal}</span>
                                <span className="text-[9px] bg-rose-200 text-rose-800 px-1 py-0.2 rounded font-bold">
                                  {siteCls.reason || 'Wrong'}
                                </span>
                              </span>
                            </td>
                          )
                        }
                      } else if (header === 'Floor' && trackerType === 'helpdesk') {
                        displayVal = extractHelpdeskFloor(row)
                      } else if (header === 'Zone' && trackerType === 'helpdesk') {
                        displayVal = extractHelpdeskZone(row) || row['Zone'] || '—'
                      } else if (header === 'Ticket Raised By') {
                        displayVal = extractTicketRaisedBy(row)
                      } else if (header === 'Category' && trackerType === 'event') {
                        displayVal = deriveEventCategory(row)
                      } else if (header === 'Excel Status') {
                        displayVal = row['Calendar Booking Status'] || row['Status'] || '—'
                      } else if (header === 'Start Time' || header === 'End Time') {
                        displayVal = formatTime(val)
                      } else if (header === 'Report Time' || header === 'Resolved time') {
                        displayVal = formatReportTime(val)
                      } else if (header === 'Request category' || (header === 'Category' && trackerType === 'helpdesk')) {
                        displayVal = formatHelpdeskCategory(val)
                      } else if (header === 'Event Scale' || header === 'Scale') {
                        const cap = row['Capacity / Pax'] !== undefined ? row['Capacity / Pax'] : row['Capacity']
                        displayVal = getScale(cap)
                      } else if (header === 'Capacity / Pax' || header === 'Capacity' || header === 'Pax') {
                        const p = parsePax(val)
                        displayVal = p > 0 ? p.toLocaleString() : (val ? String(val) : '—')
                      } else if (val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim() !== 'null') {
                        if (header.includes('Date')) {
                          displayVal = formatDateDisplay(val)
                        } else if (header.includes('Closure Time') && !isNaN(Number(val))) {
                          displayVal = `${Number(val)} Hrs`
                        } else {
                          displayVal = String(val)
                        }
                      }

                      // Status Badge Formatting
                      if (header.includes('Status') && displayVal !== '—') {
                        const low = displayVal.toLowerCase()
                        let badgeCls = 'bg-slate-100 text-slate-700'
                        const isNotRes = low.includes('not resolve') || low.includes('unresolve')
                        if (!isNotRes && (low.includes('resolved') || low.includes('closed') || low.includes('done') || low.includes('confirmed') || low.includes('in tat'))) {
                          badgeCls = 'bg-emerald-100 text-emerald-800'
                        } else if (isNotRes || low.includes('wip') || low.includes('progress') || low.includes('pending') || low.includes('open')) {
                          badgeCls = 'bg-amber-100 text-amber-800 font-bold'
                        } else if (low.includes('beyond') || low.includes('out of tat') || low.includes('cancel') || low.includes('overdue')) {
                          badgeCls = 'bg-rose-100 text-rose-800 font-bold'
                        }

                        return (
                          <td
                            key={header}
                            className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap ${
                              isHighlighted ? 'bg-blue-50 font-bold' : ''
                            }`}
                          >
                            <span className={`px-2 py-0.5 rounded text-[10px] font-medium inline-block ${badgeCls}`}>
                              {displayVal}
                            </span>
                          </td>
                        )
                      }

                      // Event Scale Badge Formatting
                      if ((header === 'Event Scale' || header === 'Scale') && displayVal !== '—') {
                        const isBig = displayVal.includes('Big')
                        return (
                          <td
                            key={header}
                            className={`py-2 px-3 border-r border-slate-200 whitespace-nowrap ${
                              isHighlighted ? 'bg-blue-50 font-bold' : ''
                            }`}
                          >
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block ${
                              isBig ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {displayVal}
                            </span>
                          </td>
                        )
                      }

                      return (
                        <td
                          key={header}
                          className={`py-2 px-3 border-r border-slate-200 text-slate-700 max-w-[280px] truncate ${
                            isHighlighted ? 'bg-blue-50/80 font-bold text-[#0B3D91]' : ''
                          }`}
                          title={displayVal}
                        >
                          {displayVal}
                        </td>
                      )
                    })}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer (50 rows per page) */}
      <div className="p-3 bg-[#F1F5F9] border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
        <div className="font-semibold text-slate-700">
          Showing <span className="text-[#0B3D91] font-bold">{(currentPage - 1) * pageSize + 1}</span>-
          <span className="text-[#0B3D91] font-bold">{Math.min(currentPage * pageSize, sortedRows.length)}</span> of{' '}
          <span className="text-slate-900 font-extrabold">{sortedRows.length.toLocaleString()}</span> records
          <span className="text-slate-400 font-normal ml-2">
            • Sorted {sortConfig.key} {sortConfig.direction === 'desc' ? 'Latest First' : 'Oldest First'}
          </span>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="First Page"
            >
              <ChevronsLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Previous 50 Rows"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>

            <span className="px-2 font-medium">
              Page <strong className="text-slate-900">{currentPage}</strong> of{' '}
              <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Next 50 Rows"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Last Page"
            >
              <ChevronsRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* SIDE DRAWER: FULL ROW INSPECTION ON CLICK / DOUBLE CLICK */}
      {selectedRow && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 transition-opacity"
            onClick={() => setSelectedRow(null)}
          />
          <div className="fixed top-0 right-0 h-full w-full max-w-xl bg-white shadow-2xl z-50 overflow-y-auto flex flex-col border-l border-slate-200">
            
            {/* Drawer Header */}
            <div className="p-4 bg-[#0B3D91] text-white flex items-center justify-between sticky top-0 z-10 shadow-sm">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-blue-200" />
                <div>
                  <h4 className="text-sm font-bold">
                    {trackerType === 'helpdesk'
                      ? `Ticket #${selectedRow['Sr no.'] || 'Details'}`
                      : `Event ${selectedRow['Event ID'] || 'Details'}`}
                  </h4>
                  <p className="text-[11px] text-blue-200">
                    Full Excel Row Attributes & Operations Detail
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-4 flex-1">
              
              {/* Highlight Card */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Primary Issue / Purpose
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedRow['Discription'] || selectedRow['Event Title / Purpose'] || '—'}
                </p>
                {selectedRow['Action taken'] && (
                  <div className="mt-2.5 pt-2.5 border-t border-slate-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Action Taken / Resolution
                    </span>
                    <p className="text-xs text-slate-700">
                      {selectedRow['Action taken']}
                    </p>
                  </div>
                )}
              </div>

              {/* Grid of Key Attributes */}
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
                {activeHeaders.map((key) => {
                  const val = selectedRow[key]
                  let strVal = val !== null && val !== undefined && String(val).trim() !== '' ? String(val) : '—'
                  
                  if (key === 'Wrong Reason') {
                    strVal = selectedRow['Wrong Reason'] || getWrongReason(selectedRow)
                  } else if (key === 'Month') {
                    const dt = selectedRow['Date'] || selectedRow['Event Date'] || selectedRow['Month']
                    strVal = formatMonthYear(dt)
                  } else if (key === 'Start Time' || key === 'End Time') {
                    strVal = formatTime(val)
                  } else if (key === 'Report Time' || key === 'Resolved time') {
                    strVal = formatReportTime(val)
                  } else if (key === 'Request category' || key === 'Category') {
                    strVal = formatHelpdeskCategory(val)
                  } else if (key === 'Event Scale' || key === 'Scale') {
                    const cap = selectedRow['Capacity / Pax'] !== undefined ? selectedRow['Capacity / Pax'] : selectedRow['Capacity']
                    strVal = getScale(cap)
                  } else if (key === 'Capacity / Pax' || key === 'Capacity' || key === 'Pax') {
                    const p = parsePax(val)
                    strVal = p > 0 ? p.toLocaleString() : (val ? String(val) : '—')
                  } else if (key.includes('Date') && strVal !== '—') {
                    strVal = formatDateDisplay(val)
                  } else if (key.includes('Closure Time') && !isNaN(Number(val)) && strVal !== '—') {
                    strVal = `${Number(val)} Hrs`
                  }

                  return (
                    <div key={key} className="p-2.5 flex items-start justify-between gap-3 hover:bg-slate-50">
                      <span className="font-semibold text-slate-600 text-[11px] min-w-[140px]">
                        {key}
                      </span>
                      <div className="flex items-center gap-1.5 text-right flex-1 justify-end">
                        <span className="text-slate-900 font-medium break-all">
                          {strVal}
                        </span>
                        {strVal !== '—' && (
                          <button
                            type="button"
                            onClick={() => handleCopy(strVal, key)}
                            className="text-slate-400 hover:text-slate-700 p-0.5 rounded transition-colors"
                            title="Copy value"
                          >
                            {copiedKey === key ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 text-right">
              <button
                onClick={() => setSelectedRow(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded transition-colors"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  )
}
