# Local Docker Desktop Setup

This guide explains how to run the application on your local machine using Docker Desktop.

## Prerequisites

1. **Docker Desktop** installed and running
   - [Download for Mac](https://www.docker.com/products/docker-desktop/)
   - [Download for Windows](https://www.docker.com/products/docker-desktop/)
   - [Download for Linux](https://docs.docker.com/desktop/install/linux-install/)

2. **Git** (to clone the repository)

## Quick Start

### 1. Copy Environment File

```bash
# Copy the example environment file
cp .env.local.example .env.local

# No need to edit - defaults work with CSV mock data
```

### 2. Build and Start Services

```bash
# Build and start all services
docker compose -f docker-compose-local.yml --env-file .env.local up -d --build

# First build takes 2-3 minutes
# Subsequent builds are faster (uses cache)
```

### 3. Access the Application

**Three ways to access:**

| Method | URL | Use Case |
|--------|-----|----------|
| **Via Nginx (recommended)** | http://localhost | Production-like setup |
| **Next.js directly** | http://localhost:3000 | Frontend debugging |
| **Python API directly** | http://localhost:8000 | API testing |
| **API Documentation** | http://localhost:8000/docs | Interactive API docs |

### 4. Verify It's Working

```bash
# Check container status (all should be "healthy")
docker compose -f docker-compose-local.yml ps

# View logs
docker compose -f docker-compose-local.yml logs -f

# Test API health
curl http://localhost:8000/health

# Test Next.js health
curl http://localhost:3000/api/health
```

## Container Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Your Browser                     │
└──────────────┬──────────────────────────────────────┘
               │
     ┌─────────┼─────────┬─────────────┐
     │         │         │             │
     ↓         ↓         ↓             ↓
  :80       :3000     :8000      :8000/docs
     │         │         │             │
┌────┴────┐ ┌─┴──────┐ ┌┴──────────┐  │
│  Nginx  │ │ Next.js│ │Python API │  │
│  (HTTP) │ │Frontend│ │ Backend   │←─┘
└─────────┘ └────────┘ └───────────┘
     │          │            │
     │          ↓            │
     │     Server-side       │
     │      fetch() ─────────┘
     │          │
     └──────────┴── Docker Network (app-network)
```

## Common Commands

### Start/Stop Services

```bash
# Start services (if already built)
docker compose -f docker-compose-local.yml --env-file .env.local up -d

# Stop services (keeps containers)
docker compose -f docker-compose-local.yml stop

# Stop and remove containers
docker compose -f docker-compose-local.yml down

# Stop and remove everything (including images)
docker compose -f docker-compose-local.yml down --rmi all --volumes
```

### View Logs

```bash
# All services
docker compose -f docker-compose-local.yml logs -f

# Specific service
docker compose -f docker-compose-local.yml logs -f nextjs
docker compose -f docker-compose-local.yml logs -f python-api
docker compose -f docker-compose-local.yml logs -f nginx

# Last 50 lines
docker compose -f docker-compose-local.yml logs --tail=50 nextjs
```

### Rebuild Services

```bash
# Rebuild everything
docker compose -f docker-compose-local.yml up -d --build

# Rebuild specific service
docker compose -f docker-compose-local.yml up -d --build nextjs
docker compose -f docker-compose-local.yml up -d --build python-api

# Force rebuild (no cache)
docker compose -f docker-compose-local.yml build --no-cache
```

### Access Container Shell

```bash
# Next.js container
docker exec -it nextjs-local sh

# Python API container
docker exec -it python-api-local sh

# Nginx container
docker exec -it nginx-local sh
```

## Development Workflow

### Option 1: Direct Access (Faster Development)

Access services directly on their ports:
- **Frontend**: http://localhost:3000
- **API**: http://localhost:8000

**Pros:**
- Faster (no nginx routing)
- Easier debugging (see real ports)
- Can disable nginx container

**To disable nginx:**
```bash
# Comment out the nginx service in docker-compose-local.yml
# Then restart:
docker compose -f docker-compose-local.yml up -d
```

### Option 2: Via Nginx (Production-like)

Access through nginx on port 80:
- **Application**: http://localhost

**Pros:**
- Tests production routing
- Tests nginx configuration
- Single entry point

### Option 3: Hybrid Development

Keep Docker running for the API, but run Next.js locally:

```bash
# Start only the Python API
docker compose -f docker-compose-local.yml up -d python-api

# In another terminal, run Next.js locally
npm run dev  # Runs on localhost:3000

# Next.js will use rewrites to proxy /api/* to localhost:8000
```

**Pros:**
- Fast Next.js hot reload
- Docker API stability
- Best of both worlds

## Troubleshooting

### Port Already in Use

If you get an error like "port 3000 is already allocated":

```bash
# Check what's using the port
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Stop the conflicting service, or change ports in docker-compose-local.yml
```

### Container Won't Start

```bash
# Check logs for the specific service
docker compose -f docker-compose-local.yml logs python-api
docker compose -f docker-compose-local.yml logs nextjs

# Check container status
docker compose -f docker-compose-local.yml ps

# Restart services
docker compose -f docker-compose-local.yml restart
```

### "ECONNREFUSED" Errors

This means Next.js can't reach the Python API:

```bash
# 1. Check API is running
docker compose -f docker-compose-local.yml ps python-api

# 2. Check API health
docker exec python-api-local curl http://localhost:8000/health

# 3. Check network connectivity
docker exec nextjs-local wget -qO- http://python-api:8000/health

# 4. Restart services
docker compose -f docker-compose-local.yml restart
```

### Stale Data / Cache Issues

```bash
# Clear Next.js cache
docker compose -f docker-compose-local.yml exec nextjs rm -rf /app/.next/cache

# Rebuild without cache
docker compose -f docker-compose-local.yml build --no-cache nextjs

# Full clean rebuild
docker compose -f docker-compose-local.yml down
docker compose -f docker-compose-local.yml up -d --build --force-recreate
```

### Docker Desktop Out of Memory/Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# See disk usage
docker system df

# Increase Docker Desktop resources:
# Docker Desktop → Settings → Resources → Increase Memory/CPU
```

## Data & Configuration

### Using CSV Mock Data (Default)

The application works out of the box with CSV mock data:
- Located in: `api/data/*.csv`
- No database setup required
- Perfect for local testing

### Using Real Database (Optional)

To connect to Snowflake or AWS RDS:

1. Edit `.env.local`:
```bash
# For Snowflake
SNOWFLAKE_ACCOUNT=your-account.region
SNOWFLAKE_USER=your-username
SNOWFLAKE_PASSWORD=your-password
# ... etc

# Or for AWS RDS (future)
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_DATABASE=your-database
# ... etc
```

2. Update `api/routers/bi_query.py` to query the database instead of CSV

3. Rebuild:
```bash
docker compose -f docker-compose-local.yml up -d --build python-api
```

## Performance Tips

### Speed Up Rebuilds

1. **Use Docker BuildKit** (enabled by default in Docker Desktop)

2. **Only rebuild what changed**:
```bash
# Only rebuild Python API if you changed Python code
docker compose -f docker-compose-local.yml up -d --build python-api

# Only rebuild Next.js if you changed frontend code
docker compose -f docker-compose-local.yml up -d --build nextjs
```

3. **Use `.dockerignore`** (already configured)
   - Excludes `node_modules`, `.git`, etc.
   - Speeds up build context transfer

### Optimize Docker Desktop

1. **Settings → Resources**:
   - Memory: At least 4GB (8GB recommended)
   - CPUs: At least 2 cores (4+ recommended)
   - Disk: At least 60GB

2. **Settings → Docker Engine**:
   - Enable "Use containerd for pulling and storing images"
   - Enable "Use BuildKit"

## Differences from Production

| Feature | Local (docker-compose-local.yml) | Production (docker-compose.yml) |
|---------|----------------------------------|----------------------------------|
| **SSL/HTTPS** | ❌ HTTP only | ✅ HTTPS with Let's Encrypt |
| **Ports** | Exposed (3000, 8000) | Internal only |
| **Certbot** | ❌ Not included | ✅ Auto-renewal |
| **Security** | Relaxed | Hardened (read-only, cap_drop) |
| **Domain** | localhost | data.porenta.us |
| **Resource Limits** | ❌ None | ✅ CPU/Memory limits |
| **Nginx** | Optional/Simplified | Required |

## Clean Up

When you're done developing:

```bash
# Stop services (keeps data)
docker compose -f docker-compose-local.yml down

# Remove everything including images
docker compose -f docker-compose-local.yml down --rmi all --volumes

# Clean up all Docker resources
docker system prune -a --volumes
```

## Getting Help

### Check Application Status

```bash
# Container health
docker compose -f docker-compose-local.yml ps

# Recent logs
docker compose -f docker-compose-local.yml logs --tail=100

# Resource usage
docker stats
```

### Test Endpoints

```bash
# API health
curl http://localhost:8000/health

# Get dashboard data
curl http://localhost:8000/bi/query?report_id=kpi-summary

# Next.js health
curl http://localhost:3000/api/health

# Test Nginx
curl http://localhost/api/health
```

### Useful Docker Commands

```bash
# List all containers
docker ps -a

# List all images
docker images

# Remove stopped containers
docker container prune

# Remove unused images
docker image prune -a

# View disk usage
docker system df

# Restart Docker Desktop
# Mac: Click Docker icon → Quit Docker Desktop → Reopen
# Windows: Right-click Docker icon → Quit → Reopen
```

## Next Steps

- Read `ARCHITECTURE_CHANGES.md` to understand the Server Components implementation
- Read `PRODUCTION_FIX.md` to understand the URL routing fix
- Check `README.md` for project overview
- Run `npm run lint` to check code quality

Happy coding! 🚀
