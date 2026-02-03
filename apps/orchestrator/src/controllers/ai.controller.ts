import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AIService } from '../services/ai.service';
import { SuggestMappingsDto } from '../dto/suggest-mappings.dto';
import { GenerateRuleDto } from '../dto/generate-rule.dto';

@ApiTags('AI Services')
@Controller('api/v1/ai')
export class AIController {
  private readonly logger = new Logger(AIController.name);

  constructor(private readonly aiService: AIService) {}

  @Post('suggest-mappings')
  @ApiOperation({ summary: 'Get AI-powered field mapping suggestions' })
  @ApiResponse({ status: 200, description: 'Mapping suggestions returned' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async suggestMappings(@Body() dto: SuggestMappingsDto) {
    this.logger.log(
      `Suggesting mappings: ${dto.sourceSystem} → ${dto.targetSystem}`
    );

    try {
      const suggestions = await this.aiService.suggestMappings(dto);

      return {
        success: true,
        suggestions,
        metadata: {
          sourceSystem: dto.sourceSystem,
          targetSystem: dto.targetSystem,
          productLine: dto.productLine,
          count: suggestions.length,
        },
      };
    } catch (error: any) {
      this.logger.error(`Mapping suggestion error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        suggestions: [],
      };
    }
  }

  @Post('generate-rule')
  @ApiOperation({ summary: 'Generate business rule from natural language' })
  @ApiResponse({ status: 200, description: 'Rule generated successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async generateRule(@Body() dto: GenerateRuleDto) {
    this.logger.log(`Generating rule: "${dto.description}"`);

    try {
      const rule = await this.aiService.generateRule(dto);

      return {
        success: true,
        rule,
        metadata: {
          productLine: dto.productLine,
          ruleType: rule.type,
          confidence: rule.confidence,
        },
      };
    } catch (error: any) {
      this.logger.error(`Rule generation error: ${error.message}`);
      return {
        success: false,
        error: error.message,
        rule: null,
      };
    }
  }

  @Post('validate-rule')
  @ApiOperation({ summary: 'Validate a generated rule' })
  async validateRule(@Body() rule: any) {
    try {
      const validation = await this.aiService.validateRule(rule);
      return {
        success: true,
        validation,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
