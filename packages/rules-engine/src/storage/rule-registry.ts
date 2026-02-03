/**
 * Rule Registry - Store and retrieve rules
 */

import { Rule, RuleType, RuleStatus, RuleSet } from '../types/rule.types';

export class RuleRegistry {
  private rules: Map<string, Rule> = new Map();
  private ruleSets: Map<string, RuleSet> = new Map();

  /**
   * Register a rule
   */
  register(rule: Rule): void {
    if (this.rules.has(rule.id)) {
      throw new Error(`Rule already exists: ${rule.id}`);
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Update a rule
   */
  update(rule: Rule): void {
    if (!this.rules.has(rule.id)) {
      throw new Error(`Rule not found: ${rule.id}`);
    }
    this.rules.set(rule.id, rule);
  }

  /**
   * Get a rule by ID
   */
  get(id: string): Rule | undefined {
    return this.rules.get(id);
  }

  /**
   * Delete a rule
   */
  delete(id: string): boolean {
    return this.rules.delete(id);
  }

  /**
   * Check if rule exists
   */
  has(id: string): boolean {
    return this.rules.has(id);
  }

  /**
   * List all rules
   */
  listAll(): Rule[] {
    return Array.from(this.rules.values());
  }

  /**
   * List rules by type
   */
  listByType(type: RuleType): Rule[] {
    return this.listAll().filter((r) => r.type === type);
  }

  /**
   * List rules by status
   */
  listByStatus(status: RuleStatus): Rule[] {
    return this.listAll().filter((r) => r.status === status);
  }

  /**
   * List rules by product line
   */
  listByProductLine(productLine: string): Rule[] {
    return this.listAll().filter((r) => r.productLine === productLine);
  }

  /**
   * List rules by state
   */
  listByState(state: string): Rule[] {
    return this.listAll().filter((r) => r.state === state);
  }

  /**
   * List active rules for a product line and state
   */
  listActiveRules(productLine?: string, state?: string): Rule[] {
    return this.listAll().filter((r) => {
      if (r.status !== 'active') return false;
      if (productLine && r.productLine && r.productLine !== productLine) return false;
      if (state && r.state && r.state !== state) return false;

      // Check effective/expiration dates
      const now = new Date();
      if (r.effectiveDate && new Date(r.effectiveDate) > now) return false;
      if (r.expirationDate && new Date(r.expirationDate) < now) return false;

      return true;
    });
  }

  /**
   * Search rules by tag
   */
  searchByTag(tag: string): Rule[] {
    return this.listAll().filter((r) => r.tags?.includes(tag));
  }

  /**
   * Clear all rules
   */
  clear(): void {
    this.rules.clear();
  }

  /**
   * Get rule count
   */
  count(): number {
    return this.rules.size;
  }

  /**
   * Load rules from JSON
   */
  loadFromJSON(rules: Rule[]): void {
    rules.forEach((rule) => {
      try {
        this.register(rule);
      } catch {
        // If already exists, update instead
        this.update(rule);
      }
    });
  }

  /**
   * Export rules to JSON
   */
  exportToJSON(): Rule[] {
    return this.listAll();
  }

  // Rule Set Management

  /**
   * Register a rule set
   */
  registerRuleSet(ruleSet: RuleSet): void {
    if (this.ruleSets.has(ruleSet.id)) {
      throw new Error(`Rule set already exists: ${ruleSet.id}`);
    }

    // Validate that all rules exist
    for (const ruleId of ruleSet.rules) {
      if (!this.rules.has(ruleId)) {
        throw new Error(`Rule not found in set: ${ruleId}`);
      }
    }

    this.ruleSets.set(ruleSet.id, ruleSet);
  }

  /**
   * Get a rule set
   */
  getRuleSet(id: string): RuleSet | undefined {
    return this.ruleSets.get(id);
  }

  /**
   * Get all rules in a rule set
   */
  getRulesInSet(setId: string): Rule[] {
    const ruleSet = this.ruleSets.get(setId);
    if (!ruleSet) {
      throw new Error(`Rule set not found: ${setId}`);
    }

    return ruleSet.rules.map((id) => this.rules.get(id)!).filter(Boolean);
  }

  /**
   * List all rule sets
   */
  listAllRuleSets(): RuleSet[] {
    return Array.from(this.ruleSets.values());
  }

  /**
   * Delete a rule set
   */
  deleteRuleSet(id: string): boolean {
    return this.ruleSets.delete(id);
  }
}

// Singleton instance
export const ruleRegistry = new RuleRegistry();
