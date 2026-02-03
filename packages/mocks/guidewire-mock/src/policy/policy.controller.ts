import { Controller, Get, Param } from '@nestjs/common';

@Controller('pc/policy')
export class PolicyController {
  @Get(':policyNumber')
  getPolicy(@Param('policyNumber') policyNumber: string) {
    return {
      policyNumber,
      status: 'Active',
      effectiveDate: '2024-01-01T00:00:00Z',
      message: 'Mock implementation - full policy details would be returned here',
    };
  }

  @Get(':policyNumber/bind')
  bindPolicy(@Param('policyNumber') policyNumber: string) {
    return {
      policyNumber,
      status: 'Bound',
      boundAt: new Date().toISOString(),
      message: 'Policy successfully bound (mock)',
    };
  }
}
