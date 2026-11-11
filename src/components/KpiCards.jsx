// ==============================================================================
// TABLEAU KPI CARDS COMPONENT (100% English)
// ==============================================================================
import React from 'react'
import { Ticket, AlertCircle, Clock, CheckCircle2, AlertOctagon, Calendar, Sparkles } from 'lucide-react'

export function KpiCards({ kpis }) {
  const cards = [
    {
      id: 'total_tickets',
      title: 'Total Tickets',
      value: kpis.totalTickets.toLocaleString(),
      subtext: `${kpis.resolvedRate}% Resolution Rate`,
      icon: <Ticket className="w-5 h-5 text-blue-600" />,
      borderColor: 'border-l-blue-600',
      badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
      textColor: 'text-blue-950'
    },
    {
      id: 'open_tickets',
      title: 'Open / Unassigned',
      value: kpis.openTickets.toLocaleString(),
      subtext: 'Awaiting Action',
      icon: <AlertCircle className="w-5 h-5 text-amber-600" />,
      borderColor: 'border-l-amber-500',
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
      textColor: 'text-amber-950'
    },
    {
      id: 'in_progress',
      title: 'In-Progress (WIP)',
      value: kpis.wipTickets.toLocaleString(),
      subtext: 'Technicians Assigned',
      icon: <Clock className="w-5 h-5 text-sky-600" />,
      borderColor: 'border-l-sky-500',
      badgeColor: 'bg-sky-50 text-sky-800 border-sky-200',
      textColor: 'text-sky-950'
    },
    {
      id: 'closed_tickets',
      title: 'Closed / Resolved',
      value: kpis.resolvedTickets.toLocaleString(),
      subtext: 'Successfully Completed',
      icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
      borderColor: 'border-l-emerald-600',
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      textColor: 'text-emerald-950'
    },
    {
      id: 'overdue_tickets',
      title: 'Overdue / Beyond TAT',
      value: kpis.overdueTickets.toLocaleString(),
      subtext: 'Escalation Required',
      icon: <AlertOctagon className="w-5 h-5 text-rose-600" />,
      borderColor: 'border-l-rose-500',
      badgeColor: 'bg-rose-50 text-rose-800 border-rose-200',
      textColor: 'text-rose-950'
    },
    {
      id: 'today_events',
      title: "Today's Events",
      value: kpis.todayEvents.toLocaleString(),
      subtext: 'DT-3 & DT-4 Active',
      icon: <Calendar className="w-5 h-5 text-indigo-600" />,
      borderColor: 'border-l-indigo-500',
      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
      textColor: 'text-indigo-950'
    },
    {
      id: 'total_events',
      title: 'Total Events',
      value: kpis.totalEvents.toLocaleString(),
      subtext: `${kpis.totalPax.toLocaleString()} Total Pax`,
      icon: <Sparkles className="w-5 h-5 text-purple-600" />,
      borderColor: 'border-l-purple-600',
      badgeColor: 'bg-purple-50 text-purple-800 border-purple-200',
      textColor: 'text-purple-950'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((card) => (
        <div
          key={card.id}
          className={`bg-white rounded-lg border border-slate-200/80 p-3.5 shadow-sm hover:shadow-md transition-shadow border-l-4 ${card.borderColor} flex flex-col justify-between`}
        >
          <div className="flex items-start justify-between gap-1 mb-1.5">
            <h3 className="text-xs font-bold text-slate-700 leading-tight">
              {card.title}
            </h3>
            <div className="p-1 rounded-md bg-slate-50 flex-shrink-0">
              {card.icon}
            </div>
          </div>

          <div className="my-1">
            <span className={`text-2xl font-extrabold tracking-tight ${card.textColor}`}>
              {card.value}
            </span>
          </div>

          <div className="mt-1">
            <span className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded border ${card.badgeColor}`}>
              {card.subtext}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
