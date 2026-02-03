/**
 * Example: Earnix Rating Engine Adapter Implementation
 * This demonstrates how to build a rating engine adapter using the SDK
 */

import {
  RatingEngineAdapter,
  RatingRequest,
  PremiumCalculation,
  RateValidationRequest,
  RateValidationResult,
} from '../src/adapters/rating-engine-adapter';
import { AdapterResponse, HealthCheckResult } from '../src/types/adapter.types';
import { Policy } from '@insurratex/cdm';

/**
 * Earnix-specific data types
 */
interface EarnixRatingRequest {
  requestId: string;
  productLine: string;
  productVersion: string;
  insured: {
    state: string;
    businessType: string;
    annualRevenue: number;
    employeeCount?: number;
  };
  coverages: Array<{
    type: string;
    limit: number;
    deductible: number;
  }>;
  ratingFactors: {
    classCode: string;
    yearsInBusiness?: number;
    claimsHistory?: {
      priorClaimsCount: number;
      priorClaimsAmount: number;
    };
  };
}

interface EarnixPremiumResponse {
  basePremium: number;
  adjustments: Array<{
    type: string;
    factor: number;
    description: string;
    amount: number;
  }>;
  surcharges: Array<{
    type: string;
    description: string;
    amount: number;
  }>;
  subtotal: number;
  taxes: number;
  fees: number;
  totalPremium: number;
  ratingFactorsUsed: Record<string, any>;
}

/**
 * Earnix Rating Engine Adapter
 */
export class EarnixAdapter extends RatingEngineAdapter {
  getAdapterName(): string {
    return 'EarnixAdapter';
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

  async calculatePremium(
    request: RatingRequest
  ): Promise<AdapterResponse<PremiumCalculation>> {
    try {
      this.logger.info('Calculating premium', { requestId: request.requestId });

      // Transform CDM Policy to Earnix format
      const earnixRequest: EarnixRatingRequest = {
        requestId: request.requestId || `rate-${Date.now()}`,
        productLine: request.policy.productLine,
        productVersion: request.policy.version,
        insured: {
          state: request.policy.insured.primaryAddress.state,
          businessType: request.policy.insured.businessType,
          annualRevenue: request.policy.insured.annualRevenue || 0,
          employeeCount: request.policy.insured.employeeCount,
        },
        coverages: request.policy.coverages.map((cov) => ({
          type: cov.type,
          limit: cov.limit,
          deductible: cov.deductible,
        })),
        ratingFactors: {
          classCode: request.policy.ratingFactors.classCode,
          yearsInBusiness: request.policy.ratingFactors.yearsInBusiness,
          claimsHistory: request.policy.ratingFactors.claimsHistory,
        },
      };

      // Call Earnix API
      const response = await this.httpClient.post<EarnixPremiumResponse>(
        '/earnix/api/v1/rate',
        earnixRequest
      );

      // Transform response to standard format
      const premiumCalc: PremiumCalculation = {
        totalPremium: response.data.totalPremium,
        basePremium: response.data.basePremium,
        adjustments: response.data.adjustments,
        surcharges: response.data.surcharges,
        taxes: response.data.taxes,
        fees: response.data.fees,
        ratingFactorsUsed: response.data.ratingFactorsUsed,
      };

      return this.createResponse(premiumCalc, undefined, {
        requestId: request.requestId,
      });
    } catch (error: any) {
      this.logger.error('Failed to calculate premium', error);
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  async validateRating(
    request: RateValidationRequest
  ): Promise<AdapterResponse<RateValidationResult>> {
    try {
      // Recalculate premium
      const calcResult = await this.calculatePremium({
        policy: request.policy,
        requestId: `validate-${Date.now()}`,
      });

      if (!calcResult.success || !calcResult.data) {
        return this.createErrorResponse(
          'VALIDATION_FAILED',
          'Failed to recalculate premium for validation'
        );
      }

      const expectedPremium = calcResult.data.totalPremium;
      const variance = Math.abs(expectedPremium - request.premium);
      const variancePercentage = (variance / expectedPremium) * 100;

      const warnings: string[] = [];
      if (variancePercentage > 1) {
        warnings.push(`Premium variance of ${variancePercentage.toFixed(2)}% exceeds threshold`);
      }

      const result: RateValidationResult = {
        valid: variancePercentage <= 5, // 5% tolerance
        expectedPremium,
        variance,
        variancePercentage,
        warnings: warnings.length > 0 ? warnings : undefined,
      };

      return this.createResponse(result);
    } catch (error: any) {
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  async getRatingFactors(
    productLine: string,
    classCode: string,
    state?: string
  ): Promise<AdapterResponse<Record<string, any>>> {
    try {
      const params: any = { productLine, classCode };
      if (state) params.state = state;

      const response = await this.httpClient.get('/earnix/api/v1/factors', { params });

      return this.createResponse(response.data);
    } catch (error: any) {
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }

  async getBaseRate(
    productLine: string,
    classCode: string,
    state?: string
  ): Promise<AdapterResponse<number>> {
    try {
      const factorsResult = await this.getRatingFactors(productLine, classCode, state);

      if (!factorsResult.success || !factorsResult.data) {
        return this.createErrorResponse('RATE_NOT_FOUND', 'Base rate not found');
      }

      const baseRate = factorsResult.data.baseRate;
      return this.createResponse(baseRate);
    } catch (error: any) {
      return this.createResponse(undefined, this.handleHttpError(error));
    }
  }
}

/**
 * Usage example:
 *
 * const adapter = new EarnixAdapter({
 *   baseUrl: 'http://localhost:4001',
 *   timeout: 30000,
 * });
 *
 * await adapter.connect();
 *
 * const result = await adapter.calculatePremium({
 *   policy: myPolicy,
 *   requestId: 'rate-001',
 * });
 *
 * if (result.success) {
 *   console.log('Total Premium:', result.data.totalPremium);
 *   console.log('Base Premium:', result.data.basePremium);
 *   console.log('Adjustments:', result.data.adjustments);
 * }
 */
