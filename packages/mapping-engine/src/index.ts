/**
 * @insurratex/mapping-engine
 * Mapping engine for data transformation between insurance systems
 */

// Types
export * from './types/mapping.types';

// Registry
export * from './registry/mapping-registry';

// Executor
export * from './executor/mapping-executor';
export * from './executor/field-transformer';

// Re-export CDM for convenience
export { Policy } from '@insurratex/cdm';
