import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ClaimsHistoryDto {
  @IsNumber()
  @Min(0)
  priorClaimsCount: number;

  @IsNumber()
  @Min(0)
  priorClaimsAmount: number;
}

export class RatingFactorsDto {
  @IsString()
  classCode: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  yearsInBusiness?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => ClaimsHistoryDto)
  claimsHistory?: ClaimsHistoryDto;
}

export class CoverageDto {
  @IsString()
  type: string;

  @IsNumber()
  @Min(0)
  limit: number;

  @IsNumber()
  @Min(0)
  deductible: number;
}

export class InsuredDto {
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsNumber()
  @Min(0)
  annualRevenue: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  employeeCount?: number;
}

export class RatingRequestDto {
  @IsString()
  requestId: string;

  @IsString()
  productLine: string;

  @IsString()
  productVersion: string;

  @ValidateNested()
  @Type(() => InsuredDto)
  insured: InsuredDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageDto)
  coverages: CoverageDto[];

  @ValidateNested()
  @Type(() => RatingFactorsDto)
  ratingFactors: RatingFactorsDto;
}
