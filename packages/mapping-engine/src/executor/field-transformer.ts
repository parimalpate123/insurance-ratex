/**
 * Field Transformer - Transform individual fields based on mapping rules
 */

import { JSONPath } from 'jsonpath-plus';
import { get, set } from 'lodash';
import {
  FieldMapping,
  MappingContext,
  MappingError,
  TransformationType,
  LookupTable,
} from '../types/mapping.types';

export class FieldTransformer {
  /**
   * Transform a single field based on mapping configuration
   */
  transform(
    mapping: FieldMapping,
    context: MappingContext
  ): { value: any; error?: MappingError } {
    try {
      // Get source value
      const sourceValue = this.getSourceValue(mapping.sourceField, context.sourceData);

      // Check if required
      if (mapping.required && (sourceValue === null || sourceValue === undefined)) {
        return {
          value: undefined,
          error: {
            field: mapping.targetField,
            sourceField: mapping.sourceField,
            message: `Required field is missing`,
            code: 'REQUIRED_FIELD_MISSING',
          },
        };
      }

      // Apply transformation
      let transformedValue: any;

      switch (mapping.transformationType) {
        case 'direct':
          transformedValue = sourceValue;
          break;

        case 'constant':
          transformedValue = mapping.constantValue;
          break;

        case 'lookup':
          transformedValue = this.applyLookup(sourceValue, mapping, context);
          break;

        case 'expression':
          transformedValue = this.applyExpression(sourceValue, mapping, context);
          break;

        case 'function':
          transformedValue = this.applyFunction(sourceValue, mapping, context);
          break;

        case 'conditional':
          transformedValue = this.applyConditional(sourceValue, mapping, context);
          break;

        case 'concat':
          transformedValue = this.applyConcat(mapping, context);
          break;

        case 'split':
          transformedValue = this.applySplit(sourceValue, mapping);
          break;

        case 'format':
          transformedValue = this.applyFormat(sourceValue, mapping);
          break;

        case 'default':
          transformedValue =
            sourceValue !== null && sourceValue !== undefined
              ? sourceValue
              : mapping.defaultValue;
          break;

        default:
          transformedValue = sourceValue;
      }

      return { value: transformedValue };
    } catch (error: any) {
      return {
        value: undefined,
        error: {
          field: mapping.targetField,
          sourceField: mapping.sourceField,
          message: `Transformation failed: ${error.message}`,
          code: 'TRANSFORMATION_ERROR',
        },
      };
    }
  }

  /**
   * Get value from source using JSONPath
   */
  private getSourceValue(path: string, sourceData: any): any {
    try {
      // Try JSONPath first
      if (path.startsWith('$')) {
        const results = JSONPath({ path, json: sourceData });
        return results.length > 0 ? results[0] : undefined;
      }

      // Fallback to lodash get
      return get(sourceData, path);
    } catch {
      return undefined;
    }
  }

  /**
   * Apply lookup table transformation
   */
  private applyLookup(
    value: any,
    mapping: FieldMapping,
    context: MappingContext
  ): any {
    if (!mapping.lookupTable) {
      throw new Error('Lookup table name not specified');
    }

    const table = context.lookupTables?.[mapping.lookupTable];
    if (!table) {
      throw new Error(`Lookup table not found: ${mapping.lookupTable}`);
    }

    const key = mapping.lookupKey ? get(value, mapping.lookupKey) : value;
    const result = table.entries[key];

    if (result !== undefined) {
      return result;
    }

    // Return default if provided
    if (mapping.lookupDefault !== undefined) {
      return mapping.lookupDefault;
    }

    if (table.defaultValue !== undefined) {
      return table.defaultValue;
    }

    throw new Error(`Lookup key not found: ${key}`);
  }

  /**
   * Apply JavaScript expression
   */
  private applyExpression(
    value: any,
    mapping: FieldMapping,
    context: MappingContext
  ): any {
    if (!mapping.expression) {
      throw new Error('Expression not specified');
    }

    try {
      // Create function from expression
      const func = new Function('value', 'context', `return ${mapping.expression}`);
      return func(value, context);
    } catch (error: any) {
      throw new Error(`Expression evaluation failed: ${error.message}`);
    }
  }

  /**
   * Apply custom function
   */
  private applyFunction(
    value: any,
    mapping: FieldMapping,
    context: MappingContext
  ): any {
    if (!mapping.functionName) {
      throw new Error('Function name not specified');
    }

    const func = context.customFunctions?.[mapping.functionName];
    if (!func) {
      throw new Error(`Custom function not found: ${mapping.functionName}`);
    }

    const args = mapping.functionArgs || [];
    return func(value, context, ...args);
  }

  /**
   * Apply conditional logic
   */
  private applyConditional(
    value: any,
    mapping: FieldMapping,
    context: MappingContext
  ): any {
    if (!mapping.condition) {
      throw new Error('Condition not specified');
    }

    try {
      const func = new Function('value', 'context', `return ${mapping.condition}`);
      const result = func(value, context);

      return result ? mapping.trueValue : mapping.falseValue;
    } catch (error: any) {
      throw new Error(`Condition evaluation failed: ${error.message}`);
    }
  }

  /**
   * Concatenate multiple fields
   */
  private applyConcat(mapping: FieldMapping, context: MappingContext): any {
    if (!mapping.concatFields || mapping.concatFields.length === 0) {
      throw new Error('Concat fields not specified');
    }

    const separator = mapping.concatSeparator || '';
    const values = mapping.concatFields
      .map((field) => this.getSourceValue(field, context.sourceData))
      .filter((v) => v !== null && v !== undefined);

    return values.join(separator);
  }

  /**
   * Split a field value
   */
  private applySplit(value: any, mapping: FieldMapping): any {
    if (typeof value !== 'string') {
      throw new Error('Split can only be applied to string values');
    }

    const separator = mapping.splitSeparator || ' ';
    const parts = value.split(separator);

    if (mapping.splitIndex !== undefined) {
      return parts[mapping.splitIndex] || null;
    }

    return parts;
  }

  /**
   * Format a value
   */
  private applyFormat(value: any, mapping: FieldMapping): any {
    if (!mapping.formatType) {
      return value;
    }

    switch (mapping.formatType) {
      case 'date':
        return this.formatDate(value, mapping.format);

      case 'currency':
        return this.formatCurrency(value, mapping.format);

      case 'number':
        return this.formatNumber(value, mapping.format);

      case 'phone':
        return this.formatPhone(value);

      case 'custom':
        if (!mapping.format) {
          throw new Error('Custom format string not specified');
        }
        return this.applyCustomFormat(value, mapping.format);

      default:
        return value;
    }
  }

  /**
   * Format date
   */
  private formatDate(value: any, format?: string): string {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date value');
    }

    // Simple ISO format by default
    if (!format || format === 'iso') {
      return date.toISOString();
    }

    // Add more format options as needed
    return date.toISOString();
  }

  /**
   * Format currency
   */
  private formatCurrency(value: any, format?: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Invalid currency value');
    }

    const currency = format || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(num);
  }

  /**
   * Format number
   */
  private formatNumber(value: any, format?: string): string {
    const num = parseFloat(value);
    if (isNaN(num)) {
      throw new Error('Invalid number value');
    }

    const decimals = format ? parseInt(format) : 2;
    return num.toFixed(decimals);
  }

  /**
   * Format phone number
   */
  private formatPhone(value: any): string {
    const cleaned = ('' + value).replace(/\D/g, '');

    if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
    }

    if (cleaned.length === 11 && cleaned[0] === '1') {
      return `+1 (${cleaned.substring(1, 4)}) ${cleaned.substring(4, 7)}-${cleaned.substring(7)}`;
    }

    return value;
  }

  /**
   * Apply custom format string
   */
  private applyCustomFormat(value: any, format: string): string {
    // Simple placeholder replacement: {0} -> value
    return format.replace('{0}', value);
  }
}
