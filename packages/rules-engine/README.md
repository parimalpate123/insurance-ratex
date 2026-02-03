# @insurratex/rules-engine

Business rules engine for insurance rating and policy management. Supports lookup tables, decision tables, and conditional rules for implementing complex business logic without code.

## Overview

The Rules Engine provides a flexible, configuration-driven approach to implementing business rules. Business analysts can define rules in JSON format, which are then evaluated at runtime against policy data to determine surcharges, discounts, commissions, and other rating factors.

## Features

- **3 Rule Types**: Lookup tables, decision tables, and conditional rules
- **Declarative Configuration**: Define rules in JSON without coding
- **Rule Registry**: Centralized storage and versioning
- **Active/Inactive Status**: Enable/disable rules dynamically
- **Effective Dates**: Time-based rule activation
- **Priority System**: Control evaluation order
- **Rule Sets**: Group related rules
- **Product Line & State Filtering**: Target rules to specific contexts
- **Type-Safe**: Full TypeScript support

## Installation

```bash
npm install @insurratex/rules-engine
```

## Quick Start

### 1. Define a Lookup Rule

```json
{
  "id": "state-surcharges",
  "name": "State Territorial Surcharges",
  "type": "lookup",
  "status": "active",
  "version": "1.0.0",
  "keyField": "state",
  "table": {
    "CA": 0.05,
    "NY": 0.04,
    "TX": -0.02
  },
  "defaultValue": 0.00
}
```

### 2. Load and Evaluate

```typescript
import { RulesEngine } from '@insurratex/rules-engine';
import stateSurcharges from './rules/state-surcharges.json';

const engine = new RulesEngine();

// Load rule
engine.loadRules([stateSurcharges]);

// Evaluate
const result = await engine.evaluateRule('state-surcharges', {
  state: 'CA'
});

console.log(result.value); // 0.05 (5% surcharge)
```

## Rule Types

### 1. Lookup Rules

Simple key-value mapping for quick lookups.

**Use Cases:**
- State surcharges
- Commission rates by agent tier
- Class code base rates
- Territorial factors

**Example:**
```json
{
  "id": "commission-rates",
  "name": "Agent Commission Rates",
  "type": "lookup",
  "status": "active",
  "version": "1.0.0",
  "keyField": "agentTier",
  "table": {
    "platinum": 0.15,
    "gold": 0.12,
    "silver": 0.10,
    "bronze": 0.08
  },
  "defaultValue": 0.05
}
```

**Evaluation:**
```typescript
const result = await engine.evaluateRule('commission-rates', {
  agentTier: 'gold'
});
// result.value = 0.12
```

### 2. Decision Tables

Multi-dimensional tables with conditions and outcomes.

**Use Cases:**
- Experience modification based on claims history
- Tiered discounts based on multiple factors
- Complex rating adjustments
- Underwriting decisions

**Example:**
```json
{
  "id": "experience-modifier",
  "name": "Experience Modifier",
  "type": "decision",
  "status": "active",
  "version": "1.0.0",
  "conditions": [
    {
      "field": "priorClaimsCount",
      "label": "Number of Claims",
      "type": "number"
    },
    {
      "field": "priorClaimsAmount",
      "label": "Total Claims Amount",
      "type": "number"
    }
  ],
  "rows": [
    {
      "conditions": {
        "priorClaimsCount": 0,
        "priorClaimsAmount": 0
      },
      "outcome": {
        "modifier": 0.95,
        "description": "No claims - 5% credit"
      }
    },
    {
      "conditions": {
        "priorClaimsCount": 1,
        "priorClaimsAmount": { "min": 0, "max": 50000 }
      },
      "outcome": {
        "modifier": 1.00,
        "description": "One small claim - no adjustment"
      }
    },
    {
      "conditions": {
        "priorClaimsCount": { "min": 2 }
      },
      "outcome": {
        "modifier": 1.25,
        "description": "Multiple claims - 25% increase"
      }
    }
  ],
  "defaultOutcome": {
    "modifier": 1.00
  }
}
```

**Evaluation:**
```typescript
const result = await engine.evaluateRule('experience-modifier', {
  priorClaimsCount: 1,
  priorClaimsAmount: 30000
});
// result.value = { modifier: 1.00, description: "One small claim - no adjustment" }
```

### 3. Conditional Rules

If-then-else logic with actions.

**Use Cases:**
- State-specific surcharges with conditions
- High-value policy surcharges
- New business fees
- Coverage-specific adjustments

**Example:**
```json
{
  "id": "high-value-surcharge",
  "name": "CA High-Value Policy Surcharge",
  "type": "conditional",
  "status": "active",
  "version": "1.0.0",
  "state": "CA",
  "conditions": [
    {
      "fact": "state",
      "operator": "equal",
      "value": "CA"
    },
    {
      "fact": "limit",
      "operator": "greaterThan",
      "value": 1000000
    }
  ],
  "actions": [
    {
      "type": "add",
      "field": "surcharge",
      "value": 500
    }
  ]
}
```

**Evaluation:**
```typescript
const result = await engine.evaluateRule('high-value-surcharge', {
  state: 'CA',
  limit: 2000000
});
// result.value = { surcharge: 500 }
```

## Operators

Conditional rules support various operators:

- `equal`: Exact match
- `notEqual`: Not equal
- `lessThan`: Less than
- `lessThanInclusive`: Less than or equal
- `greaterThan`: Greater than
- `greaterThanInclusive`: Greater than or equal
- `in`: Value in array
- `notIn`: Value not in array
- `contains`: String/array contains value
- `doesNotContain`: String/array does not contain value

## Actions

Conditional rules can perform these actions:

- `set`: Set a field value
- `add`: Add to a field value
- `multiply`: Multiply a field value
- `apply`: Apply a function
- `log`: Log a message

## Rule Registry

Centralized management of rules:

```typescript
import { ruleRegistry } from '@insurratex/rules-engine';

// Register a rule
ruleRegistry.register(rule);

// Get a rule
const rule = ruleRegistry.get('state-surcharges');

// List rules
const allRules = ruleRegistry.listAll();
const lookupRules = ruleRegistry.listByType('lookup');
const activeRules = ruleRegistry.listByStatus('active');
const glRules = ruleRegistry.listByProductLine('general-liability');
const caRules = ruleRegistry.listByState('CA');

// List active rules for context
const contextRules = ruleRegistry.listActiveRules('general-liability', 'CA');

// Search by tag
const surchargeRules = ruleRegistry.searchByTag('surcharge');

// Update a rule
ruleRegistry.update(updatedRule);

// Delete a rule
ruleRegistry.delete('rule-id');

// Load/export JSON
ruleRegistry.loadFromJSON(rulesArray);
const exported = ruleRegistry.exportToJSON();
```

## Rule Sets

Group related rules for sequential evaluation:

```json
{
  "id": "gl-rating-rules",
  "name": "General Liability Rating Rules",
  "description": "Complete GL rating rule set",
  "rules": [
    "state-surcharges",
    "experience-modifier",
    "high-value-surcharge"
  ],
  "evaluationOrder": "priority",
  "stopOnFirstMatch": false
}
```

```typescript
// Register rule set
engine.getRegistry().registerRuleSet(ruleSet);

// Evaluate rule set
const results = await engine.evaluateRuleSet('gl-rating-rules', {
  state: 'CA',
  limit: 2000000,
  priorClaimsCount: 0
});
```

## Advanced Usage

### Multiple Rules Evaluation

```typescript
const results = await engine.evaluateRules(
  ['rule-1', 'rule-2', 'rule-3'],
  facts,
  {
    stopOnFirstMatch: false,
    aggregateResults: true
  }
);
```

### Active Rules by Context

```typescript
// Evaluate all active rules for GL in CA
const results = await engine.evaluateActiveRules(
  {
    state: 'CA',
    limit: 2000000,
    priorClaimsCount: 0
  },
  'general-liability',
  'CA'
);
```

### Rule Metadata

```typescript
{
  "id": "my-rule",
  // ... rule definition
  "priority": 100,
  "effectiveDate": "2026-01-01T00:00:00Z",
  "expirationDate": "2026-12-31T23:59:59Z",
  "tags": ["surcharge", "california"],
  "metadata": {
    "createdBy": "john.doe@example.com",
    "createdAt": "2026-01-15T10:00:00Z",
    "updatedBy": "jane.smith@example.com",
    "updatedAt": "2026-01-20T14:30:00Z"
  }
}
```

## Result Structure

```typescript
interface RuleResult {
  success: boolean;        // Did evaluation succeed?
  matched: boolean;        // Did the rule match?
  value?: any;            // Result value/outcome
  actions?: Action[];     // Actions to apply (conditional rules)
  error?: RuleError;      // Error if evaluation failed
  metadata?: {
    ruleId: string;
    ruleName: string;
    evaluationTime: number; // Milliseconds
  };
}
```

## Example Rules

See the `rules/` directory for complete examples:

- `lookup/state-surcharges.json`: State territorial surcharges
- `lookup/commission-rates.json`: Agent commission rates
- `decision/experience-modifier.json`: Claims-based experience modification
- `conditional/high-value-surcharge.json`: CA high-value policy surcharge

## Best Practices

1. **Use Appropriate Rule Types**
   - Lookup: Simple key-value mappings
   - Decision: Multi-dimensional conditions
   - Conditional: Complex if-then logic

2. **Set Priorities**: Higher priority rules evaluate first

3. **Use Effective Dates**: Schedule rule activation/deactivation

4. **Tag Rules**: Make rules discoverable and manageable

5. **Provide Defaults**: Always include default values/outcomes

6. **Version Rules**: Track rule changes over time

7. **Test Rules**: Write tests for critical business rules

8. **Document Outcomes**: Add descriptions to outcomes

## Integration Example

```typescript
import { RulesEngine } from '@insurratex/rules-engine';
import stateSurcharges from './rules/state-surcharges.json';
import experienceMod from './rules/experience-modifier.json';
import highValueSurcharge from './rules/high-value-surcharge.json';

// Initialize engine
const engine = new RulesEngine();

// Load rules
engine.loadRules([
  stateSurcharges,
  experienceMod,
  highValueSurcharge
]);

// Policy data
const policy = {
  state: 'CA',
  limit: 2000000,
  priorClaimsCount: 0,
  priorClaimsAmount: 0,
  yearsInBusiness: 10
};

// Evaluate all active rules
const results = await engine.evaluateActiveRules(
  policy,
  'general-liability',
  'CA'
);

// Process results
let totalSurcharge = 0;
let modifier = 1.00;

for (const result of results) {
  if (result.matched && result.value) {
    // Handle surcharges
    if (result.value.surcharge) {
      totalSurcharge += result.value.surcharge;
    }
    // Handle modifier
    if (result.value.modifier) {
      modifier = result.value.modifier;
    }
  }
}

console.log(`Total Surcharge: $${totalSurcharge}`);
console.log(`Experience Modifier: ${modifier}`);
```

## Testing

```bash
npm test
npm run test:watch
npm run test:cov
```

## License

MIT

## Support

For issues or questions, contact the InsurRateX development team.
