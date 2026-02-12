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
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MappingsService } from './mappings.service';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';

@ApiTags('Mappings')
@Controller('api/v1/mappings')
export class MappingsController {
  constructor(
    private readonly mappingsService: MappingsService,
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
        const prompt = `You are an expert in insurance data integration.
Suggest field mappings for a ${mapping.sourceSystem} → ${mapping.targetSystem} integration for product line: ${mapping.productLine}.
${existing ? `Existing mappings:\n${existing}\n` : ''}
${body.context ? `Additional context: ${body.context}\n` : ''}

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
transformationType must be one of: direct, expression, lookup, conditional, static, concat, split, uppercase, lowercase, trim, number, date, custom`;

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
