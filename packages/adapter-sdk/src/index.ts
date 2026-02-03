/**
 * @insurratex/adapter-sdk
 * SDK for building policy system and rating engine adapters
 */

// Base adapters
export * from './adapters/base-adapter';
export * from './adapters/policy-system-adapter';
export * from './adapters/rating-engine-adapter';

// Types
export * from './types/adapter.types';

// Transformers
export * from './transformers/base-transformer';

// Utilities
export * from './utils/logger';

// Errors
export * from './errors/adapter-errors';

// Re-export CDM for convenience
export { Policy } from '@insurratex/cdm';
