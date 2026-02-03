# InsurRateX AI Services

AI-powered services for intelligent field mapping and natural language rule generation.

## Features

### 1. Mapping Suggester

Automatically suggests field mappings between systems using:
- **Exact name matching**: Case-insensitive field name matching
- **Semantic matching**: Common insurance field patterns
- **Type-based matching**: Data type analysis
- **AI suggestions**: OpenAI GPT-4 powered suggestions
- **Historical learning**: Pattern matching from past mappings

### 2. NLP Rule Generator

Converts natural language to business rules:
- **Natural language input**: Plain English descriptions
- **Multiple rule types**: Lookup, decision, conditional
- **AI-powered**: Uses GPT-4 for complex rules
- **Template fallback**: Pattern matching for common cases
- **Rule validation**: Suggests improvements

## Installation

```bash
npm install @insurratex/ai-services
```

## Usage

### Mapping Suggester

```typescript
import { MappingSuggester } from '@insurratex/ai-services';

const suggester = new MappingSuggester(process.env.OPENAI_API_KEY);

const sourceFields = [
  {
    path: '$.Quote.QuoteNumber',
    name: 'QuoteNumber',
    type: 'string',
    description: 'Unique quote identifier',
  },
  {
    path: '$.Quote.AccountHolder.Name',
    name: 'AccountHolderName',
    type: 'string',
  },
];

const targetFields = [
  {
    path: 'policyId',
    name: 'policyId',
    type: 'string',
    description: 'Policy identifier',
  },
  {
    path: 'insured.name',
    name: 'name',
    type: 'string',
  },
];

const suggestions = await suggester.suggestMappings(sourceFields, targetFields, {
  sourceSystem: 'guidewire',
  targetSystem: 'cdm',
  productLine: 'general-liability',
  useHistoricalMappings: true,
  confidenceThreshold: 0.7,
});

console.log(suggestions);
// [
//   {
//     sourceField: '$.Quote.QuoteNumber',
//     targetField: 'policyId',
//     confidence: 0.95,
//     transformationType: 'direct',
//     reasoning: 'Semantic match: quoteNumber → policyId'
//   },
//   ...
// ]
```

### NLP Rule Generator

```typescript
import { NLPRuleGenerator } from '@insurratex/ai-services';

const generator = new NLPRuleGenerator(process.env.OPENAI_API_KEY);

// Example 1: Conditional rule
const rule1 = await generator.generateRule({
  description: 'If annual revenue is greater than 5 million then apply 4% surcharge',
  productLine: 'general-liability',
  ruleType: 'conditional',
});

console.log(rule1);
// {
//   type: 'conditional',
//   name: 'High Revenue Surcharge',
//   description: '...',
//   confidence: 0.95,
//   rule: {
//     conditions: [
//       { field: 'insured.annualRevenue', operator: '>', value: 5000000 }
//     ],
//     actions: [
//       { type: 'surcharge', field: 'premium', value: 4.0 }
//     ]
//   },
//   explanation: 'Applies 4% surcharge when annual revenue exceeds $5M'
// }

// Example 2: Lookup table
const rule2 = await generator.generateRule({
  description: 'State surcharges: CA=5%, NY=8%, TX=3.5%',
  productLine: 'general-liability',
  ruleType: 'lookup',
});

// Example 3: Decision table
const rule3 = await generator.generateRule({
  description: 'Experience modifier: 0 claims = -5%, 1-2 claims = 0%, 3+ claims = +10%',
  productLine: 'general-liability',
  ruleType: 'decision',
});
```

## Configuration

### Environment Variables

```bash
# Optional - enables AI-powered suggestions
OPENAI_API_KEY=sk-...

# Fallback to template-based generation if not set
```

### Without OpenAI

The services work without an API key using:
- Template-based pattern matching
- String similarity algorithms
- Common insurance field mappings
- Heuristic rules

```typescript
// Works without API key
const suggester = new MappingSuggester();
const suggestions = await suggester.suggestMappings(...);

const generator = new NLPRuleGenerator();
const rule = await generator.generateRule(...);
```

## API Reference

### MappingSuggester

#### `suggestMappings(sourceFields, targetFields, options)`

Suggests field mappings between source and target schemas.

**Parameters:**
- `sourceFields`: Array of source field information
- `targetFields`: Array of target field information
- `options`: Configuration options
  - `sourceSystem`: Source system name
  - `targetSystem`: Target system name
  - `productLine`: Product line
  - `useHistoricalMappings`: Use historical patterns (default: false)
  - `confidenceThreshold`: Minimum confidence (default: 0.5)

**Returns:** `Promise<MappingSuggestion[]>`

#### `addHistoricalMapping(sourceSystem, targetSystem, productLine, mapping)`

Add historical mapping for learning.

### NLPRuleGenerator

#### `generateRule(request)`

Generate business rule from natural language description.

**Parameters:**
- `request`: Rule generation request
  - `description`: Natural language description
  - `productLine`: Product line
  - `ruleType`: Optional rule type hint
  - `context`: Optional context (available fields, existing rules)

**Returns:** `Promise<GeneratedRule>`

#### `suggestImprovements(rule)`

Analyze rule and suggest improvements.

**Returns:** `Promise<string[]>`

## Strategies

### Mapping Suggestions

1. **Exact Name Matching** (95% confidence)
   - Direct field name matches (case-insensitive)

2. **Semantic Matching** (80% confidence)
   - Common insurance field patterns
   - Synonym detection

3. **Type-Based Matching** (70% confidence)
   - Data type compatibility
   - Special handling for dates, numbers

4. **AI-Powered** (varies)
   - GPT-4 analysis
   - Context-aware suggestions

5. **Historical Patterns** (85% confidence)
   - Learn from past mappings
   - System-specific patterns

### Rule Generation

1. **AI-Powered (Primary)**
   - GPT-4 natural language understanding
   - Context-aware generation
   - Confidence: 70-95%

2. **Template-Based (Fallback)**
   - Pattern matching for common rules
   - Regex-based extraction
   - Confidence: 50-85%

## Examples

### Common Patterns

**Surcharge Rules:**
```
"If annual revenue > $5M then apply 4% surcharge"
"Apply 10% surcharge when claim count >= 3"
"Charge extra 5% for high-risk states"
```

**Lookup Tables:**
```
"State codes: CA=5%, NY=8%, TX=3.5%"
"Business types: MFG=0.8, RETAIL=1.2, OFFICE=0.9"
"Commission rates by agent level: Bronze=5%, Silver=7%, Gold=10%"
```

**Decision Tables:**
```
"Experience modifier based on claims:
 - 0 claims: -5% discount
 - 1-2 claims: no change
 - 3+ claims: +10% surcharge"
```

## Integration

### With Mapping UI

```typescript
// In mapping editor
const suggestions = await mappingSuggester.suggestMappings(
  sourceSchema,
  targetSchema,
  options
);

// Display suggestions to user
for (const suggestion of suggestions) {
  showSuggestion(suggestion);
}
```

### With Rules UI

```typescript
// In rule editor
const nlpInput = getUserInput(); // "If revenue > 5M then apply 4% surcharge"

const generatedRule = await ruleGenerator.generateRule({
  description: nlpInput,
  productLine: 'general-liability',
});

// Pre-fill form with generated rule
populateRuleForm(generatedRule);
```

## Testing

```bash
npm test
```

## Performance

- **Mapping suggestions**: < 1s for 100 fields
- **AI-powered**: 2-5s (depends on OpenAI)
- **Template-based**: < 100ms
- **Historical matching**: < 50ms

## Limitations

- AI suggestions require OpenAI API key
- Template-based has limited pattern coverage
- Confidence scores are estimates
- Always review generated rules

## Future Enhancements

- [ ] Support more AI providers (Claude, Gemini)
- [ ] Fine-tuned models for insurance domain
- [ ] Feedback loop for improving suggestions
- [ ] Batch processing for large schemas
- [ ] Multi-language support
- [ ] Advanced pattern recognition
- [ ] Conflict detection
- [ ] Impact analysis

## License

MIT

---

Part of the InsurRateX platform.
