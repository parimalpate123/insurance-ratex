/**
 * Rating Engine Adapter - Interface for rating engines
 * (Earnix, ISO, custom engines, etc.)
 */

import { Policy } from '@insurratex/cdm';
import { BaseAdapter } from './base-adapter';
import { AdapterResponse } from '../types/adapter.types';

export interface RatingRequest {
  policy: Policy;
  requestId?: string;
  rateAsOfDate?: string;
}

export interface PremiumCalculation {
  totalPremium: number;
  basePremium: number;
  adjustments?: PremiumAdjustment[];
  surcharges?: Surcharge[];
  discounts?: Discount[];
  taxes?: number;
  fees?: number;
  ratingFactorsUsed?: Record<string, any>;
}

export interface PremiumAdjustment {
  type: string;
  description: string;
  factor: number;
  amount: number;
}

export interface Surcharge {
  type: string;
  description: string;
  amount: number;
}

export interface Discount {
  type: string;
  description: string;
  amount: number;
  percentage?: number;
}

export interface RateValidationRequest {
  policy: Policy;
  premium: number;
}

export interface RateValidationResult {
  valid: boolean;
  expectedPremium?: number;
  variance?: number;
  variancePercentage?: number;
  warnings?: string[];
  errors?: string[];
}

/**
 * Abstract base class for all rating engine adapters
 */
export abstract class RatingEngineAdapter extends BaseAdapter {
  /**
   * Calculate premium for a policy
   */
  abstract calculatePremium(
    request: RatingRequest
  ): Promise<AdapterResponse<PremiumCalculation>>;

  /**
   * Validate a rating result
   */
  abstract validateRating(
    request: RateValidationRequest
  ): Promise<AdapterResponse<RateValidationResult>>;

  /**
   * Get rating factors for a specific product line and class code
   */
  abstract getRatingFactors(
    productLine: string,
    classCode: string,
    state?: string
  ): Promise<AdapterResponse<Record<string, any>>>;

  /**
   * Get base rate for a specific class code
   */
  abstract getBaseRate(
    productLine: string,
    classCode: string,
    state?: string
  ): Promise<AdapterResponse<number>>;
}
