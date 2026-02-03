/**
 * Rule Evaluator - Evaluate rules against context
 */

import { get } from 'lodash';
import {
  Rule,
  LookupRule,
  DecisionTableRule,
  ConditionalRule,
  RuleContext,
  RuleResult,
  Condition,
  Action,
  DecisionRow,
} from '../types/rule.types';

export class RuleEvaluator {
  /**
   * Evaluate a rule against a context
   */
  evaluate(rule: Rule, context: RuleContext): RuleResult {
    const startTime = Date.now();

    try {
      let result: RuleResult;

      switch (rule.type) {
        case 'lookup':
          result = this.evaluateLookup(rule as LookupRule, context);
          break;
        case 'decision':
          result = this.evaluateDecisionTable(rule as DecisionTableRule, context);
          break;
        case 'conditional':
          result = this.evaluateConditional(rule as ConditionalRule, context);
          break;
        default:
          throw new Error(`Unknown rule type: ${(rule as any).type}`);
      }

      result.metadata = {
        ruleId: rule.id,
        ruleName: rule.name,
        evaluationTime: Date.now() - startTime,
      };

      return result;
    } catch (error: any) {
      return {
        success: false,
        matched: false,
        error: {
          code: 'EVALUATION_ERROR',
          message: error.message,
          details: error,
        },
        metadata: {
          ruleId: rule.id,
          ruleName: rule.name,
          evaluationTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Evaluate lookup rule
   */
  private evaluateLookup(rule: LookupRule, context: RuleContext): RuleResult {
    // Get the key from context
    const keyField = rule.keyField || 'key';
    const key = get(context.facts, keyField);

    if (key === undefined || key === null) {
      return {
        success: true,
        matched: false,
        value: rule.defaultValue,
      };
    }

    // Look up the value
    const value = rule.table[key];

    if (value !== undefined) {
      return {
        success: true,
        matched: true,
        value,
      };
    }

    // Return default if no match
    return {
      success: true,
      matched: false,
      value: rule.defaultValue,
    };
  }

  /**
   * Evaluate decision table rule
   */
  private evaluateDecisionTable(
    rule: DecisionTableRule,
    context: RuleContext
  ): RuleResult {
    // Find matching row
    for (const row of rule.rows) {
      if (this.rowMatches(row, rule.conditions, context)) {
        return {
          success: true,
          matched: true,
          value: row.outcome,
        };
      }
    }

    // No match, return default outcome
    return {
      success: true,
      matched: false,
      value: rule.defaultOutcome,
    };
  }

  /**
   * Check if a decision row matches the context
   */
  private rowMatches(
    row: DecisionRow,
    conditionDefs: any[],
    context: RuleContext
  ): boolean {
    for (const condDef of conditionDefs) {
      const rowCondition = row.conditions[condDef.field];
      const factValue = get(context.facts, condDef.field);

      if (!this.conditionMatches(rowCondition, factValue, condDef.type)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if a condition matches a value
   */
  private conditionMatches(condition: any, value: any, type: string): boolean {
    // Handle wildcard/any
    if (condition === '*' || condition === 'any') {
      return true;
    }

    // Handle range conditions
    if (typeof condition === 'object' && (condition.min !== undefined || condition.max !== undefined)) {
      if (condition.min !== undefined && value < condition.min) return false;
      if (condition.max !== undefined && value > condition.max) return false;
      return true;
    }

    // Handle array conditions (in/not in)
    if (Array.isArray(condition)) {
      return condition.includes(value);
    }

    // Direct equality
    return condition === value;
  }

  /**
   * Evaluate conditional rule
   */
  private evaluateConditional(
    rule: ConditionalRule,
    context: RuleContext
  ): RuleResult {
    // Evaluate all conditions
    const allConditionsMatch = rule.conditions.every((condition) =>
      this.evaluateCondition(condition, context)
    );

    if (allConditionsMatch) {
      return {
        success: true,
        matched: true,
        actions: rule.actions,
      };
    } else if (rule.elseActions) {
      return {
        success: true,
        matched: false,
        actions: rule.elseActions,
      };
    }

    return {
      success: true,
      matched: false,
    };
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: Condition, context: RuleContext): boolean {
    const factValue = condition.path
      ? get(context.facts, condition.path)
      : context.facts[condition.fact];

    switch (condition.operator) {
      case 'equal':
        return factValue === condition.value;

      case 'notEqual':
        return factValue !== condition.value;

      case 'lessThan':
        return factValue < condition.value;

      case 'lessThanInclusive':
        return factValue <= condition.value;

      case 'greaterThan':
        return factValue > condition.value;

      case 'greaterThanInclusive':
        return factValue >= condition.value;

      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(factValue);

      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(factValue);

      case 'contains':
        if (typeof factValue === 'string' && typeof condition.value === 'string') {
          return factValue.includes(condition.value);
        }
        if (Array.isArray(factValue)) {
          return factValue.includes(condition.value);
        }
        return false;

      case 'doesNotContain':
        if (typeof factValue === 'string' && typeof condition.value === 'string') {
          return !factValue.includes(condition.value);
        }
        if (Array.isArray(factValue)) {
          return !factValue.includes(condition.value);
        }
        return true;

      default:
        throw new Error(`Unknown operator: ${condition.operator}`);
    }
  }

  /**
   * Apply actions to context
   */
  applyActions(actions: Action[], context: RuleContext): void {
    for (const action of actions) {
      this.applyAction(action, context);
    }
  }

  /**
   * Apply a single action
   */
  private applyAction(action: Action, context: RuleContext): void {
    switch (action.type) {
      case 'set':
        if (action.field) {
          context.results[action.field] = action.value;
        }
        break;

      case 'add':
        if (action.field) {
          const current = context.results[action.field] || 0;
          context.results[action.field] = current + (action.value || 0);
        }
        break;

      case 'multiply':
        if (action.field) {
          const current = context.results[action.field] || 0;
          context.results[action.field] = current * (action.value || 1);
        }
        break;

      case 'apply':
        if (action.function && action.field) {
          // Custom function application would go here
          // For now, just set the value
          context.results[action.field] = action.value;
        }
        break;

      case 'log':
        console.log(`[Rule Action] ${action.value}`);
        break;
    }
  }
}
