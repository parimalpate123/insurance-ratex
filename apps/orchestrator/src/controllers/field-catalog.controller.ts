import {
  Controller,
  Get,
  Post,
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
import {
  FieldCatalogService,
  CreateFieldCatalogDto,
} from '../services/field-catalog.service';

@ApiTags('Field Catalog')
@Controller('api/v1/field-catalog')
export class FieldCatalogController {
  private readonly logger = new Logger(FieldCatalogController.name);

  constructor(private readonly fieldCatalogService: FieldCatalogService) {}

  @Get()
  @ApiOperation({ summary: 'List all field catalog entries' })
  @ApiResponse({
    status: 200,
    description: 'Field catalog entries retrieved successfully',
  })
  async findAll(
    @Query('category') category?: string,
    @Query('dataType') dataType?: string,
    @Query('search') search?: string,
  ) {
    const fields = await this.fieldCatalogService.findAll({
      category,
      dataType,
      search,
    });

    return {
      success: true,
      data: fields,
      count: fields.length,
    };
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all field categories' })
  @ApiResponse({
    status: 200,
    description: 'Categories retrieved successfully',
  })
  async getCategories() {
    const categories = await this.fieldCatalogService.getCategories();

    return {
      success: true,
      data: categories,
    };
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get fields by category' })
  @ApiResponse({
    status: 200,
    description: 'Fields retrieved successfully',
  })
  async findByCategory(@Param('category') category: string) {
    const fields = await this.fieldCatalogService.findByCategory(category);

    return {
      success: true,
      data: fields,
      count: fields.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get field catalog entry by ID' })
  @ApiResponse({
    status: 200,
    description: 'Field catalog entry retrieved successfully',
  })
  async findById(@Param('id') id: string) {
    const field = await this.fieldCatalogService.findById(id);

    return {
      success: true,
      data: field,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new field catalog entry' })
  @ApiResponse({
    status: 201,
    description: 'Field catalog entry created successfully',
  })
  async create(@Body() dto: CreateFieldCatalogDto) {
    this.logger.log(`Creating field catalog entry: ${dto.fieldName}`);
    const field = await this.fieldCatalogService.create(dto);

    return {
      success: true,
      message: 'Field catalog entry created successfully',
      data: field,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update field catalog entry' })
  @ApiResponse({
    status: 200,
    description: 'Field catalog entry updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<CreateFieldCatalogDto>,
  ) {
    this.logger.log(`Updating field catalog entry: ${id}`);
    const field = await this.fieldCatalogService.update(id, updates);

    return {
      success: true,
      message: 'Field catalog entry updated successfully',
      data: field,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete field catalog entry' })
  @ApiResponse({
    status: 204,
    description: 'Field catalog entry deleted successfully',
  })
  async delete(@Param('id') id: string) {
    this.logger.log(`Deleting field catalog entry: ${id}`);
    await this.fieldCatalogService.delete(id);
  }
}
