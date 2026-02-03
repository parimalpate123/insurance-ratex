/**
 * NLP Rule Generator using AWS Bedrock + Claude
 */

import { BedrockClient, BedrockConfig } from './bedrock-client';

export interface RuleGenerationRequest {
  description: string;
  productLine: string;
  ruleType?: 'lookup' | 'decision' | 'conditional';
  context?: {
    availableFields?: string[];
    operators?: string[];
    actions?: string[];
  };
}

export interface GeneratedRule {
  name: string;
  type: 'lookup' | 'decision' | 'conditional';
  description: string;
  conditions?: any[];
  actions?: any[];
  lookupTable?: any;
  decisionTable?: any;
  confidence: number;
  reasoning: string;
}

export class NLPRuleGenerator {
  private bedrockClient: BedrockClient | null = null;

  constructor(config?: BedrockConfig) {
    if (config?.region) {
      this.bedrockClient = new BedrockClient(config);
    }
  }

  async generateRule(request: RuleGenerationRequest): Promise<GeneratedRule> {
    if (!this.bedrockClient) {
      return this.generateFallbackRule(request);
    }

    try {
      const prompt = this.buildRulePrompt(request);
      const systemPrompt = `You are an expert in insurance business rules and logic.
Convert natural language descriptions into structured rule definitions.
Always respond with valid JSON.`;

      const response = await this.bedrockClient.complete(prompt, {
        systemPrompt,
        temperature: 0.2,
        maxTokens: 2000,
      });

      return this.parseGeneratedRule(response, request);
    } catch (error) {
      console.error('AI rule generation error:', error);
      return this.generateFallbackRule(request);
    }
  }

  async generateMultipleRules(
    requests: RuleGenerationRequest[]
  ): Promise<GeneratedRule[]> {
    const rules: GeneratedRule[] = [];

    for (const request of requests) {
      const rule = await this.generateRule(request);
      rules.push(rule);
    }

    return rules;
  }

  private buildRulePrompt(request: RuleGenerationRequest): string {
    const contextInfo = request.context
      ? `
Available Fields: ${request.context.availableFields?.join(', ') || 'N/A'}
Available Operators: ${request.context.operators?.join(', ') || 'N/A'}
Available Actions: ${request.context.actions?.join(', ') || 'N/A'}
`
      : '';

    return `Product Line: ${request.productLine}
Rule Type: ${request.ruleType || 'auto-detect'}
${contextInfo}

User Description:
"${request.description}"

Generate a structured business rule from this description. Respond with JSON:

{
  "name": "descriptive rule name",
  "type": "lookup|decision|conditional",
  "description": "clear description",
  "conditions": [
    {
      "field": "fieldName",
      "operator": "==|!=|>|<|>=|<=",
      "value": "value"
    }
  ],
  "actions": [
    {
      "type": "surcharge|discount|reject|modify",
      "field": "targetField",
      "value": "value or expression"
    }
  ],
  "confidence": 0.95,
  "reasoning": "why this rule structure was chosen"
}

For lookup tables, include "lookupTable" instead of conditions/actions.
For decision tables, include "decisionTable" with rows and columns.`;
  }

  private parseGeneratedRule(
    response: string,
    request: RuleGenerationRequest
  ): GeneratedRule {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        name: parsed.name || this.generateRuleName(request.description),
        type: parsed.type || request.ruleType || 'conditional',
        description: parsed.description || request.description,
        conditions: parsed.conditions,
        actions: parsed.actions,
        lookupTable: parsed.lookupTable,
        decisionTable: parsed.decisionTable,
        confidence: parsed.confidence || 0.8,
        reasoning: parsed.reasoning || 'Generated from natural language',
      };
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.generateFallbackRule(request);
    }
  }

  private generateFallbackRule(request: RuleGenerationRequest): GeneratedRule {
    // Template-based fallback when AI is not available
    const patterns = [
      {
        pattern: /surcharge.*(\d+).*percent.*revenue.*(\d+)/i,
        generator: (matches: RegExpMatchArray) => ({
          type: 'conditional' as const,
          conditions: [
            {
              field: 'annualRevenue',
              operator: '>',
              value: parseInt(matches[2]) * 1000000,
            },
          ],
          actions: [
            {
              type: 'surcharge',
              field: 'premium',
              value: `premium * ${parseInt(matches[1]) / 100}`,
            },
          ],
        }),
      },
      {
        pattern: /discount.*(\d+).*percent.*state.*(\w+)/i,
        generator: (matches: RegExpMatchArray) => ({
          type: 'conditional' as const,
          conditions: [
            {
              field: 'state',
              operator: '==',
              value: matches[2].toUpperCase(),
            },
          ],
          actions: [
            {
              type: 'discount',
              field: 'premium',
              value: `premium * ${parseInt(matches[1]) / 100}`,
            },
          ],
        }),
      },
    ];

    for (const { pattern, generator } of patterns) {
      const matches = request.description.match(pattern);
      if (matches) {
        const generated = generator(matches);
        return {
          name: this.generateRuleName(request.description),
          type: generated.type,
          description: request.description,
          conditions: generated.conditions,
          actions: generated.actions,
          confidence: 0.6,
          reasoning: 'Generated using template matching (AI unavailable)',
        };
      }
    }

    // Generic fallback
    return {
      name: this.generateRuleName(request.description),
      type: request.ruleType || 'conditional',
      description: request.description,
      conditions: [],
      actions: [],
      confidence: 0.3,
      reasoning:
        'Could not parse rule - please refine description or enable AI',
    };
  }

  private generateRuleName(description: string): string {
    const words = description.split(' ').slice(0, 5);
    return words
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  async validateRule(rule: GeneratedRule): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];

    if (!rule.name) errors.push('Rule name is required');
    if (!rule.type) errors.push('Rule type is required');
    if (!rule.description) errors.push('Rule description is required');

    if (rule.type === 'conditional') {
      if (!rule.conditions || rule.conditions.length === 0) {
        errors.push('Conditional rules must have at least one condition');
      }
      if (!rule.actions || rule.actions.length === 0) {
        errors.push('Conditional rules must have at least one action');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
