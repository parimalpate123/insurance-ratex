# Docker Build Fix Applied

## Issue
Docker build was failing with error:
```
npm error The `npm ci` command can only install with an existing package-lock.json
```

## Root Cause
The Dockerfiles were using `npm ci` which requires `package-lock.json` files, but these files were not present in the project.

## Solution Applied
Changed all Dockerfiles from `npm ci` to `npm install`:

### Files Updated:
1. ✅ `apps/mapping-ui/Dockerfile` - Changed `npm ci` → `npm install`
2. ✅ `apps/rules-ui/Dockerfile` - Changed `npm ci` → `npm install`
3. ✅ `apps/orchestrator/Dockerfile` - Changed `npm ci --only=production` → `npm install --production`
4. ✅ `packages/mocks/guidewire-mock/Dockerfile` - Changed `npm ci --only=production` → `npm install --production`
5. ✅ `packages/mocks/earnix-mock/Dockerfile` - Changed `npm ci --only=production` → `npm install --production`

## Now Try Building Again

```bash
# Clean up any previous build artifacts
docker-compose down -v
docker system prune -f

# Build fresh
docker-compose build

# Start services
docker-compose up -d

# Wait for startup
sleep 30

# Test
curl http://localhost:3000/health
```

## Expected Result
All services should build and start successfully without `npm ci` errors.

## Why This Works
- `npm install` creates the lock file if it doesn't exist
- `npm ci` requires an existing lock file (more strict, faster for CI/CD)
- For local development, `npm install` is more flexible

## For Production (Optional)
If you want to generate lock files for better reproducibility:

```bash
# Generate lock files for each service
cd apps/orchestrator && npm install && cd ../..
cd apps/mapping-ui && npm install && cd ../..
cd apps/rules-ui && npm install && cd ../..
cd packages/mocks/guidewire-mock && npm install && cd ../../..
cd packages/mocks/earnix-mock && npm install && cd ../../..

# Then change Dockerfiles back to use `npm ci`
# But for now, `npm install` works fine
```
