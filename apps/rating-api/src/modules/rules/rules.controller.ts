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
  NotFoundException,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RulesService } from './rules.service';
import { AiPromptsService } from '../ai-prompts/ai-prompts.service';
import { ConditionalRule } from '../../entities/conditional-rule.entity';
import { RuleCondition } from '../../entities/rule-condition.entity';
import { RuleAction } from '../../entities/rule-action.entity';

@ApiTags('Rules')
@Controller('api/v1/rules')
export class RulesController {
  constructor(
    private readonly rulesService: RulesService,
    private readonly aiPromptsService: AiPromptsService,
    @InjectRepository(ConditionalRule)
    private readonly ruleRepo: Repository<ConditionalRule>,
    @InjectRepository(RuleCondition)
    private readonly conditionRepo: Repository<RuleCondition>,
    @InjectRepository(RuleAction)
    private readonly actionRepo: Repository<RuleAction>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all rules, optionally filtered by product line' })
  @ApiQuery({ name: 'productLineCode', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('productLineCode') productLineCode?: string,
    @Query('status') status?: string,
  ): Promise<ConditionalRule[]> {
    const where: any = {};
    if (productLineCode) where.productLineCode = productLineCode;
    if (status) where.status = status;
    return this.ruleRepo.find({
      where,
      relations: ['conditions', 'actions'],
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a rule by ID' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ConditionalRule> {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['conditions', 'actions'],
    });
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);
    return rule;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new rule with conditions and actions' })
  async create(@Body() body: Partial<ConditionalRule> & {
    conditions?: Partial<RuleCondition>[];
    actions?: Partial<RuleAction>[];
  }): Promise<ConditionalRule> {
    const { conditions, actions, ...ruleData } = body;
    const rule = this.ruleRepo.create(ruleData);
    const savedRule = await this.ruleRepo.save(rule);

    if (conditions?.length) {
      const conditionEntities = conditions.map((c, idx) =>
        this.conditionRepo.create({ ...c, ruleId: savedRule.id, conditionOrder: c.conditionOrder ?? idx }),
      );
      await this.conditionRepo.save(conditionEntities);
    }

    if (actions?.length) {
      const actionEntities = actions.map((a, idx) =>
        this.actionRepo.create({ ...a, ruleId: savedRule.id, actionOrder: a.actionOrder ?? idx }),
      );
      await this.actionRepo.save(actionEntities);
    }

    return this.ruleRepo.findOne({
      where: { id: savedRule.id },
      relations: ['conditions', 'actions'],
    }) as Promise<ConditionalRule>;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a rule (replaces conditions/actions if provided)' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<ConditionalRule> & {
      conditions?: Partial<RuleCondition>[];
      actions?: Partial<RuleAction>[];
    },
  ): Promise<ConditionalRule> {
    const existing = await this.ruleRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Rule ${id} not found`);

    const { conditions, actions, ...ruleData } = body;
    await this.ruleRepo.update(id, ruleData);

    // Replace conditions/actions if provided
    if (conditions !== undefined) {
      await this.conditionRepo.delete({ ruleId: id });
      if (conditions.length) {
        const entities = conditions.map((c, idx) =>
          this.conditionRepo.create({ ...c, ruleId: id, conditionOrder: c.conditionOrder ?? idx }),
        );
        await this.conditionRepo.save(entities);
      }
    }

    if (actions !== undefined) {
      await this.actionRepo.delete({ ruleId: id });
      if (actions.length) {
        const entities = actions.map((a, idx) =>
          this.actionRepo.create({ ...a, ruleId: id, actionOrder: a.actionOrder ?? idx }),
        );
        await this.actionRepo.save(entities);
      }
    }

    return this.ruleRepo.findOne({
      where: { id },
      relations: ['conditions', 'actions'],
    }) as Promise<ConditionalRule>;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a rule' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const existing = await this.ruleRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Rule ${id} not found`);
    await this.ruleRepo.delete(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a rule (set status to active)' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<ConditionalRule> {
    const existing = await this.ruleRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Rule ${id} not found`);
    await this.ruleRepo.update(id, { status: 'active' });
    return this.ruleRepo.findOne({
      where: { id },
      relations: ['conditions', 'actions'],
    }) as Promise<ConditionalRule>;
  }

  // ── AI rule generation ────────────────────────────────────────────────────

  @Post('generate-ai')
  @ApiOperation({ summary: 'Generate a rule from a natural language description (Bedrock if AWS creds present, else heuristic fallback)' })
  async generateWithAI(
    @Body() body: { requirements: string; productLineCode?: string; context?: string },
  ): Promise<{ rule: Partial<ConditionalRule>; confidence: number }> {
    const desc = body.requirements ?? body.context ?? '';
    const plCode = body.productLineCode ?? 'UNKNOWN';

    const awsRegion = process.env.AWS_REGION;
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
    const modelId = process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

    if (awsRegion && awsKey && awsSecret) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
        const client = new BedrockRuntimeClient({
          region: awsRegion,
          credentials: { accessKeyId: awsKey, secretAccessKey: awsSecret },
        });

        const prompt = await this.aiPromptsService.buildPrompt(
          'rule-generate',
          {
            productLine: plCode ?? 'general',
            description: desc,
          },
          `You are an expert in insurance business rules and rating systems.
Convert this plain-English description into a structured insurance rule JSON.

Product Line Code: {{productLine}}
Description: "{{description}}"

Respond ONLY with valid JSON using this exact structure:
{
  "name": "Snake_Case_Rule_Name",
  "description": "one clear sentence describing the rule",
  "conditions": [
    { "fieldPath": "dot.path.field", "operator": "==", "value": "someValue" }
  ],
  "actions": [
    { "actionType": "surcharge", "targetField": "premium", "value": "0.05" }
  ],
  "confidence": 0.9
}

Rules:
- fieldPath uses dot notation (e.g. insured.state, building.yearBuilt, insured.annualRevenue, risk.claimCount)
- operator must be one of: ==, !=, >, >=, <, <=, contains, in, not_in, is_null, is_not_null
- actionType must be one of: surcharge, discount, multiply, set, add, subtract, reject
- value for surcharge/discount is a decimal (0.20 = 20%)
- for "in" operator, value is a comma-separated list: "CA,NY,NJ"
- multiple conditions are all ANDed together
- output only JSON, no explanation`,
        );

        const payload = {
          anthropic_version: 'bedrock-2023-05-31',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        };

        const cmd = new InvokeModelCommand({
          modelId,
          body: Buffer.from(JSON.stringify(payload)),
          contentType: 'application/json',
          accept: 'application/json',
        });

        const res = await client.send(cmd);
        const responseText = JSON.parse(new TextDecoder().decode(res.body)).content[0].text;
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { rule: this.buildRuleFromParsed(parsed, plCode), confidence: parsed.confidence ?? 0.9 };
        }
      } catch (e) {
        // Fall through to heuristic fallback
      }
    }

    return this.generateFromTemplate(desc, plCode);
  }

  private buildRuleFromParsed(parsed: any, plCode: string): Partial<ConditionalRule> {
    return {
      name: parsed.name ?? 'Generated_Rule',
      description: parsed.description ?? '',
      productLine: plCode,
      productLineCode: plCode,
      status: 'draft',
      conditions: (parsed.conditions ?? []).map((c: any, i: number) => ({
        fieldPath: c.fieldPath ?? c.field,
        operator: c.operator,
        value: c.value,
        conditionOrder: i,
      })) as any,
      actions: (parsed.actions ?? []).map((a: any, i: number) => ({
        actionType: a.actionType ?? a.type,
        targetField: a.targetField ?? a.field,
        value: a.value,
        actionOrder: i,
      })) as any,
    };
  }

  private generateFromTemplate(desc: string, plCode: string): { rule: Partial<ConditionalRule>; confidence: number } {
    const lower = desc.toLowerCase();

    // Extract percentage
    const pctMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
    const pct = pctMatch ? parseFloat(pctMatch[1]) / 100 : 0.05;

    // Determine action type
    let actionType = 'surcharge';
    if (/discount|reduce|lower|decrease/.test(lower)) actionType = 'discount';
    else if (/reject|decline|deny/.test(lower)) actionType = 'reject';
    else if (/multiply|times|factor/.test(lower)) actionType = 'multiply';
    else if (/set|assign/.test(lower)) actionType = 'set';

    // Build conditions from heuristics
    const conditions: any[] = [];

    // State/territory condition
    const stateMatch = lower.match(/\b(CA|NY|NJ|TX|FL|IL|PA|OH|GA|NC|MI|WA|AZ|CO|IN|TN|MO|MA|MD|MN|WI|OR|VA|AL|SC|KY|LA|CT|UT|IA|NV|AR|MS|KS|NM|NE|WV|ID|HI|NH|ME|RI|MT|DE|SD|ND|AK|VT|WY|DC)\b/gi);
    if (stateMatch) {
      const states = [...new Set(stateMatch.map(s => s.toUpperCase()))];
      if (states.length === 1) {
        conditions.push({ fieldPath: 'insured.state', operator: '==', value: states[0], conditionOrder: 0 });
      } else {
        conditions.push({ fieldPath: 'insured.state', operator: 'in', value: states.join(','), conditionOrder: 0 });
      }
    }

    // Revenue condition
    const revMatch = lower.match(/revenue.*?(\d[\d,]*)/i) ?? lower.match(/(\d[\d,]*)\s*(?:million|m)\b/i);
    if (revMatch) {
      const amount = parseInt(revMatch[1].replace(/,/g, '')) * (lower.includes('million') ? 1000000 : 1);
      conditions.push({ fieldPath: 'insured.annualRevenue', operator: '>', value: amount, conditionOrder: conditions.length });
    }

    // Age condition
    const ageMatch = lower.match(/(?:building|structure).*?(\d+)\s*years?/i) ?? lower.match(/over\s+(\d+)\s*years?/i);
    if (ageMatch) {
      conditions.push({ fieldPath: 'building.yearBuilt', operator: '<', value: new Date().getFullYear() - parseInt(ageMatch[1]), conditionOrder: conditions.length });
    }

    // Generic string condition fallback
    if (conditions.length === 0) {
      conditions.push({ fieldPath: 'insured.state', operator: '==', value: 'XX', conditionOrder: 0 });
    }

    // Build name from description
    const nameParts = desc.trim().split(/\s+/).slice(0, 6).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('_');
    const name = nameParts.replace(/[^A-Za-z0-9_]/g, '');

    const actions: any[] = actionType === 'reject'
      ? [{ actionType: 'reject', targetField: 'quote', value: desc.slice(0, 60), actionOrder: 0 }]
      : [{ actionType, targetField: 'premium', value: String(pct), actionOrder: 0 }];

    const rule: Partial<ConditionalRule> = {
      name: name || 'Generated_Rule',
      description: desc,
      productLine: plCode,
      productLineCode: plCode,
      status: 'draft',
      conditions: conditions as any,
      actions: actions as any,
    };

    return { rule, confidence: 0.6 };
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a rule against sample data' })
  async test(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { data: any },
  ): Promise<{ matched: boolean; actionsApplied: string[]; resultData: any }> {
    const rule = await this.ruleRepo.findOne({
      where: { id },
      relations: ['conditions', 'actions'],
    });
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);

    // Execute just this single rule
    const result = await this.rulesService.executeRules(
      rule.productLineCode ?? rule.productLine,
      body.data,
    );

    return {
      matched: result.rulesApplied.includes(rule.name),
      actionsApplied: result.rulesApplied,
      resultData: result.data,
    };
  }
}
