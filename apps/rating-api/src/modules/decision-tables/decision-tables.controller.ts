import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DecisionTable } from '../../entities/decision-table.entity';
import { DecisionTableRow } from '../../entities/decision-table-row.entity';

@ApiTags('Decision Tables')
@Controller('api/v1/decision-tables')
export class DecisionTablesController {
  constructor(
    @InjectRepository(DecisionTable)
    private readonly tableRepo: Repository<DecisionTable>,
    @InjectRepository(DecisionTableRow)
    private readonly rowRepo: Repository<DecisionTableRow>,
  ) {}

  @Get()
  @ApiQuery({ name: 'productLineCode', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('productLineCode') productLineCode?: string,
    @Query('status') status?: string,
  ): Promise<DecisionTable[]> {
    const where: any = {};
    if (productLineCode) where.productLineCode = productLineCode;
    if (status) where.status = status;
    return this.tableRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<DecisionTable> {
    const table = await this.tableRepo.findOne({
      where: { id },
      relations: ['rows'],
    });
    if (!table) throw new NotFoundException(`Decision table ${id} not found`);
    return table;
  }

  @Post()
  async create(@Body() body: Partial<DecisionTable>): Promise<DecisionTable> {
    const table = this.tableRepo.create(body);
    return this.tableRepo.save(table);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<DecisionTable>,
  ): Promise<DecisionTable> {
    const existing = await this.tableRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Decision table ${id} not found`);
    await this.tableRepo.update(id, body);
    return this.tableRepo.findOne({ where: { id }, relations: ['rows'] }) as Promise<DecisionTable>;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const existing = await this.tableRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Decision table ${id} not found`);
    await this.tableRepo.delete(id);
  }

  @Post(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<DecisionTable> {
    const existing = await this.tableRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Decision table ${id} not found`);
    await this.tableRepo.update(id, { status: 'active' });
    return this.tableRepo.findOne({ where: { id } }) as Promise<DecisionTable>;
  }

  // ── Rows ──────────────────────────────────────────────────────────────

  @Get(':id/rows')
  async getRows(@Param('id', ParseUUIDPipe) id: string): Promise<DecisionTableRow[]> {
    return this.rowRepo.find({
      where: { decisionTableId: id },
      order: { rowOrder: 'ASC' },
    });
  }

  @Post(':id/rows')
  async addRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<DecisionTableRow>,
  ): Promise<DecisionTableRow> {
    const table = await this.tableRepo.findOne({ where: { id } });
    if (!table) throw new NotFoundException(`Decision table ${id} not found`);
    const row = this.rowRepo.create({ ...body, decisionTableId: id });
    return this.rowRepo.save(row);
  }

  @Put(':id/rows/:rowId')
  async updateRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('rowId', ParseUUIDPipe) rowId: string,
    @Body() body: Partial<DecisionTableRow>,
  ): Promise<DecisionTableRow> {
    const existing = await this.rowRepo.findOne({ where: { id: rowId, decisionTableId: id } });
    if (!existing) throw new NotFoundException(`Row ${rowId} not found`);
    await this.rowRepo.update(rowId, body);
    return this.rowRepo.findOne({ where: { id: rowId } }) as Promise<DecisionTableRow>;
  }

  @Delete(':id/rows/:rowId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeRow(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('rowId', ParseUUIDPipe) rowId: string,
  ): Promise<void> {
    const existing = await this.rowRepo.findOne({ where: { id: rowId, decisionTableId: id } });
    if (!existing) throw new NotFoundException(`Row ${rowId} not found`);
    await this.rowRepo.delete(rowId);
  }

  @Post(':id/rows/bulk')
  async importRows(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { rows: Array<{ conditions: any; actions: any; rowOrder?: number }> },
  ): Promise<{ imported: number }> {
    const table = await this.tableRepo.findOne({ where: { id } });
    if (!table) throw new NotFoundException(`Decision table ${id} not found`);

    const entities = body.rows.map((r, idx) =>
      this.rowRepo.create({ ...r, decisionTableId: id, rowOrder: r.rowOrder ?? idx }),
    );
    await this.rowRepo.save(entities);
    return { imported: entities.length };
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate decision table against input data' })
  async evaluate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { data: any },
  ): Promise<{ matched: boolean; matchedRow?: DecisionTableRow; actions: Record<string, any> }> {
    const rows = await this.rowRepo.find({
      where: { decisionTableId: id },
      order: { rowOrder: 'ASC' },
    });

    for (const row of rows) {
      if (this.matchesConditions(row.conditions, body.data)) {
        return { matched: true, matchedRow: row, actions: row.actions };
      }
    }

    return { matched: false, actions: {} };
  }

  private matchesConditions(conditions: Record<string, any>, data: any): boolean {
    for (const [field, condition] of Object.entries(conditions)) {
      const value = this.getNestedValue(data, field);
      if (!this.evaluateCondition(value, condition)) return false;
    }
    return true;
  }

  private evaluateCondition(actual: any, condition: any): boolean {
    if (typeof condition === 'object' && condition !== null && 'operator' in condition) {
      switch (condition.operator) {
        case '==': return actual == condition.value;
        case '!=': return actual != condition.value;
        case '>': return Number(actual) > Number(condition.value);
        case '>=': return Number(actual) >= Number(condition.value);
        case '<': return Number(actual) < Number(condition.value);
        case '<=': return Number(actual) <= Number(condition.value);
        case 'in': return Array.isArray(condition.value) && condition.value.includes(actual);
        case 'between': return Number(actual) >= Number(condition.min) && Number(actual) <= Number(condition.max);
        default: return actual == condition.value;
      }
    }
    // Simple equality
    return actual == condition;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }
}
