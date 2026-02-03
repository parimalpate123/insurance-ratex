# InsurRateX Quick Start Guide

Get up and running with InsurRateX in 15 minutes.

## Prerequisites

- **Docker & Docker Compose** (for running services)
- **Node.js 18+** (for local development)
- **curl or Postman** (for testing APIs)
- **Git** (for cloning repository)

## Quick Start (Docker)

### 1. Clone and Start Services

```bash
# Clone repository
git clone <repository-url>
cd rating-poc

# Start all services
docker-compose up --build

# Or start in detached mode
docker-compose up -d
```

This starts:
- **Guidewire Mock** (port 3001)
- **Earnix Mock** (port 4001)
- **Orchestrator** (port 3000)

### 2. Verify Services

```bash
# Check all services are healthy
curl http://localhost:3000/health  # Orchestrator
curl http://localhost:3001/health  # Guidewire
curl http://localhost:4001/health  # Earnix
```

### 3. Run Your First Rating

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "policyData": {
      "quoteNumber": "Q-QUICKSTART-001",
      "productCode": "GL",
      "insured": {
        "name": "Acme Corp",
        "businessType": "MFG",
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
  "totalPremium": 15689.94,
  "premiumBreakdown": {
    "basePremium": 12500.00,
    "rulesApplied": ["State Territorial Surcharges", "Experience Modifier"]
  },
  "metadata": {
    "executionTime": 1523,
    "steps": [...]
  }
}
```

### 4. Explore API Documentation

Open Swagger docs in your browser:
```
http://localhost:3000/api/docs
```

## Run E2E Tests

```bash
# Make test script executable
chmod +x tests/e2e/complete-rating-flow.test.sh

# Run end-to-end tests
./tests/e2e/complete-rating-flow.test.sh
```

## Architecture Overview

```
┌─────────────────┐
│ Policy System   │ (Guidewire)
│ Port: 3001      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  Orchestrator   │◄────►│ Mapping      │
│  Port: 3000     │      │ Engine       │
└────────┬────────┘      └──────────────┘
         │
         │               ┌──────────────┐
         ├──────────────►│ Rules Engine │
         │               └──────────────┘
         │
         ▼
┌─────────────────┐
│ Rating Engine   │ (Earnix)
│ Port: 4001      │
└─────────────────┘
```

## Key Concepts

### 1. Canonical Data Model (CDM)

Standardized format for insurance policies. All systems transform to/from CDM:
- **Base Model** (80%): Common fields across all product lines
- **Extensions** (20%): Product-specific fields
- **Versioned**: Each product line has versioned schemas

### 2. Mapping Engine

Transforms data between systems and CDM:
- **10 transformation types**: direct, lookup, expression, conditional, etc.
- **JSONPath support**: Access nested fields
- **Validation**: Built-in field validators

### 3. Rules Engine

Business logic without code:
- **Lookup Tables**: State surcharges, commission rates
- **Decision Tables**: Experience modifiers, tiered discounts
- **Conditional Rules**: Complex if-then logic

### 4. Orchestrator

Coordinates the complete rating flow:
1. Transform source → CDM
2. Apply business rules
3. Transform CDM → rating engine
4. Calculate premium

## Common Use Cases

### Use Case 1: Rate a GL Policy

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d @examples/gl-policy-request.json
```

### Use Case 2: Direct Guidewire Submission

```bash
curl -X POST http://localhost:3001/pc/rating/submit \
  -H "Content-Type: application/json" \
  -d @packages/mocks/guidewire-mock/src/rating/data/sample-gl-policy.json
```

### Use Case 3: Direct Earnix Rating

```bash
curl -X POST http://localhost:4001/earnix/api/v1/rate \
  -H "Content-Type: application/json" \
  -d @packages/mocks/earnix-mock/src/rating/data/sample-rating-request.json
```

## Directory Structure

```
rating-poc/
├── packages/
│   ├── cdm/                    # Canonical Data Model
│   ├── adapter-sdk/            # SDK for building adapters
│   ├── mapping-engine/         # Data transformation engine
│   ├── rules-engine/           # Business rules engine
│   └── mocks/
│       ├── guidewire-mock/     # Guidewire PolicyCenter mock
│       └── earnix-mock/        # Earnix Rating Engine mock
├── apps/
│   └── orchestrator/           # Orchestration service
├── tests/
│   ├── e2e/                    # End-to-end tests
│   └── integration/            # Integration tests
└── docs/                       # Documentation
```

## Next Steps

1. **Explore APIs**: Open http://localhost:3000/api/docs
2. **Try Different States**: Test rating for CA, TX, NY
3. **Modify Rules**: Edit rules in `packages/rules-engine/rules/`
4. **Add Mappings**: Create new mappings in `packages/mapping-engine/mappings/`
5. **Read Architecture**: See `docs/ARCHITECTURE.md`

## Troubleshooting

### Services Won't Start

```bash
# Check Docker is running
docker --version

# Check ports are available
lsof -i :3000  # Orchestrator
lsof -i :3001  # Guidewire
lsof -i :4001  # Earnix

# View logs
docker-compose logs orchestrator
docker-compose logs guidewire-mock
docker-compose logs earnix-mock
```

### Rating Request Fails

```bash
# Check orchestrator logs
docker-compose logs -f orchestrator

# Test services individually
curl http://localhost:3001/health
curl http://localhost:4001/health
```

### Mapping Not Found

Ensure mapping configurations are loaded. Check:
- `packages/mapping-engine/mappings/guidewire-to-cdm-gl.json`
- `packages/mapping-engine/mappings/cdm-to-earnix-gl.json`

## Getting Help

- **Documentation**: See `docs/` directory
- **Examples**: See `examples/` directory
- **API Docs**: http://localhost:3000/api/docs
- **Issues**: Create an issue in the repository

## Clean Up

```bash
# Stop services
docker-compose down

# Remove volumes
docker-compose down -v

# Remove images
docker-compose down --rmi all
```

## Production Deployment

For production deployment to AWS:
- See `docs/DEPLOYMENT.md`
- Review `ARCHITECTURE.md` for scaling considerations
- Check individual service READMEs for configuration options

---

**Congratulations!** You now have a working InsurRateX platform. Happy rating! 🎉
