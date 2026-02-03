/**
 * Rules Engine - Orchestrate rule evaluation
 */

import { RuleRegistry } from '../storage/rule-registry';
import { RuleEvaluator } from './rule-evaluator';
import { Rule, RuleContext, RuleResult, RuleSet } from '../types/rule.types';

export class RulesEngine {
  private registry: RuleRegistry;
  private evaluator: RuleEvaluator;

  constructor(registry?: RuleRegistry) {
    this.registry = registry || new RuleRegistry();
    this.evaluator = new RuleEvaluator();
  }

  /**
   * Get the rule registry
   */
  getRegistry(): RuleRegistry {
    return this.registry;
  }

  /**
   * Evaluate a single rule
   */
  async evaluateRule(ruleId: string, facts: Record<string, any>): Promise<RuleResult> {
    const rule = this.registry.get(ruleId);
    if (!rule) {
      return {
        success: false,
        matched: false,
        error: {
          code: 'RULE_NOT_FOUND',
          message: `Rule not found: ${ruleId}`,
        },
      };
    }

    const context: RuleContext = {
      facts,
      results: {},
    };

    const result = this.evaluator.evaluate(rule, context);

    // Apply actions if any
    if (result.actions) {
      this.evaluator.applyActions(result.actions, context);
      result.value = context.results;
    }

    return result;
  }

  /**
   * Evaluate multiple rules
   */
  async evaluateRules(
    ruleIds: string[],
    facts: Record<string, any>,
    options?: {
      stopOnFirstMatch?: boolean;
      aggregateResults?: boolean;
    }
  ): Promise<RuleResult[]> {
    const results: RuleResult[] = [];
    const context: RuleContext = {
      facts,
      results: {},
    };

    for (const ruleId of ruleIds) {
      const rule = this.registry.get(ruleId);
      if (!rule) {
        results.push({
          success: false,
          matched: false,
          error: {
            code: 'RULE_NOT_FOUND',
            message: `Rule not found: ${ruleId}`,
          },
        });
        continue;
      }

      const result = this.evaluator.evaluate(rule, context);

      // Apply actions
      if (result.actions) {
        this.evaluator.applyActions(result.actions, context);
      }

      results.push(result);

      // Stop on first match if requested
      if (options?.stopOnFirstMatch && result.matched) {
        break;
      }
    }

    // If aggregating, combine all results
    if (options?.aggregateResults) {
      const aggregated = results.find((r) => r.matched);
      if (aggregated) {
        aggregated.value = context.results;
        return [aggregated];
      }
    }

    return results;
  }

  /**
   * Evaluate a rule set
   */
  async evaluateRuleSet(
    setId: string,
    facts: Record<string, any>
  ): Promise<RuleResult[]> {
    const ruleSet = this.registry.getRuleSet(setId);
    if (!ruleSet) {
      return [
        {
          success: false,
          matched: false,
          error: {
            code: 'RULE_SET_NOT_FOUND',
            message: `Rule set not found: ${setId}`,
          },
        },
      ];
    }

    const rules = this.registry.getRulesInSet(setId);

    // Sort by priority if needed
    if (ruleSet.evaluationOrder === 'priority') {
      rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    const ruleIds = rules.map((r) => r.id);

    return this.evaluateRules(ruleIds, facts, {
      stopOnFirstMatch: ruleSet.stopOnFirstMatch,
      aggregateResults: true,
    });
  }

  /**
   * Evaluate active rules for a product line and state
   */
  async evaluateActiveRules(
    facts: Record<string, any>,
    productLine?: string,
    state?: string
  ): Promise<RuleResult[]> {
    const rules = this.registry.listActiveRules(productLine, state);

    // Sort by priority
    rules.sort((a, b) => (b.priority || 0) - (a.priority || 0));

    const ruleIds = rules.map((r) => r.id);

    return this.evaluateRules(ruleIds, facts, {
      aggregateResults: true,
    });
  }

  /**
   * Load rules from JSON
   */
  loadRules(rules: Rule[]): void {
    this.registry.loadFromJSON(rules);
  }

  /**
   * Load rule sets from JSON
   */
  loadRuleSets(ruleSets: RuleSet[]): void {
    ruleSets.forEach((rs) => {
      try {
        this.registry.registerRuleSet(rs);
      } catch {
        // Ignore if already exists
      }
    });
  }
}
