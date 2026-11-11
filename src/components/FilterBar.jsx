// ==============================================================================
// TABLEAU-STYLE FILTERS BAR COMPONENT (100% English)
// ==============================================================================
import React from 'react'
import { Filter, RotateCcw, Calendar, MapPin, Tag, CheckCircle2, Clock, User, Layers } from 'lucide-react'

export function FilterBar({
  filters,
  onFilterChange,
  onResetFilters,
  distinctOptions,
  activeFilterCount
}) {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        
        {/* Header row of Filter Shelf */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600">
            <Filter className="w-3.5 h-3.5 text-[#0B3D91]" />
            <span>Tableau Filter Shelf</span>
            {activeFilterCount > 0 && (
              <span className="bg-[#0B3D91] text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {activeFilterCount} active
              </span>
            )}
          </div>

          {activeFilterCount > 0 && (
            <button
              onClick={onResetFilters}
              className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs">
          
          {/* 1. Date Range Preset */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-[#0B3D91]" />
              <span>Date Range</span>
            </label>
            <select
              value={filters.datePreset}
              onChange={(e) => onFilterChange('datePreset', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="last7">Last 7 Days</option>
              <option value="last30">Last 30 Days</option>
              <option value="thisMonth">This Month</option>
              <option value="last90">Last 90 Days</option>
              <option value="custom">Custom Range...</option>
            </select>
          </div>

          {/* 2. Site / Location */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <MapPin className="w-3 h-3 text-[#0B3D91]" />
              <span>Site</span>
            </label>
            <select
              value={filters.site}
              onChange={(e) => onFilterChange('site', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All Sites</option>
              {distinctOptions.sites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
            </select>
          </div>

          {/* 3. Category */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Tag className="w-3 h-3 text-[#0B3D91]" />
              <span>Category</span>
            </label>
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All Categories</option>
              {distinctOptions.categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* 4. Status */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-[#0B3D91]" />
              <span>Status</span>
            </label>
            <select
              value={filters.status}
              onChange={(e) => onFilterChange('status', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All Statuses</option>
              {distinctOptions.statuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* 5. Priority / TAT */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-[#0B3D91]" />
              <span>TAT Status</span>
            </label>
            <select
              value={filters.tat}
              onChange={(e) => onFilterChange('tat', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All TAT</option>
              <option value="Within TAT">Within TAT</option>
              <option value="Beyond TAT">Beyond TAT (Overdue)</option>
              <option value="Proactive">Proactive</option>
              <option value="Reactive">Reactive</option>
              <option value="Small Event">Small Scale Event</option>
              <option value="Medium Event">Medium Scale Event</option>
              <option value="Large Event">Large Scale Event</option>
            </select>
          </div>

          {/* 6. Assigned To / Requester */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <User className="w-3 h-3 text-[#0B3D91]" />
              <span>Assigned To</span>
            </label>
            <select
              value={filters.assignedTo}
              onChange={(e) => onFilterChange('assignedTo', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All Personnel</option>
              {distinctOptions.assignedToList.map(person => (
                <option key={person} value={person}>{person}</option>
              ))}
            </select>
          </div>

          {/* 7. Tracker Type Selector */}
          <div>
            <label className="block text-[11px] font-medium text-slate-500 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-[#0B3D91]" />
              <span>Tracker Scope</span>
            </label>
            <select
              value={filters.trackerType}
              onChange={(e) => onFilterChange('trackerType', e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1.5 text-xs font-semibold text-[#0B3D91] focus:outline-none focus:ring-1 focus:ring-[#0B3D91] focus:border-[#0B3D91]"
            >
              <option value="all">All Trackers</option>
              <option value="helpdesk">Helpdesk Only</option>
              <option value="events">Events Only</option>
            </select>
          </div>

        </div>

        {/* Custom Date Pickers row */}
        {filters.datePreset === 'custom' && (
          <div className="mt-2 pt-2 border-t border-slate-200 flex flex-wrap items-center gap-3 text-xs bg-slate-50 p-2 rounded">
            <span className="font-semibold text-slate-700">Custom Range:</span>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">From:</span>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => onFilterChange('startDate', e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-slate-500">To:</span>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => onFilterChange('endDate', e.target.value)}
                className="bg-white border border-slate-300 rounded px-2 py-1 text-xs"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
