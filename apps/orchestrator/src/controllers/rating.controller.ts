import { Controller, Post, Body, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrchestrationService } from '../services/orchestration.service';
import { RatingRequestDto } from '../dto/rating-request.dto';
import { RatingResponseDto } from '../dto/rating-response.dto';

@ApiTags('rating')
@Controller('api/v1/rating')
export class RatingController {
  private readonly logger = new Logger(RatingController.name);

  constructor(private readonly orchestrationService: OrchestrationService) {}

  @Post('execute')
  @ApiOperation({
    summary: 'Execute end-to-end rating flow',
    description:
      'Orchestrates the complete rating flow: source system → CDM → rules → rating engine',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating executed successfully',
    type: RatingResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request',
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
  })
  async executeRating(
    @Body() request: RatingRequestDto
  ): Promise<RatingResponseDto> {
    this.logger.log(
      `Rating request received: ${request.sourceSystem} → ${request.ratingEngine}`
    );

    return this.orchestrationService.executeRating(request);
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health check',
    description: 'Check if the orchestrator service is healthy',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
  })
  healthCheck(): { status: string; timestamp: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
