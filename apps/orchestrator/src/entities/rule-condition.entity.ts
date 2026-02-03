import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConditionalRule } from './conditional-rule.entity';

@Entity('rule_conditions')
export class RuleCondition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_id', type: 'uuid' })
  ruleId: string;

  @ManyToOne(() => ConditionalRule, (rule) => rule.conditions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rule_id' })
  rule: ConditionalRule;

  @Column({ name: 'field_path', length: 500 })
  fieldPath: string;

  @Column({ length: 50 })
  operator: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ name: 'condition_order', type: 'int', default: 0 })
  conditionOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
