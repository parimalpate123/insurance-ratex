import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DecisionTable } from '../../entities/decision-table.entity';
import { DecisionTableRow } from '../../entities/decision-table-row.entity';
import { DecisionTablesController } from './decision-tables.controller';

@Module({
  imports: [TypeOrmModule.forFeature([DecisionTable, DecisionTableRow])],
  controllers: [DecisionTablesController],
})
export class DecisionTablesModule {}
