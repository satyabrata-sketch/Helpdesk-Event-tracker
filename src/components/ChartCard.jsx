// ==============================================================================
// COMPACT CHART CARD COMPONENT (Clean CBRE Theme - 100% English)
// Height: 252px (default), Padding: 12px 12px 8px 12px, Radius: 10px
// Line 1: Title (Inter 600, 12px, #003231)
// Line 2: Reporting Period (Inter 400, 10px, #6B7280, height 14px)
// Top Border: 4px custom CBRE color per chart, hover lift
// ==============================================================================
import React, { useRef } from 'react'
import { Download } from 'lucide-react'

export function ChartCard({
  title,
  reportingPeriod = null,
  badge = null,
  data = [],
  topBorderColor = 'border-t-[#00A651]',
  className = '',
  children
}) {
  const cardRef = useRef(null)

  const handleDownloadCSV = () => {
    if (!data || data.length === 0) return

    const headers = Object.keys(data[0])
    const csvRows = [headers.join(',')]

    for (const row of data) {
      const values = headers.map((header) => {
        const val = row[header] !== undefined && row[header] !== null ? String(row[header]) : ''
        return `"${val.replace(/"/g, '""')}"`
      })
      csvRows.push(values.join(','))
    }

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    const sanitizedTitle = (title || 'chart').toLowerCase().replace(/[^a-z0-9]/g, '_')
    link.setAttribute('href', url)
    link.setAttribute('download', `${sanitizedTitle}_data.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const hasExplicitHeight = className && className.includes('h-')

  return (
    <div
      ref={cardRef}
      className={`w-full box-border rounded-[16px] p-3.5 bg-white text-[#1A1A1A] border border-slate-200/90 border-t-4 ${topBorderColor} shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] flex flex-col justify-between overflow-hidden transition-all duration-200 ${
        hasExplicitHeight ? className : `h-[340px] ${className}`
      }`}
    >
      {/* Line 1: Title (12px Bold #003231, fully visible) + Download icon (24px, shrink 0) */}
      <div className="flex items-center justify-between h-[20px] shrink-0">
        <div className="flex items-center gap-1.5 min-w-0 pr-2">
          <h3 className="font-inter font-bold text-[12px] leading-[18px] text-[#003231] truncate" title={title}>
            {title}
          </h3>
          {badge && (
            <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
              {badge}
            </span>
          )}
        </div>

        {data && data.length > 0 && (
          <button
            onClick={handleDownloadCSV}
            className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:text-[#003231] hover:bg-slate-100 transition-colors shrink-0"
            title="Download CSV Data"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Line 2: Reporting Period (10px #6B7280, whitespace-nowrap, overflow-visible) */}
      {reportingPeriod && (
        <div className="text-[10px] text-[#6B7280] leading-[14px] font-normal whitespace-nowrap overflow-visible mt-[2px] mb-2 shrink-0 font-inter">
          {reportingPeriod}
        </div>
      )}

      {/* Chart Body */}
      <div className="w-full flex-1 min-h-0 overflow-visible flex flex-col justify-between">
        {children}
      </div>
    </div>
  )
}
