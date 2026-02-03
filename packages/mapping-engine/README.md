# @insurratex/mapping-engine

Data transformation engine for mapping between insurance systems and the Canonical Data Model (CDM).

## Overview

The Mapping Engine provides a declarative, configuration-driven approach to data transformation. It supports complex field mappings, lookups, expressions, custom functions, and validation - all without writing code for each transformation.

## Features

- **Declarative Mappings**: JSON-based configuration for all transformations
- **Multiple Transformation Types**: Direct, lookup, expression, conditional, concat, split, format, and more
- **Lookup Tables**: Define and reuse lookup tables for value mapping
- **Custom Functions**: JavaScript functions for complex transformations
- **Validation**: Built-in validators (required, min/max, pattern, email, URL, date)
- **Bi-directional**: Support for both to-CDM and from-CDM transformations
- **Registry**: Centralized mapping configuration management
- **Type-Safe**: Full TypeScript support

## Installation

```bash
npm install @insurratex/mapping-engine
```

## Quick Start

### Define a Mapping Configuration

```typescript
import { MappingConfiguration } from '@insurratex/mapping-engine';

const config: MappingConfiguration = {
  id: 'guidewire-cdm-gl',
  name: 'Guidewire to CDM - General Liability',
  version: '1.0.0',
  sourceSystem: 'guidewire',
  targetSystem: 'cdm',
  direction: 'to-cdm',
  productLine: 'general-liability',
  mappings: [
    {
      sourceField: '$.insured.name',
      targetField: 'insured.name',
      transformationType: 'direct',
      required: true
    },
    {
      sourceField: '$.productCode',
      targetField: 'productLine',
      transformationType: 'lookup',
      lookupTable: 'productMapping'
    },
    {
      targetField: 'version',
      transformationType: 'constant',
      constantValue: 'gl-v1.2'
    }
  ],
  lookupTables: {
    productMapping: {
      name: 'Product Code Mapping',
      entries: {
        'GL': 'general-liability',
        'PROP': 'property'
      }
    }
  }
};
```

### Execute the Mapping

```typescript
import { MappingExecutor } from '@insurratex/mapping-engine';

const executor = new MappingExecutor();

const sourceData = {
  insured: {
    name: 'Acme Corp'
  },
  productCode: 'GL'
};

const result = executor.execute(config, sourceData);

if (result.success) {
  console.log('Mapped data:', result.data);
  // {
  //   insured: { name: 'Acme Corp' },
  //   productLine: 'general-liability',
  //   version: 'gl-v1.2'
  // }
} else {
  console.error('Mapping errors:', result.errors);
}
```

### Use the Registry

```typescript
import { mappingRegistry } from '@insurratex/mapping-engine';

// Register mapping
mappingRegistry.register(config);

// Retrieve mapping
const mapping = mappingRegistry.get(
  'guidewire',
  'cdm',
  'general-liability',
  'to-cdm'
);

// Execute
const result = executor.execute(mapping, sourceData);
```

## Transformation Types

### 1. Direct

Copy field value directly from source to target.

```json
{
  "sourceField": "insured.name",
  "targetField": "insured.name",
  "transformationType": "direct"
}
```

### 2. Constant

Set a constant value.

```json
{
  "targetField": "status",
  "transformationType": "constant",
  "constantValue": "quote"
}
```

### 3. Lookup

Map values using a lookup table.

```json
{
  "sourceField": "productCode",
  "targetField": "productLine",
  "transformationType": "lookup",
  "lookupTable": "productMapping",
  "lookupDefault": "unknown"
}
```

### 4. Expression

Evaluate JavaScript expressions.

```json
{
  "sourceField": "exposure",
  "targetField": "calculatedPremium",
  "transformationType": "expression",
  "expression": "value * 2.5"
}
```

### 5. Function

Execute custom JavaScript functions.

```json
{
  "sourceField": "coverages",
  "targetField": "coverages",
  "transformationType": "function",
  "functionName": "transformCoverages"
}
```

Define the function in `customFunctions`:

```json
{
  "customFunctions": {
    "transformCoverages": "return value.map(c => ({ id: c.id, limit: c.limit, deductible: c.deductible }));"
  }
}
```

### 6. Conditional

Apply if-then-else logic.

```json
{
  "sourceField": "state",
  "targetField": "riskLevel",
  "transformationType": "conditional",
  "condition": "value === 'CA'",
  "trueValue": "high",
  "falseValue": "standard"
}
```

### 7. Concat

Concatenate multiple fields.

```json
{
  "targetField": "fullAddress",
  "transformationType": "concat",
  "concatFields": ["street", "city", "state"],
  "concatSeparator": ", "
}
```

### 8. Split

Split a field value.

```json
{
  "sourceField": "fullName",
  "targetField": "firstName",
  "transformationType": "split",
  "splitSeparator": " ",
  "splitIndex": 0
}
```

### 9. Format

Format values (date, currency, number, phone).

```json
{
  "sourceField": "effectiveDate",
  "targetField": "effectiveDate",
  "transformationType": "format",
  "formatType": "date",
  "format": "iso"
}
```

### 10. Default

Use default value if source is null/undefined.

```json
{
  "sourceField": "optionalField",
  "targetField": "value",
  "transformationType": "default",
  "defaultValue": "N/A"
}
```

## Validation

Add validators to field mappings:

```json
{
  "sourceField": "revenue",
  "targetField": "insured.annualRevenue",
  "transformationType": "direct",
  "required": true,
  "validators": ["min:0", "max:1000000000"]
}
```

### Available Validators

- `required`: Field must not be empty
- `min:N`: Minimum value for numbers
- `max:N`: Maximum value for numbers
- `minLength:N`: Minimum string length
- `maxLength:N`: Maximum string length
- `pattern:regex`: Regex pattern match
- `email`: Valid email format
- `url`: Valid URL format
- `date`: Valid date format

## Lookup Tables

Define reusable lookup tables:

```json
{
  "lookupTables": {
    "stateMapping": {
      "name": "State Code Mapping",
      "description": "Map state abbreviations to names",
      "entries": {
        "CA": "California",
        "TX": "Texas",
        "NY": "New York"
      },
      "defaultValue": "Unknown"
    }
  }
}
```

## Custom Functions

Add custom transformation logic:

```json
{
  "customFunctions": {
    "calculateAge": "const birthDate = new Date(value); const today = new Date(); return today.getFullYear() - birthDate.getFullYear();",

    "formatPhone": "const cleaned = value.replace(/\\D/g, ''); return `(${cleaned.substring(0,3)}) ${cleaned.substring(3,6)}-${cleaned.substring(6)}`;",

    "buildContact": "return { firstName: value.first, lastName: value.last, email: value.email, type: 'primary' };"
  }
}
```

## Mapping Registry

Centralized management of mapping configurations:

```typescript
import { mappingRegistry, MappingConfiguration } from '@insurratex/mapping-engine';

// Register a mapping
mappingRegistry.register(config);

// Get a mapping
const mapping = mappingRegistry.get(
  'guidewire',
  'cdm',
  'general-liability',
  'to-cdm'
);

// List mappings
const allMappings = mappingRegistry.listAll();
const gwMappings = mappingRegistry.listBySourceSystem('guidewire');
const glMappings = mappingRegistry.listByProductLine('general-liability');

// Update a mapping
mappingRegistry.update(updatedConfig);

// Delete a mapping
mappingRegistry.delete('guidewire', 'cdm', 'general-liability', 'to-cdm');

// Load from JSON
const configs: MappingConfiguration[] = [...];
mappingRegistry.loadFromJSON(configs);

// Export to JSON
const exported = mappingRegistry.exportToJSON();
```

## Result Structure

```typescript
interface MappingResult {
  success: boolean;
  data?: any;                    // Transformed data
  errors?: MappingError[];       // Errors that prevented success
  warnings?: MappingWarning[];   // Non-fatal warnings
  metadata?: {
    mappingId: string;
    direction: MappingDirection;
    executionTime?: number;      // Milliseconds
    fieldsProcessed?: number;
    fieldsMapped?: number;
  };
}
```

## Examples

See the `mappings/` directory for complete examples:

- `guidewire-to-cdm-gl.json`: Guidewire PolicyCenter to CDM mapping
- `cdm-to-earnix-gl.json`: CDM to Earnix Rating Engine mapping

### Example: Guidewire to CDM

```typescript
import { mappingRegistry, MappingExecutor } from '@insurratex/mapping-engine';
import guidewireToCdmConfig from './mappings/guidewire-to-cdm-gl.json';

// Register mapping
mappingRegistry.register(guidewireToCdmConfig);

// Source data from Guidewire
const guidewireData = {
  quoteNumber: 'Q-2026-001234',
  productCode: 'GL',
  effectiveDate: '2026-03-01',
  expirationDate: '2027-03-01',
  insured: {
    name: 'Acme Manufacturing Corp',
    businessType: 'MFG',
    addressLine1: '1234 Industrial Pkwy',
    city: 'San Francisco',
    state: 'CA',
    postalCode: '94102',
    annualRevenue: 5000000
  },
  classification: {
    code: '91580'
  }
};

// Execute mapping
const executor = new MappingExecutor();
const result = executor.execute(guidewireToCdmConfig, guidewireData);

if (result.success) {
  console.log('CDM Policy:', result.data);
  // Output is a valid CDM Policy object
}
```

### Example: CDM to Earnix

```typescript
import cdmToEarnixConfig from './mappings/cdm-to-earnix-gl.json';

// CDM policy
const cdmPolicy = {
  quoteNumber: 'Q-2026-001234',
  productLine: 'general-liability',
  version: 'gl-v1.2',
  insured: {
    name: 'Acme Corp',
    businessType: 'manufacturing',
    primaryAddress: {
      state: 'CA'
    },
    annualRevenue: 5000000
  },
  coverages: [
    {
      id: 'cov-001',
      type: 'general-liability',
      limit: 2000000,
      deductible: 5000,
      isPrimary: true
    }
  ],
  ratingFactors: {
    classCode: '91580',
    yearsInBusiness: 10
  }
};

// Transform to Earnix format
const result = executor.execute(cdmToEarnixConfig, cdmPolicy);

console.log('Earnix Request:', result.data);
// {
//   requestId: 'rate-1234567890-abc123',
//   productLine: 'general-liability',
//   productVersion: 'gl-v1.2',
//   insured: {
//     state: 'CA',
//     businessType: 'manufacturing',
//     annualRevenue: 5000000
//   },
//   coverages: [...],
//   ratingFactors: {...}
// }
```

## JSONPath Support

The mapping engine supports JSONPath for flexible field access:

```json
{
  "sourceField": "$.insured.contacts[0].email",
  "targetField": "primaryEmail",
  "transformationType": "direct"
}
```

JSONPath features:
- `$.field`: Root level field
- `$.nested.field`: Nested field access
- `$.array[0]`: Array index access
- `$.items[*].name`: All items in array

## Best Practices

1. **Use Required Fields**: Mark critical fields as `required: true`
2. **Provide Defaults**: Use lookup defaults and default transformations
3. **Validate Data**: Add validators to catch data quality issues
4. **Document Mappings**: Add descriptions to field mappings
5. **Version Configurations**: Include version numbers in mapping IDs
6. **Test Transformations**: Write tests for complex custom functions
7. **Keep Functions Simple**: Break complex logic into multiple mappings
8. **Use Lookup Tables**: Centralize value mappings for reusability

## Error Handling

```typescript
const result = executor.execute(config, sourceData);

if (!result.success) {
  // Handle errors
  result.errors?.forEach(error => {
    console.error(`Field: ${error.field}`);
    console.error(`Error: ${error.message}`);
    console.error(`Code: ${error.code}`);
  });
}

// Handle warnings
if (result.warnings) {
  result.warnings.forEach(warning => {
    console.warn(`Field: ${warning.field}`);
    console.warn(`Warning: ${warning.message}`);
  });
}
```

## Performance

The mapping engine is optimized for performance:

- **Lazy Evaluation**: Only processes mapped fields
- **Efficient Lookups**: O(1) lookup table access
- **Minimal Allocations**: Reuses objects where possible
- **Metadata Tracking**: Optional performance metrics

Example performance metrics:

```typescript
console.log(`Execution time: ${result.metadata.executionTime}ms`);
console.log(`Fields processed: ${result.metadata.fieldsProcessed}`);
console.log(`Fields mapped: ${result.metadata.fieldsMapped}`);
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
