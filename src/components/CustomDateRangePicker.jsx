import React, { useState, useEffect } from 'react'
import { Calendar, RotateCcw, AlertTriangle, Check } from 'lucide-react'
import { formatDateRangeDisplay } from '../lib/dateUtils'

export function CustomDateRangePicker({
  startDate = '2026-01-01',
  endDate = '2026-12-31',
  onApply,
  onReset,
  accent = 'orange' // 'orange' | 'blue' | 'teal'
}) {
  const [localStart, setLocalStart] = useState(startDate || '2026-01-01')
  const [localEnd, setLocalEnd] = useState(endDate || '2026-12-31')
  const [error, setError] = useState('')

  useEffect(() => {
    setLocalStart(startDate || '2026-01-01')
    setLocalEnd(endDate || '2026-12-31')
    setError('')
  }, [startDate, endDate])

  const handleStartChange = (e) => {
    const val = e.target.value
    setLocalStart(val)
    if (val && localEnd && val > localEnd) {
      setError('Start Date cannot be after End Date')
    } else {
      setError('')
    }
  }

  const handleEndChange = (e) => {
    const val = e.target.value
    setLocalEnd(val)
    if (localStart && val && localStart > val) {
      setError('Start Date cannot be after End Date')
    } else {
      setError('')
    }
  }

  const handleApply = () => {
    if (localStart && localEnd && localStart > localEnd) {
      setError('Start Date cannot be after End Date')
      return
    }
    setError('')
    if (onApply) {
      onApply({
        startDate: localStart || '2026-01-01',
        endDate: localEnd || '2026-12-31'
      })
    }
  }

  const handleResetFullYear = () => {
    const defaultStart = '2026-01-01'
    const defaultEnd = '2026-12-31'
    setLocalStart(defaultStart)
    setLocalEnd(defaultEnd)
    setError('')
    if (onReset) {
      onReset()
    } else if (onApply) {
      onApply({ startDate: defaultStart, endDate: defaultEnd })
    }
  }

  const isOrange = accent === 'orange'
  const isBlue = accent === 'blue'

  const btnBg = isOrange
    ? 'bg-[#EA580C] hover:bg-orange-700 text-white'
    : isBlue
    ? 'bg-[#0E7490] hover:bg-cyan-800 text-white'
    : 'bg-[#003231] hover:bg-[#004D2A] text-white'

  const formattedDisplay = formatDateRangeDisplay(startDate || localStart, endDate || localEnd)

  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-end gap-2">
        {/* Start Date Box */}
        <div className="flex-1 min-w-[130px]">
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
            <Calendar className={`w-3 h-3 ${isOrange ? 'text-[#EA580C]' : 'text-[#0E7490]'}`} />
            <span>Start Date</span>
          </label>
          <input
            type="date"
            value={localStart}
            onChange={handleStartChange}
            min="2025-01-01"
            max="2027-12-31"
            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* End Date Box */}
        <div className="flex-1 min-w-[130px]">
          <label className="block text-[10px] font-bold text-slate-600 mb-0.5 flex items-center gap-1">
            <Calendar className={`w-3 h-3 ${isOrange ? 'text-[#EA580C]' : 'text-[#0E7490]'}`} />
            <span>End Date</span>
          </label>
          <input
            type="date"
            value={localEnd}
            onChange={handleEndChange}
            min="2025-01-01"
            max="2027-12-31"
            className="w-full bg-white border border-slate-300 rounded-md px-2 py-1 text-xs text-slate-800 font-semibold focus:outline-hidden focus:ring-1 focus:ring-blue-500 shadow-2xs"
          />
        </div>

        {/* Apply Button */}
        <button
          type="button"
          onClick={handleApply}
          className={`h-[28px] px-3.5 rounded-md font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap ${btnBg}`}
          title="Apply custom date range"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Apply</span>
        </button>

        {/* Reset to Full Year Button */}
        <button
          type="button"
          onClick={handleResetFullYear}
          className="h-[28px] px-2.5 rounded-md font-semibold text-xs text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 shadow-2xs transition-all active:scale-95 cursor-pointer flex items-center gap-1 whitespace-nowrap"
          title="Reset to Full Year 2026 (01-Jan-2026 to 31-Dec-2026)"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>Reset to Full Year</span>
        </button>
      </div>

      {/* Range Display / Validation Error */}
      <div className="flex items-center justify-between text-[10px] px-0.5">
        {error ? (
          <span className="text-rose-600 font-bold flex items-center gap-1 animate-pulse">
            <AlertTriangle className="w-3 h-3" />
            {error}
          </span>
        ) : (
          <span className="text-slate-500 font-medium truncate">
            Active: <strong className="text-slate-700">{formattedDisplay}</strong>
          </span>
        )}
      </div>
    </div>
  )
}
