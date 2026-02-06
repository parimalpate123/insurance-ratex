import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ProductLinesService } from '../product-lines/product-lines.service';
import { MappingsService } from '../mappings/mappings.service';
import { RulesService } from '../rules/rules.service';
import { WorkflowStep } from '@rating-poc/shared-types';
import axios from 'axios';

interface WorkflowContext {
  productLineCode: string;
  input: any;
  transformed?: any;
  rulesResult?: any;
  output?: any;
  metadata: {
    steps: Array<{
      id: string;
      name: string;
      success: boolean;
      duration: number;
      error?: string;
    }>;
    startTime: number;
  };
}

@Injectable()
export class WorkflowEngine {
  private readonly logger = new Logger(WorkflowEngine.name);

  constructor(
    private readonly productLinesService: ProductLinesService,
    private readonly mappingsService: MappingsService,
    private readonly rulesService: RulesService,
  ) {}

  /**
   * Execute workflow for a product line
   */
  async executeWorkflow(
    productLineCode: string,
    inputData: any,
    requestContext?: any,
  ): Promise<any> {
    const startTime = Date.now();

    this.logger.log(`Executing workflow for product line: ${productLineCode}`);

    // Get product line configuration
    const config = await this.productLinesService.findByCode(productLineCode);

    if (config.status !== 'active') {
      throw new BadRequestException(
        `Product line '${productLineCode}' is not active (status: ${config.status})`,
      );
    }

    // Initialize workflow context
    const context: WorkflowContext = {
      productLineCode,
      input: inputData,
      metadata: {
        steps: [],
        startTime,
      },
    };

    // Execute each workflow step
    const steps = config.config.workflow.steps;

    for (const step of steps) {
      if (!step.enabled) {
        this.logger.debug(`Skipping disabled step: ${step.id}`);
        continue;
      }

      try {
        await this.executeStep(step, context, config.config);
      } catch (error: any) {
        this.logger.error(`Step ${step.id} failed: ${error.message}`);

        context.metadata.steps.push({
          id: step.id,
          name: step.name,
          success: false,
          duration: 0,
          error: error.message,
        });

        // Throw error to stop workflow execution
        throw new BadRequestException(
          `Workflow step '${step.name}' failed: ${error.message}`,
        );
      }
    }

    // Return final output with metadata
    return {
      success: true,
      productLineCode,
      result: context.output || context.transformed || context.input,
      metadata: {
        executionTimeMs: Date.now() - startTime,
        steps: context.metadata.steps,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Execute a single workflow step
   */
  private async executeStep(
    step: WorkflowStep,
    context: WorkflowContext,
    config: any,
  ): Promise<void> {
    const stepStart = Date.now();

    this.logger.debug(`Executing step: ${step.id} (${step.type})`);

    try {
      switch (step.type) {
        case 'system':
          await this.executeSystemStep(step, context, config);
          break;

        case 'plugin':
          await this.executePluginStep(step, context, config);
          break;

        case 'custom':
          await this.executeCustomStep(step, context, config);
          break;

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }

      // Record successful step execution
      context.metadata.steps.push({
        id: step.id,
        name: step.name,
        success: true,
        duration: Date.now() - stepStart,
      });

      this.logger.debug(`Step ${step.id} completed in ${Date.now() - stepStart}ms`);
    } catch (error: any) {
      // Record failed step execution
      context.metadata.steps.push({
        id: step.id,
        name: step.name,
        success: false,
        duration: Date.now() - stepStart,
        error: error.message,
      });

      throw error;
    }
  }

  /**
   * Execute system-defined steps
   */
  private async executeSystemStep(
    step: WorkflowStep,
    context: WorkflowContext,
    config: any,
  ): Promise<void> {
    switch (step.id) {
      case 'validate':
        await this.validateInput(context);
        break;

      case 'transform':
        await this.transformData(context, config);
        break;

      case 'rules':
        await this.executeRules(context, config);
        break;

      case 'calculate':
        await this.calculatePremium(context, config);
        break;

      case 'respond':
        await this.formatResponse(context, config);
        break;

      default:
        this.logger.warn(`Unknown system step: ${step.id}, skipping`);
    }
  }

  /**
   * Execute plugin-based steps (TODO: Phase 4)
   */
  private async executePluginStep(
    step: WorkflowStep,
    context: WorkflowContext,
    config: any,
  ): Promise<void> {
    // TODO: Implement plugin execution
    this.logger.warn(`Plugin step '${step.id}' not yet implemented, skipping`);
  }

  /**
   * Execute custom code steps (TODO: Future enhancement)
   */
  private async executeCustomStep(
    step: WorkflowStep,
    context: WorkflowContext,
    config: any,
  ): Promise<void> {
    // TODO: Implement custom step execution
    this.logger.warn(`Custom step '${step.id}' not yet implemented, skipping`);
  }

  /**
   * Validate input data
   */
  private async validateInput(context: WorkflowContext): Promise<void> {
    if (!context.input) {
      throw new Error('Input data is required');
    }

    // TODO: Add more comprehensive validation based on configuration
    this.logger.debug('Input validation passed');
  }

  /**
   * Transform data using mappings
   */
  private async transformData(context: WorkflowContext, config: any): Promise<void> {
    const integrations = config.integrations;
    const sourceSystem = integrations.sourceSystem.type;
    const targetSystem = integrations.targetSystems[0]?.type || 'unknown';

    this.logger.debug(`Transforming ${sourceSystem} → ${targetSystem}`);

    try {
      context.transformed = await this.mappingsService.transformData(
        context.productLineCode,
        sourceSystem,
        targetSystem,
        context.input,
      );

      this.logger.debug('Data transformation completed using mappings');
    } catch (error: any) {
      this.logger.error(`Mapping transformation failed: ${error.message}`);
      // Fallback: pass through input
      context.transformed = {
        ...context.input,
        _transformFailed: true,
        _transformError: error.message,
      };
    }
  }

  /**
   * Execute business rules
   */
  private async executeRules(context: WorkflowContext, config: any): Promise<void> {
    this.logger.debug('Executing business rules');

    try {
      const result = await this.rulesService.executeRules(
        context.productLineCode,
        context.transformed || context.input,
      );

      context.rulesResult = result.data;

      // Store rules applied in metadata
      if (!context.metadata) {
        context.metadata = { steps: [], startTime: Date.now() };
      }
      (context.metadata as any).rulesApplied = result.rulesApplied;

      this.logger.debug(`Rules execution completed: ${result.rulesApplied.length} rules applied`);
    } catch (error: any) {
      this.logger.error(`Rules execution failed: ${error.message}`);
      // Fallback: pass through transformed data
      context.rulesResult = {
        ...(context.transformed || context.input),
        _rulesFailed: true,
        _rulesError: error.message,
      };
    }
  }

  /**
   * Calculate premium by calling rating engine
   */
  private async calculatePremium(context: WorkflowContext, config: any): Promise<void> {
    const integrations = config.integrations;
    const targetSystem = integrations.targetSystems[0]; // Use first target system

    if (!targetSystem) {
      throw new Error('No target rating engine configured');
    }

    this.logger.debug(`Calling rating engine: ${targetSystem.type}`);

    try {
      // Prepare rating request
      const ratingRequest = context.rulesResult || context.transformed || context.input;

      // Call rating engine API
      const response = await axios.post(
        `${targetSystem.endpoint}/api/v1/rate`,
        ratingRequest,
        {
          timeout: 5000,
          headers: {
            'Content-Type': 'application/json',
            // TODO: Add authentication headers based on targetSystem.authentication
          },
        },
      );

      context.output = {
        ...ratingRequest,
        premium: response.data.totalPremium || response.data.premium,
        premiumBreakdown: response.data.breakdown || {},
        ratingEngine: targetSystem.type,
      };

      this.logger.debug(`Premium calculated: ${context.output.premium}`);
    } catch (error: any) {
      this.logger.warn(`Rating engine call failed: ${error.message}, using fallback`);

      // Fallback: simple premium calculation
      const basePremium = 10000;
      context.output = {
        ...(context.rulesResult || context.transformed || context.input),
        premium: basePremium,
        premiumBreakdown: {
          base: basePremium,
          adjustments: [],
        },
        ratingEngine: targetSystem.type,
        _fallback: true,
      };
    }
  }

  /**
   * Format final response
   */
  private async formatResponse(context: WorkflowContext, config: any): Promise<void> {
    // Output is already set by calculate step
    if (!context.output) {
      context.output = context.rulesResult || context.transformed || context.input;
    }

    this.logger.debug('Response formatting completed');
  }
}
