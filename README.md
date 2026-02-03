# InsurRateX

**Plug-and-play insurance rating platform** that seamlessly integrates policy management systems with rating engines through a canonical data model.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Overview

InsurRateX is a reusable integration platform that enables insurance companies to:
- **Connect any policy system** (Guidewire, Duck Creek, Salesforce) to **any rating engine** (Earnix, ISO, custom)
- **Standardize data** using a Canonical Data Model (CDM)
- **Apply business rules** without coding (surcharges, discounts, commissions)
- **Transform data** declaratively using mapping configurations
- **Scale efficiently** with Docker containers and AWS deployment

## Architecture

```
┌──────────────────┐                                      ┌──────────────────┐
│  Policy Systems  │                                      │ Rating Engines   │
│                  │                                      │                  │
│  • Guidewire     │                                      │  • Earnix        │
│  • Duck Creek    │                                      │  • ISO           │
│  • Salesforce    │                                      │  • Custom        │
└────────┬─────────┘                                      └────────▲─────────┘
         │                                                         │
         │ System-specific format                                 │ Engine format
         ▼                                                         │
┌─────────────────────────────────────────────────────────────────┴─────┐
│                          InsurRateX Platform                          │
│                                                                        │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐             │
│  │   Mapping    │   │    Rules     │   │Orchestration │             │
│  │   Engine     │   │   Engine     │   │   Service    │             │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘             │
│         │                   │                   │                      │
│         └───────────────────┴───────────────────┘                      │
│                             │                                          │
│                  ┌──────────▼──────────┐                              │
│                  │  Canonical Data     │                              │
│                  │  Model (CDM)        │                              │
│                  └─────────────────────┘                              │
└────────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🔌 Plug-and-Play Integration
- Pre-built adapters for major insurance systems
- SDK for building custom adapters
- No code changes to existing systems

### 📊 Canonical Data Model
- 80% common base model + 20% product extensions
- Versioned schemas (e.g., `gl-v1.2`, `property-v1.0`)
- Support for GL, Property, Inland Marine, and more

### 🗺️ Declarative Mapping
- 10 transformation types (direct, lookup, expression, conditional, etc.)
- JSON-based configuration
- JSONPath support for complex field access

### 📐 Business Rules Engine
- 3 rule types: Lookup tables, Decision tables, Conditional rules
- Configurable without code
- State-specific and product-specific rules

### 🎯 Orchestration
- End-to-end rating workflow automation
- Step-by-step execution tracking
- Comprehensive error handling

### ☁️ Cloud-Ready
- Docker containerization
- AWS ECS/ECR compatible
- Kubernetes-ready
- Health checks and observability

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for local development)
- curl or Postman (for testing)

### Start Platform

```bash
# Start all services
docker-compose up

# Services will be available at:
# - Orchestrator: http://localhost:3000
# - Guidewire Mock: http://localhost:3001
# - Earnix Mock: http://localhost:4001
```

### Run Your First Rating

```bash
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "policyData": {
      "quoteNumber": "Q-2026-001234",
      "productCode": "GL",
      "insured": {
        "name": "Acme Corp",
        "businessType": "MFG",
        "state": "CA",
        "annualRevenue": 5000000
      },
      "classification": { "code": "91580" },
      "coverages": [{
        "id": "cov-001",
        "limit": 2000000,
        "deductible": 5000
      }]
    }
  }'
```

**Response:**
```json
{
  "success": true,
  "totalPremium": 15689.94,
  "premiumBreakdown": {
    "basePremium": 12500.00,
    "adjustments": [...],
    "surcharges": [...],
    "rulesApplied": [
      "State Territorial Surcharges",
      "Experience Modifier"
    ]
  },
  "metadata": {
    "executionTime": 1523,
    "steps": [...]
  }
}
```

### Explore API

Open Swagger documentation:
```
http://localhost:3000/api/docs
```

## Components

### Core Packages

| Package | Description | Version |
|---------|-------------|---------|
| [@insurratex/cdm](packages/cdm) | Canonical Data Model with product-line extensions | 1.0.0 |
| [@insurratex/adapter-sdk](packages/adapter-sdk) | SDK for building system adapters | 1.0.0 |
| [@insurratex/mapping-engine](packages/mapping-engine) | Declarative data transformation engine | 1.0.0 |
| [@insurratex/rules-engine](packages/rules-engine) | Business rules engine (lookup/decision/conditional) | 1.0.0 |

### Applications

| Application | Description | Port |
|-------------|-------------|------|
| [Orchestrator](apps/orchestrator) | Main orchestration service | 3000 |

### Mock Services

| Mock | Description | Port |
|------|-------------|------|
| [Guidewire Mock](packages/mocks/guidewire-mock) | Guidewire PolicyCenter simulator | 3001 |
| [Earnix Mock](packages/mocks/earnix-mock) | Earnix Rating Engine simulator | 4001 |

## Workflow Example

1. **Submit Policy** → Guidewire (or any policy system)
2. **Transform to CDM** → Mapping Engine converts to canonical format
3. **Apply Rules** → Rules Engine evaluates surcharges, modifiers, discounts
4. **Transform to Engine** → Mapping Engine converts CDM to rating engine format
5. **Calculate Premium** → Earnix (or any rating engine)
6. **Return Results** → Complete premium breakdown with execution metadata

## Documentation

- **[Quick Start Guide](docs/QUICK_START.md)** - Get up and running in 15 minutes
- **[Development Guide](DEVELOPMENT-GUIDE.md)** - Step-by-step implementation guide

### Package-Specific Docs

- [CDM Documentation](packages/cdm/README.md)
- [Adapter SDK Documentation](packages/adapter-sdk/README.md)
- [Mapping Engine Documentation](packages/mapping-engine/README.md)
- [Rules Engine Documentation](packages/rules-engine/README.md)
- [Orchestrator Documentation](apps/orchestrator/README.md)

## Project Structure

```
rating-poc/
├── packages/                   # Reusable npm packages
│   ├── cdm/                   # Canonical Data Model
│   ├── adapter-sdk/           # Adapter SDK
│   ├── mapping-engine/        # Mapping engine
│   ├── rules-engine/          # Rules engine
│   └── mocks/                 # Mock services
│       ├── guidewire-mock/
│       └── earnix-mock/
├── apps/                      # Applications
│   └── orchestrator/          # Orchestration service
├── tests/                     # Tests
│   ├── e2e/                  # End-to-end tests
│   └── integration/          # Integration tests
├── docs/                      # Documentation
└── docker-compose.yml         # Docker Compose configuration
```

## Testing

```bash
# Run end-to-end tests
chmod +x tests/e2e/complete-rating-flow.test.sh
./tests/e2e/complete-rating-flow.test.sh

# Run unit tests (example for a package)
cd packages/mapping-engine
npm test
```

## License

MIT

---

**InsurRateX** - Making insurance system integration simple, configurable, and reusable.
