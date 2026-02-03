# InsurRateX Development Guide
**Quick Reference for Step-by-Step Implementation**

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Development Phases](#development-phases)
3. [Setup Instructions](#setup-instructions)
4. [Component Specifications](#component-specifications)
5. [API Contracts](#api-contracts)
6. [Code Templates](#code-templates)
7. [Testing Strategy](#testing-strategy)
8. [Common Commands](#common-commands)

---

## Project Overview

**Goal:** Build InsurRateX - a plug-and-play insurance rating exchange platform

**Tech Stack:**
- Language: TypeScript
- Backend: NestJS
- Frontend: React + Vite
- Database: PostgreSQL (later), In-memory (initial)
- Containers: Docker
- Package Manager: npm

**Primary Systems:**
- Policy System: **Guidewire PolicyCenter** (mock)
- Rating Engine: **Earnix** (mock)
- Product Line: **General Liability (GL)**

---

## Development Phases

### Phase 1: Mock Servers (Week 1) - START HERE
**Priority: HIGH | Complexity: LOW**

Build Guidewire and Earnix mock servers to enable end-to-end testing.

**Deliverables:**
- [ ] Guidewire mock (port 3001)
- [ ] Earnix mock (port 4001)
- [ ] Docker setup
- [ ] Sample payloads

**See:** [Mock Servers Specification](#mock-servers-specification)

---

### Phase 2: CDM & Adapter SDK (Week 2)
**Priority: HIGH | Complexity: MEDIUM**

Create canonical data model and adapter SDK library.

**Deliverables:**
- [ ] CDM JSON schemas
- [ ] TypeScript types (auto-generated)
- [ ] Adapter SDK interfaces
- [ ] Utility functions (validators, transformers)

**See:** [CDM Specification](#cdm-specification), [Adapter SDK Specification](#adapter-sdk-specification)

---

### Phase 3: Orchestrator (Week 3)
**Priority: HIGH | Complexity: MEDIUM**

Build the NestJS orchestrator that routes requests between systems.

**Deliverables:**
- [ ] NestJS app structure
- [ ] Adapter registry
- [ ] Mapping engine
- [ ] Rules engine
- [ ] REST API endpoints

**See:** [Orchestrator Specification](#orchestrator-specification)

---

### Phase 4: Mapping UI (Week 4)
**Priority: MEDIUM | Complexity: MEDIUM**

Build React UI for BAs to create mappings visually.

**Deliverables:**
- [ ] React app with Vite
- [ ] Drag-drop mapping canvas
- [ ] Test harness
- [ ] Versioning UI

**See:** [UI Specification](#ui-specification)

---

## Setup Instructions

### Prerequisites
```bash
# Required
node --version  # v18+
npm --version   # v9+
docker --version

# Recommended
git --version
code --version  # VS Code
```

### Initial Project Setup
```bash
# Create project structure
mkdir -p rating-poc/packages/mocks/{guidewire-mock,earnix-mock}
mkdir -p rating-poc/packages/{adapter-sdk,cdm-schemas}
mkdir -p rating-poc/apps/{orchestrator,ui}

cd rating-poc

# Initialize monorepo
npm init -y
npm install -D typescript @types/node

# Create workspace config
cat > package.json << 'EOF'
{
  "name": "insurratex",
  "version": "0.1.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*",
    "packages/mocks/*"
  ],
  "scripts": {
    "dev": "docker-compose up",
    "build": "npm run build --workspaces",
    "test": "npm run test --workspaces"
  }
}
EOF

# Create tsconfig.json (root)
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
EOF
```

---

## Component Specifications

### Mock Servers Specification

#### Guidewire Mock Server

**Location:** `packages/mocks/guidewire-mock/`

**Purpose:** Simulate Guidewire PolicyCenter API for GL submissions

**Port:** 3001

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | /pc/rating/submit | Submit policy for rating |
| GET | /pc/policy/:id | Get policy details |
| POST | /pc/policy/bind | Bind policy |
| GET | /health | Health check |

**Sample Request (POST /pc/rating/submit):**
```json
{
  "policyNumber": "POL-2024-001",
  "effectiveDate": "2024-01-01T00:00:00Z",
  "expirationDate": "2025-01-01T00:00:00Z",
  "insured": {
    "name": "Acme Manufacturing Corp",
    "taxId": "12-3456789",
    "primaryAddress": {
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105"
    },
    "businessType": "Manufacturing",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },
  "coverages": [
    {
      "coverageCode": "GeneralLiability",
      "limits": {
        "generalAggregate": 2000000,
        "eachOccurrence": 1000000
      },
      "deductible": 5000
    }
  ]
}
```

**Sample Response:**
```json
{
  "quoteNumber": "Q-2024-001",
  "policyNumber": "POL-2024-001",
  "status": "Quoted",
  "premium": {
    "basePremium": 12000.00,
    "surcharges": [
      {
        "type": "TerritorialSurcharge",
        "description": "California High-Risk Territory",
        "amount": 600.00
      }
    ],
    "totalPremium": 12600.00,
    "taxes": 126.00,
    "fees": 50.00,
    "grandTotal": 12776.00
  }
}
```

**Implementation Steps:**
1. Create NestJS project
2. Define DTOs for request/response
3. Implement controller with 3 endpoints
4. Add in-memory data store
5. Add validation middleware
6. Write unit tests
7. Dockerize

**Dependencies:**
```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/platform-express": "^10.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.0"
  }
}
```

**File Structure:**
```
packages/mocks/guidewire-mock/
├─ src/
│   ├─ app.module.ts
│   ├─ main.ts
│   ├─ rating/
│   │   ├─ rating.controller.ts
│   │   ├─ rating.service.ts
│   │   ├─ dto/
│   │   │   ├─ submit-request.dto.ts
│   │   │   └─ quote-response.dto.ts
│   │   └─ data/
│   │       └─ sample-policies.json
│   └─ policy/
│       ├─ policy.controller.ts
│       └─ policy.service.ts
├─ test/
├─ Dockerfile
├─ package.json
└─ tsconfig.json
```

---

#### Earnix Mock Server

**Location:** `packages/mocks/earnix-mock/`

**Purpose:** Simulate Earnix Rating Engine with realistic calculations

**Port:** 4001

**Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | /earnix/api/v1/rate | Calculate premium |
| POST | /earnix/api/v1/validate | Validate policy data |
| GET | /earnix/api/v1/rating-factors | Get available factors |
| GET | /health | Health check |

**Sample Request (POST /earnix/api/v1/rate):**
```json
{
  "requestId": "req-12345",
  "productLine": "general-liability",
  "productVersion": "gl-v1.2",
  "insured": {
    "state": "CA",
    "businessType": "manufacturing",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },
  "coverages": [
    {
      "type": "general-liability",
      "limit": 2000000,
      "deductible": 5000
    }
  ],
  "ratingFactors": {
    "classCode": "91580",
    "yearsInBusiness": 10,
    "claimsHistory": {
      "priorClaimsCount": 1,
      "priorClaimsAmount": 25000
    }
  }
}
```

**Sample Response:**
```json
{
  "requestId": "req-12345",
  "quoteId": "EAR-Q-2024-001",
  "status": "Rated",
  "premium": {
    "basePremium": 12500.00,
    "adjustments": [
      {
        "type": "TerritorialFactor",
        "factor": 1.15,
        "description": "California Territory",
        "amount": 1875.00
      },
      {
        "type": "ExperienceMod",
        "factor": 1.00,
        "description": "Clean Claims History",
        "amount": 0.00
      }
    ],
    "surcharges": [
      {
        "type": "HighValueSurcharge",
        "amount": 500.00
      }
    ],
    "totalPremium": 16550.63
  },
  "ratingFactorsUsed": {
    "baseRate": 2.50,
    "territorialFactor": 1.15,
    "experienceMod": 1.00
  }
}
```

**Rating Logic (Simplified):**
```typescript
// Core algorithm
basePremium = exposureBase * baseRate;
territorialPremium = basePremium * territorialFactor(state);
modifiedPremium = territorialPremium * experienceMod(claimsHistory);
finalPremium = modifiedPremium * limitFactor(coverageLimit);
totalPremium = finalPremium + surcharges;
```

**Implementation Steps:**
1. Create NestJS project
2. Define DTOs for rating request/response
3. Implement RatingEngineService with formulas
4. Create configurable rule files (JSON)
5. Implement controller
6. Add comprehensive tests (rating scenarios)
7. Dockerize

**File Structure:**
```
packages/mocks/earnix-mock/
├─ src/
│   ├─ app.module.ts
│   ├─ main.ts
│   ├─ rating/
│   │   ├─ rating.controller.ts
│   │   ├─ rating-engine.service.ts
│   │   ├─ territorial-factors.service.ts
│   │   └─ surcharge-calculator.service.ts
│   ├─ dto/
│   │   ├─ rating-request.dto.ts
│   │   └─ premium-response.dto.ts
│   └─ rules/
│       ├─ base-rates.json
│       ├─ territorial-factors.json
│       └─ surcharge-rules.json
├─ test/
├─ Dockerfile
└─ package.json
```

**Rating Rules Files:**

`rules/base-rates.json`:
```json
{
  "91580": { "description": "Machine Shops", "rate": 2.50 },
  "10380": { "description": "Professional Services", "rate": 1.20 },
  "13350": { "description": "Construction", "rate": 3.80 }
}
```

`rules/territorial-factors.json`:
```json
{
  "CA": 1.15,
  "TX": 0.95,
  "NY": 1.10,
  "FL": 1.05
}
```

`rules/surcharge-rules.json`:
```json
{
  "highValueCA": {
    "conditions": {
      "state": "CA",
      "minCoverageLimit": 1000000
    },
    "amount": 500,
    "description": "CA High-Value Surcharge"
  }
}
```

---

### CDM Specification

**Location:** `packages/cdm-schemas/`

**Purpose:** Canonical Data Model for insurance data exchange

**Structure:**

```
packages/cdm-schemas/
├─ schemas/
│   ├─ base/
│   │   ├─ cdm-request.schema.json
│   │   ├─ cdm-response.schema.json
│   │   ├─ policy.schema.json
│   │   ├─ insured.schema.json
│   │   └─ coverage.schema.json
│   └─ products/
│       ├─ general-liability-v1.2.schema.json
│       ├─ property-v1.0.schema.json
│       └─ inland-marine-v1.0.schema.json
├─ types/          # Auto-generated TypeScript types
├─ validators/     # Runtime validators
├─ scripts/
│   └─ generate-types.ts
└─ package.json
```

**Base CDM Schema (cdm-request.schema.json):**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["version", "correlationId", "policy", "insured"],
  "properties": {
    "version": {
      "type": "string",
      "pattern": "^cdm-v[0-9]+\\.[0-9]+$",
      "description": "CDM version"
    },
    "correlationId": {
      "type": "string",
      "description": "Request correlation ID"
    },
    "timestamp": {
      "type": "string",
      "format": "date-time"
    },
    "policy": {
      "$ref": "#/definitions/Policy"
    },
    "insured": {
      "$ref": "#/definitions/Insured"
    },
    "coverages": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/Coverage"
      }
    },
    "ratingFactors": {
      "type": "object",
      "additionalProperties": true
    },
    "customFields": {
      "type": "object",
      "additionalProperties": true
    }
  },
  "definitions": {
    "Policy": {
      "type": "object",
      "required": ["id", "effectiveDate", "productLine"],
      "properties": {
        "id": { "type": "string" },
        "effectiveDate": { "type": "string", "format": "date" },
        "expiryDate": { "type": "string", "format": "date" },
        "status": { "type": "string", "enum": ["active", "pending", "cancelled"] },
        "productLine": { "type": "string" },
        "productVersion": { "type": "string" }
      }
    },
    "Insured": {
      "type": "object",
      "required": ["name", "type"],
      "properties": {
        "type": { "type": "string", "enum": ["individual", "business"] },
        "name": { "type": "string" },
        "taxId": { "type": "string" },
        "address": {
          "$ref": "#/definitions/Address"
        }
      }
    },
    "Address": {
      "type": "object",
      "properties": {
        "street": { "type": "string" },
        "city": { "type": "string" },
        "state": { "type": "string", "pattern": "^[A-Z]{2}$" },
        "zip": { "type": "string" }
      }
    },
    "Coverage": {
      "type": "object",
      "required": ["type", "limit"],
      "properties": {
        "coverageId": { "type": "string" },
        "type": { "type": "string" },
        "limit": { "type": "number", "minimum": 0 },
        "deductible": { "type": "number", "minimum": 0 },
        "premium": { "type": ["number", "null"] }
      }
    }
  }
}
```

**TypeScript Type Generation:**
```bash
# Use json-schema-to-typescript
npm install -D json-schema-to-typescript

# Script: scripts/generate-types.ts
import { compile } from 'json-schema-to-typescript';
import fs from 'fs';

const schemas = ['cdm-request.schema.json', 'cdm-response.schema.json'];

schemas.forEach(async (schema) => {
  const schemaPath = `./schemas/base/${schema}`;
  const ts = await compile(JSON.parse(fs.readFileSync(schemaPath, 'utf-8')), schema);
  fs.writeFileSync(`./types/${schema.replace('.schema.json', '.d.ts')}`, ts);
});
```

---

### Adapter SDK Specification

**Location:** `packages/adapter-sdk/`

**Purpose:** Reusable library for building adapters

**Exports:**
- Interfaces (PolicySystemAdapter, RatingEngineAdapter)
- Utilities (validators, transformers, formatters)
- Base classes (BaseAdapter)
- Mock helpers (for testing)

**File Structure:**
```
packages/adapter-sdk/
├─ src/
│   ├─ index.ts
│   ├─ interfaces/
│   │   ├─ policy-system-adapter.interface.ts
│   │   ├─ rating-engine-adapter.interface.ts
│   │   └─ adapter-config.interface.ts
│   ├─ base/
│   │   ├─ base-policy-adapter.ts
│   │   └─ base-rating-adapter.ts
│   ├─ utils/
│   │   ├─ validators.ts
│   │   ├─ transformers.ts
│   │   ├─ formatters.ts
│   │   └─ retry.ts
│   ├─ types/
│   │   └─ cdm.types.ts  # Re-export from cdm-schemas
│   └─ testing/
│       ├─ mock-cdm.ts
│       └─ adapter-test-suite.ts
├─ test/
└─ package.json
```

**Key Interface:**
```typescript
// src/interfaces/policy-system-adapter.interface.ts
export interface PolicySystemAdapter {
  // Metadata
  readonly name: string;
  readonly version: string;
  readonly supportedFormats: ('json' | 'xml')[];

  // Lifecycle
  authenticate(config: AdapterConfig): Promise<AuthToken>;
  healthCheck(): Promise<boolean>;

  // Request handling
  receiveRequest(payload: unknown): Promise<RawRequest>;
  transformToCDM(raw: RawRequest): Promise<CDMRequest>;

  // Response handling
  transformFromCDM(cdmResponse: CDMResponse): Promise<unknown>;
  sendResponse(payload: unknown): Promise<void>;

  // Error handling
  handleError(error: Error): ErrorResponse;
}
```

**Utilities Example:**
```typescript
// src/utils/validators.ts
import Ajv from 'ajv';
import { CDMRequest } from '../types/cdm.types';
import cdmSchema from '@insurratex/cdm-schemas/schemas/base/cdm-request.schema.json';

const ajv = new Ajv();
const validate = ajv.compile(cdmSchema);

export function validateCDM(data: unknown, productVersion?: string): CDMRequest {
  const valid = validate(data);
  if (!valid) {
    throw new Error(`CDM validation failed: ${JSON.stringify(validate.errors)}`);
  }
  return data as CDMRequest;
}

// src/utils/transformers.ts
export function jsonToXml(json: object): string {
  // Implementation
}

export function xmlToJson(xml: string): object {
  // Implementation
}

// src/utils/formatters.ts
export function formatDate(date: string | Date, format: string): string {
  // Using date-fns
  return format(new Date(date), format);
}
```

---

### Orchestrator Specification

**Location:** `apps/orchestrator/`

**Purpose:** Core routing and orchestration service

**Port:** 3000

**Architecture:**
```
apps/orchestrator/
├─ src/
│   ├─ main.ts
│   ├─ app.module.ts
│   ├─ adapters/
│   │   ├─ adapters.module.ts
│   │   ├─ adapter-registry.service.ts
│   │   ├─ guidewire/
│   │   │   └─ guidewire.adapter.ts
│   │   └─ earnix/
│   │       └─ earnix.adapter.ts
│   ├─ mapping/
│   │   ├─ mapping.module.ts
│   │   ├─ mapping.service.ts
│   │   ├─ mapping-registry.service.ts
│   │   └─ transformers/
│   │       ├─ field-mapper.ts
│   │       └─ format-converter.ts
│   ├─ rules/
│   │   ├─ rules.module.ts
│   │   ├─ rules-engine.service.ts
│   │   ├─ lookup-table.service.ts
│   │   └─ evaluators/
│   │       ├─ conditional-rule.evaluator.ts
│   │       └─ decision-table.evaluator.ts
│   ├─ rating/
│   │   ├─ rating.module.ts
│   │   ├─ rating.controller.ts
│   │   └─ rating.service.ts
│   └─ common/
│       ├─ correlation-id.middleware.ts
│       ├─ logger.service.ts
│       └─ error.filter.ts
└─ config/
    ├─ adapters.config.ts
    └─ mappings/
        └─ guidewire-to-cdm-gl-v1.0.json
```

**API Endpoints:**
| Method | Path | Purpose |
|--------|------|---------|
| POST | /api/v1/rate | Submit rating request |
| GET | /api/v1/mappings | List mappings |
| POST | /api/v1/mappings | Create mapping |
| GET | /api/v1/mappings/:id | Get mapping |
| PUT | /api/v1/mappings/:id | Update mapping |
| GET | /health | Health check |

---

## API Contracts

### Rating Request Flow

**1. Client → Orchestrator**
```http
POST /api/v1/rate
Content-Type: application/json
X-Source-System: guidewire
X-Target-System: earnix
X-Mapping-Version: gw-to-cdm-gl-v1.0

{
  "policyNumber": "POL-2024-001",
  "effectiveDate": "2024-01-01T00:00:00Z",
  ...
}
```

**2. Orchestrator → Guidewire Adapter → CDM**
```typescript
// Internal transformation
const cdm: CDMRequest = await guidewireAdapter.transformToCDM(rawRequest);
```

**3. Orchestrator → Rules Engine**
```typescript
// Apply rules to CDM
const enrichedCDM = await rulesEngine.evaluate(cdm, ruleSet);
```

**4. Orchestrator → Earnix Adapter**
```typescript
// Transform CDM to Earnix format
const earnixRequest = await earnixAdapter.transformFromCDM(enrichedCDM);
const earnixResponse = await earnixAdapter.rate(earnixRequest);
```

**5. Orchestrator → Client**
```http
HTTP/1.1 200 OK
Content-Type: application/json
X-Correlation-ID: req-12345

{
  "quoteNumber": "Q-2024-001",
  "premium": {
    "totalPremium": 12600.00
  }
}
```

---

## Code Templates

### NestJS Controller Template
```typescript
import { Controller, Post, Body, Get, Param } from '@nestjs/common';

@Controller('api/v1/rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('submit')
  async submitForRating(@Body() request: SubmitRatingDto) {
    return this.ratingService.processRating(request);
  }

  @Get('quote/:quoteId')
  async getQuote(@Param('quoteId') quoteId: string) {
    return this.ratingService.getQuote(quoteId);
  }
}
```

### Adapter Implementation Template
```typescript
import { PolicySystemAdapter, CDMRequest } from '@insurratex/adapter-sdk';

export class GuidewireAdapter implements PolicySystemAdapter {
  readonly name = 'Guidewire';
  readonly version = '1.0.0';
  readonly supportedFormats = ['json'];

  async authenticate(config: AdapterConfig): Promise<AuthToken> {
    // OAuth implementation
  }

  async transformToCDM(raw: RawRequest): Promise<CDMRequest> {
    const cdm: CDMRequest = {
      version: 'cdm-v1.0',
      correlationId: generateCorrelationId(),
      policy: {
        id: raw.policyNumber,
        effectiveDate: formatDate(raw.effectiveDate, 'yyyy-MM-dd'),
        productLine: 'general-liability',
        productVersion: 'gl-v1.2'
      },
      insured: {
        type: 'business',
        name: raw.insured.name,
        // ...
      },
      coverages: raw.coverages.map(c => ({
        type: c.coverageCode,
        limit: c.limits.generalAggregate,
        deductible: c.deductible
      }))
    };

    validateCDM(cdm, 'gl-v1.2');
    return cdm;
  }

  async transformFromCDM(cdmResponse: CDMResponse): Promise<unknown> {
    // Transform back to Guidewire format
  }

  async handleError(error: Error): ErrorResponse {
    return {
      status: 'error',
      message: error.message,
      timestamp: new Date()
    };
  }
}
```

---

## Testing Strategy

### Unit Tests
```typescript
// Example: Earnix rating engine test
describe('RatingEngineService', () => {
  let service: RatingEngineService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [RatingEngineService],
    }).compile();

    service = module.get<RatingEngineService>(RatingEngineService);
  });

  it('should calculate base premium correctly', () => {
    const request = {
      ratingFactors: { classCode: '91580' },
      insured: { annualRevenue: 5000000 }
    };

    const premium = service.calculateBasePremium(request);
    expect(premium).toBe(12500); // 2.50 * 5000
  });

  it('should apply territorial factor for CA', () => {
    const basePremium = 10000;
    const adjusted = service.applyTerritorialFactor(basePremium, 'CA');
    expect(adjusted).toBe(11500); // 10000 * 1.15
  });
});
```

### Integration Tests
```typescript
// Example: End-to-end rating flow
describe('Rating Flow (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/v1/rate (POST) - should rate GL policy', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/rate')
      .send({
        policyNumber: 'POL-TEST-001',
        // ... full payload
      })
      .expect(200);

    expect(response.body).toHaveProperty('quoteNumber');
    expect(response.body.premium.totalPremium).toBeGreaterThan(0);
  });
});
```

---

## Common Commands

### Development
```bash
# Install all dependencies
npm install

# Start all services (Docker)
docker-compose up

# Start specific service
docker-compose up guidewire-mock

# Watch mode (development)
npm run dev -w @insurratex/guidewire-mock

# Build all packages
npm run build --workspaces

# Lint
npm run lint --workspaces

# Format
npm run format --workspaces
```

### Testing
```bash
# Run all tests
npm run test --workspaces

# Run tests for specific package
npm run test -w @insurratex/earnix-mock

# Run e2e tests
npm run test:e2e -w @insurratex/orchestrator

# Coverage
npm run test:cov --workspaces
```

### Docker
```bash
# Build all images
docker-compose build

# Rebuild specific service
docker-compose build guidewire-mock

# View logs
docker-compose logs -f guidewire-mock

# Stop all services
docker-compose down

# Remove volumes
docker-compose down -v
```

### Package Management
```bash
# Add dependency to specific package
npm install express -w @insurratex/guidewire-mock

# Link local packages
npm link @insurratex/adapter-sdk -w @insurratex/orchestrator

# Publish package (when ready)
npm publish -w @insurratex/adapter-sdk
```

---

## Quick Start Checklist

**Day 1: Environment Setup**
- [ ] Clone repo
- [ ] Install Node.js 18+
- [ ] Install Docker Desktop
- [ ] Run `npm install`
- [ ] Verify: `docker-compose up` works

**Week 1: Guidewire Mock**
- [ ] Create NestJS app in `packages/mocks/guidewire-mock`
- [ ] Implement POST /pc/rating/submit endpoint
- [ ] Add sample GL policy data
- [ ] Dockerize
- [ ] Test: `curl http://localhost:3001/pc/rating/submit`

**Week 1: Earnix Mock**
- [ ] Create NestJS app in `packages/mocks/earnix-mock`
- [ ] Implement rating engine service
- [ ] Add configurable rules (JSON files)
- [ ] Dockerize
- [ ] Test: End-to-end Guidewire → Earnix flow

**Week 2: CDM**
- [ ] Create JSON schemas
- [ ] Generate TypeScript types
- [ ] Create validators
- [ ] Publish as npm package

**Week 3: Orchestrator**
- [ ] Create NestJS app
- [ ] Implement adapters
- [ ] Add mapping engine
- [ ] Add rules engine
- [ ] Test: Full flow works

---

## Context for Claude Code

**When starting a new session, reference these docs:**
1. This file (DEVELOPMENT-GUIDE.md) - Overall structure
2. InsurRateX-Requirements.md - Business requirements
3. ARCHITECTURE.md (create next) - Detailed architecture decisions

**Token-saving tips:**
- Link to specific sections: "See Mock Servers Specification above"
- Use code templates instead of writing from scratch
- Reference API contracts for interfaces
- Copy sample payloads from specs

---

**Last Updated:** 2026-01-31
**Version:** 1.0.0
**Status:** Ready for Development
