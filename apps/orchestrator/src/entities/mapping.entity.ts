import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';

export type MappingStatus = 'active' | 'draft' | 'archived';
export type CreationMethod = 'manual' | 'excel' | 'text' | 'ai' | 'jira' | 'ai_detect' | 'hybrid';

@Entity('mappings')
@Index(['sourceSystem', 'targetSystem'])
@Index(['productLine'])
@Index(['status'])
export class Mapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ name: 'source_system', length: 100 })
  sourceSystem: string;

  @Column({ name: 'target_system', length: 100 })
  targetSystem: string;

  @Column({ name: 'product_line', length: 100 })
  productLine: string;

  @Column({ length: 50, default: '1.0.0' })
  version: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'draft',
  })
  status: MappingStatus;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    name: 'creation_method',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  creationMethod?: CreationMethod;

  @Column({ name: 'source_reference', type: 'text', nullable: true })
  sourceReference?: string;

  @Column({
    name: 'ai_confidence_score',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  aiConfidenceScore?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;

  @Column({ name: 'updated_by', length: 100, nullable: true })
  updatedBy?: string;

  @Column({ name: 'session_id', length: 100, nullable: true })
  sessionId?: string;
}
