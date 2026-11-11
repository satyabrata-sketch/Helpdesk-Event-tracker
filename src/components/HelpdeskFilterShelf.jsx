// ==============================================================================
// HELPDESK FILTER SHELF (Tableau Style - 100% English)
// Dedicated filters for Helpdesk operations:
// Month (Jan-Dec Multi-Select), Year (2025, 2026), Quarter (Q1-Q4),
// Site, Floor, Category, Sub-Category, Status, Priority, Assigned Person, Vendor, TAT Status
// ==============================================================================
import React, { useState } from 'react'
import {
  Filter,
  RotateCcw,
  Calendar,
  MapPin,
  Tag,
  CheckCircle2,
  Clock,
  User,
  Layers,
  Search,
  Building2,
  AlertCircle,
  Truck,
  ChevronDown,
  Check
} from 'lucide-react'
import {
  CALENDAR_MONTHS,
  getQuarterOptions,
  getMonthsForYearAndQuarter
} from '../lib/dateUtils'
import { CustomDateRangePicker } from './CustomDateRangePicker'

export function HelpdeskFilterShelf({
  filters,
  onFilterChange,
  onResetFilters,
  distinctOptions,
  activeFilterCount
}) {
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)

  // Available Years from data
  const availableYears = distinctOptions?.availableYears || ['2025', '2026', '2027']

  // Cascading Quarters & Months
  const quarterOptions = getQuarterOptions(filters.year || 'all')
  const availableMonths = getMonthsForYearAndQuarter(filters.year || 'all', filters.quarter || 'all')

  // Handle Dynamic Cascading Year Change (Resets Month & Quarter)
  const handleYearChange = (newYear) => {
    onFilterChange('year', newYear)
    onFilterChange('quarter', 'all')
    onFilterChange('selectedMonths', [])
  }

  // Handle Dynamic Cascading Quarter Change
  const handleQuarterChange = (newQuarter) => {
    onFilterChange('quarter', newQuarter)
    // Clear any months that do not belong to the selected quarter
    const validMonths = getMonthsForYearAndQuarter(filters.year || 'all', newQuarter)
    const current = filters.selectedMonths || []
    const updated = current.filter((m) => validMonths.includes(m))
    onFilterChange('selectedMonths', updated)
  }

  // Toggle single month in multi-select array
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

  return (
    <div className="bg-[#ECFEFF] border border-[#0E7490] rounded-xl shadow-xs p-3">
      <div className="w-full">
        
        {/* Top Header of Filter Shelf */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0E7490]">
            <Filter className="w-3.5 h-3.5 text-[#0E7490]" />
            <span>Helpdesk Filter Shelf</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#0E7490] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
                {activeFilterCount} active
              </span>
            )}
          </div>

          {/* Quick Search & Clear All Button */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[180px] sm:min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-cyan-700/60 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search ticket, employee, issue..."
                value={filters.searchKeyword || ''}
                onChange={(e) => onFilterChange('searchKeyword', e.target.value)}
                className="w-full bg-white border border-[#0E7490]/40 rounded pl-8 pr-6 py-1 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0E7490]"
              />
              {filters.searchKeyword && (
                <button
                  onClick={() => onFilterChange('searchKeyword', '')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                onClick={onResetFilters}
                className="flex items-center gap-1 text-xs border border-rose-300 text-rose-600 hover:text-rose-700 bg-white hover:bg-rose-50 font-bold px-2.5 py-1 rounded transition-colors shadow-2xs cursor-pointer"
                title="Reset all Helpdesk filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filter: Custom Range ONLY */}
        <div className="bg-white/90 border border-cyan-200 rounded-lg p-2 mb-2.5 shadow-2xs">
          <CustomDateRangePicker
            startDate={filters.startDate || '2026-01-01'}
            endDate={filters.endDate || '2026-12-31'}
            accent="blue"
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

        {/* Operational Filters Grid: 8 Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2 text-xs">
          
          {/* 1. Site Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#0B3D91]" />
              <span>Site</span>
            </label>
            <select
              value={filters.site || 'all'}
              onChange={(e) => onFilterChange('site', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All Sites</option>
              <option value="DT3">Downtown-3 (DT3)</option>
              <option value="DT4">Downtown-4 (DT4)</option>
            </select>
          </div>

          {/* 2. Floor Filter (Strictly Non-Zero Floors Ground-L6) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Building2 className="w-3 h-3 text-[#0B3D91]" />
              <span>Floor</span>
            </label>
            <select
              value={filters.floor || 'all'}
              onChange={(e) => onFilterChange('floor', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
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
            </select>
          </div>

          {/* 5B. Separate Zone Filter (V13: ONLY Zone A to Zone F) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#0B3D91]" />
              <span>Zone</span>
            </label>
            <select
              value={filters.zone || 'all'}
              onChange={(e) => onFilterChange('zone', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All Zones</option>
              {(distinctOptions?.zones || ['Zone A', 'Zone B', 'Zone C', 'Zone D', 'Zone E', 'Zone F']).map((zn) => (
                <option key={zn} value={zn}>{zn}</option>
              ))}
            </select>
          </div>

          {/* 6. Request Category */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#0B3D91]" />
              <span>Category</span>
            </label>
            <select
              value={filters.category || 'all'}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All Categories</option>
              {distinctOptions?.categories?.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 7. Sub-Category / Call Type */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#0B3D91]" />
              <span>Call Type</span>
            </label>
            <select
              value={filters.callType || filters.subCategory || 'all'}
              onChange={(e) => {
                onFilterChange('callType', e.target.value)
                onFilterChange('subCategory', e.target.value)
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All Call Types</option>
              <option value="Reactive">Reactive (Complaints)</option>
              <option value="Proactive">Proactive (Preventive)</option>
            </select>
          </div>

          {/* 8. Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#0B3D91]" />
              <span>Status</span>
            </label>
            <select
              value={filters.status || 'all'}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Work In Progress">In-Progress (WIP)</option>
              <option value="Resolved">Resolved / Closed</option>
            </select>
          </div>

          {/* 9. Ticket Raised By (Replaces Vendor per V13) */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-[#0B3D91]" />
              <span>Ticket Raised By</span>
            </label>
            <select
              value={filters.ticketRaisedBy || filters.vendor || 'all'}
              onChange={(e) => {
                onFilterChange('ticketRaisedBy', e.target.value)
                onFilterChange('vendor', e.target.value)
              }}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All Sources</option>
              {(distinctOptions?.ticketRaisedByList || distinctOptions?.vendors || []).map((vend) => (
                <option key={vend} value={vend}>{vend}</option>
              ))}
            </select>
          </div>

          {/* 10. TAT Status */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#0B3D91]" />
              <span>TAT Status</span>
            </label>
            <select
              value={filters.tat || 'all'}
              onChange={(e) => onFilterChange('tat', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#0B3D91] focus:bg-white"
            >
              <option value="all">All TAT</option>
              <option value="in tat">Within TAT (In TAT)</option>
              <option value="out of tat">Beyond TAT (Out of TAT)</option>
            </select>
          </div>

        </div>

      </div>
    </div>
  )
}
