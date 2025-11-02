'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from '@/lib/recharts'
import KPICard from '@/components/KPICard'
import ChartCard from '@/components/ChartCard'

interface OperationsData {
  date: string
  routes_completed: number
  avg_quality: number
  total_hours: number
  technicians_active: number
  customer_satisfaction: number
  on_time_completion: number
}

export default function OperationsDashboard() {
  const [data, setData] = useState<OperationsData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await fetch('/api/bi/query?report_id=field-ops', {
        cache: 'no-store'
      })
      const result = await response.json()
      setData(result.data.rows)
    } catch (error) {
      console.error('Error fetching operations data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-black dark:text-white">Loading operations data...</div>
      </div>
    )
  }

  const latest = data[data.length - 1]
  const avgRoutes = data.reduce((sum, d) => sum + d.routes_completed, 0) / data.length
  const avgQuality = data.reduce((sum, d) => sum + d.avg_quality, 0) / data.length

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Field Operations
        </h2>
        <p className="text-sm text-body dark:text-bodydark">
          Monitor field performance and operational efficiency
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
        <KPICard
          title="Routes Completed Today"
          value={latest.routes_completed}
          change={5.1}
          trend="up"
          format="number"
        />
        <KPICard
          title="Quality Score"
          value={latest.avg_quality}
          subtitle="Out of 5.0"
          change={4.4}
          trend="up"
        />
        <KPICard
          title="Customer Satisfaction"
          value={latest.customer_satisfaction}
          change={3.2}
          trend="up"
          format="percent"
        />
        <KPICard
          title="On-Time Completion"
          value={latest.on_time_completion}
          change={6.7}
          trend="up"
          format="percent"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5 mb-4 md:mb-6">
        {/* Daily Routes Completed */}
        <ChartCard title="Daily Routes Completed" subtitle="Routes completed per day">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => value.split('-')[2]}
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
              <Bar dataKey="routes_completed" fill="#3C50E0" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Quality Score Trend */}
        <ChartCard title="Quality Score Trend" subtitle="Average quality over time">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => value.split('-')[2]}
              />
              <YAxis
                domain={[3.5, 5]}
                tick={{ fill: '#64748B' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #E2E8F0',
                  borderRadius: '0.375rem',
                }}
              />
              <Line
                type="monotone"
                dataKey="avg_quality"
                stroke="#10B981"
                strokeWidth={3}
                dot={{ fill: '#10B981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Technician Hours & Performance Metrics */}
      <div className="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2 2xl:gap-7.5">
        {/* Technician Hours */}
        <ChartCard title="Total Technician Hours" subtitle="Work hours per day">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-stroke dark:stroke-strokedark" />
              <XAxis
                dataKey="date"
                tick={{ fill: '#64748B' }}
                tickFormatter={(value) => value.split('-')[2]}
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
              <Bar dataKey="total_hours" fill="#FFBA00" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Performance Overview */}
        <ChartCard title="Latest Performance Metrics" subtitle="Current performance snapshot">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={[
              { metric: 'Quality', value: latest.avg_quality * 20 },
              { metric: 'Routes', value: (latest.routes_completed / 200) * 100 },
              { metric: 'Satisfaction', value: latest.customer_satisfaction },
              { metric: 'On-Time', value: latest.on_time_completion },
              { metric: 'Efficiency', value: 92 },
            ]}>
              <PolarGrid className="stroke-stroke dark:stroke-strokedark" />
              <PolarAngleAxis dataKey="metric" tick={{ fill: '#64748B' }} />
              <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#64748B' }} />
              <Radar
                name="Performance"
                dataKey="value"
                stroke="#80CAEE"
                fill="#80CAEE"
                fillOpacity={0.6}
              />
            </RadarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </>
  )
}
