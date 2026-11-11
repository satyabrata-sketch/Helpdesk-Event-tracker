// ==============================================================================
// EXCEL EXPORT ENGINE (SheetJS)
// Exports data preserving exact sheet names, column names, and column order
// Respects all currently applied dashboard filters
// ==============================================================================
import * as XLSX from 'xlsx'
import { getWrongReason } from './dateUtils'

/**
 * Export filtered rows to Excel file with exact sheet name and column order.
 */
export function exportToExcel({ sheetName = 'Sheet1', headers = [], rows = [], fileName = 'Facility_Tracker_Export' }) {
  if (!rows || rows.length === 0) {
    alert('No records available to export with current filters.')
    return
  }

  // Ensure headers are defined; if not, infer from first row keys
  const columnOrder = headers.length > 0 ? headers : Object.keys(rows[0] || {})

  // Map rows preserving exact column ordering
  const exportData = rows.map(row => {
    const formattedRow = {}
    columnOrder.forEach(col => {
      let val = row[col]
      // Format ISO dates cleanly if string
      if (typeof val === 'string' && val.includes('T') && val.endsWith('Z')) {
        try {
          const d = new Date(val)
          if (!isNaN(d.getTime())) {
            val = d.toISOString().split('T')[0]
          }
        } catch (_e) {}
      }
      formattedRow[col] = val !== null && val !== undefined ? val : ''
    })
    return formattedRow
  })

  // Create worksheet with explicit header order
  const worksheet = XLSX.utils.json_to_sheet(exportData, { header: columnOrder })

  // Calculate auto column widths
  const colWidths = columnOrder.map(col => {
    let maxLen = col.length
    for (let i = 0; i < Math.min(rows.length, 50); i++) {
      const val = rows[i][col]
      if (val !== null && val !== undefined) {
        maxLen = Math.max(maxLen, String(val).length)
      }
    }
    return { wch: Math.min(Math.max(maxLen + 3, 12), 45) }
  })
  worksheet['!cols'] = colWidths

  // Create workbook and append sheet with exact name
  const workbook = XLSX.utils.book_new()
  const sanitizedSheetName = sheetName.replace(/[:\\/?*\[\]]/g, '_').substring(0, 31)
  XLSX.utils.book_append_sheet(workbook, worksheet, sanitizedSheetName)

  // Generate file name with timestamp
  const dateStr = new Date().toISOString().slice(0, 10)
  const fullFileName = `${fileName}_${dateStr}.xlsx`

  // Download Excel file
  XLSX.writeFile(workbook, fullFileName)
}

/**
 * Download an empty/sample Excel template for either Helpdesk or Event tracker
 * with exact sheet names and column headers.
 */
export function downloadTrackerTemplate(trackerType = 'helpdesk') {
  const workbook = XLSX.utils.book_new()

  if (trackerType === 'helpdesk') {
    const headers = [
      'Sr no.', 'Site', 'Zone', 'Location', 'Month', 'Date', 'Report Time', 
      'Request category', 'Employee Name', 'Request Via', 'Discription', 
      'Action taken', 'Date close', 'Resolved time', 'Status / WIP', 
      'Request from', 'Call type', 'Remark', 'Defined TAT (Hrs)', 
      'Closure Time (Hrs)', 'Closure Duration', 'TAT Status'
    ]
    const sampleRow = {
      'Sr no.': 1,
      'Site': 'DT3',
      'Zone': 'Zone A',
      'Location': 'Floor 3',
      'Month': 'Jan-26',
      'Date': '2026-01-02',
      'Report Time': '10:00 AM',
      'Request category': 'Housekeeping',
      'Employee Name': 'Maya Infra',
      'Request Via': 'In Person',
      'Discription': 'Sample cleaning requirement',
      'Action taken': 'HK team assigned and completed',
      'Date close': '2026-01-02',
      'Resolved time': '11:00 AM',
      'Status / WIP': 'Resolved',
      'Request from': 'Team Infra - Maya',
      'Call type': 'Proactive',
      'Remark': 'Resolved smoothly',
      'Defined TAT (Hrs)': 2,
      'Closure Time (Hrs)': 1,
      'Closure Duration': '1 hr',
      'TAT Status': 'Within TAT'
    }
    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers })
    XLSX.utils.book_append_sheet(workbook, ws, 'Helpdesk Tracker')
    XLSX.writeFile(workbook, 'Template_HELP_DESK_TRACKER_FY_25-26.xlsx')
  } else {
    const headers = [
      'Event ID', 'Year', 'Month', 'Event Date', 'Day', 'Building', 'Floor', 
      'Location', 'Event Title / Purpose', 'Category', 'Capacity / Pax', 
      'Event Scale', 'Start Time', 'End Time', 'F&B Support', 'Logistic Support', 
      'Booked By', 'Requester Email', 'Calendar Booking Status', 'Feedback Form', 
      'Booking Date', 'Remarks', 'Booking Taken By'
    ]
    const sampleRow = {
      'Event ID': 'EVT-2026-0001',
      'Year': 2026,
      'Month': 'Jan',
      'Event Date': '2026-01-15',
      'Day': 'Thu',
      'Building': 'Downtown-3',
      'Floor': 'L3',
      'Location': 'Hackable Area',
      'Event Title / Purpose': 'Quarterly Review & Workshop',
      'Category': 'Team Meeting & Workshop',
      'Capacity / Pax': 25,
      'Event Scale': 'Small Event',
      'Start Time': '09:00 AM',
      'End Time': '01:00 PM',
      'F&B Support': 'Required',
      'Logistic Support': 'Required',
      'Booked By': 'Facility Ops',
      'Requester Email': 'ops@cbre.com',
      'Calendar Booking Status': 'Confirmed (Done)',
      'Feedback Form': 'Not Required',
      'Booking Date': '2026-01-01',
      'Remarks': 'Arrangements completed',
      'Booking Taken By': 'Alwajid Ansari'
    }
    const ws = XLSX.utils.json_to_sheet([sampleRow], { header: headers })
    XLSX.utils.book_append_sheet(workbook, ws, 'Master_Event_Tracker_2026')
    XLSX.writeFile(workbook, 'Template_Yearly_Event_Tracker_2026.xlsx')
  }
}

/**
 * Export ONLY Wrong Entries to Excel (Part 2)
 * Includes explicit blank column "Correct Floor (Team to Fill)" for team correction.
 */
export function exportWrongEntriesToExcel(wrongRows = []) {
  if (!wrongRows || wrongRows.length === 0) {
    alert('No wrong entries found to export.')
    return
  }

  const headers = [
    'Event ID',
    'Excel Sheet Name',
    'Excel Row No',
    'Event Date',
    'Month',
    'Building',
    'Floor (Current Wrong)',
    'Location',
    'Wrong Reason',
    'Correct Floor (Team to Fill)',
    'Event Title / Purpose',
    'Category',
    'Capacity / Pax',
    'Correct Floor Suggestion',
    'Calendar Booking Status'
  ]

  const mappedData = wrongRows.map(r => ({
    'Event ID': r['Event ID'] || '',
    'Excel Sheet Name': r.sheetName || r.sheet || '',
    'Excel Row No': r.excelRowNo || r.excelRow || '',
    'Event Date': r['Event Date'] || '',
    'Month': r['Month'] || '',
    'Building': r['Building'] || '',
    'Floor (Current Wrong)': r['Floor'] || r.wrongFloor || 'Not Mentioned',
    'Location': r['Location'] || 'Not Mentioned',
    'Wrong Reason': r['Wrong Reason'] || getWrongReason(r),
    'Correct Floor (Team to Fill)': '', // Intentionally blank for team to fill
    'Event Title / Purpose': r['Event Title / Purpose'] || '',
    'Category': r['Category'] || '',
    'Capacity / Pax': r['Capacity / Pax'] !== undefined ? r['Capacity / Pax'] : '',
    'Correct Floor Suggestion': r.suggestion || '',
    'Calendar Booking Status': r['Calendar Booking Status'] || ''
  }))

  const worksheet = XLSX.utils.json_to_sheet(mappedData, { header: headers })

  const colWidths = headers.map(h => ({
    wch: Math.max(h.length + 3, 16)
  }))
  colWidths[0] = { wch: 18 } // Event ID
  colWidths[5] = { wch: 22 } // Floor (Wrong Value)
  colWidths[7] = { wch: 35 } // Event Title
  colWidths[10] = { wch: 24 } // Correct Floor Suggestion
  colWidths[11] = { wch: 28 } // Correct Floor (Team to Fill)
  worksheet['!cols'] = colWidths

  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Wrong_Entries_Team_Fix')

  const dateStr = new Date().toISOString().slice(0, 10)
  XLSX.writeFile(workbook, `Wrong_Entries_Team_Fix_${dateStr}.xlsx`)
}

