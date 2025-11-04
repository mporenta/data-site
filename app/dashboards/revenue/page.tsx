import { fetchFromApi } from '@/lib/api'
import RevenueCharts from '@/components/RevenueCharts'
import type { QueryResponse } from '@/types/api'

// Force dynamic rendering - don't prerender at build time
// This page requires real-time data and is behind Okta auth
export const dynamic = 'force-dynamic'

type RevenueData = {
  month: string
  total_revenue: number
  mrr: number
  arr: number
  unique_customers: number
  new_customers: number
  revenue_growth: number
}

// Server Component - data fetching happens on the server
export default async function RevenueDashboard() {
  // Fetch revenue data on the server
  const result = await fetchFromApi<QueryResponse>('/api/bi/query?report_id=exec-revenue')
  const data: RevenueData[] = result.data.rows as RevenueData[]

  return <RevenueCharts data={data} />
}
