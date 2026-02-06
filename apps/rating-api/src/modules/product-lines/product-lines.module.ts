import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductLineConfig } from '../../entities/product-line-config.entity';
import { ProductLinesController } from './product-lines.controller';
import { ProductLinesService } from './product-lines.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductLineConfig])],
  controllers: [ProductLinesController],
  providers: [ProductLinesService],
  exports: [ProductLinesService],
})
export class ProductLinesModule {}
