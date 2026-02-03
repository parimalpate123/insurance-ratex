import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingEngineService } from './rating-engine.service';

@Module({
  controllers: [RatingController],
  providers: [RatingEngineService],
})
export class RatingModule {}
