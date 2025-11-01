````markdown
# BI Web App (POC) – Based on `vercel-labs/ai-sdk-preview-python-streaming`

> Base repo provides: Next.js (app router) + Vercel AI SDK (`useChat`) + Python serverless function (FastAPI-style) deployed on Vercel. We will extend it into a C-suite BI app. :contentReference[oaicite:0]{index=0}

---

## 1. Goals & Scope
- Deliver a browser BI portal for executives (C-suite, VPs).
- Use Vercel Hobby as hosting for POC.
- Keep **Next.js** as the UI shell / routing.
- Keep **Python** functions (from the base repo) as our integration surface.
- Add **Snowflake → Python → JSON → charts** flow.
- Auth will be wired later to Okta (OIDC); initial POC uses public or token-protected routes.

---

## 2. High-Level Architecture
1. **Client (Next.js / React)**
   - App router pages: `/`, `/dashboards`, `/reports/[id]`, `/admin`
   - Shared layout with top nav, sidebar, user avatar
   - Components for tables, KPI cards, chart wrappers
2. **API Layer (Vercel Functions, Python)**
   - `/api/chat` (existing AI streaming from repo) – keep
   - `/api/bi/query` – new, calls Snowflake, returns JSON dataset
   - `/api/bi/metadata` – new, returns list of available reports (from dbt artifacts or config)
3. **Data Sources**
   - Snowflake (primary)
   - dbt artifacts in repo or S3 (optional)
   - Simple in-memory / file cache in Python during POC
4. **AuthN/AuthZ (planned)**
   - Okta OIDC → add middleware in Next.js
   - Python functions validate access token + group → report

---

## 3. Frontend (Next.js) Structure
- `app/layout.tsx`
  - Imports global styles, sets up `<ThemeProvider>`, top bar, sidebar
  - Placeholder for user info (later: Okta claims)
- `app/page.tsx`
  - “Executive Overview” with KPI cards (ARR, MRR, Churn, Leads, Field Ops)
  - Feed of “recent insights” (AI-generated from the Python chat endpoint)
- `app/dashboards/page.tsx`
  - Lists all dashboards user can see
  - Fetches from `/api/bi/metadata`
- `app/dashboards/[slug]/page.tsx`
  - Renders specific dashboard layout
  - Sections:
    - KPI row
    - Trend charts
    - Drilldown table
  - Each widget calls `/api/bi/query?report=...`
- `components/`
  - `KpiCard.tsx`
  - `ChartWrapper.tsx` (Recharts/ECharts)
  - `DataTable.tsx`
  - `InsightPanel.tsx` (uses the existing AI chat stream)
  - `ReportFilters.tsx`
- `hooks/`
  - `useBIData(reportId, filters)` – fetches from Python endpoint
  - `useOktaUser()` – placeholder/hook to be implemented later

---

## 4. API (Python on Vercel) Extensions
- Keep existing: `api/chat.py` (from template). :contentReference[oaicite:1]{index=1}
- Add: `api/bi_query.py`
  - Accepts: `report_id`, optional `filters` (JSON)
  - Validates: user group (later)
  - Connects: Snowflake with `snowflake-connector-python`
  - Returns: `{columns: [...], rows: [...]}` for easy charting
- Add: `api/bi_metadata.py`
  - Returns list of dashboards/reports:
    ```json
    [
      {"id": "exec-rev", "name": "Executive Revenue", "groups": ["C_SUITE","FINANCE"]},
      {"id": "field-ops", "name": "Field Ops Performance", "groups": ["OPS"]}
    ]
    ```
  - Later: build this from dbt metadata
- Add: `api/health.py` for uptime checks

---

## 5. Snowflake / dbt Integration (POC)
- **Option A** (quick): Hardcode 2–3 Snowflake SQL queries in Python and return JSON.
- **Option B** (better): Store SQL per report in a JSON/YAML file in the repo:
  ```yaml
  - id: exec-rev
    name: Executive Revenue
    sql: select date, revenue, region from bi.exec_revenue_daily where date >= current_date - 30
    roles: [C_SUITE, FINANCE]
````

Python reads this, runs query, returns results.

* **Option C** (future): Read dbt `manifest.json`/`catalog.json` and expose only “exposed” models.

---

## 6. Auth / Okta (Planned Layer)

1. **Next.js side**

   * Add middleware to require login for `/dashboards/*`
   * Store ID token in session (Vercel Edge Middleware or next-auth with Okta)
2. **Python side**

   * Each `/api/bi/*` endpoint verifies JWT (issuer, audience, kid)
   * Extract groups/roles from token
   * Check against report’s `roles` from metadata
3. **UI**

   * If user lacks role → show “Request access” and don’t fetch data

---

## 7. UI/UX for C-Suite

* **Home**

  * 4 KPI cards (Today / MTD / QTD / Target)
  * “AI Insight” box (streams from `/api/chat`)
  * “Exceptions” list (e.g. routes missed, branches under target)
* **Dashboard Layouts**

  * 2-column responsive
  * Fixed header with filters: Date range, Region, Channel
  * Inline export button (export JSON/CSV via Next.js route)
* **Drilldown**

  * Click point in chart → call `/api/bi/query?report=...&drill=...`

---

## 8. Config & Environment

* `.env` (local): Snowflake creds, AI keys
* Vercel Project → **Environment Variables**:

  * `SNOWFLAKE_ACCOUNT=...`
  * `SNOWFLAKE_USER=...`
  * `SNOWFLAKE_PASSWORD=...` (or key-based)
  * `OKTA_ISSUER=...`
  * `OKTA_AUDIENCE=...`
    Then redeploy. ([GitHub][1])

---

## 9. Deployment Flow

1. Fork base repo
2. Add new Python APIs to `api/`
3. Add new pages/components to `app/`
4. Push → Vercel auto-build
5. Test Snowflake calls
6. Add Okta later as separate PR

---

## 10. Future Enhancements

* Add serverless caching layer (in-memory or Upstash Redis) to cache expensive Snowflake queries
* Add metrics page for dashboard usage (who ran which report)
* Add PDF export (headless browser on build or separate AWS function)
* Add row/column-level security mapping to Okta groups

---

```
::contentReference[oaicite:3]{index=3}
```

[1]: https://github.com/vercel-labs/ai-sdk-preview-python-streaming "GitHub - vercel-labs/ai-sdk-preview-python-streaming"
