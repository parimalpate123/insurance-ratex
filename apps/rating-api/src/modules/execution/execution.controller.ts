import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ExecutionService } from './execution.service';
import { RatingRequest, RatingResponse } from '@rating-poc/shared-types';

@ApiTags('Execution')
@Controller('api/v1/rating')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post(':productLineCode/execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Execute rating for a product line' })
  @ApiParam({
    name: 'productLineCode',
    description: 'Product line code (e.g., GL_COMMERCIAL, WC_CA)',
    example: 'GL_EXISTING',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating executed successfully',
    schema: {
      example: {
        success: true,
        productLineCode: 'GL_EXISTING',
        result: {
          premium: 15000,
          premiumBreakdown: {
            base: 12500,
            adjustments: []
          },
          ratingEngine: 'earnix'
        },
        metadata: {
          executionTimeMs: 1234,
          steps: [
            { id: 'validate', name: 'Input Validation', success: true, duration: 10 },
            { id: 'transform', name: 'Data Mapping', success: true, duration: 50 },
            { id: 'rules', name: 'Business Rules', success: true, duration: 100 },
            { id: 'calculate', name: 'Calculate Premium', success: true, duration: 1000 },
            { id: 'respond', name: 'Format Response', success: true, duration: 5 }
          ],
          timestamp: '2026-02-06T10:30:00.000Z'
        }
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or workflow execution failed',
  })
  @ApiResponse({
    status: 404,
    description: 'Product line configuration not found',
  })
  async executeRating(
    @Param('productLineCode') productLineCode: string,
    @Body() body: { data: any; context?: any },
  ): Promise<RatingResponse> {
    const request: RatingRequest = {
      productLineCode,
      data: body.data,
      context: body.context,
    };

    return this.executionService.executeRating(request);
  }

  @Post('execute')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Execute rating (with product line code in body)',
    description: 'Alternative endpoint that accepts product line code in request body',
  })
  @ApiResponse({
    status: 200,
    description: 'Rating executed successfully',
  })
  async executeRatingWithBody(
    @Body() request: RatingRequest,
  ): Promise<RatingResponse> {
    return this.executionService.executeRating(request);
  }
}
