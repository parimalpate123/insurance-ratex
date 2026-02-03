import { ApiProperty } from '@nestjs/swagger';

export class RatingResponseDto {
  @ApiProperty({ description: 'Request ID for tracking' })
  requestId: string;

  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Quote number from policy system', required: false })
  quoteNumber?: string;

  @ApiProperty({ description: 'Total premium calculated', required: false })
  totalPremium?: number;

  @ApiProperty({ description: 'Premium breakdown', required: false })
  premiumBreakdown?: {
    basePremium: number;
    adjustments?: any[];
    surcharges?: any[];
    discounts?: any[];
    taxes?: number;
    fees?: number;
    rulesApplied?: string[];
  };

  @ApiProperty({ description: 'CDM policy object', required: false })
  cdmPolicy?: any;

  @ApiProperty({ description: 'Error information', required: false })
  error?: {
    code: string;
    message: string;
    details?: any;
  };

  @ApiProperty({ description: 'Execution metadata' })
  metadata: {
    sourceSystem: string;
    ratingEngine: string;
    productLine: string;
    executionTime: number;
    steps: StepMetadata[];
  };
}

export interface StepMetadata {
  step: string;
  duration: number;
  success: boolean;
  error?: string;
}
