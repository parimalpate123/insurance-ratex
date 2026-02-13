import { Controller, Get, Put, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AiPromptsService } from './ai-prompts.service';

@ApiTags('AI Prompts')
@Controller('api/v1/ai-prompts')
export class AiPromptsController {
  constructor(private readonly service: AiPromptsService) {}

  @Get()
  @ApiOperation({ summary: 'List all AI prompt templates' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a single prompt by key' })
  findOne(@Param('key') key: string) {
    return this.service.findByKey(key);
  }

  @Put(':key')
  @ApiOperation({ summary: 'Update a prompt template' })
  update(
    @Param('key') key: string,
    @Body() body: {
      template?: string;
      name?: string;
      description?: string;
      kbQueryTemplate?: string;
      kbTopK?: number;
      isActive?: boolean;
    },
  ) {
    return this.service.update(key, body);
  }

  @Delete(':key/reset')
  @ApiOperation({ summary: 'Reset prompt to hardcoded default (removes DB override)' })
  reset(@Param('key') key: string) {
    return this.service.resetToDefault(key);
  }
}
