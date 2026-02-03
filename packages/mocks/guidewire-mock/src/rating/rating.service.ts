import { Injectable } from '@nestjs/common';
import { SubmitRatingRequestDto } from './dto/submit-request.dto';
import { QuoteResponseDto, PremiumDto } from './dto/quote-response.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RatingService {
  /**
   * Submit policy for rating and return quote
   */
  async submitForRating(request: SubmitRatingRequestDto): Promise<QuoteResponseDto> {
    console.log(`📝 Processing rating request for policy: ${request.policyNumber}`);

    // Calculate premium (mock logic)
    const premium = this.calculatePremium(request);

    // Generate quote
    const quoteNumber = `Q-${new Date().getFullYear()}-${this.generateQuoteId()}`;

    const response: QuoteResponseDto = {
      quoteNumber,
      policyNumber: request.policyNumber,
      status: 'Quoted',
      premium,
      effectiveDate: request.effectiveDate,
      expirationDate: request.expirationDate,
      quotedAt: new Date().toISOString(),
    };

    console.log(`✅ Quote generated: ${quoteNumber}, Premium: $${premium.grandTotal}`);

    return response;
  }

  /**
   * Calculate premium based on request data (simplified mock logic)
   */
  private calculatePremium(request: SubmitRatingRequestDto): PremiumDto {
    const coverage = request.coverages[0]; // For GL, use first coverage
    const insured = request.insured;

    // Base premium calculation (simplified)
    // In real Guidewire, this would be more complex
    const exposureBase = (insured.annualRevenue || 1000000) / 1000; // Per $1K revenue
    const baseRate = 2.5; // Mock base rate
    let basePremium = exposureBase * baseRate;

    // Round to 2 decimals
    basePremium = Math.round(basePremium * 100) / 100;

    // Apply surcharges based on state
    const surcharges = [];
    if (insured.primaryAddress.state === 'CA') {
      surcharges.push({
        type: 'TerritorialSurcharge',
        description: 'California High-Risk Territory',
        amount: Math.round(basePremium * 0.05 * 100) / 100, // 5% surcharge
      });
    }

    // Discounts (none in this mock for now)
    const discounts = [];

    // Calculate total
    const surchargeTotal = surcharges.reduce((sum, s) => sum + s.amount, 0);
    const discountTotal = discounts.reduce((sum, d) => sum + d.amount, 0);
    const totalPremium = basePremium + surchargeTotal - discountTotal;

    // Taxes and fees
    const taxes = Math.round(totalPremium * 0.01 * 100) / 100; // 1% tax
    const fees = 50.0; // Flat policy fee

    const grandTotal = Math.round((totalPremium + taxes + fees) * 100) / 100;

    return {
      basePremium,
      surcharges,
      discounts,
      totalPremium: Math.round(totalPremium * 100) / 100,
      taxes,
      fees,
      grandTotal,
    };
  }

  /**
   * Generate unique quote ID
   */
  private generateQuoteId(): string {
    return uuidv4().split('-')[0].toUpperCase();
  }

  /**
   * Get existing quote by quote number (mock - returns null for now)
   */
  async getQuote(quoteNumber: string): Promise<QuoteResponseDto | null> {
    console.log(`🔍 Looking up quote: ${quoteNumber}`);
    // In a real implementation, this would fetch from a database
    // For mock, return null
    return null;
  }
}
