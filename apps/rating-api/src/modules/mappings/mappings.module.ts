import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';
import { MappingsService } from './mappings.service';
import { MappingsController } from './mappings.controller';
import { TransformationEngine } from './transformation.engine';
import { AiPromptsModule } from '../ai-prompts/ai-prompts.module';
import { LookupTablesModule } from '../lookup-tables/lookup-tables.module';

@Module({
  imports: [TypeOrmModule.forFeature([Mapping, FieldMapping]), AiPromptsModule, LookupTablesModule],
  controllers: [MappingsController],
  providers: [MappingsService, TransformationEngine],
  exports: [MappingsService, TransformationEngine],
})
export class MappingsModule {}
