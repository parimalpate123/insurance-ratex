# Rules Engine Architecture

## Overview
The InsurRateX rules are stored as structured data in PostgreSQL and can be executed by a rules engine to dynamically evaluate insurance policies.

## Current Implementation

### Data Flow
```
User Input (Natural Language)
    ↓
AI (Claude) - Parses & Structures
    ↓
Database (PostgreSQL) - Stores as JSON/Tables
    ↓
Rules UI - Displays for Management
    ↓
Rules Engine - Executes During Rating
```

## Storage Format

Rules are stored in normalized tables:

```sql
conditional_rules
├── id, name, description, product_line, status
│
├── rule_conditions (1:many)
│   ├── field_path (e.g., "buildingAge", "insured.annualRevenue")
│   ├── operator (e.g., ">", "==", "contains")
│   ├── value (JSONB - supports any type)
│   └── condition_order
│
└── rule_actions (1:many)
    ├── type (e.g., "surcharge", "discount", "reject", "set")
    ├── field (e.g., "premium", "requiresInspection")
    ├── value (JSONB)
    └── action_order
```

## How Rules Execute (Rating Engine)

### Step 1: Fetch Active Rules
```typescript
const activeRules = await rulesRepository.find({
  where: { status: 'active', productLine: 'commercial-property' },
  relations: ['conditions', 'actions']
});
```

### Step 2: Evaluate Conditions
For each rule, evaluate ALL conditions against the policy data:

```typescript
function evaluateRule(rule: ConditionalRule, policyData: any): boolean {
  // All conditions must be true (AND logic)
  return rule.conditions.every(condition => {
    const actualValue = getNestedValue(policyData, condition.fieldPath);
    return evaluateCondition(actualValue, condition.operator, condition.value);
  });
}

function evaluateCondition(actual: any, operator: string, expected: any): boolean {
  switch (operator) {
    case '==': return actual === expected;
    case '>': return actual > expected;
    case '<': return actual < expected;
    case '>=': return actual >= expected;
    case '<=': return actual <= expected;
    case '!=': return actual !== expected;
    case 'contains': return String(actual).includes(String(expected));
    case 'in': return Array.isArray(expected) && expected.includes(actual);
    default: return false;
  }
}
```

### Step 3: Execute Actions
If conditions match, apply the actions:

```typescript
function executeActions(actions: RuleAction[], policyData: any): any {
  let result = { ...policyData };

  actions.forEach(action => {
    switch (action.type) {
      case 'surcharge':
        const currentPremium = getNestedValue(result, action.field);
        setNestedValue(result, action.field, currentPremium * (1 + action.value));
        break;

      case 'discount':
        const premium = getNestedValue(result, action.field);
        setNestedValue(result, action.field, premium * (1 - action.value));
        break;

      case 'multiply':
        const value = getNestedValue(result, action.field);
        setNestedValue(result, action.field, value * action.value);
        break;

      case 'set':
        setNestedValue(result, action.field, action.value);
        break;

      case 'reject':
        result.rejected = true;
        result.rejectionReason = action.value;
        break;
    }
  });

  return result;
}
```

## Example Execution

### Input Policy Data:
```json
{
  "buildingAge": 65,
  "state": "CA",
  "propertyValue": 7500000,
  "basePremium": 10000,
  "requiresInspection": false
}
```

### Rule from Database:
```
IF buildingAge > 50
AND state == CA
AND propertyValue > 5000000
THEN
  surcharge premium 0.20
  set requiresInspection true
```

### Evaluation Process:
```typescript
// 1. Check conditions
buildingAge (65) > 50 ✓
state (CA) == CA ✓
propertyValue (7500000) > 5000000 ✓

// All conditions true → Execute actions

// 2. Apply actions
premium = 10000 * (1 + 0.20) = 12000
requiresInspection = true
```

### Output:
```json
{
  "buildingAge": 65,
  "state": "CA",
  "propertyValue": 7500000,
  "basePremium": 10000,
  "premium": 12000,  // ← Modified by surcharge
  "requiresInspection": true,  // ← Set by action
  "appliedRules": ["CA_Older_HighValue_Property_Surcharge"]
}
```

## Integration Points

### 1. Rating API Endpoint
```typescript
POST /api/v1/rating/calculate
{
  "productLine": "commercial-property",
  "policyData": { ... }
}

→ Executes all active rules
→ Returns calculated premium + modifications
```

### 2. Underwriting Workflow
- Rules can set flags like `requiresInspection`, `requiresManagerApproval`
- Workflow engine reads these flags and routes accordingly

### 3. Batch Rating
- Process multiple policies
- Apply rules in sequence
- Track which rules fired for each policy

## Benefits of This Architecture

1. **Separation of Concerns**
   - Business users manage rules via UI
   - Rules engine executes them consistently
   - No code deployment needed for rule changes

2. **Auditability**
   - Every rule execution can be logged
   - Track which rules modified each policy
   - Historical analysis of rule effectiveness

3. **Dynamic & Flexible**
   - Add new rules without code changes
   - Test rules in draft mode before activating
   - Version control for rule changes

4. **AI-Assisted Creation**
   - Natural language → Structured rules
   - Reduces training time for business users
   - Maintains consistency

## Next Steps for Full Implementation

1. **Build Rules Engine Service**
   - Create `RatingEngine` class
   - Implement condition evaluator
   - Implement action executor

2. **Add Rating API**
   ```typescript
   POST /api/v1/rating/calculate
   POST /api/v1/rating/test-rule/:ruleId
   GET /api/v1/rating/rules-analysis
   ```

3. **Add Rule Testing**
   - Test with sample data before activating
   - See which rules would fire
   - Preview modifications

4. **Add Rule Monitoring**
   - Track how often each rule fires
   - Performance metrics
   - Business impact analysis

5. **Add Advanced Features**
   - Rule priorities/ordering
   - OR conditions in addition to AND
   - Complex actions (formulas, lookups)
   - Rule dependencies
