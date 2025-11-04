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
        {arr && arr.current_value !== null && arr.change_percent !== null && (
          <KPICard
            title="Annual Recurring Revenue"
            value={arr.current_value as string | number}
            change={arr.change_percent as number}
            trend={getTrend(arr.change_percent as number)}
            format="currency"
          />
        )}
        {mrr && mrr.current_value !== null && mrr.change_percent !== null && (
          <KPICard
            title="Monthly Recurring Revenue"
            value={mrr.current_value as string | number}
            change={mrr.change_percent as number}
            trend={getTrend(mrr.change_percent as number)}
            format="currency"
          />
        )}
        {growth && growth.current_value !== null && growth.change_percent !== null && (
          <KPICard
            title="Revenue Growth"
            value={growth.current_value as string | number}
            change={growth.change_percent as number}
            trend={getTrend(growth.change_percent as number)}
            format="percent"
          />
        )}
        {churn && churn.current_value !== null && churn.change_percent !== null && (
          <KPICard
            title="Churn Rate"
            value={churn.current_value as string | number}
            change={churn.change_percent as number}
            trend={(churn.change_percent as number) < 0 ? 'up' : 'down'}
            format="percent"
          />
        )}
      </div>

      {/* Second Row - Operations & Customer Metrics */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-4 2xl:gap-7.5 mb-6">
        {customers && customers.current_value !== null && customers.change_percent !== null && (
          <KPICard
            title="Total Customers"
            value={customers.current_value as string | number}
            change={customers.change_percent as number}
            trend={getTrend(customers.change_percent as number)}
            format="number"
          />
        )}
        {routes && routes.current_value !== null && routes.change_percent !== null && (
          <KPICard
            title="Routes Completed"
            value={routes.current_value as string | number}
            change={routes.change_percent as number}
            trend={getTrend(routes.change_percent as number)}
            subtitle="Last 24 hours"
          />
        )}
        {quality && quality.current_value !== null && quality.change_percent !== null && (
          <KPICard
            title="Quality Score"
            value={quality.current_value as string | number}
            change={quality.change_percent as number}
            trend={getTrend(quality.change_percent as number)}
            subtitle="Out of 5.0"
          />
        )}
        {nps && nps.current_value !== null && nps.change_percent !== null && (
          <KPICard
            title="NPS Score"
            value={nps.current_value as string | number}
            change={nps.change_percent as number}
            trend={getTrend(nps.change_percent as number)}
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
