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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MappingsService } from './mappings.service';
import { TransformationEngine } from './transformation.engine';
import { LookupTablesService } from '../lookup-tables/lookup-tables.service';
import { AiPromptsService } from '../ai-prompts/ai-prompts.service';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';

@ApiTags('Mappings')
@Controller('api/v1/mappings')
export class MappingsController {
  constructor(
    private readonly mappingsService: MappingsService,
    private readonly transformationEngine: TransformationEngine,
    private readonly lookupTablesService: LookupTablesService,
    private readonly aiPromptsService: AiPromptsService,
    @InjectRepository(Mapping)
    private readonly mappingRepo: Repository<Mapping>,
    @InjectRepository(FieldMapping)
    private readonly fieldMappingRepo: Repository<FieldMapping>,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List all mappings, optionally filtered by product line' })
  @ApiQuery({ name: 'productLineCode', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('productLineCode') productLineCode?: string,
    @Query('status') status?: string,
  ): Promise<Mapping[]> {
    const where: any = {};
    if (productLineCode) where.productLineCode = productLineCode;
    if (status) where.status = status;
    return this.mappingRepo.find({ where, order: { createdAt: 'DESC' } });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a mapping by ID (includes field mappings)' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Mapping> {
    const mapping = await this.mappingRepo.findOne({
      where: { id },
      relations: ['fieldMappings'],
    });
    if (!mapping) throw new NotFoundException(`Mapping ${id} not found`);
    return mapping;
  }

  @Post()
  @ApiOperation({ summary: 'Create a new mapping' })
  @ApiResponse({ status: 201 })
  async create(@Body() body: Partial<Mapping>): Promise<Mapping> {
    const mapping = this.mappingRepo.create(body);
    return this.mappingRepo.save(mapping);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a mapping' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<Mapping>,
  ): Promise<Mapping> {
    const existing = await this.mappingRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Mapping ${id} not found`);
    await this.mappingRepo.update(id, body);
    return this.mappingRepo.findOne({ where: { id }, relations: ['fieldMappings'] }) as Promise<Mapping>;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a mapping' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    const existing = await this.mappingRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Mapping ${id} not found`);
    await this.mappingRepo.delete(id);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a mapping (set status to active)' })
  async activate(@Param('id', ParseUUIDPipe) id: string): Promise<Mapping> {
    const existing = await this.mappingRepo.findOne({ where: { id } });
    if (!existing) throw new NotFoundException(`Mapping ${id} not found`);
    await this.mappingRepo.update(id, { status: 'active' });
    return this.mappingRepo.findOne({ where: { id } }) as Promise<Mapping>;
  }

  // ── Field Mappings ─────────────────────────────────────────────────────

  @Get(':id/fields')
  @ApiOperation({ summary: 'Get all field mappings for a mapping' })
  async getFields(@Param('id', ParseUUIDPipe) id: string): Promise<FieldMapping[]> {
    return this.fieldMappingRepo.find({ where: { mappingId: id } });
  }

  @Post(':id/fields')
  @ApiOperation({ summary: 'Add a field mapping' })
  async addField(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: Partial<FieldMapping>,
  ): Promise<FieldMapping> {
    const mapping = await this.mappingRepo.findOne({ where: { id } });
    if (!mapping) throw new NotFoundException(`Mapping ${id} not found`);
    const fieldMapping = this.fieldMappingRepo.create({ ...body, mappingId: id });
    return this.fieldMappingRepo.save(fieldMapping);
  }

  // ── AI field suggestion ───────────────────────────────────────────────────

  @Post(':id/suggest-fields')
  @ApiOperation({ summary: 'AI-suggest field mappings for an existing mapping using AWS Bedrock' })
  async suggestFields(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { context?: string },
  ): Promise<{ suggestions: Array<{ sourcePath: string; targetPath: string; transformationType: string; confidence: number; reasoning: string }> }> {
    const mapping = await this.mappingRepo.findOne({ where: { id }, relations: ['fieldMappings'] });
    if (!mapping) throw new NotFoundException(`Mapping ${id} not found`);

    const awsRegion = process.env.AWS_REGION;
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
    const modelId = process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';

    if (awsRegion && awsKey && awsSecret) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
        const client = new BedrockRuntimeClient({ region: awsRegion, credentials: { accessKeyId: awsKey, secretAccessKey: awsSecret } });

        const existing = (mapping.fieldMappings ?? []).map((f) => `${f.sourcePath} → ${f.targetPath}`).join('\n');
        const prompt = await this.aiPromptsService.buildPrompt(
          'mapping-suggest-fields',
          {
            sourceSystem: mapping.sourceSystem ?? 'unknown',
            targetSystem: mapping.targetSystem ?? 'unknown',
            productLine: mapping.productLine ?? 'general',
            existingMappings: existing ? `Existing mappings:\n${existing}` : '',
            additionalContext: body.context ? `Additional context: ${body.context}` : '',
          },
          // Hardcoded default — used only if DB row is missing
          `You are an expert in insurance data integration.
Suggest field mappings for a {{sourceSystem}} → {{targetSystem}} integration for product line: {{productLine}}.
{{existingMappings}}
{{additionalContext}}

Suggest 5-8 additional field mappings that are typical for this integration.
Respond ONLY with JSON array:
[
  {
    "sourcePath": "$.Quote.Premium",
    "targetPath": "rating.basePremium",
    "transformationType": "direct",
    "confidence": 0.95,
    "reasoning": "Direct premium amount mapping"
  }
]
transformationType must be one of: direct, expression, lookup, conditional, static, concat, split, uppercase, lowercase, trim, number, date, custom`,
        );

        const payload = { anthropic_version: 'bedrock-2023-05-31', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] };
        const cmd = new InvokeModelCommand({ modelId, body: Buffer.from(JSON.stringify(payload)), contentType: 'application/json', accept: 'application/json' });
        const res = await client.send(cmd);
        const text = JSON.parse(new TextDecoder().decode(res.body)).content[0].text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return { suggestions: JSON.parse(jsonMatch[0]) };
        }
      } catch (e) {
        // Fall through to generic suggestions
      }
    }

    // Generic fallback suggestions
    return {
      suggestions: [
        { sourcePath: '$.Quote.QuoteNumber', targetPath: 'policy.quoteId', transformationType: 'direct', confidence: 0.9, reasoning: 'Standard quote ID mapping' },
        { sourcePath: '$.Quote.EffectiveDate', targetPath: 'policy.effectiveDate', transformationType: 'date', confidence: 0.85, reasoning: 'Policy effective date' },
        { sourcePath: '$.Quote.AccountHolder.Name', targetPath: 'insured.name', transformationType: 'direct', confidence: 0.9, reasoning: 'Insured name from account holder' },
        { sourcePath: '$.Quote.Premium', targetPath: 'rating.totalPremium', transformationType: 'number', confidence: 0.95, reasoning: 'Total premium amount' },
        { sourcePath: '$.Quote.State', targetPath: 'insured.state', transformationType: 'uppercase', confidence: 0.85, reasoning: 'State code standardization' },
      ],
    };
  }

  // ── Parse text requirements → field suggestions ─────────────────────────

  @Post('parse-text')
  @ApiOperation({ summary: 'Parse plain text / JIRA requirements into field mapping suggestions using AI' })
  async parseText(
    @Body() body: { text: string; context?: { sourceSystem?: string; targetSystem?: string; productLine?: string } },
  ): Promise<{ suggestions: Array<{ sourcePath: string; targetPath: string; transformationType: string; confidence: number; reasoning: string }>; totalSuggestions: number; highConfidenceCount: number; averageConfidence: number }> {
    const awsRegion = process.env.AWS_REGION;
    const awsKey = process.env.AWS_ACCESS_KEY_ID;
    const awsSecret = process.env.AWS_SECRET_ACCESS_KEY;
    const modelId = process.env.BEDROCK_MODEL_ID ?? 'us.anthropic.claude-3-5-sonnet-20241022-v2:0';
    const ctx = body.context ?? {};

    if (awsRegion && awsKey && awsSecret) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { BedrockRuntimeClient, InvokeModelCommand } = require('@aws-sdk/client-bedrock-runtime');
        const client = new BedrockRuntimeClient({ region: awsRegion, credentials: { accessKeyId: awsKey, secretAccessKey: awsSecret } });

        const prompt = await this.aiPromptsService.buildPrompt(
          'mapping-parse-text',
          {
            sourceSystem: ctx.sourceSystem ?? 'unknown',
            targetSystem: ctx.targetSystem ?? 'unknown',
            productLine: ctx.productLine ?? 'general',
            requirementsText: body.text,
          },
          `You are an expert in insurance data integration. Parse the following requirements and extract field mapping definitions.
Source System: {{sourceSystem}}
Target System: {{targetSystem}}
Product Line: {{productLine}}

Requirements text:
{{requirementsText}}

Extract all field mappings mentioned. For each, provide:
- sourcePath: JSONPath or field name from the source system (use $.FieldName format)
- targetPath: target field name or path
- transformationType: one of direct, expression, lookup, conditional, static, concat, split, uppercase, lowercase, trim, number, date, custom
- confidence: 0.0 to 1.0
- reasoning: brief explanation

Respond ONLY with a JSON array:
[
  {
    "sourcePath": "$.Quote.QuoteNumber",
    "targetPath": "policy.quoteId",
    "transformationType": "direct",
    "confidence": 0.95,
    "reasoning": "Direct mapping of quote number to policy ID"
  }
]`,
        );

        const payload = { anthropic_version: 'bedrock-2023-05-31', max_tokens: 4000, messages: [{ role: 'user', content: prompt }] };
        const cmd = new InvokeModelCommand({ modelId, body: Buffer.from(JSON.stringify(payload)), contentType: 'application/json', accept: 'application/json' });
        const res = await client.send(cmd);
        const text = JSON.parse(new TextDecoder().decode(res.body)).content[0].text;
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const suggestions = JSON.parse(jsonMatch[0]);
          const highCount = suggestions.filter((s: any) => s.confidence >= 0.8).length;
          const avgConf = Math.round(suggestions.reduce((sum: number, s: any) => sum + s.confidence * 100, 0) / suggestions.length);
          return { suggestions, totalSuggestions: suggestions.length, highConfidenceCount: highCount, averageConfidence: avgConf };
        }
      } catch (e) {
        // Fall through to heuristic
      }
    }

    // Heuristic fallback: parse "map X to Y" patterns
    const lines = body.text.split('\n').filter((l) => l.trim());
    const suggestions: any[] = [];
    const mapPattern = /map\s+([^\s]+)\s+to\s+([^\s,\n]+)/gi;
    const arrowPattern = /([^\s]+)\s*(→|->)\s*([^\s,\n]+)/gi;

    for (const line of lines) {
      let match;
      mapPattern.lastIndex = 0;
      while ((match = mapPattern.exec(line)) !== null) {
        const src = match[1].replace(/^['"]|['"]$/g, '');
        const tgt = match[2].replace(/^['"]|['"]$/g, '');
        const type = line.toLowerCase().includes('lookup') ? 'lookup' : line.toLowerCase().includes('date') ? 'date' : 'direct';
        suggestions.push({ sourcePath: src.startsWith('$') ? src : `$.${src}`, targetPath: tgt, transformationType: type, confidence: 0.75, reasoning: `Parsed from: "${line.trim().substring(0, 80)}"` });
      }
      arrowPattern.lastIndex = 0;
      while ((match = arrowPattern.exec(line)) !== null) {
        const src = match[1].trim();
        const tgt = match[3].trim();
        if (src && tgt) {
          suggestions.push({ sourcePath: src.startsWith('$') ? src : `$.${src}`, targetPath: tgt, transformationType: 'direct', confidence: 0.7, reasoning: `Arrow mapping from: "${line.trim().substring(0, 80)}"` });
        }
      }
    }

    if (suggestions.length === 0) {
      // Generic suggestions when nothing parsed
      return {
        suggestions: [
          { sourcePath: '$.Quote.QuoteNumber', targetPath: 'policy.quoteId', transformationType: 'direct', confidence: 0.8, reasoning: 'Standard quote ID mapping' },
          { sourcePath: '$.Quote.EffectiveDate', targetPath: 'policy.effectiveDate', transformationType: 'date', confidence: 0.8, reasoning: 'Policy effective date' },
          { sourcePath: '$.Insured.Name', targetPath: 'insured.name', transformationType: 'direct', confidence: 0.85, reasoning: 'Insured name' },
          { sourcePath: '$.Quote.Premium', targetPath: 'rating.totalPremium', transformationType: 'number', confidence: 0.9, reasoning: 'Total premium amount' },
        ],
        totalSuggestions: 4, highConfidenceCount: 4, averageConfidence: 84,
      };
    }

    const highCount = suggestions.filter((s) => s.confidence >= 0.8).length;
    const avgConf = Math.round(suggestions.reduce((sum, s) => sum + s.confidence * 100, 0) / suggestions.length);
    return { suggestions, totalSuggestions: suggestions.length, highConfidenceCount: highCount, averageConfidence: avgConf };
  }

  // ── Parse CSV/Excel file → field suggestions ─────────────────────────────

  @Post('parse-excel')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Parse CSV/Excel file into field mapping suggestions' })
  async parseExcel(
    @UploadedFile() file: any,
  ): Promise<{ suggestions: any[]; totalSuggestions: number; highConfidenceCount: number; averageConfidence: number; filename: string }> {
    if (!file) throw new BadRequestException('No file uploaded');

    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n').filter((l: string) => l.trim());
    const suggestions: any[] = [];

    // Skip header row if first line contains header keywords
    const startIdx = (lines[0] ?? '').toLowerCase().includes('source') || (lines[0] ?? '').toLowerCase().includes('field') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const cols = lines[i].split(/[,\t]/).map((c: string) => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 2 && cols[0] && cols[1]) {
        const src = cols[0];
        const tgt = cols[1];
        const transformType = cols[2] ?? 'direct';
        const description = cols[3] ?? '';
        suggestions.push({
          sourcePath: src.startsWith('$') ? src : `$.${src}`,
          targetPath: tgt,
          transformationType: ['direct', 'expression', 'lookup', 'conditional', 'static', 'concat', 'split', 'uppercase', 'lowercase', 'trim', 'number', 'date', 'custom'].includes(transformType.toLowerCase()) ? transformType.toLowerCase() : 'direct',
          confidence: 0.85,
          reasoning: description || `Imported from ${file.originalname} row ${i + 1}`,
        });
      }
    }

    const highCount = suggestions.filter((s) => s.confidence >= 0.8).length;
    const avgConf = suggestions.length ? Math.round(suggestions.reduce((sum, s) => sum + s.confidence * 100, 0) / suggestions.length) : 0;
    return { suggestions, totalSuggestions: suggestions.length, highConfidenceCount: highCount, averageConfidence: avgConf, filename: file.originalname };
  }

  // ── Create mapping with bulk field mappings ───────────────────────────────

  @Post('create-with-fields')
  @ApiOperation({ summary: 'Create a mapping and its field mappings atomically' })
  async createWithFields(
    @Body() body: {
      name: string; sourceSystem: string; targetSystem: string; productLine?: string;
      productLineCode?: string; description?: string; version?: string; creationMethod?: string;
      fieldMappings?: Array<{ sourcePath: string; targetPath: string; transformationType?: string; description?: string; confidence?: number }>;
    },
  ): Promise<Mapping> {
    const { fieldMappings = [], ...mappingData } = body;
    const mapping = this.mappingRepo.create({
      ...mappingData,
      status: 'draft' as any,
      version: mappingData.version ?? '1.0.0',
      creationMethod: (mappingData.creationMethod ?? 'manual') as any,
    });
    const saved = (await this.mappingRepo.save(mapping)) as Mapping;

    if (fieldMappings.length > 0) {
      const fields = fieldMappings.map((f) =>
        this.fieldMappingRepo.create({
          mappingId: saved.id,
          sourcePath: f.sourcePath,
          targetPath: f.targetPath,
          transformationType: (f.transformationType ?? 'direct') as any,
          description: f.description,
        }),
      );
      await this.fieldMappingRepo.save(fields);
    }

    return this.mappingRepo.findOne({ where: { id: saved.id }, relations: ['fieldMappings'] }) as Promise<Mapping>;
  }

  // ── Test mapping ──────────────────────────────────────────────────────────

  @Post(':id/test')
  @ApiOperation({ summary: 'Test a mapping: runs source JSON through the transformation engine, returns per-field audit trail' })
  async testMapping(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { data: any },
  ) {
    const mapping = await this.mappingRepo.findOne({ where: { id }, relations: ['fieldMappings'] });
    if (!mapping) throw new NotFoundException(`Mapping ${id} not found`);

    const result = await this.transformationEngine.execute(
      mapping.fieldMappings ?? [],
      body.data ?? {},
      (tableKey, key) => this.lookupTablesService.lookup(tableKey, key),
    );

    return {
      output: result.output,
      fieldResults: result.fieldResults,
      summary: {
        total: result.fieldResults.length,
        success: result.successCount,
        skipped: result.skippedCount,
        errors: result.errorCount,
        durationMs: result.durationMs,
      },
    };
  }

  @Put(':id/fields/:fieldId')
  @ApiOperation({ summary: 'Update a field mapping' })
  async updateField(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() body: Partial<FieldMapping>,
  ): Promise<FieldMapping> {
    const existing = await this.fieldMappingRepo.findOne({ where: { id: fieldId, mappingId: id } });
    if (!existing) throw new NotFoundException(`Field mapping ${fieldId} not found`);
    await this.fieldMappingRepo.update(fieldId, body);
    return this.fieldMappingRepo.findOne({ where: { id: fieldId } }) as Promise<FieldMapping>;
  }

  @Delete(':id/fields/:fieldId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a field mapping' })
  async removeField(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
  ): Promise<void> {
    const existing = await this.fieldMappingRepo.findOne({ where: { id: fieldId, mappingId: id } });
    if (!existing) throw new NotFoundException(`Field mapping ${fieldId} not found`);
    await this.fieldMappingRepo.delete(fieldId);
  }
}
