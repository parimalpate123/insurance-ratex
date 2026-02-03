import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      service: 'guidewire-mock',
      timestamp: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
