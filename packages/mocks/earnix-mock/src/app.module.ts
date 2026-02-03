import { Module } from '@nestjs/common';
import { RatingModule } from './rating/rating.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule, RatingModule],
})
export class AppModule {}
