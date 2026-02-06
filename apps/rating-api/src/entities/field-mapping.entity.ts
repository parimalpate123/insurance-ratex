import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Mapping } from './mapping.entity';

@Entity('field_mappings')
export class FieldMapping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'mapping_id', type: 'uuid' })
  mappingId: string;

  @Column({ name: 'source_path', length: 500 })
  sourcePath: string;

  @Column({ name: 'target_path', length: 500 })
  targetPath: string;

  @Column({ name: 'transformation_type', length: 50, default: 'direct' })
  transformationType: string;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'default_value', type: 'text', nullable: true })
  defaultValue?: string;

  @Column({ name: 'transformation_config', type: 'jsonb', nullable: true })
  transformationConfig?: any;

  @Column({ name: 'validation_rules', type: 'jsonb', nullable: true })
  validationRules?: any;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'product_line_code', length: 50, nullable: true })
  productLineCode?: string;

  // Metadata fields
  @Column({ name: 'data_type', length: 50, nullable: true })
  dataType?: string;

  @Column({ name: 'field_direction', length: 20, default: 'both' })
  fieldDirection: string;

  @Column({ name: 'field_identifier', length: 255, nullable: true })
  fieldIdentifier?: string;

  @Column({ name: 'skip_mapping', default: false })
  skipMapping: boolean;

  @Column({ name: 'skip_behavior', length: 20, default: 'exclude' })
  skipBehavior: string;

  @Column({ name: 'catalog_field_id', type: 'uuid', nullable: true })
  catalogFieldId?: string;

  @Column({ name: 'sample_input', type: 'text', nullable: true })
  sampleInput?: string;

  @Column({ name: 'sample_output', type: 'text', nullable: true })
  sampleOutput?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Mapping, mapping => mapping.fieldMappings)
  @JoinColumn({ name: 'mapping_id' })
  mapping?: Mapping;
}
