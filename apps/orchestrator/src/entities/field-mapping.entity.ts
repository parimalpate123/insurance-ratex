import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

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
  defaultValue: string;

  @Column({ name: 'transformation_config', type: 'jsonb', nullable: true })
  transformationConfig: any;

  @Column({ name: 'validation_rules', type: 'jsonb', nullable: true })
  validationRules: any;

  @Column({ type: 'text', nullable: true })
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
