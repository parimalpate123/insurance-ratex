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

export type FileType = 'xlsx' | 'csv' | 'json';

@Entity('uploaded_files')
@Index(['mappingId'])
@Index(['uploadedAt'])
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({
    name: 'file_type',
    type: 'varchar',
    length: 20,
  })
  fileType: FileType;

  @Column({ name: 'file_size_bytes', type: 'integer', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'storage_path', length: 500, nullable: true })
  storagePath?: string;

  @Column({ name: 'uploaded_by', length: 100, nullable: true })
  uploadedBy?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Column({ name: 'mapping_id', type: 'uuid', nullable: true })
  mappingId?: string;

  @ManyToOne(() => Mapping, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'mapping_id' })
  mapping?: Mapping;

  @Column({ type: 'boolean', default: false })
  processed: boolean;

  @Column({ name: 'processing_errors', type: 'jsonb', nullable: true })
  processingErrors?: any;
}
