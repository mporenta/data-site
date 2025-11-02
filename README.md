# BI Web App - Aptive Executive Dashboard

A modern Business Intelligence web application for Aptive Environmental C-suite executives, displaying KPIs, visualizations, and dashboards with data sourced from AWS RDS PostgreSQL databases.

## Overview

This application provides executive-level business intelligence through interactive dashboards built with Next.js and Python FastAPI. Designed for deployment behind Okta authentication on AWS infrastructure.

**Key Features:**
- 📊 Executive dashboards with KPIs and visualizations (Recharts)
- 🔒 Okta OIDC authentication (planned)
- 🐘 AWS RDS PostgreSQL database integration
- 🐳 Docker-first deployment strategy
- ☁️ AWS Fargate + CloudFront architecture
- 🎨 Aptive brand guidelines (Pine, Forest Black, GT Super, Rand)

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| **Backend** | Python 3.11, FastAPI 0.104.1, Uvicorn |
| **Database** | AWS RDS PostgreSQL (currently CSV mock data) |
| **Visualization** | Recharts 3, Lucide React icons |
| **Deployment** | Docker → AWS ECS Fargate + CloudFront |
| **Auth** | Okta OIDC (planned) |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Internet                              │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  CloudFront   │  (CDN, SSL, 60s cache)
         └───────┬───────┘
                 │
                 ▼
         ┌───────────────┐
         │      ALB      │  (Application Load Balancer)
         └───────┬───────┘
                 │
         ┌───────┴────────┐
         │                │
         ▼                ▼
  ┌──────────┐     ┌──────────┐
  │ Next.js  │────▶│ Python   │
  │ (3000)   │     │ API      │
  │          │     │ (8000)   │
  └──────────┘     └────┬─────┘
                        │
                        ▼
                 ┌──────────────┐
                 │  AWS RDS     │
                 │  PostgreSQL  │
                 └──────────────┘
```

**Dual-Server Architecture:**
- **Next.js Frontend** (Port 3000): Server-side rendered React with Server Components
- **Python FastAPI Backend** (Port 8000): Unified API with modular routers
- **Database**: AWS RDS PostgreSQL with connection pooling

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.11+
- Docker Desktop (for containerized deployment)

### Local Development (Native)

```bash
# 1. Clone repository
git clone <repository-url>
cd data-site

# 2. Install Node dependencies
npm install

# 3. Set up Python virtual environment
python3.11 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 4. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your values

# 5. Start both servers
./start.sh
```

**Access Points:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

### Local Development (Docker Desktop)

**Recommended for testing production-like environment locally.**

```bash
# 1. Ensure Docker Desktop is running

# 2. Copy environment file
cp .env.local.example .env.local

# 3. Start all services (builds automatically)
npm run docker:local

# 4. Access application
open http://localhost        # via Nginx (recommended)
open http://localhost:3000   # Next.js direct
open http://localhost:8000   # API direct
open http://localhost:8000/docs  # API documentation
```

**Docker Management Commands:**

```bash
# View logs
npm run docker:local:logs

# Check status
npm run docker:local:ps

# Restart services
npm run docker:local:restart

# Rebuild after code changes
npm run docker:local:rebuild

# Stop services
npm run docker:local:down

# Clean everything (removes containers, volumes, images)
npm run docker:local:clean
```

**What's Running:**
- `nextjs` - Next.js frontend container (port 3000)
- `python-api` - Python FastAPI backend (port 8000)
- `nginx` - Reverse proxy (port 80)

📖 **Detailed Documentation:** See [`DOCKER_LOCAL_QUICKSTART.md`](DOCKER_LOCAL_QUICKSTART.md)

## Production Deployment

### Production Docker Server

Deploy to a Linux server with SSL:

```bash
# 1. Configure environment
cp .env.example .env
nano .env  # Add production values

# 2. Build and start services
npm run docker:build
npm run docker:up

# 3. Monitor
npm run docker:logs
npm run docker:ps
```

**Services:**
- Next.js container (port 3000, internal)
- Python API container (port 8000, internal)
- Nginx reverse proxy (ports 80/443)
- Certbot for automatic SSL certificates

📖 **Documentation:** See [`DEPLOY.md`](DEPLOY.md) and [`README-DOCKER.md`](README-DOCKER.md)

### AWS Fargate Deployment

#### 1. Prerequisites

- AWS CLI configured with appropriate credentials
- ECR repositories created
- RDS PostgreSQL instance provisioned
- Secrets Manager secrets configured
- Route 53 hosted zone (optional)

#### 2. Create ECR Repositories

```bash
aws ecr create-repository \
  --repository-name bi-nextjs \
  --region us-east-1

aws ecr create-repository \
  --repository-name bi-python-api \
  --region us-east-1
```

#### 3. Build and Push Docker Images

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build and tag Next.js image
docker build -t bi-nextjs:latest .
docker tag bi-nextjs:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-nextjs:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-nextjs:latest

# Build and tag Python API image
docker build -t bi-python-api:latest -f Dockerfile.api .
docker tag bi-python-api:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-python-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-python-api:latest
```

#### 4. AWS Infrastructure Setup

**Required AWS Resources:**
- VPC with public and private subnets
- RDS PostgreSQL instance in private subnet
- ECS Cluster (Fargate)
- Application Load Balancer (ALB)
- ECS Task Definitions for both services
- ECS Services with auto-scaling
- CloudFront distribution
- Secrets Manager secrets for credentials
- IAM roles for ECS task execution

**ECS Task Definition Environment Variables:**
```json
{
  "environment": [
    { "name": "API_URL", "value": "http://python-api-service:8000" },
    { "name": "NEXT_PUBLIC_API_URL", "value": "https://bi.aptive.com" }
  ],
  "secrets": [
    { "name": "RDS_HOST", "valueFrom": "arn:aws:secretsmanager:..." },
    { "name": "RDS_DATABASE", "valueFrom": "arn:aws:secretsmanager:..." },
    { "name": "RDS_USER", "valueFrom": "arn:aws:secretsmanager:..." },
    { "name": "RDS_PASSWORD", "valueFrom": "arn:aws:secretsmanager:..." },
    { "name": "OKTA_CLIENT_ID", "valueFrom": "arn:aws:secretsmanager:..." },
    { "name": "OKTA_CLIENT_SECRET", "valueFrom": "arn:aws:secretsmanager:..." }
  ]
}
```

## Migrating from CSV to AWS RDS PostgreSQL

### Step 1: Install PostgreSQL Dependencies

Update `requirements.txt`:
```txt
psycopg2-binary==2.9.9
boto3==1.34.34
```

Install:
```bash
pip install -r requirements.txt
```

### Step 2: Database Connection Setup

**Option A: Direct Connection with psycopg2 (Recommended)**

Create `api/database.py`:
```python
import os
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager

# Initialize connection pool
pool = SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=os.getenv('RDS_HOST'),
    port=os.getenv('RDS_PORT', 5432),
    database=os.getenv('RDS_DATABASE'),
    user=os.getenv('RDS_USER'),
    password=os.getenv('RDS_PASSWORD'),
    sslmode='require',  # AWS RDS requires SSL
    connect_timeout=10
)

@contextmanager
def get_db_connection():
    """Context manager for database connections."""
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        pool.putconn(conn)

def query_database(query: str, params: tuple = None):
    """Execute a query and return results."""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            return {
                'columns': columns,
                'rows': [dict(zip(columns, row)) for row in rows],
                'count': len(rows)
            }
```

**Option B: With boto3 Secrets Manager (Production)**

Create `api/database.py`:
```python
import os
import json
import boto3
import psycopg2
from psycopg2.pool import SimpleConnectionPool
from contextlib import contextmanager
from functools import lru_cache

@lru_cache(maxsize=1)
def get_secret(secret_name: str) -> dict:
    """Retrieve secrets from AWS Secrets Manager."""
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=os.getenv('AWS_REGION', 'us-east-1')
    )

    try:
        response = client.get_secret_value(SecretId=secret_name)
        return json.loads(response['SecretString'])
    except Exception as e:
        raise Exception(f"Failed to retrieve secret {secret_name}: {str(e)}")

# Get database credentials from Secrets Manager
db_secret = get_secret(os.getenv('DB_SECRET_NAME', 'bi-app/rds/credentials'))

# Initialize connection pool
pool = SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    host=db_secret['host'],
    port=db_secret.get('port', 5432),
    database=db_secret['database'],
    user=db_secret['username'],
    password=db_secret['password'],
    sslmode='require',
    connect_timeout=10
)

@contextmanager
def get_db_connection():
    """Context manager for database connections."""
    conn = pool.getconn()
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        pool.putconn(conn)

def query_database(query: str, params: tuple = None):
    """Execute a query and return results."""
    with get_db_connection() as conn:
        with conn.cursor() as cursor:
            cursor.execute(query, params)
            columns = [desc[0] for desc in cursor.description]
            rows = cursor.fetchall()
            return {
                'columns': columns,
                'rows': [dict(zip(columns, row)) for row in rows],
                'count': len(rows)
            }
```

**Option C: IAM Database Authentication**

```python
import boto3
import psycopg2

def get_db_connection_with_iam():
    """Connect to RDS using IAM authentication."""
    client = boto3.client('rds', region_name='us-east-1')

    token = client.generate_db_auth_token(
        DBHostname=os.getenv('RDS_HOST'),
        Port=5432,
        DBUsername=os.getenv('RDS_USER')
    )

    conn = psycopg2.connect(
        host=os.getenv('RDS_HOST'),
        port=5432,
        database=os.getenv('RDS_DATABASE'),
        user=os.getenv('RDS_USER'),
        password=token,
        sslmode='require',
        sslrootcert='rds-ca-bundle.pem'  # Download from AWS
    )
    return conn
```

### Step 3: Update API Router

Update `api/routers/bi_query.py`:

```python
from fastapi import APIRouter, Query, HTTPException, Response
from api.database import query_database
import os

router = APIRouter()

# SQL queries mapped to report IDs
QUERIES = {
    'kpi-summary': """
        SELECT
            metric_name,
            metric_value,
            change_percent,
            trend,
            format_type
        FROM executive_kpis
        WHERE period = 'current'
        ORDER BY display_order
    """,

    'exec-revenue': """
        SELECT
            month,
            total_revenue,
            recurring_revenue,
            new_customer_revenue,
            target_revenue
        FROM revenue_metrics
        WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
        ORDER BY month
    """,

    'field-ops': """
        SELECT
            region,
            technicians_count,
            routes_completed,
            avg_service_time,
            customer_satisfaction
        FROM field_operations
        WHERE date = CURRENT_DATE
        ORDER BY region
    """,

    'customer-churn': """
        SELECT
            month,
            total_customers,
            churned_customers,
            churn_rate,
            retention_rate
        FROM customer_metrics
        WHERE year = EXTRACT(YEAR FROM CURRENT_DATE)
        ORDER BY month
    """
}

@router.get("/bi/query")
async def query_data(
    response: Response,
    report_id: str = Query(..., description="Report identifier")
):
    """
    Query data from AWS RDS PostgreSQL database.
    Falls back to CSV if database is not configured.
    """

    # Check if database is configured
    if not os.getenv('RDS_HOST'):
        # Fallback to CSV for development
        return read_csv_fallback(report_id)

    # Get SQL query for report
    if report_id not in QUERIES:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    try:
        # Execute query
        result = query_database(QUERIES[report_id])

        # Set caching headers
        response.headers["Cache-Control"] = "public, max-age=60, stale-while-revalidate=120"

        return {
            "report_id": report_id,
            "data": result,
            "source": "aws_rds_postgresql",
            "message": "Data retrieved successfully"
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database query failed: {str(e)}"
        )

def read_csv_fallback(report_id: str):
    """Fallback to CSV data for development."""
    import csv
    from pathlib import Path

    CSV_FILE_MAP = {
        'kpi-summary': 'kpi_summary.csv',
        'exec-revenue': 'exec_revenue.csv',
        'field-ops': 'field_ops.csv',
        'customer-churn': 'customer_churn.csv'
    }

    if report_id not in CSV_FILE_MAP:
        raise HTTPException(status_code=404, detail=f"Report '{report_id}' not found")

    csv_file = Path(__file__).parent.parent / "data" / CSV_FILE_MAP[report_id]

    with open(csv_file, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)
        columns = reader.fieldnames

    return {
        "report_id": report_id,
        "data": {
            "columns": columns,
            "rows": rows,
            "count": len(rows)
        },
        "source": "csv_mock_data",
        "message": "Using CSV mock data (RDS not configured)"
    }
```

### Step 4: Database Schema Example

Create PostgreSQL tables:

```sql
-- Executive KPIs
CREATE TABLE executive_kpis (
    id SERIAL PRIMARY KEY,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC(15,2),
    change_percent NUMERIC(5,2),
    trend VARCHAR(10),  -- 'up' or 'down'
    format_type VARCHAR(20),  -- 'currency', 'percent', 'number'
    period VARCHAR(20) DEFAULT 'current',
    display_order INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Revenue Metrics
CREATE TABLE revenue_metrics (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    total_revenue NUMERIC(15,2),
    recurring_revenue NUMERIC(15,2),
    new_customer_revenue NUMERIC(15,2),
    target_revenue NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

-- Field Operations
CREATE TABLE field_operations (
    id SERIAL PRIMARY KEY,
    region VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    technicians_count INT,
    routes_completed INT,
    avg_service_time NUMERIC(5,2),
    customer_satisfaction NUMERIC(3,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customer Metrics
CREATE TABLE customer_metrics (
    id SERIAL PRIMARY KEY,
    year INT NOT NULL,
    month INT NOT NULL,
    total_customers INT,
    churned_customers INT,
    churn_rate NUMERIC(5,2),
    retention_rate NUMERIC(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, month)
);

-- Indexes for performance
CREATE INDEX idx_revenue_year_month ON revenue_metrics(year, month);
CREATE INDEX idx_field_ops_date ON field_operations(date);
CREATE INDEX idx_customer_year_month ON customer_metrics(year, month);
```

### Step 5: Environment Variables

Update `.env` for production:

```bash
# AWS RDS PostgreSQL
RDS_HOST=your-instance.xxxxxx.us-east-1.rds.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=bi_production
RDS_USER=bi_app_user
RDS_PASSWORD=<use-secrets-manager>

# AWS Secrets Manager (if using boto3)
DB_SECRET_NAME=bi-app/rds/credentials
AWS_REGION=us-east-1

# API Configuration
API_URL=http://python-api-service:8000
NEXT_PUBLIC_API_URL=https://bi.aptive.com

# Okta (planned)
OKTA_ISSUER=https://aptive.okta.com/oauth2/default
OKTA_CLIENT_ID=<from-secrets-manager>
OKTA_CLIENT_SECRET=<from-secrets-manager>
```

### Step 6: Testing Database Connection

Create `test_db.py`:

```python
from api.database import query_database

# Test connection
try:
    result = query_database("SELECT version();")
    print("Database connection successful!")
    print(f"PostgreSQL version: {result['rows'][0]}")
except Exception as e:
    print(f"Database connection failed: {e}")
```

Run test:
```bash
python test_db.py
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API root with version info |
| `/health` | GET | Health check endpoint |
| `/bi/metadata` | GET | List all available dashboards |
| `/bi/metadata/{dashboard_id}` | GET | Get specific dashboard metadata |
| `/bi/query?report_id={id}` | GET | Query data for a report |
| `/docs` | GET | Interactive API documentation (Swagger UI) |
| `/redoc` | GET | Alternative API documentation (ReDoc) |

**Available Report IDs:**
- `kpi-summary` - Executive KPI summary
- `exec-revenue` - Revenue metrics and trends
- `field-ops` - Field operations performance
- `customer-churn` - Customer churn analysis

## Environment Variables

### Development (`.env.local`)
```bash
# API URLs
NEXT_PUBLIC_API_URL=http://localhost:8000
API_URL=http://python-api:8000  # Docker internal

# Database (optional for CSV mode)
# RDS_HOST=localhost
# RDS_PORT=5432
# RDS_DATABASE=bi_dev
# RDS_USER=dev_user
# RDS_PASSWORD=dev_password
```

### Production Docker (`.env`)
```bash
# API URLs
NEXT_PUBLIC_API_URL=https://data.porenta.us
API_URL=http://python-api:8000

# Domain for SSL
DOMAIN=data.porenta.us

# Database
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=bi_production
RDS_USER=bi_app_user
RDS_PASSWORD=<secure-password>
```

### AWS Fargate (Secrets Manager)
```bash
# Use AWS Secrets Manager for sensitive values
DB_SECRET_NAME=bi-app/rds/credentials
OKTA_SECRET_NAME=bi-app/okta/credentials
AWS_REGION=us-east-1

# Public URLs
NEXT_PUBLIC_API_URL=https://bi.aptive.com
```

## Project Structure

```
data-site/
├── app/                          # Next.js 16 App Router
│   ├── layout.tsx               # Root layout with Sidebar
│   ├── page.tsx                 # Home page (KPI summary)
│   ├── globals.css              # Global styles (Aptive branding)
│   └── dashboards/              # Dashboard pages
│       ├── revenue/page.tsx     # Revenue dashboard
│       ├── operations/page.tsx  # Field operations
│       └── customers/page.tsx   # Customer churn
├── api/                         # Python FastAPI Backend
│   ├── index.py                 # Main FastAPI app with routers
│   ├── database.py              # PostgreSQL connection (add this)
│   ├── routers/                 # API route handlers
│   │   ├── health.py           # Health check endpoint
│   │   ├── bi_metadata.py      # Dashboard metadata
│   │   └── bi_query.py         # Data queries (CSV → PostgreSQL)
│   └── data/                    # CSV mock data files
│       ├── kpi_summary.csv
│       ├── exec_revenue.csv
│       ├── field_ops.csv
│       └── customer_churn.csv
├── components/                  # React Components
│   ├── Sidebar.tsx             # Navigation sidebar
│   ├── KPICard.tsx             # KPI display card
│   ├── RevenueCharts.tsx       # Revenue visualizations
│   ├── OperationsCharts.tsx    # Operations visualizations
│   └── CustomerCharts.tsx      # Customer churn visualizations
├── lib/                        # Utilities
│   └── api.ts                  # API client utility
├── docker-compose.yml          # Production Docker config
├── docker-compose-local.yml    # Local Docker Desktop config
├── Dockerfile                  # Next.js container build
├── Dockerfile.api              # Python API container build (create this)
├── nginx/                      # Nginx configurations
│   ├── nginx.conf             # Production config
│   └── nginx-local.conf       # Local config
├── requirements.txt            # Python dependencies
├── package.json               # Node.js dependencies
├── next.config.js            # Next.js configuration
├── run_api.py                # API development server
├── start.sh                  # Start both servers (dev)
└── README.md                 # This file
```

## Development Workflow

### Adding a New Dashboard

1. **Create SQL query** in `api/routers/bi_query.py` QUERIES dict
2. **Add metadata** in `api/routers/bi_metadata.py` DASHBOARDS_METADATA
3. **Create Next.js page** in `app/dashboards/new-dashboard/page.tsx`
4. **Create chart component** in `components/NewDashboardCharts.tsx`
5. **Add sidebar link** in `components/Sidebar.tsx`

### Making Code Changes

**With Docker (Production-like):**
```bash
# Make changes, then rebuild
npm run docker:local:rebuild

# Or rebuild specific service
docker compose -f docker-compose-local.yml up -d --build nextjs
docker compose -f docker-compose-local.yml up -d --build python-api
```

**Without Docker (Faster iteration):**
```bash
# Terminal 1: Next.js with hot reload
npm run dev

# Terminal 2: Python API with auto-reload
npm run dev:api
```

### Testing

```bash
# Test API health
curl http://localhost:8000/health

# Test data endpoint
curl http://localhost:8000/bi/query?report_id=kpi-summary

# Test metadata
curl http://localhost:8000/bi/metadata

# Interactive API testing
open http://localhost:8000/docs
```

## Monitoring & Debugging

### Docker Logs

```bash
# All services
npm run docker:local:logs

# Specific service
docker compose -f docker-compose-local.yml logs -f nextjs
docker compose -f docker-compose-local.yml logs -f python-api
docker compose -f docker-compose-local.yml logs -f nginx

# Last 50 lines
docker compose -f docker-compose-local.yml logs --tail=50
```

### Health Checks

```bash
# API health
curl http://localhost:8000/health

# Frontend health
curl http://localhost:3000/api/health

# Database connection (if configured)
docker exec -it <container-id> python test_db.py
```

## Authentication with Okta (NextAuth.js)

NextAuth.js makes Okta integration incredibly simple with built-in provider support.

### Installation

```bash
npm install next-auth
```

### Configuration

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import OktaProvider from 'next-auth/providers/okta'

const handler = NextAuth({
  providers: [
    OktaProvider({
      clientId: process.env.OKTA_CLIENT_ID!,
      clientSecret: process.env.OKTA_CLIENT_SECRET!,
      issuer: process.env.OKTA_ISSUER
    })
  ],
  callbacks: {
    async session({ session, token }) {
      // Add user groups from Okta for RBAC
      session.user.groups = token.groups
      return session
    }
  }
})

export { handler as GET, handler as POST }
```

### Environment Variables

```bash
# .env.local
OKTA_CLIENT_ID=your_client_id
OKTA_CLIENT_SECRET=your_client_secret
OKTA_ISSUER=https://aptive.okta.com/oauth2/default
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate_with_openssl_rand_base64_32
```

### Protecting Routes

Wrap your app in `app/layout.tsx`:

```typescript
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  )
}
```

Protect pages with middleware `middleware.ts`:

```typescript
export { default } from 'next-auth/middleware'

export const config = {
  matcher: ['/dashboards/:path*', '/']
}
```

That's it! Your app now requires Okta authentication.

**Learn More:**
- [NextAuth.js Okta Provider Documentation](https://next-auth.js.org/providers/okta)
- [NextAuth.js Okta Provider Source Code](https://github.com/nextauthjs/next-auth/blob/v4/packages/next-auth/src/providers/okta.ts)
- [Okta OAuth API Documentation](https://developer.okta.com/docs/api/openapi/okta-oauth/guides/overview/)

## Security Considerations

- ✅ CORS restricted to specific domains (*.goaptive.com, *.aptivepestcontrol.com, *.porenta.us)
- ✅ HTTPS/SSL everywhere (Let's Encrypt in production, ACM on AWS)
- ✅ Secrets stored in AWS Secrets Manager (Fargate deployment)
- ✅ RDS in private subnet with security groups
- ✅ Okta OIDC authentication via NextAuth.js
- ✅ IAM roles for ECS task execution
- ✅ SSL required for RDS connections
- ✅ Health check endpoints don't expose sensitive data

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in docker-compose-local.yml
```

### Docker Build Fails
```bash
# Clean Docker cache
docker system prune -a
npm run docker:local:clean

# Rebuild from scratch
npm run docker:local
```

### Database Connection Fails
```bash
# Check environment variables
docker compose -f docker-compose-local.yml exec python-api env | grep RDS

# Test connection
docker compose -f docker-compose-local.yml exec python-api python test_db.py

# Check RDS security group allows connections from ECS/EC2
```

### API Returns 404
```bash
# Check nginx routing
docker compose -f docker-compose-local.yml logs nginx

# Test API directly
curl http://localhost:8000/bi/query?report_id=kpi-summary

# Verify Next.js rewrites in next.config.js
```

## Contributing

This is a production application. Follow these guidelines:

1. **Branch Strategy**: Create feature branches from `main`
2. **Code Style**:
   - Python: PEP 8
   - TypeScript: ESLint config
   - Run `npm run lint` before committing
3. **Testing**: Add tests for new features
4. **Documentation**: Update README for significant changes
5. **Security**: Never commit secrets or credentials

## Additional Documentation

- [`CLAUDE.md`](CLAUDE.md) - Developer guide for Claude Code
- [`DEPLOYMENT_STRATEGY.md`](DEPLOYMENT_STRATEGY.md) - Comprehensive deployment guide
- [`DOCKER_LOCAL_QUICKSTART.md`](DOCKER_LOCAL_QUICKSTART.md) - Quick Docker Desktop setup
- [`DOCKER_LOCAL_SETUP.md`](DOCKER_LOCAL_SETUP.md) - Detailed Docker local guide
- [`DEPLOY.md`](DEPLOY.md) - Production deployment instructions
- [`README-DOCKER.md`](README-DOCKER.md) - Docker configuration details

## License

ISC

---

**Live Instance:** https://data.porenta.us (behind Okta - internal use only)
