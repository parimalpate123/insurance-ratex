import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LookupTable } from '../../entities/lookup-table.entity';
import { LookupEntry } from '../../entities/lookup-entry.entity';
import { LookupTablesController } from './lookup-tables.controller';
import { LookupTablesService } from './lookup-tables.service';

@Module({
  imports: [TypeOrmModule.forFeature([LookupTable, LookupEntry])],
  controllers: [LookupTablesController],
  providers: [LookupTablesService],
  exports: [LookupTablesService],
})
export class LookupTablesModule {}
