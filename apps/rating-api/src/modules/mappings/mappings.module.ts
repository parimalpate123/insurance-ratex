import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';
import { MappingsService } from './mappings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Mapping, FieldMapping])],
  providers: [MappingsService],
  exports: [MappingsService],
})
export class MappingsModule {}
