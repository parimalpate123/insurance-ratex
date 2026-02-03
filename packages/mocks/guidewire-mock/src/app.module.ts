import { Module } from '@nestjs/common';
import { RatingModule } from './rating/rating.module';
import { PolicyModule } from './policy/policy.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule, RatingModule, PolicyModule],
})
export class AppModule {}
