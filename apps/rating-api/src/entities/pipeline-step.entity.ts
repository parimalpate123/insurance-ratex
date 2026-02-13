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
  stepType:
    // Current clean names
    | 'validate'
    | 'map_request'
    | 'apply_rules'
    | 'call_system'
    | 'map_response'
    | 'apply_response_rules'
    | 'enrich'
    | 'mock_response'
    // Legacy aliases (backward compat)
    | 'transform'
    | 'execute_rules'
    | 'transform_response';

  @Column({ length: 255, nullable: true })
  name: string;

  @Column({ type: 'jsonb', default: {} })
  config: Record<string, any>;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
