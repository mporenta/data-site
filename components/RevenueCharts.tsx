'use client'

import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from '@/lib/recharts'
import KPICard from '@/components/KPICard'
import ChartCard from '@/components/ChartCard'

interface RevenueData {
  month: string
  total_revenue: number
  mrr: number
  arr: number
  unique_customers: number
  new_customers: number
  revenue_growth: number
}

interface RevenueChartsProps {
  data: RevenueData[]
}

export default function RevenueCharts({ data }: RevenueChartsProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-black dark:text-white">No revenue data available</div>
      </div>
    )
  }

  const latest = data[data.length - 1]
  const previous = data[data.length - 2]

  const revenueChange = previous
    ? ((latest.total_revenue - previous.total_revenue) / previous.total_revenue) * 100
    : 0

  const customerChange = previous
    ? ((latest.unique_customers - previous.unique_customers) / previous.unique_customers) * 100
    : 0

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Revenue Analytics
        </h2>
        <p className="text-sm text-body dark:text-bodydark">
          Track revenue performance and growth trends
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
        <KPICard
          title="Annual Recurring Revenue"
          value={latest.arr}
          change={latest.revenue_growth * 100}
          trend="up"
          format="currency"
        />
        <KPICard
          title="Monthly Revenue"
          value={latest.total_revenue}
          change={revenueChange}
          trend={revenueChange > 0 ? 'up' : 'down'}
          format="currency"
        />
        <KPICard
          title="Total Customers"
          value={latest.unique_customers}
          change={customerChange}
          trend="up"
          format="number"
        />
        <KPICard
          title="New Customers"
          value={latest.new_customers}
          subtitle="This month"
          format="number"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-4 md:mb-6">
        {/* Revenue Trend */}
        <ChartCard title="Revenue Trend" subtitle="Monthly revenue performance">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3C50E0" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3C50E0" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748B' }}
              />
              <YAxis
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area
                type="monotone"
                dataKey="total_revenue"
                stroke="#3C50E0"
                fillOpacity={1}
                fill="url(#colorRevenue)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* ARR Growth */}
        <ChartCard title="ARR Growth" subtitle="Annual recurring revenue trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748B' }}
              />
              <YAxis
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'ARR']}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="arr"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Customer & MRR Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
        {/* Customer Growth */}
        <ChartCard title="Customer Growth" subtitle="New customers by month">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748B' }}
              />
              <YAxis
                tick={{ fill: '#64748B' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
              />
              <Legend />
              <Bar dataKey="new_customers" fill="#80CAEE" name="New Customers" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* MRR Trend */}
        <ChartCard title="Monthly Recurring Revenue" subtitle="MRR performance over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFBA00" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FFBA00" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748B' }}
              />
              <YAxis
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'MRR']}
              />
              <Area
                type="monotone"
                dataKey="mrr"
                stroke="#FFBA00"
                fillOpacity={1}
                fill="url(#colorMRR)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}
