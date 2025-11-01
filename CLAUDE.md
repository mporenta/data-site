# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Business Intelligence web application for C-suite executives, built as a POC combining Next.js 16 frontend with a Python FastAPI backend. The app displays executive dashboards with KPIs and visualizations sourced from CSV files (with plans to integrate Snowflake).

## Architecture

### Dual-Server Architecture

This application requires running TWO separate servers simultaneously:

1. **Python FastAPI Backend** (Port 8000) - Serves data via REST API
2. **Next.js Frontend** (Port 3000) - Server-side rendered React application

The frontend makes HTTP requests to the backend API to fetch dashboard data.

### Key Architectural Points

- **Single FastAPI Instance**: `api/index.py` is the main FastAPI app that includes all routers. This is NOT a collection of independent serverless functions - it's a unified API with modular routers.
- **Router Pattern**: API endpoints are organized into routers (`health`, `bi_metadata`, `bi_query`) that are included in the main app.
- **CSV Data Source**: Currently reads from CSV files in `api/data/`. Production will query Snowflake.
- **Vercel Deployment**: The `vercel.json` configuration routes all `/api/*` requests to the Python function while Next.js handles the frontend.

## Common Commands

### Development

**Quick Start (Single Command):**

```bash
# Run both servers with one command
./start.sh
```

The script will start both the Python API (port 8000) and Next.js frontend (port 3000). Press Ctrl+C to stop both servers.

**Manual Start (Separate Terminals):**

```bash
# Terminal 1 - Python API Backend
./venv/bin/python run_api.py
# OR
npm run dev:api

# Terminal 2 - Next.js Frontend
npm run dev
```

### Build & Deploy

```bash
# Build Next.js for production
npm run build

# Start production Next.js server
npm start

# Deploy to Vercel
vercel
vercel --prod
```

### Linting

```bash
npm run lint
```

### Python Environment Setup

```bash
# Create virtual environment (first time only)
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate  # macOS/Linux
venv\Scripts\activate      # Windows

# Install Python dependencies
./venv/bin/pip install -r requirements.txt
```

## Directory Structure

```
bi_web_app/
├── api/                          # Python FastAPI backend
│   ├── index.py                  # Main FastAPI app with all routers
│   ├── routers/                  # API route handlers
│   │   ├── health.py             # Health check endpoint
│   │   ├── bi_metadata.py        # Dashboard metadata (list of dashboards)
│   │   └── bi_query.py           # Data queries (currently CSV, future Snowflake)
│   └── data/                     # CSV data files
│       ├── kpi_summary.csv
│       ├── exec_revenue.csv
│       ├── field_ops.csv
│       └── customer_churn.csv
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx                # Root layout with Sidebar
│   ├── page.tsx                  # Home page (executive overview)
│   └── dashboards/               # Dashboard pages
│       ├── revenue/page.tsx
│       ├── operations/page.tsx
│       └── customers/page.tsx
├── components/                   # React components
│   ├── Sidebar.tsx               # Navigation sidebar
│   └── KPICard.tsx               # Reusable KPI display card
├── run_api.py                    # Development server launcher for API
└── vercel.json                   # Vercel deployment configuration
```

## API Endpoints

All API endpoints are served from the single FastAPI instance at `api/index.py`:

- `GET /` - API root with version info
- `GET /health` - Health check endpoint
- `GET /bi/metadata` - List all available dashboards with metadata
- `GET /bi/metadata/{dashboard_id}` - Get specific dashboard metadata
- `GET /bi/query?report_id={id}` - Query data for a specific report
- `GET /docs` - Interactive API documentation (Swagger UI)

### Report IDs

Available report_id values for `/bi/query`:
- `kpi-summary` - High-level KPI summary
- `exec-revenue` - Executive revenue metrics
- `field-ops` - Field operations performance
- `customer-churn` - Customer churn analysis

## Key Technical Details

### Data Flow

1. Next.js page components fetch data from Python API (`fetch('http://localhost:8000/bi/query?report_id=...')`)
2. Python router reads corresponding CSV file from `api/data/`
3. CSV data is parsed, numeric values are type-converted (strings to int/float)
4. Returns JSON with structure: `{report_id, data: {columns: [...], rows: [...], count: N}, source: "csv", message}`
5. Next.js components render data using Recharts library and KPICard component

### Component Architecture

- **Client vs Server Components**: Most pages use `'use client'` directive for interactivity (data fetching, state management)
- **KPICard Component**: Reusable card with support for currency/percent/number formatting, trend indicators, and change percentages
- **Sidebar Component**: Client component using `usePathname` for active state highlighting

### TypeScript/React Stack

- **Next.js 16** with App Router (server components by default)
- **React 19** with TypeScript
- **Tailwind CSS 4** for styling
- **Recharts 3** for data visualizations
- **Lucide React** for icons

### Python Stack

- **FastAPI 0.104.1** - Modern async web framework
- **Uvicorn 0.24.0** - ASGI server (note: uses import string format for auto-reload in `run_api.py`)
- **Snowflake Connector 3.12.3** - Database driver (not yet used)
- **Pydantic 2.5.0** - Data validation
- **python-dotenv 1.0.1** - Environment variable management

### Environment Variables

Environment variables are in `.env.local` (not `.env`):

```
SNOWFLAKE_ACCOUNT=...
SNOWFLAKE_USER=...
SNOWFLAKE_PASSWORD=...
SNOWFLAKE_WAREHOUSE=...
SNOWFLAKE_DATABASE=...
SNOWFLAKE_SCHEMA=...
```

Currently unused (CSV mode), but required for Snowflake integration.

## Development Workflow

### Adding a New Dashboard

1. Create CSV data file in `api/data/new_dashboard.csv`
2. Add mapping in `api/routers/bi_query.py` CSV_FILE_MAP
3. Add metadata entry in `api/routers/bi_metadata.py` DASHBOARDS_METADATA
4. Create Next.js page in `app/dashboards/new-dashboard/page.tsx`
5. Fetch data using `fetch('http://localhost:8000/bi/query?report_id=new-dashboard')`
6. Render using KPICard and Recharts components

### Switching from CSV to Snowflake

When ready to connect to Snowflake:
1. Implement Snowflake connection in `api/routers/bi_query.py`
2. Replace `read_csv_data()` with `query_snowflake()`
3. Ensure environment variables are configured
4. Test with real queries before removing CSV fallback

### Testing the API

```bash
# Health check
curl http://localhost:8000/health

# List dashboards
curl http://localhost:8000/bi/metadata

# Query data
curl http://localhost:8000/bi/query?report_id=kpi-summary

# Interactive docs
open http://localhost:8000/docs
```

## Future Planned Features

- Okta OIDC authentication
- Role-based access control (groups from metadata)
- Real Snowflake queries replacing CSV
- PDF export functionality
- Real-time data updates
- dbt metadata integration
- Connection pooling and caching

## Important Notes

- The Python API must be running for the frontend to display any data
- CORS is currently set to allow all origins (`allow_origins=["*"]`) - restrict in production
- CSV data includes mock executive metrics for demonstration
- Dashboard pages expect specific data structures from the API (columns + rows)
- All numeric values in CSV are automatically converted to int/float by the API
- Pages are client components (`'use client'`) due to data fetching and useState/useEffect usage
- Python uses virtual environment at `./venv` - always use `./venv/bin/python` or `./venv/bin/pip`
- The `start.sh` script handles graceful shutdown of both servers with Ctrl+C
