import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { ProductLinesModule } from './modules/product-lines/product-lines.module';
import { MappingsModule } from './modules/mappings/mappings.module';
import { RulesModule } from './modules/rules/rules.module';
import { WorkflowModule } from './modules/workflows/workflow.module';
import { ExecutionModule } from './modules/execution/execution.module';
import { DecisionTablesModule } from './modules/decision-tables/decision-tables.module';
import { LookupTablesModule } from './modules/lookup-tables/lookup-tables.module';
import { KnowledgeBaseModule } from './modules/knowledge-base/knowledge-base.module';
import { AiPromptsModule } from './modules/ai-prompts/ai-prompts.module';
import { SystemsModule } from './modules/systems/systems.module';
import { PipelinesModule } from './modules/pipelines/pipelines.module';
import { HealthController } from './shared/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    ProductLinesModule,
    MappingsModule,
    RulesModule,
    WorkflowModule,
    ExecutionModule,
    DecisionTablesModule,
    LookupTablesModule,
    KnowledgeBaseModule,
    AiPromptsModule,
    SystemsModule,
    PipelinesModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
