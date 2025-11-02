# Deployment Strategy - Docker & AWS Only

## Overview

This application is designed for **self-hosted deployment only**. We do not use Vercel or other serverless platforms.

## Target Deployment Platforms

### 1. Local Development (Docker Desktop)

**Purpose:** Local testing and development

**Files:** `docker-compose-local.yml`

**Quick Start:**
```bash
npm run docker:local
```

**Access:**
- Frontend: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Via Nginx: http://localhost

**Documentation:** See `DOCKER_LOCAL_QUICKSTART.md`

---

### 2. Production Server (Docker + Nginx + SSL)

**Purpose:** Self-hosted production deployment (current: data.porenta.us)

**Files:** `docker-compose.yml`

**Stack:**
- Docker Compose for orchestration
- Nginx for reverse proxy
- Let's Encrypt SSL (Certbot)
- Next.js container (port 3000, internal)
- Python API container (port 8000, internal)

**Deployment:**
```bash
# Configure environment
cp .env.example .env
# Edit .env with production values

# Start services
npm run docker:build
npm run docker:up

# View status
npm run docker:ps
npm run docker:logs
```

**Access:**
- Public URL: https://data.porenta.us
- All services behind Nginx
- SSL automatically managed

**Documentation:** See `DEPLOY.md` and `README-DOCKER.md`

---

### 3. AWS Fargate + CloudFront (Planned)

**Purpose:** Scalable cloud deployment with CDN

**Architecture:**
```
Internet
    ↓
CloudFront CDN (SSL, caching)
    ↓
Application Load Balancer (ALB)
    ↓
    ├→ ECS Fargate Service (Next.js)
    │  └→ Task: bi-nextjs container
    │
    └→ ECS Fargate Service (Python API)
       └→ Task: bi-python-api container
    ↓
AWS RDS (PostgreSQL)
```

**Key Components:**

1. **Amazon ECR** - Container registry for Docker images
2. **ECS Fargate** - Serverless container orchestration
3. **Application Load Balancer** - Routes traffic, health checks
4. **CloudFront** - CDN with 60-second cache on API responses
5. **RDS** - Managed database (PostgreSQL)
6. **Secrets Manager** - Secure credential storage
7. **CloudWatch** - Logging and monitoring
8. **Route 53** - DNS management

**Deployment Steps:**

```bash
# 1. Create ECR repositories
aws ecr create-repository --repository-name bi-nextjs
aws ecr create-repository --repository-name bi-python-api

# 2. Build and push images
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

docker build -t bi-nextjs:latest .
docker tag bi-nextjs:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-nextjs:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-nextjs:latest

docker build -t bi-python-api:latest ./api
docker tag bi-python-api:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-python-api:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/bi-python-api:latest

# 3. Create ECS Task Definitions (JSON)
# 4. Create ECS Services
# 5. Configure ALB target groups
# 6. Create CloudFront distribution
# 7. Configure Route 53 DNS
```

**Environment Configuration:**
```bash
# ECS Task Definition Environment Variables
API_URL=http://python-api-service:8000  # Internal service discovery
RDS_HOST=your-rds-endpoint.amazonaws.com
RDS_PORT=5432
RDS_DATABASE=bi_database
RDS_USER=${RDS_USER}  # From Secrets Manager
RDS_PASSWORD=${RDS_PASSWORD}  # From Secrets Manager
OKTA_CLIENT_ID=${OKTA_CLIENT_ID}  # From Secrets Manager
OKTA_CLIENT_SECRET=${OKTA_CLIENT_SECRET}  # From Secrets Manager
```

**Benefits:**
- Auto-scaling based on load
- High availability across multiple AZs
- Managed infrastructure
- Pay-per-use pricing
- CloudFront CDN for global performance
- Integrated with AWS ecosystem

**Documentation:** To be created when implementation begins

---

## Database Strategy

### Current: CSV Mock Data
- Location: `api/data/*.csv`
- No database required
- Perfect for development and testing

### Future: AWS RDS
- **Database**: PostgreSQL
- **Connection**: Direct from Python API container
- **Security**: VPC, Security Groups, IAM authentication
- **Backups**: Automated snapshots
- **Migration**: Update `api/routers/bi_query.py`

**Connection Configuration:**
```python
# api/routers/bi_query.py
import psycopg2

def get_db_connection():
    return psycopg2.connect(
        host=os.getenv('RDS_HOST'),
        port=os.getenv('RDS_PORT', 5432),
        database=os.getenv('RDS_DATABASE'),
        user=os.getenv('RDS_USER'),
        password=os.getenv('RDS_PASSWORD'),
        sslmode='require'  # AWS RDS requires SSL
    )
```

---

## Why No Vercel?

### Reasons for Self-Hosted Only:

1. **Full Control** - Complete control over infrastructure and configuration
2. **Behind Okta** - Enterprise authentication requires self-hosted setup
3. **Database Access** - Direct connection to AWS RDS (not serverless)
4. **Cost Predictability** - Fixed infrastructure costs, no per-request pricing
5. **Compliance** - Data stays within our AWS infrastructure
6. **Long-Running Requests** - No serverless timeout limits
7. **Docker Flexibility** - Same containers everywhere (dev, staging, prod)

### Technical Incompatibilities:

1. **Unified FastAPI App** - Our API is a single FastAPI instance with routers, not serverless functions
2. **Stateful Connections** - Database connection pooling doesn't work well with serverless
3. **No API Routes in Vercel** - Our Python API is separate, not Next.js API routes
4. **Docker-First** - Built for container deployment, not serverless

---

## Deployment Comparison

| Feature | Local Docker | Production Docker | AWS Fargate |
|---------|--------------|-------------------|-------------|
| **SSL** | ❌ HTTP | ✅ Let's Encrypt | ✅ ACM/CloudFront |
| **Ports** | Exposed | Internal only | Internal only |
| **Scaling** | Manual | Manual | Auto-scaling |
| **HA** | ❌ Single host | ❌ Single host | ✅ Multi-AZ |
| **CDN** | ❌ | ❌ | ✅ CloudFront |
| **Cost** | Free (local) | Server cost | Pay-per-use |
| **Setup** | 1 command | Medium | Complex |
| **Use Case** | Development | Small/medium | Enterprise |

---

## Environment Variables by Platform

### Local Development
```bash
# .env.local
API_URL=http://python-api:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
# Database optional (uses CSV)
```

### Production Docker
```bash
# .env
API_URL=http://python-api:8000
NEXT_PUBLIC_API_URL=https://data.porenta.us
DOMAIN=data.porenta.us
# Database credentials
RDS_HOST=...
RDS_DATABASE=...
```

### AWS Fargate
```bash
# ECS Task Definition / Secrets Manager
API_URL=http://python-api-service:8000
NEXT_PUBLIC_API_URL=https://bi.aptive.com
# All credentials from Secrets Manager
RDS_HOST=...
OKTA_CLIENT_ID=...
```

---

## CI/CD Strategy (Future)

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy to AWS Fargate

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2

      - name: Login to ECR
        run: aws ecr get-login-password | docker login --username AWS --password-stdin

      - name: Build and push images
        run: |
          docker build -t bi-nextjs:${{ github.sha }} .
          docker push ...

      - name: Update ECS service
        run: aws ecs update-service --force-new-deployment
```

---

## Monitoring & Observability

### Current (Docker)
- **Logs**: `docker compose logs`
- **Health**: `/health` endpoints
- **Metrics**: Docker stats

### Future (AWS)
- **CloudWatch Logs**: Centralized logging
- **CloudWatch Metrics**: Container metrics, API metrics
- **X-Ray**: Distributed tracing
- **CloudWatch Alarms**: Alert on errors/performance
- **CloudWatch Dashboards**: Visual monitoring

---

## Security Considerations

### All Platforms
- ✅ Okta OIDC authentication (planned)
- ✅ HTTPS/SSL everywhere
- ✅ CORS restricted to specific domains
- ✅ No secrets in code (environment variables)
- ✅ Health check endpoints don't expose sensitive data

### AWS Fargate Additional
- ✅ VPC isolation
- ✅ Security groups for network access control
- ✅ IAM roles for service permissions
- ✅ Secrets Manager for credential management
- ✅ RDS encryption at rest and in transit
- ✅ CloudFront WAF for DDoS protection

---

## Support & Documentation

### For Local Development
- `DOCKER_LOCAL_QUICKSTART.md` - Quick start guide
- `DOCKER_LOCAL_SETUP.md` - Comprehensive guide

### For Production Docker
- `DEPLOY.md` - Deployment guide
- `README-DOCKER.md` - Docker setup details
- `PRODUCTION_FIX.md` - Troubleshooting

### For AWS Fargate
- To be created during implementation
- Will include Terraform/CloudFormation templates

---

## Decision Log

**2025-11-02**: Removed all Vercel references
- Updated README.md, CLAUDE.md
- Changed database target from Snowflake to AWS RDS
- Documented Docker and AWS Fargate as only deployment targets
- Created comprehensive deployment strategy document

**Rationale**: Self-hosted deployment provides better control, security, and integration with enterprise systems (Okta, RDS, VPC). Docker-first approach ensures consistency across all environments.
