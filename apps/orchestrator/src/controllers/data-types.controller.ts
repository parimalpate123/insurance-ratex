import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import {
  DataTypesService,
  CreateDataTypeDto,
} from '../services/data-types.service';

@ApiTags('Data Types')
@Controller('api/v1/data-types')
export class DataTypesController {
  private readonly logger = new Logger(DataTypesController.name);

  constructor(private readonly dataTypesService: DataTypesService) {}

  @Get()
  @ApiOperation({ summary: 'List all data types' })
  @ApiResponse({
    status: 200,
    description: 'Data types retrieved successfully',
  })
  async findAll() {
    const dataTypes = await this.dataTypesService.findAll();

    return {
      success: true,
      data: dataTypes,
      count: dataTypes.length,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get data type by ID' })
  @ApiResponse({
    status: 200,
    description: 'Data type retrieved successfully',
  })
  async findById(@Param('id') id: string) {
    const dataType = await this.dataTypesService.findById(id);

    return {
      success: true,
      data: dataType,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new data type' })
  @ApiResponse({
    status: 201,
    description: 'Data type created successfully',
  })
  async create(@Body() dto: CreateDataTypeDto) {
    this.logger.log(`Creating data type: ${dto.typeName}`);
    const dataType = await this.dataTypesService.create(dto);

    return {
      success: true,
      message: 'Data type created successfully',
      data: dataType,
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update data type' })
  @ApiResponse({
    status: 200,
    description: 'Data type updated successfully',
  })
  async update(
    @Param('id') id: string,
    @Body() updates: Partial<CreateDataTypeDto>,
  ) {
    this.logger.log(`Updating data type: ${id}`);
    const dataType = await this.dataTypesService.update(id, updates);

    return {
      success: true,
      message: 'Data type updated successfully',
      data: dataType,
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete data type' })
  @ApiResponse({
    status: 204,
    description: 'Data type deleted successfully',
  })
  async delete(@Param('id') id: string) {
    this.logger.log(`Deleting data type: ${id}`);
    await this.dataTypesService.delete(id);
  }
}
