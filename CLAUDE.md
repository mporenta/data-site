# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Business Intelligence web application for Aptive Environmental C-suite executives, built as a POC combining Next.js 16 frontend with a Python FastAPI backend. The app displays executive dashboards with KPIs and visualizations.

**Data Strategy:**
- **Primary/Demo**: CSV files in `api/data/` - enables demos and frontend development without database dependencies
- **Production**: AWS RDS PostgreSQL (planned) - CSV files remain as fallback/demo data
- **Not using**: Snowflake (legacy references in codebase should be ignored)

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
- **API Routing**: Next.js rewrites `/api/bi/*` to Python API via `next.config.js`. The `API_URL` env var controls the target (localhost:8000 for dev, python-api:8000 for Docker).
- **CSV Data Source**: Reads from CSV files in `api/data/`. This is the primary data source for demos and frontend development. CSV files allow frontend iteration without database dependencies and provide stable demo data.
- **Production Database**: Will connect to AWS RDS PostgreSQL (not Snowflake). CSV files remain as fallback/demo data.
- **Docker Deployment**: Production runs as containerized services (Next.js + Python API) orchestrated by Docker Compose or AWS ECS Fargate.

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

**Quick Start (Single Command) - macOS/Linux/WSL:**

```bash
# Run both servers with one command
./start.sh
```

The script will start both the Python API (port 8000) and Next.js frontend (port 3000). Press Ctrl+C to stop both servers.

**Windows (PowerShell/CMD):**

```powershell
# Terminal 1 - Python API Backend
venv\Scripts\python.exe run_api.py

# Terminal 2 - Next.js Frontend (separate terminal)
npm run dev
```

**Manual Start (Separate Terminals) - macOS/Linux:**

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

**Docker Deployment (Local):**

```bash
# Local development environment
npm run docker:local

# Access at http://localhost:3000 (Next.js direct access)
# OR http://localhost (via nginx, optional)
```

**Docker Deployment (Production Server):**

```bash
# Build and start all services (includes Nginx + SSL)
npm run docker:build
npm run docker:up

# View logs
npm run docker:logs
```

**AWS Fargate Deployment (Planned):**

```bash
# Push images to ECR and deploy via ECS
# CloudFront → ALB → Fargate (Next.js + Python API)
# See README.md for detailed AWS deployment steps
```

### Linting

```bash
npm run lint
```

### Python Environment Setup

**macOS/Linux:**
```bash
# Create virtual environment (first time only)
python3.11 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

**Windows:**
```powershell
# Create virtual environment (first time only)
python -m venv venv

# Activate virtual environment
venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

## Directory Structure

```
bi_web_app/
├── api/                          # Python FastAPI backend
│   ├── index.py                  # Main FastAPI app with all routers
│   ├── routers/                  # API route handlers
│   │   ├── health.py             # Health check endpoint
│   │   ├── bi_metadata.py        # Dashboard metadata (list of dashboards)
│   │   └── bi_query.py           # Data queries (currently CSV, future AWS RDS)
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
├── docker-compose.yml            # Production Docker configuration
├── docker-compose-local.yml      # Local Docker Desktop configuration
└── Dockerfile                    # Next.js container build
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
- **Pydantic 2.5.0** - Data validation
- **python-dotenv 1.0.1** - Environment variable management
- **boto3** - AWS SDK (for Secrets Manager, optional)

**Note**: `requirements.txt` currently includes `snowflake-connector-python` which should be replaced with `psycopg2-binary` when implementing AWS RDS PostgreSQL connection.

### Environment Variables

**Development:** Environment variables are in `.env.local` (not `.env`)

**Docker/Production:** Environment variables are loaded from `.env` file (not committed to git)

**CSV Mode (Default)**: The application works without any database configuration. It reads from CSV files in `api/data/`. This is the recommended mode for demos and frontend development.

**Database Configuration (Optional - for production AWS RDS PostgreSQL)**:
```
# Database Configuration (AWS RDS PostgreSQL)
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=bi_database
RDS_USER=db_user
RDS_PASSWORD=secure_password

# API Configuration
API_URL=http://python-api:8000  # Docker internal
NEXT_PUBLIC_API_URL=https://yourdomain.com  # Client-side

# Docker Deployment
DOMAIN=yourdomain.com  # For SSL certificate

# Authentication (future)
OKTA_ISSUER=https://aptive.okta.com/oauth2/default
OKTA_CLIENT_ID=...
OKTA_CLIENT_SECRET=...
```

**Note**: `.env.local.example` currently contains Snowflake configuration variables which are not used. These should be replaced with AWS RDS variables when needed.

## Development Workflow

### Adding a New Dashboard

1. Create CSV data file in `api/data/new_dashboard.csv`
2. Add mapping in `api/routers/bi_query.py` CSV_FILE_MAP
3. Add metadata entry in `api/routers/bi_metadata.py` DASHBOARDS_METADATA
4. Create Next.js page in `app/dashboards/new-dashboard/page.tsx`
5. Fetch data using `fetch('http://localhost:8000/bi/query?report_id=new-dashboard')`
6. Render using KPICard and Recharts components

### Adding AWS RDS PostgreSQL (While Keeping CSV)

When ready to add AWS RDS PostgreSQL support:
1. Update `requirements.txt`: Remove `snowflake-connector-python`, add `psycopg2-binary`
2. Install database driver: `pip install psycopg2-binary`
3. Implement RDS connection in `api/routers/bi_query.py`
4. Add `query_database()` function alongside `read_csv_data()`
5. Ensure environment variables are configured (RDS_HOST, RDS_PORT, etc.)
6. Implement fallback logic: try database first, fall back to CSV if database unavailable
7. **Keep CSV files**: They remain essential for demos and frontend development

Example PostgreSQL connection setup:
```python
import psycopg2
from psycopg2.pool import SimpleConnectionPool

# Connection pool for better performance
pool = SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=os.getenv('RDS_HOST'),
    port=os.getenv('RDS_PORT', 5432),
    database=os.getenv('RDS_DATABASE'),
    user=os.getenv('RDS_USER'),
    password=os.getenv('RDS_PASSWORD'),
    sslmode='require'  # AWS RDS requires SSL
)

# Get connection from pool
conn = pool.getconn()
try:
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM dashboards WHERE report_id = %s", (report_id,))
    results = cursor.fetchall()
finally:
    pool.putconn(conn)
```

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

### Troubleshooting API Routing in Docker

If you see "Internal Server Error" or "ECONNREFUSED" errors when accessing `/api/bi/*` endpoints in Docker:

1. **Check Next.js logs**: `docker logs nextjs-local`
2. **Look for**: `Failed to proxy http://127.0.0.1:8000` - This means `API_URL` wasn't available at build time
3. **Fix**: Ensure `API_URL` is passed as a **build argument** in docker-compose:
   ```yaml
   build:
     args:
       - API_URL=http://python-api:8000
   ```
4. **Rebuild**: `docker compose -f docker-compose-local.yml up -d --build nextjs`

**Why this happens**: Next.js evaluates `next.config.js` at build time. If `API_URL` is only set as a runtime environment variable, it won't be available during the build, causing rewrites to use the fallback `http://127.0.0.1:8000` which doesn't exist inside the container.

## Future Planned Features

- Okta OIDC authentication
- Role-based access control (groups from metadata)
- AWS RDS database integration replacing CSV
- PDF export functionality
- Real-time data updates via WebSockets
- Connection pooling and query caching
- AWS Fargate deployment with CloudFront CDN
- Multi-environment support (dev/staging/prod)

## Important Notes

### Development
- The Python API must be running for the frontend to display any data
- Python uses virtual environment at `./venv` - always use `./venv/bin/python` or `./venv/bin/pip` (Windows: `venv\Scripts\python.exe`)
- The `start.sh` script works on macOS/Linux/WSL only. Windows users should run servers manually in separate terminals
- Pages are client components (`'use client'`) due to data fetching and useState/useEffect usage

### Data & API
- **CSV files are essential**: They provide stable demo data and enable frontend development without database dependencies. Do not remove them.
- CSV data includes mock executive metrics for demonstration and can be exported from real data sources
- Dashboard pages expect specific data structures from the API (columns + rows)
- All numeric values in CSV are automatically converted to int/float by the API
- CORS is currently set to allow all origins (`allow_origins=["*"]`) - restrict in production
- When AWS RDS is implemented, CSV files remain as fallback/demo data

### Docker Deployment
- **API Routing**: Next.js rewrites `/api/bi/*` to Python API at `http://python-api:8000/bi/*` via `next.config.js` rewrites
- **Critical**: `API_URL` must be passed as a Docker **build argument**, not just runtime env var (see docker-compose-local.yml)
- Next.js uses standalone build mode (configured in `next.config.js`)
- Services communicate via Docker network (Next.js → http://python-api:8000)
- Access at `http://localhost:3000` (direct) or `http://localhost` (via nginx)
- Nginx is optional for local dev (routes `/api/*` to Python, everything else to Next.js)
- SSL certificates are managed automatically by Certbot (production only)
- All containers run as non-root users with security hardening
- Logs are rotated automatically (max 10MB, 3 files per service)
