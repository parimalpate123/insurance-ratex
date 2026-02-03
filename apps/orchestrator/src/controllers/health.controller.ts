import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('health')
@Controller()
export class HealthController {
  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  healthCheck() {
    return {
      status: 'ok',
      service: 'orchestrator',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get()
  @ApiOperation({ summary: 'Root endpoint' })
  root() {
    return {
      service: 'InsurRateX Orchestrator',
      version: '1.0.0',
      description: 'Orchestration service for insurance rating workflows',
      endpoints: {
        health: '/health',
        rating: '/api/v1/rating/execute',
        docs: '/api/docs',
      },
    };
  }
}
