import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'earnix-mock',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
