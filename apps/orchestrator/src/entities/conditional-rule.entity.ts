import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { RuleCondition } from './rule-condition.entity';
import { RuleAction } from './rule-action.entity';

@Entity('conditional_rules')
export class ConditionalRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'product_line', length: 100 })
  productLine: string;

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
  createdBy: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy: string;

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
