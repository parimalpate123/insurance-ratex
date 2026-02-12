import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';
import { MappingsService } from './mappings.service';
import { MappingsController } from './mappings.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Mapping, FieldMapping])],
  controllers: [MappingsController],
  providers: [MappingsService],
  exports: [MappingsService],
})
export class MappingsModule {}
