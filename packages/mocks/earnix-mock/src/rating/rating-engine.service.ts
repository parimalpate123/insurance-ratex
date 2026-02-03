import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

interface ClaimsHistory {
  priorClaimsCount: number;
  priorClaimsAmount: number;
}

interface RatingFactors {
  classCode: string;
  yearsInBusiness?: number;
  claimsHistory?: ClaimsHistory;
}

interface Coverage {
  type: string;
  limit: number;
  deductible: number;
}

interface Insured {
  state: string;
  businessType?: string;
  annualRevenue: number;
  employeeCount?: number;
}

interface RatingRequest {
  requestId: string;
  productLine: string;
  productVersion: string;
  insured: Insured;
  coverages: Coverage[];
  ratingFactors: RatingFactors;
}

@Injectable()
export class RatingEngineService {
  private baseRates: Record<string, number>;
  private territorialFactors: Record<string, number>;

  constructor() {
    this.loadRules();
  }

  /**
   * Load rating rules from JSON files
   */
  private loadRules() {
    try {
      const rulesPath = path.join(__dirname, '../rules');
      this.baseRates = JSON.parse(
        fs.readFileSync(path.join(rulesPath, 'base-rates.json'), 'utf-8'),
      );
      this.territorialFactors = JSON.parse(
        fs.readFileSync(path.join(rulesPath, 'territorial-factors.json'), 'utf-8'),
      );
    } catch (error) {
      // Use defaults if files don't exist
      console.warn('⚠️  Using default rating rules (rule files not found)');
      this.baseRates = {
        '91580': 2.50, // Machine Shops
        '10380': 1.20, // Professional Services
        '13350': 3.80, // Construction
      };
      this.territorialFactors = {
        CA: 1.15,
        TX: 0.95,
        NY: 1.10,
        FL: 1.05,
      };
    }
  }

  /**
   * Main rating calculation method
   */
  calculatePremium(request: RatingRequest) {
    console.log(`📊 Calculating premium for ${request.productLine}...`);

    // Step 1: Base Rate Calculation
    const baseRate = this.getBaseRate(request.ratingFactors.classCode);
    const exposureBase = request.insured.annualRevenue / 1000; // Per $1K revenue
    const basePremium = baseRate * exposureBase;

    console.log(`  Base Rate: ${baseRate}, Exposure: $${exposureBase}K, Base Premium: $${basePremium.toFixed(2)}`);

    // Step 2: Apply Territorial Factor
    const territorialFactor = this.getTerritorialFactor(request.insured.state);
    const territorialPremium = basePremium * territorialFactor;

    console.log(`  Territorial Factor (${request.insured.state}): ${territorialFactor}, Premium: $${territorialPremium.toFixed(2)}`);

    // Step 3: Apply Experience Modifier
    const experienceMod = this.calculateExperienceMod(request.ratingFactors.claimsHistory);
    const modifiedPremium = territorialPremium * experienceMod;

    console.log(`  Experience Mod: ${experienceMod}, Premium: $${modifiedPremium.toFixed(2)}`);

    // Step 4: Apply Coverage Limit Factor
    const limitFactor = this.getLimitFactor(request.coverages[0].limit);
    const limitAdjustedPremium = modifiedPremium * limitFactor;

    console.log(`  Limit Factor: ${limitFactor}, Premium: $${limitAdjustedPremium.toFixed(2)}`);

    // Step 5: Apply Deductible Credit
    const deductibleCredit = this.getDeductibleCredit(request.coverages[0].deductible);
    const finalPremium = limitAdjustedPremium * (1 - deductibleCredit);

    console.log(`  Deductible Credit: ${(deductibleCredit * 100).toFixed(1)}%, Premium: $${finalPremium.toFixed(2)}`);

    // Step 6: Apply Surcharges
    const surcharges = this.calculateSurcharges(request);
    const subtotal = finalPremium + surcharges.total;

    // Step 7: Taxes and Fees
    const taxes = subtotal * 0.01; // 1% tax
    const fees = 75.0; // Administrative fee

    const totalPremium = subtotal + taxes + fees;

    console.log(`  ✅ Total Premium: $${totalPremium.toFixed(2)}`);

    return {
      basePremium: this.round(basePremium),
      adjustments: [
        {
          type: 'TerritorialFactor',
          factor: territorialFactor,
          description: `${request.insured.state} Territory Adjustment`,
          amount: this.round(territorialPremium - basePremium),
        },
        {
          type: 'ExperienceMod',
          factor: experienceMod,
          description: 'Experience Modification',
          amount: this.round(modifiedPremium - territorialPremium),
        },
        {
          type: 'LimitFactor',
          factor: limitFactor,
          description: `$${(request.coverages[0].limit / 1000000).toFixed(0)}M Limit Factor`,
          amount: this.round(limitAdjustedPremium - modifiedPremium),
        },
        {
          type: 'DeductibleCredit',
          factor: 1 - deductibleCredit,
          description: `$${(request.coverages[0].deductible / 1000).toFixed(0)}K Deductible Credit`,
          amount: this.round(finalPremium - limitAdjustedPremium),
        },
      ],
      surcharges: surcharges.items,
      subtotal: this.round(subtotal),
      taxes: this.round(taxes),
      fees: this.round(fees),
      totalPremium: this.round(totalPremium),
      ratingFactorsUsed: {
        baseRate,
        territorialFactor,
        experienceMod,
        limitFactor,
        deductibleCredit,
      },
    };
  }

  /**
   * Get base rate by class code
   */
  private getBaseRate(classCode: string): number {
    return this.baseRates[classCode] || 2.0;
  }

  /**
   * Get territorial factor by state
   */
  private getTerritorialFactor(state: string): number {
    return this.territorialFactors[state] || 1.0;
  }

  /**
   * Calculate experience modification based on claims history
   */
  private calculateExperienceMod(claimsHistory?: ClaimsHistory): number {
    if (!claimsHistory || !claimsHistory.priorClaimsCount) {
      return 0.95; // 5% credit for no claims
    }

    const claimFrequency = claimsHistory.priorClaimsCount;
    const avgClaimSeverity = claimsHistory.priorClaimsAmount / claimFrequency;

    if (claimFrequency === 1 && avgClaimSeverity < 50000) return 1.00;
    if (claimFrequency === 1 && avgClaimSeverity >= 50000) return 1.10;
    if (claimFrequency >= 2 && claimFrequency <= 3) return 1.25;
    if (claimFrequency > 3) return 1.40;

    return 1.00;
  }

  /**
   * Get limit factor (Increased Limits Factor - ILF)
   */
  private getLimitFactor(limit: number): number {
    const ilf: Record<number, number> = {
      1000000: 1.00,
      2000000: 1.25,
      3000000: 1.45,
      5000000: 1.70,
      10000000: 2.00,
    };

    return ilf[limit] || 1.00;
  }

  /**
   * Get deductible credit percentage
   */
  private getDeductibleCredit(deductible: number): number {
    const credits: Record<number, number> = {
      1000: 0.05,
      2500: 0.08,
      5000: 0.12,
      10000: 0.18,
      25000: 0.25,
    };

    return credits[deductible] || 0.00;
  }

  /**
   * Calculate surcharges based on rules
   */
  private calculateSurcharges(request: RatingRequest) {
    const items = [];
    let total = 0;

    // High-value surcharge for CA policies over $1M
    if (request.insured.state === 'CA' && request.coverages[0].limit > 1000000) {
      const surcharge = 500;
      items.push({
        type: 'HighValueSurcharge',
        description: 'CA High-Value Policy Surcharge',
        amount: surcharge,
      });
      total += surcharge;
    }

    // New business surcharge
    if (request.ratingFactors.yearsInBusiness && request.ratingFactors.yearsInBusiness < 3) {
      const surcharge = 250;
      items.push({
        type: 'NewBusinessSurcharge',
        description: 'New Business Administrative Fee',
        amount: surcharge,
      });
      total += surcharge;
    }

    return { items, total };
  }

  /**
   * Round to 2 decimal places
   */
  private round(value: number): number {
    return Math.round(value * 100) / 100;
  }
}
