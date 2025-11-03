import { fetchFromApi } from '@/lib/api'
import RevenueCharts from '@/components/RevenueCharts'
import type { QueryResponse } from '@/types/api'

// Force dynamic rendering - don't prerender at build time
// This page requires real-time data and is behind Okta auth
export const dynamic = 'force-dynamic'

type RevenueData = QueryResponse['data']['rows'][number]

// Server Component - data fetching happens on the server
export default async function RevenueDashboard() {
  // Fetch revenue data on the server
  const result = await fetchFromApi<QueryResponse>('/api/bi/query?report_id=exec-revenue')
  const data: RevenueData[] = result.data.rows

  return <RevenueCharts data={data} />
}
