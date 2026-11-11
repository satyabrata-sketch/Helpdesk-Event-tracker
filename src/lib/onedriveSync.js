// ==============================================================================
// ONEDRIVE SYNC & PARSING ENGINE
// ==============================================================================
import * as XLSX from 'xlsx'

/**
 * Convert SharePoint / OneDrive sharing URL to direct download URL
 */
export function convertToDirectDownloadUrl(shareUrl) {
  if (!shareUrl) return ''
  try {
    const url = new URL(shareUrl)
    // If it's already a download link
    if (url.searchParams.get('download') === '1') {
      return shareUrl
    }
    // Set or replace download=1 query parameter
    url.searchParams.set('download', '1')
    return url.toString()
  } catch (_e) {
    return shareUrl.includes('?') ? `${shareUrl}&download=1` : `${shareUrl}?download=1`
  }
}

/**
 * Format relative time (e.g. "Just now", "2 min ago", "1 hr ago")
 */
export function formatTimeAgo(isoDate) {
  if (!isoDate) return 'Never'
  try {
    const date = new Date(isoDate)
    const now = new Date()
    const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffSeconds < 60) return 'Just now'
    const diffMinutes = Math.floor(diffSeconds / 60)
    if (diffMinutes < 60) return `${diffMinutes} min ago`
    const diffHours = Math.floor(diffMinutes / 60)
    if (diffHours < 24) return `${diffHours} hr${diffHours > 1 ? 's' : ''} ago`
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  } catch (_e) {
    return 'Recently'
  }
}

/**
 * Parse an Excel ArrayBuffer into structured sheets with headers and rows.
 * Trims trailing empty rows and preserves ALL columns and sheet names.
 */
export function parseExcelWorkbook(arrayBuffer) {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true })
    const result = {
      sheets: {},
      sheetNames: workbook.SheetNames || []
    }

    for (const sheetName of (workbook.SheetNames || [])) {
      const worksheet = workbook.Sheets[sheetName]
      if (!worksheet) continue

      const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null })
      if (!rawData || rawData.length === 0) continue

      // Find header row safely
      let headerRowIdx = 0
      for (let i = 0; i < Math.min(6, rawData.length); i++) {
        const row = rawData[i]
        if (
          row &&
          (row.includes('Sr no.') ||
            row.includes('Sr No.') ||
            row.includes('Event ID') ||
            row.includes('Site') ||
            row.includes('Building'))
        ) {
          headerRowIdx = i
          break
        }
      }

      const headerRow = rawData[headerRowIdx] || []
      const headers = headerRow.map((c, idx) => {
        const val = c !== null && c !== undefined ? String(c).trim() : ''
        return val || `Col_${idx + 1}`
      })

      const rows = []
      for (let r = headerRowIdx + 1; r < rawData.length; r++) {
        const row = rawData[r]
        if (!row || row.length === 0) continue

        // Verify row contains non-blank values
        const hasContent = row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '')
        if (!hasContent) continue

        const rowObj = {}
        headers.forEach((h, colIdx) => {
          let val = row[colIdx]
          if (val instanceof Date) {
            val = val.toISOString()
          }
          rowObj[h] = val !== undefined ? val : null
        })
        rows.push(rowObj)
      }

      result.sheets[sheetName] = {
        headers,
        rows,
        count: rows.length
      }
    }

    return result
  } catch (err) {
    console.error('[parseExcelWorkbook error]:', err)
    throw new Error('Excel parsing failed - Upload valid Excel')
  }
}
