export class SurchargeDto {
  type: string;
  description: string;
  amount: number;
}

export class DiscountDto {
  type: string;
  description: string;
  amount: number;
}

export class PremiumDto {
  basePremium: number;
  surcharges: SurchargeDto[];
  discounts: DiscountDto[];
  totalPremium: number;
  taxes: number;
  fees: number;
  grandTotal: number;
}

export class QuoteResponseDto {
  quoteNumber: string;
  policyNumber: string;
  status: string;
  premium: PremiumDto;
  effectiveDate: string;
  expirationDate: string;
  quotedAt: string;
}
