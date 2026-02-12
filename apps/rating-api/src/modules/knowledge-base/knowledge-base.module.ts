import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { UploadedFile } from '../../entities/uploaded-file.entity';
import { KnowledgeBaseService } from './knowledge-base.service';
import { KnowledgeBaseController } from './knowledge-base.controller';
import { S3Service } from './s3.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UploadedFile]),
    MulterModule.register({
      storage: require('multer').memoryStorage(), // Store in memory, upload directly to S3
      limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
    }),
  ],
  controllers: [KnowledgeBaseController],
  providers: [KnowledgeBaseService, S3Service],
  exports: [KnowledgeBaseService],
})
export class KnowledgeBaseModule {}
