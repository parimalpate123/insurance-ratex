# Earnix Rating Engine Mock

Mock implementation of Earnix Rating Engine for InsurRateX development and testing.

## Overview

This mock service simulates a realistic insurance rating engine with:
- Multi-step premium calculation algorithm
- Territorial factors by state
- Experience modification based on claims history
- Increased Limits Factors (ILF)
- Deductible credits
- Surcharges (CA high-value, new business)
- Taxes and fees calculation

## Features

### Rating Algorithm

The mock implements a 7-step rating process:

1. **Base Rate Calculation**: Class code × Annual revenue exposure
2. **Territorial Factor**: State-specific adjustments (e.g., CA: 1.15, TX: 0.95)
3. **Experience Modifier**: Claims history impact (0.95 for no claims, up to 1.40 for high frequency)
4. **Limit Factor**: Increased Limits Factor based on coverage limit ($1M-$10M)
5. **Deductible Credit**: 5%-25% premium reduction based on deductible
6. **Surcharges**: CA high-value ($500), new business ($250)
7. **Taxes & Fees**: 1% tax + $75 administrative fee

### Configurable Rules

Rules are stored in JSON files under `src/rules/`:
- `base-rates.json`: Base rates by class code
- `territorial-factors.json`: State-specific factors

## API Endpoints

### POST /earnix/api/v1/rate

Calculate premium for a rating request.

**Request Body:**
```json
{
  "requestId": "rate-req-001",
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
    "yearsInBusiness": 5,
    "claimsHistory": {
      "priorClaimsCount": 0,
      "priorClaimsAmount": 0
    }
  }
}
```

**Response:**
```json
{
  "basePremium": 12500.00,
  "adjustments": [
    {
      "type": "TerritorialFactor",
      "factor": 1.15,
      "description": "CA Territory Adjustment",
      "amount": 1875.00
    },
    {
      "type": "ExperienceMod",
      "factor": 0.95,
      "description": "Experience Modification",
      "amount": -718.75
    },
    {
      "type": "LimitFactor",
      "factor": 1.25,
      "description": "$2M Limit Factor",
      "amount": 3339.06
    },
    {
      "type": "DeductibleCredit",
      "factor": 0.88,
      "description": "$5K Deductible Credit",
      "amount": -2034.97
    }
  ],
  "surcharges": [
    {
      "type": "HighValueSurcharge",
      "description": "CA High-Value Policy Surcharge",
      "amount": 500.00
    }
  ],
  "subtotal": 15460.34,
  "taxes": 154.60,
  "fees": 75.00,
  "totalPremium": 15689.94,
  "ratingFactorsUsed": {
    "baseRate": 2.5,
    "territorialFactor": 1.15,
    "experienceMod": 0.95,
    "limitFactor": 1.25,
    "deductibleCredit": 0.12
  }
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "service": "earnix-mock",
  "timestamp": "2026-01-31T10:30:00.000Z",
  "version": "0.1.0"
}
```

## Running Locally

### Development Mode
```bash
npm install
npm run start:dev
```

Server runs on: http://localhost:4001

### Production Mode
```bash
npm run build
npm run start:prod
```

### Docker
```bash
# Build image
docker build -t earnix-mock .

# Run container
docker run -p 4001:4001 earnix-mock

# With environment variables
docker run -p 4001:4001 -e PORT=4001 earnix-mock
```

## Testing

### Manual Testing

```bash
# Health check
curl http://localhost:4001/health

# Rating request
curl -X POST http://localhost:4001/earnix/api/v1/rate \
  -H "Content-Type: application/json" \
  -d '{
    "requestId": "test-001",
    "productLine": "general-liability",
    "productVersion": "gl-v1.2",
    "insured": {
      "state": "CA",
      "annualRevenue": 5000000
    },
    "coverages": [{
      "type": "general-liability",
      "limit": 2000000,
      "deductible": 5000
    }],
    "ratingFactors": {
      "classCode": "91580",
      "claimsHistory": {
        "priorClaimsCount": 0,
        "priorClaimsAmount": 0
      }
    }
  }'
```

### Unit Tests
```bash
npm test
```

### E2E Tests
```bash
npm run test:e2e
```

## Configuration

### Environment Variables

- `PORT`: Server port (default: 4001)
- `NODE_ENV`: Environment (development/production)

### Rating Rules

Modify rules in `src/rules/`:

**base-rates.json**
```json
{
  "91580": 2.50,  // Machine Shops
  "10380": 1.20,  // Professional Services
  "13350": 3.80   // Construction
}
```

**territorial-factors.json**
```json
{
  "CA": 1.15,
  "TX": 0.95,
  "NY": 1.10
}
```

## AWS Deployment

### ECR (Elastic Container Registry)

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag earnix-mock:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/earnix-mock:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/earnix-mock:latest
```

### ECS (Elastic Container Service)

1. Create ECS cluster
2. Create task definition using the ECR image
3. Create service with desired count
4. Configure ALB/NLB if needed

**Task Definition Example:**
```json
{
  "family": "earnix-mock",
  "containerDefinitions": [{
    "name": "earnix-mock",
    "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/earnix-mock:latest",
    "portMappings": [{
      "containerPort": 4001,
      "protocol": "tcp"
    }],
    "environment": [
      { "name": "PORT", "value": "4001" },
      { "name": "NODE_ENV", "value": "production" }
    ],
    "healthCheck": {
      "command": ["CMD-SHELL", "curl -f http://localhost:4001/health || exit 1"],
      "interval": 30,
      "timeout": 5,
      "retries": 3
    }
  }],
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512"
}
```

## Architecture

```
┌─────────────────────────────────────────┐
│         RatingController                │
│  POST /earnix/api/v1/rate               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│      RatingEngineService                │
│  - calculatePremium()                   │
│  - getBaseRate()                        │
│  - getTerritorialFactor()               │
│  - calculateExperienceMod()             │
│  - getLimitFactor()                     │
│  - getDeductibleCredit()                │
│  - calculateSurcharges()                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│         Rules Registry                  │
│  - base-rates.json                      │
│  - territorial-factors.json             │
└─────────────────────────────────────────┘
```

## Development Notes

### Rating Logic Details

**Experience Modification:**
- No claims: 0.95 (5% credit)
- 1 claim < $50K: 1.00 (no change)
- 1 claim ≥ $50K: 1.10 (10% increase)
- 2-3 claims: 1.25 (25% increase)
- 4+ claims: 1.40 (40% increase)

**Limit Factors (ILF):**
- $1M: 1.00
- $2M: 1.25
- $3M: 1.45
- $5M: 1.70
- $10M: 2.00

**Deductible Credits:**
- $1K: 5%
- $2.5K: 8%
- $5K: 12%
- $10K: 18%
- $25K: 25%

**Surcharges:**
- CA policies > $1M limit: $500
- Years in business < 3: $250

## Logging

The service provides detailed console logging for each rating calculation:

```
📊 Calculating premium for general-liability...
  Base Rate: 2.5, Exposure: $5000K, Base Premium: $12500.00
  Territorial Factor (CA): 1.15, Premium: $14375.00
  Experience Mod: 0.95, Premium: $13656.25
  Limit Factor: 1.25, Premium: $17070.31
  Deductible Credit: 12.0%, Premium: $15021.87
  ✅ Total Premium: $15689.94
```

## License

MIT

## Support

For issues or questions, please contact the InsurRateX development team.
