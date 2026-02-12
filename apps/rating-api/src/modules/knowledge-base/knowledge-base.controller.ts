import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ParseUUIDPipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { KnowledgeBaseService } from './knowledge-base.service';
import { UploadedFile as UploadedFileEntity } from '../../entities/uploaded-file.entity';

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'text/markdown',
  'application/json',
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

@ApiTags('Knowledge Base')
@Controller('api/v1/knowledge-base')
export class KnowledgeBaseController {
  constructor(private readonly kbService: KnowledgeBaseService) {}

  @Get()
  @ApiQuery({ name: 'productLineCode', required: false })
  async findAll(@Query('productLineCode') productLineCode?: string): Promise<UploadedFileEntity[]> {
    return this.kbService.findAll(productLineCode);
  }

  @Get('search')
  @ApiOperation({ summary: 'Full-text search across KB documents' })
  @ApiQuery({ name: 'query', required: true })
  @ApiQuery({ name: 'productLineCode', required: false })
  async search(
    @Query('query') query: string,
    @Query('productLineCode') productLineCode?: string,
  ) {
    if (!query?.trim()) throw new BadRequestException('Query is required');
    return this.kbService.search(query, productLineCode);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<UploadedFileEntity> {
    return this.kbService.findById(id);
  }

  @Get(':id/download-url')
  @ApiOperation({ summary: 'Get a pre-signed download URL (1 hour expiry)' })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ url: string; expiresAt: string }> {
    return this.kbService.getDownloadUrl(id);
  }

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a document to the Knowledge Base' })
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: {
      productLineCode?: string;
      description?: string;
      tags?: string;
    },
  ): Promise<UploadedFileEntity> {
    if (!file) throw new BadRequestException('File is required');
    if (file.size > MAX_FILE_SIZE) {
      throw new BadRequestException(`File exceeds maximum size of 50MB`);
    }

    const tags = body.tags ? JSON.parse(body.tags) : [];

    return this.kbService.upload(
      file.originalname,
      file.buffer,
      file.mimetype,
      {
        productLineCode: body.productLineCode,
        description: body.description,
        tags,
      },
    );
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update KB document metadata' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { description?: string; tags?: string[]; productLineCode?: string },
  ): Promise<UploadedFileEntity> {
    return this.kbService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.kbService.delete(id);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Trigger reprocessing of a document (text extraction, future: vectorization)' })
  async reprocess(@Param('id', ParseUUIDPipe) id: string): Promise<UploadedFileEntity> {
    return this.kbService.reprocess(id);
  }

  @Post('ask')
  @ApiOperation({ summary: 'Ask AI a question using KB documents as context (requires AWS Bedrock)' })
  async askAI(
    @Body() body: { question: string; productLineCode?: string },
  ): Promise<{ answer: string; sources: any[] }> {
    // For now, return search results as context. Full RAG requires AWS Bedrock + vectors.
    const searchResults = await this.kbService.search(body.question, body.productLineCode);
    return {
      answer: searchResults.totalFound > 0
        ? `Found ${searchResults.totalFound} relevant documents. Full AI answers require AWS Bedrock deployment with vector embeddings.`
        : 'No relevant documents found in the knowledge base.',
      sources: searchResults.results,
    };
  }
}
