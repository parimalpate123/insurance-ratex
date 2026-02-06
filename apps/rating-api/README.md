# InsurRateX Rating API

Configuration-driven rating engine with support for multiple product lines, templates, and pluggable workflows.

## Overview

The Rating API is a new implementation of the InsurRateX platform designed with a **configuration-first** architecture. It enables:

- **Multiple Product Lines**: Each product line (GL, WC, Property, etc.) has its own isolated configuration
- **Template Library**: Pre-built templates for common integrations (Guidewire → Earnix, etc.)
- **Pluggable Workflows**: Configure workflow steps through JSON configuration
- **Zero-Code Integrations**: 80% of use cases solved through configuration alone
- **Parallel Development**: Multiple teams can work on different product lines independently

## Architecture

```
rating-api/
├── src/
│   ├── modules/
│   │   ├── product-lines/     # Product line configuration management
│   │   ├── templates/          # Template library (TODO)
│   │   ├── workflows/          # Workflow execution engine (TODO)
│   │   ├── mappings/           # Data mapping (TODO)
│   │   ├── rules/              # Business rules (TODO)
│   │   ├── feature-toggles/    # Feature toggles & wave rollout (TODO)
│   │   └── execution/          # Rating execution (TODO)
│   ├── entities/               # TypeORM database entities
│   ├── config/                 # Configuration utilities
│   ├── shared/                 # Shared utilities
│   ├── app.module.ts           # Main application module
│   └── main.ts                 # Application entry point
├── Dockerfile
├── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 15
- Docker & Docker Compose (recommended)

### Installation

1. **Install dependencies**:
   ```bash
   cd apps/rating-api
   npm install
   ```

2. **Run database migrations**:
   ```bash
   # From project root
   psql -U insurratex -d insurratex -f database/migrations/005_product_line_configuration.sql
   ```

3. **Set environment variables** (create `.env` in project root):
   ```env
   RATING_API_PORT=3002
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=insurratex
   DB_PASSWORD=dev_password_change_in_prod
   DB_DATABASE=insurratex
   NODE_ENV=development
   ```

4. **Start the service**:
   ```bash
   npm run dev
   ```

5. **Access Swagger docs**:
   Open http://localhost:3002/api/docs

### Using Docker Compose

```bash
# From project root
docker-compose up rating-api
```

The service will be available at http://localhost:3002

## API Endpoints

### Product Lines Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/product-lines` | Get all product line configurations |
| GET | `/api/v1/product-lines/templates` | Get all template configurations |
| GET | `/api/v1/product-lines/:code` | Get product line by code |
| POST | `/api/v1/product-lines` | Create new product line configuration |
| PUT | `/api/v1/product-lines/:code` | Update product line configuration |
| DELETE | `/api/v1/product-lines/:code` | Archive product line configuration |
| POST | `/api/v1/product-lines/cache/clear` | Clear configuration cache |

### Rating Execution

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/rating/:productLineCode/execute` | Execute rating for specific product line |
| POST | `/api/v1/rating/execute` | Execute rating (product line in body) |

### Health & Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check endpoint |
| GET | `/api/v1/health` | Health check (versioned) |

### Example: Execute Rating

```bash
# Execute rating for GL_EXISTING product line
curl -X POST http://localhost:3002/api/v1/rating/GL_EXISTING/execute \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "quoteNumber": "QTE-2026-001",
      "productCode": "GL",
      "insured": {
        "name": "ABC Construction Inc",
        "businessType": "construction",
        "state": "CA",
        "annualRevenue": 5000000
      },
      "coverages": [
        {
          "type": "general-liability",
          "limit": 1000000,
          "deductible": 5000
        }
      ]
    },
    "context": {
      "userId": "user-123",
      "state": "CA"
    }
  }'

# Response:
{
  "success": true,
  "productLineCode": "GL_EXISTING",
  "result": {
    "premium": 15000,
    "premiumBreakdown": {
      "base": 12500,
      "adjustments": []
    },
    "ratingEngine": "earnix"
  },
  "metadata": {
    "executionTimeMs": 1234,
    "steps": [
      { "id": "validate", "name": "Input Validation", "success": true, "duration": 10 },
      { "id": "transform", "name": "Data Mapping", "success": true, "duration": 50 },
      { "id": "rules", "name": "Business Rules", "success": true, "duration": 100 },
      { "id": "calculate", "name": "Calculate Premium", "success": true, "duration": 1000 },
      { "id": "respond", "name": "Format Response", "success": true, "duration": 5 }
    ],
    "timestamp": "2026-02-06T10:30:00.000Z"
  }
}
```

### Example: Create Product Line

```bash
curl -X POST http://localhost:3002/api/v1/product-lines \
  -H "Content-Type: application/json" \
  -d '{
    "code": "GL_NEW",
    "name": "General Liability New",
    "description": "New GL product line",
    "config": {
      "productLine": {
        "code": "GL_NEW",
        "name": "General Liability New",
        "displayName": "GL New",
        "industry": "commercial",
        "states": ["CA", "NY"]
      },
      "integrations": {
        "sourceSystem": {
          "type": "guidewire",
          "version": "v10.0",
          "endpoint": "http://guidewire-mock:3001",
          "authentication": "oauth2"
        },
        "targetSystems": [
          {
            "type": "earnix",
            "version": "v8.0",
            "endpoint": "http://earnix-mock:4001",
            "authentication": "api_key"
          }
        ]
      },
      "workflow": {
        "steps": [
          {
            "id": "validate",
            "type": "system",
            "name": "Input Validation",
            "enabled": true
          },
          {
            "id": "transform",
            "type": "system",
            "name": "Data Mapping",
            "enabled": true
          },
          {
            "id": "rules",
            "type": "system",
            "name": "Business Rules",
            "enabled": true
          },
          {
            "id": "calculate",
            "type": "system",
            "name": "Calculate Premium",
            "enabled": true
          },
          {
            "id": "respond",
            "type": "system",
            "name": "Format Response",
            "enabled": true
          }
        ]
      },
      "features": {
        "dataMapping": {
          "enabled": true,
          "aiAssisted": true
        },
        "businessRules": {
          "enabled": true,
          "aiGeneration": true
        },
        "multiStateSupport": {
          "enabled": true,
          "states": ["CA", "NY"]
        }
      },
      "api": {
        "baseEndpoint": "/api/v1/rating/gl-new",
        "methods": ["POST"],
        "authentication": "api_key"
      }
    },
    "status": "active",
    "version": "1.0.0",
    "productOwner": "John Doe",
    "technicalLead": "Jane Smith"
  }'
```

## Configuration Schema

Product line configurations follow this structure:

```typescript
{
  productLine: {
    code: string;              // Unique identifier (e.g., "GL_COMM")
    name: string;              // Full name
    displayName: string;       // Short display name
    industry: string;          // "commercial" | "personal"
    states: string[];          // Supported states
  };
  integrations: {
    sourceSystem: {
      type: string;            // "guidewire" | "duck_creek" | etc.
      version?: string;
      endpoint: string;        // API endpoint URL
      authentication: string;  // "oauth2" | "api_key" | "basic"
    };
    targetSystems: Array<{...}>; // Rating engines
  };
  workflow: {
    steps: Array<{
      id: string;              // Step identifier
      type: "system" | "plugin" | "custom";
      name: string;            // Display name
      enabled: boolean;
      pluginId?: string;       // For plugin steps
      config?: object;         // Step-specific config
    }>;
  };
  features: {
    dataMapping?: {...};
    businessRules?: {...};
    multiStateSupport?: {...};
    customPlugins?: {...};
  };
  api: {
    baseEndpoint: string;      // Generated API endpoint
    methods: string[];
    authentication: string;
  };
}
```

## Implementation Status

### ✅ Phase 1: Configuration Infrastructure (Complete)
- Database migration (005_product_line_configuration.sql)
- ProductLineConfig entity
- ProductLines module with service and controller
- Configuration caching (60s TTL)
- Configuration validation
- REST API endpoints
- Swagger documentation
- Docker support

### ✅ Phase 2: Workflow Engine & Execution (Complete)
- Workflow engine with configurable steps
- Rating execution endpoints
- System steps: validate, transform, rules, calculate, respond
- Health check endpoints
- Error handling and metadata tracking
- Test examples and scripts

### 🚧 Phase 2 Integration (In Progress):
- Mapping service with product line filtering
- Rules service with product line filtering
- Enhanced validation

### 📅 Planned (Phase 3-6):
- Phase 3: Admin UI with onboarding wizard
- Phase 4: Template marketplace
- Phase 5: Feature toggles & wave rollout
- Phase 6: Testing & production readiness

## Testing

### Quick Test Script

```bash
# Run all endpoint tests
cd apps/rating-api
./test-examples/test-rating-api.sh
```

This script tests:
- Health check
- Get product lines
- Get specific product line
- Execute rating workflow
- Get templates

### Manual Testing

```bash
# Health check
curl http://localhost:3002/health

# Get all product lines
curl http://localhost:3002/api/v1/product-lines

# Execute rating
curl -X POST http://localhost:3002/api/v1/rating/GL_EXISTING/execute \
  -H "Content-Type: application/json" \
  -d @test-examples/rating-request-gl.json
```

### Running Unit Tests

```bash
npm test                 # Run unit tests
npm run test:watch       # Watch mode
npm run test:cov         # With coverage
```

### Linting

```bash
npm run lint             # Check code style
npm run format           # Format code with Prettier
```

### Building

```bash
npm run build            # Build for production
npm run start:prod       # Run production build
```

## Database

The Rating API uses the same PostgreSQL database as the legacy orchestrator. Migration 005 adds:

- `product_line_configs` table
- `config_version_history` table
- `product_line_code` column to existing tables (mappings, rules, field_mappings)
- Indexes for performance
- Seed data with templates

## Migration from Legacy Orchestrator

The legacy orchestrator (port 3000) and new rating-api (port 3002) can run side-by-side. Existing data is migrated to product line code `GL_EXISTING`.

**Transition Path:**
1. Run both services in parallel
2. Build new product lines in rating-api
3. Migrate existing product lines to new API
4. Deprecate legacy orchestrator once all features migrated

## Support

For issues or questions:
- Check `/api/docs` for API documentation
- Review configuration examples in database migrations
- See main project README for architecture overview

## License

Internal use only - InsurRateX platform
