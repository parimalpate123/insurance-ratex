/**
 * Example: Guidewire PolicyCenter Adapter Implementation
 * This demonstrates how to build a policy system adapter using the SDK
 */

import {
  PolicySystemAdapter,
  SubmitRatingRequest,
  RatingResponse,
  RetrieveQuoteRequest,
  BindPolicyRequest,
  PolicyResponse,
} from '../src/adapters/policy-system-adapter';
import { AdapterResponse, HealthCheckResult } from '../src/types/adapter.types';
import { CDMTransformer, TransformationContext } from '../src/transformers/base-transformer';
import { Policy } from '@insurratex/cdm';

/**
 * Guidewire-specific data types
 */
interface GuidewireRatingRequest {
  productCode: string;
  effectiveDate: string;
  expirationDate: string;
  insured: {
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    postalCode: string;
  };
  // ... other Guidewire-specific fields
}

interface GuidewireQuoteResponse {
  quoteNumber: string;
  premium: {
    totalCost: number;
    taxes: number;
    fees: number;
  };
  status: string;
}

/**
 * Transformer for Guidewire <-> CDM conversion
 */
class GuidewireTransformer extends CDMTransformer<GuidewireRatingRequest> {
  fromCDM(policy: Policy, context?: TransformationContext) {
    try {
      const gwRequest: GuidewireRatingRequest = {
        productCode: policy.productLine === 'general-liability' ? 'GL' : 'UNKNOWN',
        effectiveDate: policy.effectiveDate,
        expirationDate: policy.expirationDate,
        insured: {
          name: policy.insured.name,
          addressLine1: policy.insured.primaryAddress.street1,
          city: policy.insured.primaryAddress.city,
          state: policy.insured.primaryAddress.state,
          postalCode: policy.insured.primaryAddress.postalCode,
        },
      };

      return this.createSuccessResult(gwRequest);
    } catch (error: any) {
      return this.createErrorResult([
        { field: 'policy', message: `Transformation failed: ${error.message}` },
      ]);
    }
  }

  toCDM(external: GuidewireRatingRequest, context?: TransformationContext) {
    // Reverse transformation logic here
    throw new Error('Not implemented in example');
  }
}

/**
 * Guidewire PolicyCenter Adapter
 */
export class GuidewireAdapter extends PolicySystemAdapter {
  private transformer: GuidewireTransformer;

  constructor(config: any, logger?: any) {
    super(config, logger);
    this.transformer = new GuidewireTransformer(logger);
  }

  getAdapterName(): string {
    return 'GuidewireAdapter';
  }

  async healthCheck(): Promise<HealthCheckResult> {
    try {
      const startTime = Date.now();
      const response = await this.httpClient.get('/health');
      const latency = Date.now() - startTime;

      return {
        healthy: response.status === 200,
        version: response.data?.version,
        latency,
        details: response.data,
      };
    } catch (error: any) {
      return {
        healthy: false,
        details: { error: error.message },
      };
    }
  }

  async submitForRating(
    request: SubmitRatingRequest
  ): Promise<AdapterResponse<RatingResponse>> {
    try {
      this.logger.info('Submitting policy for rating', { requestId: request.requestId });

      // Transform CDM to Guidewire format
      const transformResult = this.transformer.fromCDM(request.policy);
      if (!transformResult.success) {
        return this.createErrorResponse(
          'TRANSFORMATION_ERROR',
          'Failed to transform policy to Guidewire format',
          transformResult.errors
        );
      }

      // Call Guidewire API
      const response = await this.httpClient.post<GuidewireQuoteResponse>(
        '/pc/rating/submit',
        transformResult.data
      );

      // Transform response to standard format
      const ratingResponse: RatingResponse = {
        quoteNumber: response.data.quoteNumber,
        premium: response.data.premium.totalCost,
        effectiveDate: request.policy.effectiveDate,
        expirationDate: request.policy.expirationDate,
        status: 'quoted',
        breakdown: {
          base: response.data.premium.totalCost - response.data.premium.taxes - response.data.premium.fees,
          taxes: response.data.premium.taxes,
          fees: response.data.premium.fees,
        },
      };

      return this.createResponse(ratingResponse, undefined, {
        requestId: request.requestId,
      });
    } catch (error: any) {
      this.logger.error('Failed to submit for rating', error);
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  async retrieveQuote(
    request: RetrieveQuoteRequest
  ): Promise<AdapterResponse<RatingResponse>> {
    try {
      const response = await this.httpClient.get<GuidewireQuoteResponse>(
        `/pc/rating/quote/${request.quoteNumber}`
      );

      const ratingResponse: RatingResponse = {
        quoteNumber: response.data.quoteNumber,
        premium: response.data.premium.totalCost,
        effectiveDate: '', // Would come from response
        expirationDate: '',
        status: 'quoted',
      };

      return this.createResponse(ratingResponse);
    } catch (error: any) {
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  async bindPolicy(request: BindPolicyRequest): Promise<AdapterResponse<PolicyResponse>> {
    // Implementation here
    throw new Error('Not implemented in example');
  }

  async retrievePolicy(policyNumber: string): Promise<AdapterResponse<PolicyResponse>> {
    // Implementation here
    throw new Error('Not implemented in example');
  }

  async cancelPolicy(
    policyNumber: string,
    cancellationDate: string,
    reason?: string
  ): Promise<AdapterResponse<PolicyResponse>> {
    // Implementation here
    throw new Error('Not implemented in example');
  }
}

/**
 * Usage example:
 *
 * const adapter = new GuidewireAdapter({
 *   baseUrl: 'https://guidewire.company.com',
 *   apiKey: 'your-api-key',
 *   timeout: 30000,
 * });
 *
 * await adapter.connect();
 *
 * const result = await adapter.submitForRating({
 *   policy: myPolicy,
 *   requestId: 'req-001',
 * });
 *
 * if (result.success) {
 *   console.log('Quote number:', result.data.quoteNumber);
 *   console.log('Premium:', result.data.premium);
 * }
 */
