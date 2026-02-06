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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ProductLinesService } from './product-lines.service';
import {
  CreateProductLineConfigDto,
  UpdateProductLineConfigDto,
  ProductLineConfigEntity,
} from '@rating-poc/shared-types';

@ApiTags('Product Lines')
@Controller('api/v1/product-lines')
export class ProductLinesController {
  constructor(private readonly productLinesService: ProductLinesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all product line configurations' })
  @ApiQuery({ name: 'includeTemplates', required: false, type: Boolean })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Returns all product line configurations',
  })
  async findAll(
    @Query('includeTemplates') includeTemplates?: string,
    @Query('status') status?: string,
  ): Promise<ProductLineConfigEntity[]> {
    const includeTemplatesBool = includeTemplates === 'true';
    return this.productLinesService.findAll(includeTemplatesBool, status);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Get all template configurations' })
  @ApiResponse({
    status: 200,
    description: 'Returns all template configurations',
  })
  async findTemplates(): Promise<ProductLineConfigEntity[]> {
    return this.productLinesService.findTemplates();
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get product line configuration by code' })
  @ApiResponse({
    status: 200,
    description: 'Returns product line configuration',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async findByCode(@Param('code') code: string): Promise<ProductLineConfigEntity> {
    return this.productLinesService.findByCode(code);
  }

  @Post()
  @ApiOperation({ summary: 'Create new product line configuration' })
  @ApiResponse({
    status: 201,
    description: 'Product line configuration created successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid configuration data' })
  async create(
    @Body() createDto: CreateProductLineConfigDto,
  ): Promise<ProductLineConfigEntity> {
    return this.productLinesService.create(createDto);
  }

  @Put(':code')
  @ApiOperation({ summary: 'Update product line configuration' })
  @ApiResponse({
    status: 200,
    description: 'Product line configuration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  @ApiResponse({ status: 400, description: 'Invalid configuration data' })
  async update(
    @Param('code') code: string,
    @Body() updateDto: UpdateProductLineConfigDto,
  ): Promise<ProductLineConfigEntity> {
    return this.productLinesService.update(code, updateDto);
  }

  @Delete(':code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete (archive) product line configuration' })
  @ApiResponse({
    status: 204,
    description: 'Product line configuration deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Configuration not found' })
  async delete(@Param('code') code: string): Promise<void> {
    return this.productLinesService.delete(code);
  }

  @Post('cache/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear configuration cache' })
  @ApiResponse({ status: 204, description: 'Cache cleared successfully' })
  async clearCache(): Promise<void> {
    this.productLinesService.clearCache();
  }
}
