import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RatingController } from './controllers/rating.controller';
import { HealthController } from './controllers/health.controller';
import { AIController } from './controllers/ai.controller';
import { OrchestrationService } from './services/orchestration.service';
import { AIService } from './services/ai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
  ],
  controllers: [RatingController, HealthController, AIController],
  providers: [OrchestrationService, AIService],
})
export class AppModule {}
