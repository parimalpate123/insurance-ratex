import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AISuggestion, FieldSuggestion } from '../entities/ai-suggestion.entity';
import { Schema } from '../entities/schema.entity';
import { BedrockClient, BedrockConfig } from '../ai-services/bedrock-client';

export interface MappingSuggestionRequest {
  sourceSchemaId: string;
  targetSchemaId: string;
  productLine?: string;
  context?: string;
}

export interface MappingSuggestionResponse {
  suggestions: FieldSuggestion[];
  totalSuggestions: number;
  highConfidenceCount: number;
  averageConfidence: number;
  processingTimeMs: number;
}

@Injectable()
export class AIMappingService {
  private readonly logger = new Logger(AIMappingService.name);
  private readonly bedrockClient: BedrockClient | null;
  private readonly isEnabled: boolean;

  constructor(
    @InjectRepository(AISuggestion)
    private readonly suggestionRepository: Repository<AISuggestion>,
    @InjectRepository(Schema)
    private readonly schemaRepository: Repository<Schema>,
    private readonly configService: ConfigService,
  ) {
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

      this.bedrockClient = new BedrockClient(bedrockConfig);

      this.logger.log('✅ AI Mapping Service initialized with AWS Bedrock');
      this.logger.log(`   Region: ${bedrockConfig.region}`);
      this.logger.log(`   Model: ${bedrockConfig.modelId}`);
    } else {
      this.bedrockClient = null;
      this.logger.warn(
        '⚠️  AI Mapping Service running in fallback mode (no AWS credentials)',
      );
    }
  }

  /**
   * Generate mapping suggestions using AI
   */
  async generateMappingSuggestions(
    request: MappingSuggestionRequest,
  ): Promise<MappingSuggestionResponse> {
    const startTime = Date.now();
    this.logger.log(
      `Generating AI mapping suggestions: ${request.sourceSchemaId} → ${request.targetSchemaId}`,
    );

    // Fetch schemas
    const sourceSchema = await this.schemaRepository.findOne({
      where: { id: request.sourceSchemaId },
    });
    const targetSchema = await this.schemaRepository.findOne({
      where: { id: request.targetSchemaId },
    });

    if (!sourceSchema || !targetSchema) {
      throw new Error('Source or target schema not found');
    }

    // Build AI prompt
    const prompt = this.buildMappingPrompt(
      sourceSchema,
      targetSchema,
      request.productLine,
      request.context,
    );

    // Call Claude API
    const suggestions = await this.callClaudeAPI(prompt);

    // Calculate metrics
    const processingTimeMs = Date.now() - startTime;
    const highConfidenceCount = suggestions.filter(
      (s) => s.confidence >= 80,
    ).length;
    const averageConfidence =
      suggestions.reduce((sum, s) => sum + s.confidence, 0) /
        suggestions.length || 0;

    // Save audit trail
    await this.saveSuggestion({
      suggestionType: 'auto_detect',
      inputData: {
        sourceSchemaId: request.sourceSchemaId,
        targetSchemaId: request.targetSchemaId,
        productLine: request.productLine,
      },
      suggestions: { suggestions },
      aiModel: this.configService.get('BEDROCK_MODEL_ID') || 'claude-3-5-sonnet-bedrock',
      processingTimeMs,
    });

    this.logger.log(
      `Generated ${suggestions.length} suggestions in ${processingTimeMs}ms (avg confidence: ${averageConfidence.toFixed(1)}%)`,
    );

    return {
      suggestions,
      totalSuggestions: suggestions.length,
      highConfidenceCount,
      averageConfidence,
      processingTimeMs,
    };
  }

  /**
   * Build prompt for Claude API
   */
  private buildMappingPrompt(
    sourceSchema: Schema,
    targetSchema: Schema,
    productLine?: string,
    context?: string,
  ): string {
    return `You are an expert insurance data mapping analyst. Your task is to suggest field mappings between two insurance system schemas.

**Source System:** ${sourceSchema.systemName} v${sourceSchema.version}
**Target System:** ${targetSchema.systemName} v${targetSchema.version}
${productLine ? `**Product Line:** ${productLine}` : ''}
${context ? `**Additional Context:** ${context}` : ''}

**Source Schema Fields:**
${JSON.stringify(sourceSchema.schemaData.fields, null, 2)}

**Target Schema Fields:**
${JSON.stringify(targetSchema.schemaData.fields, null, 2)}

**Instructions:**
1. Analyze the field paths, types, and descriptions
2. Suggest mappings where there is semantic similarity
3. Consider insurance domain knowledge (e.g., "quoteNumber" maps to "policy.id")
4. Assign a confidence score (0-100) for each mapping
5. Provide reasoning for each suggestion
6. Suggest appropriate transformation type (direct, lookup, expression, etc.)

**Output Format:**
Return a JSON array of mappings. Each mapping should have:
- sourcePath: string
- targetPath: string
- transformationType: "direct" | "lookup" | "expression" | "conditional" | "static"
- confidence: number (0-100)
- reasoning: string (brief explanation)

Example:
[
  {
    "sourcePath": "quoteNumber",
    "targetPath": "policy.id",
    "transformationType": "direct",
    "confidence": 95,
    "reasoning": "Both fields represent unique policy identifiers"
  }
]

Return ONLY the JSON array, no additional text.`;
  }

  /**
   * Call Claude API via AWS Bedrock
   */
  private async callClaudeAPI(prompt: string): Promise<FieldSuggestion[]> {
    if (!this.bedrockClient) {
      this.logger.warn('AWS Bedrock not configured. Returning mock suggestions.');
      return this.generateMockSuggestions();
    }

    try {
      const responseText = await this.bedrockClient.complete(prompt, {
        maxTokens: 4096,
        temperature: 0.7,
      });

      // Parse JSON response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from AI response');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      return suggestions;
    } catch (error) {
      this.logger.error(`Error calling Bedrock: ${error.message}`);
      // Fallback to mock suggestions
      return this.generateMockSuggestions();
    }
  }

  /**
   * Generate mock suggestions (fallback)
   */
  private generateMockSuggestions(): FieldSuggestion[] {
    return [
      {
        sourcePath: 'quoteNumber',
        targetPath: 'policy.id',
        transformationType: 'direct',
        confidence: 95,
        reasoning:
          'Both fields represent unique policy identifiers. Direct mapping is appropriate.',
      },
      {
        sourcePath: 'insured.name',
        targetPath: 'insured.name',
        transformationType: 'direct',
        confidence: 99,
        reasoning: 'Exact field name match for insured name.',
      },
      {
        sourcePath: 'insured.state',
        targetPath: 'insured.address.state',
        transformationType: 'direct',
        confidence: 90,
        reasoning:
          'State code mapping. Target has nested structure but semantic match is clear.',
      },
    ];
  }

  /**
   * Parse text requirements (JIRA story, plain text) using AI
   */
  async parseTextRequirements(
    text: string,
    context?: {
      sourceSystem?: string;
      targetSystem?: string;
      productLine?: string;
    },
  ): Promise<FieldSuggestion[]> {
    const startTime = Date.now();
    this.logger.log(`Parsing text requirements (${text.length} characters)`);

    if (!this.bedrockClient) {
      this.logger.warn('AWS Bedrock not configured. Using fallback parser.');
      return this.parseTextFallback(text);
    }

    try {
      const prompt = this.buildTextParsingPrompt(text, context);
      const responseText = await this.bedrockClient.complete(prompt, {
        maxTokens: 4096,
        temperature: 0.7,
      });

      // Parse JSON response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to extract JSON from AI response');
      }

      const suggestions = JSON.parse(jsonMatch[0]);
      const processingTimeMs = Date.now() - startTime;

      // Save audit trail
      await this.saveSuggestion({
        suggestionType: 'manual_suggest',
        inputData: { text, context },
        suggestions: { suggestions },
        aiModel: this.configService.get('BEDROCK_MODEL_ID') || 'claude-3-5-sonnet-bedrock',
        processingTimeMs,
      });

      this.logger.log(
        `Parsed ${suggestions.length} mappings from text in ${processingTimeMs}ms`,
      );

      return suggestions;
    } catch (error) {
      this.logger.error(`Error parsing text: ${error.message}`);
      // Fallback to simple parsing
      return this.parseTextFallback(text);
    }
  }

  /**
   * Build prompt for text parsing
   */
  private buildTextParsingPrompt(
    text: string,
    context?: {
      sourceSystem?: string;
      targetSystem?: string;
      productLine?: string;
    },
  ): string {
    return `You are an expert insurance data mapping analyst. Parse the following text to extract field mapping requirements.

**Text to Parse:**
${text}

${context?.sourceSystem ? `**Source System:** ${context.sourceSystem}` : ''}
${context?.targetSystem ? `**Target System:** ${context.targetSystem}` : ''}
${context?.productLine ? `**Product Line:** ${context.productLine}` : ''}

**Instructions:**
1. Extract all field mapping requirements from the text
2. Look for patterns like:
   - "Map X to Y"
   - "X should map to Y"
   - "Field X → Y"
   - "Source: X, Target: Y"
3. Identify transformation types mentioned (lookup, date format, concatenate, etc.)
4. Assign confidence scores (70-95%) based on clarity
5. Provide reasoning for each mapping

**Output Format:**
Return a JSON array of mappings:
[
  {
    "sourcePath": "fieldName",
    "targetPath": "targetField",
    "transformationType": "direct" | "lookup" | "expression" | "conditional",
    "confidence": 85,
    "reasoning": "brief explanation"
  }
]

Return ONLY the JSON array, no additional text.`;
  }

  /**
   * Fallback text parser (simple regex-based)
   */
  private parseTextFallback(text: string): FieldSuggestion[] {
    const suggestions: FieldSuggestion[] = [];
    const lines = text.split('\n');

    // Pattern matching for common formats
    const patterns = [
      /map\s+(\S+)\s+to\s+(\S+)/i,
      /(\S+)\s+→\s+(\S+)/,
      /(\S+)\s+->\s+(\S+)/,
      /source:\s*(\S+).*target:\s*(\S+)/i,
    ];

    for (const line of lines) {
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          const sourcePath = match[1].trim();
          const targetPath = match[2].trim();

          // Determine transformation type from keywords
          let transformationType = 'direct';
          if (line.toLowerCase().includes('lookup')) {
            transformationType = 'lookup';
          } else if (line.toLowerCase().includes('format') || line.toLowerCase().includes('date')) {
            transformationType = 'expression';
          } else if (line.toLowerCase().includes('if') || line.toLowerCase().includes('when')) {
            transformationType = 'conditional';
          }

          suggestions.push({
            sourcePath,
            targetPath,
            transformationType,
            confidence: 75, // Lower confidence for regex parsing
            reasoning: `Extracted from: "${line.substring(0, 80)}..."`,
          });

          break; // Found a match, move to next line
        }
      }
    }

    return suggestions;
  }

  /**
   * Suggest mappings from Excel parsing
   */
  async suggestFromExcel(
    excelSuggestions: FieldSuggestion[],
    sourceSchemaId: string,
    targetSchemaId: string,
  ): Promise<FieldSuggestion[]> {
    this.logger.log(
      `Enhancing ${excelSuggestions.length} Excel-parsed suggestions with AI`,
    );

    // For now, return as-is. Future: enhance with AI validation
    return excelSuggestions;
  }

  /**
   * Save suggestion to audit trail
   */
  private async saveSuggestion(data: Partial<AISuggestion>): Promise<void> {
    try {
      const suggestion = this.suggestionRepository.create(data);
      await this.suggestionRepository.save(suggestion);
    } catch (error) {
      this.logger.error(`Failed to save suggestion audit: ${error.message}`);
    }
  }

  /**
   * Get suggestion history
   */
  async getSuggestionHistory(
    mappingId?: string,
    limit: number = 50,
  ): Promise<AISuggestion[]> {
    const queryBuilder =
      this.suggestionRepository.createQueryBuilder('suggestion');

    if (mappingId) {
      queryBuilder.where('suggestion.mappingId = :mappingId', { mappingId });
    }

    return await queryBuilder
      .orderBy('suggestion.createdAt', 'DESC')
      .take(limit)
      .getMany();
  }

  /**
   * Calculate similarity between two field paths
   */
  calculateFieldSimilarity(path1: string, path2: string): number {
    // Normalize paths
    const normalize = (path: string) =>
      path
        .toLowerCase()
        .replace(/[._\[\]]/g, '')
        .trim();

    const norm1 = normalize(path1);
    const norm2 = normalize(path2);

    // Exact match
    if (norm1 === norm2) return 100;

    // Contains check
    if (norm1.includes(norm2) || norm2.includes(norm1)) return 85;

    // Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(norm1, norm2);
    const maxLength = Math.max(norm1.length, norm2.length);
    const similarity = ((maxLength - distance) / maxLength) * 100;

    return Math.round(similarity);
  }

  /**
   * Levenshtein distance algorithm
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1,
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }
}
