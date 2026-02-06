/**
 * Shared API types for rating execution and responses
 */

export interface RatingRequest {
  productLineCode: string;
  data: Record<string, any>;
  context?: {
    userId?: string;
    sessionId?: string;
    state?: string;
    [key: string]: any;
  };
}

export interface RatingResponse {
  success: boolean;
  productLineCode: string;
  result?: Record<string, any>;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    executionTimeMs: number;
    workflowSteps: string[];
    timestamp: string;
  };
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
  details?: any;
}
