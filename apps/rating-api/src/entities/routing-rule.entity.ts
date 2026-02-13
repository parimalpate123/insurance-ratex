import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';

@Entity('routing_rules')
export class RoutingRule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (p) => p.routingRules, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Column({ name: 'product_line', length: 100, nullable: true })
  productLine: string;

  @Column({ name: 'source_system', length: 100, nullable: true })
  sourceSystem: string;

  @Column({ name: 'transaction_type', length: 100, nullable: true })
  transactionType: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
