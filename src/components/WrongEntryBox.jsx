// ==============================================================================
// WRONG ENTRY BOX - TEAM FIX BOX (Part 2)
// Red / Orange alert box at top of Event Tab, above KPIs.
// Highlights 480 incorrect site entries (out of 2,093, 22.9%)
// Contains:
// 1. Big 480 counter + percentage + 3 clickable mini-counts (Floor Blank, Location as Floor, Spelling)
// 2. Action buttons: "Download Wrong Entries Excel" & "Copy Event IDs"
// 3. Table: "Wrong Entries by Month" (sorted DESC, clickable months)
// 4. Table: "Wrong Entries - Full List" (Paginated 50/page, search by Event ID / Floor, Correct Floor Suggestions)
// ==============================================================================
import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Download,
  Copy,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  RotateCcw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  HelpCircle
} from 'lucide-react'
import { classifySiteEntry, cleanSite } from '../lib/dateUtils'
import { exportWrongEntriesToExcel } from '../lib/excelExport'

export function WrongEntryBox({
  allRows = [],
  onOpenDetail,
  showToast
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all') // 'all' | 'blank' | 'location' | 'spelling'
  const [selectedMonth, setSelectedMonth] = useState(null) // e.g. 'Aug'
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 50

  // 1. Classify all rows into correct (1613) and wrong (480)
  const { wrongList, correctCount, subCounts } = useMemo(() => {
    const wrong = []
    let correct = 0
    let blankCount = 0
    let locCount = 0
    let spellCount = 0

    allRows.forEach((r) => {
      const cls = classifySiteEntry(r)
      if (cls.isCorrect) {
        correct++
      } else {
        const enriched = {
          ...r,
          category: cls.category,
          suggestion: cls.suggestion,
          wrongFloor: cls.wrongFloor || 'Not Mentioned',
          cleanedFloor: cleanSite(r).floor,
          cleanedLocation: cleanSite(r).location
        }
        wrong.push(enriched)
        if (cls.category === 'blank') blankCount++
        else if (cls.category === 'spelling') spellCount++
        else locCount++
      }
    })

    return {
      wrongList: wrong,
      correctCount: correct,
      subCounts: {
        blank: blankCount,
        location: locCount,
        spelling: spellCount
      }
    }
  }, [allRows])

  const totalWrong = wrongList.length
  const totalAll = allRows.length || 2093
  const wrongPercentage = totalAll > 0 ? ((totalWrong / totalAll) * 100).toFixed(1) : '22.9'

  // 2. Monthly Aggregations for "Wrong Entries by Month" Table
  const monthlyStats = useMemo(() => {
    const monthMap = {}
    wrongList.forEach((r) => {
      const m = String(r['Month'] || '').slice(0, 3) || 'Unknown'
      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          total: 0,
          blank: 0,
          location: 0,
          spelling: 0,
          exampleIds: []
        }
      }
      monthMap[m].total++
      if (r.category === 'blank') monthMap[m].blank++
      else if (r.category === 'spelling') monthMap[m].spelling++
      else monthMap[m].location++

      if (monthMap[m].exampleIds.length < 3 && r['Event ID']) {
        monthMap[m].exampleIds.push(r['Event ID'])
      }
    })

    // Sort DESC by total wrong count
    return Object.values(monthMap).sort((a, b) => b.total - a.total)
  }, [wrongList])

  // 3. Filtered Full List
  const filteredList = useMemo(() => {
    let list = wrongList

    if (activeCategory !== 'all') {
      list = list.filter((r) => r.category === activeCategory)
    }

    if (selectedMonth) {
      list = list.filter((r) => String(r['Month'] || '').slice(0, 3).toLowerCase() === selectedMonth.toLowerCase())
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((r) => {
        const id = String(r['Event ID'] || '').toLowerCase()
        const fl = String(r['Floor'] || '').toLowerCase()
        const loc = String(r['Location'] || '').toLowerCase()
        const title = String(r['Event Title / Purpose'] || '').toLowerCase()
        return id.includes(q) || fl.includes(q) || loc.includes(q) || title.includes(q)
      })
    }

    return list
  }, [wrongList, activeCategory, selectedMonth, searchQuery])

  // 4. Pagination
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1
  const paginatedList = useMemo(() => {
    const start = (page - 1) * pageSize
    return filteredList.slice(start, start + pageSize)
  }, [filteredList, page, pageSize])

  // Copy Event IDs to Clipboard
  const handleCopyEventIds = () => {
    const ids = wrongList.map((r) => r['Event ID']).filter(Boolean).join(', ')
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(ids)
      if (showToast) {
        showToast({
          type: 'success',
          title: 'Event IDs Copied',
          message: `${totalWrong} Wrong Entry Event IDs copied to clipboard.`
        })
      }
    }
  }

  // Download Wrong Entries Excel
  const handleDownloadExcel = () => {
    exportWrongEntriesToExcel(wrongList)
    if (showToast) {
      showToast({
        type: 'success',
        title: 'Excel Downloaded',
        message: `Downloaded ${totalWrong} wrong entries with "Correct Floor (Team to Fill)" column.`
      })
    }
  }

  return (
    <div className="w-full mb-4 bg-gradient-to-r from-red-500/10 via-orange-500/10 to-amber-500/10 border-2 border-red-500/40 rounded-xl p-4 shadow-lg text-slate-800 transition-all">
      {/* HEADER ROW / COLLAPSED VIEW */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left: Big Icon + Title + Count */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-lg bg-red-600 text-white shadow-md shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-red-950 flex items-center gap-1.5">
                <span>⚠️ Wrong Entry - Team Needs to Fix in Live Excel</span>
                <span className="px-2 py-0.5 rounded-md bg-red-600 text-white text-xs font-black shadow-xs">
                  {totalWrong}
                </span>
              </h2>
              <span className="text-xs font-semibold text-red-800 bg-red-100 px-2 py-0.5 rounded-full border border-red-200">
                Out of {totalAll.toLocaleString()} ({wrongPercentage}%)
              </span>
            </div>
            <p className="text-xs text-red-800/90 mt-0.5">
              Only 5 Sites are valid: DT-3 (L3) &amp; DT-4 (L-1, L-4, L-5, L-6). These {totalWrong} rows require manual floor assignment in Excel.
            </p>
          </div>
        </div>

        {/* Right: 3 Mini-Counts + Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap shrink-0">
          
          {/* Mini-count 1: Floor Blank */}
          <button
            onClick={() => {
              setActiveCategory(activeCategory === 'blank' ? 'all' : 'blank')
              setIsExpanded(true)
              setPage(1)
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeCategory === 'blank'
                ? 'bg-red-700 text-white border-red-800 ring-2 ring-red-400'
                : 'bg-white/90 text-red-900 border-red-200 hover:bg-red-50 shadow-xs'
            }`}
            title="Click to filter by Floor Blank"
          >
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block"></span>
            <span>Floor Blank:</span>
            <span className="font-bold">{subCounts.blank}</span>
          </button>

          {/* Mini-count 2: Floor = Location */}
          <button
            onClick={() => {
              setActiveCategory(activeCategory === 'location' ? 'all' : 'location')
              setIsExpanded(true)
              setPage(1)
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeCategory === 'location'
                ? 'bg-orange-700 text-white border-orange-800 ring-2 ring-orange-400'
                : 'bg-white/90 text-orange-950 border-orange-200 hover:bg-orange-50 shadow-xs'
            }`}
            title="Click to filter by Floor = Location"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 inline-block"></span>
            <span>Floor = Location:</span>
            <span className="font-bold">{subCounts.location}</span>
          </button>

          {/* Mini-count 3: Floor Spelling Wrong */}
          <button
            onClick={() => {
              setActiveCategory(activeCategory === 'spelling' ? 'all' : 'spelling')
              setIsExpanded(true)
              setPage(1)
            }}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all border ${
              activeCategory === 'spelling'
                ? 'bg-amber-700 text-white border-amber-800 ring-2 ring-amber-400'
                : 'bg-white/90 text-amber-950 border-amber-200 hover:bg-amber-50 shadow-xs'
            }`}
            title="Click to filter by Floor Spelling Wrong"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
            <span>Floor Spelling Wrong:</span>
            <span className="font-bold">{subCounts.spelling}</span>
          </button>

          {/* Download Wrong Entries Excel Button */}
          <button
            onClick={handleDownloadExcel}
            className="h-[32px] px-3 rounded-lg bg-red-700 hover:bg-red-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            title="Download Excel with blank 'Correct Floor (Team to Fill)' column"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>

          {/* Copy Event IDs Button */}
          <button
            onClick={handleCopyEventIds}
            className="h-[32px] px-3 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 whitespace-nowrap"
            title="Copy all 480 Event IDs as comma-separated text"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy IDs</span>
          </button>

          {/* Expand / Collapse Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-[32px] px-2.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-900 border border-red-300 text-xs font-bold flex items-center gap-1 transition-all"
            title={isExpanded ? 'Collapse wrong entries tables' : 'Expand wrong entries tables'}
          >
            <span>{isExpanded ? 'Hide Tables' : 'View Tables'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

      </div>

      {/* EXPANDABLE BODY: MONTHLY BREAKDOWN & FULL LIST TABLES */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-red-300/60 space-y-4">
          
          {/* Active Filter Chips Bar */}
          <div className="flex items-center justify-between flex-wrap gap-2 text-xs bg-white/70 p-2 rounded-lg border border-red-200">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-red-950 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-red-600" />
                Active Filter:
              </span>
              <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-semibold border border-red-200">
                Category: {activeCategory === 'all' ? 'All (480)' : activeCategory.toUpperCase()}
              </span>
              {selectedMonth && (
                <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-900 font-semibold border border-orange-200">
                  Month: {selectedMonth}-26
                </span>
              )}
              {searchQuery && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-semibold border border-amber-200">
                  Search: "{searchQuery}"
                </span>
              )}
              <span className="text-slate-600 font-medium ml-1">
                Showing {filteredList.length} of {totalWrong} records
              </span>
            </div>

            {(activeCategory !== 'all' || selectedMonth || searchQuery) && (
              <button
                onClick={() => {
                  setActiveCategory('all')
                  setSelectedMonth(null)
                  setSearchQuery('')
                  setPage(1)
                }}
                className="text-xs font-semibold text-red-700 hover:text-red-900 flex items-center gap-1 underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                Clear Filters
              </button>
            )}
          </div>

          {/* TABLE 1: WRONG ENTRIES BY MONTH */}
          <div className="bg-white rounded-lg border border-red-200 shadow-xs overflow-hidden">
            <div className="px-3 py-2 bg-gradient-to-r from-red-100/80 to-orange-100/80 border-b border-red-200 flex items-center justify-between">
              <h3 className="text-xs font-bold text-red-950 uppercase tracking-wide flex items-center gap-1.5">
                <span>📅 Wrong Entries by Month (Click row to filter list below)</span>
              </h3>
              <span className="text-[11px] text-red-800 font-semibold">
                Sorted DESC by Wrong Count
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Month</th>
                    <th className="px-3 py-2 text-center text-red-700">Wrong Count</th>
                    <th className="px-3 py-2 text-center text-slate-600">Floor Blank</th>
                    <th className="px-3 py-2 text-center text-slate-600">Floor = Location</th>
                    <th className="px-3 py-2 text-center text-slate-600">Spelling Wrong</th>
                    <th className="px-3 py-2 text-slate-500">Example Event IDs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyStats.map((m) => {
                    const isSelected = selectedMonth === m.month
                    return (
                      <tr
                        key={m.month}
                        onClick={() => {
                          setSelectedMonth(selectedMonth === m.month ? null : m.month)
                          setPage(1)
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-red-100/90 font-bold text-red-950'
                            : 'hover:bg-red-50/60 text-slate-800'
                        }`}
                      >
                        <td className="px-3 py-1.5 font-semibold flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-600' : 'bg-slate-300'}`}></span>
                          <span>{m.month}-26</span>
                        </td>
                        <td className="px-3 py-1.5 text-center font-bold text-red-700">
                          {m.total}
                        </td>
                        <td className="px-3 py-1.5 text-center text-slate-600">
                          {m.blank}
                        </td>
                        <td className="px-3 py-1.5 text-center text-slate-600">
                          {m.location}
                        </td>
                        <td className="px-3 py-1.5 text-center text-slate-600">
                          {m.spelling}
                        </td>
                        <td className="px-3 py-1.5 text-slate-500 text-[11px] font-mono truncate max-w-[280px]">
                          {m.exampleIds.join(', ')}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* TABLE 2: WRONG ENTRIES - FULL LIST */}
          <div className="bg-white rounded-lg border border-red-200 shadow-xs overflow-hidden">
            <div className="px-3 py-2.5 bg-gradient-to-r from-red-50 to-orange-50 border-b border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                  📋 Wrong Entries — Full List ({filteredList.length} Records)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Showing 50 per page • Wrong Floor highlighted in red • Team must edit live Excel
                </p>
              </div>

              {/* Search Box inside table */}
              <div className="relative w-full sm:w-[260px]">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Event ID, Floor, Title..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setPage(1)
                  }}
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-300 rounded-md bg-white focus:outline-hidden focus:ring-1 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2">Event ID (Excel Row)</th>
                    <th className="px-2 py-2">Month</th>
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Building</th>
                    <th className="px-3 py-2 text-red-700">Floor (Wrong Value)</th>
                    <th className="px-3 py-2">Location</th>
                    <th className="px-3 py-2">Event Title</th>
                    <th className="px-3 py-2 text-emerald-800">Correct Floor Suggestion</th>
                    <th className="px-2 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                  {paginatedList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-8 text-center text-slate-500">
                        No wrong entries matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    paginatedList.map((r, i) => (
                      <tr key={r['Event ID'] || i} className="hover:bg-red-50/40 transition-colors">
                        <td className="px-3 py-1.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                          {r['Event ID']}
                          {r.excelRow && (
                            <span className="text-[10px] text-slate-400 ml-1 font-sans">
                              (R{r.excelRow})
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-1.5 whitespace-nowrap font-medium">{r['Month']}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap font-mono text-[11px]">{r['Event Date']}</td>
                        <td className="px-2 py-1.5 whitespace-nowrap">{r['Building']}</td>
                        
                        {/* Floor in RED */}
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <span className="px-1.5 py-0.5 rounded font-bold text-red-700 bg-red-100 border border-red-300 text-[11px]">
                            {r.wrongFloor || 'Not Mentioned'}
                          </span>
                        </td>

                        <td className="px-3 py-1.5 max-w-[140px] truncate" title={r['Location']}>
                          {r['Location'] || <span className="text-slate-400 italic">Not Mentioned</span>}
                        </td>
                        <td className="px-3 py-1.5 max-w-[200px] truncate font-medium text-slate-900" title={r['Event Title / Purpose']}>
                          {r['Event Title / Purpose']}
                        </td>

                        {/* Suggestion in GREEN/TEAL */}
                        <td className="px-3 py-1.5 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded font-semibold text-emerald-900 bg-emerald-100 border border-emerald-300 text-[11px]">
                            👉 {r.suggestion}
                          </span>
                        </td>

                        <td className="px-2 py-1.5 whitespace-nowrap text-[11px] text-slate-600">
                          {r['Calendar Booking Status'] || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="px-3 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <span>
                  Page {page} of {totalPages} ({filteredList.length} total rows)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-2 font-semibold text-slate-800">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                    disabled={page === totalPages}
                    className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  )
}
