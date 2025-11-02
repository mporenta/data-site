# Local Docker Quick Start 🚀

**TL;DR:** Get the app running locally in 3 commands

## Prerequisites
- Docker Desktop installed and running

## Quick Commands

### First Time Setup
```bash
# 1. Copy environment file
cp .env.local.example .env.local

# 2. Start everything (builds automatically)
npm run docker:local

# 3. Open browser
open http://localhost:3000
# or
open http://localhost
```

**That's it!** ✅

## Access Points

| URL | What |
|-----|------|
| http://localhost | **App via Nginx** (recommended) |
| http://localhost:3000 | Next.js frontend directly |
| http://localhost:8000 | Python API directly |
| http://localhost:8000/docs | API documentation (Swagger UI) |

## Common Commands

```bash
# Start services
npm run docker:local

# View logs (follow)
npm run docker:local:logs

# Stop services
npm run docker:local:down

# Restart services
npm run docker:local:restart

# Rebuild after code changes
npm run docker:local:rebuild

# Full cleanup (removes everything)
npm run docker:local:clean
```

## Check Status

```bash
# See running containers
npm run docker:local:ps

# Test API
curl http://localhost:8000/health

# Test frontend
curl http://localhost:3000/api/health
```

## Troubleshooting

### Port already in use?
```bash
# Kill whatever is using port 3000/8000
lsof -i :3000  # Mac/Linux
netstat -ano | findstr :3000  # Windows

# Or change ports in docker-compose-local.yml
```

### Container won't start?
```bash
# Check logs
npm run docker:local:logs

# Restart
npm run docker:local:restart

# Force rebuild
npm run docker:local:rebuild
```

### Still broken?
```bash
# Nuclear option: clean everything and start fresh
npm run docker:local:clean
npm run docker:local
```

## Development Workflow

### Option 1: Full Docker (Slower, More Realistic)
```bash
npm run docker:local
# Edit code → Rebuild → Test
npm run docker:local:rebuild
```

### Option 2: Hybrid (Faster, Recommended)
```bash
# Start only API in Docker
docker compose -f docker-compose-local.yml up -d python-api

# Run Next.js locally
npm run dev  # Hot reload works!
```

### Option 3: Direct Ports (Debugging)
```bash
# Access services directly
# http://localhost:3000 - Next.js
# http://localhost:8000 - API
# http://localhost:8000/docs - API docs

# Comment out nginx in docker-compose-local.yml if not needed
```

## What's Different from Production?

| Feature | Local | Production |
|---------|-------|------------|
| HTTPS | ❌ | ✅ |
| SSL Cert | ❌ | ✅ (Let's Encrypt) |
| Ports exposed | ✅ 3000, 8000 | ❌ Internal only |
| Domain | localhost | data.porenta.us |
| Nginx | Optional | Required |

## Need More Help?

📖 See full guide: `DOCKER_LOCAL_SETUP.md`

## Pro Tips

1. **Use Docker Desktop Dashboard** - Visual interface to manage containers
2. **Keep containers running** - Restart is faster than rebuild
3. **Check logs often** - `npm run docker:local:logs` is your friend
4. **Use `.dockerignore`** - Already configured for fast builds
5. **Allocate resources** - Docker Desktop → Settings → Resources (8GB RAM recommended)

---

**Happy coding!** 🎉

Questions? Check `DOCKER_LOCAL_SETUP.md` for detailed documentation.
