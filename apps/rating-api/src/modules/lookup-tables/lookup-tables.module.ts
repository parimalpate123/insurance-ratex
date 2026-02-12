import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupTable } from '../../entities/lookup-table.entity';
import { LookupEntry } from '../../entities/lookup-entry.entity';
import { LookupTablesController } from './lookup-tables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LookupTable, LookupEntry])],
  controllers: [LookupTablesController],
})
export class LookupTablesModule {}
