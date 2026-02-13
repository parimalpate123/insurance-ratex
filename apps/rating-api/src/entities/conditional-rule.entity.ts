import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { RuleCondition } from './rule-condition.entity';
import { RuleAction } from './rule-action.entity';

@Entity('conditional_rules')
@Index(['productLine'])
@Index(['productLineCode'])
@Index(['status'])
export class ConditionalRule {
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

  @Column({
    length: 20,
    default: 'draft',
  })
  status: 'active' | 'draft' | 'archived';

  @Column({ length: 50, default: '1.0.0' })
  version: string;

  @Column({ type: 'int', default: 0 })
  priority: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;

  @Column({ name: 'pipeline_id', type: 'uuid', nullable: true })
  pipelineId?: string;

  @Column({ name: 'exec_order', type: 'int', default: 0 })
  execOrder: number;

  @OneToMany(() => RuleCondition, (condition) => condition.rule, {
    cascade: true,
    eager: true,
  })
  conditions: RuleCondition[];

  @OneToMany(() => RuleAction, (action) => action.rule, {
    cascade: true,
    eager: true,
  })
  actions: RuleAction[];
}
