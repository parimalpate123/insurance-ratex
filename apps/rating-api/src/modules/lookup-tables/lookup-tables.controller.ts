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
  ConflictException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LookupTable } from '../../entities/lookup-table.entity';
import { LookupEntry } from '../../entities/lookup-entry.entity';

@ApiTags('Lookup Tables')
@Controller('api/v1/lookup-tables')
export class LookupTablesController {
  constructor(
    @InjectRepository(LookupTable)
    private readonly tableRepo: Repository<LookupTable>,
    @InjectRepository(LookupEntry)
    private readonly entryRepo: Repository<LookupEntry>,
  ) {}

  @Get()
  @ApiQuery({ name: 'productLineCode', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('productLineCode') productLineCode?: string,
    @Query('status') status?: string,
  ): Promise<LookupTable[]> {
    const where: any = {};
    if (productLineCode) where.productLineCode = productLineCode;
    if (status) where.status = status;
    return this.tableRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<LookupTable> {
    const table = await this.tableRepo.findOne({
      where: { id },
      relations: ['entries'],
    });
    if (!table) throw new NotFoundException(`Lookup table ${id} not found`);
    return table;
  }

  @Post()
  async create(@Body() body: Partial<LookupTable>): Promise<LookupTable> {
    const table = this.tableRepo.create(body);
    return this.tableRepo.save(table);
  }

  @Put(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<LookupTable>,
  ): Promise<LookupTable> {
    const existing = await this.tableRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Lookup table ${id} not found`);
    await this.tableRepo.update(id, body);
    return this.tableRepo.findOne({ where: { id } }) as Promise<LookupTable>;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const existing = await this.tableRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Lookup table ${id} not found`);
    await this.tableRepo.delete(id);
  }

  @Post(':id/activate')
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<LookupTable> {
    const existing = await this.tableRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Lookup table ${id} not found`);
    await this.tableRepo.update(id, { status: 'active' });
    return this.tableRepo.findOne({ where: { id } }) as Promise<LookupTable>;
  }

  // ── Entries ────────────────────────────────────────────────────────────

  @Get(':id/entries')
  async getEntries(@Param('id', ParseUUIDPipe) id: string): Promise<LookupEntry[]> {
    return this.entryRepo.find({
      where: { lookupTableId: id },
      order: { key: 'ASC' },
    });
  }

  @Post(':id/entries')
  async addEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<LookupEntry>,
  ): Promise<LookupEntry> {
    const table = await this.tableRepo.findOne({ where: { id } });
    if (!table) throw new NotFoundException(`Lookup table ${id} not found`);

    const existing = await this.entryRepo.findOne({
      where: { lookupTableId: id, key: body.key },
    });
    if (existing) throw new ConflictException(`Key '${body.key}' already exists in this table`);

    const entry = this.entryRepo.create({ ...body, lookupTableId: id });
    return this.entryRepo.save(entry);
  }

  @Put(':id/entries/:entryId')
  async updateEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
    @Body() body: Partial<LookupEntry>,
  ): Promise<LookupEntry> {
    const existing = await this.entryRepo.findOne({ where: { id: entryId, lookupTableId: id } });
    if (!existing) throw new NotFoundException(`Entry ${entryId} not found`);
    await this.entryRepo.update(entryId, body);
    return this.entryRepo.findOne({ where: { id: entryId } }) as Promise<LookupEntry>;
  }

  @Delete(':id/entries/:entryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeEntry(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('entryId', ParseUUIDPipe) entryId: string,
  ): Promise<void> {
    const existing = await this.entryRepo.findOne({ where: { id: entryId, lookupTableId: id } });
    if (!existing) throw new NotFoundException(`Entry ${entryId} not found`);
    await this.entryRepo.delete(entryId);
  }

  @Post(':id/entries/bulk')
  async importEntries(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { entries: Array<{ key: string; value: any; description?: string }> },
  ): Promise<{ imported: number }> {
    const table = await this.tableRepo.findOne({ where: { id } });
    if (!table) throw new NotFoundException(`Lookup table ${id} not found`);

    // Upsert entries (update if key exists, insert if not)
    let imported = 0;
    for (const e of body.entries) {
      const existing = await this.entryRepo.findOne({ where: { lookupTableId: id, key: e.key } });
      if (existing) {
        await this.entryRepo.update(existing.id, { value: e.value, description: e.description });
      } else {
        await this.entryRepo.save(this.entryRepo.create({ ...e, lookupTableId: id }));
      }
      imported++;
    }
    return { imported };
  }

  @Get(':id/lookup/:key')
  @ApiOperation({ summary: 'Look up a value by key' })
  async lookupKey(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('key') key: string,
  ): Promise<{ found: boolean; value?: any }> {
    const entry = await this.entryRepo.findOne({ where: { lookupTableId: id, key } });
    if (!entry) return { found: false };
    return { found: true, value: entry.value };
  }
}
