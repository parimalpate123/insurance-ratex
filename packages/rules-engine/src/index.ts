/**
 * @insurratex/rules-engine
 * Business rules engine for insurance rating and policy management
 */

// Types
export * from './types/rule.types';

// Storage
export * from './storage/rule-registry';

// Evaluator
export * from './evaluator/rule-evaluator';
export * from './evaluator/rules-engine';

// Re-export CDM for convenience
export { Policy } from '@insurratex/cdm';
