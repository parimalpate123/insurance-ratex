import { Controller, Post, Body, Headers } from '@nestjs/common';
import { jsonToXml } from './adapters/format.adapter';

/**
 * Mock external rating systems — used in development/testing.
 * These endpoints simulate Earnix (JSON) and CGI Ratabase (XML/SOAP).
 */
@Controller('api/v1/mock')
export class MockSystemsController {

  /** Mock Earnix REST/JSON rating endpoint */
  @Post('earnix/rate')
  mockEarnix(@Body() body: any) {
    const premium = this.calculateMockPremium(body);
    return {
      status: 'SUCCESS',
      quoteId: `EARNIX-${Date.now()}`,
      premium: {
        total: premium,
        base: Math.round(premium * 0.85),
        taxes: Math.round(premium * 0.10),
        fees: Math.round(premium * 0.05),
        currency: 'USD',
      },
      ratingFactors: {
        businessType: body?.ratingFactors?.businessType ?? 'standard',
        territory: body?.insured?.address?.state ?? 'unknown',
        experienceMod: 1.0,
      },
      effectiveDate: new Date().toISOString().split('T')[0],
      system: 'earnix-mock',
    };
  }

  /** Mock CGI Ratabase SOAP/XML rating endpoint — returns XML */
  @Post('ratabase/rate')
  mockRatabase(@Body() body: any, @Headers() headers: any): string {
    const premium = this.calculateMockPremium(body);
    const quoteId = `RATABASE-${Date.now()}`;
    const responseJson = {
      RatingResponse: {
        Status: 'SUCCESS',
        QuoteId: quoteId,
        Premium: {
          Total: premium,
          Base: Math.round(premium * 0.82),
          Surcharges: Math.round(premium * 0.13),
          Fees: Math.round(premium * 0.05),
          Currency: 'USD',
        },
        ClassCode: body?.ratingFactors?.businessType ?? 'standard',
        StateCode: body?.insured?.address?.state ?? 'XX',
        System: 'ratabase-mock',
      },
    };

    // Return as XML (SOAP-like)
    const xmlBody = jsonToXml(responseJson, 'RatingResponse');
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    ${xmlBody.replace(/<\?xml[^?]*\?>\s*/, '')}
  </soapenv:Body>
</soapenv:Envelope>`;
  }

  private calculateMockPremium(body: any): number {
    // Simple mock calculation: base = 1000, adjustments by business type
    const multipliers: Record<string, number> = {
      contractor: 1.4,
      restaurant: 1.2,
      technology: 0.9,
      services: 1.0,
      wholesale: 1.1,
      healthcare: 1.3,
      hospitality: 1.2,
      insurance: 0.85,
    };
    const businessType = body?.ratingFactors?.businessType ?? 'services';
    const multiplier = multipliers[businessType] ?? 1.0;
    return Math.round(1000 * multiplier * 100) / 100;
  }
}
