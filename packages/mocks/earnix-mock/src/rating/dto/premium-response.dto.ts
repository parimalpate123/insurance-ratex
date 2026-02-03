export class AdjustmentDto {
  type: string;
  factor: number;
  description: string;
  amount: number;
}

export class SurchargeDto {
  type: string;
  description: string;
  amount: number;
}

export class RatingFactorsUsedDto {
  baseRate: number;
  territorialFactor: number;
  experienceMod: number;
  limitFactor: number;
  deductibleCredit: number;
}

export class PremiumResponseDto {
  basePremium: number;
  adjustments: AdjustmentDto[];
  surcharges: SurchargeDto[];
  subtotal: number;
  taxes: number;
  fees: number;
  totalPremium: number;
  ratingFactorsUsed: RatingFactorsUsedDto;
}
