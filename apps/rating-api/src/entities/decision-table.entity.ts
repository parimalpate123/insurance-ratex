import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { DecisionTableRow } from './decision-table-row.entity';

export interface DecisionTableColumn {
  name: string;
  field: string;
  type: 'string' | 'number' | 'boolean' | 'date';
  operator?: string;
  description?: string;
}

@Entity('decision_tables')
@Index(['productLine'])
@Index(['productLineCode'])
@Index(['status'])
export class DecisionTable {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
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

  @Column({ name: 'condition_columns', type: 'jsonb' })
  conditionColumns: DecisionTableColumn[];

  @Column({ name: 'action_columns', type: 'jsonb' })
  actionColumns: DecisionTableColumn[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;

  @OneToMany(() => DecisionTableRow, (row) => row.decisionTable, { eager: false })
  rows?: DecisionTableRow[];
}
