/**
 * Core rule types and interfaces
 */

export type RuleType = 'lookup' | 'decision' | 'conditional';

export type RuleStatus = 'active' | 'inactive' | 'draft' | 'deprecated';

export interface BaseRule {
  id: string;
  name: string;
  description?: string;
  type: RuleType;
  status: RuleStatus;
  version: string;
  productLine?: string;
  state?: string;
  effectiveDate?: string;
  expirationDate?: string;
  priority?: number;
  tags?: string[];
  metadata?: {
    createdBy?: string;
    createdAt?: string;
    updatedBy?: string;
    updatedAt?: string;
  };
}

/**
 * Lookup Table Rule
 * Simple key-value mapping (e.g., state -> surcharge percentage)
 */
export interface LookupRule extends BaseRule {
  type: 'lookup';
  table: Record<string, any>;
  defaultValue?: any;
  keyField?: string; // Field to use as lookup key
}

/**
 * Decision Table Rule
 * Multi-dimensional table with conditions and outcomes
 */
export interface DecisionTableRule extends BaseRule {
  type: 'decision';
  conditions: DecisionCondition[];
  rows: DecisionRow[];
  defaultOutcome?: Record<string, any>;
}

export interface DecisionCondition {
  field: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'range';
}

export interface DecisionRow {
  conditions: Record<string, any>; // field -> value or range
  outcome: Record<string, any>;
  description?: string;
}

/**
 * Conditional Rule
 * If-then-else logic with complex conditions
 */
export interface ConditionalRule extends BaseRule {
  type: 'conditional';
  conditions: Condition[];
  actions: Action[];
  elseActions?: Action[];
}

export interface Condition {
  fact: string; // Field/fact to evaluate
  operator: ConditionOperator;
  value: any;
  path?: string; // JSONPath for nested fields
}

export type ConditionOperator =
  | 'equal'
  | 'notEqual'
  | 'lessThan'
  | 'lessThanInclusive'
  | 'greaterThan'
  | 'greaterThanInclusive'
  | 'in'
  | 'notIn'
  | 'contains'
  | 'doesNotContain';

export interface Action {
  type: 'set' | 'add' | 'multiply' | 'apply' | 'log';
  field?: string;
  value?: any;
  function?: string;
}

export type Rule = LookupRule | DecisionTableRule | ConditionalRule;

/**
 * Rule evaluation context
 */
export interface RuleContext {
  facts: Record<string, any>; // Input data for rule evaluation
  results: Record<string, any>; // Accumulated results
  metadata?: {
    ruleId?: string;
    evaluationTime?: number;
    rulesEvaluated?: number;
  };
}

/**
 * Rule evaluation result
 */
export interface RuleResult {
  success: boolean;
  matched: boolean;
  value?: any;
  actions?: Action[];
  error?: RuleError;
  metadata?: {
    ruleId: string;
    ruleName: string;
    evaluationTime: number;
  };
}

export interface RuleError {
  code: string;
  message: string;
  details?: any;
}

/**
 * Rule set - group of related rules
 */
export interface RuleSet {
  id: string;
  name: string;
  description?: string;
  rules: string[]; // Rule IDs
  evaluationOrder?: 'priority' | 'sequence' | 'all';
  stopOnFirstMatch?: boolean;
}
