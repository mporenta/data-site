import KPICard from '@/components/KPICard'
import { fetchFromApi } from '@/lib/api'
import type { QueryResponse } from '@/types/api'

// Force dynamic rendering - don't prerender at build time
// This page requires real-time data and is behind Okta auth
export const dynamic = 'force-dynamic'

type KPIData = QueryResponse['data']['rows'][number]

// Helper functions
function getKPI(kpis: KPIData[], metric: string) {
  return kpis.find(k => k.metric === metric)
}

function getTrend(changePercent: number): 'up' | 'down' | 'neutral' {
  if (changePercent > 0) return 'up'
  if (changePercent < 0) return 'down'
  return 'neutral'
}

// Server Component - data fetching happens on the server
export default async function Home() {
  // Fetch KPI data on the server
  const result = await fetchFromApi<QueryResponse>('/api/bi/query?report_id=kpi-summary')
  const kpis: KPIData[] = result.data.rows

  const arr = getKPI(kpis, 'ARR')
  const mrr = getKPI(kpis, 'MRR')
  const churn = getKPI(kpis, 'Churn Rate')
  const customers = getKPI(kpis, 'Customer Count')
  const routes = getKPI(kpis, 'Routes Completed')
  const quality = getKPI(kpis, 'Avg Quality Score')
  const nps = getKPI(kpis, 'NPS Score')
  const growth = getKPI(kpis, 'Revenue Growth')

  return (
    <>
      {/* Breadcrumb */}
      <div className="mb-6">
        <h2 className="text-title-md2 font-semibold text-black dark:text-white">
          Executive Overview
        </h2>
        <p className="text-sm text-body dark:text-bodydark">
          Real-time business intelligence at your fingertips
        </p>
      </div>

      {/* Top Row - Revenue Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-4 md:mb-6">
        {arr && (
          <KPICard
            title="Annual Recurring Revenue"
            value={arr.current_value}
            change={arr.change_percent}
            trend={getTrend(arr.change_percent)}
            format="currency"
          />
        )}
        {mrr && (
          <KPICard
            title="Monthly Recurring Revenue"
            value={mrr.current_value}
            change={mrr.change_percent}
            trend={getTrend(mrr.change_percent)}
            format="currency"
          />
        )}
        {growth && (
          <KPICard
            title="Revenue Growth"
            value={growth.current_value}
            change={growth.change_percent}
            trend={getTrend(growth.change_percent)}
            format="percent"
          />
        )}
        {churn && (
          <KPICard
            title="Churn Rate"
            value={churn.current_value}
            change={churn.change_percent}
            trend={churn.change_percent < 0 ? 'up' : 'down'}
            format="percent"
          />
        )}
      </div>

      {/* Second Row - Operations & Customer Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
        {customers && (
          <KPICard
            title="Total Customers"
            value={customers.current_value}
            change={customers.change_percent}
            trend={getTrend(customers.change_percent)}
            format="number"
          />
        )}
        {routes && (
          <KPICard
            title="Routes Completed"
            value={routes.current_value}
            change={routes.change_percent}
            trend={getTrend(routes.change_percent)}
            subtitle="Last 24 hours"
          />
        )}
        {quality && (
          <KPICard
            title="Quality Score"
            value={quality.current_value}
            change={quality.change_percent}
            trend={getTrend(quality.change_percent)}
            subtitle="Out of 5.0"
          />
        )}
        {nps && (
          <KPICard
            title="NPS Score"
            value={nps.current_value}
            change={nps.change_percent}
            trend={getTrend(nps.change_percent)}
          />
        )}
      </div>

      {/* Welcome Section */}
      <div className="rounded-sm border border-stroke bg-white px-7.5 py-6 shadow-default dark:border-strokedark dark:bg-boxdark">
        <h3 className="text-title-sm font-semibold text-black dark:text-white mb-3">
          Welcome to Your BI Dashboard
        </h3>
        <p className="text-body dark:text-bodydark mb-6">
          Navigate through the sidebar to explore detailed analytics for Revenue, Operations, and Customer metrics.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-sm border border-stroke bg-gray py-4 px-5 dark:border-strokedark dark:bg-meta-4">
            <p className="text-sm text-body dark:text-bodydark mb-2">Data Source</p>
            <p className="text-black dark:text-white font-semibold">CSV Files (Mock Data)</p>
          </div>
          <div className="rounded-sm border border-stroke bg-gray py-4 px-5 dark:border-strokedark dark:bg-meta-4">
            <p className="text-sm text-body dark:text-bodydark mb-2">Last Updated</p>
            <p className="text-black dark:text-white font-semibold">Real-time</p>
          </div>
          <div className="rounded-sm border border-stroke bg-gray py-4 px-5 dark:border-strokedark dark:bg-meta-4">
            <p className="text-sm text-body dark:text-bodydark mb-2">Status</p>
            <p className="text-meta-3 font-semibold">● All Systems Operational</p>
          </div>
        </div>
      </div>
    </>
  )
}
