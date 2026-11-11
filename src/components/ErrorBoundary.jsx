// ==============================================================================
// ERROR BOUNDARY COMPONENT (Tableau Clean Style - 100% English)
// Catches unexpected runtime crashes and renders a clean recovery banner
// ==============================================================================
import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-white rounded-lg border-2 border-rose-300 p-6 my-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-rose-100 rounded-lg text-rose-700 flex-shrink-0">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-slate-900">
                {this.props.title || 'Component Display Error'}
              </h3>
              <p className="text-xs text-slate-600 mt-1">
                An unexpected display issue occurred in this section. All data remains secure and accessible.
              </p>
              {this.state.error && (
                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded text-xs font-mono text-rose-800 break-all">
                  {String(this.state.error.message || this.state.error)}
                </div>
              )}
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  onClick={this.handleReset}
                  className="px-4 py-2 bg-[#0B3D91] hover:bg-blue-900 text-white text-xs font-bold rounded shadow-sm flex items-center gap-2 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Try Reloading Section</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded transition-colors"
                >
                  Refresh Page
                </button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
