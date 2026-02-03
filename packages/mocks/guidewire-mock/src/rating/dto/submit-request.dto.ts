import { IsString, IsDateString, IsObject, IsArray, ValidateNested, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsOptional()
  @IsString()
  addressLine1?: string;

  @IsString()
  city: string;

  @IsString()
  state: string;

  @IsString()
  postalCode: string;

  @IsOptional()
  @IsString()
  country?: string;
}

export class InsuredDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  taxId?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  primaryAddress: AddressDto;

  @IsOptional()
  @IsString()
  businessType?: string;

  @IsOptional()
  @IsNumber()
  annualRevenue?: number;

  @IsOptional()
  @IsNumber()
  employeeCount?: number;
}

export class LimitsDto {
  @IsNumber()
  generalAggregate: number;

  @IsNumber()
  productsCompletedOps: number;

  @IsNumber()
  personalAdvertisingInjury: number;

  @IsNumber()
  eachOccurrence: number;

  @IsNumber()
  fireDamage: number;

  @IsNumber()
  medicalExpense: number;
}

export class CoverageDto {
  @IsString()
  coverageCode: string;

  @IsOptional()
  @IsString()
  coverageType?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => LimitsDto)
  limits: LimitsDto;

  @IsNumber()
  deductible: number;

  @IsOptional()
  @IsString()
  premiumBasis?: string;
}

export class LocationDto {
  @IsString()
  locationNumber: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  @IsOptional()
  @IsNumber()
  buildingSquareFootage?: number;

  @IsOptional()
  @IsNumber()
  numberOfEmployees?: number;
}

export class ClassificationDto {
  @IsOptional()
  @IsString()
  naicsCode?: string;

  @IsString()
  classCode: string;

  @IsString()
  description: string;
}

export class SubmitRatingRequestDto {
  @IsString()
  policyNumber: string;

  @IsDateString()
  effectiveDate: string;

  @IsDateString()
  expirationDate: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;

  @IsObject()
  @ValidateNested()
  @Type(() => InsuredDto)
  insured: InsuredDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CoverageDto)
  coverages: CoverageDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LocationDto)
  locations?: LocationDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ClassificationDto)
  classification?: ClassificationDto;
}
