# InsurRateX API Reference

Complete API documentation for InsurRateX platform.

## Base URLs

| Service | Base URL | Port |
|---------|----------|------|
| Orchestrator | `http://localhost:3000` | 3000 |
| Guidewire Mock | `http://localhost:3001` | 3001 |
| Earnix Mock | `http://localhost:4001` | 4001 |

## Authentication

Currently, the platform uses no authentication in development mode. For production:
- **API Keys**: Pass in `X-API-Key` header
- **OAuth 2.0**: Coming soon
- **JWT**: Coming soon

---

## Orchestrator API

### Health Check

Check service health and readiness.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "ok",
  "service": "orchestrator",
  "version": "1.0.0",
  "timestamp": "2026-02-01T12:00:00Z"
}
```

---

### Execute Rating

Execute complete rating flow from source system to rating engine.

**Endpoint:** `POST /api/v1/rating/execute`

**Request Body:**
```json
{
  "sourceSystem": "guidewire",
  "ratingEngine": "earnix",
  "productLine": "general-liability",
  "requestId": "optional-request-id",
  "applyRules": true,
  "policyData": {
    "quoteNumber": "Q-2026-001234",
    "productCode": "GL",
    "effectiveDate": "2026-03-01",
    "expirationDate": "2027-03-01",
    "insured": {
      "name": "Acme Corporation",
      "businessType": "MFG",
      "addressLine1": "123 Main Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "annualRevenue": 5000000,
      "employeeCount": 150,
      "yearsInBusiness": 10
    },
    "classification": {
      "code": "91580",
      "description": "Manufacturing - Electronic Components"
    },
    "coverages": [
      {
        "id": "cov-001",
        "type": "general-aggregate",
        "limit": 2000000,
        "deductible": 5000,
        "primary": true
      }
    ],
    "lossHistory": [
      {
        "year": 2025,
        "claimCount": 2,
        "totalIncurred": 15000
      }
    ]
  }
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `sourceSystem` | string | Yes | Source policy system (`guidewire`, `duckcreek`, etc.) |
| `ratingEngine` | string | Yes | Target rating engine (`earnix`, `iso`, etc.) |
| `productLine` | string | Yes | Product line (`general-liability`, `property`, etc.) |
| `requestId` | string | No | Optional request ID for tracking |
| `applyRules` | boolean | No | Whether to apply business rules (default: `true`) |
| `policyData` | object | Yes | Policy data in source system format |

**Response (Success):**
```json
{
  "success": true,
  "requestId": "req-12345",
  "totalPremium": 15689.94,
  "premiumBreakdown": {
    "basePremium": 12500.00,
    "adjustments": [
      {
        "type": "surcharge",
        "name": "California Territorial Surcharge",
        "amount": 625.00,
        "percentage": 5.0
      },
      {
        "type": "modifier",
        "name": "Experience Modifier",
        "amount": 1250.00,
        "percentage": 10.0
      }
    ],
    "surcharges": 625.00,
    "modifiers": 1250.00,
    "taxes": 1314.94,
    "rulesApplied": [
      "State Territorial Surcharges",
      "Experience Modifier Based on Loss History",
      "High Revenue Surcharge"
    ]
  },
  "cdmData": {
    "policyId": "POL-2026-001234",
    "effectiveDate": "2026-03-01",
    "insuredName": "Acme Corporation",
    "totalLimit": 2000000
  },
  "metadata": {
    "executionTime": 1523,
    "timestamp": "2026-02-01T12:00:00Z",
    "steps": [
      {
        "step": "transform_source_to_cdm",
        "duration": 245,
        "success": true
      },
      {
        "step": "apply_business_rules",
        "duration": 489,
        "success": true,
        "rulesExecuted": 12
      },
      {
        "step": "transform_cdm_to_engine",
        "duration": 198,
        "success": true
      },
      {
        "step": "calculate_premium",
        "duration": 591,
        "success": true
      }
    ],
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "cdmVersion": "gl-v1.2"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": {
    "code": "MAPPING_ERROR",
    "message": "Failed to map field: insured.state",
    "details": {
      "field": "insured.state",
      "reason": "Required field missing in source data"
    }
  },
  "requestId": "req-12345",
  "metadata": {
    "executionTime": 234,
    "timestamp": "2026-02-01T12:00:00Z",
    "failedStep": "transform_source_to_cdm"
  }
}
```

**Status Codes:**
- `200 OK`: Rating executed successfully
- `400 Bad Request`: Invalid request data
- `404 Not Found`: Mapping configuration not found
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: Rating engine unavailable

---

## Guidewire Mock API

### Submit Policy for Rating

**Endpoint:** `POST /pc/rating/submit`

**Request Body:** Guidewire PolicyCenter format

**Response:**
```json
{
  "success": true,
  "quoteNumber": "Q-2026-001234",
  "submittedAt": "2026-02-01T12:00:00Z",
  "status": "submitted"
}
```

---

## Earnix Mock API

### Rate Policy

**Endpoint:** `POST /earnix/api/v1/rate`

**Response:**
```json
{
  "success": true,
  "policyId": "POL-2026-001234",
  "totalPremium": 12500.00,
  "breakdown": {
    "basePremium": 11250.00,
    "loadings": 750.00,
    "discounts": 0,
    "taxes": 1250.00
  }
}
```

---

## OpenAPI / Swagger

Interactive API documentation available at:
- Orchestrator: http://localhost:3000/api/docs

---

For more information, see [Quick Start Guide](QUICK_START.md)
