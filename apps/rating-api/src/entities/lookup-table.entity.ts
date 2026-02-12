import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { LookupEntry } from './lookup-entry.entity';

@Entity('lookup_tables')
@Index(['productLine'])
@Index(['productLineCode'])
@Index(['status'])
export class LookupTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'product_line', length: 100 })
  productLine: string;

  @Column({ name: 'product_line_code', length: 50, nullable: true })
  productLineCode?: string;

  @Column({ length: 20, default: 'draft' })
  status: 'active' | 'draft' | 'archived';

  @Column({ length: 50, default: '1.0.0' })
  version: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;

  @OneToMany(() => LookupEntry, (entry) => entry.lookupTable, { eager: false })
  entries?: LookupEntry[];
}
