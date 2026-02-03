import { Controller, Post, Body } from '@nestjs/common';
import { RatingEngineService } from './rating-engine.service';
import { RatingRequestDto } from './dto/rating-request.dto';
import { PremiumResponseDto } from './dto/premium-response.dto';

@Controller('earnix/api/v1')
export class RatingController {
  constructor(private readonly ratingEngineService: RatingEngineService) {}

  @Post('rate')
  calculateRating(@Body() request: RatingRequestDto): PremiumResponseDto {
    console.log(`\n🎯 Received rating request: ${request.requestId}`);
    console.log(`   Product: ${request.productLine} v${request.productVersion}`);
    console.log(`   Insured: ${request.insured.state}, Revenue: $${request.insured.annualRevenue}`);

    const result = this.ratingEngineService.calculatePremium(request);

    console.log(`\n✨ Rating complete for ${request.requestId}`);
    console.log(`   Total Premium: $${result.totalPremium}\n`);

    return result;
  }
}
