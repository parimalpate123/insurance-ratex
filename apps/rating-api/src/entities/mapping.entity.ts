import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { FieldMapping } from './field-mapping.entity';

export type MappingStatus = 'active' | 'draft' | 'archived';
export type CreationMethod = 'manual' | 'excel' | 'text' | 'ai' | 'jira' | 'ai_detect' | 'hybrid';

@Entity('mappings')
@Index(['sourceSystem', 'targetSystem'])
@Index(['productLine'])
@Index(['productLineCode'])
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

  @Column({ name: 'product_line_code', length: 50, nullable: true })
  productLineCode?: string;

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

  @Column({ name: 'mapping_number', length: 50, unique: true, nullable: true })
  mappingNumber?: string;

  @Column({ name: 'source_content', type: 'text', nullable: true })
  sourceContent?: string;

  @OneToMany(() => FieldMapping, fieldMapping => fieldMapping.mapping, { eager: true })
  fieldMappings?: FieldMapping[];
}
