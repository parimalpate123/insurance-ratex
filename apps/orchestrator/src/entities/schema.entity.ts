import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type SchemaType = 'library' | 'custom' | 'detected';

export interface SchemaField {
  path: string;
  type: string;
  description?: string;
  required?: boolean;
  sample?: any;
}

export interface SchemaData {
  fields: SchemaField[];
  metadata?: Record<string, any>;
}

@Entity('schemas')
@Index(['systemName', 'version'], { unique: true })
@Index(['systemName'])
@Index(['schemaType'])
export class Schema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'system_name', length: 100 })
  systemName: string;

  @Column({ length: 50 })
  version: string;

  @Column({
    name: 'schema_type',
    type: 'varchar',
    length: 50,
  })
  schemaType: SchemaType;

  @Column({ name: 'schema_data', type: 'jsonb' })
  schemaData: SchemaData;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'created_by', length: 100, nullable: true })
  createdBy?: string;
}
