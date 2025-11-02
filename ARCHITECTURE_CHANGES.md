# Architecture Changes - Server Components Implementation

## Problem Solved
Docker build was failing because Next.js was trying to statically pre-render dashboard pages at build time, but the Python API wasn't available during the build process.

## Solution: Dynamic Rendering for Authenticated Dashboards

Since this application is:
- Behind Okta authentication (no SEO concerns)
- Serving real-time business intelligence data
- Deployed to AWS Fargate with CloudFront

We've configured the pages to use **dynamic rendering** (render at request time, not build time).

## Changes Made

### 1. Server Components with Dynamic Rendering

#### `app/page.tsx` (Executive Overview)
```typescript
export const dynamic = 'force-dynamic'  // Don't prerender at build time

export default async function Home() {
  const result = await fetchFromApi('/api/bi/query?report_id=kpi-summary')
  // Render with server-fetched data
}
```

#### `app/dashboards/revenue/page.tsx`
```typescript
export const dynamic = 'force-dynamic'

export default async function RevenueDashboard() {
  const result = await fetchFromApi('/api/bi/query?report_id=exec-revenue')
  return <RevenueCharts data={result.data.rows} />
}
```

### 2. Hybrid Architecture Pattern

**Server Component (fetches data)** → **Client Component (renders charts)**

```
┌─────────────────────────────────────┐
│ Server Component (page.tsx)        │
│ - Fetches data from API             │
│ - Runs on server only               │
│ - No JavaScript sent to client      │
│ export const dynamic = 'force-dynamic'
└──────────────┬──────────────────────┘
               │ passes data as props
               ↓
┌─────────────────────────────────────┐
│ Client Component (Charts.tsx)       │
│ - Receives data as props            │
│ - Renders interactive Recharts      │
│ - 'use client' directive            │
└─────────────────────────────────────┘
```

### 3. API Utility (`lib/api.ts`)

```typescript
export async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const baseUrl = getApiUrl()  // Server: http://localhost:8000, Client: ''
  const url = `${baseUrl}${endpoint}`

  return fetch(url, {
    cache: 'no-store'  // Always fresh data for real-time dashboards
  })
}
```

### 4. Environment Configuration

**Development:**
```bash
API_URL=http://localhost:8000  # Server-side fetches
# Client-side uses Next.js rewrites (automatic proxy)
```

**Production (AWS Fargate):**
```bash
API_URL=http://your-fargate-api-service:8000
# Or if using CloudFront:
API_URL=https://your-cloudfront-domain.com
```

## Rendering Strategy Comparison

### Before (Client-Side Only)
```typescript
'use client'

export default function Page() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/...')  // Client-side fetch
      .then(res => res.json())
      .then(setData)
  }, [])

  return <Charts data={data} />
}
```

**Issues:**
- Slow initial page load (fetch after JS loads)
- Large JavaScript bundle
- Flash of loading state
- Can still be pre-rendered at build time if not careful

### After (Server Component + Dynamic Rendering)
```typescript
export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await fetchFromApi('/api/...')  // Server-side fetch
  return <Charts data={result.data.rows} />
}
```

**Benefits:**
- ✅ Faster initial page load (data fetched on server)
- ✅ Smaller JavaScript bundle
- ✅ No loading spinner needed
- ✅ Works with Docker builds (no pre-rendering)
- ✅ Fresh data on every request (perfect for dashboards)

## Caching Strategy

### API Layer (Python FastAPI)
```python
response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"
```
- 60-second cache in CDN/browser
- `stale-while-revalidate` allows serving stale data while refreshing

### Next.js Layer
```typescript
export const dynamic = 'force-dynamic'  // No static generation
fetch(url, { cache: 'no-store' })       // Always fresh data
```

### Combined Result
1. Page renders dynamically on every request
2. Server fetches from API with `no-store`
3. API response can be cached by CloudFront (60 seconds)
4. Result: Fresh data with CDN performance benefits

## Pages Status

| Page | Pattern | Status |
|------|---------|--------|
| `app/page.tsx` | Server Component + Dynamic | ✅ Migrated |
| `app/dashboards/revenue/page.tsx` | Server Component + Dynamic | ✅ Migrated |
| `app/dashboards/operations/page.tsx` | Client Component (useEffect) | ⏳ Can be migrated |
| `app/dashboards/customers/page.tsx` | Client Component (useEffect) | ⏳ Can be migrated |

## Migration Pattern for Remaining Pages

1. Extract chart rendering to a client component:
```typescript
// components/OperationsCharts.tsx
'use client'
export default function OperationsCharts({ data }) {
  return <div>...recharts...</div>
}
```

2. Convert page to Server Component:
```typescript
// app/dashboards/operations/page.tsx
export const dynamic = 'force-dynamic'

export default async function Page() {
  const result = await fetchFromApi('/api/bi/query?report_id=field-ops')
  return <OperationsCharts data={result.data.rows} />
}
```

## Docker Build Process

### Build Flow
```
1. npm run build
   └─ Next.js compiles all pages
      ├─ Static pages: Pre-rendered at build time
      └─ Dynamic pages (force-dynamic): Compiled but NOT pre-rendered

2. Docker image created with:
   - Compiled Next.js code
   - Server.js entry point
   - No pre-rendered data

3. Runtime (container starts):
   - User requests page
   - Next.js server renders page
   - Fetches data from Python API
   - Returns HTML to user
```

### Why This Works
- `export const dynamic = 'force-dynamic'` tells Next.js: "Don't try to render this at build time"
- Pages are compiled but not executed during build
- Data fetching only happens at runtime when API is available

## Testing

### Development
```bash
# Terminal 1: Start Python API
./venv/bin/python run_api.py

# Terminal 2: Start Next.js (with auto-proxy)
npm run dev

# Visit http://localhost:3000
```

### Docker
```bash
# Build and start all services
npm run docker:build
npm run docker:up

# Visit http://localhost (Nginx)
# Or http://localhost:3000 (Next.js direct)
```

### AWS Fargate Deployment
1. Build Docker images for ECR
2. Deploy to Fargate with:
   - `API_URL` environment variable set to internal API endpoint
   - CloudFront in front for caching and SSL
3. Pages will render dynamically on each request with fresh data

## Performance Considerations

### Current Strategy (Real-Time Dashboard)
- Every page load fetches fresh data
- API responses cached for 60 seconds by CloudFront
- Appropriate for frequently-changing business metrics

### Alternative (If Data Changes Less Frequently)
If you want to cache rendered pages:
```typescript
// Change from:
export const dynamic = 'force-dynamic'

// To:
export const revalidate = 300  // Re-generate page every 5 minutes

// And update API fetch:
const result = await fetchFromApi('/api/...', {
  next: { revalidate: 300 }
})
```

This would enable ISR (Incremental Static Regeneration) for better performance if real-time data isn't critical.

## Key Takeaways

1. **`export const dynamic = 'force-dynamic'`** is required for pages that fetch data at the page level
2. **Server Components** fetch data on the server, reducing client-side JavaScript
3. **Client Components** (`'use client'`) are still needed for interactive Recharts
4. **`cache: 'no-store'`** ensures fresh data for real-time dashboards
5. **API-level caching** (60s) provides performance benefits without stale data concerns
