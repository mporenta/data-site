# BI Web App - Docker Deployment Guide

Complete guide for deploying the BI Web Application using Docker with production-ready SSL certificates via Let's Encrypt.

## Architecture Overview

This application uses a **dual-server architecture** containerized with Docker:

- **Python FastAPI Backend** (port 8000) - Serves data via REST API
- **Next.js Frontend** (port 3000) - Server-side rendered React application
- **Nginx Reverse Proxy** (ports 80/443) - Handles SSL termination and routing
- **Certbot** - Automated SSL certificate management

### Container Communication

```
Internet → Nginx (443/80) → Next.js (3000) ┐
                          → Python API (8000)┘
```

All containers communicate through a custom Docker network (`app-network`). Nginx routes:
- `/api/*` requests → Python FastAPI backend
- All other requests → Next.js frontend

## Prerequisites

Before deploying, ensure you have:

- **Server**: Ubuntu 20.04+ or similar Linux distribution
- **Docker**: Version 20.10+ installed
- **Docker Compose**: Version 2.0+ installed
- **Domain**: DNS A record pointing to your server's IP address
- **Firewall**: Ports 80 and 443 open for incoming traffic
- **Resources**: At least 2GB RAM and 20GB disk space

### DNS Configuration

**Important**: This deployment uses **basic DNS** (not Cloudflare proxy).

Set up an A record in your DNS provider:
```
Type: A
Name: data (creates data.porenta.us)
Value: YOUR_SERVER_IP_ADDRESS
TTL: 3600 (or auto)
```

Verify DNS propagation:
```bash
dig data.porenta.us
# Should return your server's IP address
```

## Quick Start

### 1. Install Docker

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose plugin
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version
```

**Important**: Log out and back in for group membership to take effect.

### 2. Clone and Configure

```bash
# Navigate to your project directory
cd /path/to/bi_web_app

# Copy environment template
cp .env.example .env

# Edit environment variables
nano .env
```

Update `.env` with your actual values:
```bash
DOMAIN=data.porenta.us
EMAIL=your-email@example.com
STAGING=0  # Use 1 for testing, 0 for production

NEXT_PUBLIC_API_URL=https://data.porenta.us/api

# Snowflake credentials (if using)
SNOWFLAKE_ACCOUNT=your-account.region
SNOWFLAKE_USER=your-username
# ... etc
```

### 3. Build Docker Images

```bash
# Build all images
docker compose build

# Or use npm script
npm run docker:build
```

This creates two custom images:
- `bi-nextjs:latest` - Frontend application (~227MB)
- `bi-python-api:latest` - Backend API (~450MB)

### 4. Initialize SSL Certificates

**First time only** - obtain Let's Encrypt certificates:

```bash
# Run the SSL initialization script
./init-letsencrypt.sh
```

The script will:
1. Create a dummy certificate
2. Start Nginx temporarily
3. Request real certificates from Let's Encrypt
4. Reload Nginx with production certificates

**Testing First?** Set `STAGING=1` in `.env` to avoid rate limits.

### 5. Start All Services

```bash
# Start in detached mode
docker compose up -d

# Or use npm script
npm run docker:up

# Check status
docker compose ps
```

Expected output:
```
NAME                    STATUS              PORTS
certbot-ssl             Up (healthy)
nextjs-production       Up (healthy)
nginx-proxy             Up (healthy)        0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
python-api-production   Up (healthy)
```

### 6. Verify Deployment

```bash
# Check all containers are healthy
docker compose ps

# View logs
docker compose logs -f

# Test health endpoints
curl http://localhost/health
curl https://data.porenta.us/api/health

# Access the application
open https://data.porenta.us
```

## Docker Commands Reference

### NPM Scripts

```bash
npm run docker:build      # Build all images
npm run docker:up         # Start all containers
npm run docker:down       # Stop all containers
npm run docker:logs       # Follow logs
npm run docker:ps         # Show container status
npm run docker:restart    # Restart all containers
npm run docker:rebuild    # Rebuild and restart
npm run docker:clean      # Stop and remove volumes
```

### Docker Compose Commands

```bash
# Build specific service
docker compose build nextjs
docker compose build python-api

# View logs for specific service
docker compose logs -f nextjs
docker compose logs -f python-api
docker compose logs -f nginx

# Restart specific service
docker compose restart nextjs

# Execute command in container
docker compose exec nextjs sh
docker compose exec python-api bash

# Check resource usage
docker stats
```

## SSL Certificate Management

### Automatic Renewal

Certbot automatically checks for certificate renewal every 12 hours. Certificates are renewed 30 days before expiration.

```bash
# Check certificate status
docker compose exec certbot certbot certificates

# Test renewal (dry run)
docker compose exec certbot certbot renew --dry-run

# Force renewal (if needed)
docker compose exec certbot certbot renew --force-renewal
docker compose exec nginx nginx -s reload
```

### Certificate Locations

Certificates are stored in Docker volumes:
- **Volume**: `bi_web_app_certbot-etc`
- **Location**: `/etc/letsencrypt/live/data.porenta.us/`
- **Files**:
  - `fullchain.pem` - Full certificate chain
  - `privkey.pem` - Private key
  - `chain.pem` - Intermediate certificates

## Application Updates

### Updating Next.js Frontend

```bash
# Make code changes to app/ directory

# Rebuild and restart
docker compose up -d --build nextjs

# Or use npm script
npm run docker:rebuild
```

### Updating Python API

```bash
# Make code changes to api/ directory

# Rebuild and restart
docker compose up -d --build python-api
```

### Updating Both Services

```bash
# Rebuild everything
docker compose up -d --build

# Or
npm run docker:rebuild
```

## Troubleshooting

### Containers Won't Start

```bash
# Check logs
docker compose logs

# Check specific service
docker compose logs nextjs
docker compose logs python-api

# Verify network
docker network ls
docker network inspect bi_web_app_app-network
```

### SSL Certificate Issues

**Error**: "Certificate not found"
```bash
# Re-run SSL initialization
./init-letsencrypt.sh
```

**Error**: "Rate limit exceeded"
```bash
# Use staging environment
# Set STAGING=1 in .env and re-run
./init-letsencrypt.sh
```

**Error**: "Connection refused on port 80"
```bash
# Check firewall
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### API Connection Issues

**Next.js can't connect to Python API**:

```bash
# Check if API is healthy
docker compose exec nextjs curl http://python-api:8000/health

# Check Docker network
docker network inspect bi_web_app_app-network

# Verify environment variable
docker compose exec nextjs env | grep API_URL
```

### 502 Bad Gateway

This means Nginx can't reach the backend services:

```bash
# Check service health
docker compose ps

# Restart unhealthy services
docker compose restart nextjs
docker compose restart python-api

# Check Nginx configuration
docker compose exec nginx nginx -t
```

### Port Already in Use

```bash
# Find process using port 80 or 443
sudo lsof -ti:80 | xargs kill -9
sudo lsof -ti:443 | xargs kill -9

# Restart Docker services
docker compose down
docker compose up -d
```

## Monitoring and Maintenance

### Daily Tasks

```bash
# Check container status
docker compose ps

# Check logs for errors
docker compose logs --tail=100 | grep -i error

# Check certificate expiration
docker compose exec certbot certbot certificates
```

### Weekly Tasks

```bash
# Update base images
docker compose pull

# Rebuild with updates
docker compose up -d --build

# Clean up unused images
docker image prune -f
```

### View Resource Usage

```bash
# Real-time stats
docker stats

# Disk usage
docker system df
```

## Security Considerations

### Container Security

- ✅ Non-root users in containers
- ✅ Read-only filesystems where possible
- ✅ Minimal Linux capabilities
- ✅ Resource limits enforced
- ✅ Security headers configured

### Network Security

- ✅ Services isolated in Docker network
- ✅ Only Nginx exposes ports to host
- ✅ Internal services not accessible externally

### SSL/TLS Security

- ✅ TLS 1.2 and 1.3 only
- ✅ Strong cipher suites
- ✅ OCSP stapling enabled
- ✅ Automatic certificate renewal

### Secrets Management

**Never commit sensitive data to Git**:
- `.env` file is gitignored
- Use environment variables for secrets
- Rotate credentials regularly

## Backup and Recovery

### Backup SSL Certificates

```bash
# Create backup directory
mkdir -p ~/backups/$(date +%Y%m%d)

# Backup certificates
docker run --rm \
  -v bi_web_app_certbot-etc:/data \
  -v ~/backups/$(date +%Y%m%d):/backup \
  alpine tar czf /backup/certbot-etc.tar.gz -C /data .

# Backup configuration
tar czf ~/backups/$(date +%Y%m%d)/config.tar.gz \
  docker-compose.yml .env nginx/
```

### Restore from Backup

```bash
# Stop containers
docker compose down

# Restore certificate volume
docker run --rm \
  -v bi_web_app_certbot-etc:/data \
  -v ~/backups/YYYYMMDD:/backup \
  alpine tar xzf /backup/certbot-etc.tar.gz -C /data

# Restore configuration
tar xzf ~/backups/YYYYMMDD/config.tar.gz

# Restart
docker compose up -d
```

## Production Checklist

Before going live, verify:

- [ ] `.env` file configured with production values
- [ ] DNS A record points to server IP
- [ ] Firewall allows ports 80 and 443
- [ ] `STAGING=0` in `.env` for production certificates
- [ ] SSL certificates obtained successfully
- [ ] All containers show "Up (healthy)" status
- [ ] HTTPS works: `curl -I https://data.porenta.us`
- [ ] API accessible: `curl https://data.porenta.us/api/health`
- [ ] Application loads in browser
- [ ] Snowflake credentials configured (if using)

## Architecture Diagram

```
┌─────────────────────────────────────────────────┐
│                   Internet                       │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS/HTTP
                   ▼
         ┌─────────────────┐
         │  Nginx Proxy    │ :80, :443
         │  (SSL/TLS)      │
         └────┬───────┬────┘
              │       │
              │       │ /api/*
              │       │
              │       ▼
              │  ┌────────────────┐
              │  │  Python API    │ :8000
              │  │  (FastAPI)     │
              │  └────────────────┘
              │
              │ /*
              ▼
         ┌────────────────┐
         │   Next.js      │ :3000
         │   (Frontend)   │
         └────────────────┘
```

## Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)

## Support

For issues specific to this deployment:
1. Check container logs: `docker compose logs`
2. Verify configuration files
3. Review this documentation
4. Check Docker and system logs

For application issues:
- See main README.md
- Review CLAUDE.md for architecture details
