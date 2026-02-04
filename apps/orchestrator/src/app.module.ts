import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingController } from './controllers/rating.controller';
import { HealthController } from './controllers/health.controller';
import { AIController } from './controllers/ai.controller';
import { OrchestrationService } from './services/orchestration.service';
import { AIService } from './services/ai.service';
import { RulesModule } from './modules/rules/rules.module';
import { AIFeaturesModule } from './modules/ai-features.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'insurratex'),
        password: configService.get('DB_PASSWORD', 'dev_password_change_in_prod'),
        database: configService.get('DB_DATABASE', 'insurratex'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false, // Use migrations instead
        logging: configService.get('NODE_ENV') === 'development',
      }),
      inject: [ConfigService],
    }),
    RulesModule,
    AIFeaturesModule,
  ],
  controllers: [RatingController, HealthController, AIController],
  providers: [OrchestrationService, AIService],
})
export class AppModule {}
