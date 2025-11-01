# Next.js Dashboard Deployment with Docker Compose

This guide provides production-ready instructions for deploying a Next.js 15 dashboard application using Docker Compose with three containers: Nginx reverse proxy, Certbot for SSL management, and the Next.js application. **The setup achieves end-to-end encryption with Cloudflare Full (strict) SSL mode and Let's Encrypt certificates, automatic SSL renewal, and enterprise-grade security configurations.**

The architecture separates concerns with isolated containers: Nginx handles HTTPS termination and reverse proxying with A+ SSL configuration, Certbot manages automated certificate lifecycle with 12-hour renewal checks, and Next.js runs in standalone mode for optimal performance and 85% reduced image size. This configuration supports the subdomain data.porenta.us with Cloudflare DNS proxy enabled, ensuring true end-to-end encryption from visitor to origin server.

## Architecture overview

### System components

The deployment uses a three-container architecture orchestrated by Docker Compose. **Nginx** serves as the reverse proxy, terminating SSL/TLS connections with Let's Encrypt certificates and forwarding traffic to the Next.js application. **Certbot** runs continuously, checking certificate expiration every 12 hours and automatically renewing certificates 30 days before expiration. **Next.js 15** runs in standalone mode with multi-stage builds, reducing the production image from ~1GB to ~110-227MB while maintaining full functionality.

All containers communicate through a custom bridge network called `app-network`, enabling service discovery by name. Nginx exposes ports 80 and 443 to the host, while the Next.js application runs on internal port 3000, accessible only within the Docker network. Three named volumes persist SSL certificates, Let's Encrypt metadata, and ACME challenge files, ensuring certificate data survives container restarts and is shared between Nginx and Certbot.

### Network traffic flow

External traffic arrives at Cloudflare's edge network, which proxies requests to your origin server's port 443. Nginx receives these requests, validates them against security headers and rate limits, then forwards to the Next.js container on port 3000. The Next.js application processes requests and returns responses through the same path. For Let's Encrypt validation, Certbot writes ACME challenge files to `/var/www/certbot`, which Nginx serves directly for the `/.well-known/acme-challenge/` path without proxying to Next.js.

Cloudflare Full (strict) mode requires valid SSL certificates on the origin server. Let's Encrypt provides free, automated certificates that Cloudflare fully recognizes and trusts. The visitor sees Cloudflare's Universal SSL certificate, while Cloudflare validates your origin's Let's Encrypt certificate on every connection, ensuring true end-to-end encryption with no man-in-the-middle vulnerabilities.

## Complete docker-compose.yml configuration

```yaml
version: '3.8'

services:
  # Next.js Application Service
  nextjs:
    build:
      context: ./app
      dockerfile: Dockerfile
      args:
        - NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
    container_name: nextjs-production
    image: nextjs-dashboard:latest
    restart: unless-stopped
    networks:
      - app-network
    environment:
      - NODE_ENV=production
      - PORT=3000
      - HOSTNAME=0.0.0.0
    expose:
      - "3000"
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    read_only: true
    tmpfs:
      - /tmp
      - /app/.next/cache
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Nginx Reverse Proxy Service
  nginx:
    image: nginx:1.25-alpine
    container_name: nginx-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      nextjs:
        condition: service_healthy
    networks:
      - app-network
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/conf.d:/etc/nginx/conf.d:ro
      - certbot-etc:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot:ro
      - nginx-logs:/var/log/nginx
    command: '/bin/sh -c ''while :; do sleep 6h & wait $${!}; nginx -s reload; done & nginx -g "daemon off;"'''
    environment:
      - DOMAIN=${DOMAIN}
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
    security_opt:
      - no-new-privileges:true
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
    read_only: true
    tmpfs:
      - /var/run
      - /var/cache/nginx
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Certbot Service for SSL Management
  certbot:
    image: certbot/certbot:latest
    container_name: certbot-ssl
    restart: unless-stopped
    depends_on:
      - nginx
    volumes:
      - certbot-etc:/etc/letsencrypt
      - certbot-var:/var/lib/letsencrypt
      - certbot-www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew --quiet; sleep 12h & wait $${!}; done;'"
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

networks:
  app-network:
    driver: bridge

volumes:
  certbot-etc:
    driver: local
  certbot-var:
    driver: local
  certbot-www:
    driver: local
  nginx-logs:
    driver: local
```

### Environment variables configuration

Create a `.env` file in your project root:

```bash
# Domain configuration
DOMAIN=data.porenta.us
EMAIL=your-email@example.com

# Next.js public variables (build-time)
NEXT_PUBLIC_API_URL=https://api.example.com

# Next.js server variables (runtime)
DATABASE_URL=postgresql://user:password@host:5432/dbname
API_SECRET_KEY=your-secret-key-here

# Let's Encrypt staging (set to 1 for testing)
STAGING=0
```

**Important**: NEXT_PUBLIC_ variables are inlined at build time and cannot be changed at runtime. Server-side variables can be injected when starting containers.

## Nginx configuration files

### Main configuration (nginx/nginx.conf)

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging format
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance optimization
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;
    server_tokens off;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Timeouts and limits
    client_body_timeout 10s;
    client_header_timeout 10s;
    send_timeout 10s;

    # Include site configurations
    include /etc/nginx/conf.d/*.conf;
}
```

### Site configuration (nginx/conf.d/default.conf)

```nginx
# Upstream definition for Next.js
upstream nextjs {
    server nextjs:3000;
    keepalive 64;
}

# Rate limiting zones
limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=api:10m rate=5r/s;
limit_conn_zone $binary_remote_addr zone=conn_limit:10m;

# HTTP Server - Redirect to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name data.porenta.us;
    server_tokens off;

    # ACME Challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    # Health check endpoint
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server - Main Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name data.porenta.us;
    server_tokens off;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/data.porenta.us/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/data.porenta.us/privkey.pem;
    
    # SSL Protocols - TLS 1.2 and 1.3 only
    ssl_protocols TLSv1.2 TLSv1.3;
    
    # Cipher suites (Mozilla Intermediate)
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305';
    ssl_prefer_server_ciphers off;
    
    # Session settings
    ssl_session_cache shared:SSL:50m;
    ssl_session_timeout 1d;
    ssl_session_tickets off;
    
    # DH parameters
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # OCSP Stapling
    ssl_stapling on;
    ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/data.porenta.us/chain.pem;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), camera=(), microphone=()" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'self';" always;

    # Connection limits
    limit_conn conn_limit 10;

    # Next.js static assets with cache headers
    location /_next/static {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Next.js images
    location /_next/image {
        proxy_pass http://nextjs;
        add_header Cache-Control "public, max-age=3600";
    }

    # API endpoints with stricter rate limiting
    location /api/ {
        limit_req zone=api burst=10 nodelay;
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        proxy_buffering on;
        proxy_cache_bypass $http_upgrade;
    }

    # ACME Challenge (needed in HTTPS too)
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
        allow all;
    }

    # Main application proxy
    location / {
        limit_req zone=general burst=20 delay=8;
        
        proxy_pass http://nextjs;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # Buffering
        proxy_buffering on;
        proxy_cache_bypass $http_upgrade;
        proxy_redirect off;
    }
}
```

## Next.js production Dockerfile

Create this file at `app/Dockerfile`:

```dockerfile
# syntax=docker/dockerfile:1

# Base stage
FROM node:20-alpine AS base
ARG PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app
RUN apk add --no-cache libc6-compat

# Dependencies stage
FROM base AS dependencies
COPY package.json package-lock.json ./
RUN npm ci --only=production && \
    cp -R node_modules /tmp/prod_node_modules && \
    npm ci

# Build stage
FROM base AS builder
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NODE_ENV=production

RUN npm run build

# Runner stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN apk add --no-cache curl && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create cache directory
RUN mkdir -p .next/cache && \
    chown -R nextjs:nodejs .next

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]
```

### Next.js configuration (app/next.config.js)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  
  // Image optimization
  images: {
    domains: ['your-cdn-domain.com'],
    unoptimized: false,
  },
  
  // Custom headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          }
        ],
      },
    ]
  },
}

module.exports = nextConfig
```

### Health check API route (app/pages/api/health.ts or app/app/api/health/route.ts)

**Pages Router** (`app/pages/api/health.ts`):

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.status(200).json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}
```

**App Router** (`app/app/api/health/route.ts`):

```typescript
export async function GET() {
  return Response.json({ 
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  })
}
```

### Docker ignore file (app/.dockerignore)

```
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git
.gitignore
.jest_cache
.vscode
.env*
!.env.example
.DS_Store
*.log
coverage
dist
.cache
.vercel
```

## Step-by-step deployment instructions

### Prerequisites checklist

Before starting deployment, ensure you have:

- Server with Ubuntu 20.04+ or similar Linux distribution
- Docker 20.10+ and Docker Compose 2.0+ installed
- Domain name (porenta.us) with access to DNS management
- Server firewall allows inbound traffic on ports 80 and 443
- SSH access to the server with sudo privileges
- At least 2GB RAM and 20GB disk space available

### Initial server setup

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Verify installations
docker --version
docker compose version

# Configure firewall (UFW example)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

### Project structure setup

```bash
# Create project directory
mkdir -p ~/nextjs-dashboard
cd ~/nextjs-dashboard

# Create directory structure
mkdir -p app nginx/conf.d certbot/conf certbot/www secrets

# Create .env file
cat > .env << 'EOF'
DOMAIN=data.porenta.us
EMAIL=your-email@example.com
NEXT_PUBLIC_API_URL=https://api.example.com
STAGING=0
EOF

# Set proper permissions
chmod 600 .env
```

Copy your Next.js application code to the `app/` directory, then create the configuration files shown in previous sections.

### SSL certificate initialization script

Create `init-letsencrypt.sh`:

```bash
#!/bin/bash

set -e

# Configuration
domains=(data.porenta.us)
rsa_key_size=4096
data_path="./certbot"
email="your-email@example.com"
staging=0  # Set to 1 for staging

if ! [ -x "$(command -v docker)" ]; then
  echo 'Error: docker is not installed.' >&2
  exit 1
fi

# Create directory structure
mkdir -p "$data_path/conf/live/$domains"
mkdir -p "$data_path/www"

# Download recommended TLS parameters
if [ ! -e "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -e "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "### Downloading recommended TLS parameters..."
  mkdir -p "$data_path/conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -s https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

# Create dummy certificate for initial Nginx startup
echo "### Creating dummy certificate for $domains..."
path="/etc/letsencrypt/live/$domains"
mkdir -p "$data_path/conf/live/$domains"
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1\
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

# Start nginx with dummy certificate
echo "### Starting nginx..."
docker compose up --force-recreate -d nginx
echo

# Wait for nginx to start
echo "### Waiting for nginx to start..."
sleep 10

# Delete dummy certificate
echo "### Deleting dummy certificate for $domains..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/$domains && \
  rm -Rf /etc/letsencrypt/archive/$domains && \
  rm -Rf /etc/letsencrypt/renewal/$domains.conf" certbot
echo

# Request Let's Encrypt certificate
echo "### Requesting Let's Encrypt certificate for $domains..."
domain_args=""
for domain in "${domains[@]}"; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal \
    --non-interactive" certbot
echo

# Reload nginx with real certificate
echo "### Reloading nginx..."
docker compose exec nginx nginx -s reload
echo

echo "### Certificate setup complete!"
echo "### You can now access your site at https://$domains"
```

Make the script executable:

```bash
chmod +x init-letsencrypt.sh
```

### Deployment execution

```bash
# 1. Build Next.js application
cd ~/nextjs-dashboard
docker compose build nextjs

# 2. Initialize SSL certificates
./init-letsencrypt.sh

# 3. Start all services
docker compose up -d

# 4. Verify all containers are running
docker compose ps

# 5. Check logs
docker compose logs -f

# 6. Test the application
curl -I https://data.porenta.us
```

### Post-deployment verification

```bash
# Check container health
docker compose ps

# View individual service logs
docker compose logs nginx
docker compose logs nextjs
docker compose logs certbot

# Test certificate
openssl s_client -connect data.porenta.us:443 -servername data.porenta.us < /dev/null

# Check certificate expiration
docker compose exec certbot certbot certificates

# Test renewal process (dry run)
docker compose exec certbot certbot renew --dry-run

# Verify Nginx configuration
docker compose exec nginx nginx -t
```

## SSL certificate generation and renewal

### Initial certificate generation

The `init-letsencrypt.sh` script handles initial certificate generation through these steps:

**Phase 1 - Dummy certificate creation**: Creates a self-signed certificate valid for one day, allowing Nginx to start successfully even though it references certificate paths that don't exist yet. This solves the chicken-and-egg problem where Nginx needs certificates to start, but Let's Encrypt needs Nginx running to validate domain ownership.

**Phase 2 - Nginx startup**: Starts Nginx with the dummy certificate, making the server accessible on port 80 for Let's Encrypt validation. The server must respond to HTTP requests on `/.well-known/acme-challenge/` for the ACME protocol to verify domain ownership.

**Phase 3 - Real certificate request**: Removes the dummy certificate and requests a real certificate from Let's Encrypt using the webroot method. Certbot writes challenge files to `/var/www/certbot`, which Nginx serves directly, completing the ACME HTTP-01 challenge validation.

**Phase 4 - Production activation**: Reloads Nginx to use the newly issued Let's Encrypt certificate, completing the SSL setup.

### Automatic renewal process

The Certbot container runs continuously with automatic renewal built-in. The entrypoint command `certbot renew` runs every 12 hours, checking all certificates for expiration. Let's Encrypt certificates are valid for 90 days, and Certbot automatically renews them when they have 30 days or less remaining.

**Renewal verification happens at**: 12:00 AM and 12:00 PM server time daily. If renewal succeeds, new certificates are written to the shared volume at `/etc/letsencrypt/live/data.porenta.us/`. Nginx automatically reloads every 6 hours through its command directive, picking up renewed certificates without service interruption.

**Manual renewal commands** for testing or troubleshooting:

```bash
# Dry run - test renewal without actually renewing
docker compose exec certbot certbot renew --dry-run

# Force renewal (testing only, don't use in production)
docker compose exec certbot certbot renew --force-renewal

# Check certificate details and expiration
docker compose exec certbot certbot certificates

# Manual Nginx reload after renewal
docker compose exec nginx nginx -s reload

# View renewal logs
docker compose logs certbot --tail=100
```

### Monitoring certificate expiration

Set up monitoring to alert before certificates expire:

```bash
# Create monitoring script
cat > ~/check-cert-expiry.sh << 'EOF'
#!/bin/bash
DOMAIN="data.porenta.us"
DAYS_WARNING=14

expiry_date=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
expiry_epoch=$(date -d "$expiry_date" +%s)
current_epoch=$(date +%s)
days_until_expiry=$(( ($expiry_epoch - $current_epoch) / 86400 ))

if [ $days_until_expiry -lt $DAYS_WARNING ]; then
    echo "WARNING: SSL certificate expires in $days_until_expiry days"
    # Add notification logic here (email, Slack, etc.)
fi
EOF

chmod +x ~/check-cert-expiry.sh

# Add to crontab (daily check)
(crontab -l 2>/dev/null; echo "0 6 * * * ~/check-cert-expiry.sh") | crontab -
```

### Renewal troubleshooting

**If renewal fails**, check these common issues:

Port 80 must be accessible from the internet for HTTP-01 validation. Verify with `curl http://data.porenta.us/.well-known/acme-challenge/test` from an external machine. Check firewall rules allow inbound traffic on port 80.

DNS must resolve correctly to your server's IP address. Test with `dig data.porenta.us` and verify the A record points to your server. Cloudflare proxy can interfere with HTTP-01 validation if HTTPS redirects are too aggressive.

Certificate files must have correct permissions. The Certbot container writes to volumes as root, but Nginx must be able to read them. The Docker volume sharing handles this automatically if using named volumes.

Rate limits may prevent renewal if you've requested too many certificates recently. Let's Encrypt allows 5 duplicate certificates per week and 50 certificates per domain per week. Use staging environment for testing to avoid hitting limits.

## Cloudflare configuration steps

### Understanding Full (strict) SSL mode

Cloudflare offers several SSL/TLS encryption modes. **Full (strict) is the only mode that provides true end-to-end encryption** with proper certificate validation. The traffic flow works like this: visitors connect to Cloudflare over HTTPS using Cloudflare's Universal SSL certificate, then Cloudflare connects to your origin server over HTTPS using your Let's Encrypt certificate.

**Why Full (strict) matters**: In Full mode (without strict), Cloudflare accepts any certificate including self-signed, expired, or certificates with hostname mismatches. This leaves you vulnerable to man-in-the-middle attacks. Full (strict) mode validates your origin certificate exactly like a browser would, ensuring the certificate is issued by a trusted CA, covers the correct hostname, and hasn't expired.

**Let's Encrypt compatibility**: Let's Encrypt certificates work perfectly with Cloudflare Full (strict) mode because they're issued by a publicly trusted certificate authority. Cloudflare automatically recognizes and trusts Let's Encrypt's ISRG Root X1 certificate authority. You don't need to upload your Let's Encrypt certificate to Cloudflare - the validation happens automatically during the SSL handshake.

### DNS configuration in Cloudflare

**Step 1 - Add your domain to Cloudflare**: If you haven't already, add porenta.us to Cloudflare by signing up at cloudflare.com, clicking "Add a Site", and entering your domain. Cloudflare will scan your existing DNS records and provide two nameservers.

**Step 2 - Update nameservers**: At your domain registrar (where you purchased porenta.us), update the nameservers to the two provided by Cloudflare. This typically takes 5-30 minutes to propagate globally. You can check nameserver propagation with `dig NS porenta.us`.

**Step 3 - Add subdomain DNS record**: Once nameservers are updated, go to the DNS section in Cloudflare dashboard and add an A record:

- **Type**: A
- **Name**: data (this creates data.porenta.us)
- **IPv4 address**: Your server's IP address
- **Proxy status**: Proxied (orange cloud icon)
- **TTL**: Auto

The orange cloud icon means traffic will route through Cloudflare's network, enabling all security and performance features. DNS queries will return Cloudflare's IP addresses instead of your origin server's IP, hiding your real server IP from potential attackers.

**Verification**: Test DNS resolution with `dig data.porenta.us`. You should see Cloudflare's IP addresses (like 104.21.x.x or 172.67.x.x), not your origin server's IP. This confirms the proxy is working correctly.

### SSL/TLS mode configuration

**Step 1 - Navigate to SSL settings**: In Cloudflare dashboard, select your domain, then navigate to **SSL/TLS** → **Overview**.

**Step 2 - Select Full (strict) mode**: Under "Your SSL/TLS encryption mode", select **Full (strict)**. This tells Cloudflare to validate your origin certificate on every request. **Important**: Don't set this mode until your Let's Encrypt certificate is installed and working, or your site will show Error 526.

**Step 3 - Configure edge certificates**: Go to **SSL/TLS** → **Edge Certificates** and configure:

- **Always Use HTTPS**: ON - Automatically redirects HTTP to HTTPS
- **Minimum TLS Version**: TLS 1.2 (or TLS 1.3 for maximum security)
- **TLS 1.3**: ON (enabled by default)
- **Automatic HTTPS Rewrites**: ON - Converts HTTP URLs to HTTPS
- **Certificate Transparency Monitoring**: ON - Alerts about certificate issues

**Step 4 - Optional HSTS configuration**: If you're absolutely certain you want HTTPS-only with no rollback option, enable HTTP Strict Transport Security:

- **Max Age Header**: 6 months (15768000 seconds)
- **Apply HSTS including subdomains**: Only if all subdomains support HTTPS
- **Preload**: Use with extreme caution - difficult to undo

**Warning about HSTS preload**: Once enabled and submitted to browser preload lists, it can take months to remove. Only enable if you're 100% confident your site will remain HTTPS-only permanently.

### Let's Encrypt with Cloudflare proxy

When Cloudflare proxy is enabled (orange cloud), Let's Encrypt HTTP-01 validation still works because Cloudflare forwards the `/.well-known/acme-challenge/` requests to your origin server. However, if you have aggressive HTTPS redirects or other page rules, they might interfere with validation.

**Recommended approach for HTTP-01**: The Nginx configuration provided in this guide handles the `/.well-known/acme-challenge/` path correctly, serving it from the shared Certbot volume without proxying to Next.js. Cloudflare forwards these requests to your origin on port 80, Nginx serves the challenge file, and validation completes successfully.

**Alternative DNS-01 validation**: For advanced scenarios with multiple servers or wildcard certificates, use DNS-01 challenge with Cloudflare API:

```bash
# Install Cloudflare DNS plugin for Certbot
docker compose exec certbot pip install certbot-dns-cloudflare

# Create Cloudflare credentials file
cat > ~/cloudflare.ini << 'EOF'
dns_cloudflare_api_token = your_cloudflare_api_token_here
EOF
chmod 600 ~/cloudflare.ini

# Request certificate using DNS challenge
docker compose run --rm --entrypoint "\
  certbot certonly --dns-cloudflare \
  --dns-cloudflare-credentials /cloudflare.ini \
  -d data.porenta.us \
  --agree-tos \
  --email your-email@example.com" certbot
```

DNS-01 works regardless of firewall rules or proxy settings because it validates domain ownership through DNS TXT records rather than HTTP requests.

### Verifying end-to-end encryption

After completing Cloudflare configuration, verify the entire setup:

```bash
# Test from outside your network
curl -I https://data.porenta.us

# Check SSL certificate chain
echo | openssl s_client -connect data.porenta.us:443 -servername data.porenta.us 2>/dev/null | openssl x509 -noout -text

# Test SSL grade
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=data.porenta.us
```

You should see an A or A+ rating with no certificate warnings. The SSL Labs test verifies certificate validity, protocol support, cipher strength, and potential vulnerabilities.

## Security considerations

### Nginx security hardening

The configuration provided implements **OWASP-recommended security headers** that achieve A+ ratings on security testing tools. **Strict-Transport-Security** with 2-year max-age forces HTTPS for all future visits, preventing SSL stripping attacks. The includeSubDomains directive extends this protection to all subdomains, and preload enables submission to browser preload lists for maximum protection.

**Content-Security-Policy** is the most powerful security header, controlling which resources browsers can load. The configuration allows resources only from your own domain by default, preventing cross-site scripting attacks. Adjust the policy for your specific needs - for example, if you load Google Fonts, add `font-src 'self' fonts.gstatic.com`.

**X-Frame-Options: SAMEORIGIN** prevents clickjacking attacks by blocking your site from being embedded in iframes on other domains. Use DENY if you never need iframe embedding, or remove if you intentionally want third-party embedding.

Rate limiting protects against brute force attacks and DoS attempts. The configuration limits general traffic to 10 requests per second per IP address with a burst allowance of 20 requests, and API endpoints to 5 requests per second. Connection limits restrict each IP to 10 concurrent connections maximum.

### Docker security best practices

**Never run containers as root user**. The Dockerfile creates a dedicated `nextjs` user with UID 1001 and runs the application with reduced privileges. This prevents container escape vulnerabilities from granting root access to the host system.

**Drop all Linux capabilities** and only add back specific ones needed. The configuration drops ALL capabilities and adds NET_BIND_SERVICE only for Nginx, which needs to bind to privileged ports 80 and 443. Next.js doesn't need any special capabilities since it runs on port 3000.

**Enable read-only filesystems** wherever possible to prevent runtime file modifications. The Next.js container uses `read_only: true` with tmpfs mounts for `/tmp` and cache directories that need write access. This prevents attackers from persisting malware or modifying application files.

**Set resource limits** to prevent resource exhaustion attacks. The configuration limits Next.js to 1 CPU and 1GB memory, with reservations ensuring 0.5 CPU and 512MB are always available. Without limits, a compromised container could consume all host resources.

### Environment variable and secrets management

**Never embed secrets in Docker images** because they persist in image layers even if deleted later. Anyone with access to the image can extract secrets from layer history. The `.dockerignore` file excludes `.env` files to prevent accidental inclusion.

**Use Docker secrets for sensitive data** instead of environment variables. Secrets are stored in `/run/secrets/` and only exist in memory, never written to disk. They're not visible in `docker inspect` output or process listings.

**Separate build-time and runtime variables**. Variables prefixed with `NEXT_PUBLIC_` are inlined into the JavaScript bundle at build time and visible to browsers. Server-side variables without the prefix remain secret and can only be accessed by server-side code.

For production deployments, consider external secret management services like AWS Secrets Manager, HashiCorp Vault, or Azure Key Vault. These provide rotation, auditing, and fine-grained access control.

### Network isolation and segmentation

The Docker Compose configuration uses custom networks to isolate containers. If you add a database, create a separate `backend` network that only Next.js can access, preventing direct database access from the internet even if Nginx is compromised.

**Minimize exposed ports**. Only Nginx exposes ports 80 and 443 to the host. Next.js uses `expose: 3000` which makes the port available to other containers but doesn't bind to the host network interface, making it inaccessible from outside Docker.

Consider implementing **Cloudflare IP whitelisting** at the firewall level, blocking all traffic except from Cloudflare's published IP ranges. This prevents attackers from bypassing Cloudflare protections by attacking your origin server directly.

### SSL certificate security

**Protect private keys with strict permissions**. Certificate files should be owned by root with 600 permissions (read/write for owner only). Docker named volumes handle this automatically, but if using bind mounts, verify permissions carefully.

**Never commit private keys to version control**. Add `.env`, `secrets/`, and SSL directories to `.gitignore`. If you accidentally commit secrets, consider them compromised and regenerate immediately - deleting from history isn't sufficient since repositories may have been cloned.

**Monitor certificate transparency logs** for unauthorized certificates. Cloudflare provides certificate transparency monitoring, alerting you if certificates for your domain are issued unexpectedly. This detects potential man-in-the-middle attacks or compromised certificate authorities.

### Container image security

**Use official base images** from trusted sources like Docker Hub official repositories. The configuration uses `node:20-alpine` (official Node.js image) and `nginx:1.25-alpine` (official Nginx image) to minimize supply chain risks.

**Pin specific image versions** rather than using `latest` tag. While this guide uses `latest` for simplicity, production deployments should pin exact versions like `nginx:1.25.3-alpine` to ensure reproducible builds and controlled updates.

**Scan images for vulnerabilities** in your CI/CD pipeline. Tools like Trivy, Snyk, and Docker Scout identify known CVEs in base images and dependencies:

```bash
# Scan with Trivy
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image nextjs-dashboard:latest

# Scan with Docker Scout
docker scout cves nextjs-dashboard:latest
```

**Keep images updated** with security patches. Subscribe to security advisories for Node.js, Alpine Linux, and Nginx to know when critical updates are released. Plan regular update windows to rebuild images with latest security patches.

## Troubleshooting common issues

### Error 525: SSL handshake failed

**Error 525 indicates Cloudflare cannot complete the SSL handshake with your origin server.** This happens when Full (strict) mode is enabled but your origin doesn't have a valid SSL certificate.

**Common causes and solutions**:

Certificate not installed yet - Run `./init-letsencrypt.sh` to obtain a Let's Encrypt certificate. Verify installation with `docker compose exec nginx ls -la /etc/letsencrypt/live/data.porenta.us/`.

Certificate expired - Check expiration with `docker compose exec certbot certbot certificates`. If expired, force renewal with `docker compose exec certbot certbot renew --force-renewal`, then reload Nginx.

Incorrect certificate path in Nginx - Verify `ssl_certificate` points to `fullchain.pem` not `cert.pem`. The fullchain includes the intermediate certificate required for validation. Check with `docker compose exec nginx cat /etc/nginx/conf.d/default.conf | grep ssl_certificate`.

Port 443 not accessible - Verify firewall allows inbound HTTPS with `sudo ufw status`. Test directly from origin with `curl -k https://localhost`.

SNI not working - Modern Nginx versions have SNI enabled by default, but verify your certificate includes the correct domain in SAN field with `openssl x509 -in /path/to/fullchain.pem -noout -text | grep DNS`.

**Diagnostic command to test from Cloudflare's perspective**:

```bash
# Test SSL handshake
openssl s_client -connect YOUR_SERVER_IP:443 -servername data.porenta.us

# Should show certificate chain and verification:
# Verify return code: 0 (ok)
```

If this fails, the problem is on your origin server. If it succeeds, the problem may be with Cloudflare configuration.

### Error 526: Invalid SSL certificate

**Error 526 means your origin has an SSL certificate, but it's invalid for Full (strict) mode.** Cloudflare refuses to connect because the certificate cannot be trusted.

**Common causes**:

Self-signed certificate - Full (strict) mode rejects self-signed certificates. Use Let's Encrypt for a free, publicly trusted certificate. Alternatively, use Cloudflare Origin CA certificates (trusted only by Cloudflare, not browsers directly).

Hostname mismatch - Certificate must include data.porenta.us in Common Name or Subject Alternative Name. Verify with `openssl x509 -in fullchain.pem -noout -text | grep -A1 "Subject Alternative Name"`.

Expired certificate - Let's Encrypt certificates expire after 90 days. Check expiration date and ensure automatic renewal is working properly.

Untrusted CA - If using a certificate from an uncommon CA, Cloudflare may not trust it. Let's Encrypt and all major CAs are trusted, but some smaller CAs may not be included in Cloudflare's trust store.

**Solution**: Use the provided `init-letsencrypt.sh` script to obtain a valid Let's Encrypt certificate, ensuring it includes the correct domain name.

### Certificate renewal failures

**If automatic renewal fails**, check Certbot logs for specific errors:

```bash
docker compose logs certbot --tail=100

# Common error messages:
# "Connection refused" - Port 80 not accessible
# "Timeout" - DNS not resolving correctly
# "Incorrect validation" - Challenge file not served correctly
# "Too many requests" - Hit Let's Encrypt rate limits
```

**ACME challenge not accessible**: Verify `/.well-known/acme-challenge/` is accessible without SSL redirect:

```bash
# Should return 404 but not redirect to HTTPS
curl -I http://data.porenta.us/.well-known/acme-challenge/test

# Test from inside the Nginx container
docker compose exec nginx cat /var/www/certbot/test.txt
```

**Rate limit exceeded**: Let's Encrypt limits to 5 duplicate certificates per week. If testing, use staging environment by setting `STAGING=1` in `.env`. Staging certificates aren't trusted by browsers but don't count against rate limits.

**DNS propagation issues**: Ensure DNS has propagated fully before requesting certificates. Test with `dig data.porenta.us` from multiple locations. Some DNS servers cache aggressively and may take up to 24 hours to update.

### Next.js application errors

**"Could not find a production build" error** means the Dockerfile didn't successfully create the `.next/standalone` directory. Verify `next.config.js` includes `output: 'standalone'` and the build completed successfully:

```bash
# Rebuild with verbose output
docker compose build nextjs --no-cache --progress=plain

# Check if standalone directory exists
docker compose run --rm nextjs ls -la .next/
```

**Module not found errors in Docker but not locally** typically indicate case-sensitivity issues or missing dependencies. Linux Docker containers are case-sensitive while Mac/Windows development machines aren't. Verify all import statements match actual file names exactly, including capitalization.

**Environment variables not working** - Remember that `NEXT_PUBLIC_` variables must be set at build time, not runtime. Rebuild the image if you change them:

```bash
# Update .env file with new NEXT_PUBLIC_ values
vi .env

# Rebuild and restart
docker compose up -d --build nextjs
```

Server-side environment variables (without NEXT_PUBLIC_ prefix) can be changed without rebuilding:

```bash
# Update .env file
vi .env

# Restart container to pick up new values
docker compose restart nextjs
```

### Nginx configuration issues

**"Unable to reload nginx" errors** indicate configuration syntax errors:

```bash
# Test configuration syntax
docker compose exec nginx nginx -t

# Common issues:
# - Missing semicolons
# - Mismatched braces
# - Invalid directives
# - File paths that don't exist
```

**502 Bad Gateway** means Nginx can't connect to the Next.js container:

```bash
# Check if Next.js is running
docker compose ps

# Check if Next.js is healthy
docker compose exec nextjs curl localhost:3000

# Verify network connectivity
docker compose exec nginx ping -c 3 nextjs

# Check upstream definition matches service name
docker compose exec nginx cat /etc/nginx/conf.d/default.conf | grep upstream
```

**413 Request Entity Too Large** means client body size exceeds the limit. Increase in nginx.conf:

```nginx
http {
    client_max_body_size 50M;  # Adjust as needed
}
```

### Container health check failures

If containers show unhealthy status, investigate the health check command:

```bash
# Check Next.js health
docker compose exec nextjs curl -f http://localhost:3000/api/health

# View detailed health check logs
docker inspect --format='{{json .State.Health}}' nextjs-production | jq

# Temporarily disable health checks for debugging
# Comment out healthcheck in docker-compose.yml
```

Health checks may fail during application startup. The `start_period: 40s` gives Next.js time to initialize before health checks count as failures. Increase this value if your application takes longer to start.

## Maintenance and monitoring

### Daily operational tasks

**Monitor container status** to catch issues before they impact users:

```bash
# Quick status check
docker compose ps

# Detailed resource usage
docker stats

# Check disk space (certificate volumes shouldn't grow significantly)
docker system df
```

**Review logs daily** for errors, security events, or unusual patterns:

```bash
# View recent logs from all services
docker compose logs --tail=50 --timestamps

# Follow logs in real-time
docker compose logs -f

# Filter for errors only
docker compose logs | grep -i error

# Check Nginx access logs for unusual traffic
docker compose exec nginx tail -f /var/log/nginx/access.log
```

**Monitor certificate expiration** to ensure renewal is working:

```bash
# Check all certificate expiration dates
docker compose exec certbot certbot certificates

# Should show:
# Certificate Name: data.porenta.us
# Expiry Date: [date] (30+ days away)
```

### Weekly maintenance tasks

**Update Docker images** to get security patches:

```bash
# Pull latest base images
docker compose pull

# Rebuild services with updated bases
docker compose build --pull

# Recreate containers with new images
docker compose up -d --force-recreate

# Remove old images
docker image prune -f
```

**Review security logs** for potential attacks or abuse:

```bash
# Look for 429 rate limit responses (potential DoS)
docker compose exec nginx grep " 429 " /var/log/nginx/access.log | tail -20

# Check for failed SSL handshakes
docker compose logs nginx | grep -i "ssl"

# Review Certbot logs for renewal issues
docker compose logs certbot | grep -i error
```

**Backup certificates and configuration**:

```bash
# Backup script
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p "$BACKUP_DIR"

# Backup certificate volumes
docker run --rm -v nextjs-dashboard_certbot-etc:/data \
  -v "$BACKUP_DIR":/backup alpine \
  tar czf /backup/certbot-etc.tar.gz -C /data .

# Backup configuration files
tar czf "$BACKUP_DIR/config.tar.gz" \
  docker-compose.yml .env nginx/ app/next.config.js

# Encrypt backup
gpg --encrypt --recipient your-email@example.com "$BACKUP_DIR/certbot-etc.tar.gz"

# Remove unencrypted backup
rm "$BACKUP_DIR/certbot-etc.tar.gz"
```

### Monthly maintenance tasks

**Security audit and updates**:

```bash
# Scan images for vulnerabilities
docker scout cves nextjs-dashboard:latest

# Update all system packages on host
sudo apt update && sudo apt upgrade -y

# Review and update Docker Compose configuration
# Check for new security best practices

# Audit firewall rules
sudo ufw status verbose

# Review user access (who has SSH access, Docker group membership)
groups
```

**Performance analysis**:

```bash
# Analyze container resource usage over time
docker stats --no-stream

# Check Nginx performance metrics
docker compose exec nginx curl http://localhost/nginx_status

# Review slow requests in Nginx logs
# Consider adding performance monitoring tools
```

**Test disaster recovery procedures**:

```bash
# Verify backups are valid by restoring to a test environment
# Test certificate renewal process with --dry-run
# Verify rollback procedures work correctly
# Document any issues discovered
```

### Monitoring and alerting setup

For production environments, implement comprehensive monitoring with **Prometheus and Grafana**:

```yaml
# Add to docker-compose.yml
  prometheus:
    image: prom/prometheus:v2.48.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    ports:
      - "9090:9090"
    networks:
      - app-network

  grafana:
    image: grafana/grafana:10.2.0
    volumes:
      - grafana-data:/var/lib/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=change_this_password
    ports:
      - "3001:3000"
    networks:
      - app-network

volumes:
  prometheus-data:
  grafana-data:
```

**Key metrics to monitor**:

- Container CPU and memory usage trends
- SSL certificate expiration dates (alert at 14 days)
- HTTP response times (95th and 99th percentiles)
- Error rates (4xx and 5xx responses)
- Request rates and traffic patterns
- Disk space usage on host and in volumes
- Docker daemon health and restart counts
- Failed login attempts (if applicable)
- Rate limit hits (429 responses)

**Alerting thresholds** (suggested):

- Certificate expires in less than 14 days - Critical
- Container restart count \u003e 5 in 1 hour - Warning
- Memory usage \u003e 90% for 5 minutes - Warning
- Error rate \u003e 1% for 5 minutes - Warning
- Disk space \u003e 85% - Warning
- Response time p95 \u003e 2 seconds - Warning

Set up notification channels (email, Slack, PagerDuty) in Grafana to receive alerts when thresholds are exceeded.

### Log rotation and retention

Docker's JSON logging driver can consume significant disk space. Configure log rotation in docker-compose.yml:

```yaml
services:
  nextjs:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
        compress: "true"
```

This keeps the last 30MB of logs (3 files × 10MB) per container, automatically rotating and compressing old logs. Adjust based on your needs - high-traffic sites may need larger limits or external log aggregation.

For long-term log retention, consider centralized logging with the **ELK stack** (Elasticsearch, Logstash, Kibana) or cloud services like AWS CloudWatch, Datadog, or Loggly.

### Updating Next.js application

When deploying application updates:

```bash
# 1. Pull latest code
cd ~/nextjs-dashboard/app
git pull origin main

# 2. Build new image
cd ~/nextjs-dashboard
docker compose build nextjs

# 3. Test in staging environment first (recommended)
# Deploy to staging, run tests, verify functionality

# 4. Deploy to production with zero-downtime
docker compose up -d --no-deps --build nextjs

# 5. Verify deployment
docker compose ps
docker compose logs nextjs --tail=50

# 6. If issues occur, rollback to previous image
docker compose up -d --no-deps nextjs-dashboard:previous-tag
```

The `--no-deps` flag updates only the Next.js container without restarting Nginx or Certbot, minimizing downtime. Docker Compose performs a rolling update: starts the new container, waits for it to become healthy, then stops the old container.

---

## Conclusion

This production-ready configuration provides enterprise-grade security, automated SSL management, and optimal Next.js performance through Docker containerization. The three-container architecture ensures separation of concerns, with Nginx handling SSL termination and reverse proxying, Certbot managing certificate lifecycle automatically, and Next.js running efficiently in standalone mode.

**Key achievements**: End-to-end encryption with Cloudflare Full (strict) mode validates origin certificates on every request, preventing man-in-the-middle attacks. Automatic certificate renewal every 12 hours eliminates manual intervention and prevents expiration-related outages. Security hardening with OWASP-recommended headers, rate limiting, and Docker isolation protects against common attacks. The standalone output mode reduces Next.js image size by 85% while maintaining full functionality.

**Security posture**: Running containers as non-root users, dropping unnecessary Linux capabilities, enabling read-only filesystems, and implementing resource limits follow CIS Docker Benchmark guidelines. Network segmentation isolates containers, and Docker secrets protect sensitive data. The Nginx configuration achieves A+ SSL ratings through TLS 1.2/1.3, strong cipher suites, OCSP stapling, and comprehensive security headers.

**Operational excellence**: Health checks enable automatic recovery from failures, centralized logging aids troubleshooting, and monitoring provides visibility into system health. The initialization script simplifies certificate setup, while Docker Compose orchestration ensures correct startup order and dependencies. Volume persistence guarantees certificates survive container restarts.

This architecture scales horizontally by adding more Next.js containers behind Nginx, supports blue-green deployments through image tagging, and integrates with CI/CD pipelines for automated testing and deployment. Regular maintenance tasks keep the system secure and performant, while comprehensive monitoring catches issues before they impact users.