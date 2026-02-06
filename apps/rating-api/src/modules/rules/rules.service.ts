import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConditionalRule } from '../../entities/conditional-rule.entity';

@Injectable()
export class RulesService {
  private readonly logger = new Logger(RulesService.name);

  constructor(
    @InjectRepository(ConditionalRule)
    private readonly rulesRepository: Repository<ConditionalRule>,
  ) {}

  /**
   * Get active rules for a product line
   */
  async getRulesByProductLine(productLineCode: string): Promise<ConditionalRule[]> {
    return this.rulesRepository.find({
      where: {
        productLineCode,
        status: 'active',
      },
      order: { priority: 'DESC', createdAt: 'ASC' },
    });
  }

  /**
   * Execute rules for a product line
   */
  async executeRules(productLineCode: string, data: any): Promise<{
    data: any;
    rulesApplied: string[];
  }> {
    this.logger.log(`Executing rules for product line: ${productLineCode}`);

    // Get active rules
    const rules = await this.getRulesByProductLine(productLineCode);

    if (rules.length === 0) {
      this.logger.log(`No active rules found for ${productLineCode}`);
      return { data, rulesApplied: [] };
    }

    this.logger.log(`Found ${rules.length} active rules to evaluate`);

    const rulesApplied: string[] = [];
    let modifiedData = { ...data };

    // Execute each rule in order of priority
    for (const rule of rules) {
      try {
        const ruleMatched = this.evaluateRuleConditions(rule, modifiedData);

        if (ruleMatched) {
          this.logger.debug(`Rule '${rule.name}' matched, applying actions`);
          modifiedData = this.applyRuleActions(rule, modifiedData);
          rulesApplied.push(rule.name);
        } else {
          this.logger.debug(`Rule '${rule.name}' did not match`);
        }
      } catch (error: any) {
        this.logger.error(`Error executing rule '${rule.name}': ${error.message}`);
        // Continue with next rule
      }
    }

    this.logger.log(`Executed ${rules.length} rules, ${rulesApplied.length} applied`);

    return {
      data: modifiedData,
      rulesApplied,
    };
  }

  /**
   * Evaluate if all conditions in a rule are met
   */
  private evaluateRuleConditions(rule: ConditionalRule, data: any): boolean {
    if (!rule.conditions || rule.conditions.length === 0) {
      return true; // No conditions = always match
    }

    // All conditions must be true (AND logic)
    for (const condition of rule.conditions) {
      if (!this.evaluateCondition(condition, data)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: any, data: any): boolean {
    const fieldValue = this.getNestedValue(data, condition.fieldPath);
    const expectedValue = condition.value;

    switch (condition.operator) {
      case 'equals':
      case '==':
      case '===':
        return fieldValue == expectedValue;

      case 'not_equals':
      case '!=':
      case '!==':
        return fieldValue != expectedValue;

      case 'greater_than':
      case '>':
        return Number(fieldValue) > Number(expectedValue);

      case 'greater_than_or_equal':
      case '>=':
        return Number(fieldValue) >= Number(expectedValue);

      case 'less_than':
      case '<':
        return Number(fieldValue) < Number(expectedValue);

      case 'less_than_or_equal':
      case '<=':
        return Number(fieldValue) <= Number(expectedValue);

      case 'contains':
        return String(fieldValue).includes(String(expectedValue));

      case 'not_contains':
        return !String(fieldValue).includes(String(expectedValue));

      case 'starts_with':
        return String(fieldValue).startsWith(String(expectedValue));

      case 'ends_with':
        return String(fieldValue).endsWith(String(expectedValue));

      case 'in':
        return Array.isArray(expectedValue) && expectedValue.includes(fieldValue);

      case 'not_in':
        return Array.isArray(expectedValue) && !expectedValue.includes(fieldValue);

      case 'is_null':
        return fieldValue === null || fieldValue === undefined;

      case 'is_not_null':
        return fieldValue !== null && fieldValue !== undefined;

      case 'is_empty':
        return (
          fieldValue === null ||
          fieldValue === undefined ||
          fieldValue === '' ||
          (Array.isArray(fieldValue) && fieldValue.length === 0)
        );

      case 'is_not_empty':
        return (
          fieldValue !== null &&
          fieldValue !== undefined &&
          fieldValue !== '' &&
          (!Array.isArray(fieldValue) || fieldValue.length > 0)
        );

      default:
        this.logger.warn(`Unknown operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Apply all actions from a rule
   */
  private applyRuleActions(rule: ConditionalRule, data: any): any {
    if (!rule.actions || rule.actions.length === 0) {
      return data;
    }

    const modifiedData = { ...data };

    for (const action of rule.actions) {
      try {
        this.applyAction(action, modifiedData);
      } catch (error: any) {
        this.logger.error(`Error applying action: ${error.message}`);
      }
    }

    return modifiedData;
  }

  /**
   * Apply a single action
   */
  private applyAction(action: any, data: any): void {
    switch (action.actionType) {
      case 'set':
      case 'set_value':
        this.setNestedValue(data, action.targetField, action.value);
        break;

      case 'add':
      case 'increment':
        const currentValue = this.getNestedValue(data, action.targetField) || 0;
        this.setNestedValue(
          data,
          action.targetField,
          Number(currentValue) + Number(action.value),
        );
        break;

      case 'subtract':
      case 'decrement':
        const currentVal = this.getNestedValue(data, action.targetField) || 0;
        this.setNestedValue(
          data,
          action.targetField,
          Number(currentVal) - Number(action.value),
        );
        break;

      case 'multiply':
        const curVal = this.getNestedValue(data, action.targetField) || 0;
        this.setNestedValue(
          data,
          action.targetField,
          Number(curVal) * Number(action.value),
        );
        break;

      case 'divide':
        const cv = this.getNestedValue(data, action.targetField) || 0;
        this.setNestedValue(
          data,
          action.targetField,
          Number(cv) / Number(action.value),
        );
        break;

      case 'append':
        const existingArray = this.getNestedValue(data, action.targetField) || [];
        if (Array.isArray(existingArray)) {
          existingArray.push(action.value);
          this.setNestedValue(data, action.targetField, existingArray);
        }
        break;

      case 'remove':
        this.setNestedValue(data, action.targetField, undefined);
        break;

      default:
        this.logger.warn(`Unknown action type: ${action.actionType}`);
    }
  }

  /**
   * Get nested value from object using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = current[part];
    }

    return current;
  }

  /**
   * Set nested value in object using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    if (!path) return;

    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }
}
