# InsurRateX - Testing Instructions

Complete step-by-step guide to build, configure, and test the InsurRateX platform.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Environment Configuration](#environment-configuration)
4. [Build & Start Services](#build--start-services)
5. [Verify Installation](#verify-installation)
6. [Test Scenarios](#test-scenarios)
7. [UI Testing](#ui-testing)
8. [API Testing](#api-testing)
9. [Troubleshooting](#troubleshooting)
10. [Clean Up](#clean-up)

---

## Prerequisites

Before starting, ensure you have installed:

- [x] **Docker Desktop** (version 20.10+)
  - Download: https://www.docker.com/products/docker-desktop
  - Verify: `docker --version`

- [x] **Docker Compose** (usually included with Docker Desktop)
  - Verify: `docker-compose --version`

- [x] **Git** (for cloning repository)
  - Verify: `git --version`

- [x] **curl** or **Postman** (for API testing)
  - Verify: `curl --version`

- [x] **jq** (optional, for pretty JSON output)
  - Install: `brew install jq` (Mac) or `apt-get install jq` (Linux)
  - Verify: `jq --version`

**System Requirements:**
- RAM: 8GB minimum, 16GB recommended
- Disk Space: 10GB free
- OS: macOS, Linux, or Windows with WSL2

---

## Initial Setup

### Step 1: Clone Repository

```bash
# Navigate to your projects directory
cd ~/code

# Clone the repository
git clone <repository-url> rating-poc

# Enter project directory
cd rating-poc

# Verify you're in the right place
ls -la
# You should see: packages/, apps/, docker-compose.yml, etc.
```

### Step 2: Check Project Structure

```bash
# Verify folder structure
tree -L 2 -d

# Or use ls
ls -la packages/
ls -la apps/
```

**Expected structure:**
```
rating-poc/
├── apps/
│   ├── orchestrator/
│   ├── mapping-ui/
│   └── rules-ui/
├── packages/
│   ├── cdm/
│   ├── adapter-sdk/
│   ├── mapping-engine/
│   ├── rules-engine/
│   ├── ai-services/
│   └── mocks/
├── k8s/
├── tests/
├── docs/
└── docker-compose.yml
```

---

## Environment Configuration

### Step 3: Create Environment Files

#### 3.1 Create `.env` file in project root

```bash
# Create main .env file
cat > .env << 'EOF'
# Environment
NODE_ENV=development

# Service URLs (for Docker)
ORCHESTRATOR_URL=http://localhost:3000
GUIDEWIRE_URL=http://localhost:3001
EARNIX_URL=http://localhost:4001

# Logging
LOG_LEVEL=debug

# Features
ENABLE_RULES=true

# AI Services (Optional - leave empty to skip AI features)
OPENAI_API_KEY=

# Database (Future use)
# DATABASE_URL=postgresql://user:password@localhost:5432/insurratex
EOF

echo "✅ Created .env file"
```

#### 3.2 Verify .env file

```bash
# View the file
cat .env

# Should show all variables listed above
```

### Step 4: Optional - Configure AI Features

If you want to test AI features (mapping suggestions, NLP rules):

```bash
# Edit .env file
nano .env

# Add your OpenAI API key:
# OPENAI_API_KEY=sk-your-key-here

# Save and exit (Ctrl+X, then Y, then Enter)
```

**Note:** AI features will work without API key using fallback template-based generation.

---

## Build & Start Services

### Step 5: Build Docker Images

```bash
# Build all services (this may take 5-10 minutes first time)
docker-compose build

# You should see:
# - Building orchestrator...
# - Building guidewire-mock...
# - Building earnix-mock...
# - Building mapping-ui...
# - Building rules-ui...
```

**Expected output:**
```
Successfully built <image-id>
Successfully tagged insurratex-orchestrator:latest
...
```

### Step 6: Start All Services

```bash
# Start services in detached mode
docker-compose up -d

# Or start with logs visible (press Ctrl+C to stop)
# docker-compose up
```

**Expected output:**
```
Creating network "insurratex-network" ...
Creating insurratex-guidewire-mock ... done
Creating insurratex-earnix-mock    ... done
Creating insurratex-orchestrator   ... done
Creating insurratex-mapping-ui     ... done
Creating insurratex-rules-ui       ... done
```

### Step 7: Wait for Services to Start

```bash
# Wait 30-60 seconds for all services to initialize
sleep 30

# Check running containers
docker-compose ps
```

**Expected output:**
```
Name                          State    Ports
-------------------------------------------------------------
insurratex-orchestrator       Up      0.0.0.0:3000->3000/tcp
insurratex-guidewire-mock     Up      0.0.0.0:3001->3001/tcp
insurratex-earnix-mock        Up      0.0.0.0:4001->4001/tcp
insurratex-mapping-ui         Up      0.0.0.0:8080->8080/tcp
insurratex-rules-ui           Up      0.0.0.0:8081->8081/tcp
```

---

## Verify Installation

### Step 8: Check Service Health

#### 8.1 Test Orchestrator
```bash
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","service":"orchestrator","version":"1.0.0"}
```

#### 8.2 Test Guidewire Mock
```bash
curl http://localhost:3001/health

# Expected response:
# {"status":"ok","service":"guidewire-mock"}
```

#### 8.3 Test Earnix Mock
```bash
curl http://localhost:4001/health

# Expected response:
# {"status":"ok","service":"earnix-mock"}
```

#### 8.4 Test Mapping UI
```bash
curl http://localhost:8080

# Expected: HTML content with "<title>InsurRateX - Mapping UI</title>"
```

#### 8.5 Test Rules UI
```bash
curl http://localhost:8081

# Expected: HTML content with "<title>InsurRateX - Rules Management</title>"
```

### Step 9: All-in-One Health Check Script

```bash
# Run comprehensive health check
./tests/scripts/health-check.sh

# Or create and run this script:
cat > check-health.sh << 'EOF'
#!/bin/bash
echo "🔍 Checking InsurRateX Services..."
echo ""

services=(
  "Orchestrator:http://localhost:3000/health"
  "Guidewire Mock:http://localhost:3001/health"
  "Earnix Mock:http://localhost:4001/health"
)

for service in "${services[@]}"; do
  IFS=: read -r name url <<< "$service"
  echo -n "Testing $name... "
  if curl -sf "$url" > /dev/null; then
    echo "✅ OK"
  else
    echo "❌ FAILED"
  fi
done

echo ""
echo -n "Testing Mapping UI... "
if curl -sf http://localhost:8080 > /dev/null; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

echo -n "Testing Rules UI... "
if curl -sf http://localhost:8081 > /dev/null; then
  echo "✅ OK"
else
  echo "❌ FAILED"
fi

echo ""
echo "✅ Health check complete!"
EOF

chmod +x check-health.sh
./check-health.sh
```

---

## Test Scenarios

### Test 1: Basic Rating Flow

#### Step 10: Submit a Simple Rating Request

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "requestId": "test-001",
    "policyData": {
      "quoteNumber": "Q-TEST-001",
      "productCode": "GL",
      "insured": {
        "name": "Test Company",
        "state": "CA",
        "annualRevenue": 5000000
      },
      "classification": {
        "code": "91580"
      },
      "coverages": [{
        "id": "cov-001",
        "limit": 2000000,
        "deductible": 5000
      }]
    }
  }' | jq
```

**Expected Response:**
```json
{
  "success": true,
  "requestId": "test-001",
  "totalPremium": 15689.94,
  "premiumBreakdown": {
    "basePremium": 12500.00,
    "adjustments": [...],
    "rulesApplied": [...]
  },
  "metadata": {
    "executionTime": 1523,
    "steps": [...]
  }
}
```

**Verification Checklist:**
- [x] `success: true`
- [x] `totalPremium` is a positive number
- [x] `premiumBreakdown` contains basePremium
- [x] `metadata.steps` has 4 steps
- [x] All steps show `success: true`

---

### Test 2: Different States

#### Step 11: Test California

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "policyData": {
      "quoteNumber": "Q-CA-001",
      "productCode": "GL",
      "insured": {
        "name": "California Test",
        "state": "CA",
        "annualRevenue": 3000000
      },
      "classification": {"code": "91580"},
      "coverages": [{"id": "cov-001", "limit": 1000000, "deductible": 5000}]
    }
  }' | jq '.totalPremium'
```

#### Step 12: Test Texas

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "policyData": {
      "quoteNumber": "Q-TX-001",
      "productCode": "GL",
      "insured": {
        "name": "Texas Test",
        "state": "TX",
        "annualRevenue": 3000000
      },
      "classification": {"code": "91580"},
      "coverages": [{"id": "cov-001", "limit": 1000000, "deductible": 5000}]
    }
  }' | jq '.totalPremium'
```

#### Step 13: Test New York

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "policyData": {
      "quoteNumber": "Q-NY-001",
      "productCode": "GL",
      "insured": {
        "name": "New York Test",
        "state": "NY",
        "annualRevenue": 3000000
      },
      "classification": {"code": "91580"},
      "coverages": [{"id": "cov-001", "limit": 1000000, "deductible": 5000}]
    }
  }' | jq '.totalPremium'
```

**Expected:** Different premiums for each state (NY > CA > TX) due to territorial surcharges.

---

### Test 3: Business Rules

#### Step 14: Test High Revenue Surcharge

```bash
# Submit policy with revenue > $5M (should trigger surcharge)
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "applyRules": true,
    "policyData": {
      "quoteNumber": "Q-HIGHRISK-001",
      "productCode": "GL",
      "insured": {
        "name": "High Revenue Company",
        "state": "CA",
        "annualRevenue": 15000000
      },
      "classification": {"code": "91580"},
      "coverages": [{"id": "cov-001", "limit": 2000000, "deductible": 5000}]
    }
  }' | jq '.premiumBreakdown.rulesApplied'
```

**Expected:** Should include "High Revenue Surcharge" in rulesApplied array.

#### Step 15: Test Without Rules

```bash
# Same policy but with rules disabled
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "applyRules": false,
    "policyData": {
      "quoteNumber": "Q-NORULES-001",
      "productCode": "GL",
      "insured": {
        "name": "No Rules Company",
        "state": "CA",
        "annualRevenue": 15000000
      },
      "classification": {"code": "91580"},
      "coverages": [{"id": "cov-001", "limit": 2000000, "deductible": 5000}]
    }
  }' | jq '.totalPremium'
```

**Expected:** Lower premium than Test 14 (no surcharges applied).

---

### Test 4: Complete E2E Test

#### Step 16: Run Automated E2E Tests

```bash
# Make script executable
chmod +x tests/e2e/complete-rating-flow.test.sh

# Run comprehensive test suite
./tests/e2e/complete-rating-flow.test.sh
```

**Expected output:**
```
============================================
InsurRateX End-to-End Test Suite
============================================

Step 1: Checking Service Health
================================
Checking Orchestrator... ✓ OK
Checking Guidewire Mock... ✓ OK
Checking Earnix Mock... ✓ OK

All services are healthy!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TEST: Basic GL Rating - California
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ PASSED (HTTP 200)

... (more tests)

============================================
Test Summary
============================================
Passed: 8
Failed: 0
Total: 8

✓ All tests passed!
```

---

## UI Testing

### Test 5: Mapping UI

#### Step 17: Open Mapping UI

1. Open browser to: **http://localhost:8080**

2. You should see:
   - InsurRateX logo
   - Navigation menu
   - "Mappings" section

3. **Test Navigation:**
   - [x] Click "Mappings" - should show mappings list
   - [x] Click "New Mapping" button
   - [x] Fill in form:
     - Name: "Test Mapping"
     - Source: "Guidewire PolicyCenter"
     - Target: "Canonical Data Model (CDM)"
     - Product Line: "General Liability"
   - [x] Click "Create & Edit Mappings"

4. **Test Mapping Editor:**
   - [x] Should show field mappings list
   - [x] Click "Add Field" button
   - [x] Configure a field mapping
   - [x] Click "Test Mapping" to open test panel
   - [x] Click "Save Changes"

**Screenshot checklist:**
- [ ] Homepage loads correctly
- [ ] Navigation works
- [ ] Forms are functional
- [ ] No console errors (F12)

---

### Test 6: Rules UI

#### Step 18: Open Rules UI

1. Open browser to: **http://localhost:8081**

2. You should see:
   - InsurRateX Rules Management
   - Dashboard with statistics
   - 3 rule type cards

3. **Test Lookup Tables:**
   - [x] Click "Lookup Tables"
   - [x] Click "New Lookup Table"
   - [x] Fill in:
     - Name: "Test State Codes"
     - Description: "Test lookup table"
     - Product Line: "General Liability"
   - [x] Add entries:
     - CA → 5.0
     - NY → 8.0
     - TX → 3.5
   - [x] Click "Save"

4. **Test Decision Tables:**
   - [x] Click "Decision Tables"
   - [x] Click "New Decision Table"
   - [x] Add conditions and actions
   - [x] Add rows with values
   - [x] Click "Save"

5. **Test Conditional Rules:**
   - [x] Click "Conditional Rules"
   - [x] Click "New Conditional Rule"
   - [x] Add conditions (IF part)
   - [x] Add actions (THEN part)
   - [x] Review rule preview
   - [x] Click "Save"

**Screenshot checklist:**
- [ ] Dashboard loads
- [ ] All rule types accessible
- [ ] Forms work correctly
- [ ] No console errors

---

## API Testing

### Test 7: Using Postman

#### Step 19: Import Postman Collection

1. Download Postman: https://www.postman.com/downloads/

2. Create new collection "InsurRateX Tests"

3. Add requests:

**Request 1: Health Check**
- Method: GET
- URL: `http://localhost:3000/health`
- Expected: 200 OK

**Request 2: Execute Rating**
- Method: POST
- URL: `http://localhost:3000/api/v1/rating/execute`
- Headers: `Content-Type: application/json`
- Body: Use example from `examples/gl-policy-request.json`
- Expected: 200 OK with premium data

**Request 3: List Mappings**
- Method: GET
- URL: `http://localhost:3000/api/v1/mappings`
- Expected: 200 OK with mappings array

4. Run collection and verify all tests pass

---

### Test 8: Load Testing (Optional)

#### Step 20: Simple Load Test

```bash
# Install Apache Bench (if not installed)
# Mac: brew install httpd
# Linux: apt-get install apache2-utils

# Run 100 requests with 10 concurrent
ab -n 100 -c 10 -T 'application/json' \
  -p examples/gl-policy-request.json \
  http://localhost:3000/api/v1/rating/execute

# Review results:
# - Requests per second
# - Average response time
# - Failed requests (should be 0)
```

**Expected:**
- 0 failed requests
- Average response time < 2 seconds
- Throughput > 10 req/sec

---

## Troubleshooting

### Issue 1: Services Won't Start

**Problem:** `docker-compose up` fails

**Solution:**
```bash
# Check Docker is running
docker ps

# Check ports are available
lsof -i :3000
lsof -i :3001
lsof -i :4001
lsof -i :8080
lsof -i :8081

# If ports are in use, stop conflicting services or change ports in docker-compose.yml

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

---

### Issue 2: Connection Refused

**Problem:** `curl` returns "Connection refused"

**Solution:**
```bash
# Wait longer (services take 30-60 seconds to start)
sleep 30

# Check container status
docker-compose ps

# Check logs
docker-compose logs orchestrator
docker-compose logs guidewire-mock
docker-compose logs earnix-mock

# Restart specific service
docker-compose restart orchestrator
```

---

### Issue 3: API Returns 500 Error

**Problem:** Rating request returns Internal Server Error

**Solution:**
```bash
# Check orchestrator logs
docker-compose logs orchestrator | tail -50

# Check if mocks are running
curl http://localhost:3001/health
curl http://localhost:4001/health

# Verify request JSON is valid
cat examples/gl-policy-request.json | jq

# Check environment variables
docker-compose exec orchestrator env | grep -E "GUIDEWIRE|EARNIX"
```

---

### Issue 4: UI Not Loading

**Problem:** Browser shows blank page or 404

**Solution:**
```bash
# Check UI container is running
docker-compose ps mapping-ui
docker-compose ps rules-ui

# Check logs
docker-compose logs mapping-ui
docker-compose logs rules-ui

# Verify ports
curl http://localhost:8080
curl http://localhost:8081

# Clear browser cache
# Open browser console (F12) and check for errors

# Rebuild UI
docker-compose build mapping-ui rules-ui
docker-compose up -d mapping-ui rules-ui
```

---

### Issue 5: Out of Memory

**Problem:** Docker runs out of memory

**Solution:**
```bash
# Increase Docker memory limit
# Docker Desktop → Settings → Resources → Memory: 8GB

# Or reduce replicas in docker-compose.yml

# Stop other Docker containers
docker ps
docker stop <other-containers>

# Clean up Docker
docker system prune -a
```

---

## Clean Up

### Step 21: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all

# Full cleanup (nuclear option)
docker system prune -a --volumes
```

### Step 22: Verify Cleanup

```bash
# Check no containers running
docker ps

# Check images removed
docker images | grep insurratex

# Check volumes removed
docker volume ls
```

---

## Testing Checklist

Use this checklist to verify complete testing:

### Infrastructure
- [ ] Docker and Docker Compose installed
- [ ] All services build successfully
- [ ] All services start without errors
- [ ] Health checks pass for all services

### API Testing
- [ ] Orchestrator health check responds
- [ ] Basic rating request succeeds
- [ ] Different states return different premiums
- [ ] Business rules apply correctly
- [ ] Rules can be disabled
- [ ] Error handling works (invalid requests)

### UI Testing
- [ ] Mapping UI loads in browser
- [ ] Can create new mapping
- [ ] Can edit mapping fields
- [ ] Test panel works
- [ ] Rules UI loads in browser
- [ ] Can create lookup tables
- [ ] Can create decision tables
- [ ] Can create conditional rules
- [ ] Dashboard shows statistics

### E2E Testing
- [ ] E2E test script runs successfully
- [ ] All automated tests pass
- [ ] No failed requests

### Performance
- [ ] Response times < 2 seconds
- [ ] No memory leaks
- [ ] Services stable under load

---

## Next Steps

After successful testing:

1. **Review Documentation**
   - Read [QUICK_START.md](docs/QUICK_START.md)
   - Review [API.md](docs/API.md)
   - Check [DEPLOYMENT.md](docs/DEPLOYMENT.md)

2. **Explore Features**
   - Try AI mapping suggestions (if configured)
   - Test NLP rule generation
   - Create custom mappings
   - Build custom rules

3. **Deploy to Production**
   - Review Kubernetes manifests
   - Set up CI/CD
   - Configure domains and TLS
   - Deploy to cluster

---

## Support

If you encounter issues:

1. Check [Troubleshooting](#troubleshooting) section
2. Review logs: `docker-compose logs`
3. Check [docs/](docs/) directory
4. Open an issue in repository

---

## Quick Reference

### Essential Commands

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose build

# Health check
curl http://localhost:3000/health

# Test rating
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d @examples/gl-policy-request.json | jq
```

### Service URLs

- **Orchestrator API**: http://localhost:3000
- **Mapping UI**: http://localhost:8080
- **Rules UI**: http://localhost:8081
- **Guidewire Mock**: http://localhost:3001
- **Earnix Mock**: http://localhost:4001

### Test Files

- E2E Tests: `tests/e2e/complete-rating-flow.test.sh`
- Integration Tests: `tests/integration/`
- Example Requests: `examples/`

---

**Happy Testing!** 🚀

If all tests pass, you have a fully functional InsurRateX platform ready for development and production use.
