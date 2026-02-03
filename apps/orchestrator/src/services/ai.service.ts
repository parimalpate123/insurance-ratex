import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MappingSuggester } from '../ai-services/mapping-suggester';
import { NLPRuleGenerator } from '../ai-services/nlp-rule-generator';
import { BedrockConfig } from '../ai-services/bedrock-client';
import { SuggestMappingsDto } from '../dto/suggest-mappings.dto';
import { GenerateRuleDto } from '../dto/generate-rule.dto';

@Injectable()
export class AIService {
  private readonly logger = new Logger(AIService.name);
  private mappingSuggester: MappingSuggester;
  private ruleGenerator: NLPRuleGenerator;
  private isEnabled: boolean;

  constructor(private configService: ConfigService) {
    this.isEnabled =
      this.configService.get('ENABLE_AI_FEATURES') === 'true' &&
      !!this.configService.get('AWS_REGION');

    if (this.isEnabled) {
      const bedrockConfig: BedrockConfig = {
        region: this.configService.get('AWS_REGION')!,
        accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
        modelId: this.configService.get('BEDROCK_MODEL_ID'),
      };

      this.mappingSuggester = new MappingSuggester(bedrockConfig);
      this.ruleGenerator = new NLPRuleGenerator(bedrockConfig);

      this.logger.log('✅ AI Services initialized with AWS Bedrock');
      this.logger.log(`   Region: ${bedrockConfig.region}`);
      this.logger.log(`   Model: ${bedrockConfig.modelId}`);
    } else {
      // Fallback mode without AI
      this.mappingSuggester = new MappingSuggester();
      this.ruleGenerator = new NLPRuleGenerator();

      this.logger.warn(
        '⚠️  AI Services running in fallback mode (no AWS credentials)'
      );
    }
  }

  async suggestMappings(dto: SuggestMappingsDto) {
    return this.mappingSuggester.suggestMappings(
      dto.sourceFields,
      dto.targetFields,
      {
        sourceSystem: dto.sourceSystem,
        targetSystem: dto.targetSystem,
        productLine: dto.productLine,
        useHistoricalMappings: dto.useHistoricalMappings,
        confidenceThreshold: dto.confidenceThreshold,
      }
    );
  }

  async generateRule(dto: GenerateRuleDto) {
    return this.ruleGenerator.generateRule({
      description: dto.description,
      productLine: dto.productLine,
      ruleType: dto.ruleType,
      context: dto.context,
    });
  }

  async validateRule(rule: any) {
    return this.ruleGenerator.validateRule(rule);
  }

  isAIEnabled(): boolean {
    return this.isEnabled;
  }
}
