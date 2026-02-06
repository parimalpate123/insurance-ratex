import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ConditionalRule } from './conditional-rule.entity';

@Entity('rule_actions')
export class RuleAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'rule_id', type: 'uuid' })
  ruleId: string;

  @ManyToOne(() => ConditionalRule, (rule) => rule.actions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rule_id' })
  rule: ConditionalRule;

  @Column({ name: 'action_type', length: 50 })
  actionType: string;

  @Column({ name: 'target_field', length: 500 })
  targetField: string;

  @Column({ type: 'jsonb' })
  value: any;

  @Column({ name: 'action_order', type: 'int', default: 0 })
  actionOrder: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
