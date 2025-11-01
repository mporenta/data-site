# BI Web App - Executive Dashboard

A modern Business Intelligence dashboard built with Next.js and Python, designed for C-suite executives.

## Tech Stack

- **Frontend**: Next.js 16 with TypeScript, Tailwind CSS
- **Backend**: Python 3.11 with FastAPI
- **Database**: Snowflake
- **Deployment**: Vercel
- **Auth** (Planned): Okta OIDC

## Project Structure

```
bi_web_app/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
├── api/                    # Python FastAPI backend
│   ├── index.py           # Main FastAPI app (single instance)
│   └── routers/           # API route handlers
│       ├── health.py      # Health check endpoint
│       ├── bi_metadata.py # Dashboard metadata
│       └── bi_query.py    # Snowflake queries
├── components/            # React components (to be added)
├── hooks/                 # Custom React hooks (to be added)
├── run_api.py             # Development server for API
└── public/                # Static assets
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.11
- Snowflake account (optional for development)

### Installation

1. **Install Node dependencies:**
   ```bash
   npm install
   ```

2. **Set up Python virtual environment:**
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual credentials
   ```

### Development

**Quick Start (Recommended):**

```bash
# Run both servers with one command
./start.sh
```

This will start both the Python API and Next.js frontend. Press Ctrl+C to stop both servers.

**Manual Start (Separate Terminals):**

1. **Start the Next.js development server:**
   ```bash
   npm run dev
   ```

2. **In a separate terminal, start the Python API server:**
   ```bash
   npm run dev:api
   # OR
   ./venv/bin/python run_api.py
   ```

**Access the application:**
- Frontend: http://localhost:3000
- API Root: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs
- Health Check: http://localhost:8000/health
- Dashboard Metadata: http://localhost:8000/bi/metadata
- Query Data: http://localhost:8000/bi/query?report_id=exec-revenue

### Features

#### Current
- ✅ Next.js app router setup
- ✅ TypeScript configuration
- ✅ Tailwind CSS styling
- ✅ Python API endpoints with FastAPI
- ✅ Snowflake connector integration
- ✅ Mock data for development
- ✅ Health check endpoint

#### Planned
- 🔲 Dashboard pages with charts
- 🔲 KPI cards and visualizations
- 🔲 Recharts/ECharts integration
- 🔲 Real Snowflake data integration
- 🔲 Okta authentication
- 🔲 Role-based access control
- 🔲 PDF export functionality
- 🔲 Real-time data updates

## API Endpoints

The API is built with a single FastAPI instance using routers for organization.

### GET /health
Health check endpoint for monitoring.

### GET /bi/metadata
Returns list of available dashboards with their metadata.

### GET /bi/metadata/{dashboard_id}
Returns metadata for a specific dashboard.

### GET /bi/query?report_id={id}
Executes a query and returns data. Uses mock data when Snowflake is not configured.

### API Documentation
FastAPI provides automatic interactive API documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `SNOWFLAKE_ACCOUNT` - Your Snowflake account identifier
- `SNOWFLAKE_USER` - Snowflake username
- `SNOWFLAKE_PASSWORD` - Snowflake password
- `SNOWFLAKE_WAREHOUSE` - Snowflake warehouse name
- `SNOWFLAKE_DATABASE` - Snowflake database name
- `SNOWFLAKE_SCHEMA` - Snowflake schema name

## Deployment

### Vercel Deployment

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

3. Configure environment variables in Vercel dashboard

4. Deploy to production:
   ```bash
   vercel --prod
   ```

## Contributing

This is a POC project. For production use, consider:
- Adding comprehensive error handling
- Implementing connection pooling for Snowflake
- Adding request caching
- Implementing comprehensive logging
- Adding unit and integration tests
- Setting up CI/CD pipelines

## License

ISC
