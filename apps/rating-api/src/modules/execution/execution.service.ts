import { Injectable, Logger } from '@nestjs/common';
import { WorkflowEngine } from '../workflows/workflow-engine.service';
import { RatingRequest, RatingResponse } from '@rating-poc/shared-types';

@Injectable()
export class ExecutionService {
  private readonly logger = new Logger(ExecutionService.name);

  constructor(private readonly workflowEngine: WorkflowEngine) {}

  /**
   * Execute rating for a specific product line
   */
  async executeRating(request: RatingRequest): Promise<RatingResponse> {
    const { productLineCode, data, context } = request;

    this.logger.log(`Rating execution request for: ${productLineCode}`);

    try {
      const result = await this.workflowEngine.executeWorkflow(
        productLineCode,
        data,
        context,
      );

      return {
        success: true,
        productLineCode,
        result: result.result,
        metadata: result.metadata,
      };
    } catch (error: any) {
      this.logger.error(`Rating execution failed: ${error.message}`);

      return {
        success: false,
        productLineCode,
        error: {
          code: 'EXECUTION_ERROR',
          message: error.message,
          details: error.response?.data || undefined,
        },
        metadata: {
          executionTimeMs: 0,
          workflowSteps: [],
          timestamp: new Date().toISOString(),
        },
      };
    }
  }
}
