import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Pipeline } from '../../entities/pipeline.entity';
import { SystemEntity } from '../../entities/system.entity';
import { Mapping } from '../../entities/mapping.entity';
import { FieldMapping } from '../../entities/field-mapping.entity';
import { ConditionalRule } from '../../entities/conditional-rule.entity';
import { TransformationEngine } from '../mappings/transformation.engine';
import { LookupTablesService } from '../lookup-tables/lookup-tables.service';
import { jsonToXml, xmlToJson, jsonToSoap, soapToJson } from './adapters/format.adapter';

export interface PipelineExecutionResult {
  pipelineId: string;
  pipelineName: string;
  success: boolean;
  input: any;
  output: any;
  steps: StepResult[];
  durationMs: number;
  error?: string;
}

export interface StepResult {
  stepOrder: number;
  stepType: string;
  name: string;
  success: boolean;
  durationMs: number;
  detail?: any;
  error?: string;
}

@Injectable()
export class PipelineExecutionService {
  private readonly logger = new Logger(PipelineExecutionService.name);

  constructor(
    @InjectRepository(Pipeline)
    private readonly pipelineRepo: Repository<Pipeline>,
    @InjectRepository(Mapping)
    private readonly mappingRepo: Repository<Mapping>,
    @InjectRepository(FieldMapping)
    private readonly fieldMappingRepo: Repository<FieldMapping>,
    @InjectRepository(ConditionalRule)
    private readonly ruleRepo: Repository<ConditionalRule>,
    @InjectRepository(SystemEntity)
    private readonly systemRepo: Repository<SystemEntity>,
    private readonly transformationEngine: TransformationEngine,
    private readonly lookupTablesService: LookupTablesService,
  ) {}

  async execute(pipelineId: string, inputData: any): Promise<PipelineExecutionResult> {
    const start = Date.now();
    const pipeline = await this.pipelineRepo.findOne({
      where: { id: pipelineId },
      relations: ['steps', 'routingRules'],
    });
    if (!pipeline) throw new NotFoundException(`Pipeline ${pipelineId} not found`);

    const activeSteps = (pipeline.steps || [])
      .filter((s) => s.isActive)
      .sort((a, b) => a.stepOrder - b.stepOrder);

    let context: any = { ...inputData };
    const stepResults: StepResult[] = [];

    for (const step of activeSteps) {
      const stepStart = Date.now();
      const stepResult: StepResult = {
        stepOrder: step.stepOrder,
        stepType: step.stepType,
        name: step.name || step.stepType,
        success: false,
        durationMs: 0,
      };

      try {
        switch (step.stepType) {
          // ── New clean step types ──────────────────────────────────────
          case 'validate':
            context = this.runValidate(step.config, context, stepResult);
            break;

          case 'map_request':
          case 'transform': // legacy alias
            context = await this.runTransform(step.config, context, stepResult, pipelineId);
            break;

          case 'apply_rules':
          case 'execute_rules': // legacy alias
            context = await this.runRules(step.config, context, stepResult, pipelineId);
            break;

          case 'call_system':
            context = await this.callSystem(step.config, context, stepResult);
            break;

          case 'map_response':
          case 'transform_response': // legacy alias
            context = await this.runTransformResponse(step.config, context, stepResult, pipelineId);
            break;

          case 'apply_response_rules':
            context = await this.runResponseRules(step.config, context, stepResult, pipelineId);
            break;

          case 'enrich':
            context = await this.runEnrich(step.config, context, stepResult);
            break;

          case 'mock_response':
            context = this.mockResponse(step.config, context, stepResult);
            break;
        }
        stepResult.success = true;
      } catch (err) {
        stepResult.success = false;
        stepResult.error = err.message;
        this.logger.error(`Step ${step.stepOrder} (${step.stepType}) failed: ${err.message}`);
        // Stop pipeline on step failure
        stepResult.durationMs = Date.now() - stepStart;
        stepResults.push(stepResult);
        return {
          pipelineId,
          pipelineName: pipeline.name,
          success: false,
          input: inputData,
          output: context,
          steps: stepResults,
          durationMs: Date.now() - start,
          error: `Step ${step.stepOrder} "${stepResult.name}" failed: ${err.message}`,
        };
      }

      stepResult.durationMs = Date.now() - stepStart;
      stepResults.push(stepResult);
    }

    return {
      pipelineId,
      pipelineName: pipeline.name,
      success: true,
      input: inputData,
      output: context,
      steps: stepResults,
      durationMs: Date.now() - start,
    };
  }

  // ── Step handlers ────────────────────────────────────────────────────────

  private async runTransform(
    config: any,
    context: any,
    stepResult: StepResult,
    pipelineId: string,
  ): Promise<any> {
    // Auto-discover all ACTIVE REQUEST mappings linked to this pipeline, ordered by exec_order
    const activeMappings = await this.mappingRepo.find({
      where: { pipelineId, status: 'active', direction: 'request' },
      order: { execOrder: 'ASC', createdAt: 'ASC' } as any,
    });

    if (!activeMappings.length) {
      stepResult.detail = { note: 'No active mappings linked to this pipeline — skipped' };
      return context;
    }

    const lookupFn = (tableKey: string, key: string) =>
      this.lookupTablesService.lookup(tableKey, key);

    let mergedOutput = { ...context };
    const mappingDetails: any[] = [];

    for (const mapping of activeMappings) {
      const fieldMappings = await this.fieldMappingRepo.find({
        where: { mappingId: mapping.id },
        order: { createdAt: 'ASC' } as any,
      });
      if (!fieldMappings.length) continue;

      const result = await this.transformationEngine.execute(fieldMappings, mergedOutput, lookupFn);
      mergedOutput = { ...mergedOutput, ...result.output };
      mappingDetails.push({
        mappingId: mapping.id,
        mappingName: mapping.name,
        successCount: result.successCount,
        errorCount: result.errorCount,
        skippedCount: result.skippedCount,
      });
    }

    stepResult.detail = { mappingsRun: mappingDetails };
    return mergedOutput;
  }

  private async runTransformResponse(
    config: any,
    context: any,
    stepResult: StepResult,
    pipelineId: string,
  ): Promise<any> {
    // Auto-discover all ACTIVE RESPONSE mappings linked to this pipeline
    const responseMappings = await this.mappingRepo.find({
      where: { pipelineId, status: 'active', direction: 'response' },
      order: { execOrder: 'ASC', createdAt: 'ASC' } as any,
    });

    if (!responseMappings.length) {
      stepResult.detail = { note: 'No active response mappings linked to this pipeline — skipped' };
      return context;
    }

    // Source data for response transform is context.response (the target system reply)
    const responseData = context.response ?? {};
    const lookupFn = (tableKey: string, key: string) =>
      this.lookupTablesService.lookup(tableKey, key);

    let mergedOutput = { ...responseData };
    const mappingDetails: any[] = [];

    for (const mapping of responseMappings) {
      const fieldMappings = await this.fieldMappingRepo.find({
        where: { mappingId: mapping.id },
        order: { createdAt: 'ASC' } as any,
      });
      if (!fieldMappings.length) continue;

      const result = await this.transformationEngine.execute(fieldMappings, mergedOutput, lookupFn);
      mergedOutput = { ...mergedOutput, ...result.output };
      mappingDetails.push({
        mappingId: mapping.id,
        mappingName: mapping.name,
        successCount: result.successCount,
        errorCount: result.errorCount,
      });
    }

    stepResult.detail = { responseMappingsRun: mappingDetails };
    // Merge transformed response output back into top-level context
    return { ...context, ...mergedOutput };
  }

  private async runRules(
    config: any,
    context: any,
    stepResult: StepResult,
    pipelineId: string,
  ): Promise<any> {
    // Auto-discover all ACTIVE rules linked to this pipeline, ordered by exec_order then priority
    const activeRules = await this.ruleRepo.find({
      where: { pipelineId, status: 'active' },
      relations: ['conditions', 'actions'],
      order: { execOrder: 'ASC', priority: 'DESC' } as any,
    });

    if (!activeRules.length) {
      stepResult.detail = { note: 'No active rules linked to this pipeline — skipped' };
      return context;
    }

    // Evaluate each rule's conditions against context
    const ruleResults: any[] = [];
    const appliedActions: any[] = [];

    for (const rule of activeRules) {
      const conditionsMet = this.evaluateConditions(rule.conditions || [], context);
      if (conditionsMet) {
        for (const action of rule.actions || []) {
          if (action.actionType === 'set_value' && action.targetField) {
            context = this.setByPath(context, action.targetField, action.value);
          }
          appliedActions.push({ ruleId: rule.id, ruleName: rule.name, action: action.actionType, target: action.targetField });
        }
      }
      ruleResults.push({ ruleId: rule.id, name: rule.name, matched: conditionsMet });
    }

    stepResult.detail = { rulesEvaluated: ruleResults.length, actionsApplied: appliedActions };
    return context;
  }

  private evaluateConditions(conditions: any[], context: any): boolean {
    if (!conditions.length) return true;
    return conditions.every((cond) => {
      const val = this.getByPath(context, cond.fieldPath);
      const cv = cond.value;
      switch (cond.operator) {
        case 'equals': return String(val) === String(cv);
        case 'not_equals': return String(val) !== String(cv);
        case 'greater_than': return Number(val) > Number(cv);
        case 'less_than': return Number(val) < Number(cv);
        case 'contains': return String(val).includes(String(cv));
        case 'in': return (Array.isArray(cv) ? cv : String(cv).split(',')).includes(String(val));
        default: return false;
      }
    });
  }

  private getByPath(obj: any, path: string): any {
    return path.split('.').reduce((o, k) => (o != null ? o[k] : undefined), obj);
  }

  private setByPath(obj: any, path: string, value: any): any {
    const keys = path.split('.');
    const result = { ...obj };
    let cur: any = result;
    for (let i = 0; i < keys.length - 1; i++) {
      cur[keys[i]] = { ...(cur[keys[i]] ?? {}) };
      cur = cur[keys[i]];
    }
    cur[keys[keys.length - 1]] = value;
    return result;
  }

  private async callSystem(config: any, context: any, stepResult: StepResult): Promise<any> {
    const { systemCode, method = 'POST', path = '', requestMapping, responseMapping } = config;
    if (!systemCode) throw new Error('call_system step requires config.systemCode');

    const system = await this.systemRepo.findOne({ where: { code: systemCode } });
    if (!system) throw new Error(`System '${systemCode}' not found`);
    if (!system.isActive) throw new Error(`System '${systemCode}' is not active`);

    const url = `${system.baseUrl}${path}`;

    // Serialize request based on system format
    let requestBody: any;
    let contentType: string;
    if (system.format === 'xml') {
      requestBody = jsonToXml(context, 'RatingRequest');
      contentType = 'application/xml';
    } else if (system.format === 'soap') {
      requestBody = jsonToSoap(context, config.operationName || 'RateRequest');
      contentType = 'text/xml; charset=utf-8';
    } else {
      requestBody = context;
      contentType = 'application/json';
    }

    this.logger.log(`Calling system '${systemCode}' at ${url} (format: ${system.format})`);

    const response = await axios({
      method: method.toLowerCase(),
      url,
      data: requestBody,
      headers: {
        'Content-Type': contentType,
        ...system.headers,
      },
      timeout: 30000,
    });

    // Deserialize response
    let responseData: any;
    const respContentType = String(response.headers['content-type'] || '');
    if (respContentType.includes('xml') || system.format === 'xml') {
      responseData = xmlToJson(response.data);
    } else if (respContentType.includes('xml') || system.format === 'soap') {
      responseData = soapToJson(response.data);
    } else {
      responseData = typeof response.data === 'string'
        ? JSON.parse(response.data)
        : response.data;
    }

    stepResult.detail = {
      systemCode,
      url,
      format: system.format,
      statusCode: response.status,
    };

    return { ...context, response: responseData };
  }

  private mockResponse(config: any, context: any, stepResult: StepResult): any {
    const { response } = config;
    stepResult.detail = { note: 'Static mock response injected' };
    return { ...context, response: response ?? { mocked: true } };
  }

  // ── validate ─────────────────────────────────────────────────────────────────
  // References a schema file stored in the Knowledge Base (config.schemaFile).
  // Schema-based validation will be wired once the KB file-fetch is integrated.
  // For now: passes through and records which schema file is configured.
  private runValidate(config: any, context: any, stepResult: StepResult): any {
    const { schemaFile } = config;
    if (schemaFile) {
      this.logger.log(`Validate step: schema file '${schemaFile}' referenced — schema validation not yet enforced`);
      stepResult.detail = { schemaFile, status: 'pass-through — schema enforcement pending' };
    } else {
      stepResult.detail = { status: 'pass-through — no schema file configured' };
    }
    return context;
  }

  // ── apply_response_rules ──────────────────────────────────────────────────────
  // Same logic as apply_rules but operates on context.response instead of the
  // full context. Use this for post-rating adjustments (caps, surcharges, etc.)
  private async runResponseRules(
    config: any,
    context: any,
    stepResult: StepResult,
    pipelineId: string,
  ): Promise<any> {
    const activeRules = await this.ruleRepo.find({
      where: { pipelineId, status: 'active' },
      relations: ['conditions', 'actions'],
      order: { execOrder: 'ASC', priority: 'DESC' } as any,
    });

    if (!activeRules.length) {
      stepResult.detail = { note: 'No active rules linked to this pipeline — skipped' };
      return context;
    }

    // Apply rules against the response object
    let response = { ...(context.response ?? {}) };
    const ruleResults: any[] = [];
    const appliedActions: any[] = [];

    for (const rule of activeRules) {
      const conditionsMet = this.evaluateConditions(rule.conditions || [], response);
      if (conditionsMet) {
        for (const action of rule.actions || []) {
          if (action.actionType === 'set_value' && action.targetField) {
            response = this.setByPath(response, action.targetField, action.value);
          }
          appliedActions.push({ ruleId: rule.id, ruleName: rule.name, action: action.actionType, target: action.targetField });
        }
      }
      ruleResults.push({ ruleId: rule.id, name: rule.name, matched: conditionsMet });
    }

    stepResult.detail = { rulesEvaluated: ruleResults.length, actionsApplied: appliedActions };
    return { ...context, response };
  }

  // ── enrich ────────────────────────────────────────────────────────────────────
  // Enriches context fields by performing lookup table lookups.
  // config.lookups is an array of { sourceField, tableKey, targetField }
  // e.g. read context.classification.code, look up in 'state-class-mapping', write to context.classification.label
  private async runEnrich(config: any, context: any, stepResult: StepResult): Promise<any> {
    const lookups: Array<{ sourceField: string; tableKey: string; targetField: string }> =
      config.lookups ?? [];

    if (!lookups.length) {
      stepResult.detail = { note: 'No lookups configured — skipped' };
      return context;
    }

    const results: any[] = [];
    let enriched = { ...context };

    for (const lookup of lookups) {
      const sourceVal = this.getByPath(context, lookup.sourceField);
      if (sourceVal === undefined || sourceVal === null) {
        results.push({ sourceField: lookup.sourceField, status: 'skipped', reason: 'source value is null/undefined' });
        continue;
      }
      try {
        const found = await this.lookupTablesService.lookup(lookup.tableKey, String(sourceVal));
        enriched = this.setByPath(enriched, lookup.targetField, found);
        results.push({ sourceField: lookup.sourceField, tableKey: lookup.tableKey, targetField: lookup.targetField, value: found, status: 'hit' });
      } catch {
        results.push({ sourceField: lookup.sourceField, tableKey: lookup.tableKey, status: 'miss' });
      }
    }

    stepResult.detail = { lookupsRun: results };
    return enriched;
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  async route(productLine: string, sourceSystem: string, transactionType?: string): Promise<Pipeline | null> {
    const pipelines = await this.pipelineRepo.find({
      where: { status: 'active' },
      relations: ['steps', 'routingRules'],
    });

    // Score each pipeline by how specifically it matches the routing criteria
    let best: { pipeline: Pipeline; score: number } | null = null;

    for (const pipeline of pipelines) {
      for (const rule of pipeline.routingRules || []) {
        if (!rule.isActive) continue;
        let score = 0;
        if (rule.productLine && rule.productLine !== productLine) continue;
        if (rule.sourceSystem && rule.sourceSystem !== sourceSystem) continue;
        if (rule.transactionType && transactionType && rule.transactionType !== transactionType) continue;
        if (rule.productLine) score += 10;
        if (rule.sourceSystem) score += 5;
        if (rule.transactionType) score += 3;
        score += rule.priority;
        if (!best || score > best.score) best = { pipeline, score };
      }
    }

    return best ? best.pipeline : null;
  }
}
