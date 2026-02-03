/**
 * Base CDM Types - Common across all product lines (80% coverage)
 * Version: cdm-base-v1.0
 */

export type ProductLine = 'general-liability' | 'property' | 'inland-marine' | 'workers-comp' | 'auto';

export type PolicyStatus = 'quote' | 'bound' | 'inforce' | 'cancelled' | 'expired';

export type CoverageType = 'general-liability' | 'property' | 'inland-marine' | 'equipment' | 'building' | 'contents';

export type BusinessType =
  | 'manufacturing'
  | 'retail'
  | 'wholesale'
  | 'professional-services'
  | 'construction'
  | 'hospitality'
  | 'healthcare'
  | 'technology';

export interface Address {
  street1: string;
  street2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface Contact {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  type: 'primary' | 'billing' | 'agent' | 'broker';
}

export interface Money {
  amount: number;
  currency: string; // ISO 4217 code (USD, CAD, etc.)
}

export interface DateRange {
  effectiveDate: string; // ISO 8601 format
  expirationDate: string; // ISO 8601 format
}

export interface Insured {
  id?: string;
  name: string;
  dba?: string; // Doing Business As
  businessType: BusinessType;
  yearEstablished?: number;
  taxId?: string;
  website?: string;
  primaryAddress: Address;
  mailingAddress?: Address;
  contacts: Contact[];
  employeeCount?: number;
  annualRevenue?: number;
  yearsInBusiness?: number;
}

export interface Location {
  id: string;
  address: Address;
  locationNumber?: string;
  isPrimary: boolean;
  buildingValue?: number;
  contentsValue?: number;
  businessIncomeValue?: number;
  // Product-line specific fields go in extensions
}

export interface Coverage {
  id: string;
  type: CoverageType;
  limit: number;
  deductible: number;
  premium?: number;
  isPrimary: boolean;
  perOccurrence?: number;
  aggregate?: number;
  // Product-line specific fields go in extensions
}

export interface ClaimsHistory {
  priorClaimsCount: number;
  priorClaimsAmount: number;
  yearsOfHistory: number;
  claims?: Claim[];
}

export interface Claim {
  claimNumber?: string;
  lossDate: string;
  reportDate?: string;
  lossType: string;
  status: 'open' | 'closed' | 'pending';
  paidAmount?: number;
  reserveAmount?: number;
  description?: string;
}

export interface Premium {
  base: number;
  surcharges?: PremiumAdjustment[];
  discounts?: PremiumAdjustment[];
  taxes?: number;
  fees?: number;
  total: number;
}

export interface PremiumAdjustment {
  type: string;
  description: string;
  amount: number;
  percentage?: number;
}

export interface RatingFactors {
  classCode: string;
  territory?: string;
  yearsInBusiness?: number;
  claimsHistory?: ClaimsHistory;
  creditScore?: number;
  industryModifier?: number;
  // Product-line specific factors go in extensions
}

export interface Policy {
  // Metadata
  id?: string;
  policyNumber?: string;
  quoteNumber?: string;
  version: string; // e.g., "gl-v1.2", "property-v1.0"
  productLine: ProductLine;
  status: PolicyStatus;

  // Dates
  effectiveDate: string;
  expirationDate: string;
  createdAt?: string;
  updatedAt?: string;

  // Parties
  insured: Insured;
  agent?: Contact;
  broker?: Contact;

  // Coverage & Risk
  locations: Location[];
  coverages: Coverage[];
  ratingFactors: RatingFactors;

  // Premium
  premium?: Premium;

  // Extensions for product-line specific data
  extensions?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}
