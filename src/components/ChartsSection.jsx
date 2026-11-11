// ==============================================================================
// TABLEAU-STYLE CHARTS SECTION (100% English)
// ==============================================================================
import React from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  CartesianGrid,
  Legend
} from 'recharts'
import { Building, PieChart as PieIcon, TrendingUp, CheckCircle, Users, Calendar } from 'lucide-react'

// Tableau Color Palette
const COLORS = [
  '#0B3D91', '#2F75B5', '#10B981', '#F59E0B', '#EF4444', 
  '#8B5CF6', '#06B6D4', '#EC4899', '#64748B'
]

// Custom Clean Tableau Tooltip
const TableauTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-2.5 rounded shadow-lg border border-slate-200 text-xs text-slate-800">
        <p className="font-bold text-slate-900 mb-1">{label || payload[0].name}</p>
        {payload.map((entry, idx) => (
          <p key={idx} className="flex items-center gap-2" style={{ color: entry.color || '#0B3D91' }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color || '#0B3D91' }}></span>
            <span className="font-medium">{entry.name || 'Value'}:</span>
            <span className="font-bold">{Number(entry.value).toLocaleString()}</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function ChartsSection({
  siteData,
  categoryData,
  trendData,
  statusData,
  technicianData,
  eventBuildingData
}) {
  return (
    <div className="space-y-6 mb-8">
      
      {/* ROW 1: Site-wise Bar Chart & Category-wise Pie Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* a) Bar Chart - Site-wise Tickets */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0B3D91]" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Site-wise Ticket Volume</h3>
                <p className="text-[11px] text-slate-500">Volume across Downtown-3 and Downtown-4 floors</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              {siteData.reduce((acc, s) => acc + s.tickets, 0)} Total
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={siteData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis 
                  dataKey="site" 
                  tick={{ fontSize: 11, fill: '#64748B' }} 
                  interval={0}
                  angle={-15}
                  textAnchor="end"
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<TableauTooltip />} />
                <Bar 
                  dataKey="tickets" 
                  name="Tickets" 
                  fill="#0B3D91" 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* b) Pie / Donut Chart - Category-wise */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-[#2F75B5]" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Category-wise Distribution</h3>
                <p className="text-[11px] text-slate-500">Service request breakdown by discipline</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Top Categories
            </span>
          </div>
          <div className="h-[250px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<TableauTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
                />
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 2: Daily Trend & Status-wise */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* c) Line / Area Chart - Daily Trend */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Daily Activity Trend (Last 30 Days)</h3>
                <p className="text-[11px] text-slate-500">New Tickets vs Resolved daily volume</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              30-Day Velocity
            </span>
          </div>
          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 15, left: -10, bottom: 15 }}>
                <defs>
                  <linearGradient id="colorTickets" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2F75B5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#2F75B5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#64748B' }} 
                  interval={Math.ceil(trendData.length / 8)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<TableauTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Area 
                  type="monotone" 
                  dataKey="tickets" 
                  name="Total Logged" 
                  stroke="#2F75B5" 
                  fillOpacity={1} 
                  fill="url(#colorTickets)" 
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="resolved" 
                  name="Resolved" 
                  stroke="#10B981" 
                  fillOpacity={1} 
                  fill="url(#colorResolved)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* d) Donut Chart - Status-wise */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Status-wise Breakdown</h3>
                <p className="text-[11px] text-slate-500">Resolved, Work In Progress, and Open</p>
              </div>
            </div>
          </div>
          <div className="h-[260px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Tooltip content={<TableauTooltip />} />
                <Legend 
                  layout="horizontal" 
                  verticalAlign="bottom" 
                  align="center"
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                >
                  {statusData.map((entry, index) => {
                    let color = COLORS[index % COLORS.length]
                    if (entry.name.includes('Resolved') || entry.name.includes('Confirmed')) color = '#10B981'
                    else if (entry.name.includes('Progress') || entry.name.includes('WIP') || entry.name.includes('Pending')) color = '#F59E0B'
                    else if (entry.name.includes('Not') || entry.name.includes('Canceled') || entry.name.includes('Overdue')) color = '#EF4444'
                    return <Cell key={`status-${index}`} fill={color} />
                  })}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* ROW 3: Technician Workload & Event Capacity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* e) Bar Chart - Technician Workload */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#0B3D91]" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Technician / Assigned Workload</h3>
                <p className="text-[11px] text-slate-500">Tickets handled by assigned team personnel</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
              Top Contributors
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                layout="vertical"
                data={technicianData}
                margin={{ top: 5, right: 20, left: 25, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} allowDecimals={false} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  tick={{ fontSize: 11, fill: '#334155' }} 
                  width={90}
                />
                <Tooltip content={<TableauTooltip />} />
                <Bar 
                  dataKey="count" 
                  name="Tickets Handled" 
                  fill="#2F75B5" 
                  radius={[0, 4, 4, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* f) Event Operations Distribution */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-800">Event Operations Distribution</h3>
                <p className="text-[11px] text-slate-500">Downtown-3 vs Downtown-4 event count</p>
              </div>
            </div>
            <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Campus Events
            </span>
          </div>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={eventBuildingData} margin={{ top: 10, right: 10, left: -10, bottom: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="building" tick={{ fontSize: 11, fill: '#64748B' }} />
                <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                <Tooltip content={<TableauTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} />
                <Bar dataKey="events" name="Total Events" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="confirmed" name="Confirmed Done" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  )
}
