import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm';
import { Pipeline } from './pipeline.entity';

@Entity('pipeline_steps')
export class PipelineStep {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'pipeline_id' })
  pipelineId: string;

  @ManyToOne(() => Pipeline, (p) => p.steps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pipeline_id' })
  pipeline: Pipeline;

  @Column({ name: 'step_order' })
  stepOrder: number;

  @Column({ name: 'step_type', length: 30 })
  stepType: 'transform' | 'execute_rules' | 'call_system' | 'transform_response' | 'mock_response';

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
