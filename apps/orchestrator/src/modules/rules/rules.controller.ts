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
import { RulesService, CreateRuleDto } from './rules.service';

@ApiTags('Rules')
@Controller('api/v1/rules')
export class RulesController {
  constructor(private readonly rulesService: RulesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all rules' })
  @ApiQuery({ name: 'type', required: false, enum: ['conditional', 'lookup', 'decision'] })
  @ApiResponse({ status: 200, description: 'Rules retrieved successfully' })
  async findAll(@Query('type') type?: string) {
    const rules = await this.rulesService.findAll(type);

    // Transform to match frontend format
    return rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      type: 'conditional', // For now, all are conditional
      productLine: rule.productLine,
      status: rule.status,
      description: rule.description,
      version: rule.version,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      data: {
        conditions: rule.conditions.map((c) => ({
          field: c.fieldPath,
          operator: c.operator,
          value: c.value,
        })),
        actions: rule.actions.map((a) => ({
          type: a.actionType,
          field: a.targetField,
          value: a.value,
        })),
      },
    }));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get rule by ID' })
  @ApiResponse({ status: 200, description: 'Rule retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async findOne(@Param('id') id: string) {
    const rule = await this.rulesService.findOne(id);

    return {
      id: rule.id,
      name: rule.name,
      type: 'conditional',
      productLine: rule.productLine,
      status: rule.status,
      description: rule.description,
      version: rule.version,
      createdAt: rule.createdAt,
      updatedAt: rule.updatedAt,
      data: {
        conditions: rule.conditions.map((c) => ({
          field: c.fieldPath,
          operator: c.operator,
          value: c.value,
        })),
        actions: rule.actions.map((a) => ({
          type: a.actionType,
          field: a.targetField,
          value: a.value,
        })),
      },
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create new rule' })
  @ApiResponse({ status: 201, description: 'Rule created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async create(@Body() dto: CreateRuleDto) {
    const rule = await this.rulesService.create(dto);

    return {
      success: true,
      message: 'Rule created successfully',
      rule: {
        id: rule.id,
        name: rule.name,
        type: 'conditional',
        productLine: rule.productLine,
        status: rule.status,
      },
    };
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update rule' })
  @ApiResponse({ status: 200, description: 'Rule updated successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async update(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) {
    const rule = await this.rulesService.update(id, dto);

    return {
      success: true,
      message: 'Rule updated successfully',
      rule: {
        id: rule.id,
        name: rule.name,
      },
    };
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete rule' })
  @ApiResponse({ status: 204, description: 'Rule deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rule not found' })
  async delete(@Param('id') id: string) {
    await this.rulesService.delete(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate rule' })
  @ApiResponse({ status: 200, description: 'Rule activated successfully' })
  async activate(@Param('id') id: string) {
    const rule = await this.rulesService.activate(id);

    return {
      success: true,
      message: 'Rule activated successfully',
      rule: {
        id: rule.id,
        status: rule.status,
      },
    };
  }

  @Post(':id/archive')
  @ApiOperation({ summary: 'Archive rule' })
  @ApiResponse({ status: 200, description: 'Rule archived successfully' })
  async archive(@Param('id') id: string) {
    const rule = await this.rulesService.archive(id);

    return {
      success: true,
      message: 'Rule archived successfully',
      rule: {
        id: rule.id,
        status: rule.status,
      },
    };
  }
}
