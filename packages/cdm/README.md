# @insurratex/cdm

Canonical Data Model (CDM) for InsurRateX platform - standardized insurance data schemas with versioning and validation.

## Overview

The CDM provides a unified data model for insurance policies across different product lines, enabling seamless integration between policy systems (Guidewire, Duck Creek, Salesforce) and rating engines (Earnix, ISO, custom).

### Design Philosophy

- **80/20 Rule**: 80% common base model + 20% product-line extensions
- **Semantic Versioning**: Version format: `{product-line}-v{major}.{minor}` (e.g., `gl-v1.2`)
- **Type Safety**: Full TypeScript types with class-validator decorators
- **Extensibility**: Extensions object for product-specific and custom fields
- **Backward Compatibility**: Minor version upgrades are backward compatible

## Installation

```bash
npm install @insurratex/cdm
```

## Product Lines Supported

| Product Line | Current Version | Status |
|-------------|----------------|--------|
| General Liability | gl-v1.2 | ✅ Active |
| Property | property-v1.0 | ✅ Active |
| Inland Marine | inland-marine-v1.0 | ✅ Active |
| Workers Comp | workers-comp-v1.0 | 🚧 Planned |
| Commercial Auto | auto-v1.0 | 🚧 Planned |

## Usage

### Basic Example

```typescript
import { Policy, PolicyValidator, validate } from '@insurratex/cdm';

// Create a policy object
const policy: Policy = {
  version: 'gl-v1.2',
  productLine: 'general-liability',
  status: 'quote',
  effectiveDate: '2026-03-01T00:00:00Z',
  expirationDate: '2027-03-01T00:00:00Z',
  insured: {
    name: 'Acme Corp',
    businessType: 'manufacturing',
    primaryAddress: {
      street1: '123 Main St',
      city: 'San Francisco',
      state: 'CA',
      postalCode: '94102',
      country: 'USA'
    },
    contacts: [
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@acme.com',
        type: 'primary'
      }
    ],
    annualRevenue: 5000000
  },
  locations: [
    {
      id: 'loc-001',
      address: { /* ... */ },
      isPrimary: true
    }
  ],
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

// Validate using class-validator
const validator = plainToClass(PolicyValidator, policy);
const errors = await validate(validator);

if (errors.length > 0) {
  console.error('Validation failed:', errors);
} else {
  console.log('Policy is valid!');
}
```

### Product-Line Specific Usage

#### General Liability

```typescript
import { GLPolicy, GLCoverage, GLExtensions } from '@insurratex/cdm';

const glPolicy: GLPolicy = {
  version: 'gl-v1.2',
  productLine: 'general-liability',
  // ... base fields
  extensions: {
    classifications: [
      {
        classCode: '91580',
        description: 'Machine Shops',
        exposure: 5000000,
        exposureBase: 'revenue',
        rate: 2.5
      }
    ],
    blanketAdditionalInsured: true,
    primaryNonContributory: true,
    waiverOfSubrogation: true,
    liquorLiability: {
      included: false
    }
  }
};
```

#### Property

```typescript
import { PropertyPolicy, PropertyLocation, PropertyCoverage } from '@insurratex/cdm';

const propertyPolicy: PropertyPolicy = {
  version: 'property-v1.0',
  productLine: 'property',
  // ... base fields
  locations: [
    {
      id: 'loc-001',
      constructionType: 'masonry-non-combustible',
      occupancyType: 'retail',
      yearBuilt: 2010,
      areaSquareFeet: 10000,
      protectionClass: '3',
      sprinklered: true,
      sprinklerType: 'wet-pipe',
      // ... other fields
    }
  ],
  coverages: [
    {
      id: 'cov-001',
      type: 'building',
      coveredProperty: 'building',
      valuationMethod: 'replacement-cost',
      coinsurancePercent: 80,
      perils: 'special-form',
      // ... other fields
    }
  ],
  extensions: {
    windHailExcluded: false,
    floodExcluded: true,
    earthquakeExcluded: true,
    equipmentBreakdown: {
      included: true,
      limit: 100000
    }
  }
};
```

### Version Management

```typescript
import { VersionRegistry } from '@insurratex/cdm';

// Get latest version for a product line
const latestGL = VersionRegistry.getLatestVersion('general-liability');
console.log(latestGL); // "1.2.0"

// Check if version is supported
const isSupported = VersionRegistry.isVersionSupported('general-liability', '1.1.0');
console.log(isSupported); // true

// Check compatibility between versions
const compatible = VersionRegistry.isCompatible('general-liability', '1.1.0', '1.2.0');
console.log(compatible); // true (minor version upgrade)

// Parse version string
const parsed = VersionRegistry.parseVersionString('gl-v1.2');
console.log(parsed); // { productLine: 'general-liability', major: 1, minor: 2 }

// Get version info
const versionInfo = VersionRegistry.getVersionInfo('general-liability', '1.2.0');
console.log(versionInfo);
// {
//   productLine: 'general-liability',
//   version: '1.2.0',
//   releaseDate: '2026-03-01',
//   changelog: 'Added blanket additional insured...'
// }
```

## CDM Structure

### Base Model (80% Coverage)

Common fields across all product lines:

- **Policy Metadata**: ID, policy number, version, status, dates
- **Insured Information**: Name, business type, addresses, contacts, revenue
- **Locations**: Address, building/contents values
- **Coverages**: Limits, deductibles, premium
- **Rating Factors**: Class code, claims history, territory
- **Premium**: Base, surcharges, discounts, taxes, fees

### Product-Line Extensions (20% Unique)

Each product line adds specific fields via the `extensions` object:

**General Liability**:
- Classifications with exposure bases
- Additional insureds list
- Blanket AI, waiver of subrogation
- Liquor/contractual liability

**Property**:
- Construction/occupancy types
- Protection class, sprinkler info
- Building characteristics (year built, roof, etc.)
- Peril coverage options
- Loss history breakdown

**Inland Marine**:
- Equipment schedules
- GPS tracking, security features
- Coverage territory
- Transit coverage

## TypeScript Types

All types are fully typed with TypeScript:

```typescript
// Base types
import {
  Policy,
  Insured,
  Location,
  Coverage,
  Premium,
  RatingFactors,
  ClaimsHistory,
  Address,
  Contact
} from '@insurratex/cdm';

// Product-line types
import {
  GLPolicy,
  GLCoverage,
  GLLocation,
  GLExtensions,
  GLClassCode
} from '@insurratex/cdm';

import {
  PropertyPolicy,
  PropertyLocation,
  PropertyCoverage,
  ConstructionType,
  OccupancyType
} from '@insurratex/cdm';
```

## Validation

The CDM uses `class-validator` for runtime validation:

```typescript
import { PolicyValidator, validate, plainToClass } from '@insurratex/cdm';

async function validatePolicy(policyData: any) {
  // Transform plain object to class instance
  const policyValidator = plainToClass(PolicyValidator, policyData);

  // Validate
  const errors = await validate(policyValidator);

  if (errors.length > 0) {
    // Handle validation errors
    errors.forEach(error => {
      console.log(`Field: ${error.property}`);
      console.log(`Constraints:`, error.constraints);
    });
    return false;
  }

  return true;
}
```

### Validation Rules

- **Dates**: ISO 8601 format required
- **State Codes**: 2-letter uppercase (e.g., "CA", "TX")
- **Version Format**: `{product-line}-v{major}.{minor}`
- **Money Amounts**: Non-negative numbers
- **Year Established**: Between 1800 and current year
- **Employee Count**: Non-negative integer
- **Coverage Limits**: Must be positive numbers

## Sample Data

See the `samples/` directory for complete examples:

- `gl-policy-sample.json`: General Liability policy
- `property-policy-sample.json`: Property policy
- `inland-marine-policy-sample.json`: Inland Marine policy (coming soon)

## Versioning Strategy

### Version Format

- **Format**: `{product-line}-v{major}.{minor}`
- **Example**: `gl-v1.2` (General Liability version 1.2)

### Version Rules

1. **Major Version** (X.0): Breaking changes, not backward compatible
2. **Minor Version** (X.Y): New features, backward compatible
3. **Patch Version**: Not used in version string (handled in package.json)

### Compatibility Matrix

| From Version | To Version | Compatible? | Notes |
|-------------|-----------|-------------|-------|
| gl-v1.0 | gl-v1.1 | ✅ Yes | Minor upgrade, backward compatible |
| gl-v1.1 | gl-v1.2 | ✅ Yes | Minor upgrade, backward compatible |
| gl-v1.2 | gl-v2.0 | ❌ No | Major version change, breaking changes |
| gl-v1.0 | property-v1.0 | ❌ No | Different product lines |

### Deprecation Policy

- Versions are supported for **18 months** after deprecation
- Deprecated versions trigger warnings but continue to work
- Check `VersionRegistry.getVersionInfo()` for deprecation status

## Extension Guidelines

When adding custom fields to the CDM:

1. **Use the extensions object** for product-specific data
2. **Document your extensions** with TypeScript interfaces
3. **Prefix custom fields** with your organization code (e.g., `acme_customField`)
4. **Avoid conflicting** with standard field names

Example:

```typescript
const policy: Policy = {
  // ... standard fields
  extensions: {
    // Standard GL extensions
    classifications: [...],

    // Custom extensions
    acme_internalRiskScore: 85,
    acme_underwriterNotes: "Excellent loss history",
    acme_customRatingFactors: {
      safetyProgram: true,
      certifications: ["ISO9001", "OHSAS18001"]
    }
  }
};
```

## Development

### Build

```bash
npm run build
```

### Test

```bash
npm test
npm run test:watch
npm run test:cov
```

### Validate Samples

```bash
npm run validate
```

## Contributing

When adding new product lines or extending existing schemas:

1. Add types to `src/types/extensions/{product}.types.ts`
2. Create validators in `src/validators/{product}.validator.ts`
3. Register versions in `src/version-registry.ts`
4. Add sample data to `samples/{product}-policy-sample.json`
5. Update this README with examples
6. Run tests and validation

## License

MIT

## Support

For issues or questions, contact the InsurRateX development team.
