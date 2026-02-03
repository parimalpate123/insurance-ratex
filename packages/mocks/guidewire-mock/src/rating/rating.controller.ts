import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { RatingService } from './rating.service';
import { SubmitRatingRequestDto } from './dto/submit-request.dto';
import { QuoteResponseDto } from './dto/quote-response.dto';

@Controller('pc/rating')
export class RatingController {
  constructor(private readonly ratingService: RatingService) {}

  @Post('submit')
  @HttpCode(HttpStatus.OK)
  async submitForRating(@Body() request: SubmitRatingRequestDto): Promise<QuoteResponseDto> {
    return this.ratingService.submitForRating(request);
  }

  @Get('quote/:quoteNumber')
  async getQuote(@Param('quoteNumber') quoteNumber: string): Promise<QuoteResponseDto | { message: string }> {
    const quote = await this.ratingService.getQuote(quoteNumber);

    if (!quote) {
      return { message: `Quote ${quoteNumber} not found (mock implementation)` };
    }

    return quote;
  }
}
