/**
 * Mapping Executor - Execute mapping configurations
 */

import { set } from 'lodash';
import {
  MappingConfiguration,
  MappingContext,
  MappingResult,
  MappingError,
  MappingWarning,
} from '../types/mapping.types';
import { FieldTransformer } from './field-transformer';

export class MappingExecutor {
  private fieldTransformer: FieldTransformer;

  constructor() {
    this.fieldTransformer = new FieldTransformer();
  }

  /**
   * Execute a mapping configuration
   */
  execute(config: MappingConfiguration, sourceData: any): MappingResult {
    const startTime = Date.now();
    const errors: MappingError[] = [];
    const warnings: MappingWarning[] = [];
    const targetData: any = {};

    // Build context
    const context: MappingContext = {
      sourceData,
      targetData,
      lookupTables: config.lookupTables || {},
      customFunctions: this.buildCustomFunctions(config),
      variables: {},
    };

    let fieldsProcessed = 0;
    let fieldsMapped = 0;

    // Process each field mapping
    for (const mapping of config.mappings) {
      fieldsProcessed++;

      try {
        const result = this.fieldTransformer.transform(mapping, context);

        if (result.error) {
          errors.push(result.error);
          continue;
        }

        // Set value in target
        if (result.value !== undefined) {
          this.setTargetValue(targetData, mapping.targetField, result.value);
          fieldsMapped++;
        }

        // Validate if validators are specified
        if (mapping.validators && mapping.validators.length > 0) {
          const validationWarnings = this.validateField(
            mapping.targetField,
            result.value,
            mapping.validators
          );
          warnings.push(...validationWarnings);
        }
      } catch (error: any) {
        errors.push({
          field: mapping.targetField,
          sourceField: mapping.sourceField,
          message: `Unexpected error: ${error.message}`,
          code: 'UNEXPECTED_ERROR',
        });
      }
    }

    const executionTime = Date.now() - startTime;

    return {
      success: errors.length === 0,
      data: targetData,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
      metadata: {
        mappingId: config.id,
        direction: config.direction,
        executionTime,
        fieldsProcessed,
        fieldsMapped,
      },
    };
  }

  /**
   * Set value in target object using JSONPath
   */
  private setTargetValue(target: any, path: string, value: any): void {
    // Remove leading $ if present (JSONPath notation)
    const cleanPath = path.startsWith('$.') ? path.substring(2) : path;
    set(target, cleanPath, value);
  }

  /**
   * Build custom functions from configuration
   */
  private buildCustomFunctions(
    config: MappingConfiguration
  ): Record<string, Function> {
    const functions: Record<string, Function> = {};

    if (!config.customFunctions) {
      return functions;
    }

    for (const [name, code] of Object.entries(config.customFunctions)) {
      try {
        // Create function from code string
        // Code should be a function body that returns a value
        functions[name] = new Function('value', 'context', 'args', code);
      } catch (error: any) {
        console.error(`Failed to create custom function ${name}:`, error.message);
      }
    }

    return functions;
  }

  /**
   * Validate field value
   */
  private validateField(
    field: string,
    value: any,
    validators: string[]
  ): MappingWarning[] {
    const warnings: MappingWarning[] = [];

    for (const validator of validators) {
      const warning = this.applyValidator(field, value, validator);
      if (warning) {
        warnings.push(warning);
      }
    }

    return warnings;
  }

  /**
   * Apply a single validator
   */
  private applyValidator(
    field: string,
    value: any,
    validator: string
  ): MappingWarning | null {
    // Simple validator format: "type:param"
    const [type, param] = validator.split(':');

    switch (type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return {
            field,
            message: 'Required field is empty',
            code: 'REQUIRED_EMPTY',
            value,
          };
        }
        break;

      case 'min':
        if (typeof value === 'number' && value < parseFloat(param)) {
          return {
            field,
            message: `Value ${value} is less than minimum ${param}`,
            code: 'MIN_VALUE',
            value,
          };
        }
        break;

      case 'max':
        if (typeof value === 'number' && value > parseFloat(param)) {
          return {
            field,
            message: `Value ${value} exceeds maximum ${param}`,
            code: 'MAX_VALUE',
            value,
          };
        }
        break;

      case 'minLength':
        if (typeof value === 'string' && value.length < parseInt(param)) {
          return {
            field,
            message: `Length ${value.length} is less than minimum ${param}`,
            code: 'MIN_LENGTH',
            value,
          };
        }
        break;

      case 'maxLength':
        if (typeof value === 'string' && value.length > parseInt(param)) {
          return {
            field,
            message: `Length ${value.length} exceeds maximum ${param}`,
            code: 'MAX_LENGTH',
            value,
          };
        }
        break;

      case 'pattern':
        if (typeof value === 'string' && !new RegExp(param).test(value)) {
          return {
            field,
            message: `Value does not match pattern ${param}`,
            code: 'PATTERN_MISMATCH',
            value,
          };
        }
        break;

      case 'email':
        if (typeof value === 'string' && !this.isValidEmail(value)) {
          return {
            field,
            message: 'Invalid email format',
            code: 'INVALID_EMAIL',
            value,
          };
        }
        break;

      case 'url':
        if (typeof value === 'string' && !this.isValidUrl(value)) {
          return {
            field,
            message: 'Invalid URL format',
            code: 'INVALID_URL',
            value,
          };
        }
        break;

      case 'date':
        if (!this.isValidDate(value)) {
          return {
            field,
            message: 'Invalid date format',
            code: 'INVALID_DATE',
            value,
          };
        }
        break;
    }

    return null;
  }

  /**
   * Validate email format
   */
  private isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Validate URL format
   */
  private isValidUrl(value: string): boolean {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate date
   */
  private isValidDate(value: any): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime());
  }
}
