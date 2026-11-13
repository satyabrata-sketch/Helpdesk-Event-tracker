// ==============================================================================
// TOP HEADER COMPONENT (Colourful CBRE Gradient Theme - 100% English)
// Fixed/Sticky at top with:
// Line 1: Top Bar (Glass Gradient, Poppins 700 Title + Pulsing Live Dot + Sync Live)
// Line 2: 6 Vibrant CBRE Gradient Small KPI Boxes
// Line 3: 3 Navigation Tabs (Overview / Helpdesk / Event)
// ==============================================================================
import React from 'react'
import { RefreshCw, LayoutDashboard, Headphones, CalendarDays, ShieldCheck } from 'lucide-react'

export function Header({
  activeTab = 'helpdesk',
  onSelectTab,
  isSyncing,
  onSyncNow,
  onOpenAdmin,
  totalTickets = 1131,
  reactiveAllCount = 527,
  proactiveAllCount = 604,
  resolvedAllCount = 1129,
  openWipAllCount = 2,
  filteredTickets = 487,
  eventSummary = {
    total: 2093,
    workshops: 991,
    training: 245,
    resolved: 1392,
    openWip: 569
  },
  filteredEventCount = 2093,
  lastSyncedAt
}) {
  const syncedTimeDisplay = React.useMemo(() => {
    if (!lastSyncedAt) {
      const now = new Date()
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    const d = new Date(lastSyncedAt)
    if (isNaN(d.getTime())) {
      const now = new Date()
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    }
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }, [lastSyncedAt])

  const mainAppTitle = 'Facility Operations Dashboard | CBRE Facilities • Downtown-3 & Downtown-4'
  const isEvent = activeTab === 'events' || activeTab === 'event_tracker'

  const boxes = React.useMemo(() => {
    if (isEvent) {
      const totalEv = eventSummary?.total || 2093
      const filteredEv = filteredEventCount ?? totalEv
      return [
        {
          label: 'TOTAL',
          value: totalEv.toLocaleString(),
          icon: '📊',
          bgGradient: 'bg-gradient-to-r from-[#003231] to-[#005A3C] border-[#004D2A] text-white',
          labelColor: 'text-emerald-200',
          valueColor: 'text-white'
        },
        {
          label: 'WORKSHOPS',
          value: (eventSummary?.workshops || 991).toLocaleString(),
          icon: '🎪',
          bgGradient: 'bg-gradient-to-r from-[#00796B] to-[#00A19A] border-[#00695C] text-white',
          labelColor: 'text-teal-100',
          valueColor: 'text-white'
        },
        {
          label: 'TRAINING',
          value: (eventSummary?.training || 245).toLocaleString(),
          icon: '🎓',
          bgGradient: 'bg-gradient-to-r from-[#00A651] to-[#00C853] border-[#008f45] text-white',
          labelColor: 'text-emerald-100',
          valueColor: 'text-white'
        },
        {
          label: 'RESOLVED',
          value: (eventSummary?.resolved || 1392).toLocaleString(),
          icon: '✔️',
          bgGradient: 'bg-gradient-to-r from-[#7CB342] to-[#AED581] border-[#689F38] text-[#003231]',
          labelColor: 'text-[#003231]/80',
          valueColor: 'text-[#003231]'
        },
        {
          label: 'OPEN / WIP',
          value: (eventSummary?.openWip || 569).toLocaleString(),
          icon: '⏳',
          bgGradient: 'bg-gradient-to-r from-[#FF6A13] to-[#FF9E2C] border-[#E65100] text-white',
          labelColor: 'text-orange-100',
          valueColor: 'text-white'
        },
        {
          label: 'FILTERED',
          value: filteredEv.toLocaleString(),
          sub: `(of ${totalEv.toLocaleString()})`,
          icon: '🔍',
          bgGradient: 'bg-gradient-to-r from-[#FFC72C] to-[#FFE082] border-[#F57F17] text-[#003231]',
          labelColor: 'text-amber-950',
          valueColor: 'text-[#003231]',
          subColor: 'text-amber-900',
          isFilteredBox: true
        }
      ]
    }

    return [
      {
        label: 'TOTAL',
        value: totalTickets.toLocaleString(),
        icon: '📊',
        bgGradient: 'bg-gradient-to-r from-[#003231] to-[#005A3C] border-[#004D2A] text-white',
        labelColor: 'text-emerald-200',
        valueColor: 'text-white'
      },
      {
        label: 'REACTIVE',
        value: reactiveAllCount.toLocaleString(),
        icon: '🔧',
        bgGradient: 'bg-gradient-to-r from-[#00796B] to-[#00A19A] border-[#00695C] text-white',
        labelColor: 'text-teal-100',
        valueColor: 'text-white'
      },
      {
        label: 'PROACTIVE',
        value: proactiveAllCount.toLocaleString(),
        icon: '✅',
        bgGradient: 'bg-gradient-to-r from-[#00A651] to-[#00C853] border-[#008f45] text-white',
        labelColor: 'text-emerald-100',
        valueColor: 'text-white'
      },
      {
        label: 'RESOLVED',
        value: resolvedAllCount.toLocaleString(),
        icon: '✔️',
        bgGradient: 'bg-gradient-to-r from-[#7CB342] to-[#AED581] border-[#689F38] text-[#003231]',
        labelColor: 'text-[#003231]/80',
        valueColor: 'text-[#003231]'
      },
      {
        label: 'OPEN / WIP',
        value: openWipAllCount.toLocaleString(),
        icon: '⏳',
        bgGradient: 'bg-gradient-to-r from-[#FF6A13] to-[#FF9E2C] border-[#E65100] text-white',
        labelColor: 'text-orange-100',
        valueColor: 'text-white'
      },
      {
        label: 'FILTERED',
        value: filteredTickets.toLocaleString(),
        sub: `(of ${totalTickets.toLocaleString()})`,
        icon: '🔍',
        bgGradient: 'bg-gradient-to-r from-[#FFC72C] to-[#FFE082] border-[#F57F17] text-[#003231]',
        labelColor: 'text-amber-950',
        valueColor: 'text-[#003231]',
        subColor: 'text-amber-900',
        isFilteredBox: true
      }
    ]
  }, [
    isEvent,
    eventSummary,
    filteredEventCount,
    totalTickets,
    reactiveAllCount,
    proactiveAllCount,
    resolvedAllCount,
    openWipAllCount,
    filteredTickets
  ])

  return (
    <header className="sticky top-0 z-50 shadow-lg border-b border-[#002524]">
      {/* LINE 1: Clean Top Bar with Glass Gradient (Height ~48px) */}
      <div className="w-full bg-gradient-to-r from-[#003231] via-[#004D2A] to-[#00695C] border-b border-white/10">
        <div className="w-full max-w-[1680px] mx-auto px-3 sm:px-4">
          <div className="flex items-center justify-between h-[48px] gap-4">
            
            {/* Left: Single Fixed Title across all tabs */}
            <div className="flex items-center gap-3 shrink-0 min-w-0">
              <h1 className="font-poppins font-bold text-[15px] sm:text-[17px] tracking-tight text-white whitespace-nowrap drop-shadow-xs truncate">
                {mainAppTitle}
              </h1>
            </div>

            {/* Right: [Admin] [Sync Live] [Synced Time] - strictly no wrap at 1366px */}
            <div className="flex items-center gap-2.5 shrink-0 flex-nowrap">
              {/* Admin Button */}
              <button
                onClick={onOpenAdmin}
                className="h-[30px] px-3 rounded-[6px] bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md whitespace-nowrap border border-white/20 cursor-pointer"
                title="Admin Control Panel"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Admin</span>
              </button>

              {/* Sync Live Button */}
              <button
                onClick={onSyncNow}
                disabled={isSyncing}
                className="h-[30px] px-3 rounded-[6px] bg-[#00A651] hover:bg-[#008f45] active:scale-95 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-md disabled:opacity-75 disabled:cursor-not-allowed whitespace-nowrap border border-white/10 cursor-pointer"
                title="Sync latest live records"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Live'}</span>
              </button>

              {/* Synced Time Badge */}
              <div className="flex items-center gap-1.5 text-[11px] text-[#C8E6C9] font-medium whitespace-nowrap bg-black/25 px-2.5 py-1 rounded-full border border-white/10">
                <span className="w-2 h-2 rounded-full bg-[#00A651] inline-block shrink-0 animate-pulse shadow-[0_0_8px_#00A651]"></span>
                <span>Last Auto-Synced: {syncedTimeDisplay} • Live</span>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* LINE 2: NAVIGATION TABS ROW (Sticky with Header) */}
      <div className="bg-[#002221] px-3 sm:px-4">
        <div className="max-w-[1680px] mx-auto flex items-center justify-between">
          <nav className="flex space-x-1 sm:space-x-2 h-[34px]">
            <button
              onClick={() => onSelectTab && onSelectTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-semibold border-b-[3px] transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'border-[#00A651] text-emerald-300 bg-white/10'
                  : 'border-transparent text-[#A3B899] hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('helpdesk')}
              className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-semibold border-b-[3px] transition-all cursor-pointer ${
                activeTab === 'helpdesk'
                  ? 'border-[#0284C7] text-cyan-300 bg-white/10'
                  : 'border-transparent text-[#A3B899] hover:text-white hover:bg-white/5'
              }`}
            >
              <Headphones className="w-3.5 h-3.5" />
              <span>Helpdesk</span>
            </button>

            <button
              onClick={() => onSelectTab && onSelectTab('events')}
              className={`flex items-center gap-1.5 px-3.5 h-full text-xs font-semibold border-b-[3px] transition-all cursor-pointer ${
                activeTab === 'events' || activeTab === 'event' || activeTab === 'event_tracker'
                  ? 'border-[#EA580C] text-orange-300 bg-white/10'
                  : 'border-transparent text-[#A3B899] hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Event</span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
