import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RatingRequestDto {
  @ApiProperty({
    description: 'Source policy system',
    example: 'guidewire',
  })
  @IsString()
  @IsNotEmpty()
  sourceSystem: string;

  @ApiProperty({
    description: 'Target rating engine',
    example: 'earnix',
  })
  @IsString()
  @IsNotEmpty()
  ratingEngine: string;

  @ApiProperty({
    description: 'Product line',
    example: 'general-liability',
  })
  @IsString()
  @IsNotEmpty()
  productLine: string;

  @ApiProperty({
    description: 'Policy data in source system format',
    example: {
      quoteNumber: 'Q-2026-001234',
      productCode: 'GL',
      insured: {
        name: 'Acme Corp',
        state: 'CA',
      },
    },
  })
  @IsObject()
  @IsNotEmpty()
  policyData: any;

  @ApiProperty({
    description: 'Optional request ID for tracking',
    required: false,
  })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiProperty({
    description: 'Apply business rules',
    default: true,
    required: false,
  })
  @IsOptional()
  applyRules?: boolean;
}
