import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export type FileType = 'xlsx' | 'csv' | 'json' | 'pdf' | 'docx' | 'doc' | 'txt' | 'md';
export type AiStatus = 'pending' | 'processing' | 'ready' | 'error';

@Entity('uploaded_files')
@Index(['productLineCode'])
@Index(['aiStatus'])
export class UploadedFile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  filename: string;

  @Column({ name: 'file_type', length: 20, nullable: true })
  fileType?: FileType;

  @Column({ name: 'file_size_bytes', type: 'int', nullable: true })
  fileSizeBytes?: number;

  @Column({ name: 'storage_path', length: 500, nullable: true })
  storagePath?: string;

  @Column({ name: 'uploaded_by', length: 100, nullable: true })
  uploadedBy?: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Column({ name: 'mapping_id', type: 'uuid', nullable: true })
  mappingId?: string;

  @Column({ default: false })
  processed: boolean;

  @Column({ name: 'processing_errors', type: 'jsonb', nullable: true })
  processingErrors?: any;

  // KB-specific columns (from migration 006)
  @Column({ name: 'product_line_code', length: 50, nullable: true })
  productLineCode?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', nullable: true, default: '[]' })
  tags?: string[];

  @Column({ name: 's3_key', length: 500, nullable: true })
  s3Key?: string;

  @Column({ name: 's3_bucket', length: 255, nullable: true })
  s3Bucket?: string;

  @Column({ name: 'ai_status', length: 20, nullable: true, default: 'pending' })
  aiStatus?: AiStatus;

  @Column({ name: 'processing_error', type: 'text', nullable: true })
  processingError?: string;

  @Column({ name: 'processed_at', type: 'timestamp', nullable: true })
  processedAt?: Date;

  @Column({ name: 'chunk_count', type: 'int', default: 0, nullable: true })
  chunkCount?: number;

  @Column({ name: 'extracted_text', type: 'text', nullable: true })
  extractedText?: string;
}
