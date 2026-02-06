# Product Configuration-Driven Architecture
## Rating Domain - Independent Product Line Model

**Version:** 1.0
**Date:** February 5, 2026
**Purpose:** Define configuration-driven architecture for independent product line development

---

## Executive Summary

**Key Principles:**
1. **Configuration-Driven:** Product Line Configuration determines all functionality, APIs, and flows
2. **Independent Development:** 3-4 product lines can be developed in parallel by separate teams
3. **Shared Orchestration:** Common orchestration engine routes to appropriate product line
4. **Self-Service Onboarding:** Hybrid wizard for first product, self-service after
5. **Rating Domain Focus:** Start with Rating, park Policy/Billing/Claims for future

---

## Architecture Overview

### High-Level Model

```
┌─────────────────────────────────────────────────────────────────┐
│                    InsurRateX Platform                          │
│                                                                  │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Core Orchestration Engine (Shared)              │    │
│  │  - Request routing                                      │    │
│  │  - Authentication/authorization                         │    │
│  │  - Rate limiting                                        │    │
│  │  - Monitoring/logging                                   │    │
│  │  - Feature toggles                                      │    │
│  │  - Wave rollout management                             │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌────────────────────────────────────────────────────────┐    │
│  │         Product Line Router (Config-Driven)            │    │
│  │  - Reads product line configuration                    │    │
│  │  - Routes to correct product line handler              │    │
│  └────────────────────────────────────────────────────────┘    │
│                            ↓                                     │
│  ┌───────────┬───────────┬───────────┬───────────────────┐    │
│  │   GL      │    WC     │ Property  │  Inland Marine    │    │
│  │ Product   │ Product   │ Product   │  Product Line     │    │
│  │  Line     │  Line     │  Line     │                   │    │
│  │           │           │           │                   │    │
│  │ - Config  │ - Config  │ - Config  │ - Config          │    │
│  │ - Rules   │ - Rules   │ - Rules   │ - Rules           │    │
│  │ - Maps    │ - Maps    │ - Maps    │ - Maps            │    │
│  │ - Plugins │ - Plugins │ - Plugins │ - Plugins         │    │
│  │ - APIs    │ - APIs    │ - APIs    │ - APIs            │    │
│  └───────────┴───────────┴───────────┴───────────────────┘    │
│       ↓            ↓           ↓              ↓                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐  ┌─────────────┐        │
│  │ Earnix  │ │Ratabase │ │ Earnix  │  │  Ratabase   │        │
│  │  API    │ │   API   │ │  API    │  │    API      │        │
│  └─────────┘ └─────────┘ └─────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Independence Model

**Each Product Line has:**
- ✅ Own configuration (isolated)
- ✅ Own team ownership
- ✅ Own delivery schedule
- ✅ Own target rating engine (Earnix, Ratabase, custom)
- ✅ Own mappings, rules, workflow
- ✅ Own API endpoints
- ✅ Own feature toggles and wave rollout

**Product Lines share:**
- ✅ Core orchestration engine
- ✅ Authentication/authorization
- ✅ Rate limiting and throttling
- ✅ Monitoring and logging infrastructure
- ✅ Template marketplace
- ✅ Plugin library

---

## Product Line Configuration Schema

### Core Configuration Object

Each product line has a comprehensive configuration that drives everything:

```json
{
  "productLine": {
    "id": "gl-commercial-001",
    "code": "GL_COMM",
    "name": "General Liability - Commercial",
    "displayName": "GL Commercial",
    "description": "General liability coverage for commercial businesses",
    "version": "2.0",
    "status": "active",
    "createdDate": "2026-01-15",
    "lastModified": "2026-02-05",

    "ownership": {
      "productOwner": "sarah@abcinsurance.com",
      "technicalLead": "lisa@abcinsurance.com",
      "businessAnalyst": "michael@abcinsurance.com",
      "team": "GL-Team"
    },

    "deployment": {
      "environment": "production",
      "releaseSchedule": "bi-weekly",
      "independentDeployment": true,
      "cicdPipeline": "gl-commercial-pipeline"
    },

    "integrations": {
      "sourceSystem": {
        "name": "Guidewire PolicyCenter",
        "type": "guidewire",
        "version": "10.2",
        "apiEndpoint": "https://gw.abcinsurance.com/pc/api/v1",
        "authentication": "oauth2",
        "credentialsRef": "guidewire-prod-credentials"
      },

      "targetSystems": [
        {
          "name": "Earnix Rating Engine",
          "type": "earnix",
          "purpose": "premium_calculation",
          "apiEndpoint": "https://earnix.abcinsurance.com/rating/api",
          "authentication": "api_key",
          "credentialsRef": "earnix-prod-credentials",
          "timeout": 30000,
          "retryPolicy": {
            "maxRetries": 3,
            "backoff": "exponential"
          }
        },
        {
          "name": "D&B Enrichment",
          "type": "external_api",
          "purpose": "data_enrichment",
          "apiEndpoint": "https://api.dnb.com/v1",
          "credentialsRef": "dnb-credentials",
          "optional": true
        }
      ],

      "webhooks": {
        "ratingComplete": "https://webhook.site/abc-gl-rating-complete",
        "ratingFailed": "https://webhook.site/abc-gl-rating-failed"
      }
    },

    "workflow": {
      "type": "sequential",
      "steps": [
        {
          "id": "validate",
          "type": "system",
          "name": "Validate Input",
          "required": true,
          "config": {
            "schema": "gl-quote-schema.json"
          }
        },
        {
          "id": "enrich",
          "type": "plugin",
          "name": "D&B Business Enrichment",
          "pluginId": "dnb-enrichment-v2",
          "required": false,
          "config": {
            "cacheEnabled": true,
            "cacheTTL": 86400
          },
          "errorHandling": "continue"
        },
        {
          "id": "transform",
          "type": "system",
          "name": "Execute Mappings",
          "required": true,
          "mappingSetId": "gl-gw-earnix-mappings-v2"
        },
        {
          "id": "underwriting",
          "type": "plugin",
          "name": "Custom Underwriting Check",
          "pluginId": "custom-underwriting-v1",
          "required": true,
          "config": {
            "declineOnRejection": true
          },
          "errorHandling": "fail"
        },
        {
          "id": "rules",
          "type": "system",
          "name": "Execute Rating Rules",
          "required": true,
          "ruleSetId": "gl-rating-rules-v2"
        },
        {
          "id": "calculate",
          "type": "plugin",
          "name": "Call Earnix API",
          "pluginId": "earnix-connector-v3",
          "required": true,
          "config": {
            "projectId": "ABC_GL_COMMERCIAL"
          },
          "errorHandling": "fail"
        },
        {
          "id": "document",
          "type": "plugin",
          "name": "Generate PDF Worksheet",
          "pluginId": "pdf-generator-v1",
          "required": false,
          "config": {
            "template": "gl-rating-worksheet.html",
            "outputBucket": "abc-rating-worksheets"
          },
          "errorHandling": "continue"
        },
        {
          "id": "store",
          "type": "plugin",
          "name": "Store to S3",
          "pluginId": "s3-storage-v2",
          "required": false,
          "config": {
            "bucket": "abc-rating-transactions",
            "retentionDays": 2555
          },
          "errorHandling": "continue"
        },
        {
          "id": "notify",
          "type": "plugin",
          "name": "Email Notification",
          "pluginId": "email-notifier-v1",
          "required": false,
          "config": {
            "template": "rating-complete-notification"
          },
          "errorHandling": "continue"
        }
      ]
    },

    "features": {
      "stateSupport": ["CA", "NY", "TX", "FL", "IL"],
      "territorySupport": true,
      "experienceRating": true,
      "scheduleRating": false,
      "minimumPremium": true,
      "maximumPremium": true,
      "multiLocation": true,
      "retrospectiveRating": false
    },

    "featureToggles": [
      {
        "toggleKey": "ca_wildfire_surcharge_2026",
        "enabled": true,
        "enabledStates": ["CA", "OR", "WA"],
        "waveConfig": {
          "currentWave": 2,
          "waves": [
            {
              "wave": 1,
              "states": ["CA"],
              "startDate": "2026-02-10",
              "endDate": "2026-02-24"
            },
            {
              "wave": 2,
              "states": ["OR", "WA"],
              "startDate": "2026-02-24",
              "endDate": "2026-03-10"
            }
          ]
        }
      }
    ],

    "limits": {
      "minCoverageLimit": 100000,
      "maxCoverageLimit": 10000000,
      "minDeductible": 1000,
      "maxDeductible": 100000,
      "minPremium": 500,
      "maxPremium": 500000
    },

    "businessRules": {
      "ruleSetId": "gl-rating-rules-v2",
      "ruleCount": 28,
      "ruleTypes": ["base_premium", "modifier", "surcharge", "discount", "validation"]
    },

    "fieldMappings": {
      "mappingSetId": "gl-gw-earnix-mappings-v2",
      "mappingCount": 52,
      "sourceFields": 47,
      "targetFields": 52,
      "customFields": 5
    },

    "api": {
      "baseEndpoint": "/api/v1/rating/gl-commercial",
      "endpoints": {
        "quote": {
          "path": "/quote",
          "method": "POST",
          "rateLimit": "1000/minute",
          "authentication": "required",
          "inputSchema": "gl-quote-request.json",
          "outputSchema": "gl-quote-response.json"
        },
        "requote": {
          "path": "/requote/{quoteId}",
          "method": "POST",
          "rateLimit": "1000/minute",
          "authentication": "required"
        },
        "status": {
          "path": "/status/{quoteId}",
          "method": "GET",
          "rateLimit": "5000/minute",
          "authentication": "optional"
        }
      }
    },

    "monitoring": {
      "metrics": {
        "transactionVolume": true,
        "successRate": true,
        "averageResponseTime": true,
        "errorRate": true,
        "premiumDistribution": true
      },
      "alerts": {
        "errorRateThreshold": 5,
        "responseTimeThreshold": 5000,
        "notificationChannels": ["email", "slack"]
      },
      "logging": {
        "level": "info",
        "retentionDays": 90,
        "includeRequestBody": false,
        "includeResponseBody": false
      }
    },

    "testing": {
      "testScenariosCount": 50,
      "automatedTests": true,
      "testDataAvailable": true,
      "testCoverage": 95
    },

    "documentation": {
      "userGuide": "https://docs.insurratex.com/products/gl-commercial",
      "apiDocs": "https://api.insurratex.com/docs/gl-commercial",
      "businessRulesDoc": "https://docs.insurratex.com/rules/gl-commercial",
      "fieldMappingsDoc": "https://docs.insurratex.com/mappings/gl-commercial"
    }
  }
}
```

---

## How Configuration Drives Behavior

### 1. UI Wizard Behavior

**Configuration determines wizard steps:**

```javascript
// Wizard reads product line config
const config = getProductLineConfig(productLineId);

// Generate wizard steps dynamically
wizardSteps = [
  {
    step: 1,
    title: "Connect to " + config.integrations.sourceSystem.name,
    fields: generateFieldsFromSourceSystem(config.integrations.sourceSystem)
  },
  {
    step: 2,
    title: "Connect to " + config.integrations.targetSystems[0].name,
    fields: generateFieldsFromTargetSystem(config.integrations.targetSystems[0])
  },
  {
    step: 3,
    title: "Configure " + config.workflow.steps.length + " Workflow Steps",
    steps: config.workflow.steps.map(step => ({
      name: step.name,
      type: step.type,
      required: step.required
    }))
  },
  {
    step: 4,
    title: "Review " + config.fieldMappings.mappingCount + " Field Mappings",
    mappings: loadMappings(config.fieldMappings.mappingSetId)
  },
  {
    step: 5,
    title: "Test with Sample Quote",
    testData: loadTestData(config.testing)
  }
];
```

**Result:** Different product lines have different wizard experiences based on their configuration.

### 2. API Endpoint Generation

**Configuration determines API routes:**

```javascript
// Automatically create API endpoints from config
app.post(config.api.baseEndpoint + config.api.endpoints.quote.path,
  rateLimit(config.api.endpoints.quote.rateLimit),
  authenticate(config.api.endpoints.quote.authentication),
  async (req, res) => {
    // Route to product line handler
    const result = await orchestrator.execute(config.productLine.code, req.body);
    res.json(result);
  }
);

// Result: Each product line gets own endpoints
// GL: POST /api/v1/rating/gl-commercial/quote
// WC: POST /api/v1/rating/wc-standard/quote
// Property: POST /api/v1/rating/property-commercial/quote
```

### 3. Workflow Execution

**Configuration determines workflow steps:**

```javascript
async function executeWorkflow(productLineCode, inputData) {
  const config = getProductLineConfig(productLineCode);

  let context = {
    data: inputData,
    productLine: productLineCode,
    results: {}
  };

  // Execute each step from config
  for (const step of config.workflow.steps) {
    try {
      switch (step.type) {
        case 'system':
          context = await executeSystemStep(step, context);
          break;
        case 'plugin':
          context = await executePlugin(step.pluginId, step.config, context);
          break;
      }
    } catch (error) {
      if (step.errorHandling === 'fail') {
        throw error;
      } else if (step.errorHandling === 'continue') {
        console.warn(`Step ${step.name} failed but continuing`, error);
      }
    }
  }

  return context.results;
}
```

### 4. Feature Toggle Evaluation

**Configuration stores toggle state:**

```javascript
function isFeatureEnabled(productLineCode, toggleKey, context) {
  const config = getProductLineConfig(productLineCode);
  const toggle = config.featureToggles.find(t => t.toggleKey === toggleKey);

  if (!toggle || !toggle.enabled) {
    return false;
  }

  // Check state filter
  if (toggle.enabledStates && toggle.enabledStates.length > 0) {
    if (!toggle.enabledStates.includes(context.state)) {
      return false;
    }
  }

  // Check wave rollout
  if (toggle.waveConfig) {
    const currentWave = toggle.waveConfig.waves[toggle.waveConfig.currentWave - 1];
    if (!currentWave.states.includes(context.state)) {
      return false;
    }
  }

  return true;
}
```

---

## Independent Product Line Development

### Parallel Development Model

**Scenario: 3 Product Lines Developed Simultaneously**

```
Team Structure:

GL Team (Team 1):
├── Product Owner: Sarah
├── Tech Lead: Lisa
├── BA: Michael
├── Developers: 2
└── QA: John

WC Team (Team 2):
├── Product Owner: Jennifer
├── Tech Lead: Robert
├── BA: David
├── Developers: 2
└── QA: Emily

Property Team (Team 3):
├── Product Owner: Mark
├── Tech Lead: Amanda
├── BA: Chris
├── Developers: 2
└── QA: Rachel
```

**Independent Work Streams:**

```
Week 1-2: Discovery & Configuration
- Each team independently:
  ✓ Define product line configuration
  ✓ Select/customize template
  ✓ Configure integrations (source/target systems)
  ✓ Map fields
  ✓ Define rules

Week 3-4: Development & Testing
- Each team independently:
  ✓ Customize mappings
  ✓ Configure workflow
  ✓ Develop custom plugins (if needed)
  ✓ Test with sample data
  ✓ No coordination required

Week 5: UAT
- Each team independently:
  ✓ Business user testing
  ✓ Fix issues
  ✓ Get sign-off

Week 6: Production Deployment
- Teams deploy on their own schedule:
  ✓ GL deploys Monday
  ✓ WC deploys Wednesday
  ✓ Property deploys Friday
  ✓ No dependencies between deployments
```

**What Makes This Possible:**

1. **Isolated Configuration**
   - Each product line has own config file
   - No shared configuration (except marketplace templates)

2. **Shared Core**
   - Core orchestration engine unchanged
   - No code changes needed per product line

3. **Independent APIs**
   - GL: `/api/v1/rating/gl-commercial/quote`
   - WC: `/api/v1/rating/wc-standard/quote`
   - Property: `/api/v1/rating/property-commercial/quote`

4. **Separate Deployment Pipelines**
   - GL has own CI/CD pipeline
   - WC has own CI/CD pipeline
   - Property has own CI/CD pipeline

5. **Configuration-Only Changes**
   - Adding new product line = Add configuration
   - No code deployment required
   - Hot-swappable configurations

---

## Core Orchestration Engine

### Responsibilities

**The Shared Core Handles:**

1. **Request Routing**
```javascript
// Route based on URL path
POST /api/v1/rating/gl-commercial/quote
→ Extract product line code: "gl-commercial"
→ Load config for "gl-commercial"
→ Route to GL handler
```

2. **Authentication & Authorization**
```javascript
// Shared authentication for all product lines
authenticate(token)
→ Verify user
→ Check permissions for product line
→ Rate limit per user
```

3. **Feature Toggle Evaluation**
```javascript
// Centralized toggle management
isFeatureEnabled("gl-commercial", "ca_wildfire_surcharge_2026", context)
→ Read config
→ Evaluate state, wave, percentage
→ Return true/false
```

4. **Monitoring & Logging**
```javascript
// Centralized monitoring
logTransaction({
  productLine: "gl-commercial",
  operation: "quote",
  duration: 2345,
  status: "success"
})
→ Push to monitoring service
→ Update dashboards
```

5. **Wave Rollout Management**
```javascript
// Centralized wave progression
checkWaveRollout("gl-commercial", "ca_wildfire_surcharge_2026")
→ If Wave 1 successful → Auto-advance to Wave 2
→ If error rate > 5% → Pause rollout
→ Send notifications
```

### What Core Does NOT Handle

**Product Line Specific Logic:**
- Field mappings (each product line has own)
- Business rules (each product line has own)
- Workflow steps (each product line has own)
- Target system integration (each product line has own)

**This separation enables independence.**

---

## Configuration Management

### Configuration Storage

**Option A: Database (Recommended)**
```sql
CREATE TABLE product_line_configs (
  id UUID PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255),
  config JSONB NOT NULL,
  version VARCHAR(20),
  status VARCHAR(20),
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  created_by VARCHAR(255),
  updated_by VARCHAR(255)
);

-- Index for fast lookup
CREATE INDEX idx_product_line_code ON product_line_configs(code);
CREATE INDEX idx_product_line_status ON product_line_configs(status);
```

**Benefits:**
- Fast lookup
- Version history
- Audit trail
- Easy updates

**Option B: File-based (Alternative)**
```
configs/
├── gl-commercial.json
├── wc-standard.json
├── property-commercial.json
└── inland-marine.json
```

**Benefits:**
- Git version control
- Easy to review changes
- Can deploy with code

### Configuration UI

**Settings → Product Lines → GL Commercial → Configuration**

```
┌────────────────────────────────────────────────────────────────┐
│ GL Commercial - Configuration Editor                           │
│                                                                 │
│ Tabs: [General] [Integrations] [Workflow] [Features] [API]    │
│                                                                 │
│ ┌─ General ────────────────────────────────────────────────┐  │
│ │                                                           │  │
│ │ Product Line Code: [GL_COMM                          ]   │  │
│ │ Display Name:      [GL Commercial                    ]   │  │
│ │ Description:       [General liability for commercial ]   │  │
│ │                    [businesses                       ]   │  │
│ │ Status:            [Active ▼]                            │  │
│ │ Version:           [2.0                              ]   │  │
│ │                                                           │  │
│ │ Ownership:                                               │  │
│ │ Product Owner:     [sarah@abcinsurance.com           ]   │  │
│ │ Tech Lead:         [lisa@abcinsurance.com            ]   │  │
│ │ Business Analyst:  [michael@abcinsurance.com         ]   │  │
│ │ Team:              [GL-Team                          ]   │  │
│ │                                                           │  │
│ │ [Save Changes] [Export Config] [Import Config]           │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ┌─ Integrations ──────────────────────────────────────────┐  │
│ │ Source System: [Guidewire PolicyCenter v10.2          ] │  │
│ │ API Endpoint:  [https://gw.abcinsurance.com/pc/api/v1 ] │  │
│ │ [Test Connection] ✓ Connected                           │  │
│ │                                                          │  │
│ │ Target Systems (2):                                     │  │
│ │ 1. Earnix Rating Engine                                 │  │
│ │    Purpose: Premium Calculation                         │  │
│ │    [Configure] [Test] [Remove]                          │  │
│ │                                                          │  │
│ │ 2. D&B Business Enrichment                              │  │
│ │    Purpose: Data Enrichment                             │  │
│ │    [Configure] [Test] [Remove]                          │  │
│ │                                                          │  │
│ │ [+ Add Target System]                                   │  │
│ └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### Configuration Versioning

**Track Changes:**
```
Version History for GL Commercial:

v2.0 (2026-02-05) - Current
- Added CA wildfire surcharge feature toggle
- Updated Earnix connector to v3
- Changed: 5 rules modified

v1.5 (2026-01-20)
- Added D&B enrichment plugin
- Added PDF worksheet generation
- Changed: Workflow updated (6 → 9 steps)

v1.0 (2026-01-15)
- Initial configuration
- Template: GL - Guidewire to Earnix v2.0
- Mappings: 47, Rules: 23

[Compare Versions] [Rollback to v1.5] [Export Version]
```

---

## Onboarding Experience (Hybrid Wizard)

### First Product Line: Guided Wizard

**User Journey: Adding First Product Line (GL)**

**Step 1: Welcome**
```
┌────────────────────────────────────────────────────────────┐
│ Add Your First Product Line                                │
│                                                             │
│ Let's configure General Liability - Commercial             │
│                                                             │
│ We'll guide you through 5 steps:                           │
│ 1️⃣ Product Details                                         │
│ 2️⃣ System Connections                                      │
│ 3️⃣ Template Selection                                      │
│ 4️⃣ Configuration Review                                    │
│ 5️⃣ Test & Deploy                                           │
│                                                             │
│ Time estimate: 30-60 minutes                               │
│                                                             │
│ [Start Wizard] [Skip Wizard - Configure Manually]         │
└────────────────────────────────────────────────────────────┘
```

**Step 2: Product Details**
```
┌────────────────────────────────────────────────────────────┐
│ Step 1 of 5: Product Details                              │
│                                                             │
│ Product Line Code: *                                       │
│ [GL_COMM                                               ]   │
│ (Auto-generated from name, can edit)                       │
│                                                             │
│ Display Name: *                                            │
│ [GL Commercial                                         ]   │
│                                                             │
│ Description:                                               │
│ [General liability coverage for commercial businesses  ]   │
│                                                             │
│ Which states will this product support?                   │
│ ☑ California  ☑ New York  ☑ Texas  ☑ Florida             │
│ [Select All 50 States]                                     │
│                                                             │
│ Team Ownership (optional):                                 │
│ Product Owner: [sarah@abcinsurance.com                 ]   │
│ Tech Lead:     [lisa@abcinsurance.com                  ]   │
│                                                             │
│ [Back] [Next: System Connections]                         │
└────────────────────────────────────────────────────────────┘
```

**Step 3: System Connections**
```
┌────────────────────────────────────────────────────────────┐
│ Step 2 of 5: System Connections                           │
│                                                             │
│ What system sends quotes to you? (Source)                 │
│ ○ Guidewire PolicyCenter                                   │
│ ○ Duck Creek                                               │
│ ○ Socotra                                                  │
│ ○ Custom API                                               │
│                                                             │
│ [Selected: Guidewire PolicyCenter]                         │
│                                                             │
│ Guidewire API Details:                                     │
│ API URL: [https://gw.abcinsurance.com/pc/api/v1       ]   │
│ Version: [10.2 ▼]                                          │
│ Client ID: [************************                   ]   │
│ Client Secret: [************************               ]   │
│ [Test Connection] ✓ Connected successfully                │
│                                                             │
│ What system calculates premiums? (Target)                 │
│ ○ Earnix Rating Engine                                     │
│ ○ Ratabase                                                 │
│ ○ Custom Rating API                                        │
│ ○ Internal Calculation (no external call)                 │
│                                                             │
│ [Selected: Earnix Rating Engine]                           │
│                                                             │
│ Earnix API Details:                                        │
│ API URL: [https://earnix.abcinsurance.com/rating/api  ]   │
│ API Key: [************************                     ]   │
│ Project ID: [ABC_GL_COMMERCIAL                         ]   │
│ [Test Connection] ✓ Connected successfully                │
│                                                             │
│ [Back] [Next: Template Selection]                         │
└────────────────────────────────────────────────────────────┘
```

**Step 4: Template Selection**
```
┌────────────────────────────────────────────────────────────┐
│ Step 3 of 5: Template Selection                           │
│                                                             │
│ Based on your selections (Guidewire → Earnix), we found:  │
│                                                             │
│ ┌────────────────────────────────────────────────────┐    │
│ │ ⭐ RECOMMENDED                                      │    │
│ │ GL - Guidewire PolicyCenter to Earnix v2.0        │    │
│ │ ★★★★★ 4.8/5 (127 ratings)                         │    │
│ │                                                     │    │
│ │ Included:                                          │    │
│ │ ✓ 47 field mappings                                │    │
│ │ ✓ 23 rating rules                                  │    │
│ │ ✓ 6-step workflow                                  │    │
│ │ ✓ Earnix connector plugin                          │    │
│ │                                                     │    │
│ │ Customization: 10-20% typically needed            │    │
│ │ Time to deploy: 2 days average                    │    │
│ │                                                     │    │
│ │ ● Use this template (recommended)                  │    │
│ │ ○ Build from scratch                               │    │
│ │                                                     │    │
│ │ [Preview Template Details]                         │    │
│ └────────────────────────────────────────────────────┘    │
│                                                             │
│ [Back] [Next: Install & Review Configuration]             │
└────────────────────────────────────────────────────────────┘
```

**Step 5: Configuration Review**
```
┌────────────────────────────────────────────────────────────┐
│ Step 4 of 5: Review Configuration                         │
│                                                             │
│ Template installed! Review your configuration:             │
│                                                             │
│ Product Line: GL Commercial                                │
│ Source: Guidewire PolicyCenter                             │
│ Target: Earnix Rating Engine                               │
│                                                             │
│ Field Mappings: 47 configured                              │
│ [Review Mappings] (You can customize later)               │
│                                                             │
│ Rating Rules: 23 configured                                │
│ [Review Rules] (You can customize later)                  │
│                                                             │
│ Workflow: 6 steps configured                               │
│ 1. Validate Input                                          │
│ 2. Execute Mappings                                        │
│ 3. Execute Rules                                           │
│ 4. Call Earnix API                                         │
│ 5. Generate Response                                       │
│ 6. Return Result                                           │
│ [Review Workflow] (You can add plugins later)             │
│                                                             │
│ API Endpoint (auto-generated):                             │
│ POST /api/v1/rating/gl-commercial/quote                   │
│                                                             │
│ Everything looks good?                                     │
│ [Back] [Next: Test & Deploy]                              │
└────────────────────────────────────────────────────────────┘
```

**Step 6: Test & Deploy**
```
┌────────────────────────────────────────────────────────────┐
│ Step 5 of 5: Test & Deploy                                │
│                                                             │
│ Let's test your configuration with a sample quote:        │
│                                                             │
│ Sample Quote Data (pre-filled):                            │
│ ┌────────────────────────────────────────────────────┐    │
│ │ {                                                   │    │
│ │   "quoteNumber": "Q-TEST-001",                     │    │
│ │   "insuredName": "ABC Construction Inc",           │    │
│ │   "state": "CA",                                   │    │
│ │   "coverageLimit": 1000000,                        │    │
│ │   "yearsInBusiness": 10                            │    │
│ │ }                                                   │    │
│ └────────────────────────────────────────────────────┘    │
│                                                             │
│ [Run Test] [Use Different Test Data]                      │
│                                                             │
│ Test Result: ✓ Success                                    │
│ ┌────────────────────────────────────────────────────┐    │
│ │ Premium Calculated: $2,450                         │    │
│ │ Response Time: 1.8 seconds                         │    │
│ │ All workflow steps completed successfully          │    │
│ └────────────────────────────────────────────────────┘    │
│                                                             │
│ Ready to deploy to production?                            │
│                                                             │
│ ○ Deploy to Development (test more first)                 │
│ ● Deploy to Staging (recommended for first product)       │
│ ○ Deploy to Production (go live immediately)              │
│                                                             │
│ [Cancel] [Deploy]                                          │
└────────────────────────────────────────────────────────────┘
```

**Completion:**
```
┌────────────────────────────────────────────────────────────┐
│ 🎉 GL Commercial is Live!                                 │
│                                                             │
│ Your product line is deployed to Staging.                 │
│                                                             │
│ Next steps:                                                │
│ 1. Test with real quotes                                  │
│ 2. Customize mappings if needed                           │
│ 3. Add business rules                                     │
│ 4. Configure feature toggles                              │
│ 5. Deploy to Production                                   │
│                                                             │
│ API Endpoint:                                              │
│ POST https://staging.insurratex.com/api/v1/rating/gl-commercial/quote │
│                                                             │
│ [View Dashboard] [Customize Configuration] [Add Another Product] │
└────────────────────────────────────────────────────────────┘
```

### Subsequent Product Lines: Self-Service

**After first product line configured:**

```
┌────────────────────────────────────────────────────────────┐
│ Add Product Line                                           │
│                                                             │
│ ○ Guided Wizard (recommended for beginners)               │
│ ● Quick Add (you're an expert now!)                       │
│                                                             │
│ Quick Add:                                                 │
│                                                             │
│ 1. Choose template:                                        │
│    [WC - Guidewire to Ratabase v1.5              ▼]       │
│                                                             │
│ 2. Product line name:                                      │
│    [WC Standard                                        ]   │
│                                                             │
│ 3. Connect systems:                                        │
│    Source: [✓ Use existing Guidewire connection]          │
│    Target: [+ Configure Ratabase API]                     │
│                                                             │
│ 4. Deploy to:                                              │
│    ☑ Development  ☑ Staging  ☐ Production                 │
│                                                             │
│ [Cancel] [Create Product Line]                            │
│                                                             │
│ Estimated time: 5 minutes                                  │
└────────────────────────────────────────────────────────────┘
```

---

## Summary: Key Benefits of This Architecture

### For Development Teams

✅ **Independent Work**
- Teams don't block each other
- Can deploy on own schedule
- Own their product line end-to-end

✅ **Faster Development**
- Template provides 80% of solution
- Configuration-driven (no code for standard scenarios)
- Parallel development possible

✅ **Clear Ownership**
- Each team owns their product line
- Configuration tracks ownership
- Clear accountability

### For the Business

✅ **Faster Time to Market**
- 3-4 product lines can launch simultaneously
- 2 days to deploy with template
- Self-service after first product

✅ **Reduced Cost**
- Shared orchestration (one core to maintain)
- Reusable templates
- Less custom code

✅ **Flexibility**
- Add new product lines anytime
- No coordination needed between product lines
- Configuration changes without code deployment

### For the Platform

✅ **Scalability**
- Add 10, 20, 50 product lines
- Core orchestration unchanged
- Configuration-only scaling

✅ **Maintainability**
- Core logic separated from product logic
- Updates to core don't affect product lines
- Product line changes don't affect core

✅ **Governance**
- Configuration versioning
- Audit trail
- Feature toggles for safe rollouts

---

## Next Steps

### Immediate (Next 2 Weeks)

1. **Finalize Configuration Schema**
   - Review and approve JSON structure
   - Add any missing fields
   - Document all configuration options

2. **Build Configuration UI**
   - Create product line configuration editor
   - Build wizard for first product
   - Build quick-add for subsequent products

3. **Implement Core Orchestration**
   - Build routing engine
   - Integrate feature toggles
   - Implement monitoring

4. **Create First Templates**
   - GL - Guidewire to Earnix
   - WC - Guidewire to Ratabase
   - Property - Duck Creek to Earnix

### Medium Term (Next 2 Months)

1. **Test Parallel Development**
   - Spin up 3 teams
   - Each builds one product line
   - Validate independence

2. **Build Marketplace**
   - Template browser
   - Template ratings/reviews
   - Template versioning

3. **Documentation**
   - Product line configuration guide
   - Template creation guide
   - API documentation per product line

### Long Term (6-12 Months)

1. **Scale to 20+ Product Lines**
2. **Add Policy Domain** (using same pattern)
3. **Build Partner Ecosystem**
4. **Enterprise Features** (advanced governance, compliance)

---

*END OF DOCUMENT*
