// ==============================================================================
// ACCESS REVOKED / SYNC FAILED WARNING BANNER
// Displays when File 2 (Helpdesk Tracker) access is revoked or OneDrive sync fails
// Provides direct "Upload Excel Manually" button to update dashboard immediately
// ==============================================================================
import React from 'react'
import { AlertTriangle, Mail, RefreshCw, X, ShieldAlert, UploadCloud } from 'lucide-react'

export function AccessRevokedBanner({
  onRetry,
  onDismiss,
  onUploadManually,
  ownerEmail = 'alwajid_ansari@cbre.com',
  customMessage = null
}) {
  return (
    <div className="bg-amber-500/10 border-b border-amber-300 text-amber-950 px-4 py-3 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs md:text-sm">
        
        {/* Warning Icon and Message */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-1.5 bg-amber-500 text-white rounded-md flex-shrink-0 shadow-sm">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-900 tracking-tight text-sm md:text-base">
                {customMessage ? '⚠️ ' + customMessage : '⚠️ OneDrive Sync Failed - Please Upload Excel Manually to Update'}
              </span>
              <span className="bg-amber-200 text-amber-900 font-semibold text-[10px] uppercase px-2 py-0.5 rounded-full">
                File 1 Operational
              </span>
            </div>
            <p className="text-amber-800 text-xs mt-0.5">
              File 2 access was revoked by owner (<span className="font-semibold">{ownerEmail}</span>). 
              You can manually upload the latest Excel file to refresh all data. <strong>File 1 (Event Tracker) dashboard continues operating with live updates.</strong>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          
          {/* Prominent Upload Excel Manually Button */}
          {onUploadManually && (
            <button
              onClick={onUploadManually}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
              title="Upload latest Excel file manually to override"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Upload Excel Manually</span>
            </button>
          )}

          <a
            href={`mailto:${ownerEmail}?subject=OneDrive%20Access%20Request%20-%20Helpdesk%20Tracker&body=Hi%20Alwajid,%20Please%20verify%20read/edit%20permissions%20for%20the%20Helpdesk%20Tracker%20Excel%20file.`}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs shadow-sm transition-all"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email Owner</span>
          </a>

          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 font-medium text-xs shadow-sm transition-all"
            title="Retry connecting to File 2"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Connection</span>
          </button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="p-1.5 text-amber-700 hover:text-amber-950 transition-colors rounded-md"
              title="Dismiss warning"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  )
}
