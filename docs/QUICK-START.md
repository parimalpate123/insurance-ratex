# Quick Start Guide
**Get InsurRateX running in 15 minutes**

---

## Prerequisites (5 min)
```bash
# Check versions
node --version  # Need v18+
npm --version   # Need v9+
docker --version

# If missing, install:
# - Node.js: https://nodejs.org
# - Docker: https://docker.com/get-started
```

---

## Project Setup (5 min)
```bash
# 1. Navigate to project
cd /Users/parimalpatel/code/rating-poc

# 2. Install dependencies
npm install

# 3. Create environment file
cat > .env << 'EOF'
GUIDEWIRE_URL=http://localhost:3001
EARNIX_URL=http://localhost:4001
NODE_ENV=development
LOG_LEVEL=debug
EOF
```

---

## Start Development (5 min)
```bash
# Start all services with Docker Compose
docker-compose up

# Services will start:
# - Guidewire Mock: http://localhost:3001
# - Earnix Mock: http://localhost:4001
# - Orchestrator: http://localhost:3000
# - UI: http://localhost:8080 (when ready)
```

---

## Quick Test
```bash
# Test Guidewire mock
curl http://localhost:3001/health
# Expected: {"status":"ok"}

# Test Earnix mock
curl http://localhost:4001/health
# Expected: {"status":"ok"}

# Test full rating flow
curl -X POST http://localhost:3000/api/v1/rate \
  -H "Content-Type: application/json" \
  -d @samples/gl-policy-request.json
```

---

## Development Workflow

### 1. Make Changes
```bash
# Edit code in your IDE
code packages/mocks/guidewire-mock/src/
```

### 2. See Changes (Hot Reload)
```bash
# Containers auto-restart on file changes
# Just refresh your browser or re-run curl
```

### 3. View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f guidewire-mock
```

### 4. Stop Services
```bash
# Stop (keeps data)
docker-compose stop

# Stop and remove (fresh start)
docker-compose down
```

---

## Next Steps

1. ✅ **Read:** [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md) - Detailed specs
2. ✅ **Build:** Start with Week 1 - Mock Servers
3. ✅ **Test:** Run `npm test` before committing
4. ✅ **Commit:** Follow conventional commits (feat:, fix:, docs:)

---

## Troubleshooting

**Port already in use?**
```bash
# Find process using port
lsof -i :3001

# Kill it
kill -9 <PID>
```

**Docker build failing?**
```bash
# Clean rebuild
docker-compose build --no-cache
docker-compose up
```

**Cannot connect to services?**
```bash
# Check if containers are running
docker-compose ps

# Restart specific service
docker-compose restart guidewire-mock
```

---

**Need Help?** See [DEVELOPMENT-GUIDE.md](./DEVELOPMENT-GUIDE.md) for detailed instructions
