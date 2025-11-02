import { fetchFromApi } from '@/lib/api'
import RevenueCharts from '@/components/RevenueCharts'

// Force dynamic rendering - don't prerender at build time
// This page requires real-time data and is behind Okta auth
export const dynamic = 'force-dynamic'

interface RevenueData {
  month: string
  total_revenue: number
  mrr: number
  arr: number
  unique_customers: number
  new_customers: number
  revenue_growth: number
}

interface ApiResponse {
  report_id: string
  data: {
    columns: string[]
    rows: RevenueData[]
    count: number
  }
  source: string
  message: string
}

// Server Component - data fetching happens on the server
export default async function RevenueDashboard() {
  // Fetch revenue data on the server
  const result = await fetchFromApi<ApiResponse>('/api/bi/query?report_id=exec-revenue')
  const data = result.data.rows

  return <RevenueCharts data={data} />
}
