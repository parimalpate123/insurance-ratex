import { Module } from '@nestjs/common';
import { PolicyController } from './policy.controller';

@Module({
  controllers: [PolicyController],
  providers: [],
  exports: [],
})
export class PolicyModule {}
