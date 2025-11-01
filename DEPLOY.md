# Quick Deployment Guide for data.porenta.us

Server IP: **159.203.114.230**

## Pre-Deployment Checklist

1. **DNS Configuration** ✓
   - Create A record: `data.porenta.us` → `159.203.114.230`
   - Wait for DNS propagation (check with `dig data.porenta.us`)

2. **Server Access** ✓
   - SSH access to 159.203.114.230
   - Docker and Docker Compose installed

3. **Firewall** ✓
   - Port 80 (HTTP) open
   - Port 443 (HTTPS) open

## Deployment Steps

### 1. Connect to Server

```bash
ssh user@159.203.114.230
```

### 2. Transfer Files

From your local machine:
```bash
# Create tarball (exclude node_modules, .next, etc.)
tar czf bi_web_app.tar.gz \
  --exclude='node_modules' \
  --exclude='.next' \
  --exclude='venv' \
  --exclude='.env.local' \
  bi_web_app/

# Transfer to server
scp bi_web_app.tar.gz user@159.203.114.230:~/

# On server, extract
ssh user@159.203.114.230
cd ~
tar xzf bi_web_app.tar.gz
cd bi_web_app
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit with your values
nano .env
```

**Required values in `.env`:**
```bash
DOMAIN=data.porenta.us
EMAIL=your-email@example.com
STAGING=0  # Use 1 for testing first!

NEXT_PUBLIC_API_URL=https://data.porenta.us/api

# Add Snowflake credentials if using
SNOWFLAKE_ACCOUNT=...
SNOWFLAKE_USER=...
SNOWFLAKE_PASSWORD=...
# etc.
```

### 4. Build Images

```bash
# Build both services
docker compose build

# Verify images created
docker images | grep bi-
```

### 5. Initialize SSL

**First time only:**
```bash
# Test with staging first (recommended)
# Set STAGING=1 in .env, then:
./init-letsencrypt.sh

# If successful, switch to production
# Set STAGING=0 in .env, then:
./init-letsencrypt.sh
```

### 6. Start Services

```bash
# Start all containers
docker compose up -d

# Check status (all should be "Up (healthy)")
docker compose ps

# Follow logs
docker compose logs -f
```

### 7. Verify Deployment

```bash
# Test HTTP → HTTPS redirect
curl -I http://data.porenta.us

# Test HTTPS
curl -I https://data.porenta.us

# Test API health
curl https://data.porenta.us/api/health

# Test Python API directly
curl https://data.porenta.us/api/bi/metadata
```

### 8. Browser Test

Open in browser:
- https://data.porenta.us (should show BI Dashboard)
- https://data.porenta.us/api/docs (FastAPI Swagger UI)

## Troubleshooting

### DNS Not Resolving
```bash
# Check DNS propagation
dig data.porenta.us

# Should return: 159.203.114.230
```

### SSL Certificate Fails
```bash
# Check port 80 is accessible
curl http://data.porenta.us/.well-known/acme-challenge/test

# Check Certbot logs
docker compose logs certbot

# Try staging first
# Edit .env: STAGING=1
./init-letsencrypt.sh
```

### Containers Unhealthy
```bash
# Check logs
docker compose logs python-api
docker compose logs nextjs

# Restart specific service
docker compose restart python-api
docker compose restart nextjs
```

### 502 Bad Gateway
```bash
# Check service connectivity
docker compose exec nginx ping python-api
docker compose exec nginx ping nextjs

# Restart all services
docker compose restart
```

## Monitoring

```bash
# Check container status
docker compose ps

# View logs
docker compose logs -f

# Check resource usage
docker stats

# Check certificate expiration
docker compose exec certbot certbot certificates
```

## Updating Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose up -d --build

# Or update specific service
docker compose up -d --build nextjs
docker compose up -d --build python-api
```

## Stopping Services

```bash
# Stop all containers
docker compose down

# Stop and remove volumes (clean slate)
docker compose down -v
```

## Server Information

- **IP Address**: 159.203.114.230
- **Domain**: data.porenta.us
- **SSL**: Let's Encrypt (auto-renewal)
- **Services**:
  - Nginx: ports 80, 443
  - Next.js: internal port 3000
  - Python API: internal port 8000
  - Certbot: SSL management

## Next Steps After Deployment

1. **Configure Snowflake** (if not using CSV):
   - Update `.env` with Snowflake credentials
   - Restart Python API: `docker compose restart python-api`

2. **Set up monitoring**:
   - Configure log aggregation
   - Set up uptime monitoring
   - Configure certificate expiration alerts

3. **Enable backups**:
   - Backup SSL certificates
   - Backup configuration files
   - Backup Docker volumes

4. **Security hardening**:
   - Configure firewall rules
   - Set up fail2ban
   - Enable automatic security updates

For detailed documentation, see README-DOCKER.md
