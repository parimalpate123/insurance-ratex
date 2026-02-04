import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from '@nestjs/swagger';
import { SchemaLibraryService } from '../services/schema-library.service';
import { SchemaType, SchemaData } from '../entities/schema.entity';

class CreateSchemaDto {
  systemName: string;
  version: string;
  schemaType: SchemaType;
  schemaData: SchemaData;
  description?: string;
}

class CompareSchemasDto {
  schema1Id: string;
  schema2Id: string;
}

@ApiTags('Schemas')
@Controller('api/v1/schemas')
export class SchemasController {
  private readonly logger = new Logger(SchemasController.name);

  constructor(
    private readonly schemaLibraryService: SchemaLibraryService,
  ) {}

  @Get('library')
  @ApiOperation({ summary: 'List all available schemas in library' })
  @ApiResponse({
    status: 200,
    description: 'List of schemas',
  })
  async listSchemas(@Query('systemName') systemName?: string) {
    return await this.schemaLibraryService.listSchemas(systemName);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schema by ID' })
  @ApiResponse({
    status: 200,
    description: 'Schema details',
  })
  @ApiResponse({
    status: 404,
    description: 'Schema not found',
  })
  async getSchemaById(@Param('id') id: string) {
    return await this.schemaLibraryService.getSchemaById(id);
  }

  @Get('system/:systemName/latest')
  @ApiOperation({ summary: 'Get latest version of a schema' })
  async getLatestSchema(@Param('systemName') systemName: string) {
    return await this.schemaLibraryService.getLatestSchema(systemName);
  }

  @Get('system/:systemName/version/:version')
  @ApiOperation({ summary: 'Get specific version of a schema' })
  async getSchema(
    @Param('systemName') systemName: string,
    @Param('version') version: string,
  ) {
    return await this.schemaLibraryService.getSchema(systemName, version);
  }

  @Post()
  @ApiOperation({ summary: 'Create or update a schema' })
  @ApiResponse({
    status: 201,
    description: 'Schema created/updated successfully',
  })
  async createSchema(@Body() dto: CreateSchemaDto) {
    return await this.schemaLibraryService.saveSchema(
      dto.systemName,
      dto.version,
      dto.schemaType,
      dto.schemaData,
      dto.description,
    );
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload custom schema from JSON file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadSchema(
    @UploadedFile() file: Express.Multer.File,
    @Body('systemName') systemName: string,
    @Body('version') version: string,
    @Body('description') description?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!systemName || !version) {
      throw new BadRequestException('systemName and version are required');
    }

    this.logger.log(`Uploading schema: ${systemName} v${version}`);

    try {
      const schemaJson = JSON.parse(file.buffer.toString('utf-8'));
      return await this.schemaLibraryService.uploadCustomSchema(
        systemName,
        version,
        schemaJson,
        description,
      );
    } catch (error) {
      throw new BadRequestException(`Invalid JSON file: ${error.message}`);
    }
  }

  @Post('compare')
  @ApiOperation({ summary: 'Compare two schemas' })
  async compareSchemas(@Body() dto: CompareSchemasDto) {
    return await this.schemaLibraryService.compareSchemas(
      dto.schema1Id,
      dto.schema2Id,
    );
  }

  @Get('search/fields')
  @ApiOperation({ summary: 'Search for fields across schemas' })
  async searchFields(
    @Query('q') searchTerm: string,
    @Query('systemName') systemName?: string,
  ) {
    if (!searchTerm) {
      throw new BadRequestException('Search term is required');
    }

    return await this.schemaLibraryService.searchFields(searchTerm, systemName);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a schema' })
  @ApiResponse({
    status: 200,
    description: 'Schema deleted successfully',
  })
  async deleteSchema(@Param('id') id: string) {
    await this.schemaLibraryService.deleteSchema(id);
    return { message: 'Schema deleted successfully' };
  }
}
