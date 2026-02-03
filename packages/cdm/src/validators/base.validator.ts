/**
 * CDM Base Validators using class-validator
 */

import {
  IsString,
  IsNumber,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  ValidateNested,
  Min,
  Max,
  IsISO8601,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ProductLine,
  PolicyStatus,
  CoverageType,
  BusinessType,
  Address,
  Contact,
  Insured,
  Location,
  Coverage,
  ClaimsHistory,
  Claim,
  Premium,
  PremiumAdjustment,
  RatingFactors,
  Policy,
} from '../types/base.types';

export class AddressValidator implements Address {
  @IsString()
  street1: string;

  @IsOptional()
  @IsString()
  street2?: string;

  @IsString()
  city: string;

  @IsString()
  @Matches(/^[A-Z]{2}$/, { message: 'State must be 2-letter code' })
  state: string;

  @IsString()
  postalCode: string;

  @IsString()
  country: string;
}

export class ContactValidator implements Contact {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(['primary', 'billing', 'agent', 'broker'])
  type: 'primary' | 'billing' | 'agent' | 'broker';
}

export class InsuredValidator implements Insured {
  @IsOptional()
  @IsString()
  id?: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  dba?: string;

  @IsEnum([
    'manufacturing',
    'retail',
    'wholesale',
    'professional-services',
    'construction',
    'hospitality',
    'healthcare',
    'technology',
  ])
  businessType: BusinessType;

  @IsOptional()
  @IsNumber()
  @Min(1800)
  @Max(new Date().getFullYear())
  yearEstablished?: number;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsOptional()
  @IsString()
  website?: string;

  @ValidateNested()
  @Type(() => AddressValidator)
  primaryAddress: Address;

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressValidator)
  mailingAddress?: Address;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactValidator)
  contacts: Contact[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualRevenue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsInBusiness?: number;
}

export class LocationValidator implements Location {
  @IsString()
  id: string;

  @ValidateNested()
  @Type(() => AddressValidator)
  address: Address;

  @IsOptional()
  @IsString()
  locationNumber?: string;

  @IsBoolean()
  isPrimary: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  buildingValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  contentsValue?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  businessIncomeValue?: number;
}

export class CoverageValidator implements Coverage {
  @IsString()
  id: string;

  @IsEnum([
    'general-liability',
    'property',
    'inland-marine',
    'equipment',
    'building',
    'contents',
  ])
  type: CoverageType;

  @IsNumber()
  @Min(0)
  limit: number;

  @IsNumber()
  @Min(0)
  deductible: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  premium?: number;

  @IsBoolean()
  isPrimary: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  perOccurrence?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  aggregate?: number;
}

export class ClaimValidator implements Claim {
  @IsOptional()
  @IsString()
  claimNumber?: string;

  @IsISO8601()
  lossDate: string;

  @IsOptional()
  @IsISO8601()
  reportDate?: string;

  @IsString()
  lossType: string;

  @IsEnum(['open', 'closed', 'pending'])
  status: 'open' | 'closed' | 'pending';

  @IsOptional()
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  reserveAmount?: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class ClaimsHistoryValidator implements ClaimsHistory {
  @IsNumber()
  @Min(0)
  priorClaimsCount: number;

  @IsNumber()
  @Min(0)
  priorClaimsAmount: number;

  @IsNumber()
  @Min(0)
  @Max(10)
  yearsOfHistory: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ClaimValidator)
  claims?: Claim[];
}

export class PremiumAdjustmentValidator implements PremiumAdjustment {
  @IsString()
  type: string;

  @IsString()
  description: string;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage?: number;
}

export class PremiumValidator implements Premium {
  @IsNumber()
  @Min(0)
  base: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PremiumAdjustmentValidator)
  surcharges?: PremiumAdjustment[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PremiumAdjustmentValidator)
  discounts?: PremiumAdjustment[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  taxes?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  fees?: number;

  @IsNumber()
  @Min(0)
  total: number;
}

export class RatingFactorsValidator implements RatingFactors {
  @IsString()
  classCode: string;

  @IsOptional()
  @IsString()
  territory?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsInBusiness?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClaimsHistoryValidator)
  claimsHistory?: ClaimsHistory;

  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(850)
  creditScore?: number;

  @IsOptional()
  @IsNumber()
  industryModifier?: number;
}

export class PolicyValidator implements Policy {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  policyNumber?: string;

  @IsOptional()
  @IsString()
  quoteNumber?: string;

  @IsString()
  @Matches(/^[a-z-]+-v\d+\.\d+$/, {
    message: 'Version must be in format: product-line-vX.Y (e.g., gl-v1.2)',
  })
  version: string;

  @IsEnum(['general-liability', 'property', 'inland-marine', 'workers-comp', 'auto'])
  productLine: ProductLine;

  @IsEnum(['quote', 'bound', 'inforce', 'cancelled', 'expired'])
  status: PolicyStatus;

  @IsISO8601()
  effectiveDate: string;

  @IsISO8601()
  expirationDate: string;

  @IsOptional()
  @IsISO8601()
  createdAt?: string;

  @IsOptional()
  @IsISO8601()
  updatedAt?: string;

  @ValidateNested()
  @Type(() => InsuredValidator)
  insured: Insured;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactValidator)
  agent?: Contact;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContactValidator)
  broker?: Contact;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationValidator)
  locations: Location[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageValidator)
  coverages: Coverage[];

  @ValidateNested()
  @Type(() => RatingFactorsValidator)
  ratingFactors: RatingFactors;

  @IsOptional()
  @ValidateNested()
  @Type(() => PremiumValidator)
  premium?: Premium;

  @IsOptional()
  extensions?: Record<string, any>;
}
