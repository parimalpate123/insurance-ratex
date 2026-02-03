/**
 * Base transformer for converting between CDM and system-specific formats
 */

import { Policy } from '@insurratex/cdm';
import { TransformationError } from '../errors/adapter-errors';
import { AdapterLogger, ConsoleLogger } from '../utils/logger';

export interface TransformationContext {
  sourceSystem: string;
  targetSystem: string;
  version?: string;
  metadata?: Record<string, any>;
}

export interface TransformationResult<T = any> {
  success: boolean;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
  warnings?: Array<{ field: string; message: string }>;
}

/**
 * Abstract base class for data transformers
 */
export abstract class BaseTransformer<TSource = any, TTarget = any> {
  protected logger: AdapterLogger;

  constructor(logger?: AdapterLogger) {
    this.logger = logger || new ConsoleLogger();
  }

  /**
   * Transform from source format to target format
   */
  abstract transform(
    source: TSource,
    context?: TransformationContext
  ): TransformationResult<TTarget>;

  /**
   * Reverse transform from target format to source format
   */
  abstract reverseTransform(
    target: TTarget,
    context?: TransformationContext
  ): TransformationResult<TSource>;

  /**
   * Validate source data before transformation
   */
  protected validateSource(source: TSource): Array<{ field: string; message: string }> {
    const errors: Array<{ field: string; message: string }> = [];

    if (!source) {
      errors.push({ field: 'source', message: 'Source data is null or undefined' });
    }

    return errors;
  }

  /**
   * Create success result
   */
  protected createSuccessResult<T>(data: T, warnings?: Array<{ field: string; message: string }>): TransformationResult<T> {
    return {
      success: true,
      data,
      warnings,
    };
  }

  /**
   * Create error result
   */
  protected createErrorResult<T>(
    errors: Array<{ field: string; message: string }>
  ): TransformationResult<T> {
    return {
      success: false,
      errors,
    };
  }

  /**
   * Safe field access with default value
   */
  protected getField<T>(obj: any, path: string, defaultValue?: T): T | undefined {
    try {
      const value = path.split('.').reduce((curr, key) => curr?.[key], obj);
      return value !== undefined ? value : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  /**
   * Safe field set
   */
  protected setField(obj: any, path: string, value: any): void {
    const keys = path.split('.');
    const lastKey = keys.pop()!;
    const target = keys.reduce((curr, key) => {
      if (!curr[key]) curr[key] = {};
      return curr[key];
    }, obj);
    target[lastKey] = value;
  }
}

/**
 * CDM to External System Transformer
 */
export abstract class CDMTransformer<TExternal = any> extends BaseTransformer<
  Policy,
  TExternal
> {
  /**
   * Transform CDM Policy to external system format
   */
  abstract toCDM(external: TExternal, context?: TransformationContext): TransformationResult<Policy>;

  /**
   * Transform external system format to CDM Policy
   */
  abstract fromCDM(policy: Policy, context?: TransformationContext): TransformationResult<TExternal>;

  // Implement base transformer methods
  transform(policy: Policy, context?: TransformationContext): TransformationResult<TExternal> {
    return this.fromCDM(policy, context);
  }

  reverseTransform(external: TExternal, context?: TransformationContext): TransformationResult<Policy> {
    return this.toCDM(external, context);
  }
}
