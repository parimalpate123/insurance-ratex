import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DecisionTable } from './decision-table.entity';

@Entity('decision_table_rows')
export class DecisionTableRow {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'decision_table_id', type: 'uuid' })
  decisionTableId: string;

  @ManyToOne(() => DecisionTable, (table) => table.rows, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'decision_table_id' })
  decisionTable?: DecisionTable;

  @Column({ type: 'jsonb' })
  conditions: Record<string, any>;

  @Column({ type: 'jsonb' })
  actions: Record<string, any>;

  @Column({ name: 'row_order', type: 'int', default: 0 })
  rowOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
