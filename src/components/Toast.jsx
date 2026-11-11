// ==============================================================================
// TOAST NOTIFICATION COMPONENT
// ==============================================================================
import React from 'react'
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react'

export function Toast({ toast, onClose }) {
  if (!toast) return null

  const icons = {
    success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />,
    error: <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />,
    info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
  }

  const bgStyles = {
    success: 'border-emerald-200 bg-white shadow-lg text-slate-800',
    warning: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-rose-200 bg-rose-50 text-rose-900',
    info: 'border-blue-200 bg-blue-50 text-blue-900'
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md animate-fade-in-up transition-all">
      <div className={`flex items-start gap-3 p-4 rounded-lg border shadow-xl ${bgStyles[toast.type || 'info']}`}>
        {icons[toast.type || 'info']}
        <div className="flex-1 pr-2">
          {toast.title && <p className="font-semibold text-sm leading-tight mb-1">{toast.title}</p>}
          <p className="text-xs leading-normal">{toast.message}</p>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors p-1"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
