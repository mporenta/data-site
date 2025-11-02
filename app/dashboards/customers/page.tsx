'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from '@/lib/recharts'
import KPICard from '@/components/KPICard'
import ChartCard from '@/components/ChartCard'

interface ChurnData {
  month: string
  total_customers: number
  churned_customers: number
  churn_rate: number
  retention_rate: number
  ltv: number
  avg_tenure_months: number
}

const COLORS = ['#3C50E0', '#10B981', '#FFBA00', '#DC3545', '#80CAEE']

export default function CustomersDashboard() {
  const [data, setData] = useState<ChurnData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/bi/query?report_id=customer-churn', {
        cache: 'no-store'
      })
      const result = await response.json()
      setData(result.data.rows)
    } catch (error) {
      console.error('Error fetching customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-black dark:text-white">Loading customer data...</div>
      </div>
    )
  }

  const latest = data[data.length - 1]
  const avgChurn = data.reduce((sum, d) => sum + d.churn_rate, 0) / data.length

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Customer Analytics
        </h2>
        <p className="text-sm text-body dark:text-bodydark">
          Track customer retention, churn, and lifetime value
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
        <KPICard
          title="Total Customers"
          value={latest.total_customers}
          change={4.8}
          trend="up"
          format="number"
        />
        <KPICard
          title="Retention Rate"
          value={latest.retention_rate}
          change={0.5}
          trend="up"
          format="percent"
        />
        <KPICard
          title="Churn Rate"
          value={latest.churn_rate}
          change={-13.4}
          trend="up"
          format="percent"
        />
        <KPICard
          title="Customer LTV"
          value={latest.ltv}
          change={1.5}
          trend="up"
          format="currency"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-4 md:mb-6">
        {/* Churn Rate Trend */}
        <ChartCard title="Churn Rate Trend" subtitle="Monthly churn percentage">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="month"
                tick={{ fill: '#64748B' }}
              />
              <YAxis
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: any) => [`${value.toFixed(2)}%`, 'Churn Rate']}
              />
              <Line
                type="monotone"
                dataKey="churn_rate"
                stroke="#DC3545"
                strokeWidth={3}
                dot={{ fill: '#DC3545', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Customer Growth */}
        <ChartCard title="Total Customer Growth" subtitle="Customer base over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorCustomers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area
                type="monotone"
                dataKey="total_customers"
                stroke="#10B981"
                fillOpacity={1}
                fill="url(#colorCustomers)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Retention & LTV */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
        {/* Retention Rate */}
        <ChartCard title="Retention Rate" subtitle="Customer retention over time">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorRetention" x1="0" y1="0" x2="0" y2="1">
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
                domain={[95, 100]}
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
                formatter={(value: any) => [`${value.toFixed(2)}%`, 'Retention']}
              />
              <Area
                type="monotone"
                dataKey="retention_rate"
                stroke="#3C50E0"
                fillOpacity={1}
                fill="url(#colorRetention)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Customer LTV */}
        <ChartCard title="Customer Lifetime Value" subtitle="Average LTV trend">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'LTV']}
              />
              <Line
                type="monotone"
                dataKey="ltv"
                stroke="#80CAEE"
                strokeWidth={3}
                dot={{ fill: '#80CAEE', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}
