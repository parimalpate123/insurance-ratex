import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('ai_prompts')
export class AiPrompt {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  key: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text' })
  template: string;

  @Column({ type: 'jsonb', default: [] })
  variables: string[];

  // Phase 2 RAG fields
  @Column({ name: 'kb_query_template', length: 500, nullable: true })
  kbQueryTemplate: string;

  @Column({ name: 'kb_top_k', type: 'smallint', default: 3 })
  kbTopK: number;

  @Column({ default: 1 })
  version: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
