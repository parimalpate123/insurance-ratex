# @insurratex/adapter-sdk

SDK for building InsurRateX adapters to connect policy systems (Guidewire, Duck Creek, Salesforce) and rating engines (Earnix, ISO, custom).

## Overview

The Adapter SDK provides a standardized foundation for building adapters that integrate external insurance systems with the InsurRateX platform. It handles common concerns like HTTP communication, retries, error handling, logging, and data transformation, allowing you to focus on business logic.

## Features

- **Base Adapter Classes**: Abstract base classes with built-in HTTP client, retry logic, and error handling
- **Type-Safe Interfaces**: Full TypeScript support with CDM integration
- **Automatic Retries**: Configurable retry logic for transient failures
- **Error Handling**: Comprehensive error classes for different failure scenarios
- **Logging**: Pluggable logging interface (Console, Winston, or custom)
- **Data Transformation**: Base transformer classes for CDM conversion
- **Health Checks**: Built-in health check support for all adapters
- **Connection Management**: Connection lifecycle management with validation

## Installation

```bash
npm install @insurratex/adapter-sdk
```

## Quick Start

### Building a Policy System Adapter

```typescript
import {
  PolicySystemAdapter,
  SubmitRatingRequest,
  RatingResponse,
  AdapterResponse,
  HealthCheckResult,
} from '@insurratex/adapter-sdk';

class MyPolicySystemAdapter extends PolicySystemAdapter {
  getAdapterName(): string {
    return 'MyPolicySystem';
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const response = await this.httpClient.get('/health');
    return {
      healthy: response.status === 200,
      version: response.data?.version,
    };
  }

  async submitForRating(
    request: SubmitRatingRequest
  ): Promise<AdapterResponse<RatingResponse>> {
    try {
      // Transform CDM to system format
      const systemRequest = this.transformToSystemFormat(request.policy);

      // Call external system
      const response = await this.httpClient.post('/submit', systemRequest);

      // Return standardized response
      return this.createResponse({
        quoteNumber: response.data.quoteNumber,
        premium: response.data.premium,
        effectiveDate: request.policy.effectiveDate,
        expirationDate: request.policy.expirationDate,
        status: 'quoted',
      });
    } catch (error: any) {
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  // Implement other required methods...
}
```

### Building a Rating Engine Adapter

```typescript
import {
  RatingEngineAdapter,
  RatingRequest,
  PremiumCalculation,
  AdapterResponse,
} from '@insurratex/adapter-sdk';

class MyRatingEngineAdapter extends RatingEngineAdapter {
  getAdapterName(): string {
    return 'MyRatingEngine';
  }

  async healthCheck(): Promise<HealthCheckResult> {
    const response = await this.httpClient.get('/health');
    return { healthy: response.status === 200 };
  }

  async calculatePremium(
    request: RatingRequest
  ): Promise<AdapterResponse<PremiumCalculation>> {
    try {
      const response = await this.httpClient.post('/rate', {
        policy: request.policy,
      });

      return this.createResponse({
        totalPremium: response.data.totalPremium,
        basePremium: response.data.basePremium,
        adjustments: response.data.adjustments,
        taxes: response.data.taxes,
        fees: response.data.fees,
      });
    } catch (error: any) {
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  // Implement other required methods...
}
```

### Using an Adapter

```typescript
import { WinstonLogger } from '@insurratex/adapter-sdk';

// Create adapter
const adapter = new MyPolicySystemAdapter(
  {
    baseUrl: 'https://api.policysystem.com',
    apiKey: 'your-api-key',
    timeout: 30000,
    retries: 3,
  },
  new WinstonLogger()
);

// Connect
await adapter.connect({ validateConnection: true });

// Use adapter
const result = await adapter.submitForRating({
  policy: myPolicy,
  requestId: 'req-001',
});

if (result.success) {
  console.log('Quote Number:', result.data.quoteNumber);
  console.log('Premium:', result.data.premium);
} else {
  console.error('Error:', result.error?.message);
}

// Disconnect when done
await adapter.disconnect();
```

## Core Concepts

### BaseAdapter

All adapters extend `BaseAdapter`, which provides:

- **HTTP Client**: Pre-configured Axios client with retry logic
- **Authentication**: Automatic API key or Basic auth injection
- **Error Handling**: Standardized error handling and response creation
- **Logging**: Integrated logging for all operations
- **Connection Management**: Connect/disconnect lifecycle

```typescript
abstract class BaseAdapter {
  protected config: AdapterConfig;
  protected httpClient: AxiosInstance;
  protected logger: AdapterLogger;

  abstract healthCheck(): Promise<HealthCheckResult>;
  abstract getAdapterName(): string;

  async connect(options?: ConnectionOptions): Promise<void>;
  async disconnect(): Promise<void>;
  isConnected(): boolean;
}
```

### PolicySystemAdapter

For policy management systems (Guidewire, Duck Creek, Salesforce):

```typescript
abstract class PolicySystemAdapter extends BaseAdapter {
  abstract submitForRating(request: SubmitRatingRequest): Promise<AdapterResponse<RatingResponse>>;
  abstract retrieveQuote(request: RetrieveQuoteRequest): Promise<AdapterResponse<RatingResponse>>;
  abstract bindPolicy(request: BindPolicyRequest): Promise<AdapterResponse<PolicyResponse>>;
  abstract retrievePolicy(policyNumber: string): Promise<AdapterResponse<PolicyResponse>>;
  abstract cancelPolicy(policyNumber: string, date: string, reason?: string): Promise<AdapterResponse<PolicyResponse>>;
}
```

### RatingEngineAdapter

For rating engines (Earnix, ISO, custom):

```typescript
abstract class RatingEngineAdapter extends BaseAdapter {
  abstract calculatePremium(request: RatingRequest): Promise<AdapterResponse<PremiumCalculation>>;
  abstract validateRating(request: RateValidationRequest): Promise<AdapterResponse<RateValidationResult>>;
  abstract getRatingFactors(productLine: string, classCode: string, state?: string): Promise<AdapterResponse<Record<string, any>>>;
  abstract getBaseRate(productLine: string, classCode: string, state?: string): Promise<AdapterResponse<number>>;
}
```

## Configuration

### AdapterConfig

```typescript
interface AdapterConfig {
  baseUrl: string;              // Required: API base URL
  timeout?: number;             // Default: 30000ms
  retries?: number;             // Default: 3
  retryDelay?: number;          // Default: 1000ms
  apiKey?: string;              // For API key auth
  username?: string;            // For basic auth
  password?: string;            // For basic auth
  headers?: Record<string, string>;  // Custom headers
  validateCertificates?: boolean;    // SSL validation
}
```

### Example Configurations

**Production (API Key)**:
```typescript
const config: AdapterConfig = {
  baseUrl: 'https://api.guidewire.com',
  apiKey: process.env.GUIDEWIRE_API_KEY,
  timeout: 60000,
  retries: 5,
  retryDelay: 2000,
};
```

**Development (Basic Auth)**:
```typescript
const config: AdapterConfig = {
  baseUrl: 'http://localhost:3001',
  username: 'admin',
  password: 'password',
  timeout: 10000,
  retries: 1,
};
```

## Data Transformation

Use `CDMTransformer` to convert between CDM and external system formats:

```typescript
import { CDMTransformer, Policy } from '@insurratex/adapter-sdk';

class MyTransformer extends CDMTransformer<ExternalFormat> {
  fromCDM(policy: Policy, context?) {
    try {
      const external: ExternalFormat = {
        // Map CDM fields to external format
        productCode: this.mapProductLine(policy.productLine),
        effectiveDate: policy.effectiveDate,
        // ... more mappings
      };

      return this.createSuccessResult(external);
    } catch (error: any) {
      return this.createErrorResult([
        { field: 'policy', message: error.message },
      ]);
    }
  }

  toCDM(external: ExternalFormat, context?) {
    try {
      const policy: Policy = {
        // Map external format to CDM
        productLine: this.mapProductCode(external.productCode),
        effectiveDate: external.effectiveDate,
        // ... more mappings
      };

      return this.createSuccessResult(policy);
    } catch (error: any) {
      return this.createErrorResult([
        { field: 'external', message: error.message },
      ]);
    }
  }
}
```

## Error Handling

The SDK provides specific error classes:

```typescript
import {
  AdapterError,
  ConnectionError,
  AuthenticationError,
  ValidationError,
  TimeoutError,
  RateLimitError,
  NotFoundError,
  TransformationError,
  SystemUnavailableError,
} from '@insurratex/adapter-sdk';

try {
  await adapter.submitForRating(request);
} catch (error) {
  if (error instanceof ConnectionError) {
    // Handle connection issues
  } else if (error instanceof AuthenticationError) {
    // Handle auth failures
  } else if (error instanceof TimeoutError) {
    // Handle timeouts
  }
}
```

### Error Properties

All errors extend `AdapterError` with these properties:

- `code`: Error code (e.g., "CONNECTION_ERROR", "TIMEOUT_ERROR")
- `message`: Human-readable error message
- `retryable`: Boolean indicating if retry should be attempted
- `details`: Additional error context

## Logging

### Built-in Loggers

**Console Logger** (default):
```typescript
import { ConsoleLogger } from '@insurratex/adapter-sdk';

const adapter = new MyAdapter(config, new ConsoleLogger());
```

**Winston Logger** (production):
```typescript
import { WinstonLogger } from '@insurratex/adapter-sdk';

const logger = new WinstonLogger({
  level: 'info',
  transports: [
    new winston.transports.File({ filename: 'adapter.log' }),
    new winston.transports.Console(),
  ],
});

const adapter = new MyAdapter(config, logger);
```

**Silent Logger** (testing):
```typescript
import { SilentLogger } from '@insurratex/adapter-sdk';

const adapter = new MyAdapter(config, new SilentLogger());
```

### Custom Logger

Implement the `AdapterLogger` interface:

```typescript
import { AdapterLogger } from '@insurratex/adapter-sdk';

class MyCustomLogger implements AdapterLogger {
  debug(message: string, meta?: any): void {
    // Your implementation
  }

  info(message: string, meta?: any): void {
    // Your implementation
  }

  warn(message: string, meta?: any): void {
    // Your implementation
  }

  error(message: string, error?: any): void {
    // Your implementation
  }
}
```

## Examples

See the `examples/` directory for complete adapter implementations:

- `guidewire-adapter.example.ts`: Guidewire PolicyCenter adapter
- `earnix-adapter.example.ts`: Earnix Rating Engine adapter

## Testing

```bash
npm test
npm run test:watch
npm run test:cov
```

### Testing Your Adapter

```typescript
import { SilentLogger } from '@insurratex/adapter-sdk';

describe('MyAdapter', () => {
  let adapter: MyAdapter;

  beforeEach(() => {
    adapter = new MyAdapter(
      {
        baseUrl: 'http://localhost:3001',
        timeout: 5000,
      },
      new SilentLogger()
    );
  });

  it('should connect successfully', async () => {
    await adapter.connect();
    expect(adapter.isConnected()).toBe(true);
  });

  it('should calculate premium', async () => {
    const result = await adapter.calculatePremium({
      policy: testPolicy,
    });

    expect(result.success).toBe(true);
    expect(result.data?.totalPremium).toBeGreaterThan(0);
  });
});
```

## API Reference

### Adapter Interfaces

**AdapterResponse<T>**
```typescript
interface AdapterResponse<T = any> {
  success: boolean;
  data?: T;
  error?: AdapterError;
  metadata?: AdapterMetadata;
}
```

**HealthCheckResult**
```typescript
interface HealthCheckResult {
  healthy: boolean;
  version?: string;
  latency?: number;
  details?: Record<string, any>;
}
```

### Policy System Types

**SubmitRatingRequest**
```typescript
interface SubmitRatingRequest {
  policy: Policy;
  requestId?: string;
}
```

**RatingResponse**
```typescript
interface RatingResponse {
  quoteNumber: string;
  premium: number;
  effectiveDate: string;
  expirationDate: string;
  status: 'quoted' | 'rated' | 'bound';
  breakdown?: PremiumBreakdown;
}
```

### Rating Engine Types

**RatingRequest**
```typescript
interface RatingRequest {
  policy: Policy;
  requestId?: string;
  rateAsOfDate?: string;
}
```

**PremiumCalculation**
```typescript
interface PremiumCalculation {
  totalPremium: number;
  basePremium: number;
  adjustments?: PremiumAdjustment[];
  surcharges?: Surcharge[];
  discounts?: Discount[];
  taxes?: number;
  fees?: number;
  ratingFactorsUsed?: Record<string, any>;
}
```

## Best Practices

1. **Use Type Safety**: Leverage TypeScript types for compile-time validation
2. **Handle Errors**: Always check `result.success` before accessing `result.data`
3. **Log Appropriately**: Use appropriate log levels (debug, info, warn, error)
4. **Validate Transformations**: Check transformation results before making API calls
5. **Implement Health Checks**: Provide meaningful health check implementations
6. **Use Retries Wisely**: Configure retries based on API characteristics
7. **Clean Up Connections**: Always disconnect when done

## Contributing

When building new adapters:

1. Extend the appropriate base class (`PolicySystemAdapter` or `RatingEngineAdapter`)
2. Implement all abstract methods
3. Create transformers for CDM conversion
4. Add comprehensive error handling
5. Write unit tests
6. Document adapter-specific configuration
7. Provide usage examples

## License

MIT

## Support

For issues or questions, contact the InsurRateX development team.
