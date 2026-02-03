import { RulesEngine } from '../evaluator/rules-engine';
import { LookupRule, DecisionTableRule, ConditionalRule } from '../types/rule.types';

describe('RulesEngine', () => {
  let engine: RulesEngine;

  beforeEach(() => {
    engine = new RulesEngine();
  });

  describe('Lookup Rules', () => {
    it('should evaluate lookup rule with match', async () => {
      const rule: LookupRule = {
        id: 'test-lookup-1',
        name: 'State Surcharge',
        type: 'lookup',
        status: 'active',
        version: '1.0.0',
        keyField: 'state',
        table: {
          CA: 0.05,
          TX: -0.02,
          NY: 0.04,
        },
        defaultValue: 0.00,
      };

      engine.getRegistry().register(rule);

      const result = await engine.evaluateRule('test-lookup-1', {
        state: 'CA',
      });

      expect(result.success).toBe(true);
      expect(result.matched).toBe(true);
      expect(result.value).toBe(0.05);
    });

    it('should return default value when key not found', async () => {
      const rule: LookupRule = {
        id: 'test-lookup-2',
        name: 'State Surcharge',
        type: 'lookup',
        status: 'active',
        version: '1.0.0',
        keyField: 'state',
        table: {
          CA: 0.05,
        },
        defaultValue: 0.00,
      };

      engine.getRegistry().register(rule);

      const result = await engine.evaluateRule('test-lookup-2', {
        state: 'FL',
      });

      expect(result.success).toBe(true);
      expect(result.matched).toBe(false);
      expect(result.value).toBe(0.00);
    });
  });

  describe('Decision Table Rules', () => {
    it('should evaluate decision table with exact match', async () => {
      const rule: DecisionTableRule = {
        id: 'test-decision-1',
        name: 'Experience Modifier',
        type: 'decision',
        status: 'active',
        version: '1.0.0',
        conditions: [
          { field: 'priorClaimsCount', label: 'Claims Count', type: 'number' },
          { field: 'yearsInBusiness', label: 'Years', type: 'number' },
        ],
        rows: [
          {
            conditions: {
              priorClaimsCount: 0,
              yearsInBusiness: { min: 5 },
            },
            outcome: {
              modifier: 0.95,
              description: '5% credit',
            },
          },
          {
            conditions: {
              priorClaimsCount: 0,
              yearsInBusiness: { min: 0, max: 4 },
            },
            outcome: {
              modifier: 1.00,
              description: 'No adjustment',
            },
          },
        ],
        defaultOutcome: {
          modifier: 1.10,
          description: 'Default 10% increase',
        },
      };

      engine.getRegistry().register(rule);

      const result = await engine.evaluateRule('test-decision-1', {
        priorClaimsCount: 0,
        yearsInBusiness: 10,
      });

      expect(result.success).toBe(true);
      expect(result.matched).toBe(true);
      expect(result.value?.modifier).toBe(0.95);
    });

    it('should return default outcome when no rows match', async () => {
      const rule: DecisionTableRule = {
        id: 'test-decision-2',
        name: 'Experience Modifier',
        type: 'decision',
        status: 'active',
        version: '1.0.0',
        conditions: [
          { field: 'priorClaimsCount', label: 'Claims Count', type: 'number' },
        ],
        rows: [
          {
            conditions: { priorClaimsCount: 0 },
            outcome: { modifier: 0.95 },
          },
        ],
        defaultOutcome: {
          modifier: 1.10,
        },
      };

      engine.getRegistry().register(rule);

      const result = await engine.evaluateRule('test-decision-2', {
        priorClaimsCount: 5,
      });

      expect(result.success).toBe(true);
      expect(result.matched).toBe(false);
      expect(result.value?.modifier).toBe(1.10);
    });
  });

  describe('Conditional Rules', () => {
    it('should evaluate conditional rule when conditions match', async () => {
      const rule: ConditionalRule = {
        id: 'test-conditional-1',
        name: 'CA High Value Surcharge',
        type: 'conditional',
        status: 'active',
        version: '1.0.0',
        conditions: [
          { fact: 'state', operator: 'equal', value: 'CA' },
          { fact: 'limit', operator: 'greaterThan', value: 1000000 },
        ],
        actions: [
          { type: 'add', field: 'surcharge', value: 500 },
        ],
      };

      engine.getRegistry().register(rule);

      const result = await engine.evaluateRule('test-conditional-1', {
        state: 'CA',
        limit: 2000000,
      });

      expect(result.success).toBe(true);
      expect(result.matched).toBe(true);
      expect(result.value?.surcharge).toBe(500);
    });

    it('should execute else actions when conditions do not match', async () => {
      const rule: ConditionalRule = {
        id: 'test-conditional-2',
        name: 'State Check',
        type: 'conditional',
        status: 'active',
        version: '1.0.0',
        conditions: [
          { fact: 'state', operator: 'equal', value: 'CA' },
        ],
        actions: [
          { type: 'set', field: 'riskLevel', value: 'high' },
        ],
        elseActions: [
          { type: 'set', field: 'riskLevel', value: 'standard' },
        ],
      };

      engine.getRegistry().register(rule);

      const result = await engine.evaluateRule('test-conditional-2', {
        state: 'TX',
      });

      expect(result.success).toBe(true);
      expect(result.matched).toBe(false);
      expect(result.value?.riskLevel).toBe('standard');
    });

    it('should support different operators', async () => {
      const rule: ConditionalRule = {
        id: 'test-operators',
        name: 'Test Operators',
        type: 'conditional',
        status: 'active',
        version: '1.0.0',
        conditions: [
          { fact: 'revenue', operator: 'greaterThanInclusive', value: 1000000 },
          { fact: 'state', operator: 'in', value: ['CA', 'NY', 'TX'] },
        ],
        actions: [
          { type: 'set', field: 'eligible', value: true },
        ],
      };

      engine.getRegistry().register(rule);

      const result1 = await engine.evaluateRule('test-operators', {
        revenue: 1000000,
        state: 'CA',
      });
      expect(result1.matched).toBe(true);

      const result2 = await engine.evaluateRule('test-operators', {
        revenue: 999999,
        state: 'CA',
      });
      expect(result2.matched).toBe(false);

      const result3 = await engine.evaluateRule('test-operators', {
        revenue: 1000000,
        state: 'FL',
      });
      expect(result3.matched).toBe(false);
    });
  });

  describe('Multiple Rules Evaluation', () => {
    it('should evaluate multiple rules and aggregate results', async () => {
      const rule1: LookupRule = {
        id: 'rule-1',
        name: 'State Surcharge',
        type: 'lookup',
        status: 'active',
        version: '1.0.0',
        keyField: 'state',
        table: { CA: 0.05 },
        defaultValue: 0.00,
      };

      const rule2: ConditionalRule = {
        id: 'rule-2',
        name: 'High Value Check',
        type: 'conditional',
        status: 'active',
        version: '1.0.0',
        conditions: [
          { fact: 'limit', operator: 'greaterThan', value: 1000000 },
        ],
        actions: [
          { type: 'add', field: 'surcharge', value: 500 },
        ],
      };

      engine.getRegistry().register(rule1);
      engine.getRegistry().register(rule2);

      const results = await engine.evaluateRules(
        ['rule-1', 'rule-2'],
        { state: 'CA', limit: 2000000 },
        { aggregateResults: true }
      );

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].value?.surcharge).toBe(500);
    });

    it('should stop on first match when requested', async () => {
      const rule1: LookupRule = {
        id: 'rule-1',
        name: 'First Rule',
        type: 'lookup',
        status: 'active',
        version: '1.0.0',
        keyField: 'key',
        table: { test: 'value1' },
      };

      const rule2: LookupRule = {
        id: 'rule-2',
        name: 'Second Rule',
        type: 'lookup',
        status: 'active',
        version: '1.0.0',
        keyField: 'key',
        table: { test: 'value2' },
      };

      engine.getRegistry().register(rule1);
      engine.getRegistry().register(rule2);

      const results = await engine.evaluateRules(
        ['rule-1', 'rule-2'],
        { key: 'test' },
        { stopOnFirstMatch: true }
      );

      expect(results.length).toBe(1);
      expect(results[0].value).toBe('value1');
    });
  });

  describe('Active Rules', () => {
    it('should evaluate only active rules', async () => {
      const activeRule: LookupRule = {
        id: 'active-rule',
        name: 'Active Rule',
        type: 'lookup',
        status: 'active',
        version: '1.0.0',
        productLine: 'general-liability',
        keyField: 'key',
        table: { test: 'active' },
      };

      const inactiveRule: LookupRule = {
        id: 'inactive-rule',
        name: 'Inactive Rule',
        type: 'lookup',
        status: 'inactive',
        version: '1.0.0',
        productLine: 'general-liability',
        keyField: 'key',
        table: { test: 'inactive' },
      };

      engine.getRegistry().register(activeRule);
      engine.getRegistry().register(inactiveRule);

      const activeRules = engine.getRegistry().listActiveRules('general-liability');

      expect(activeRules.length).toBe(1);
      expect(activeRules[0].id).toBe('active-rule');
    });
  });
});
