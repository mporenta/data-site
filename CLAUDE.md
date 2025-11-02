# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Business Intelligence web application for Aptive Environmental C-suite executives, built as a POC combining Next.js 16 frontend with a Python FastAPI backend. The app displays executive dashboards with KPIs and visualizations sourced from CSV files (with plans to integrate Snowflake).

## Aptive Brand Guidelines

### Color Palette

Aptive's color system is built around natural, earthy tones that convey warmth, trust, and environmental consciousness.

#### Primary Colors

**Pine (Core Brand Color)**
- Hex: `#344C38`
- RGB: 52, 76, 56
- CMYK: 74, 47, 76, 45
- Usage: Primary brand color, used specifically for the Aptive wordmark

**Forest Black**
- Hex: `#0D210F`
- Usage: Deep, rich dark tone for text and emphasis

**Snow (White)**
- Hex: `#FFFFFF`
- Usage: Clean backgrounds and contrast

**Sun (Accent)**
- Hex: `#D7FD19`
- Usage: Bright accent for calls-to-action and energy

#### Secondary Colors

**Pine Family (Greens)**
- `#78856E` - Mid-tone pine
- `#B5C5B2` - Light pine
- `#EBF7E8` - Very light pine
- `#F5F7ED` - Pale pine/cream
- `#309C42` - Vibrant green

**Blue Tones**
- `#1E2D3A` - Deep blue-gray
- `#B8CCC9` - Soft blue-green
- `#EAF4F4` - Pale blue

**Earth Tones**
- `#8A7357` - Warm brown
- `#BDB2A0` - Light tan
- `#EAECDA` - Cream

**Neutral Grays**
- `#212121` - Dark gray
- `#3F3F3F` - Medium gray

### Typography

Aptive uses three primary typefaces, each serving specific purposes in the brand hierarchy:

#### GT Super (Headlines & Display)
- **Purpose**: Primary typeface for headlines and first impressions
- **Character**: Expressive display serif with warmth, strength, and reassurance
- **Design**: Based on 1970s-80s display serif typography with unique calligraphic motions
- **Designer**: Noël Leu (Grilli Type) with Mirco Schiavone & Reto Moser
- **Font Files Available**:
  - `2357GT-Super.woff2/woff`
  - `1435GT-Super.woff2/woff`
  - `2073GT-Super.woff2/woff`
  - `929GT-Super.woff2/woff`
  - `9885GT-Super.woff2/woff`
  - `7607GT-Super.woff2/woff`
  - `304GT-Super.woff2/woff`
  - `7486GT-Super.woff2/woff`
  - `4281GT-Super.woff2/woff`
  - `1281GT-Super.woff2/woff`

#### Rand (Body Text)
- **Purpose**: Primary typeface for body copy and core messaging
- **Character**: Grotesque sans-serif with organic texture and balanced rhythm
- **Design**: Born from intensive research on the grotesque genre, matches the neighborliness of Aptive
- **Designer**: François Rappo (Optimo)
- **Font Files Available**:
  - `2012Rand.woff2/woff`
  - `590Rand.woff2/woff`
  - `1715Rand.woff2/woff`
  - `6799Rand.woff2/woff`
  - `4284Rand.woff2/woff`
  - `2953Rand.woff2/woff`
  - `7760Rand.woff2/woff`

#### Rand Mono (Technical & Call-outs)
- **Purpose**: Technical information, call-outs, and subheadings
- **Character**: Monospaced companion to Rand with shortened capitals
- **Design**: Carefully crafted proportions that complement the Rand family
- **Designer**: François Rappo (Optimo)
- **Font Files Available**:
  - `8404Rand-Mono.woff2/woff`
  - `4464Rand-Mono.woff2/woff`
  - `3431Rand-Mono.woff2/woff`
  - `1865Rand-Mono.woff2/woff`
  - `1263Rand-Mono.woff2/woff`

**Typography Hierarchy**:
- Headlines: GT Super
- Body Text: Rand
- Subheads/Technical: Rand Mono

### Logo

#### Wordmark Specifications
- **Typeface**: LL Brown – Bold (custom modified)
- **Modifications**: 
  - Shortened descender on the "p"
  - Lowered ascending tittle
  - Custom optical kerning
- **Purpose**: Creates compact, scalable wordmark with geometric and rhythmic balance
- **Character**: Approachable, unobtrusive, and welcoming

#### Logo Usage Guidelines
- **Always use vector files** - Never type out the wordmark in LL Brown Bold
- **Spacing reference**: Use the "a" as your reference for spacing around the logo
- **Core color**: Pine (#344C38) for the wordmark
- **Maintain integrity**: Consult Aptive's creative team when in doubt

#### Important Don'ts
- Do not stretch or distort the logo
- Do not recreate the wordmark by typing
- Do not modify letter spacing
- Maintain proper clear space around the logo

### Font CDN Resources
All Aptive fonts are hosted at: `https://marketo.aptivepestcontrol.com/rs/773-UEC-876/images/`

- When implementing Aptive brand designs, always use these official font files and maintain the established color palette for brand consistency.

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

### Production Deployment Architecture

The Docker Compose setup includes a full production stack:

1. **Python API Service** (port 8000, internal) - FastAPI backend with health checks
2. **Next.js Service** (port 3000, internal) - Frontend in production mode with standalone build
3. **Nginx Reverse Proxy** (ports 80/443) - Routes traffic to frontend and API
4. **Certbot** - Automatic SSL certificate management and renewal

All services include:
- Resource limits (CPU/memory)
- Health checks with automatic restarts
- Security hardening (read-only filesystems, dropped capabilities, no-new-privileges)
- Structured logging with rotation
- Graceful shutdowns

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

**Local Production Build:**

```bash
# Build Next.js for production
npm run build

# Start production Next.js server
npm start
```

**Vercel Deployment:**

```bash
# Deploy to Vercel
vercel
vercel --prod
```

**Docker Deployment:**

```bash
# Build and start all services (Next.js, Python API, Nginx, SSL)
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs

# Check service status
npm run docker:ps

# Restart services
npm run docker:restart

# Rebuild and restart
npm run docker:rebuild

# Stop services
npm run docker:down

# Clean up all Docker resources
npm run docker:clean
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

**Development:** Environment variables are in `.env.local` (not `.env`)

**Docker/Production:** Environment variables are loaded from `.env` file (not committed to git)

Required variables:
```
SNOWFLAKE_ACCOUNT=...
SNOWFLAKE_USER=...
SNOWFLAKE_PASSWORD=...
SNOWFLAKE_WAREHOUSE=...
SNOWFLAKE_DATABASE=...
SNOWFLAKE_SCHEMA=...
NEXT_PUBLIC_API_URL=http://localhost:8000  # Development only
DOMAIN=yourdomain.com  # Docker deployment only
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

### Development
- The Python API must be running for the frontend to display any data
- Python uses virtual environment at `./venv` - always use `./venv/bin/python` or `./venv/bin/pip`
- The `start.sh` script handles graceful shutdown of both servers with Ctrl+C
- Pages are client components (`'use client'`) due to data fetching and useState/useEffect usage

### Data & API
- CSV data includes mock executive metrics for demonstration
- Dashboard pages expect specific data structures from the API (columns + rows)
- All numeric values in CSV are automatically converted to int/float by the API
- CORS is currently set to allow all origins (`allow_origins=["*"]`) - restrict in production

### Docker Deployment
- Next.js uses standalone build mode (configured in `next.config.js`)
- Services communicate via Docker network (Next.js → http://python-api:8000)
- Nginx routes `/api/*` to Python service, everything else to Next.js
- SSL certificates are managed automatically by Certbot
- All containers run as non-root users with security hardening
- Logs are rotated automatically (max 10MB, 3 files per service)
