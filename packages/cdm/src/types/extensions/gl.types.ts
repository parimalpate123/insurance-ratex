/**
 * General Liability Product Line Extensions (20% unique)
 * Version: gl-v1.2
 */

import { Policy, Coverage, Location, RatingFactors } from '../base.types';

export type GLClassCode =
  | '91580' // Machine Shops
  | '10380' // Professional Services
  | '13350' // Construction - General
  | '43210' // Restaurants
  | '54320' // Retail Stores
  | '62140' // Wholesale
  | '71123' // Hotels/Motels
  | '80045' // Manufacturing
  | '90231'; // Technology Services

export type GLCoverageType =
  | 'bodily-injury'
  | 'property-damage'
  | 'personal-injury'
  | 'advertising-injury'
  | 'products-completed-ops'
  | 'fire-legal-liability'
  | 'medical-payments';

export interface GLClassification {
  classCode: GLClassCode;
  description: string;
  exposure: number; // Revenue, square footage, payroll, etc.
  exposureBase: 'revenue' | 'payroll' | 'area' | 'units';
  rate?: number;
  premium?: number;
}

export interface GLLimits {
  perOccurrence: number;
  aggregate: number;
  productsCompletedOps?: number;
  personalAdvertisingInjury?: number;
  fireLegalLiability?: number;
  medicalExpense?: number;
}

export interface GLCoverage extends Coverage {
  type: 'general-liability';
  limits: GLLimits;
  classification: GLClassification;
  includeProductsOps?: boolean;
  retroactiveDate?: string;
}

export interface GLLocation extends Location {
  areaSquareFeet?: number;
  protectionClass?: string;
  constructionType?: 'frame' | 'joisted-masonry' | 'non-combustible' | 'masonry-non-combustible' | 'modified-fire-resistive' | 'fire-resistive';
  yearBuilt?: number;
  sprinklered?: boolean;
  securityFeatures?: string[];
}

export interface GLRatingFactors extends RatingFactors {
  classCode: GLClassCode;
  totalInsuredValue?: number;
  hasProductsOps?: boolean;
  hasCompletedOps?: boolean;
  hasProfessionalLiability?: boolean;
  subcontractorCost?: number;
  annualPayroll?: number;
}

export interface GLExtensions {
  classifications: GLClassification[];
  additionalInsureds?: string[];
  waiverOfSubrogation?: boolean;
  blanketAdditionalInsured?: boolean;
  primaryNonContributory?: boolean;
  liquorLiability?: {
    included: boolean;
    annualSales?: number;
  };
  contractualLiability?: {
    included: boolean;
    description?: string;
  };
}

export interface GLPolicy extends Policy {
  productLine: 'general-liability';
  version: 'gl-v1.0' | 'gl-v1.1' | 'gl-v1.2';
  locations: GLLocation[];
  coverages: GLCoverage[];
  ratingFactors: GLRatingFactors;
  extensions: GLExtensions;
}
