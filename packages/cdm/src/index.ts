/**
 * @insurratex/cdm - Canonical Data Model
 * Central export point for all CDM types, validators, and utilities
 */

// Base types
export * from './types/base.types';

// Product-line extensions
export * from './types/extensions/gl.types';
export * from './types/extensions/property.types';
export * from './types/extensions/inland-marine.types';

// Validators
export * from './validators/base.validator';

// Version management
export * from './version-registry';

// Re-export commonly used external dependencies
export { validate, ValidationError as ClassValidationError } from 'class-validator';
export { plainToClass, classToPlain } from 'class-transformer';
