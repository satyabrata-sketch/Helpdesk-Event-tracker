// ==============================================================================
// MANUAL EXCEL UPLOAD / OVERRIDE SYNC MODAL
// Multi-sheet SheetJS reader, Admin password gate, Column Validation,
// Progress bar, Preview, and Template Download
// ==============================================================================
import React, { useState, useRef } from 'react'
import {
  X,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Download,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react'
import { parseExcelWorkbook } from '../lib/onedriveSync'
import { downloadTrackerTemplate } from '../lib/excelExport'

// Expected standard columns for validation
const EXPECTED_COLUMNS = {
  helpdesk: [
    'Sr no.', 'Site', 'Request category', 'Discription', 'Action taken', 
    'Date close', 'Status / WIP', 'Request from', 'Call type'
  ],
  event: [
    'Event ID', 'Year', 'Month', 'Event Date', 'Building', 'Category', 
    'Capacity / Pax', 'Event Scale', 'Calendar Booking Status'
  ]
}

export function ManualUploadModal({
  isOpen,
  onClose,
  isAdmin,
  setIsAdmin,
  onApplyManualUpload,
  showToast
}) {
  const [selectedTracker, setSelectedTracker] = useState('helpdesk') // 'helpdesk' | 'event'
  const [passwordInput, setPasswordInput] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [parsedResult, setParsedResult] = useState(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [validationWarnings, setValidationWarnings] = useState([])
  
  const fileInputRef = useRef(null)

  if (!isOpen) return null

  // Admin authentication check
  const handleAdminVerify = (e) => {
    e.preventDefault()
    if (passwordInput === 'admin123' || passwordInput === 'cbre2026') {
      setIsAdmin(true)
      setPasswordError('')
      showToast({ type: 'success', title: 'Admin Verified', message: 'Ready for Manual Excel Upload.' })
    } else {
      setPasswordError('Invalid admin password. Default demo password is "admin123"')
    }
  }

  // Handle file selection (drag & drop or click)
  const processFile = async (file) => {
    if (!file) return

    // Validate extension
    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
    if (!isExcel) {
      showToast({ type: 'error', title: 'Invalid File', message: 'Please select a valid Excel (.xlsx or .xls) file.' })
      return
    }

    // Validate size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024 // 10MB
    if (file.size > MAX_SIZE) {
      showToast({ type: 'error', title: 'File Too Large', message: 'Maximum file size allowed is 10MB.' })
      return
    }

    setSelectedFile(file)
    setIsProcessing(true)
    setProgressPercent(15)

    try {
      // Progress simulation during read
      await new Promise(r => setTimeout(r, 150))
      setProgressPercent(45)

      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result
          setProgressPercent(75)

          // Parse workbook
          const parsed = parseExcelWorkbook(arrayBuffer)
          setProgressPercent(95)

          // Run column validation against target tracker
          const warnings = []
          const expected = EXPECTED_COLUMNS[selectedTracker] || []
          
          Object.entries(parsed.sheets).forEach(([sheetName, sheetData]) => {
            const sheetColsLower = (sheetData.headers || []).map(h => String(h).toLowerCase().trim())
            const missing = expected.filter(exp => !sheetColsLower.some(sc => sc.includes(exp.toLowerCase().replace('/', ''))))
            
            // Only report warnings for primary sheets or if more than half expected are missing
            if (missing.length > 0 && (sheetName.toLowerCase().includes('tracker') || sheetName.toLowerCase().includes('master'))) {
              warnings.push({
                sheetName,
                missing
              })
            }
          })

          setValidationWarnings(warnings)
          setParsedResult(parsed)
          setProgressPercent(100)
          setIsProcessing(false)
        } catch (err) {
          setIsProcessing(false)
          showToast({ type: 'error', title: 'Parse Error', message: err.message || 'Could not parse Excel file.' })
        }
      }

      reader.readAsArrayBuffer(file)
    } catch (err) {
      setIsProcessing(false)
      showToast({ type: 'error', title: 'Read Error', message: err.message })
    }
  }

  // Handle Drag & Drop
  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file) processFile(file)
  }

  // Handle Confirm Upload
  const handleConfirm = () => {
    if (!parsedResult || !selectedFile) return

    // Calculate total rows across all sheets
    const totalRows = Object.values(parsedResult.sheets).reduce((acc, s) => acc + s.rows.length, 0)
    
    // Call parent handler to update state, Supabase & set 30-min pause
    onApplyManualUpload({
      trackerType: selectedTracker,
      fileName: selectedFile.name,
      fileSize: selectedFile.size,
      parsedResult,
      totalRows,
      uploadedBy: 'Admin'
    })

    // Reset and close
    resetModal()
    onClose()
  }

  const resetModal = () => {
    setSelectedFile(null)
    setParsedResult(null)
    setIsProcessing(false)
    setProgressPercent(0)
    setValidationWarnings([])
    setPasswordInput('')
    setPasswordError('')
  }

  // Compute total rows found in preview
  const totalPreviewRows = parsedResult 
    ? Object.values(parsedResult.sheets).reduce((acc, s) => acc + s.rows.length, 0) 
    : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="bg-[#0B3D91] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-lg">
              <UploadCloud className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <h2 className="text-base font-bold">Manual Excel Upload & Override Sync</h2>
              <p className="text-xs text-blue-100">Directly ingest and update dashboard records</p>
            </div>
          </div>
          <button
            onClick={() => { resetModal(); onClose(); }}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          
          {/* STEP 0: Admin Password Gate if not logged in */}
          {!isAdmin ? (
            <div className="max-w-md mx-auto py-4 text-center">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-amber-200">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">Administrator Authorization Required</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Manual Excel upload overrides live data. Please confirm admin password (<code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-blue-700">admin123</code>).
              </p>

              {passwordError && (
                <div className="mb-4 p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                  {passwordError}
                </div>
              )}

              <form onSubmit={handleAdminVerify} className="space-y-3">
                <input
                  type="password"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Enter admin password..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#1F4E79]"
                  autoFocus
                />
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#1F4E79] hover:bg-[#143857] text-white font-bold rounded-lg shadow transition-all text-xs"
                >
                  Verify Admin Access
                </button>
              </form>
            </div>
          ) : (
            /* STEP 1: Tracker Selection & Upload UI */
            <div className="space-y-4">
              
              {/* Tracker Selector Row */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Which tracker file are you uploading?
                  </label>
                  <select
                    value={selectedTracker}
                    onChange={(e) => {
                      setSelectedTracker(e.target.value)
                      setSelectedFile(null)
                      setParsedResult(null)
                      setValidationWarnings([])
                    }}
                    className="w-full sm:w-80 bg-white border border-slate-300 rounded px-2.5 py-1.5 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-[#1F4E79]"
                  >
                    <option value="helpdesk">Helpdesk Tracker (HELP DESK TRACKER FY 25-26 - Master)</option>
                    <option value="event">Event Tracker (Yearly Event Tracker - DT-3 & DT-4)</option>
                  </select>
                </div>

                {/* Download Template Button */}
                <button
                  type="button"
                  onClick={() => downloadTrackerTemplate(selectedTracker)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded font-medium text-xs shadow-sm transition-all self-start sm:self-end"
                  title="Download blank template in exact Excel format"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span>Download Current Excel Template</span>
                </button>
              </div>

              {/* Drag & Drop File Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? 'border-[#1F4E79] bg-blue-50/60'
                    : 'border-slate-300 hover:border-slate-400 bg-slate-50/40 hover:bg-slate-50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) processFile(f)
                  }}
                />
                
                <div className="w-12 h-12 bg-blue-100 text-[#1F4E79] rounded-full flex items-center justify-center mx-auto mb-2 shadow-inner">
                  <FileSpreadsheet className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Drag & Drop Excel File Here, or <span className="text-blue-600 underline">Browse from Laptop</span>
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports multi-sheet <strong>.xlsx</strong> and <strong>.xls</strong> up to 10MB
                </p>
              </div>

              {/* Progress Bar during parsing */}
              {isProcessing && (
                <div className="space-y-1.5 p-3 bg-blue-50/50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between text-[11px] text-blue-900 font-semibold">
                    <span>Reading & parsing workbook sheets...</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-[#1F4E79] h-full transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Column Validation Warnings (if any) */}
              {validationWarnings.length > 0 && (
                <div className="p-3.5 bg-amber-50 rounded-lg border border-amber-300 text-amber-900 space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Column Structure Notice:</span>
                  </div>
                  {validationWarnings.map((warn, i) => (
                    <p key={i} className="text-[11px] leading-relaxed text-amber-800 pl-6">
                      • Column mismatch found in Sheet <strong>"{warn.sheetName}"</strong>. Missing expected: 
                      <span className="font-mono text-[10px] ml-1 bg-amber-100 px-1 py-0.5 rounded">
                        {warn.missing.join(', ')}
                      </span>
                    </p>
                  ))}
                  <p className="text-[11px] text-amber-700 italic pl-6 pt-0.5">
                    You can still proceed with <strong>"Upload Anyway"</strong> below. All present columns will be preserved exactly.
                  </p>
                </div>
              )}

              {/* PREVIEW CARD (When file parsed successfully) */}
              {parsedResult && selectedFile && (
                <div className="bg-emerald-50/60 rounded-lg border border-emerald-300 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">
                          {selectedFile.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Target: {selectedTracker === 'helpdesk' ? 'Helpdesk Tracker' : 'Event Tracker'}
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      {totalPreviewRows.toLocaleString()} Total Rows
                    </span>
                  </div>

                  {/* Sheets Breakdown Grid */}
                  <div className="pt-2 border-t border-emerald-200">
                    <span className="text-[11px] font-semibold text-slate-700 block mb-1.5">
                      Sheets Found ({parsedResult.sheetNames.length}):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {parsedResult.sheetNames.map((sname) => {
                        const sData = parsedResult.sheets[sname]
                        return (
                          <div
                            key={sname}
                            className="bg-white p-2 rounded border border-emerald-200 text-[11px] flex flex-col justify-between"
                          >
                            <span className="font-semibold text-slate-800 truncate" title={sname}>
                              {sname}
                            </span>
                            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                              <span>{sData?.rows?.length?.toLocaleString() || 0} rows</span>
                              <span>{sData?.headers?.length || 0} cols</span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Priority and Scope Notice */}
                  <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded border border-emerald-200">
                    ℹ️ <strong>Sync Priority:</strong> Confirming will overwrite <strong>{selectedTracker === 'helpdesk' ? 'Helpdesk' : 'Event'}</strong> data immediately, while preserving the other tracker untouched. OneDrive auto-sync for this file will pause for <strong>30 minutes</strong> to ensure your manual data is not overwritten.
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => { resetModal(); onClose(); }}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs rounded font-semibold transition-colors"
          >
            Cancel
          </button>

          {isAdmin && parsedResult && (
            <button
              onClick={handleConfirm}
              className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs rounded-lg font-bold shadow-md transition-all active:scale-95"
            >
              <span>{validationWarnings.length > 0 ? 'Upload Anyway & Confirm' : 'Confirm & Apply to Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
