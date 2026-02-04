import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { AIMappingService, MappingSuggestionRequest } from '../services/ai-mapping.service';
import { ExcelParserService } from '../services/excel-parser.service';
import { GenerateSuggestionsDto } from '../dto/generate-suggestions.dto';
import { ParseTextDto } from '../dto/parse-text.dto';

@ApiTags('AI Mappings')
@Controller('api/v1/ai/mappings')
export class AIMappingsController {
  private readonly logger = new Logger(AIMappingsController.name);

  constructor(
    private readonly aiMappingService: AIMappingService,
    private readonly excelParserService: ExcelParserService,
  ) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate AI-powered mapping suggestions between two schemas',
  })
  @ApiResponse({
    status: 200,
    description: 'Mapping suggestions generated successfully',
  })
  async generateSuggestions(@Body() dto: GenerateSuggestionsDto) {
    this.logger.log(
      `Generating AI suggestions: ${dto.sourceSchemaId} → ${dto.targetSchemaId}`,
    );

    const request: MappingSuggestionRequest = {
      sourceSchemaId: dto.sourceSchemaId,
      targetSchemaId: dto.targetSchemaId,
      productLine: dto.productLine,
      context: dto.context,
    };

    return await this.aiMappingService.generateMappingSuggestions(request);
  }

  @Post('parse-text')
  @ApiOperation({
    summary: 'Parse text requirements (JIRA story, plain text) using AI',
  })
  @ApiResponse({
    status: 200,
    description: 'Text parsed successfully',
  })
  async parseText(@Body() dto: ParseTextDto) {
    if (!dto.text || !dto.text.trim()) {
      throw new BadRequestException('Text is required');
    }

    this.logger.log(`Parsing text requirements (${dto.text.length} characters)`);

    try {
      const suggestions = await this.aiMappingService.parseTextRequirements(
        dto.text,
        dto.context,
      );

      // Calculate metrics
      const highConfidenceCount = suggestions.filter(
        (s) => s.confidence >= 80,
      ).length;
      const averageConfidence =
        suggestions.reduce((sum, s) => sum + s.confidence, 0) /
          suggestions.length || 0;

      return {
        success: true,
        source: 'text',
        suggestions,
        totalSuggestions: suggestions.length,
        highConfidenceCount,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error parsing text: ${error.message}`);
      throw new BadRequestException(`Failed to parse text: ${error.message}`);
    }
  }

  @Post('parse-excel')
  @ApiOperation({
    summary: 'Parse Excel/CSV file with mapping requirements',
  })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 200,
    description: 'Excel file parsed successfully',
  })
  @UseInterceptors(FileInterceptor('file'))
  async parseExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    this.logger.log(`Parsing uploaded file: ${file.originalname}`);

    // Validate file type
    const fileExt = file.originalname.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'csv', 'xls'].includes(fileExt || '')) {
      throw new BadRequestException(
        'Invalid file type. Only Excel (.xlsx, .xls) and CSV files are supported.',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 10MB limit');
    }

    try {
      let suggestions;

      if (fileExt === 'csv') {
        suggestions = await this.excelParserService.parseCsvFile(
          file.buffer,
          file.originalname,
        );
      } else {
        suggestions = await this.excelParserService.parseExcelFile(
          file.buffer,
          file.originalname,
        );
      }

      // Calculate metrics
      const highConfidenceCount = suggestions.filter(
        (s) => s.confidence >= 80,
      ).length;
      const averageConfidence =
        suggestions.reduce((sum, s) => sum + s.confidence, 0) /
          suggestions.length || 0;

      return {
        success: true,
        filename: file.originalname,
        suggestions,
        totalSuggestions: suggestions.length,
        highConfidenceCount,
        averageConfidence: Math.round(averageConfidence * 100) / 100,
      };
    } catch (error) {
      this.logger.error(`Error parsing Excel: ${error.message}`);
      throw new BadRequestException(`Failed to parse file: ${error.message}`);
    }
  }

  @Post('validate-excel')
  @ApiOperation({
    summary: 'Validate Excel file structure without parsing',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async validateExcel(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const validation =
      this.excelParserService.validateExcelStructure(file.buffer);

    return {
      filename: file.originalname,
      ...validation,
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get AI suggestion history' })
  @ApiResponse({
    status: 200,
    description: 'Suggestion history retrieved',
  })
  async getSuggestionHistory(
    @Query('mappingId') mappingId?: string,
    @Query('limit') limit?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 50;
    return await this.aiMappingService.getSuggestionHistory(
      mappingId,
      limitNum,
    );
  }

  @Post('similarity')
  @ApiOperation({
    summary: 'Calculate similarity score between two field paths',
  })
  async calculateSimilarity(
    @Body() body: { path1: string; path2: string },
  ) {
    const similarity = this.aiMappingService.calculateFieldSimilarity(
      body.path1,
      body.path2,
    );

    return {
      path1: body.path1,
      path2: body.path2,
      similarity,
      match:
        similarity >= 90
          ? 'high'
          : similarity >= 70
            ? 'medium'
            : similarity >= 50
              ? 'low'
              : 'none',
    };
  }
}
