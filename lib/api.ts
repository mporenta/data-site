/**
 * API utilities for server-side and client-side data fetching
 */

/**
 * Get the API base URL for server-side fetches
 * In development: http://localhost:8000
 * In production: Use API_URL env var or fallback to relative URL
 */
export function getApiUrl(): string {
  // Server-side only
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:8000'
  }
  // Client-side: use relative URL (works with Next.js rewrites)
  return ''
}

/**
 * Fetch data from the BI API with proper URL resolution
 * For dynamic pages (behind auth), use cache: 'no-store'
 * For static/ISR pages, pass next: { revalidate: N } in options
 */
export async function fetchFromApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const baseUrl = getApiUrl()

  // Strip /api prefix for server-side calls (Python API doesn't have /api prefix)
  // Client-side calls use Next.js rewrites which handle this automatically
  let path = endpoint
  if (typeof window === 'undefined' && endpoint.startsWith('/api/')) {
    path = endpoint.replace('/api/', '/')
  }

  const url = `${baseUrl}${path}`

  const response = await fetch(url, {
    // Default to no-store for dynamic pages (real-time data behind auth)
    cache: 'no-store',
    ...options,
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}
