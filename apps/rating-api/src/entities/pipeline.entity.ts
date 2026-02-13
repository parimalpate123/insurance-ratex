import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, OneToMany,
} from 'typeorm';
import { PipelineStep } from './pipeline-step.entity';
import { RoutingRule } from './routing-rule.entity';

@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'product_line_code', length: 50, nullable: true })
  productLineCode: string;

  @Column({ name: 'source_system_code', length: 100, nullable: true })
  sourceSystemCode: string;

  @Column({ name: 'target_system_code', length: 100, nullable: true })
  targetSystemCode: string;

  @Column({ length: 20, default: 'draft' })
  status: 'active' | 'draft' | 'archived';

  @Column({ length: 50, default: '1.0.0' })
  version: string;

  @OneToMany(() => PipelineStep, (step) => step.pipeline, { cascade: true, eager: true })
  steps: PipelineStep[];

  @OneToMany(() => RoutingRule, (rule) => rule.pipeline, { cascade: true, eager: true })
  routingRules: RoutingRule[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
