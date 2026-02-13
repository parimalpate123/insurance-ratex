import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Pipeline } from '../../entities/pipeline.entity';
import { PipelineStep } from '../../entities/pipeline-step.entity';
import { RoutingRule } from '../../entities/routing-rule.entity';
import { SystemEntity } from '../../entities/system.entity';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';
import { ConditionalRule } from '../../entities/conditional-rule.entity';
import { PipelinesController } from './pipelines.controller';
import { MockSystemsController } from './mock-systems.controller';
import { PipelinesService } from './pipelines.service';
import { PipelineExecutionService } from './pipeline-execution.service';
import { MappingsModule } from '../mappings/mappings.module';
import { LookupTablesModule } from '../lookup-tables/lookup-tables.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pipeline, PipelineStep, RoutingRule, SystemEntity, Mapping, FieldMapping, ConditionalRule]),
    MappingsModule,
    LookupTablesModule,
  ],
  controllers: [PipelinesController, MockSystemsController],
  providers: [PipelinesService, PipelineExecutionService],
  exports: [PipelinesService, PipelineExecutionService],
})
export class PipelinesModule {}
