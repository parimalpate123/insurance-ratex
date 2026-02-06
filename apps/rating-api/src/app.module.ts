import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';
import { ProductLinesModule } from './modules/product-lines/product-lines.module';
import { MappingsModule } from './modules/mappings/mappings.module';
import { RulesModule } from './modules/rules/rules.module';
import { WorkflowModule } from './modules/workflows/workflow.module';
import { ExecutionModule } from './modules/execution/execution.module';
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
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}
