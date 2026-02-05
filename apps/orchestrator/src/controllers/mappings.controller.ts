import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MappingService, CreateMappingDto, FieldMappingDto } from '../services/mapping.service';

@ApiTags('Mappings')
@Controller('api/v1/mappings')
export class MappingsController {
  private readonly logger = new Logger(MappingsController.name);

  constructor(private readonly mappingService: MappingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new mapping with field mappings' })
  @ApiResponse({
    status: 201,
    description: 'Mapping created successfully',
  })
  async createMapping(@Body() dto: CreateMappingDto) {
    this.logger.log(`Creating mapping: ${dto.name}`);
    const mapping = await this.mappingService.createMapping(dto);

    return {
      success: true,
      message: 'Mapping created successfully',
      data: mapping,
    };
  }

  @Get()
  @ApiOperation({ summary: 'List all mappings' })
  @ApiResponse({
    status: 200,
    description: 'Mappings retrieved successfully',
  })
  async listMappings(
    @Query('sourceSystem') sourceSystem?: string,
    @Query('targetSystem') targetSystem?: string,
    @Query('productLine') productLine?: string,
    @Query('status') status?: string,
  ) {
    const mappings = await this.mappingService.listMappings({
      sourceSystem,
      targetSystem,
      productLine,
      status,
    });

    return {
      success: true,
      data: mappings,
      count: mappings.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get mapping by ID with field mappings' })
  @ApiResponse({
    status: 200,
    description: 'Mapping retrieved successfully',
  })
  async getMapping(@Param('id') id: string) {
    const mapping = await this.mappingService.getMappingWithFields(id);

    return {
      success: true,
      data: mapping,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update mapping' })
  @ApiResponse({
    status: 200,
    description: 'Mapping updated successfully',
  })
  async updateMapping(
    @Param('id') id: string,
    @Body() updates: Partial<CreateMappingDto>,
  ) {
    this.logger.log(`Updating mapping: ${id}`);
    const mapping = await this.mappingService.updateMapping(id, updates);

    return {
      success: true,
      message: 'Mapping updated successfully',
      data: mapping,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete mapping' })
  @ApiResponse({
    status: 204,
    description: 'Mapping deleted successfully',
  })
  async deleteMapping(@Param('id') id: string) {
    this.logger.log(`Deleting mapping: ${id}`);
    await this.mappingService.deleteMapping(id);
  }

  @Post(':id/fields')
  @ApiOperation({ summary: 'Add field mapping to existing mapping' })
  @ApiResponse({
    status: 201,
    description: 'Field mapping added successfully',
  })
  async addFieldMapping(
    @Param('id') mappingId: string,
    @Body() fieldDto: FieldMappingDto,
  ) {
    this.logger.log(`Adding field mapping to mapping: ${mappingId}`);
    const fieldMapping = await this.mappingService.addFieldMapping(
      mappingId,
      fieldDto,
    );

    return {
      success: true,
      message: 'Field mapping added successfully',
      data: fieldMapping,
    };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test mapping transformation' })
  @ApiResponse({
    status: 200,
    description: 'Mapping tested successfully',
  })
  async testMapping(
    @Param('id') mappingId: string,
    @Body() body: { data: any },
  ) {
    this.logger.log(`Testing mapping: ${mappingId}`);
    const result = await this.mappingService.testMapping(mappingId, body.data);

    return {
      success: true,
      message: 'Mapping executed successfully',
      data: result,
    };
  }

  @Put('fields/:fieldId')
  @ApiOperation({ summary: 'Update field mapping' })
  @ApiResponse({
    status: 200,
    description: 'Field mapping updated successfully',
  })
  async updateFieldMapping(
    @Param('fieldId') fieldId: string,
    @Body() fieldDto: Partial<FieldMappingDto>,
  ) {
    this.logger.log(`Updating field mapping: ${fieldId}`);
    const fieldMapping = await this.mappingService.updateFieldMapping(
      fieldId,
      fieldDto,
    );

    return {
      success: true,
      message: 'Field mapping updated successfully',
      data: fieldMapping,
    };
  }

  @Delete('fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete field mapping' })
  @ApiResponse({
    status: 204,
    description: 'Field mapping deleted successfully',
  })
  async deleteFieldMapping(@Param('fieldId') fieldId: string) {
    this.logger.log(`Deleting field mapping: ${fieldId}`);
    await this.mappingService.deleteFieldMapping(fieldId);
  }
}
