import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LookupTable } from '../../entities/lookup-table.entity';
import { LookupEntry } from '../../entities/lookup-entry.entity';

@Injectable()
export class LookupTablesService {
  constructor(
    @InjectRepository(LookupTable)
    private readonly tableRepo: Repository<LookupTable>,
    @InjectRepository(LookupEntry)
    private readonly entryRepo: Repository<LookupEntry>,
  ) {}

  /**
   * Look up a value by table name and entry key.
   * The tableKey in transformationConfig matches LookupTable.name.
   * Returns the entry value as string, or null if not found.
   */
  async lookup(tableName: string, key: string): Promise<string | null> {
    const table = await this.tableRepo.findOne({ where: { name: tableName } });
    if (!table) return null;
    const entry = await this.entryRepo.findOne({
      where: { lookupTableId: table.id, key },
    });
    if (!entry) return null;
    // value is JSONB — return as string
    const v = entry.value;
    return v != null ? (typeof v === 'object' ? JSON.stringify(v) : String(v)) : null;
  }
}
