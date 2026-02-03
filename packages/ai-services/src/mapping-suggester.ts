/**
 * AI-powered field mapping suggester using AWS Bedrock + Claude
 */

import { BedrockClient, BedrockConfig } from './bedrock-client';

export interface FieldInfo {
  path: string;
  name: string;
  type: string;
  description?: string;
  sampleValue?: any;
}

export interface MappingSuggestion {
  sourceField: string;
  targetField: string;
  confidence: number;
  transformationType: 'direct' | 'lookup' | 'expression' | 'conditional' | 'custom';
  reasoning: string;
  suggestedTransformation?: any;
}

export interface SuggestionOptions {
  sourceSystem: string;
  targetSystem: string;
  productLine: string;
  useHistoricalMappings?: boolean;
  confidenceThreshold?: number;
}

export class MappingSuggester {
  private bedrockClient: BedrockClient | null = null;
  private historicalMappings: Map<string, any[]> = new Map();

  constructor(config?: BedrockConfig) {
    if (config?.region) {
      this.bedrockClient = new BedrockClient(config);
    }
  }

  async suggestMappings(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[],
    options: SuggestionOptions
  ): Promise<MappingSuggestion[]> {
    const suggestions: MappingSuggestion[] = [];

    // Strategy 1: Exact name matching
    suggestions.push(...this.exactNameMatching(sourceFields, targetFields));

    // Strategy 2: Fuzzy/semantic matching
    suggestions.push(...this.semanticMatching(sourceFields, targetFields));

    // Strategy 3: Type-based matching
    suggestions.push(...this.typeBasedMatching(sourceFields, targetFields));

    // Strategy 4: AI-powered suggestions (if Bedrock configured)
    if (this.bedrockClient) {
      const aiSuggestions = await this.aiSuggestMappings(
        sourceFields,
        targetFields,
        options
      );
      suggestions.push(...aiSuggestions);
    }

    // Strategy 5: Historical pattern matching
    if (options.useHistoricalMappings) {
      suggestions.push(...this.historicalPatternMatching(sourceFields, targetFields, options));
    }

    return this.rankAndDeduplicate(suggestions, options.confidenceThreshold || 0.5);
  }

  private exactNameMatching(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[]
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];

    for (const source of sourceFields) {
      for (const target of targetFields) {
        const sourceName = source.name.toLowerCase();
        const targetName = target.name.toLowerCase();

        if (sourceName === targetName) {
          suggestions.push({
            sourceField: source.path,
            targetField: target.path,
            confidence: 0.95,
            transformationType: 'direct',
            reasoning: 'Exact name match',
          });
        }
      }
    }

    return suggestions;
  }

  private semanticMatching(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[]
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];

    const commonMappings = new Map([
      ['quoteNumber', ['policyId', 'quoteId', 'policyNumber']],
      ['accountHolderName', ['insuredName', 'name', 'customerName']],
      ['effectiveDate', ['policyEffectiveDate', 'startDate', 'effective']],
      ['expirationDate', ['policyExpirationDate', 'endDate', 'expiration']],
      ['state', ['jurisdiction', 'location', 'stateCode']],
      ['annualRevenue', ['revenue', 'annualSales', 'grossRevenue']],
    ]);

    for (const source of sourceFields) {
      const sourceName = source.name.toLowerCase();

      for (const [key, targets] of commonMappings.entries()) {
        if (sourceName.includes(key.toLowerCase())) {
          for (const target of targetFields) {
            const targetName = target.name.toLowerCase();

            if (targets.some(t => targetName.includes(t.toLowerCase()))) {
              suggestions.push({
                sourceField: source.path,
                targetField: target.path,
                confidence: 0.80,
                transformationType: 'direct',
                reasoning: `Semantic match: ${key} → ${target.name}`,
              });
            }
          }
        }
      }
    }

    return suggestions;
  }

  private typeBasedMatching(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[]
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];

    const dateFields = sourceFields.filter(f =>
      f.type === 'date' || f.name.toLowerCase().includes('date')
    );

    for (const source of dateFields) {
      for (const target of targetFields) {
        if (target.type === 'date' || target.name.toLowerCase().includes('date')) {
          const similarity = this.calculateStringSimilarity(source.name, target.name);

          if (similarity > 0.6) {
            suggestions.push({
              sourceField: source.path,
              targetField: target.path,
              confidence: 0.70,
              transformationType: 'expression',
              reasoning: 'Date field match - may need format transformation',
              suggestedTransformation: {
                expression: 'new Date(value).toISOString().split("T")[0]',
              },
            });
          }
        }
      }
    }

    return suggestions;
  }

  private async aiSuggestMappings(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[],
    options: SuggestionOptions
  ): Promise<MappingSuggestion[]> {
    if (!this.bedrockClient) {
      return [];
    }

    try {
      const prompt = this.buildMappingPrompt(sourceFields, targetFields, options);

      const systemPrompt = 'You are an expert in insurance data mapping and system integration. Analyze field schemas and suggest optimal mappings between source and target systems. Always respond with valid JSON.';

      const response = await this.bedrockClient.complete(prompt, {
        systemPrompt,
        temperature: 0.3,
        maxTokens: 2000,
      });

      return this.parseAISuggestions(response);
    } catch (error) {
      console.error('AI suggestion error:', error);
      return [];
    }
  }

  private historicalPatternMatching(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[],
    options: SuggestionOptions
  ): MappingSuggestion[] {
    const suggestions: MappingSuggestion[] = [];
    const key = `${options.sourceSystem}-${options.targetSystem}-${options.productLine}`;
    const historical = this.historicalMappings.get(key) || [];

    for (const source of sourceFields) {
      for (const mapping of historical) {
        if (mapping.sourceField === source.path) {
          suggestions.push({
            sourceField: source.path,
            targetField: mapping.targetField,
            confidence: 0.85,
            transformationType: mapping.type,
            reasoning: 'Based on historical mapping',
          });
        }
      }
    }

    return suggestions;
  }

  private rankAndDeduplicate(
    suggestions: MappingSuggestion[],
    threshold: number
  ): MappingSuggestion[] {
    const grouped = new Map<string, MappingSuggestion[]>();

    for (const suggestion of suggestions) {
      if (suggestion.confidence < threshold) continue;

      const key = suggestion.sourceField;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(suggestion);
    }

    const result: MappingSuggestion[] = [];

    for (const [_, suggestions] of grouped) {
      suggestions.sort((a, b) => b.confidence - a.confidence);
      result.push(suggestions[0]);
    }

    return result.sort((a, b) => b.confidence - a.confidence);
  }

  private buildMappingPrompt(
    sourceFields: FieldInfo[],
    targetFields: FieldInfo[],
    options: SuggestionOptions
  ): string {
    return `Source System: ${options.sourceSystem}
Target System: ${options.targetSystem}
Product Line: ${options.productLine}

Source Fields:
${sourceFields.map(f => `- ${f.path} (${f.type}): ${f.description || 'N/A'}`).join('\n')}

Target Fields:
${targetFields.map(f => `- ${f.path} (${f.type}): ${f.description || 'N/A'}`).join('\n')}

Suggest field mappings. Respond with valid JSON array:
[
  {
    "sourceField": "source.path",
    "targetField": "target.path",
    "confidence": 0.95,
    "transformationType": "direct",
    "reasoning": "explanation"
  }
]`;
  }

  private parseAISuggestions(content: string): MappingSuggestion[] {
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) return [];

      const parsed = JSON.parse(jsonMatch[0]);
      return parsed;
    } catch (error) {
      console.error('Failed to parse AI suggestions:', error);
      return [];
    }
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(
      longer.toLowerCase(),
      shorter.toLowerCase()
    );

    return (longer.length - editDistance) / longer.length;
  }

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
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  addHistoricalMapping(
    sourceSystem: string,
    targetSystem: string,
    productLine: string,
    mapping: any
  ): void {
    const key = `${sourceSystem}-${targetSystem}-${productLine}`;

    if (!this.historicalMappings.has(key)) {
      this.historicalMappings.set(key, []);
    }

    this.historicalMappings.get(key)!.push(mapping);
  }

  async loadHistoricalMappings(mappings: any[]): Promise<void> {
    for (const mapping of mappings) {
      this.addHistoricalMapping(
        mapping.sourceSystem,
        mapping.targetSystem,
        mapping.productLine,
        mapping
      );
    }
  }
}
