import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Mapping } from './mapping.entity';

export type SuggestionType =
  | 'excel_parse'
  | 'jira_parse'
  | 'auto_detect'
  | 'manual_suggest'
  | 'nlp_rule';

export interface FieldSuggestion {
  sourcePath: string;
  targetPath: string;
  transformationType?: string;
  transformationConfig?: any;
  confidence: number;
  reasoning?: string;
}

export interface SuggestionData {
  suggestions: FieldSuggestion[];
  metadata?: Record<string, any>;
}

@Entity('ai_suggestions')
@Index(['mappingId'])
@Index(['suggestionType'])
@Index(['createdAt'])
export class AISuggestion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mapping_id', type: 'uuid', nullable: true })
  mappingId?: string;

  @ManyToOne(() => Mapping, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mapping_id' })
  mapping?: Mapping;

  @Column({
    name: 'suggestion_type',
    type: 'varchar',
    length: 50,
  })
  suggestionType: SuggestionType;

  @Column({ name: 'input_data', type: 'jsonb', nullable: true })
  inputData?: any;

  @Column({ type: 'jsonb' })
  suggestions: SuggestionData;

  @Column({ name: 'accepted_suggestions', type: 'jsonb', nullable: true })
  acceptedSuggestions?: any;

  @Column({ name: 'rejected_suggestions', type: 'jsonb', nullable: true })
  rejectedSuggestions?: any;

  @Column({ name: 'confidence_scores', type: 'jsonb', nullable: true })
  confidenceScores?: Record<string, number>;

  @Column({ name: 'ai_model', length: 100, nullable: true })
  aiModel?: string;

  @Column({ name: 'processing_time_ms', type: 'integer', nullable: true })
  processingTimeMs?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;
}
