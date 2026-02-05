import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { DataType } from './data-type.entity';

@Entity('field_catalog')
export class FieldCatalog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'field_name', length: 255, unique: true })
  fieldName: string;

  @Column({ name: 'display_name', length: 255 })
  displayName: string;

  @Column({ name: 'data_type', length: 50 })
  dataType: string;

  @Column({ length: 100, nullable: true })
  category?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'sample_value', type: 'text', nullable: true })
  sampleValue?: string;

  @Column({ name: 'is_required', default: false })
  isRequired: boolean;

  @Column({ name: 'is_system', default: true })
  isSystem: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => DataType)
  @JoinColumn({ name: 'data_type', referencedColumnName: 'typeName' })
  dataTypeRef?: DataType;
}
