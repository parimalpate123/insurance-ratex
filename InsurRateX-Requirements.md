# InsurRateX: Plug-and-Play Insurance Rating Exchange
## Comprehensive Requirements & Implementation Guide

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Use Cases & Examples](#use-cases--examples)
3. [User Flows](#user-flows)
4. [Architecture Overview](#architecture-overview)
5. [Canonical Data Model (CDM)](#canonical-data-model-cdm)
6. [Rules Engine Design](#rules-engine-design)
7. [Adapter SDK (Library Layer)](#adapter-sdk-library-layer)
8. [Framework Layer (Runtime Platform)](#framework-layer-runtime-platform)
9. [AI Capabilities](#ai-capabilities-detail)
10. [Mock Implementation Strategy](#mock-implementation-strategy)
11. [Implementation Flow](#implementation-flow)
12. [TODO Tasks](#todo-tasks-organized-by-component)
13. [Success Metrics](#success-metrics)
14. [Technology Stack](#technology-stack-recommendations)
15. [Verification & Testing](#verification--testing-plan)

---

## Executive Summary

InsurRateX is a cloud-native, reusable interoperability platform designed as a **hybrid library + framework solution** that enables insurance policy systems (Guidewire, Duck Creek, Salesforce) to exchange rating data with multiple rating engines through standardized adapters and intelligent mapping.

### Core Innovation

**Library Layer**: Reusable SDK for developers to build custom adapters and transformations
- npm installable package
- TypeScript interfaces and utilities
- Plug-and-play adapter framework

**Framework Layer**: Visual UI platform for business analysts to create mappings without code
- Drag-drop mapping canvas
- Rule builder with NLP support
- Test harness and versioning

**AI-Powered**: NLP-to-rule generation for business logic and auto-suggest mapping intelligence
- Auto-suggest field mappings (60%+ accuracy)
- Natural language to JSON rule conversion
- Learning from historical mappings

**Rules Engine**: Configuration-driven business rules (surcharges, commissions, lookups)
- Lookup tables (CSV/JSON)
- Decision tables (multi-dimensional)
- Conditional rules (complex logic)

### Target Users

- **Business Analysts (primary)** - create mappings via UI
- **Developers (secondary)** - extend via library for complex cases
- **Insurance carriers** - deploying self-hosted or consuming as SaaS

---

## Use Cases & Examples

### Use Case 1: Adding a New Policy System Adapter

**Scenario:** Insurance carrier uses Salesforce Policy Center and needs to connect to existing rating engines.

**Without InsurRateX:**
- 6-8 weeks of custom development
- Bespoke integration code
- No reusability across products

**With InsurRateX:**
- Developer installs adapter SDK library
- Implements 3 interface methods (authenticate, send, receive)
- BA creates field mappings via drag-drop UI
- 1-2 weeks, 80% less code

**Example Flow:**
```
Salesforce Policy → Salesforce Adapter (custom) →
Canonical Model (CDM) → Mapping Engine →
Rating Engine Adapter → Response →
Reverse Transform → Salesforce Response
```

---

### Use Case 2: Business Analyst Creates Mappings (No Code)

**Scenario:** New product line (Cyber Insurance) needs mapping from Guidewire to rating engine.

**BA Workflow:**
1. Opens InsurRateX mapping canvas
2. Uploads sample Guidewire payload (JSON)
3. AI suggests mappings: `GW.PolicyNumber → CDM.policy.id`
4. BA drags/drops fields for custom mappings
5. Selects transformation functions (date format, lookup)
6. Tests with sample data
7. Versions and deploys (v1.0)

**AI Assistance:**
- "Map these 15 standard fields automatically"
- "Last time you mapped `effectiveDate` to `CDM.policy.effectiveDate`"
- Learn from 1000s of existing mappings across carriers

---

### Use Case 3: Rule-Based Logic Configuration

**Scenario:** State-specific surcharges and commission rates need to be applied.

**Traditional Approach:**
- Hard-coded IF statements
- Requires developer for every change
- Error-prone, slow

**InsurRateX Approach:**

**BA uses NLP to create rule:**
```
BA types: "Apply 5% surcharge for California policies
with coverage over $1M"
```

**AI generates:**
```json
{
  "ruleId": "ca-high-value-surcharge",
  "conditions": [
    {"field": "risk.state", "operator": "equals", "value": "CA"},
    {"field": "coverage.limit", "operator": "greaterThan", "value": 1000000}
  ],
  "action": {
    "type": "applySurcharge",
    "value": 0.05,
    "valueType": "percentage"
  }
}
```

**Or BA uploads lookup table:**
| State | Surcharge % | Commission % |
|-------|-------------|--------------|
| CA    | 5.0         | 12.0         |
| TX    | 3.5         | 10.0         |
| NY    | 4.2         | 11.5         |

Stored as versioned config, referenced in mappings.

---

### Use Case 4: Multi-Format Transformation

**Scenario:** Legacy rating engine expects XML, modern policy system sends JSON.

**InsurRateX handles:**
- JSON (Salesforce) → CDM (JSON) → Transform to XML → Rating Engine
- Built-in format converters in library
- BA selects "Output Format: XML" in UI

---

## User Flows

### Flow 1: BA Creating New Product Line Mapping

```
┌─────────────────────────────────────────────────────┐
│ 1. BA logs into InsurRateX Framework UI             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Selects "Create New Mapping"                     │
│    - Source: Guidewire                              │
│    - Target: CDM (Product: General Liability v1.2)  │
│    - Rating Engine: SocotraRating                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Uploads sample Guidewire GL payload (JSON)       │
│    - System parses and displays source schema       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. AI Auto-Suggest runs                             │
│    - "15 standard fields mapped automatically"      │
│    - BA reviews, approves/modifies suggestions      │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. BA manually maps remaining fields via drag-drop  │
│    - Applies transformations (date format, lookup)  │
│    - References rule tables (state surcharge)       │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Test Harness - uploads test payload              │
│    - Previews transformation result                 │
│    - Validates against CDM schema                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 7. Versions mapping (v1.0) and submits for approval │
│    - Optional: workflow for manager review          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 8. Deploys to DEV → QA → PROD environments          │
└─────────────────────────────────────────────────────┘
```

---

### Flow 2: Developer Creating Custom Adapter

```
┌─────────────────────────────────────────────────────┐
│ 1. Developer installs InsurRateX SDK                │
│    npm install @insurratex/adapter-sdk              │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Extends base PolicySystemAdapter interface       │
│    class DuckCreekAdapter extends PolicyAdapter {   │
│      authenticate() { ... }                         │
│      sendRatingRequest(cdm) { ... }                 │
│      parseRatingResponse(response) { ... }          │
│    }                                                │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. Uses library utilities                           │
│    - Validators (validateCDM)                       │
│    - Transformers (jsonToXml, formatDate)           │
│    - Error handlers (RetryPolicy)                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. Tests adapter locally with mock data             │
│    - Unit tests with Jest                           │
│    - Integration tests against test CDM             │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Registers adapter in Framework                   │
│    - Upload adapter package to registry             │
│    - Configure in InsurRateX admin UI               │
│    - Now available to BAs for mapping               │
└─────────────────────────────────────────────────────┘
```

---

### Flow 3: AI-Assisted Rule Creation

```
┌─────────────────────────────────────────────────────┐
│ 1. BA navigates to "Rules & Logic" section          │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 2. Types natural language rule                      │
│    "For Texas commercial auto policies,             │
│     apply 8% commission if premium > $5000"         │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 3. AI parses NLP and generates:                     │
│    - Conditions (state=TX, product=CommAuto, etc)   │
│    - Action (commission calculation)                │
│    - Decision table or JSON rule                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 4. BA reviews generated rule in visual editor       │
│    - Modifies thresholds if needed                  │
│    - Adds additional conditions                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 5. Tests rule with sample scenarios                 │
│    - Upload test cases CSV                          │
│    - Verify expected outputs                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────┐
│ 6. Saves rule to versioned registry                 │
│    - Rule ID: tx-commauto-commission-tier1          │
│    - Version: v1.0                                  │
│    - References in mapping workflows                │
└─────────────────────────────────────────────────────┘
```

---

## Architecture Overview

### Hybrid Model: Library + Framework

```
┌─────────────────────────────────────────────────────────────┐
│                     FRAMEWORK LAYER                         │
│  (Runtime Platform - Used by BAs and Admins)                │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Mapping UI   │  │ Rules Engine │  │ Test Harness │     │
│  │ (Visual)     │  │ (NLP→Config) │  │ (Preview)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │        Orchestration & Routing Engine                 │  │
│  │  (Request routing, correlation IDs, versioning)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────┬────────────────────────────────────┘
                          │ Uses
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                     LIBRARY LAYER                           │
│  (SDK - Used by Developers)                                 │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Adapter SDK  │  │ Transformers │  │ Validators   │     │
│  │ (Interfaces) │  │ (JSON↔XML)   │  │ (CDM Schema) │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ CDM Models   │  │ Rule Engine  │  │ Utilities    │     │
│  │ (TypeScript) │  │ (Evaluator)  │  │ (Logging)    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
└─────────────────────────────────────────────────────────────┘

         ┌────────────┐         ┌────────────┐
         │ npm install│         │  Framework │
         │ @insurratex│         │   Runtime  │
         │ /adapter-sdk│        │  (Docker)  │
         └────────────┘         └────────────┘
              Devs                    BAs
```

---

### Component Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Policy Systems                           │
│         (Guidewire, Duck Creek, Salesforce)                 │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              ADAPTER REGISTRY                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Guidewire  │  │  Duck Creek  │  │  Salesforce  │     │
│  │   Adapter    │  │   Adapter    │  │   Adapter    │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         (Pluggable - implement PolicySystemAdapter)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│            CANONICAL DATA MODEL (CDM)                       │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Base Model (80% common)                             │  │
│  │  - policy: { id, effectiveDate, expiryDate }         │  │
│  │  - insured: { name, address, contact }               │  │
│  │  - coverages: [ { type, limit, deductible } ]        │  │
│  │  - claims: [ { claimId, lossDate, amount } ]         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Product-Line Extensions (20% unique)                │  │
│  │  - GL: premises, operations, products liability      │  │
│  │  - Property: building, contents, business income     │  │
│  │  - InlandMarine: equipment, tools, transit           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Versioning: gl-v1.2, property-v1.0, cyber-v1.0             │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         MAPPING & TRANSFORMATION ENGINE                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Mapping Registry (Versioned)                        │  │
│  │  - gw-to-cdm-gl-v1.5.json                            │  │
│  │  - salesforce-to-cdm-property-v2.0.json              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Transformation Functions                            │  │
│  │  - formatDate(source, "YYYY-MM-DD")                  │  │
│  │  - lookup("state-surcharge", state)                  │  │
│  │  - calculate("premium * (1 + surcharge)")            │  │
│  │  - conditional(if-then-else logic)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Mapping Assistant                                │  │
│  │  - Auto-suggest from historical mappings             │  │
│  │  - Pattern recognition (PolicyNumber → policy.id)    │  │
│  │  - Confidence scores (95% match)                     │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│              RULES ENGINE                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rule Registry (Versioned Configs)                   │  │
│  │  - Lookup Tables: state-surcharge-v1.0.csv           │  │
│  │  - Decision Tables: commission-matrix-v2.1.json      │  │
│  │  - Conditional Rules: ca-highvalue-surcharge.json    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AI Rule Generator (NLP → Config)                    │  │
│  │  Input: "Apply 5% surcharge for CA over $1M"         │  │
│  │  Output: JSON rule definition                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Rule Evaluator                                      │  │
│  │  - Executes rules against CDM data                   │  │
│  │  - Returns calculated values (surcharge, commission) │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│         RATING ENGINE ADAPTER REGISTRY                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Socotra    │  │   ISO         │  │   Custom     │     │
│  │   Adapter    │  │   Adapter     │  │   Engine     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│         (Pluggable - implement RatingEngineAdapter)         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Rating Engines                             │
│         (Socotra, ISO, Custom On-Prem)                      │
└─────────────────────────────────────────────────────────────┘

         REVERSE FLOW (Response Transformation)
                     │
                     ▼
         CDM → Mapping Engine → Original System Format
```

---

### Data Flow: End-to-End Example

**Scenario:** Guidewire sends GL policy for rating, state-specific surcharge applies

```
1. Guidewire Request (JSON)
   ↓
2. Guidewire Adapter
   - Authenticates
   - Parses payload
   - Correlation ID: req-12345
   ↓
3. Transform to CDM
   - Applies mapping: gw-to-cdm-gl-v1.5
   - Validates against CDM schema
   - CDM: { policy: {...}, insured: {...}, coverages: [...] }
   ↓
4. Rules Engine Evaluation
   - Looks up: state-surcharge table (CA = 5%)
   - Evaluates: ca-highvalue-surcharge rule (premium > $1M)
   - Injects: surcharge = 0.05 into CDM
   ↓
5. Transform CDM → Rating Engine Format
   - Applies mapping: cdm-to-socotra-v2.0
   - Format conversion: JSON → XML (if needed)
   ↓
6. Socotra Rating Engine Adapter
   - Sends rating request
   - Receives response with premium calculation
   ↓
7. Transform Response to CDM
   - Parses Socotra response
   - Maps to CDM response schema
   ↓
8. Apply Response Rules
   - Calculate commission (lookup: state-commission)
   - Add taxes, fees
   ↓
9. Transform CDM → Guidewire Format
   - Reverse mapping: cdm-to-gw-response-v1.5
   - Includes: premium, surcharge breakdown, commission
   ↓
10. Guidewire Response (JSON)
    - Correlation ID: req-12345
    - Status: success
    - Payload: { premium: $12,500, surcharge: $625, ... }
```

**Observability:**
- Each step logged with correlation ID
- Mapping version tracked (audit trail)
- Performance metrics (latency per stage)

---

## Canonical Data Model (CDM)

### Base Model Structure

**Core Entities (Product-agnostic):**

```json
{
  "version": "cdm-v1.0",
  "correlationId": "req-12345",
  "timestamp": "2026-01-31T10:30:00Z",

  "policy": {
    "id": "POL-2024-00123",
    "effectiveDate": "2026-02-01",
    "expiryDate": "2027-02-01",
    "status": "active",
    "productLine": "general-liability",
    "productVersion": "gl-v1.2"
  },

  "insured": {
    "type": "business",
    "name": "Acme Corp",
    "taxId": "12-3456789",
    "address": {
      "street": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105"
    }
  },

  "coverages": [
    {
      "coverageId": "cov-001",
      "type": "general-liability",
      "limit": 2000000,
      "deductible": 5000,
      "premium": null
    }
  ],

  "ratingFactors": {
    "state": "CA",
    "businessType": "manufacturing",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },

  "customFields": {}
}
```

### Product-Line Extensions

**General Liability (GL):**
```json
{
  "productLine": "general-liability",
  "productVersion": "gl-v1.2",
  "glSpecific": {
    "premises": {
      "squareFootage": 10000,
      "numberOfLocations": 3
    },
    "operations": {
      "hasSubcontractors": true,
      "annualPayroll": 2000000
    },
    "productsLiability": {
      "annualSales": 3000000,
      "productType": "electronics"
    }
  }
}
```

**Property:**
```json
{
  "productLine": "property",
  "productVersion": "property-v1.0",
  "propertySpecific": {
    "building": {
      "constructionType": "frame",
      "yearBuilt": 1995,
      "replacementCost": 500000
    },
    "contents": {
      "value": 100000,
      "specialItems": []
    }
  }
}
```

**Versioning Strategy:**
- Semantic versioning: `gl-v1.2` (major.minor)
- Backward compatibility for 2 major versions
- Deprecation warnings in mapping UI

---

## Rules Engine Design

### Three Rule Types

#### 1. Lookup Tables
**Use Case:** Simple key → value mappings

**Example: State Surcharge Table**
```csv
state,surcharge_percent,effective_date
CA,5.0,2026-01-01
TX,3.5,2026-01-01
NY,4.2,2026-01-01
FL,2.8,2026-01-01
```

**Storage:** Versioned CSV/JSON in rule registry
**Reference in Mapping:** `lookup("state-surcharge-v1.0", policy.state)`

---

#### 2. Decision Tables
**Use Case:** Multi-dimensional lookups

**Example: Commission Matrix**

| State | Product Line | Channel | Premium Range | Commission % |
|-------|--------------|---------|---------------|--------------|
| CA    | GL           | Direct  | $0-$10k       | 10.0         |
| CA    | GL           | Direct  | $10k-$50k     | 12.0         |
| CA    | GL           | Broker  | $0-$10k       | 15.0         |
| TX    | Property     | Direct  | $0-$25k       | 8.0          |

**Storage:** JSON decision table format
```json
{
  "tableId": "commission-matrix-v2.1",
  "dimensions": ["state", "productLine", "channel", "premiumRange"],
  "rules": [
    {
      "conditions": {
        "state": "CA",
        "productLine": "general-liability",
        "channel": "direct",
        "premiumRange": [0, 10000]
      },
      "output": { "commission": 0.10 }
    }
  ]
}
```

**BA Interaction:** Spreadsheet-like editor in UI

---

#### 3. Conditional Rules (JSON Format)
**Use Case:** Complex business logic

**Example: High-Value Surcharge Rule**
```json
{
  "ruleId": "ca-highvalue-surcharge-v1.0",
  "description": "Apply 5% surcharge for CA policies with coverage over $1M",
  "conditions": {
    "operator": "AND",
    "clauses": [
      {
        "field": "policy.state",
        "operator": "equals",
        "value": "CA"
      },
      {
        "field": "coverages[0].limit",
        "operator": "greaterThan",
        "value": 1000000
      }
    ]
  },
  "actions": [
    {
      "type": "applySurcharge",
      "field": "premium",
      "calculation": "premium * 0.05",
      "description": "5% CA high-value surcharge"
    }
  ],
  "priority": 100,
  "effectiveDate": "2026-01-01"
}
```

**Evaluation Engine:**
- Parses JSON rules
- Evaluates conditions against CDM
- Executes actions (modify fields, add charges)
- Supports priority ordering (lower priority first)

---

### AI Rule Generation (NLP → Config)

**BA Input (Natural Language):**
```
"For Texas commercial auto policies, apply 8% commission
if premium is greater than $5000, otherwise 6%"
```

**AI Processing:**
1. Extract entities: state (TX), product (commercial auto), field (premium), thresholds ($5k)
2. Identify rule type: conditional (if-then-else)
3. Generate decision table or conditional rule

**AI Output (Decision Table):**
```json
{
  "tableId": "tx-commauto-commission-tier",
  "generatedBy": "ai-nlp-v1.0",
  "confidence": 0.92,
  "rules": [
    {
      "conditions": {
        "state": "TX",
        "productLine": "commercial-auto",
        "premium": [5001, 999999999]
      },
      "output": { "commission": 0.08 }
    },
    {
      "conditions": {
        "state": "TX",
        "productLine": "commercial-auto",
        "premium": [0, 5000]
      },
      "output": { "commission": 0.06 }
    }
  ]
}
```

**BA Reviews:**
- Visual editor shows generated rule
- Can adjust thresholds, add conditions
- Tests with sample data
- Saves versioned rule

**AI Training Data:**
- Existing rules from other carriers (anonymized)
- Domain ontology (insurance terms)
- Historical BA edits (reinforcement learning)

---

## Adapter SDK (Library Layer)

### Developer Experience

**Installation:**
```bash
npm install @insurratex/adapter-sdk
npm install @insurratex/transformers
```

**Interfaces to Implement:**

#### PolicySystemAdapter
```typescript
interface PolicySystemAdapter {
  // Metadata
  name: string;
  version: string;
  supportedFormats: ['json', 'xml'];

  // Lifecycle
  authenticate(config: AuthConfig): Promise<AuthToken>;

  // Request handling
  receiveRequest(payload: any): Promise<RawRequest>;
  transformToCDM(raw: RawRequest): Promise<CDMRequest>;

  // Response handling
  transformFromCDM(cdmResponse: CDMResponse): Promise<any>;
  sendResponse(payload: any): Promise<void>;

  // Error handling
  handleError(error: Error): ErrorResponse;
}
```

#### RatingEngineAdapter
```typescript
interface RatingEngineAdapter {
  name: string;
  version: string;

  authenticate(config: AuthConfig): Promise<AuthToken>;

  sendRatingRequest(cdm: CDMRequest): Promise<EngineResponse>;
  parseRatingResponse(response: EngineResponse): Promise<CDMResponse>;

  healthCheck(): Promise<boolean>;
}
```

**Utilities Provided:**

```typescript
import {
  validateCDM,
  formatDate,
  jsonToXml,
  xmlToJson,
  RetryPolicy,
  Logger
} from '@insurratex/adapter-sdk';

// Example usage in custom adapter
class DuckCreekAdapter implements PolicySystemAdapter {
  async transformToCDM(raw: RawRequest): Promise<CDMRequest> {
    const cdm = {
      policy: {
        id: raw.policyNumber,
        effectiveDate: formatDate(raw.effDate, 'YYYY-MM-DD'),
        // ...
      }
    };

    validateCDM(cdm, 'gl-v1.2');  // Throws if invalid
    return cdm;
  }
}
```

**Testing Support:**
```typescript
import { MockCDM, AdapterTestSuite } from '@insurratex/adapter-sdk/testing';

describe('DuckCreekAdapter', () => {
  it('transforms request to CDM', async () => {
    const adapter = new DuckCreekAdapter();
    const mockRequest = MockCDM.generateGLRequest();

    const cdm = await adapter.transformToCDM(mockRequest);
    expect(cdm.policy.productLine).toBe('general-liability');
  });
});
```

---

## Framework Layer (Runtime Platform)

### Mapping UI Components

#### 1. Visual Mapping Canvas
**Features:**
- Left panel: Source schema (Guidewire JSON)
- Right panel: Target schema (CDM)
- Drag field from source → drop on target
- Auto-suggest mappings highlighted in green
- Transformation functions selectable from dropdown

**AI Auto-Suggest:**
- Scans field names/types for semantic similarity
- Shows confidence score (95% match: `PolicyNumber → policy.id`)
- BA can accept all, review one-by-one, or reject

**Transformations:**
- Date format: `MM/DD/YYYY → YYYY-MM-DD`
- Lookup: `lookup("state-codes", sourceField)`
- Conditional: `if sourceField > 1000 then X else Y`
- Custom: Embed JavaScript expression (advanced)

---

#### 2. Rule Builder UI

**Lookup Table Editor:**
- Upload CSV or build inline
- Versioning controls (v1.0, v1.1, ...)
- Test lookup with sample keys

**Decision Table Editor:**
- Spreadsheet-like grid
- Add rows/columns dynamically
- Validate completeness (all combinations covered)

**Conditional Rule Builder:**
- Visual IF-THEN-ELSE builder
- Drag conditions (AND/OR logic)
- Select actions (apply surcharge, calculate commission)

**NLP Input Box:**
- BA types rule in plain English
- AI generates rule config
- BA reviews and edits
- Save to registry

---

#### 3. Test Harness

**Upload Test Payload:**
- Paste JSON or upload file
- Select mapping version to test
- Preview transformation result side-by-side

**Sample Data Library:**
- Pre-built test cases (GL policy, Property claim, etc.)
- BA can save own test scenarios
- Regression testing (ensure v1.6 still handles v1.0 payloads)

**Validation:**
- Schema validation (CDM compliance)
- Rule validation (surcharge applied correctly)
- Diff view (before vs after transformation)

---

#### 4. Versioning & Deployment

**Mapping Versions:**
- Every save creates new version (v1.5.1)
- Semantic versioning: major.minor.patch
- Backward compatibility warnings

**Approval Workflow (Optional):**
- BA submits mapping for review
- Manager approves/rejects with comments
- Approved mappings promote to PROD

**Environment Management:**
- DEV → QA → PROD pipelines
- Mapping deployed as config (no code rebuild)
- Rollback to previous version with one click

---

## AI Capabilities Detail

### 1. Mapping Auto-Suggest

**How It Works:**
- Training data: 1000s of existing mappings across carriers
- Embeddings: Field names + data types → vector space
- Similarity matching: `GW.PolicyNumber` ≈ `CDM.policy.id` (0.95 similarity)

**BA Experience:**
- Uploads Guidewire payload
- AI suggests 15/20 fields mapped automatically
- BA reviews, accepts, modifies
- Saves 60% of manual effort

**Learning Loop:**
- BA edits/rejects suggestions → feedback
- Model retrains weekly on new mappings
- Improves accuracy over time

---

### 2. NLP Rule Generation

**Input Examples:**
```
"Apply 5% surcharge for California policies with coverage over $1M"
"Commission is 12% for direct channel and 15% for broker channel"
"If flood zone is X or V, add $500 flood fee"
```

**AI Pipeline:**
1. **Entity Extraction:** state (CA), coverage ($1M), action (surcharge 5%)
2. **Rule Type Classification:** Conditional rule
3. **Code Generation:** JSON rule definition
4. **Validation:** Check fields exist in CDM schema

**Output:**
- JSON rule config (shown earlier)
- Confidence score (90% confident this is correct)
- BA reviews in visual editor

**Fallback:**
- If confidence < 70%, AI asks clarifying questions
- "Did you mean 5% of premium or 5% of coverage limit?"

---

### 3. Context Gathering (Phase 2 - MCP Integration)

**Vision:** BA asks questions, AI pulls context from multiple sources

**Example Scenario:**
```
BA: "What's the current rating rule for GL deductibles?"

AI fetches from:
- Confluence: GL product spec (last updated 2025-12-01)
- SharePoint: Actuarial deductible matrix (v3.2)
- JIRA: Open stories about deductible changes (RATE-456)
- Data dictionary: Field definitions

AI Response:
"Current rule: GL deductible is tiered based on coverage limit.
- $1M coverage: $1000 deductible
- $2M coverage: $2500 deductible
Source: Actuarial matrix v3.2 (SharePoint)
Note: JIRA story RATE-456 proposes changing to $1500/$3000 (pending)"
```

**Then BA uses this info to create mapping/rule**

**Technical Approach:**
- MCP (Model Context Protocol) connectors to enterprise tools
- Semantic search across docs
- Citation tracking (where info came from)

---

## Mock Implementation Strategy

### Overview

For the POC and development phases, we will implement custom mock servers for **Guidewire PolicyCenter** and **Earnix Rating Engine**. These mocks enable:
- End-to-end testing without enterprise licenses
- Rapid iteration on CDM and mapping development
- Demonstration of platform value with realistic data
- Offline development for distributed teams

---

### Guidewire Mock Server

**Purpose:** Simulate Guidewire PolicyCenter API for General Liability submissions

**Implementation Approach:** Custom NestJS/Express Server

**Why Custom:**
- Guidewire APIs are complex but well-structured
- Need to iterate on payload formats during mapping development
- Easy to add validation and error scenarios
- Full control over response timing and content

**Endpoints to Mock:**
```
POST /pc/rating/submit
  - Accept: Guidewire PolicyCenter GL submission
  - Return: Quote with premium breakdown

GET /pc/policy/{policyNumber}
  - Return: Policy details

POST /pc/policy/bind
  - Accept: Bind request
  - Return: Bound policy confirmation
```

**Sample Guidewire GL Payload Structure:**
```json
{
  "policyNumber": "POL-2024-001",
  "effectiveDate": "2024-01-01T00:00:00Z",
  "expirationDate": "2025-01-01T00:00:00Z",
  "accountNumber": "ACC-5678",
  "insured": {
    "name": "Acme Manufacturing Corp",
    "taxId": "12-3456789",
    "primaryAddress": {
      "addressLine1": "123 Industrial Blvd",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94105",
      "country": "US"
    },
    "businessType": "Manufacturing",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },
  "coverages": [
    {
      "coverageCode": "GeneralLiability",
      "coverageType": "GL_OCCURRENCE",
      "limits": {
        "generalAggregate": 2000000,
        "productsCompletedOps": 2000000,
        "personalAdvertisingInjury": 1000000,
        "eachOccurrence": 1000000,
        "fireDamage": 50000,
        "medicalExpense": 5000
      },
      "deductible": 5000,
      "premiumBasis": "Sales"
    }
  ],
  "locations": [
    {
      "locationNumber": "001",
      "address": {
        "addressLine1": "123 Industrial Blvd",
        "city": "San Francisco",
        "state": "CA",
        "postalCode": "94105"
      },
      "buildingSquareFootage": 10000,
      "numberOfEmployees": 50
    }
  ],
  "classification": {
    "naicsCode": "332710",
    "classCode": "91580",
    "description": "Machine Shops"
  }
}
```

**Mock Response Structure:**
```json
{
  "quoteNumber": "Q-2024-001",
  "policyNumber": "POL-2024-001",
  "status": "Quoted",
  "premium": {
    "basePremium": 12000.00,
    "surcharges": [
      {
        "type": "TerritorialSurcharge",
        "description": "California High-Risk Territory",
        "amount": 600.00
      }
    ],
    "discounts": [],
    "totalPremium": 12600.00,
    "taxes": 126.00,
    "fees": 50.00,
    "grandTotal": 12776.00
  },
  "effectiveDate": "2024-01-01T00:00:00Z",
  "expirationDate": "2025-01-01T00:00:00Z"
}
```

**Implementation Details:**
- **Language:** TypeScript with NestJS
- **Port:** 3001
- **Docker:** Containerized for easy deployment
- **Data:** In-memory storage with sample policies
- **Validation:** JSON schema validation for requests
- **Lines of Code:** ~500

**File Structure:**
```
packages/mocks/guidewire-mock/
├─ src/
│   ├─ controllers/
│   │   ├─ rating.controller.ts
│   │   ├─ policy.controller.ts
│   │   └─ bind.controller.ts
│   ├─ models/
│   │   ├─ policy.model.ts
│   │   └─ quote.model.ts
│   ├─ data/
│   │   ├─ sample-gl-policies.json
│   │   └─ sample-responses.json
│   ├─ validators/
│   │   └─ guidewire-schema.validator.ts
│   └─ main.ts
├─ test/
│   └─ e2e/
│       └─ rating.spec.ts
├─ Dockerfile
├─ package.json
└─ README.md
```

---

### Earnix Mock Server

**Purpose:** Simulate Earnix Rating Engine with realistic premium calculation logic

**Implementation Approach:** Custom NestJS Server with Actual Rating Formulas

**Why Custom (Critical for Earnix):**
- Earnix is a sophisticated rating engine - mock must demonstrate real value
- Implement simplified but realistic rating formulas
- Show territorial factors, experience modifiers, surcharges
- Proves InsurRateX value proposition - BAs can change rules and see impacts

**Endpoints to Mock:**
```
POST /earnix/api/v1/rate
  - Accept: Rating request (CDM format)
  - Return: Premium calculation with detailed breakdown

POST /earnix/api/v1/validate
  - Accept: Policy data
  - Return: Validation results

GET /earnix/api/v1/rating-factors
  - Return: Available rating factors and rules
```

**Sample Rating Request (CDM Format):**
```json
{
  "requestId": "req-12345",
  "productLine": "general-liability",
  "productVersion": "gl-v1.2",
  "policy": {
    "effectiveDate": "2024-01-01",
    "expirationDate": "2025-01-01"
  },
  "insured": {
    "type": "business",
    "state": "CA",
    "businessType": "manufacturing",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },
  "coverages": [
    {
      "type": "general-liability",
      "limit": 2000000,
      "deductible": 5000
    }
  ],
  "ratingFactors": {
    "classCode": "91580",
    "yearsInBusiness": 10,
    "claimsHistory": {
      "priorClaimsCount": 1,
      "priorClaimsAmount": 25000
    }
  }
}
```

**Rating Logic Implementation:**

```typescript
// Simplified Earnix Rating Algorithm

class EarnixRatingEngine {

  calculatePremium(request: RatingRequest): PremiumResponse {
    // Step 1: Base Rate Calculation
    const baseRate = this.getBaseRate(request.ratingFactors.classCode);
    const exposureBase = request.insured.annualRevenue / 1000; // Per $1K revenue
    const basePremium = baseRate * exposureBase;

    // Step 2: Apply Territorial Factor
    const territorialFactor = this.getTerritorialFactor(request.insured.state);
    const territorialPremium = basePremium * territorialFactor;

    // Step 3: Apply Experience Modifier
    const experienceMod = this.calculateExperienceMod(
      request.ratingFactors.claimsHistory
    );
    const modifiedPremium = territorialPremium * experienceMod;

    // Step 4: Apply Coverage Limit Factor
    const limitFactor = this.getLimitFactor(request.coverages[0].limit);
    const limitAdjustedPremium = modifiedPremium * limitFactor;

    // Step 5: Apply Deductible Credit
    const deductibleCredit = this.getDeductibleCredit(
      request.coverages[0].deductible
    );
    const finalPremium = limitAdjustedPremium * (1 - deductibleCredit);

    // Step 6: Apply Surcharges
    const surcharges = this.calculateSurcharges(request);
    const totalPremium = finalPremium + surcharges.total;

    return {
      basePremium,
      adjustments: [
        { type: 'TerritorialFactor', factor: territorialFactor, amount: territorialPremium - basePremium },
        { type: 'ExperienceMod', factor: experienceMod, amount: modifiedPremium - territorialPremium },
        { type: 'LimitFactor', factor: limitFactor, amount: limitAdjustedPremium - modifiedPremium },
        { type: 'DeductibleCredit', factor: 1 - deductibleCredit, amount: finalPremium - limitAdjustedPremium }
      ],
      surcharges: surcharges.items,
      totalPremium,
      calculationTimestamp: new Date()
    };
  }

  private getBaseRate(classCode: string): number {
    // Industry-specific base rates
    const baseRates = {
      '91580': 2.50,  // Machine Shops
      '10380': 1.20,  // Professional Services
      '13350': 3.80   // Construction
    };
    return baseRates[classCode] || 2.00;
  }

  private getTerritorialFactor(state: string): number {
    // State-based territorial factors
    const territorialFactors = {
      'CA': 1.15,  // California - higher risk
      'TX': 0.95,  // Texas - lower risk
      'NY': 1.10,  // New York - moderate risk
      'FL': 1.05   // Florida - moderate risk
    };
    return territorialFactors[state] || 1.00;
  }

  private calculateExperienceMod(claimsHistory: ClaimsHistory): number {
    // Experience modification based on claims
    if (!claimsHistory.priorClaimsCount) return 0.95; // Credit for no claims

    const claimFrequency = claimsHistory.priorClaimsCount;
    const claimSeverity = claimsHistory.priorClaimsAmount / claimFrequency;

    if (claimFrequency === 1 && claimSeverity < 50000) return 1.00;
    if (claimFrequency === 1 && claimSeverity >= 50000) return 1.10;
    if (claimFrequency >= 2) return 1.25;

    return 1.00;
  }

  private getLimitFactor(limit: number): number {
    // Increased Limits Factor (ILF)
    const ilf = {
      1000000: 1.00,
      2000000: 1.25,
      3000000: 1.45,
      5000000: 1.70
    };
    return ilf[limit] || 1.00;
  }

  private getDeductibleCredit(deductible: number): number {
    // Deductible credits
    const credits = {
      1000: 0.05,
      2500: 0.08,
      5000: 0.12,
      10000: 0.18
    };
    return credits[deductible] || 0.00;
  }

  private calculateSurcharges(request: RatingRequest): SurchargeResult {
    const items = [];
    let total = 0;

    // High-value surcharge (California policies over $1M)
    if (request.insured.state === 'CA' && request.coverages[0].limit > 1000000) {
      const surcharge = 500;
      items.push({
        type: 'HighValueSurcharge',
        description: 'CA High-Value Policy Surcharge',
        amount: surcharge
      });
      total += surcharge;
    }

    // New business surcharge
    if (request.ratingFactors.yearsInBusiness < 3) {
      const surcharge = 250;
      items.push({
        type: 'NewBusinessSurcharge',
        description: 'New Business Administrative Fee',
        amount: surcharge
      });
      total += surcharge;
    }

    return { items, total };
  }
}
```

**Mock Response Structure:**
```json
{
  "requestId": "req-12345",
  "quoteId": "EAR-Q-2024-001",
  "status": "Rated",
  "premium": {
    "basePremium": 12500.00,
    "adjustments": [
      {
        "type": "TerritorialFactor",
        "factor": 1.15,
        "description": "California Territory Adjustment",
        "amount": 1875.00
      },
      {
        "type": "ExperienceMod",
        "factor": 1.00,
        "description": "Experience Modification",
        "amount": 0.00
      },
      {
        "type": "LimitFactor",
        "factor": 1.25,
        "description": "$2M Limit Factor",
        "amount": 3593.75
      },
      {
        "type": "DeductibleCredit",
        "factor": 0.88,
        "description": "$5K Deductible Credit",
        "amount": -2156.25
      }
    ],
    "surcharges": [
      {
        "type": "HighValueSurcharge",
        "description": "CA High-Value Policy Surcharge",
        "amount": 500.00
      }
    ],
    "subtotal": 16312.50,
    "taxes": 163.13,
    "fees": 75.00,
    "totalPremium": 16550.63
  },
  "ratingFactorsUsed": {
    "baseRate": 2.50,
    "territorialFactor": 1.15,
    "experienceMod": 1.00,
    "limitFactor": 1.25,
    "deductibleCredit": 0.12
  },
  "calculationTimestamp": "2024-01-01T10:30:00Z",
  "version": "earnix-mock-v1.0"
}
```

**Implementation Details:**
- **Language:** TypeScript with NestJS
- **Port:** 4001
- **Docker:** Containerized for easy deployment
- **Rules:** Configurable JSON files for easy modification
- **Lines of Code:** ~800

**File Structure:**
```
packages/mocks/earnix-mock/
├─ src/
│   ├─ controllers/
│   │   ├─ rating.controller.ts
│   │   └─ validation.controller.ts
│   ├─ services/
│   │   ├─ rating-engine.service.ts
│   │   ├─ territorial-factors.service.ts
│   │   └─ surcharge-calculator.service.ts
│   ├─ rules/
│   │   ├─ base-rates.json
│   │   ├─ territorial-factors.json
│   │   ├─ experience-mods.json
│   │   ├─ limit-factors.json
│   │   └─ surcharge-rules.json
│   ├─ models/
│   │   ├─ rating-request.model.ts
│   │   └─ premium-response.model.ts
│   └─ main.ts
├─ test/
│   ├─ unit/
│   │   └─ rating-engine.spec.ts
│   └─ e2e/
│       └─ rating.spec.ts
├─ Dockerfile
├─ package.json
└─ README.md
```

---

### Docker Compose Setup

**All mocks can be started with a single command:**

```yaml
# docker-compose.yml
version: '3.8'

services:
  guidewire-mock:
    build: ./packages/mocks/guidewire-mock
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./packages/mocks/guidewire-mock/data:/app/data
    networks:
      - insurratex-network

  earnix-mock:
    build: ./packages/mocks/earnix-mock
    ports:
      - "4001:4001"
    environment:
      - NODE_ENV=development
      - LOG_LEVEL=debug
    volumes:
      - ./packages/mocks/earnix-mock/rules:/app/rules
    networks:
      - insurratex-network

  insurratex-orchestrator:
    build: ./apps/orchestrator
    ports:
      - "3000:3000"
    environment:
      - GUIDEWIRE_URL=http://guidewire-mock:3001
      - EARNIX_URL=http://earnix-mock:4001
    depends_on:
      - guidewire-mock
      - earnix-mock
    networks:
      - insurratex-network

networks:
  insurratex-network:
    driver: bridge
```

**Usage:**
```bash
# Start all services
docker-compose up

# Start specific service
docker-compose up guidewire-mock

# View logs
docker-compose logs -f earnix-mock

# Stop all services
docker-compose down
```

**Service URLs:**
- Guidewire Mock: http://localhost:3001
- Earnix Mock: http://localhost:4001
- InsurRateX Orchestrator: http://localhost:3000

---

### Mock Development Timeline

**Week 1: Basic Mocks**
- Day 1-2: Guidewire mock scaffolding
- Day 3-4: Earnix mock scaffolding
- Day 5: Docker setup and integration

**Week 2: Enhanced Logic**
- Day 1-2: Implement Earnix rating formulas
- Day 3: Add configurable rules
- Day 4-5: Testing and documentation

**Deliverables:**
- ✅ Functional Guidewire mock (3-4 endpoints)
- ✅ Functional Earnix mock with realistic calculations
- ✅ Docker containers for both
- ✅ docker-compose for easy startup
- ✅ Sample payloads and test cases
- ✅ README with API documentation

---

### Benefits of Custom Mocks

**For Development:**
- No external dependencies - work offline
- Instant feedback - no network latency
- Full control over test scenarios
- Easy to add edge cases and error conditions

**For Testing:**
- Repeatable, deterministic results
- Fast execution (no API rate limits)
- Easy to version control
- Can simulate failure scenarios

**For Demonstration:**
- Shows realistic premium calculations
- Proves value proposition to stakeholders
- BAs can experiment with rule changes
- No enterprise licenses required for demos

**For BA Training:**
- Safe environment to learn platform
- Immediate visual feedback
- Can experiment without production impact
- Build confidence before production deployment

---

### Migration to Real Systems

**When ready for production:**

1. **Guidewire Integration:**
   - Replace mock with real Guidewire adapter
   - Use same CDM mappings (already validated)
   - Add OAuth authentication
   - Handle Guidewire-specific error codes

2. **Earnix Integration:**
   - Option A: Use Earnix sandbox (if available)
   - Option B: License Earnix dev environment
   - Option C: Deploy to Earnix cloud
   - Mappings remain unchanged (benefit of CDM abstraction)

**Adapter swap is seamless:**
```typescript
// Development
const adapter = new GuidewireMockAdapter();

// Production
const adapter = new GuidewireCloudAdapter(config);

// Same interface, no mapping changes needed
```

---

## Implementation Flow

### Phase 1: Foundation (Weeks 1-4)

#### Week 1-2: Library SDK Setup
- Define TypeScript interfaces (PolicySystemAdapter, RatingEngineAdapter)
- Implement core utilities (validators, transformers, logger)
- Create CDM base model schema (JSON Schema)
- Set up npm package structure (@insurratex/adapter-sdk)
- Write unit tests for utilities
- Publish v0.1.0 to private npm registry

**Deliverable:** Developers can `npm install` and implement adapters

---

#### Week 3-4: CDM & Validation
- Design CDM base schema (policy, insured, coverages)
- Create product-line extensions (GL, Property, Inland Marine)
- Implement JSON Schema validators
- Version management system (gl-v1.0, property-v1.0)
- Mock data generators for testing
- Documentation (CDM field dictionary)

**Deliverable:** CDM schemas ready for mapping

---

### Phase 2: Adapters & Connectors (Weeks 5-8)

#### Week 5-6: Mock Adapters
- Guidewire adapter (mock JSON input/output)
- Rating engine adapter (mock Socotra-style)
- Authentication stubs (basic auth for POC)
- Correlation ID tracking
- Error handling & retries

**Deliverable:** End-to-end flow with mocks works

---

#### Week 7-8: Real Adapter (Guidewire)
- Connect to Guidewire Cloud API (or sandbox)
- Handle real payloads (GL, Property)
- OAuth authentication
- Integration tests with live data
- Performance benchmarks (latency targets)

**Deliverable:** Production-ready Guidewire adapter

---

### Phase 3: Mapping Engine (Weeks 9-12)

#### Week 9-10: Core Mapping
- Mapping registry (store mapping configs)
- Transformation engine (apply mappings to CDM)
- Declarative mapping DSL (JSON format)
- Versioning (v1.0, v1.1, deprecation)
- Conditional transformations (if-then logic)

**Deliverable:** Mapping configs transform data correctly

---

#### Week 11-12: Mapping UI (Basic)
- Visual canvas (drag-drop fields)
- Transformation function selector (date format, lookup)
- Test harness (upload payload, preview result)
- Save/load mappings
- React-based UI, deployed as web app

**Deliverable:** BA can create mappings without code

---

### Phase 4: Rules Engine (Weeks 13-16)

#### Week 13-14: Rule Storage & Evaluation
- Rule registry (versioned configs)
- Lookup table engine (CSV/JSON storage)
- Decision table evaluator
- Conditional rule evaluator (JSON rules)
- Priority-based execution order

**Deliverable:** Rules execute correctly against CDM

---

#### Week 15-16: Rule UI
- Lookup table editor (upload CSV, inline editing)
- Decision table editor (spreadsheet grid)
- Conditional rule builder (visual IF-THEN)
- Test harness (validate rule outputs)
- Versioning & approval workflow

**Deliverable:** BA can create rules via UI

---

### Phase 5: AI Features (Weeks 17-20)

#### Week 17-18: Mapping Auto-Suggest
- Collect training data (existing mappings)
- Train similarity model (field name embeddings)
- API endpoint for suggestions
- Integrate into mapping UI (auto-suggest panel)
- Confidence scoring (show 95% match)
- Feedback loop (BA accepts/rejects)

**Deliverable:** AI suggests 60%+ of mappings

---

#### Week 19-20: NLP Rule Generation
- NLP model for rule extraction (insurance domain)
- Entity recognition (state, premium, surcharge)
- Rule type classification (lookup vs conditional)
- JSON rule generator
- Integrate into rule builder UI (NLP input box)
- Validation & BA review workflow

**Deliverable:** BA can type rules in English, AI generates config

---

### Phase 6: Orchestration & Observability (Weeks 21-24)

#### Week 21-22: Orchestration Layer
- Stateless orchestrator service (Node.js/NestJS)
- Request routing (policy system → rating engine)
- Correlation ID management
- Retry policies (exponential backoff)
- Circuit breaker for downstream failures
- Multi-tenant support (carrier isolation)

**Deliverable:** Reliable request routing at scale

---

#### Week 23-24: Observability
- Structured logging (JSON logs, correlation IDs)
- Tracing (mapping version applied, rules executed)
- Metrics (latency, error rates, throughput)
- Dashboard (Grafana or custom React UI)
- Alerts (Slack/email on failures)
- Audit trail (who changed what mapping when)

**Deliverable:** Full visibility into platform operations

---

### Phase 7: Deployment & Testing (Weeks 25-28)

#### Week 25-26: Kubernetes Deployment
- Dockerize all services (orchestrator, UI, adapters)
- Kubernetes manifests (deployments, services)
- Helm charts for easy deployment
- CI/CD pipeline (GitHub Actions or GitLab CI)
- Environment configs (DEV, QA, PROD)
- Auto-scaling policies (HPA)

**Deliverable:** Platform runs on Kubernetes

---

#### Week 27-28: End-to-End Testing
- Integration tests (Guidewire → Rating Engine → Response)
- Performance tests (100 req/s target)
- BA user acceptance testing (UAT)
- Security review (basic auth → OAuth transition plan)
- Documentation (deployment guide, BA user guide)
- Demo preparation (success criteria scenarios)

**Deliverable:** Production-ready platform

---

## TODO Tasks (Organized by Component)

### Library SDK (@insurratex/adapter-sdk)
- [ ] Define TypeScript interfaces (PolicySystemAdapter, RatingEngineAdapter)
- [ ] Implement utility functions (validateCDM, formatDate, jsonToXml)
- [ ] Create CDM TypeScript types (auto-generate from JSON Schema)
- [ ] Build retry/circuit breaker utilities
- [ ] Set up logging framework (Winston or Pino)
- [ ] Write unit tests (Jest, 80%+ coverage)
- [ ] Create mock data generators (MockCDM.generateGLRequest)
- [ ] Publish to npm registry (private or public)
- [ ] Write developer documentation (README, API docs)
- [ ] Create example adapter (reference implementation)

---

### Canonical Data Model (CDM)
- [ ] Design base schema (policy, insured, coverages, claims)
- [ ] Create JSON Schema definitions for validation
- [ ] Define product-line extensions (GL, Property, InlandMarine, Cyber)
- [ ] Implement versioning system (semantic versions)
- [ ] Build schema migration tools (v1.0 → v1.1)
- [ ] Create field dictionary (markdown docs)
- [ ] Generate sample payloads for testing
- [ ] Validate backward compatibility
- [ ] Set up schema registry (store versioned schemas)

---

### Adapters & Connectors
- [ ] Implement mock Guidewire adapter (JSON in/out)
- [ ] Implement mock rating engine adapter (Socotra-style)
- [ ] Build real Guidewire Cloud API adapter
- [ ] Add OAuth authentication for Guidewire
- [ ] Create adapter registry (discover available adapters)
- [ ] Implement adapter health checks
- [ ] Add correlation ID tracking
- [ ] Build error handling (retries, fallbacks)
- [ ] Write integration tests (against real APIs)
- [ ] Performance benchmarks (latency SLAs)

---

### Mapping Engine
- [ ] Design mapping DSL (JSON schema for mappings)
- [ ] Build mapping registry (store/retrieve configs)
- [ ] Implement transformation engine (apply mappings)
- [ ] Add transformation functions (date, lookup, conditional)
- [ ] Build versioning system (v1.5 → v1.6)
- [ ] Implement backward compatibility checks
- [ ] Create mapping validator (catch errors pre-deploy)
- [ ] Add dry-run mode (preview transformation)
- [ ] Write unit tests for transformations
- [ ] Performance optimize (transform 1000 records/sec)

---

### Mapping UI (Framework)
- [ ] Set up React app (Vite or Next.js)
- [ ] Build visual mapping canvas (drag-drop)
- [ ] Implement source/target schema display
- [ ] Add transformation function selector
- [ ] Create test harness (upload payload, preview)
- [ ] Build versioning UI (save, load, compare versions)
- [ ] Add search/filter for fields (large schemas)
- [ ] Implement approval workflow (submit for review)
- [ ] Connect to mapping API (backend)
- [ ] Write E2E tests (Playwright or Cypress)

---

### Rules Engine
- [ ] Design rule storage schema (JSON format)
- [ ] Build lookup table engine (CSV/JSON)
- [ ] Implement decision table evaluator
- [ ] Create conditional rule evaluator (JSON rules)
- [ ] Add priority/ordering system
- [ ] Build rule registry (versioned storage)
- [ ] Implement rule validator (catch conflicts)
- [ ] Create test harness (validate rule outputs)
- [ ] Performance optimize (evaluate 100 rules/req)
- [ ] Write unit tests for rule types

---

### Rules UI (Framework)
- [ ] Build lookup table editor (upload CSV, grid view)
- [ ] Create decision table editor (spreadsheet component)
- [ ] Implement conditional rule builder (visual IF-THEN)
- [ ] Add NLP input box (natural language → rule)
- [ ] Build rule testing UI (sample scenarios)
- [ ] Add versioning controls (v1.0, v1.1)
- [ ] Implement approval workflow
- [ ] Connect to rules API (backend)
- [ ] Write E2E tests

---

### AI Features

#### Mapping Auto-Suggest
- [ ] Collect training data (historical mappings)
- [ ] Build field name embedding model (semantic similarity)
- [ ] Train classification model (field type prediction)
- [ ] Create suggestion API endpoint
- [ ] Implement confidence scoring (0-100%)
- [ ] Add feedback loop (BA accepts/rejects)
- [ ] Integrate into mapping UI (auto-suggest panel)
- [ ] A/B test accuracy improvements
- [ ] Monitor false positive rate
- [ ] Set up model retraining pipeline (weekly)

#### NLP Rule Generation
- [ ] Collect NLP training data (rule descriptions)
- [ ] Build entity recognition model (state, premium, etc.)
- [ ] Train rule type classifier (lookup vs conditional)
- [ ] Implement JSON rule generator
- [ ] Create NLP API endpoint
- [ ] Add validation (check fields exist in CDM)
- [ ] Integrate into rule builder UI
- [ ] Implement clarifying question flow (low confidence)
- [ ] Monitor accuracy (human review rate)
- [ ] Set up model retraining

#### Context Gathering (Phase 2)
- [ ] Evaluate MCP (Model Context Protocol) feasibility
- [ ] Build connectors (Confluence, SharePoint, JIRA)
- [ ] Implement semantic search across sources
- [ ] Create citation tracking (source attribution)
- [ ] Design BA query interface (chat-like UI)
- [ ] Integrate into mapping/rule creation flow
- [ ] Test with real enterprise docs
- [ ] Measure time savings vs manual lookup

---

### Orchestration Layer
- [ ] Set up NestJS or Express app (Node.js)
- [ ] Implement request routing logic
- [ ] Add correlation ID generation/tracking
- [ ] Build retry policies (exponential backoff)
- [ ] Implement circuit breaker (downstream failures)
- [ ] Add multi-tenant support (carrier isolation)
- [ ] Create API gateway (rate limiting, auth)
- [ ] Write integration tests (end-to-end)
- [ ] Performance test (100+ req/s)
- [ ] Set up horizontal scaling (stateless)

---

### Observability & Audit
- [ ] Implement structured logging (JSON format)
- [ ] Add correlation ID to all logs
- [ ] Set up log aggregation (ELK or CloudWatch)
- [ ] Build tracing (mapping version, rules applied)
- [ ] Create metrics (Prometheus or DataDog)
- [ ] Build monitoring dashboard (Grafana or custom)
- [ ] Set up alerts (Slack, email, PagerDuty)
- [ ] Implement audit trail (change history)
- [ ] Add RBAC (who can change mappings)
- [ ] Write security audit report

---

### Deployment & Infrastructure
- [ ] Dockerize all services (orchestrator, UI, workers)
- [ ] Create Kubernetes manifests (deployments, services)
- [ ] Build Helm charts (parameterized configs)
- [ ] Set up CI/CD pipeline (GitHub Actions or GitLab)
- [ ] Configure environments (DEV, QA, PROD)
- [ ] Implement secrets management (Vault or K8s secrets)
- [ ] Set up auto-scaling (HPA, cluster autoscaler)
- [ ] Create backup/restore procedures
- [ ] Write deployment runbook
- [ ] Conduct disaster recovery test

---

### Testing & Quality
- [ ] Write unit tests (Jest, 80%+ coverage)
- [ ] Create integration tests (API level)
- [ ] Build E2E tests (Playwright, critical paths)
- [ ] Performance tests (load testing with k6)
- [ ] Security testing (OWASP top 10 scan)
- [ ] Accessibility testing (WCAG compliance)
- [ ] BA user acceptance testing (UAT)
- [ ] Create test data sets (various product lines)
- [ ] Automate regression tests (CI pipeline)
- [ ] Conduct chaos engineering tests (resilience)

---

### Documentation
- [ ] BA user guide (how to create mappings)
- [ ] Developer guide (how to build adapters)
- [ ] API documentation (OpenAPI/Swagger)
- [ ] CDM field dictionary (searchable)
- [ ] Architecture diagrams (C4 model)
- [ ] Deployment guide (Kubernetes setup)
- [ ] Troubleshooting guide (common issues)
- [ ] Video tutorials (screen recordings)
- [ ] Release notes (version changelog)
- [ ] FAQ (business and technical)

---

### Demo & Rollout
- [ ] Prepare demo script (success criteria)
- [ ] Create sample data (Guidewire GL payload)
- [ ] Record demo video (end-to-end flow)
- [ ] Conduct BA training sessions
- [ ] Pilot with one carrier (friendly customer)
- [ ] Gather feedback, iterate
- [ ] Plan phased rollout (product lines)
- [ ] Create launch checklist
- [ ] Set up support process (ticketing)
- [ ] Celebrate launch! 🎉

---

## Success Metrics

### Technical Metrics
- **End-to-end latency:** <500ms (p95)
- **Throughput:** 100+ requests/second
- **Uptime:** 99.9% SLA
- **Adapter onboarding:** <2 weeks for new system
- **Mapping creation:** 60% faster than manual coding

### Business Metrics
- **BA can create mappings without dev help:** 80% of cases
- **Time to add new product line:** 2 weeks → 3 days
- **Reusability:** 70% of mappings shared across carriers
- **AI auto-suggest accuracy:** 90%+ for standard fields
- **NLP rule generation:** 80% success rate (minimal BA edits)

### User Satisfaction
- **BA feedback:** "Easy to use" (4/5 or higher)
- **Developer feedback:** "Clear SDK, good docs" (4/5 or higher)
- **Customer feedback:** "Faster rollout than alternatives"

---

## Technology Stack Recommendations

### Library SDK
- **Language:** TypeScript (type safety, npm ecosystem)
- **Build:** tsup or Rollup
- **Testing:** Jest
- **Publishing:** npm private registry

### Framework Backend
- **Runtime:** Node.js (NestJS framework)
- **API:** REST (OpenAPI spec)
- **Database:** PostgreSQL (mapping/rule storage)
- **Cache:** Redis (performance optimization)
- **Message Queue:** RabbitMQ or Kafka (async processing)

### Framework UI
- **Framework:** React (Next.js or Vite)
- **State:** Zustand or Redux Toolkit
- **UI Library:** shadcn/ui or MUI
- **Drag-Drop:** react-dnd or dnd-kit
- **Testing:** Playwright (E2E), Vitest (unit)

### AI/ML
- **NLP:** OpenAI API (GPT-4) or local LLM (Llama 3)
- **Embeddings:** OpenAI Embeddings or sentence-transformers
- **Vector DB:** Pinecone or Weaviate (similarity search)

### Infrastructure
- **Container:** Docker
- **Orchestration:** Kubernetes (EKS, GKE, or AKS)
- **CI/CD:** GitHub Actions or GitLab CI
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK stack or CloudWatch
- **Secrets:** Vault or K8s secrets

### Development Tools
- **Version Control:** Git (GitHub or GitLab)
- **Project Management:** JIRA (track mapping stories)
- **Documentation:** Markdown (Docusaurus or GitBook)
- **Collaboration:** Slack or Teams

---

## Verification & Testing Plan

### End-to-End Verification

1. **Deploy platform to Kubernetes cluster**
2. **Register Guidewire adapter** in framework
3. **BA creates GL mapping** (Guidewire → CDM → Socotra)
4. **BA creates state surcharge rule** (lookup table)
5. **Send test Guidewire payload** via API
6. **Verify transformation:**
   - CDM created correctly
   - Surcharge applied (5% for CA)
   - Rating engine called
   - Response transformed back to Guidewire format
7. **Check observability:**
   - Logs show correlation ID
   - Dashboard shows request latency
   - Audit trail shows mapping version used

### Acceptance Criteria

- ✅ BA completes mapping in <30 minutes (no dev help)
- ✅ AI suggests 12/15 fields correctly
- ✅ NLP rule generation works for simple rules
- ✅ End-to-end latency <500ms
- ✅ No code changes needed to add new adapter
- ✅ Platform runs reliably on Kubernetes (99% uptime in QA)

---

## Summary

InsurRateX will be a **hybrid library + framework solution** enabling plug-and-play insurance rating interoperability:

**For Developers:** Install SDK, implement 3 interface methods, deploy adapter
**For Business Analysts:** Drag-drop mappings, create rules via UI, deploy without code
**For Organizations:** Reusable components, faster rollouts, AI-powered automation

### Implementation Approach
- **28 weeks** to production-ready platform
- **Iterative delivery** (working software every 4 weeks)
- **BA involvement** from week 11 (mapping UI ready)
- **Kubernetes-native**, cloud-agnostic

### Key Differentiators
- **Hybrid approach** (flexibility for both BAs and devs)
- **AI-powered** (mapping suggestions, NLP rule generation)
- **Truly reusable** (adapters, mappings, rules as versioned artifacts)
- **Observable** (full audit trail, debugging tools)

---

## Next Steps

1. **Review this requirements document** with stakeholders
2. **Clarify any questions** or ambiguities
3. **Begin Phase 1** (Library SDK foundation)
4. **Set up development environment** and tooling
5. **Create initial project structure** (monorepo recommended)

---

**Document Version:** 1.0
**Last Updated:** 2026-01-31
**Status:** Approved for Implementation
