// ==============================================================================
// EVENT FILTER SHELF (Tableau Style - 100% English)
// Dedicated filters for Event operations:
// Year (2026 ONLY - 2025 removed), Quarter (Q1-Q4), Month (Jan-Dec Multi-Select),
// Building (All Sites, Downtown-3, Downtown-4),
// Floor (L3, L-1, L-4, L-5, L-6, Wrong Entry (480)),
// Location (Searchable + Counts, Location Blank (649)),
// Event Type, Status, Organizer, Pax Range, Search
// ==============================================================================
import React, { useState, useMemo, useEffect } from 'react'
import {
  Filter,
  RotateCcw,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Users,
  Search,
  Building2,
  Sparkles,
  ChevronDown,
  Check,
  AlertTriangle
} from 'lucide-react'
import {
  CALENDAR_MONTHS,
  getQuarterOptions,
  getMonthsForYearAndQuarter,
  formatDateRangeDisplay
} from '../lib/dateUtils'
import { CustomDateRangePicker } from './CustomDateRangePicker'

export function EventFilterShelf({
  filters,
  onFilterChange,
  onResetFilters,
  distinctOptions,
  activeFilterCount,
  locationCounts = []
}) {
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false)
  const [locationSearch, setLocationSearch] = useState('')

  // Debounced searchKeyword for instant typing & zero freeze
  const [localSearch, setLocalSearch] = useState(filters.searchKeyword || '')
  useEffect(() => {
    setLocalSearch(filters.searchKeyword || '')
  }, [filters.searchKeyword])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== (filters.searchKeyword || '')) {
        onFilterChange('searchKeyword', localSearch)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, filters.searchKeyword, onFilterChange])

  // Debounced custom startDate and endDate
  const [localStartDate, setLocalStartDate] = useState(filters.startDate || '')
  const [localEndDate, setLocalEndDate] = useState(filters.endDate || '')

  useEffect(() => {
    setLocalStartDate(filters.startDate || '')
  }, [filters.startDate])
  useEffect(() => {
    setLocalEndDate(filters.endDate || '')
  }, [filters.endDate])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localStartDate !== (filters.startDate || '')) {
        onFilterChange('startDate', localStartDate)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localStartDate, filters.startDate, onFilterChange])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localEndDate !== (filters.endDate || '')) {
        onFilterChange('endDate', localEndDate)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [localEndDate, filters.endDate, onFilterChange])

  // 1. Available Year: All Years, 2026, 2027
  const currentYear = filters.year || 'all'
  const availableYears = ['all', '2026', '2027']

  // Cascading Quarters & Months for selected year
  const quarterOptions = getQuarterOptions(currentYear)
  const availableMonths = getMonthsForYearAndQuarter(currentYear, filters.quarter || 'all', true)

  // Handle Dynamic Cascading Quarter Change
  const handleQuarterChange = (newQuarter) => {
    onFilterChange('quarter', newQuarter)
    const validMonths = getMonthsForYearAndQuarter(currentYear, newQuarter, true)
    const current = filters.selectedMonths || []
    const updated = current.filter((m) => validMonths.includes(m))
    onFilterChange('selectedMonths', updated)
  }

  const handleToggleMonth = (monthLabel) => {
    const current = filters.selectedMonths || []
    if (current.includes(monthLabel)) {
      onFilterChange('selectedMonths', current.filter((m) => m !== monthLabel))
    } else {
      onFilterChange('selectedMonths', [...current, monthLabel])
    }
  }

  const handleSelectAllMonths = () => {
    onFilterChange('selectedMonths', [])
    setIsMonthDropdownOpen(false)
  }

  const selectedMonthCount = (filters.selectedMonths || []).length

  // Filtered Locations for Dropdown Search
  const filteredLocationOptions = useMemo(() => {
    if (!locationSearch.trim()) return locationCounts
    const q = locationSearch.toLowerCase().trim()
    return locationCounts.filter(([loc]) => loc.toLowerCase().includes(q))
  }, [locationCounts, locationSearch])

  // Active Filter Pills (Part 3 • Filter Persistence & Clear Pills)
  const activeFilterPills = useMemo(() => {
    const pills = []
    if (
      (filters.startDate && filters.startDate !== '2026-01-01') ||
      (filters.endDate && filters.endDate !== '2026-12-31')
    ) {
      pills.push({
        key: 'dateRange',
        label: 'Date Range',
        value: formatDateRangeDisplay(filters.startDate, filters.endDate),
        onClear: () => {
          onFilterChange('startDate', '2026-01-01')
          onFilterChange('endDate', '2026-12-31')
        }
      })
    }
    if (filters.year && filters.year !== 'all') {
      pills.push({ key: 'year', label: 'Year', value: filters.year, onClear: () => onFilterChange('year', 'all') })
    }
    if (filters.site && filters.site !== 'all') {
      pills.push({ key: 'site', label: 'Building', value: filters.site, onClear: () => onFilterChange('site', 'all') })
    }
    if (filters.floor && filters.floor !== 'all') {
      pills.push({
        key: 'floor',
        label: 'Floor',
        value: filters.floor === 'wrong' ? 'Wrong Entry' : filters.floor,
        onClear: () => onFilterChange('floor', 'all')
      })
    }
    if (filters.location && filters.location !== 'all') {
      pills.push({ key: 'location', label: 'Location', value: filters.location, onClear: () => onFilterChange('location', 'all') })
    }
    if (filters.selectedMonths?.length > 0) {
      pills.push({ key: 'month', label: 'Month', value: filters.selectedMonths.join(', '), onClear: () => onFilterChange('selectedMonths', []) })
    }
    if (filters.quarter && filters.quarter !== 'all') {
      pills.push({ key: 'quarter', label: 'Quarter', value: filters.quarter, onClear: () => onFilterChange('quarter', 'all') })
    }
    if (filters.paxRange && filters.paxRange !== 'all') {
      pills.push({ key: 'pax', label: 'Pax', value: filters.paxRange, onClear: () => onFilterChange('paxRange', 'all') })
    }
    if ((filters.eventType && filters.eventType !== 'all') || (filters.category && filters.category !== 'all')) {
      const val = filters.eventType && filters.eventType !== 'all' ? filters.eventType : filters.category
      pills.push({
        key: 'category',
        label: 'Category',
        value: val,
        onClear: () => {
          onFilterChange('eventType', 'all')
          onFilterChange('category', 'all')
        }
      })
    }
    if (filters.status && filters.status !== 'all') {
      pills.push({ key: 'status', label: 'Status', value: filters.status, onClear: () => onFilterChange('status', 'all') })
    }
    if (filters.organizer && filters.organizer !== 'all') {
      pills.push({ key: 'organizer', label: 'Organizer', value: filters.organizer, onClear: () => onFilterChange('organizer', 'all') })
    }
    if (filters.searchKeyword) {
      pills.push({ key: 'search', label: 'Search', value: `"${filters.searchKeyword}"`, onClear: () => onFilterChange('searchKeyword', '') })
    }
    if (filters.includeSundayPlaceholders) {
      pills.push({ key: 'sunday', label: 'Sunday Placeholders', value: 'Included', onClear: () => onFilterChange('includeSundayPlaceholders', false) })
    }
    return pills
  }, [filters, onFilterChange])

  return (
    <div className="bg-[#FFF7ED] border border-[#EA580C] rounded-xl shadow-xs p-3 sticky top-0 z-30">
      <div className="max-w-[1680px] mx-auto">
        
        {/* Top Header of Filter Shelf */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#EA580C]">
            <Filter className="w-3.5 h-3.5 text-[#EA580C]" />
            <span>Event Filters</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#EA580C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {activeFilterCount} active
              </span>
            )}
          </div>

          {/* Quick Search, Sunday Toggle & Clear All Button */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Sunday Placeholder Toggle (Part 4) */}
            <label
              className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1 rounded-md border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 select-none shadow-2xs"
              title="Sunday rows with partial/blank details are excluded from Total by default"
            >
              <input
                type="checkbox"
                checked={Boolean(filters.includeSundayPlaceholders)}
                onChange={(e) => onFilterChange('includeSundayPlaceholders', e.target.checked)}
                className="w-3.5 h-3.5 text-[#EA580C] rounded border-slate-300 focus:ring-[#EA580C]"
              />
              <span className="text-[11px]">Include Sunday Placeholders</span>
              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${filters.includeSundayPlaceholders ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                {filters.includeSundayPlaceholders ? 'ON' : 'OFF by default'}
              </span>
            </label>

            {/* Quick Search */}
            <div className="relative min-w-[200px] sm:min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-orange-700/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search event title, organizer, floor..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-md pl-8 pr-6 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#1976D2]"
              />
              {localSearch && (
                <button
                  onClick={() => {
                    setLocalSearch('')
                    onFilterChange('searchKeyword', '')
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-xs border border-rose-300 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 font-bold px-2.5 py-1 rounded-md transition-colors shadow-2xs"
                title="Reset all Event filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filter: Custom Range ONLY (Side-by-side Start & End + Apply + Reset to Full Year) */}
        <div className="bg-white/90 border border-orange-200 rounded-lg p-2 mb-2.5 shadow-2xs">
          <CustomDateRangePicker
            startDate={filters.startDate || '2026-01-01'}
            endDate={filters.endDate || '2026-12-31'}
            accent="orange"
            onApply={({ startDate, endDate }) => {
              onFilterChange('startDate', startDate)
              onFilterChange('endDate', endDate)
              onFilterChange('datePreset', 'custom')
            }}
            onReset={() => {
              onFilterChange('startDate', '2026-01-01')
              onFilterChange('endDate', '2026-12-31')
              onFilterChange('datePreset', 'custom')
            }}
          />
        </div>

        {/* Operational Filters Grid: 7 Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          
          {/* 1. Building Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#EA580C]" />
              <span>Building</span>
            </label>
            <select
              value={filters.site || 'all'}
              onChange={(e) => onFilterChange('site', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#EA580C]"
            >
              <option value="all">All Sites</option>
              <option value="Downtown-3">Downtown-3</option>
              <option value="Downtown-4">Downtown-4</option>
            </select>
          </div>

          {/* 2. Floor Filter (Strictly Non-Zero Ground-L6 Floors + Wrong Entry) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#EA580C]" />
              <span>Floor</span>
            </label>
            <select
              value={filters.floor || 'all'}
              onChange={(e) => onFilterChange('floor', e.target.value)}
              className={`w-full border rounded-md px-2 py-1 text-xs font-medium focus:ring-1 focus:ring-[#EA580C] ${
                filters.floor === 'wrong'
                  ? 'bg-red-50 text-red-700 border-red-300 font-bold'
                  : 'bg-white text-slate-800 border-slate-300'
              }`}
            >
              <option value="all">All Floors</option>
              {distinctOptions?.floors?.map((fl) => {
                const count = distinctOptions?.floorCounts?.[fl]
                return (
                  <option key={fl} value={fl}>
                    {fl} {count !== undefined ? `(${count.toLocaleString()})` : ''}
                  </option>
                )
              })}
              <option value="wrong">⚠️ Wrong Entry</option>
            </select>
          </div>

          {/* 6. Location Filter (Part 4: Searchable + Counts + Location Blank) */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#1976D2]" />
              <span>Location</span>
            </label>
            <button
              type="button"
              onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium flex items-center justify-between text-left focus:ring-1 focus:ring-[#1976D2]"
            >
              <span className="truncate">
                {filters.location && filters.location !== 'all' ? filters.location : 'All Locations'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-400 ml-1 shrink-0" />
            </button>

            {isLocationDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsLocationDropdownOpen(false)} />
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-md shadow-lg py-1.5 z-50">
                  <div className="px-2 pb-1.5 border-b border-slate-100">
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-2 py-1 text-xs border border-slate-200 rounded bg-slate-50 focus:outline-hidden focus:ring-1 focus:ring-[#1976D2]"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto px-1 py-1">
                    <button
                      type="button"
                      onClick={() => {
                        onFilterChange('location', 'all')
                        setIsLocationDropdownOpen(false)
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left ${
                        !filters.location || filters.location === 'all'
                          ? 'bg-blue-50 text-[#1976D2] font-bold'
                          : 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span>All Locations (2,093)</span>
                      {(!filters.location || filters.location === 'all') && <Check className="w-3 h-3" />}
                    </button>
                    {filteredLocationOptions.map(([loc, cnt]) => {
                      const isSelected = filters.location === loc
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            onFilterChange('location', loc)
                            setIsLocationDropdownOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs text-left ${
                            isSelected ? 'bg-blue-50 text-[#1976D2] font-bold' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate pr-2">{loc}</span>
                          <span className="text-[10px] text-slate-500 font-semibold shrink-0">
                            {cnt}
                          </span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* 7. Category / Event Type (V13 Derived Categories) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#1976D2]" />
              <span>Category</span>
            </label>
            <select
              value={filters.eventType || filters.category || 'all'}
              onChange={(e) => {
                onFilterChange('eventType', e.target.value)
                onFilterChange('category', e.target.value)
              }}
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#1976D2]"
            >
              <option value="all">All Categories</option>
              {(distinctOptions?.eventTypes && distinctOptions.eventTypes.length > 0 ? distinctOptions.eventTypes : [
                'Assessment',
                'Celebration',
                'Hiring Drive',
                'Induction',
                'Lunch',
                'Meeting',
                'Team Connect',
                'Townhall',
                'Training',
                'Visit',
                'Workshop',
                'Other',
                'Unspecified'
              ]).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* 8. Event Status (V13 Date-Aware Smart Status) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#1976D2]" />
              <span>Status</span>
            </label>
            <select
              value={filters.derivedStatus || filters.status || 'all'}
              onChange={(e) => {
                onFilterChange('status', e.target.value)
                onFilterChange('derivedStatus', e.target.value)
              }}
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#1976D2]"
            >
              <option value="all">All Statuses</option>
              <option value="Completed">Completed</option>
              <option value="Upcoming">Upcoming (Future)</option>
              <option value="Cancelled">Cancelled / No-Show</option>
              <option value="Ongoing / Today">Ongoing / Today</option>
            </select>
          </div>

          {/* 9. Pax Range Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#1976D2]" />
              <span>Pax Range</span>
            </label>
            <select
              value={filters.paxRange || 'all'}
              onChange={(e) => onFilterChange('paxRange', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#1976D2]"
            >
              <option value="all">All Sizes (2,093)</option>
              <option value="0-20">0 - 20 Pax (Small)</option>
              <option value="21-50">21 - 50 Pax (Medium)</option>
              <option value="51-100">51 - 100 Pax (Large)</option>
              <option value="100+">100+ Pax (Townhall • 155)</option>
            </select>
          </div>

          {/* 10. Organizer Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-0.5 flex items-center gap-1">
              <Users className="w-3 h-3 text-[#1976D2]" />
              <span>Organizer</span>
            </label>
            <select
              value={filters.organizer || 'all'}
              onChange={(e) => onFilterChange('organizer', e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#1976D2]"
            >
              <option value="all">All Organizers</option>
              {distinctOptions?.organizers?.map((org) => (
                <option key={org} value={org}>{org}</option>
              ))}
            </select>
          </div>

        </div>

        {/* Active Filter Pills Bar (Part 3) */}
        {activeFilterPills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-blue-200 mt-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 mr-1">Active:</span>
            {activeFilterPills.map((pill) => (
              <span
                key={pill.key}
                className="inline-flex items-center gap-1 bg-white text-blue-900 border border-blue-300 text-[11px] font-semibold px-2 py-0.5 rounded-full shadow-2xs"
              >
                <span>{pill.label}: <strong>{pill.value}</strong></span>
                <button
                  type="button"
                  onClick={() => pill.onClear()}
                  className="text-slate-400 hover:text-rose-600 rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold"
                  title={`Clear ${pill.label} filter`}
                >
                  ✕
                </button>
              </span>
            ))}
            <button
              onClick={onResetFilters}
              className="text-[10px] text-rose-600 hover:underline font-bold ml-1.5"
            >
              Clear All
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
