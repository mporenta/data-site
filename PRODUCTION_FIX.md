# Production Deployment Fix - 404 API Errors

## Problem
Production site (data.porenta.us) was showing 500 errors with the message:
```
Application error: a server-side exception has occurred
Digest: 101258516
```

Next.js logs showed:
```
⨯ Error: API error: 404 Not Found
```

## Root Cause

The URL routing was misconfigured between Next.js and the Python API:

**What was happening:**
1. Client code: `fetchFromApi('/api/bi/query?report_id=...')`
2. Server-side fetch: `http://python-api:8000/api/bi/query` ❌
3. Python API actual route: `/bi/query` (no `/api` prefix)
4. Result: **404 Not Found**

**Why it worked in development before:**
- The old client-side `fetch()` in `useEffect` used Next.js rewrites
- Rewrites only apply to client-side requests, not server-side fetches

**Why it broke with Server Components:**
- Server Components fetch data on the server (not in the browser)
- Server fetches bypass Next.js rewrites
- Direct server-to-server call: Next.js container → Python API container

## Solution

### 1. Fixed `lib/api.ts` - Strip `/api` prefix for server-side calls

```typescript
export async function fetchFromApi<T>(endpoint: string): Promise<T> {
  const baseUrl = getApiUrl()

  // Strip /api prefix for server-side calls (Python API doesn't have /api prefix)
  // Client-side calls use Next.js rewrites which handle this automatically
  let path = endpoint
  if (typeof window === 'undefined' && endpoint.startsWith('/api/')) {
    path = endpoint.replace('/api/', '/')
  }

  const url = `${baseUrl}${path}`
  // ... fetch ...
}
```

### 2. Updated `next.config.js` - Fixed rewrite rules

```javascript
async rewrites() {
  return process.env.NODE_ENV === 'development' ? [
    {
      source: '/api/bi/:path*',
      destination: 'http://127.0.0.1:8000/bi/:path*'  // Strips /api prefix
    },
    {
      source: '/api/health',
      destination: 'http://127.0.0.1:8000/health'
    }
  ] : []
}
```

## URL Flow (Fixed)

### Development Mode
```
Browser → /api/bi/query
         ↓ (Next.js rewrite)
         → http://127.0.0.1:8000/bi/query ✅
```

### Production Mode (Docker)

**Client-side navigation:**
```
Browser → /api/bi/query
         ↓ (uses client-side fetch, handled by Next.js)
         → Server Component
```

**Server-side rendering:**
```
Next.js Server Component
  fetchFromApi('/api/bi/query')
         ↓ (strips /api prefix in lib/api.ts)
  fetch('http://python-api:8000/bi/query') ✅
         ↓
  Python API returns data
         ↓
  Renders page HTML
         ↓
  Sends to browser
```

## Verification

### Test API connectivity:
```bash
# From Next.js container
docker exec nextjs-production sh -c 'wget -qO- http://python-api:8000/health'
# Returns: {"status":"healthy",...}

docker exec nextjs-production sh -c 'wget -qO- "http://python-api:8000/bi/query?report_id=kpi-summary"'
# Returns: {"report_id":"kpi-summary","data":{...}}
```

### Check container status:
```bash
docker compose ps
# All containers should be "healthy"
```

### Check logs:
```bash
docker compose logs nextjs --tail 50
# Should show no 404 errors
```

## Key Learnings

### 1. Server vs Client Component Behavior

**Client Component (old approach):**
```typescript
'use client'
export default function Page() {
  useEffect(() => {
    fetch('/api/bi/query')  // Runs in browser, uses Next.js rewrites
  }, [])
}
```

**Server Component (new approach):**
```typescript
export const dynamic = 'force-dynamic'
export default async function Page() {
  const data = await fetchFromApi('/api/bi/query')  // Runs on server
  // Server bypasses rewrites, needs proper URL
}
```

### 2. Next.js Rewrites vs Server Fetches

| Feature | Rewrites | Server Fetches |
|---------|----------|----------------|
| **Scope** | Browser requests only | Server-side code |
| **When applied** | Client navigation | At render time |
| **Configuration** | `next.config.js` | Environment variables |
| **URL handling** | Automatic proxy | Manual URL construction |

### 3. Environment Variables in Docker

**docker-compose.yml:**
```yaml
nextjs:
  environment:
    - API_URL=http://python-api:8000  # Docker service name
```

**lib/api.ts:**
```typescript
export function getApiUrl(): string {
  if (typeof window === 'undefined') {
    return process.env.API_URL || 'http://localhost:8000'
  }
  return ''  // Client-side uses relative URLs
}
```

## Files Modified

1. **lib/api.ts**
   - Added logic to strip `/api` prefix for server-side calls
   - Keeps `/api` prefix for client-side calls (uses rewrites)

2. **next.config.js**
   - Updated rewrite rules to strip `/api` prefix when proxying to Python API
   - Added explicit routes for `/api/bi/*` and `/api/health`

3. **app/page.tsx**
   - Added `export const dynamic = 'force-dynamic'`
   - Converted to Server Component with `async function`

4. **app/dashboards/revenue/page.tsx**
   - Added `export const dynamic = 'force-dynamic'`
   - Converted to Server Component with `async function`

## Deployment Steps

```bash
# 1. Pull latest code
cd /home/dev/github/data-site

# 2. Rebuild containers
docker compose build

# 3. Restart services
docker compose up -d

# 4. Verify
docker compose ps
docker compose logs nextjs --tail 50

# 5. Test site
curl -I https://data.porenta.us/
# Should return 200 OK
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                    Nginx (port 443)                         │
│  Routes: /* → Next.js, /api/* → Next.js                    │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          ↓                             ↓
┌──────────────────────┐      ┌─────────────────────┐
│ Next.js (port 3000)  │      │ Python API (8000)   │
│ - Server Components  │←────→│ - FastAPI           │
│ - Fetches from API   │      │ - Routes: /bi/*     │
│ - Renders HTML       │      │         /health     │
└──────────────────────┘      └─────────────────────┘
   API_URL=http://python-api:8000
```

## Monitoring

### Check for errors:
```bash
# Next.js errors
docker compose logs nextjs | grep -i error

# Python API errors
docker compose logs python-api | grep -i error

# Nginx errors
docker compose logs nginx | grep -i error
```

### Health checks:
```bash
# Frontend health
curl https://data.porenta.us/api/health

# Backend health (internal)
docker exec python-api-production curl http://localhost:8000/health
```

## Future Considerations

### For AWS Fargate Deployment:

1. **Update API_URL environment variable:**
   ```bash
   # In ECS task definition
   API_URL=http://your-internal-alb:8000
   # Or if using CloudFront:
   API_URL=https://your-cloudfront-domain.com
   ```

2. **Update CORS in api/index.py** to include CloudFront domain if needed

3. **Configure health checks** in ALB to use `/api/health` endpoint

4. **Set cache headers** already optimized for CloudFront caching (60 seconds)

## Status

✅ **RESOLVED** - Site is now functioning correctly at https://data.porenta.us

- Home page loads with KPI data
- Revenue dashboard loads with charts
- Operations and Customers dashboards work (client-side)
- API connectivity verified
- All containers healthy
