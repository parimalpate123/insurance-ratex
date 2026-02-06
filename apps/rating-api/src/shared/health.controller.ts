import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/typeorm';
import { Connection } from 'typeorm';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(@InjectConnection() private connection: Connection) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2026-02-06T10:30:00.000Z',
        uptime: 123.456,
        database: 'connected',
      },
    },
  })
  async healthCheck() {
    const isDbConnected = this.connection.isInitialized;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: isDbConnected ? 'connected' : 'disconnected',
      service: 'rating-api',
      version: '1.0.0',
    };
  }

  @Get('api/v1/health')
  @ApiOperation({ summary: 'Health check endpoint (versioned)' })
  async healthCheckVersioned() {
    return this.healthCheck();
  }
}
