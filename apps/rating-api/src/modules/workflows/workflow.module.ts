import { Module } from '@nestjs/common';
import { WorkflowEngine } from './workflow-engine.service';
import { ProductLinesModule } from '../product-lines/product-lines.module';
import { MappingsModule } from '../mappings/mappings.module';
import { RulesModule } from '../rules/rules.module';

@Module({
  imports: [ProductLinesModule, MappingsModule, RulesModule],
  providers: [WorkflowEngine],
  exports: [WorkflowEngine],
})
export class WorkflowModule {}
