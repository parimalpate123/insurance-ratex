import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { LookupTable } from './lookup-table.entity';

@Entity('lookup_entries')
@Unique(['lookupTableId', 'key'])
export class LookupEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'lookup_table_id', type: 'uuid' })
  lookupTableId: string;

  @ManyToOne(() => LookupTable, (table) => table.entries, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'lookup_table_id' })
  lookupTable?: LookupTable;

  @Column({ length: 255 })
  key: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
