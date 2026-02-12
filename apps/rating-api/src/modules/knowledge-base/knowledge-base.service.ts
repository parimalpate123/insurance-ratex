import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { UploadedFile } from '../../entities/uploaded-file.entity';
import { S3Service } from './s3.service';
import * as path from 'path';

@Injectable()
export class KnowledgeBaseService {
  private readonly logger = new Logger(KnowledgeBaseService.name);

  constructor(
    @InjectRepository(UploadedFile)
    private readonly fileRepo: Repository<UploadedFile>,
    private readonly s3Service: S3Service,
  ) {}

  async findAll(productLineCode?: string): Promise<UploadedFile[]> {
    const where: any = {};
    if (productLineCode) where.productLineCode = productLineCode;
    return this.fileRepo.find({ where, order: { uploadedAt: 'DESC' } });
  }

  async findById(id: string): Promise<UploadedFile> {
    const file = await this.fileRepo.findOne({ where: { id } });
    if (!file) throw new NotFoundException(`Document ${id} not found`);
    return file;
  }

  async upload(
    originalName: string,
    buffer: Buffer,
    mimeType: string,
    metadata: {
      productLineCode?: string;
      description?: string;
      tags?: string[];
      uploadedBy?: string;
    },
  ): Promise<UploadedFile> {
    const ext = path.extname(originalName).replace('.', '').toLowerCase();
    const fileType = this.resolveFileType(ext);
    const s3Key = `kb/${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // Upload to S3/MinIO
    const { bucket } = await this.s3Service.upload(s3Key, buffer, mimeType);

    // Extract text for keyword search (basic extraction)
    let extractedText: string | undefined;
    try {
      if (fileType === 'txt' || fileType === 'md') {
        extractedText = buffer.toString('utf-8');
      }
      // For PDF/DOCX, extraction requires additional libraries — deferred to AWS Textract
    } catch (err: any) {
      this.logger.warn(`Text extraction failed for ${originalName}: ${err.message}`);
    }

    const record = this.fileRepo.create({
      filename: originalName,
      fileType: fileType as any,
      fileSizeBytes: buffer.length,
      s3Key,
      s3Bucket: bucket,
      storagePath: `s3://${bucket}/${s3Key}`,
      productLineCode: metadata.productLineCode,
      description: metadata.description,
      tags: metadata.tags ?? [],
      uploadedBy: metadata.uploadedBy,
      aiStatus: extractedText ? 'ready' : 'pending',
      extractedText,
      processed: !!extractedText,
      processedAt: extractedText ? new Date() : undefined,
    });

    return this.fileRepo.save(record);
  }

  async update(
    id: string,
    dto: { description?: string; tags?: string[]; productLineCode?: string },
  ): Promise<UploadedFile> {
    await this.findById(id); // verify exists
    await this.fileRepo.update(id, dto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    const file = await this.findById(id);
    // Delete from S3 if exists
    if (file.s3Key) {
      try {
        await this.s3Service.delete(file.s3Key);
      } catch (err: any) {
        this.logger.warn(`Failed to delete S3 object ${file.s3Key}: ${err.message}`);
      }
    }
    await this.fileRepo.delete(id);
  }

  async getDownloadUrl(id: string): Promise<{ url: string; expiresAt: string }> {
    const file = await this.findById(id);
    if (!file.s3Key) throw new NotFoundException(`No S3 key for document ${id}`);

    const url = await this.s3Service.getSignedDownloadUrl(file.s3Key);
    const expiresAt = new Date(Date.now() + 3600 * 1000).toISOString();
    return { url, expiresAt };
  }

  async reprocess(id: string): Promise<UploadedFile> {
    const file = await this.findById(id);
    await this.fileRepo.update(id, { aiStatus: 'pending', processingError: undefined });
    // Actual processing (Textract, chunking, embeddings) will run on AWS
    // For local dev: just mark as pending and log
    this.logger.log(`Reprocess requested for ${file.filename} (${id})`);
    return this.findById(id);
  }

  async search(query: string, productLineCode?: string): Promise<{
    results: Array<{ documentId: string; filename: string; relevance: number; excerpt: string }>;
    query: string;
    totalFound: number;
  }> {
    // Basic keyword search using PostgreSQL full-text search on extracted_text
    const qb = this.fileRepo.createQueryBuilder('f');

    if (productLineCode) {
      qb.andWhere('f.product_line_code = :productLineCode', { productLineCode });
    }

    qb.andWhere("to_tsvector('english', COALESCE(f.extracted_text, '')) @@ plainto_tsquery('english', :query)", { query });
    qb.andWhere("f.extracted_text IS NOT NULL");
    qb.orderBy("ts_rank(to_tsvector('english', COALESCE(f.extracted_text, '')), plainto_tsquery('english', :query))", 'DESC');
    qb.setParameter('query', query);

    const files = await qb.getMany();

    const results = files.map((f) => {
      const text = f.extractedText ?? '';
      const idx = text.toLowerCase().indexOf(query.toLowerCase());
      const start = Math.max(0, idx - 100);
      const end = Math.min(text.length, idx + 200);
      const excerpt = idx >= 0 ? `...${text.slice(start, end)}...` : text.slice(0, 200);

      return {
        documentId: f.id,
        filename: f.filename,
        relevance: 1.0,
        excerpt,
      };
    });

    return { results, query, totalFound: results.length };
  }

  private resolveFileType(ext: string): string {
    const map: Record<string, string> = {
      pdf: 'pdf', docx: 'docx', doc: 'doc',
      xlsx: 'xlsx', csv: 'csv', json: 'json',
      txt: 'txt', md: 'md',
    };
    return map[ext] ?? 'txt';
  }
}
