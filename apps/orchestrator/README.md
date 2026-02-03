# InsurRateX Orchestrator

Orchestration service that coordinates the end-to-end insurance rating workflow.

## Overview

The Orchestrator is the central service that ties together all InsurRateX components:

1. **Policy Systems** (Guidewire, Duck Creek, Salesforce)
2. **CDM Transformation** (via Mapping Engine)
3. **Business Rules** (via Rules Engine)
4. **Rating Engines** (Earnix, ISO, Custom)

## Architecture

```
Policy System → Orchestrator → Rating Engine
                    ↓
           [CDM Transformation]
                    ↓
           [Business Rules]
                    ↓
           [Rating Calculation]
```

## Features

- **End-to-End Workflow**: Complete rating flow from policy data to premium calculation
- **System Agnostic**: Works with any policy system or rating engine
- **Business Rules**: Applies configurable business rules during rating
- **Observability**: Detailed execution metadata and step-by-step tracking
- **Error Handling**: Comprehensive error handling with detailed messages
- **Swagger API**: Interactive API documentation
- **Health Checks**: Built-in health monitoring
- **Docker Support**: Container-ready for AWS ECS/EKS deployment

## API Endpoints

### POST /api/v1/rating/execute

Execute end-to-end rating flow.

**Request:**
```json
{
  "sourceSystem": "guidewire",
  "ratingEngine": "earnix",
  "productLine": "general-liability",
  "policyData": {
    "quoteNumber": "Q-2026-001234",
    "productCode": "GL",
    "effectiveDate": "2026-03-01",
    "expirationDate": "2027-03-01",
    "insured": {
      "name": "Acme Manufacturing Corp",
      "businessType": "MFG",
      "addressLine1": "1234 Industrial Pkwy",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "annualRevenue": 5000000
    },
    "classification": {
      "code": "91580"
    }
  },
  "requestId": "req-001",
  "applyRules": true
}
```

**Response:**
```json
{
  "requestId": "req-001",
  "success": true,
  "quoteNumber": "Q-2026-001234",
  "totalPremium": 15689.94,
  "premiumBreakdown": {
    "basePremium": 12500.00,
    "adjustments": [...],
    "surcharges": [...],
    "taxes": 154.60,
    "fees": 75.00,
    "rulesApplied": [
      "State Territorial Surcharges",
      "Experience Modifier",
      "CA High-Value Policy Surcharge"
    ]
  },
  "cdmPolicy": { ... },
  "metadata": {
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "executionTime": 1523,
    "steps": [
      {
        "step": "transform-to-cdm",
        "duration": 342,
        "success": true
      },
      {
        "step": "apply-business-rules",
        "duration": 156,
        "success": true
      },
      {
        "step": "transform-to-rating-engine",
        "duration": 198,
        "success": true
      },
      {
        "step": "call-rating-engine",
        "duration": 827,
        "success": true
      }
    ]
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "orchestrator",
  "timestamp": "2026-01-31T10:30:00.000Z",
  "version": "1.0.0"
}
```

### GET /api/docs

Interactive Swagger API documentation.

## Workflow Steps

### Step 1: Transform to CDM

Transforms policy data from source system format to Canonical Data Model (CDM).

- Uses Mapping Engine with configured transformations
- Validates required fields
- Applies field-level transformations (lookup, expression, conditional)

### Step 2: Apply Business Rules

Evaluates business rules against CDM policy data.

- State surcharges
- Experience modifiers based on claims history
- High-value policy surcharges
- Product-specific rules
- Commission calculations

### Step 3: Transform to Rating Engine

Transforms CDM policy to rating engine format.

- Maps CDM fields to rating engine schema
- Applies engine-specific transformations
- Prepares rating request payload

### Step 4: Call Rating Engine

Sends rating request to rating engine and receives premium calculation.

- HTTP call to rating engine API
- Handles retries and timeouts
- Returns detailed premium breakdown

## Running Locally

### Development Mode

```bash
# Install dependencies
npm install

# Start in watch mode
npm run dev
```

Server runs on: http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

### Production Mode

```bash
npm run build
npm run start:prod
```

### Docker

```bash
# Build image
docker build -t orchestrator .

# Run container
docker run -p 3000:3000 \
  -e GUIDEWIRE_URL=http://guidewire-mock:3001 \
  -e EARNIX_URL=http://earnix-mock:4001/earnix/api/v1 \
  orchestrator
```

### Docker Compose

```bash
# Start all services
docker-compose up

# Orchestrator + Guidewire + Earnix
docker-compose up orchestrator guidewire-mock earnix-mock
```

## Configuration

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Policy Systems
GUIDEWIRE_URL=http://localhost:3001
DUCK_CREEK_URL=http://localhost:3002

# Rating Engines
EARNIX_URL=http://localhost:4001/earnix/api/v1
ISO_URL=http://localhost:4002/iso/api/v1

# Features
ENABLE_RULES=true
LOG_LEVEL=debug
```

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:3000/health

# Execute rating (with complete example)
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
        "state": "CA"
      }
    }
  }'
```

### Unit Tests

```bash
npm test
npm run test:watch
npm run test:cov
```

### E2E Tests

```bash
npm run test:e2e
```

## Observability

### Execution Metadata

Each rating request includes detailed metadata:

- **executionTime**: Total time in milliseconds
- **steps**: Array of step-by-step execution details
  - Step name
  - Duration
  - Success status
  - Error details (if failed)

### Logging

The orchestrator logs key events:

```
[OrchestrationService] Starting rating request req-001
[OrchestrationService] Flow: guidewire → CDM → earnix
[OrchestrationService] ✓ Transformed to CDM: Q-2026-001234
[OrchestrationService] ✓ Applied 3 business rules
[OrchestrationService] ✓ Transformed to earnix format
[OrchestrationService] ✓ Premium calculated: $15689.94
```

### Health Monitoring

- `/health` endpoint for liveness probes
- Docker health checks configured
- Swagger docs for API monitoring

## Error Handling

The orchestrator provides detailed error responses:

```json
{
  "requestId": "req-001",
  "success": false,
  "error": {
    "code": "ORCHESTRATION_ERROR",
    "message": "CDM transformation failed",
    "details": {
      "step": "transform-to-cdm",
      "errors": [
        {
          "field": "insured.name",
          "message": "Required field is missing"
        }
      ]
    }
  },
  "metadata": {
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "executionTime": 234,
    "steps": [
      {
        "step": "transform-to-cdm",
        "duration": 234,
        "success": false,
        "error": "Required field is missing"
      }
    ]
  }
}
```

## AWS Deployment

### ECR (Elastic Container Registry)

```bash
# Build and tag
docker build -t orchestrator:latest .
docker tag orchestrator:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/orchestrator:latest

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/orchestrator:latest
```

### ECS (Elastic Container Service)

**Task Definition:**
```json
{
  "family": "orchestrator",
  "containerDefinitions": [{
    "name": "orchestrator",
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/orchestrator:latest",
    "portMappings": [{
      "containerPort": 3000,
      "protocol": "tcp"
    }],
    "environment": [
      { "name": "PORT", "value": "3000" },
      { "name": "GUIDEWIRE_URL", "value": "http://guidewire-service:3001" },
      { "name": "EARNIX_URL", "value": "http://earnix-service:4001/earnix/api/v1" }
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3
    }
  }],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024"
}
```

## Integration Example

```typescript
import axios from 'axios';

async function ratePolicy(policyData: any) {
  const response = await axios.post(
    'http://localhost:3000/api/v1/rating/execute',
    {
      sourceSystem: 'guidewire',
      ratingEngine: 'earnix',
      productLine: 'general-liability',
      policyData,
      applyRules: true,
    }
  );

  const { totalPremium, premiumBreakdown, metadata } = response.data;

  console.log(`Premium: $${totalPremium}`);
  console.log(`Execution time: ${metadata.executionTime}ms`);
  console.log(`Rules applied: ${premiumBreakdown.rulesApplied.join(', ')}`);

  return response.data;
}
```

## Development Notes

### Adding New Policy Systems

1. Create adapter in `@insurratex/adapter-sdk`
2. Add mapping configuration (system → CDM)
3. Register mapping in orchestrator initialization
4. Update environment variables

### Adding New Rating Engines

1. Create adapter in `@insurratex/adapter-sdk`
2. Add mapping configuration (CDM → engine)
3. Register mapping in orchestrator initialization
4. Add URL to configuration

### Adding Business Rules

1. Create rule in `@insurratex/rules-engine` format
2. Register rule in orchestrator initialization
3. Rules are automatically evaluated based on product line/state

## License

MIT

## Support

For issues or questions, contact the InsurRateX development team.
