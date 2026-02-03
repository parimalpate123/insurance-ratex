/**
 * Policy System Adapter - Interface for policy management systems
 * (Guidewire, Duck Creek, Salesforce, etc.)
 */

import { Policy } from '@insurratex/cdm';
import { BaseAdapter } from './base-adapter';
import { AdapterResponse } from '../types/adapter.types';

export interface SubmitRatingRequest {
  policy: Policy;
  requestId?: string;
}

export interface RatingResponse {
  quoteNumber: string;
  premium: number;
  effectiveDate: string;
  expirationDate: string;
  status: 'quoted' | 'rated' | 'bound';
  breakdown?: {
    base: number;
    surcharges?: Array<{ type: string; amount: number }>;
    discounts?: Array<{ type: string; amount: number }>;
    taxes?: number;
    fees?: number;
  };
}

export interface RetrieveQuoteRequest {
  quoteNumber: string;
}

export interface BindPolicyRequest {
  quoteNumber: string;
  effectiveDate?: string;
  paymentInfo?: any;
}

export interface PolicyResponse {
  policyNumber: string;
  status: 'bound' | 'inforce' | 'cancelled' | 'expired';
  policy: Policy;
}

/**
 * Abstract base class for all policy system adapters
 */
export abstract class PolicySystemAdapter extends BaseAdapter {
  /**
   * Submit a policy for rating
   */
  abstract submitForRating(
    request: SubmitRatingRequest
  ): Promise<AdapterResponse<RatingResponse>>;

  /**
   * Retrieve a quote by quote number
   */
  abstract retrieveQuote(
    request: RetrieveQuoteRequest
  ): Promise<AdapterResponse<RatingResponse>>;

  /**
   * Bind a quote to create a policy
   */
  abstract bindPolicy(
    request: BindPolicyRequest
  ): Promise<AdapterResponse<PolicyResponse>>;

  /**
   * Retrieve policy details by policy number
   */
  abstract retrievePolicy(
    policyNumber: string
  ): Promise<AdapterResponse<PolicyResponse>>;

  /**
   * Cancel a policy
   */
  abstract cancelPolicy(
    policyNumber: string,
    cancellationDate: string,
    reason?: string
  ): Promise<AdapterResponse<PolicyResponse>>;
}
