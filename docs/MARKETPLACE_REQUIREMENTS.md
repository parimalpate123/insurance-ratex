# InsurRateX Marketplace Platform
## Product Requirements Document (PRD)

**Version:** 1.1
**Date:** February 5, 2026
**Status:** Approved for Development
**Last Updated:** Added Wave Rollout & Feature Toggles
**Document Owner:** Product Team

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vision & Goals](#vision--goals)
3. [Problem Statement](#problem-statement)
4. [Solution Overview](#solution-overview)
5. [User Personas](#user-personas)
6. [Key Features & Capabilities](#key-features--capabilities)
7. [Wave Rollout & Feature Toggles](#wave-rollout--feature-toggles)
8. [Architecture Principles](#architecture-principles)
9. [Marketplace Components](#marketplace-components)
10. [Domain Structure](#domain-structure)
11. [User Journeys](#user-journeys)
12. [Success Metrics](#success-metrics)
13. [Phased Roadmap](#phased-roadmap)
14. [Out of Scope](#out-of-scope)
15. [Assumptions & Dependencies](#assumptions--dependencies)

---

## Executive Summary

**InsurRateX Marketplace** is a configurable insurance integration platform that dramatically reduces the time and cost of implementing insurance product integrations. By providing a marketplace of pre-built templates, plugins, and configurable components, we enable insurance carriers and brokers to deploy integrations in days instead of months.

### Key Value Propositions:

- **Speed:** Deploy standard integrations in 2 days vs. 6 months
- **Cost:** Reduce implementation team from 7 people to 1-2 people
- **Flexibility:** Handle 80% of needs through configuration, 20% through custom extensions
- **Reusability:** Share and reuse configurations across products and customers
- **Scalability:** Marketplace grows with community contributions

### Initial Focus:

Start with **Rating Domain** as proof of concept, then expand to Policy, Billing, Claims, and other domains.

---

## Vision & Goals

### Vision Statement

*"Create the Salesforce AppExchange for insurance integrations - a marketplace where insurance professionals can browse, install, and customize pre-built integrations between any insurance platforms in minutes, not months."*

### Strategic Goals

1. **Reduce Time-to-Market**
   - Standard integrations: 2 days (vs. 6 months currently)
   - Custom integrations: 2-4 weeks (vs. 6-12 months currently)

2. **Democratize Integration Development**
   - Enable business analysts to configure integrations (no coding required for 80% of use cases)
   - Provide extension framework for developers when needed (20% of use cases)

3. **Build Ecosystem**
   - Marketplace with 100+ templates by Year 2
   - Partner network contributing plugins and templates
   - Community-driven growth

4. **Prove Concept with Rating Domain**
   - Focus on Rating domain initially
   - Demonstrate value before expanding to other domains

---

## Problem Statement

### Current State (Pain Points)

**Problem 1: Integration Projects Take Too Long**
- Typical Guidewire + Earnix integration for one product line (e.g., General Liability) takes 6-12 months
- Requires 7+ person team: Product Owner, Business Analyst, Tech Lead, 3-4 Developers, QE
- Each new product line requires similar timeline and team

**Problem 2: Every Organization Rebuilds the Wheel**
- 80% of integration logic is common (field mappings, standard calculations, API calls)
- Each carrier builds from scratch instead of reusing proven patterns
- No sharing mechanism between organizations or product lines

**Problem 3: Inflexible Solutions**
- Current integration platforms are either:
  - Too rigid (templates that don't fit unique needs), OR
  - Too complex (require full custom development for everything)
- No middle ground for configuration + customization

**Problem 4: Product Line Proliferation**
- Insurance carriers support 5-15 product lines (GL, WC, Property, Inland Marine, etc.)
- Each product line may integrate with different rating engines (Earnix, Ratabase, custom)
- Deploying each product line independently is expensive and time-consuming

### Impact

- **Financial:** $500K - $2M per integration project
- **Opportunity Cost:** 6-12 month delay to market for new products
- **Resource Drain:** Senior developers tied up on repetitive integration work
- **Maintenance Burden:** Custom code requires ongoing support and updates

---

## Solution Overview

### High-Level Solution

Build a **configurable marketplace platform** that provides:

1. **Pre-built Templates** - Ready-to-use integration packages for common scenarios
2. **Visual Configuration Tools** - No-code tools for 80% of integration needs
3. **Plugin Marketplace** - Library of reusable components (data enrichment, storage, messaging, etc.)
4. **Extension Framework** - SDK for custom code when needed (20% of use cases)
5. **Multi-Tenancy** - Each customer has isolated environment with shared marketplace access

### The 80/20 Approach

**80% Configuration (No Code Required):**
- Install marketplace template
- Configure via visual tools (mappings, rules, workflow)
- Enable pre-built plugins
- Deploy

**20% Customization (Code When Needed):**
- Custom plugins for unique business logic
- Extension hooks at specific workflow points
- Custom connectors for proprietary systems
- TypeScript/JavaScript for complex calculations

### Core Principles

1. **Domain-First Design**
   - Rating domain has clear boundaries (input: quote data, output: premium)
   - Each domain is self-contained with well-defined contracts
   - Start with Rating, expand to Policy, Billing, Claims later

2. **Product Lines as Plugins**
   - Each product line (GL, WC, Property) is a configuration package
   - Not separate microservices (adds complexity)
   - Reuse core Rating domain, configure per product line

3. **Configuration Over Code**
   - Prefer visual configuration over custom code
   - Only drop to code for truly unique requirements
   - Make code-when-needed easy with SDK

4. **Marketplace-Driven Growth**
   - Templates and plugins grow over time
   - Community and partner contributions
   - Version control and ratings for quality

---

## User Personas

### Primary Personas

**1. Integration Developer (Sarah)**
- **Role:** Senior Developer at insurance carrier
- **Goal:** Implement GL rating integration between Guidewire and Earnix
- **Pain:** Spent 6 months on last integration project
- **Needs:**
  - Pre-built templates to start faster
  - Ability to customize when needed
  - Clear extension points for custom code

**2. Business Analyst (Michael)**
- **Role:** Business Analyst managing integrations
- **Goal:** Configure new product line without developer help
- **Pain:** Every small change requires developer and 2-week sprint
- **Needs:**
  - Visual tools to configure mappings and rules
  - Template library to reuse patterns
  - No coding required for standard scenarios

**3. Insurance Consultant (Jennifer)**
- **Role:** Independent consultant implementing insurance systems
- **Goal:** Deliver projects faster to more clients
- **Pain:** Rebuilds same integrations for each client
- **Needs:**
  - Reusable templates across clients
  - Export/import configurations
  - Quick customization per client needs

### Secondary Personas

**4. Platform Administrator (David)**
- **Role:** IT Administrator at insurance carrier
- **Goal:** Manage platform, users, and configurations
- **Needs:**
  - Multi-tenant management
  - Security and access control
  - Monitoring and diagnostics

**5. Plugin Developer (Lisa)**
- **Role:** Third-party developer building plugins
- **Goal:** Build and sell plugins in marketplace
- **Needs:**
  - Clear plugin SDK
  - Marketplace publishing tools
  - Revenue sharing model

---

## Key Features & Capabilities

### 1. Marketplace Template Library

**Description:** Browse and install pre-built integration templates

**Features:**
- **Template Browser**
  - Search by product line, source system, target system
  - Category filtering (Rating, Policy, Billing, etc.)
  - Sort by popularity, rating, recent updates

- **Template Details**
  - Overview and description
  - Included components (mappings, rules, plugins)
  - Prerequisites and dependencies
  - Ratings and reviews
  - Version history

- **One-Click Install**
  - Install template with all dependencies
  - Auto-create mappings, rules, workflows
  - Configuration wizard for environment-specific settings

- **Template Preview**
  - View mappings before install
  - See workflow steps
  - Review rules and logic

**Example Templates:**
- "GL - Guidewire PolicyCenter to Earnix Rating v2.0"
- "WC - Duck Creek to Ratabase Rating v1.5"
- "Property - Custom to Earnix Rating v3.0"
- "Inland Marine - Guidewire to Ratabase v1.0"

### 2. Visual Mapping Configuration

**Description:** No-code tool to configure field mappings between systems

**Features:**
- **Drag-and-Drop Mapping**
  - Visual interface to map source fields to target fields
  - Support for JSONPath expressions
  - Nested object mapping

- **Field Catalog Integration**
  - Browse 40+ pre-defined insurance fields
  - Auto-fill metadata (data type, description, samples)
  - Create custom fields

- **Transformation Options**
  - Direct mapping (field → field)
  - Lookup tables (state code → state name)
  - Expression-based (calculated fields)
  - Conditional mapping (if-then logic)

- **Data Type Support**
  - 16 insurance-specific data types (policy_number, money, tax_id, etc.)
  - Validation patterns per data type
  - Sample values for testing

- **Bidirectional Mapping**
  - Configure direction: input, output, or both
  - Support for request/response patterns

- **Skip Mapping Options**
  - Mark fields to exclude from transformation
  - Use default values when source field missing

**User Story:**
*"As a business analyst, I want to map Guidewire Quote fields to Earnix Rating fields using a visual tool, so I can configure integrations without writing code."*

### 3. Visual Rule Builder

**Description:** Configure business rules and calculations without coding

**Features:**
- **Rule Templates**
  - Pre-built rule templates for common scenarios
  - Premium calculation patterns
  - Modifier application rules

- **Condition Builder**
  - Visual IF-THEN-ELSE logic
  - Support for multiple conditions (AND/OR)
  - Comparison operators (equals, greater than, contains, etc.)

- **Action Types**
  - Set field value
  - Calculate formula
  - Call external API
  - Lookup from table

- **AI-Powered Rule Generation**
  - Natural language input → generates rules
  - Example: "If state is CA and coverage > $1M, apply 15% surcharge"
  - AI suggests rules based on product line patterns

- **Rule Testing**
  - Test rules with sample data
  - See rule execution trace
  - Debug failed rules

**User Story:**
*"As a rating analyst, I want to configure premium calculation rules using visual conditions and formulas, so I can implement rating logic without developer help."*

### 4. Plugin Marketplace

**Description:** Library of reusable components for common integration tasks

**Plugin Categories:**

**Data Enrichment Plugins:**
- Dun & Bradstreet Business Data Enrichment
- Experian Credit Check
- ISO Territory Lookup
- LexisNexis Risk Assessment

**External API Integrations:**
- Guidewire Rating API Caller
- Duck Creek Connector
- Earnix Rating Engine Connector
- Ratabase Rating Engine Connector
- Socotra API Connector

**Document Generation:**
- PDF Rating Worksheet Generator
- Excel Premium Breakdown Generator
- Email Template Renderer

**Data Storage & Messaging:**
- AWS S3 Transaction Storage
- Azure Blob Storage
- Kafka Event Publisher
- AWS SQS Message Publisher
- RabbitMQ Connector
- Webhook Notifier

**Business Logic:**
- Premium Financing Calculator
- Commission Calculator
- State Tax Calculator
- Loss Ratio Calculator

**Plugin Features:**
- Enable/disable per product line
- Configuration UI for each plugin
- Version management
- Dependency resolution
- Community ratings and reviews

**User Story:**
*"As an integration developer, I want to add D&B business enrichment to my GL rating workflow by enabling a plugin, so I don't have to build the integration from scratch."*

### 5. Visual Workflow Builder

**Description:** Drag-and-drop tool to orchestrate integration workflow

**Features:**
- **Workflow Canvas**
  - Drag components onto canvas
  - Connect components with arrows
  - Visual representation of data flow

- **Component Types**
  - System steps (validate, transform, calculate, respond)
  - Plugin steps (from marketplace)
  - Custom steps (user-written code)
  - Decision points (if-then branching)
  - Parallel execution (multiple paths)

- **Extension Hooks**
  - Pre-process hook (before validation)
  - Post-transform hook (after mappings)
  - Post-rules hook (after rule execution)
  - Pre-response hook (before returning result)

- **Workflow Configuration**
  - Configure each step's settings
  - Map data between steps
  - Set error handling per step
  - Define timeouts and retries

- **Workflow Testing**
  - Test entire workflow with sample data
  - Step-by-step execution view
  - Inspect data at each step
  - Debug failed workflows

**Example Workflow:**
```
1. Receive Request
2. Validate Input
3. [Plugin] D&B Enrichment
4. Execute Mappings (Guidewire → Earnix format)
5. Execute Rating Rules
6. [Plugin] Call Earnix API
7. [Plugin] Generate PDF Worksheet
8. [Plugin] Store Transaction to S3
9. [Plugin] Publish Event to Kafka
10. Return Response
```

**User Story:**
*"As an integration architect, I want to design the workflow for GL rating by dragging components onto a canvas, so I can visualize and configure the entire integration process."*

### 6. Custom Plugin SDK

**Description:** Framework for developers to write custom plugins when needed

**Features:**
- **Plugin Interface**
  - Standard TypeScript interface all plugins implement
  - Input: WorkflowContext (contains all data)
  - Output: Modified WorkflowContext

- **Plugin Template Generator**
  - CLI tool to scaffold new plugin
  - Boilerplate code with best practices
  - Sample tests included

- **Local Development**
  - Run plugin locally with test data
  - Debug in IDE
  - Hot reload during development

- **Plugin Registry**
  - Register custom plugins in environment
  - Version control for plugins
  - Deploy to specific product lines

- **Documentation & Examples**
  - Plugin developer guide
  - API reference
  - Sample plugins (10+ examples)
  - Video tutorials

**Use Cases for Custom Plugins:**
- Integration with proprietary internal systems
- Complex business logic unique to organization
- Custom algorithms (e.g., proprietary rating formula)
- Legacy system connectors

**User Story:**
*"As a senior developer, when I need to integrate with our proprietary underwriting system, I want to write a custom plugin using a clear SDK, so I can extend the platform for our unique needs."*

### 7. Import/Export & Version Control

**Description:** Package configurations for sharing and version control

**Features:**
- **Export Package**
  - Export entire product line configuration as JSON/ZIP
  - Include: mappings, rules, workflow, plugin configs, field catalog
  - Exclude sensitive data (API keys, credentials)

- **Import Package**
  - Import configuration from file
  - Preview before importing
  - Merge or replace existing configuration
  - Resolve conflicts

- **Version Control**
  - Track configuration versions (v1.0, v1.1, v2.0)
  - Compare versions side-by-side
  - Rollback to previous version
  - Change history and audit log

- **Template Publishing**
  - Publish configuration as marketplace template
  - Set visibility (private, organization, public)
  - Add description, screenshots, documentation
  - Version updates and release notes

**User Story:**
*"As an insurance consultant, I want to export my GL configuration from Client A and import it to Client B's environment, so I can reuse my work across clients."*

### 8. Multi-Tenancy & Customer Isolation

**Description:** Each customer has isolated environment while sharing marketplace

**Features:**
- **Tenant Management**
  - Each insurance carrier = one tenant
  - Complete data isolation between tenants
  - Shared marketplace access

- **Tenant Configuration**
  - Tenant-specific branding
  - Environment settings (dev, staging, prod)
  - User management per tenant
  - Access control and permissions

- **Shared Resources**
  - Marketplace templates (shared across tenants)
  - Plugin library (shared)
  - Field catalog (optional sharing)

- **Private Resources**
  - Tenant's mappings (isolated)
  - Tenant's rules (isolated)
  - Tenant's workflows (isolated)
  - Tenant's custom plugins (optional sharing)

**User Story:**
*"As a platform administrator, I want to ensure Carrier A's GL configurations are completely isolated from Carrier B, while both can access the shared marketplace templates."*

### 9. Product Line Management

**Description:** Configure and manage multiple product lines within Rating domain

**Features:**
- **Product Line Catalog**
  - List all configured product lines
  - Status: Active, Inactive, In Development
  - View statistics per product line

- **Product Line Configuration**
  - Name and description
  - Source system (Guidewire, Duck Creek, etc.)
  - Target rating engine (Earnix, Ratabase, custom)
  - Workflow configuration
  - Enabled plugins

- **Product Line Templates**
  - Create from template
  - Create from scratch
  - Clone existing product line

- **Independent Configuration**
  - GL uses Earnix
  - Inland Marine uses Ratabase
  - WC uses custom rating API
  - Each has own mappings, rules, workflow

- **Enable/Disable Product Lines**
  - Toggle product lines on/off
  - No code deployment required
  - Instant activation

**User Story:**
*"As a product manager, I want to enable the Workers Compensation product line by installing a template and configuring it to use Ratabase, while my General Liability product line continues using Earnix."*

### 10. Testing & Validation

**Description:** Test configurations before deploying to production

**Features:**
- **Mapping Testing**
  - Input sample JSON from source system
  - See transformed output
  - Verify field mappings are correct

- **Rule Testing**
  - Test rules with various scenarios
  - See which rules fire for given input
  - Debug rule conditions

- **Workflow Testing**
  - Execute entire workflow with test data
  - Step-through execution
  - Inspect data at each step
  - View plugin outputs

- **End-to-End Testing**
  - Simulate real API calls (with mocking)
  - Test error handling
  - Performance testing

- **Test Data Management**
  - Save test scenarios
  - Reuse test data across tests
  - Export/import test suites

**User Story:**
*"As a QA analyst, I want to test the GL rating workflow with 20 different quote scenarios before production deployment, so I can ensure all edge cases are handled correctly."*

---

## Wave Rollout & Feature Toggles

### Overview

**Wave Rollout** and **Feature Toggles** enable organizations to deploy changes incrementally and control feature availability dynamically without code deployment. This reduces risk, enables testing in production, and supports gradual state-by-state or feature-by-feature rollouts.

### Business Drivers

**Insurance Industry Challenges:**
1. **State-by-State Compliance**
   - Different states have different regulations
   - New features must be approved state-by-state
   - Example: CA approves surcharge in Q1, NY approves in Q3

2. **Risk Mitigation**
   - Large-scale changes are risky
   - Gradual rollout reduces blast radius
   - Ability to quickly disable problematic features

3. **A/B Testing**
   - Test commission calculation methods
   - Compare rule configurations
   - Measure impact before full deployment

4. **Phased Implementation**
   - Deploy to pilot states first
   - Validate with production data
   - Expand to remaining states

### Feature 1: Wave Rollout Configuration

**Description:** Configure features to deploy in waves (phases) with granular control over geography, product lines, and timing.

#### Wave Rollout Scenarios

**Scenario 1: State-Based Rollout**
```
Feature: "California Wildfire Surcharge"
Wave 1 (Week 1): CA only - 15% surcharge for high-risk territories
Wave 2 (Week 3): OR, WA - same surcharge
Wave 3 (Week 5): AZ, NV - adjusted surcharge (12%)
Wave 4 (Week 8): All remaining states (if approved)
```

**Scenario 2: Commission Calculation Rollout**
```
Feature: "New Commission Structure"
Wave 1 (Month 1): CA, NY - New tiered commission (5%, 7%, 10%)
Wave 2 (Month 2): TX, FL, IL - Same structure
Wave 3 (Month 3): Remaining states
```

**Scenario 3: Product Line Rollout**
```
Feature: "Experience Rating Module"
Wave 1: GL only
Wave 2: GL + WC
Wave 3: All product lines
```

#### Wave Configuration UI

**Navigate to:** Product Lines → GL → Features → Wave Configuration

**UI Elements:**

**1. Feature Definition**
```
Feature Name: California Wildfire Surcharge
Feature Key: ca_wildfire_surcharge_2026
Feature Type: Surcharge Rule
Target Component: Rating Rules
```

**2. Wave Configuration Table**
```
| Wave | Name        | States    | Start Date | End Date   | Status    | Rollback |
|------|-------------|-----------|------------|------------|-----------|----------|
| 1    | CA Pilot    | CA        | 2026-02-10 | 2026-02-24 | Active    | [Button] |
| 2    | West Coast  | OR, WA    | 2026-02-24 | 2026-03-10 | Scheduled | -        |
| 3    | Southwest   | AZ, NV    | 2026-03-10 | 2026-03-24 | Scheduled | -        |
| 4    | National    | All       | 2026-03-24 | -          | Planned   | -        |

[+ Add Wave] [Schedule Rollout] [Cancel All]
```

**3. Wave Configuration Details**
```
Wave 1: CA Pilot
- States: California
- Effective: 2026-02-10 00:00:00 PST
- Expiry: 2026-02-24 23:59:59 PST (auto-transition to Wave 2)
- Surcharge Value: 15%
- Apply to: High-risk territories (Territory Codes: 5, 7, 9)
- Override existing rules: Yes
- Notification: Email to CA underwriters
- Monitoring: Real-time dashboard

Rollback Plan:
- If error rate > 5%: Auto-disable
- If manual rollback: Revert to previous surcharge (10%)
- Notification: Immediate email + Slack alert
```

#### State-Based Configuration

**Feature: State-Specific Overrides**

Each wave can have state-specific configurations:

```
Feature: Surcharge Rules

Base Configuration (All States):
- Surcharge: 10%
- Applies to: Claims > 3 in 3 years

State Overrides:

California (Wave 1):
- Surcharge: 15%
- Additional condition: Territory in [5, 7, 9]
- Effective: 2026-02-10

New York (Wave 2):
- Surcharge: 12%
- Additional condition: Coverage > $5M
- Effective: 2026-03-01

Texas (Wave 3):
- Surcharge: 10% (use base)
- Additional condition: Wind/Hail coverage
- Effective: 2026-03-15
```

#### Rollout Automation

**Automated Wave Progression:**
1. Wave 1 starts on scheduled date
2. System monitors for issues:
   - Error rate
   - Premium variance from expected
   - User feedback/complaints
3. If thresholds met after 2 weeks → Auto-advance to Wave 2
4. If issues detected → Pause rollout, send alerts

**Manual Controls:**
- Admin can pause rollout at any time
- Admin can skip a wave
- Admin can rollback to previous wave
- Admin can adjust wave schedule

**User Story:**
*"As a product manager, I want to deploy the new CA wildfire surcharge to California first, validate it with real quotes for 2 weeks, then roll out to other western states, so I can catch any issues before nationwide deployment."*

---

### Feature 2: Feature Toggles (Feature Flags)

**Description:** Enable or disable features dynamically without code deployment. Control feature availability by state, product line, customer tier, or user group.

#### Feature Toggle Types

**1. Kill Switch (Emergency Disable)**
```
Purpose: Instantly disable a feature if it causes problems
Example: "Disable Experience Rating if it's causing errors"
Control: Binary ON/OFF
Scope: Global or per state/product line
```

**2. Release Toggle (Gradual Rollout)**
```
Purpose: Control feature availability during rollout
Example: "Enable new commission calculation for CA only"
Control: State/product line/user group
Scope: Granular
```

**3. Experiment Toggle (A/B Testing)**
```
Purpose: Test different configurations with live traffic
Example: "50% of quotes use Method A, 50% use Method B"
Control: Percentage-based routing
Scope: User cohorts
```

**4. Ops Toggle (Operational Control)**
```
Purpose: Enable/disable resource-intensive features
Example: "Disable D&B enrichment during maintenance window"
Control: Time-based or manual
Scope: Global
```

#### Feature Toggle Configuration UI

**Navigate to:** Settings → Feature Toggles

**UI Layout:**

**Active Feature Toggles:**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Feature: CA Wildfire Surcharge                        [ENABLED ▼]   │
│ Type: Release Toggle                                                │
│ Scope: State-based (California only)                                │
│                                                                      │
│ Enabled For:                                                        │
│ ☑ States: CA                                                        │
│ ☐ States: All (override)                                            │
│ ☑ Product Lines: GL, Property                                      │
│ ☐ Product Lines: All                                                │
│                                                                      │
│ Configuration:                                                      │
│ - Surcharge: 15%                                                    │
│ - Apply to territories: 5, 7, 9                                     │
│                                                                      │
│ Metrics (Last 7 days):                                              │
│ - Quotes affected: 1,247                                            │
│ - Average surcharge applied: $187                                   │
│ - Error rate: 0.2%                                                  │
│                                                                      │
│ [Edit] [Disable] [View Logs] [Delete]                              │
└─────────────────────────────────────────────────────────────────────┘
```

**Create Feature Toggle:**
```
┌─────────────────────────────────────────────────────────────┐
│ Create Feature Toggle                                       │
│                                                              │
│ Feature Name: *                                             │
│ [New Commission Structure                               ]   │
│                                                              │
│ Feature Key: (auto-generated)                               │
│ [new_commission_structure_2026                          ]   │
│                                                              │
│ Toggle Type: *                                              │
│ ○ Kill Switch                                               │
│ ● Release Toggle                                            │
│ ○ Experiment Toggle                                         │
│ ○ Ops Toggle                                                │
│                                                              │
│ Target Component: *                                         │
│ ☑ Rules                                                     │
│ ☐ Mappings                                                  │
│ ☐ Workflow Steps                                            │
│ ☐ Plugins                                                   │
│                                                              │
│ Scope Configuration:                                        │
│                                                              │
│ Enable for States:                                          │
│ ☑ CA  ☑ NY  ☐ TX  ☐ FL  ☐ IL  [Select All] [Clear]        │
│                                                              │
│ Enable for Product Lines:                                   │
│ ☑ GL  ☑ WC  ☐ Property  ☐ Inland Marine  [Select All]      │
│                                                              │
│ Enable for Users: (optional)                                │
│ ○ All users                                                 │
│ ○ Specific user groups: [Select Groups ▼]                  │
│ ○ Percentage: [50%] of traffic                             │
│                                                              │
│ Schedule (optional):                                        │
│ Auto-enable on: [2026-02-10] at [00:00]                    │
│ Auto-disable on: [          ] at [     ] (never)           │
│                                                              │
│ Fallback Behavior:                                          │
│ When toggle is OFF:                                         │
│ ○ Use default logic                                         │
│ ● Use previous configuration                                │
│ ○ Return error                                              │
│                                                              │
│ Monitoring:                                                 │
│ ☑ Track usage metrics                                       │
│ ☑ Alert if error rate > [5%]                               │
│ ☑ Email notification on status change                       │
│                                                              │
│ [Cancel] [Create Toggle]                                   │
└─────────────────────────────────────────────────────────────┘
```

#### Feature Toggle in Workflow

**How Toggles Work in Execution:**

**Example: Commission Calculation Rule**

**Without Toggle:**
```
Rating Workflow:
1. Validate
2. Transform
3. Execute Rules
   - Base Premium Calculation
   - Apply Modifiers
   - Calculate Commission (OLD METHOD - 5% flat)
4. Return Response
```

**With Toggle (Enabled for CA only):**
```
Rating Workflow:
1. Validate
2. Transform
3. Execute Rules
   - Base Premium Calculation
   - Apply Modifiers
   - Calculate Commission:
       IF FeatureToggle("new_commission_structure_2026").isEnabled(state="CA"):
           Use NEW METHOD (tiered: 5%, 7%, 10%)
       ELSE:
           Use OLD METHOD (5% flat)
4. Return Response
```

**Behind the Scenes:**
```
Quote from California:
→ Check toggle: new_commission_structure_2026
→ State: CA
→ Toggle enabled for CA? YES
→ Execute NEW commission logic
→ Commission: $450 (7% tier)

Quote from Texas:
→ Check toggle: new_commission_structure_2026
→ State: TX
→ Toggle enabled for TX? NO
→ Execute OLD commission logic
→ Commission: $300 (5% flat)
```

#### Feature Toggle Use Cases

**Use Case 1: Gradual State Rollout**
```
Scenario: New surcharge rule approved in CA, pending in other states

Solution:
- Create feature toggle: "ca_surcharge_2026"
- Enable for: CA only
- Deploy code with toggle check
- When NY approves: Add NY to toggle (no code deployment)
- When TX approves: Add TX to toggle
```

**Use Case 2: Emergency Kill Switch**
```
Scenario: New rule causing 10% error rate in production

Solution:
- Navigate to Feature Toggles
- Find "new_rule_2026"
- Click "Disable" (takes effect in <1 second)
- All quotes revert to previous logic
- Investigate issue offline
- Re-enable when fixed
```

**Use Case 3: A/B Testing**
```
Scenario: Test two commission calculation methods

Solution:
- Create toggle: "commission_test_2026"
- Type: Experiment Toggle
- Enable for: 50% of quotes
- Method A: Current logic
- Method B: New logic (via toggle)
- Run for 2 weeks
- Compare: revenue, customer satisfaction
- Choose winning method
- Roll out to 100%
```

**Use Case 4: Phased Feature Rollout**
```
Scenario: Roll out complex rating engine integration

Phase 1 (Week 1):
- Toggle enabled for: Internal users only
- Test with real quotes, verify results

Phase 2 (Week 2):
- Toggle enabled for: 10% of production traffic
- Monitor error rates, performance

Phase 3 (Week 3):
- Toggle enabled for: 50% of production traffic
- Validate at scale

Phase 4 (Week 4):
- Toggle enabled for: 100% of production traffic
- Full rollout complete

Phase 5 (Week 5+):
- Remove toggle from code (toggle retired)
```

#### Integration with Rules & Mappings

**Toggle in Rules:**

**Rule with Toggle:**
```
Rule: California Wildfire Surcharge

Conditions:
- IF State = "CA"
- AND Territory IN [5, 7, 9]
- AND Coverage includes "Property"
- AND FeatureToggle("ca_wildfire_surcharge_2026").isEnabled()

Actions:
- THEN Surcharge = 15%
```

**Toggle in Mappings:**

**Field Mapping with Toggle:**
```
Mapping: Commission Field

Source: Quote.Commission
Target: Rating.CommissionAmount

Transformation:
IF FeatureToggle("new_commission_structure_2026").isEnabled(state):
    Map to: Rating.CommissionAmountNew (tiered calculation)
ELSE:
    Map to: Rating.CommissionAmount (flat 5%)
```

**Toggle in Plugins:**

**Plugin with Toggle:**
```
Workflow Step 4: D&B Enrichment Plugin

Execution:
IF FeatureToggle("dnb_enrichment").isEnabled():
    Execute D&B plugin
    Add credit score to context
ELSE:
    Skip D&B enrichment
    Continue with default data
```

#### Monitoring & Analytics

**Feature Toggle Dashboard:**

```
┌──────────────────────────────────────────────────────────────┐
│ Feature Toggle Analytics                    Last 30 Days     │
│                                                               │
│ Total Active Toggles: 12                                     │
│ Toggles by Type:                                             │
│ - Kill Switch: 2                                             │
│ - Release Toggle: 7                                          │
│ - Experiment Toggle: 2                                       │
│ - Ops Toggle: 1                                              │
│                                                               │
│ Toggle Usage (Last 7 Days):                                  │
│                                                               │
│ CA Wildfire Surcharge                      [████████░░] 82%  │
│ - Enabled: CA, OR, WA                                        │
│ - Quotes affected: 3,456                                     │
│ - Error rate: 0.1%                                           │
│ - Avg surcharge: $215                                        │
│                                                               │
│ New Commission Structure                   [███░░░░░░░] 25%  │
│ - Enabled: CA, NY                                            │
│ - Quotes affected: 1,892                                     │
│ - Error rate: 0.0%                                           │
│ - A/B Test Result: Method B +12% revenue                    │
│                                                               │
│ Experience Rating Module                   [█░░░░░░░░░] 5%   │
│ - Enabled: Internal users only                               │
│ - Quotes affected: 123                                       │
│ - Error rate: 2.4% (investigating)                           │
│                                                               │
│ [Export Report] [Configure Alerts]                          │
└──────────────────────────────────────────────────────────────┘
```

**Per-Toggle Analytics:**
```
Toggle: CA Wildfire Surcharge

Usage Breakdown:
- Total evaluations: 15,234
- Enabled (CA): 3,456 (22.7%)
- Disabled (other states): 11,778 (77.3%)

Performance:
- Avg evaluation time: 0.3ms
- P95 evaluation time: 0.8ms
- Error rate: 0.1%

State Distribution:
- CA: 3,456 quotes (+15% surcharge)
- OR: 892 quotes (+15% surcharge)
- WA: 567 quotes (+15% surcharge)
- TX: 4,234 quotes (no surcharge - toggle disabled)
- Other: 6,085 quotes (no surcharge)

Financial Impact:
- Total surcharge collected: $742,340
- Average per affected quote: $187
```

#### Rollback & Contingency

**Instant Rollback:**
1. Navigate to Feature Toggles
2. Select problematic feature
3. Click "Disable"
4. Confirmation: "Disable 'CA Wildfire Surcharge'?"
5. Confirm
6. **Toggle disabled in <1 second globally**
7. All in-flight requests complete with old logic
8. New requests use old logic
9. Email notification sent to admins
10. Rollback logged in audit trail

**Automatic Rollback:**
```
Configure Auto-Rollback:
- If error rate > 5%: Auto-disable
- If response time > 10 seconds: Auto-disable
- If premium variance > 20%: Alert (manual decision)

Notification:
- Email: product-team@company.com
- Slack: #rating-alerts
- SMS: On-call engineer (critical only)
```

#### Best Practices

**Toggle Lifecycle:**

**1. Creation**
- Define clear purpose and scope
- Set expiration date (toggles should be temporary)
- Document expected behavior

**2. Activation**
- Start with limited scope (1 state, 1 product line)
- Monitor closely for first 48 hours
- Gradually expand scope

**3. Monitoring**
- Track usage metrics daily
- Review error rates
- Collect user feedback

**4. Retirement**
- After 100% rollout, retire toggle
- Remove toggle checks from code
- Archive toggle configuration
- Document learnings

**Toggle Debt Management:**
```
Warning: You have 8 toggles older than 90 days

Stale Toggles (should be retired):
- old_commission_calc_2025 (enabled 100%, 180 days old)
  → Recommendation: Remove from code

- beta_feature_test (enabled 0%, 120 days old)
  → Recommendation: Delete toggle

- experimental_surcharge (enabled CA only, 95 days old)
  → Recommendation: Make permanent for CA or remove
```

### Feature 3: Combined Wave Rollout + Feature Toggles

**Powerful Pattern: Waves with Toggles**

**Scenario: Multi-State Surcharge Rollout**

**Step 1: Create Feature with Toggle (Disabled)**
```
Feature: Hurricane Surcharge 2026
Toggle: hurricane_surcharge_2026
Status: Created (disabled globally)
```

**Step 2: Configure Wave Rollout**
```
Wave 1 (Week 1): FL only
- Toggle enabled for: FL
- Surcharge: 20%
- Monitor error rate, premium variance

Wave 2 (Week 3): GA, SC, NC
- Toggle enabled for: FL, GA, SC, NC
- Surcharge: 18%
- If Wave 1 successful (error rate <2%)

Wave 3 (Week 5): LA, MS, AL
- Toggle enabled for: All Gulf/Atlantic states
- Surcharge: 15%
- If Wave 2 successful

Wave 4 (Week 7): National (all coastal states)
- Toggle enabled for: All coastal states
- Surcharge varies by state (10-20%)
```

**Step 3: Execute Rollout**
```
2026-02-10: Wave 1 starts
- Toggle auto-enabled for FL at midnight
- Monitoring dashboard shows real-time metrics
- 500 FL quotes processed in first hour
- Error rate: 0.0% ✓
- Average surcharge: $245 ✓

2026-02-12: Issue detected
- Error rate spikes to 3.5% for high-value policies
- Root cause: Surcharge calculation overflow for limits >$10M
- Action: Pause rollout, fix bug

2026-02-13: Fix deployed
- Updated surcharge calculation
- Resume Wave 1 (FL)
- Error rate back to 0.1% ✓

2026-02-24: Wave 1 complete, Wave 2 starts
- Toggle auto-enabled for GA, SC, NC
- No issues detected
- Proceed to Wave 3

2026-03-10: Full rollout complete
- All coastal states enabled
- 45,000 quotes processed
- $8.2M in surcharges collected
- System stable
```

**Step 4: Post-Rollout**
```
2026-04-01: Toggle retirement plan
- Hurricane surcharge now standard feature
- Toggle enabled for 100% of applicable states
- Schedule toggle removal from code (Q2 2026)
- Document as permanent rule
```

### Technical Implementation Notes

**Toggle Storage:**
```
Database Table: feature_toggles

Columns:
- toggle_key (unique)
- toggle_name
- toggle_type (kill_switch, release, experiment, ops)
- enabled_globally (boolean)
- enabled_states (array)
- enabled_product_lines (array)
- enabled_user_groups (array)
- percentage_rollout (0-100)
- configuration (JSONB)
- created_at
- updated_at
- expires_at
- created_by
- last_modified_by

Indexes:
- toggle_key (primary)
- enabled_globally
- enabled_states (GIN index for array queries)
```

**Toggle Evaluation (Pseudo-code):**
```
function isFeatureEnabled(toggleKey, context):
    toggle = getToggle(toggleKey)

    if not toggle:
        return false

    if not toggle.enabled_globally:
        return false

    if toggle.expires_at < now():
        return false

    # Check state filter
    if toggle.enabled_states:
        if context.state not in toggle.enabled_states:
            return false

    # Check product line filter
    if toggle.enabled_product_lines:
        if context.product_line not in toggle.enabled_product_lines:
            return false

    # Check percentage rollout
    if toggle.percentage_rollout < 100:
        hash = hashUserId(context.user_id, toggleKey)
        if hash % 100 >= toggle.percentage_rollout:
            return false

    return true
```

**Performance Considerations:**
- Feature toggles evaluated in <1ms
- Toggle configuration cached (TTL: 60 seconds)
- Changes propagate within 60 seconds
- No impact on rating performance

### User Stories

**User Story 1: Product Manager - Wave Rollout**
*"As a product manager, I want to roll out the new CA wildfire surcharge to California first, monitor it for 2 weeks, then expand to OR and WA, so I can validate the feature with real production data before nationwide deployment."*

**User Story 2: Compliance Officer - State-by-State Activation**
*"As a compliance officer, I want to enable features only in states where we have regulatory approval, and easily add new states as approvals come in, so we remain compliant while rolling out new functionality."*

**User Story 3: Developer - Emergency Kill Switch**
*"As a developer, I want the ability to instantly disable a problematic feature in production without deploying code, so I can quickly mitigate issues and restore service."*

**User Story 4: Data Analyst - A/B Testing**
*"As a data analyst, I want to test two different commission calculation methods on 50% of quotes each, compare the results, and choose the better performing method before full rollout."*

**User Story 5: Operations Manager - Phased Deployment**
*"As an operations manager, I want to deploy the new rating engine integration to 10% of traffic first, monitor for issues, then gradually increase to 100% over 4 weeks, so we can catch any problems early."*

---

### 1. Domain-First Design

**Principle:** Each business capability is a domain with clear boundaries

**Rating Domain:**
- **Input Contract:** Quote data (from policy system)
- **Output Contract:** Premium + rating details
- **Responsibilities:** Transform data, apply rules, calculate premium, call rating engine
- **Boundaries:** Does NOT handle policy issuance, billing, claims

**Future Domains:**
- Policy Domain (issuance, endorsements, renewals)
- Billing Domain (invoicing, payments, collections)
- Claims Domain (intake, adjudication, settlement)
- Document Domain (generation, storage, retrieval)

**Benefits:**
- Clear separation of concerns
- Teams can own specific domains
- Independent deployment per domain
- Easier to understand and maintain

### 2. Configuration Over Code (80/20 Rule)

**Principle:** 80% of use cases should be solvable through configuration, 20% through code

**Configuration-Driven (No Code):**
- Field mappings
- Business rules
- Workflow orchestration
- Enable/disable plugins
- Product line settings

**Code-When-Needed (Custom Development):**
- Custom plugins for unique logic
- Integrations with proprietary systems
- Complex algorithms not in rule builder
- Performance optimizations

**Benefits:**
- Faster implementation for common scenarios
- Business users can configure without developers
- Developers focus on truly unique requirements
- Reduced maintenance burden

### 3. Plugin Architecture with Extension Points

**Principle:** Platform provides extension points; plugins implement capabilities

**Core Platform Responsibilities:**
- Workflow orchestration
- Data transformation (mappings)
- Rule execution
- Plugin lifecycle management
- Security and access control

**Plugin Responsibilities:**
- Data enrichment (D&B, Experian)
- External API calls (Earnix, Ratabase)
- Document generation (PDF, Excel)
- Storage (S3, database)
- Messaging (Kafka, SQS)

**Extension Points (Hooks):**
- Pre-process (before validation)
- Post-validate
- Post-transform (after mappings)
- Post-rules
- Pre-response

**Benefits:**
- Core platform stays lean
- Capabilities added through plugins
- Community can build plugins
- Each org chooses plugins they need

### 4. Template-Driven Development

**Principle:** Start from proven templates, customize as needed

**Template Structure:**
- Mappings (field transformations)
- Rules (business logic)
- Workflow (orchestration)
- Plugins (enabled capabilities)
- Field catalog (data definitions)
- Documentation & samples

**Template Lifecycle:**
1. Browse marketplace
2. Preview template
3. Install template
4. Customize for environment
5. Test with sample data
6. Deploy to production
7. Export as new template (optional)

**Benefits:**
- Reuse proven patterns
- Faster time to value
- Consistency across implementations
- Knowledge sharing through templates

### 5. Multi-Tenant by Design

**Principle:** Platform supports multiple customers with complete data isolation

**Tenant Isolation:**
- Each tenant has own database schema or namespace
- Data queries always filtered by tenant ID
- No cross-tenant data leakage
- API calls scoped to tenant

**Shared Resources:**
- Marketplace templates (public)
- Plugin library (public)
- Core platform code
- Infrastructure

**Tenant-Specific Resources:**
- Configurations (mappings, rules, workflows)
- Custom plugins (optional sharing)
- User accounts and permissions
- Transaction data

**Benefits:**
- SaaS business model possible
- Lower infrastructure costs (shared resources)
- Marketplace network effects
- Secure isolation between customers

### 6. API-First Design

**Principle:** All functionality exposed through well-documented APIs

**API Structure:**
- RESTful APIs for CRUD operations
- Webhook APIs for events/notifications
- WebSocket APIs for real-time updates
- GraphQL for flexible queries (future)

**API Use Cases:**
- UI consumes APIs for all operations
- External systems integrate via APIs
- CLI tools use APIs
- Custom applications built on APIs

**Benefits:**
- Flexibility for different clients (web, mobile, CLI)
- Integration with external systems
- Automation via API calls
- Platform-as-a-service model

---

## Marketplace Components

### 1. Template Marketplace

**Component Description:**
Central repository of pre-built integration templates that users can browse, preview, and install.

**Key Capabilities:**
- Template catalog with search and filtering
- Template details page with:
  - Description and use case
  - Included components
  - Screenshots/previews
  - Version history
  - Ratings and reviews
  - Installation count
- One-click installation
- Dependency management
- Update notifications

**Template Categories:**
- By Domain: Rating, Policy, Billing, Claims
- By Source System: Guidewire, Duck Creek, Socotra, Custom
- By Target System: Earnix, Ratabase, Custom API
- By Product Line: GL, WC, Property, Inland Marine, etc.

**Template Metadata:**
- Name and description
- Version number
- Author/publisher
- License type (free, paid, enterprise)
- Prerequisites and dependencies
- Compatible platform version
- Installation instructions
- Sample data

### 2. Plugin Marketplace

**Component Description:**
Library of reusable plugins that add specific capabilities to workflows.

**Plugin Types:**

**System Plugins (Pre-built by Platform):**
- AWS S3 Storage
- Kafka Publisher
- PDF Generator
- Basic validation plugins

**Community Plugins (Built by Users/Partners):**
- D&B Enrichment
- Experian Credit Check
- Industry-specific calculators
- Custom connectors

**Enterprise Plugins (Premium/Paid):**
- Advanced analytics
- Premium data sources
- Specialized rating engines
- Compliance validators

**Plugin Metadata:**
- Name and description
- Category
- Version number
- Pricing (free, freemium, paid)
- Dependencies
- Configuration requirements
- Documentation link
- Ratings and reviews

### 3. Field Catalog

**Component Description:**
Central repository of insurance field definitions that can be reused across mappings.

**Field Catalog Scope:**

**Shared Fields (Available to All):**
- 40+ pre-defined insurance fields
- Standard data types
- Common insurance entities (policy, insured, coverage, claim)

**Custom Fields (Tenant-Specific):**
- Organization-specific fields
- Product-specific fields
- Optional sharing with marketplace

**Field Metadata:**
- Field name and display name
- Data type (from 16 insurance-specific types)
- Category (policy, insured, coverage, etc.)
- Description and documentation
- Sample value
- Validation rules
- Required flag

**Use in Mappings:**
- Browse catalog when creating mappings
- Auto-fill field metadata
- Consistent naming across mappings
- Reusable definitions

### 4. Workflow Templates

**Component Description:**
Pre-configured workflow sequences for common integration patterns.

**Workflow Template Examples:**

**Basic Rating Workflow:**
```
1. Validate Input
2. Execute Mappings
3. Execute Rules
4. Return Response
```

**Enhanced Rating with Enrichment:**
```
1. Validate Input
2. D&B Enrichment
3. Execute Mappings
4. Execute Rules
5. Call Rating Engine
6. Generate Worksheet
7. Store to S3
8. Return Response
```

**Multi-Rating Engine Comparison:**
```
1. Validate Input
2. Execute Mappings
3. Parallel: Call Earnix + Call Ratabase
4. Compare Results
5. Select Best Rate
6. Return Response
```

**Workflow Features:**
- Visual representation
- Drag-and-drop customization
- Add/remove steps
- Configure each step
- Test workflow with sample data

### 5. Rule Templates

**Component Description:**
Pre-built business rule patterns for common rating scenarios.

**Rule Template Categories:**

**Premium Calculation:**
- Base premium = Limit × Rate
- Premium with modifiers
- Tiered rating by exposure
- Experience modification

**Surcharge/Discount:**
- State-based surcharges
- Industry class discounts
- Claims history modifiers
- Multi-policy discounts

**Validation:**
- Coverage limit validation
- Eligibility checks
- Required field validation
- Business rule validation

**Rating Factors:**
- Territory rating
- Class code rating
- Loss history rating
- Credit-based rating

**Rule Template Usage:**
1. Browse rule templates
2. Select template matching use case
3. Customize conditions and values
4. Test with sample data
5. Deploy to production

---

## Domain Structure

### Initial Focus: Rating Domain

**Scope:**
The Rating Domain handles premium calculation and rating for insurance products.

**Domain Responsibilities:**
1. Receive quote/policy data from source system
2. Validate input data
3. Enrich data (optional, via plugins)
4. Transform data to rating engine format (via mappings)
5. Apply rating rules and calculations
6. Call external rating engine (optional, via plugins)
7. Generate rating artifacts (worksheets, reports)
8. Store transaction data (optional, via plugins)
9. Return premium and rating details

**Domain Boundaries:**
- **IN SCOPE:** Premium calculation, rating logic, data transformation, rule execution
- **OUT OF SCOPE:** Policy issuance, billing, claims, underwriting decisions (future domains)

**Product Lines within Rating Domain:**

Each product line is independently configurable:

| Product Line | Source System | Target Rating Engine | Workflow |
|-------------|---------------|---------------------|----------|
| General Liability | Guidewire | Earnix | Standard |
| Workers Comp | Guidewire | Ratabase | Enhanced + Enrichment |
| Property | Duck Creek | Earnix | Standard |
| Inland Marine | Guidewire | Ratabase | Enhanced |
| Commercial Auto | Custom | Custom API | Custom Workflow |

**Key Insight:** Product lines are configurations, not separate codebases or microservices.

### Future Domains (Post-Rating)

**Policy Domain:**
- Policy issuance and binding
- Endorsements and changes
- Renewals
- Cancellations

**Billing Domain:**
- Invoice generation
- Payment processing
- Collections
- Premium financing

**Claims Domain:**
- Claims intake and reporting
- Adjudication
- Settlement
- Subrogation

**Document Domain:**
- Policy document generation
- Certificate of insurance
- Billing statements
- Correspondence

**Each domain follows same pattern:**
- Marketplace templates
- Visual configuration tools
- Plugin architecture
- Workflow builder
- Multi-tenancy

---

## User Journeys

### Journey 1: Business Analyst Configures New Product Line

**Persona:** Michael (Business Analyst)
**Goal:** Configure Workers Compensation rating without developer help
**Timeline:** 2 days

**Steps:**

**Day 1 - Morning: Discover & Install Template**
1. Login to InsurRateX platform
2. Navigate to Marketplace → Templates
3. Search for "Workers Compensation Guidewire to Ratabase"
4. Preview template:
   - See 32 pre-configured field mappings
   - Review 18 rating rules
   - Check workflow (includes D&B enrichment)
5. Click "Install Template"
6. Installation wizard:
   - Select product line name: "WC - Commercial"
   - Configure Ratabase API credentials
   - Set environment (staging)
7. Template installed successfully

**Day 1 - Afternoon: Customize Mappings**
1. Navigate to Product Lines → WC - Commercial → Mappings
2. Review installed mappings
3. Customize 5 mappings for company-specific fields:
   - Open mapping editor (visual tool)
   - Drag fields from source to target
   - Set data types from dropdown
   - Add sample values
4. Save changes

**Day 2 - Morning: Configure Rules**
1. Navigate to Rules for WC - Commercial
2. Review installed rating rules
3. Modify "Experience Modifier" rule:
   - Open visual rule builder
   - Adjust condition: "If losses > $100K" (was $50K)
   - Change modifier from 1.2 to 1.15
4. Add new rule "State Surcharge for CA":
   - IF state = CA AND payroll > $1M
   - THEN surcharge = 10%
5. Test rules with 5 sample scenarios
6. All tests pass

**Day 2 - Afternoon: Test & Deploy**
1. Navigate to Test Workflow
2. Input sample WC quote JSON
3. Execute workflow step-by-step:
   - Validation ✓
   - D&B Enrichment ✓
   - Mappings ✓
   - Rules ✓ (new CA surcharge applied correctly)
   - Ratabase API call ✓
4. Review output: Premium = $12,450
5. Deploy to staging environment
6. Notify team: "WC - Commercial ready for UAT"

**Outcome:** Michael configured entire WC product line in 2 days without writing code or involving developers.

---

### Journey 2: Developer Adds Custom Plugin

**Persona:** Sarah (Integration Developer)
**Goal:** Integrate proprietary underwriting system into GL rating workflow
**Timeline:** 1 week

**Context:**
Company has proprietary underwriting API that must be called before rating GL policies. No pre-built plugin exists in marketplace.

**Steps:**

**Day 1: Research & Setup**
1. Check marketplace for underwriting plugins (none found)
2. Read Custom Plugin SDK documentation
3. Install plugin CLI tool: `npm install -g insurratex-plugin-cli`
4. Generate plugin scaffold:
   ```bash
   insurratex-plugin create custom-underwriting-connector
   ```
5. Review generated code structure:
   - `src/plugin.ts` - Main plugin class
   - `src/config.ts` - Configuration schema
   - `tests/plugin.test.ts` - Test suite
   - `README.md` - Plugin documentation

**Day 2-3: Implement Plugin**
1. Implement `execute()` method:
   - Extract business data from context
   - Call company's underwriting API
   - Parse response
   - Add underwriting result to context
   - Handle errors
2. Define configuration schema:
   - API endpoint URL
   - API key
   - Timeout settings
3. Write unit tests (10 test cases)
4. Run tests locally: All pass ✓

**Day 4: Test Integration**
1. Deploy plugin to development environment
2. Register plugin in platform
3. Add plugin to GL workflow:
   - Open GL product line
   - Edit workflow
   - Drag "Custom Underwriting Connector" step
   - Position after validation, before mappings
   - Configure plugin settings (API URL, key)
4. Test complete workflow:
   - Input sample GL quote
   - Step through workflow
   - Verify underwriting API called
   - Check underwriting result in context
   - Confirm rating proceeds if approved

**Day 5: Deploy & Document**
1. Deploy plugin to staging environment
2. Update GL staging workflow with plugin
3. Run 20 test scenarios:
   - Approved quotes → rating succeeds ✓
   - Declined quotes → workflow stops with message ✓
   - API timeout → error handled gracefully ✓
4. Write plugin documentation
5. Optionally publish to private marketplace (for other teams)

**Outcome:** Sarah integrated proprietary system in 1 week. 80% was standard plugin framework (provided by SDK), 20% was company-specific logic.

---

### Journey 3: Consultant Reuses Configuration Across Clients

**Persona:** Jennifer (Insurance Consultant)
**Goal:** Deploy GL rating for Client B using configuration from Client A
**Timeline:** 3 days

**Context:**
Jennifer implemented GL - Guidewire to Earnix for Client A (large carrier). Client B (small carrier) has similar needs with minor differences.

**Steps:**

**Day 1: Export from Client A**
1. Login to Client A's InsurRateX environment
2. Navigate to Product Lines → GL - Standard
3. Click "Export Configuration"
4. Select components to export:
   - ✓ Mappings (47 mappings)
   - ✓ Rules (23 rules)
   - ✓ Workflow (6 steps)
   - ✓ Plugin configurations
   - ✓ Field catalog (custom fields only)
   - ✗ API credentials (excluded for security)
5. Download package: `GL-Standard-v2.0.zip`

**Day 2: Import to Client B**
1. Login to Client B's InsurRateX environment
2. Navigate to Marketplace → Import Package
3. Upload `GL-Standard-v2.0.zip`
4. Preview import:
   - See all mappings, rules, workflow
   - Review for conflicts (none found)
5. Click "Import"
6. Import successful → new product line created: "GL - Standard (imported)"

**Day 2 (Afternoon): Customize for Client B**
1. Client B has different field names in Guidewire
2. Update 8 mappings:
   - Change source field paths to Client B's schema
   - All other settings remain same
3. Client B has different rate table
4. Update 2 rules:
   - Change base rate from $2.50 to $3.00
   - Update territory surcharges (different values)
5. Configure Earnix API credentials (Client B's keys)

**Day 3: Test & Deploy**
1. Test with Client B's sample quotes (10 scenarios)
2. Compare results with expected premiums
3. Minor adjustment to 1 rule (decimal rounding)
4. Retest - all pass ✓
5. Deploy to Client B production
6. Document differences in configuration notes

**Outcome:** Jennifer reused 90% of Client A configuration, customized 10% for Client B. 2 weeks of work saved.

---

### Journey 4: Platform Admin Manages Multi-Tenant Environment

**Persona:** David (Platform Administrator)
**Goal:** Onboard new customer and manage platform
**Timeline:** Ongoing

**Responsibilities:**

**New Customer Onboarding:**
1. Create new tenant account
2. Set up admin user for customer
3. Configure environment settings:
   - Tenant name and branding
   - Email notifications
   - Security settings (SSO, MFA)
4. Grant marketplace access
5. Assign resource quotas:
   - Max product lines: 10
   - Max custom plugins: 20
   - API rate limits: 1000 req/min

**Ongoing Management:**
1. Monitor system health:
   - API response times
   - Error rates per tenant
   - Resource usage
2. Manage marketplace:
   - Approve new template submissions
   - Review community plugins
   - Monitor ratings/reviews
3. User support:
   - Reset passwords
   - Grant permissions
   - Troubleshoot issues
4. Platform updates:
   - Deploy new platform versions
   - Communicate changes to tenants
   - Manage breaking changes

**Security & Compliance:**
1. Ensure data isolation between tenants
2. Monitor for security vulnerabilities
3. Generate compliance reports
4. Manage audit logs

---

## Success Metrics

### Business Metrics

**1. Time to Value**
- **Target:** Reduce integration time from 6 months to 2 days (standard scenarios)
- **Measurement:** Track time from project start to production deployment
- **Baseline:** 6 months average (current state)
- **Year 1 Goal:** 2 weeks average
- **Year 2 Goal:** 2 days average

**2. Cost Reduction**
- **Target:** Reduce implementation cost from $500K to $50K per product line
- **Measurement:** Track labor costs (person-hours × rate)
- **Baseline:** 7 people × 6 months = $500K
- **Year 1 Goal:** 2 people × 1 month = $100K
- **Year 2 Goal:** 1 person × 1 week = $50K

**3. Template Adoption**
- **Target:** 80% of implementations start from marketplace template
- **Measurement:** Track installations vs. built-from-scratch
- **Year 1 Goal:** 50% use templates
- **Year 2 Goal:** 80% use templates

**4. Customer Acquisition**
- **Target:** 50 active customers by Year 2
- **Measurement:** Track unique tenant accounts with production deployments
- **Year 1 Goal:** 10 customers
- **Year 2 Goal:** 50 customers

### Product Metrics

**5. Marketplace Growth**
- **Templates:**
  - Year 1: 20 templates
  - Year 2: 100 templates
- **Plugins:**
  - Year 1: 25 plugins
  - Year 2: 75 plugins
- **Community Contributions:**
  - Year 2: 30% of templates from partners/community

**6. Platform Usage**
- **Active Product Lines:** 200+ by Year 2
- **Monthly Transactions:** 100K+ rating executions/month by Year 2
- **API Calls:** 1M+ API calls/month by Year 2

**7. Configuration vs. Code Ratio**
- **Target:** 80% of product lines configured without custom code
- **Measurement:** Track % of product lines with zero custom plugins
- **Year 1 Goal:** 60%
- **Year 2 Goal:** 80%

### User Satisfaction Metrics

**8. Net Promoter Score (NPS)**
- **Target:** NPS > 50 by Year 2
- **Measurement:** Quarterly NPS survey
- **Year 1 Goal:** NPS > 30
- **Year 2 Goal:** NPS > 50

**9. User Engagement**
- **Daily Active Users:** 100+ by Year 2
- **Monthly Active Users:** 500+ by Year 2
- **Session Duration:** >20 minutes average

**10. Support Metrics**
- **Time to Resolution:** <24 hours for critical issues
- **Ticket Volume:** Decrease by 50% year-over-year (as platform matures)
- **Self-Service Rate:** 70% of questions answered via documentation

### Technical Metrics

**11. Performance**
- **API Response Time:** <500ms for 95th percentile
- **Workflow Execution Time:** <5 seconds for standard rating workflow
- **Uptime:** 99.9% availability

**12. Quality**
- **Error Rate:** <1% of transactions fail
- **Bug Escape Rate:** <5 critical bugs per quarter
- **Test Coverage:** >80% code coverage

---

## Phased Roadmap

### Phase 1: Foundation (Months 1-3)

**Goal:** Prove concept with Rating domain and basic marketplace

**Deliverables:**

**Month 1: Core Platform**
- ✓ Database schema for multi-tenancy
- ✓ Rating domain workflow engine
- ✓ Mapping configuration (existing, enhance)
- ✓ Rule configuration (existing, enhance)
- ✓ Field catalog (existing)
- ✓ Basic API endpoints

**Month 2: Plugin Infrastructure**
- ✓ Plugin architecture and registry
- ✓ 5 core plugins:
  - AWS S3 Storage
  - Kafka Publisher
  - PDF Generator
  - Earnix Connector
  - Basic validation
- ✓ Plugin SDK (alpha version)
- ✓ Extension hooks in workflow

**Month 3: Marketplace MVP**
- ✓ Template packaging format
- ✓ Import/export functionality
- ✓ 3 marketplace templates:
  - GL - Guidewire to Earnix
  - WC - Guidewire to Ratabase
  - Property - Duck Creek to Earnix
- ✓ Template browser UI (basic)
- ✓ One-click installation

**Success Criteria:**
- Demo template installation in <5 minutes
- 3 pilot customers using platform
- At least 1 customer deploys to production

---

### Phase 2: Marketplace Enhancement (Months 4-6)

**Goal:** Expand marketplace and improve user experience

**Deliverables:**

**Month 4: Visual Workflow Builder**
- ✓ Drag-and-drop workflow canvas
- ✓ Visual workflow representation
- ✓ Workflow testing with sample data
- ✓ Workflow templates (5 patterns)

**Month 5: Plugin Marketplace**
- ✓ Plugin browser UI
- ✓ 15 additional plugins:
  - D&B Enrichment
  - Experian Credit Check
  - RabbitMQ Publisher
  - Excel Generator
  - 11 more...
- ✓ Plugin configuration UI
- ✓ Plugin ratings and reviews

**Month 6: Template Expansion**
- ✓ 10 additional templates (total: 13)
- ✓ Template versioning
- ✓ Template update mechanism
- ✓ Template ratings and reviews
- ✓ Template documentation standards

**Success Criteria:**
- 10 active customers
- 80% of new product lines start from template
- 50% of customers use at least 1 plugin
- Average implementation time < 1 week

---

### Phase 3: Customization & Scale (Months 7-9)

**Goal:** Enable customization and scale to 50+ customers

**Deliverables:**

**Month 7: Custom Plugin SDK (GA)**
- ✓ Plugin SDK documentation
- ✓ CLI tools for plugin development
- ✓ Plugin testing framework
- ✓ Plugin deployment pipeline
- ✓ 10+ sample plugins with code
- ✓ Video tutorials

**Month 8: Advanced Features**
- ✓ Advanced rule builder (complex conditions)
- ✓ Expression language for calculations
- ✓ Workflow branching and parallel execution
- ✓ Error handling and retry logic
- ✓ Workflow versioning

**Month 9: Multi-Environment Support**
- ✓ Dev/Staging/Production environments
- ✓ Environment promotion workflow
- ✓ Configuration comparison tools
- ✓ Rollback capabilities
- ✓ Audit logging

**Success Criteria:**
- 25 active customers
- 10+ custom plugins deployed by customers
- 5+ partner-contributed plugins
- 99.5% uptime

---

### Phase 4: Multi-Domain Expansion (Months 10-12)

**Goal:** Expand beyond Rating to Policy domain

**Deliverables:**

**Month 10: Policy Domain Foundation**
- ✓ Policy domain data model
- ✓ Policy workflow engine
- ✓ Policy-specific plugins (3)
- ✓ Domain selector in UI

**Month 11: Policy Templates**
- ✓ 5 policy templates:
  - GL Policy Issuance
  - WC Policy Issuance
  - Property Policy Issuance
  - Policy Renewal
  - Policy Endorsement
- ✓ Policy-specific field catalog

**Month 12: Integration & Polish**
- ✓ Cross-domain workflows (Rating → Policy)
- ✓ Performance optimization
- ✓ Security hardening
- ✓ Documentation overhaul
- ✓ Partner program launch

**Success Criteria:**
- 50 active customers
- 100+ active product lines
- 20+ templates across domains
- 50+ plugins available
- Partner ecosystem established

---

### Phase 5: Enterprise & Ecosystem (Year 2)

**Goal:** Scale to enterprise customers and build partner ecosystem

**Key Initiatives:**

**Enterprise Features:**
- Advanced security (SSO, RBAC, compliance)
- White-labeling for partners
- Advanced analytics and reporting
- Custom SLAs and support tiers
- Private marketplace for enterprises

**Ecosystem Growth:**
- Partner certification program
- Marketplace revenue sharing
- Premium plugin marketplace
- Template authoring tools
- Community forums and support

**Additional Domains:**
- Billing domain
- Claims domain
- Document domain
- Underwriting domain (if needed)

**Success Criteria:**
- 100+ active customers
- 200+ templates
- 100+ plugins
- 30% marketplace from partners
- $5M ARR

---

## Out of Scope

### Explicitly NOT Included in Initial Release

**1. Advanced Analytics & Reporting**
- Business intelligence dashboards
- Custom reporting builder
- Data warehouse integration
- Predictive analytics
- Future consideration: Post-Phase 4

**2. Mobile Applications**
- Native iOS/Android apps
- Mobile-optimized UI
- Future consideration: Based on customer demand

**3. AI-Powered Features (Beyond Basic)**
- Auto-generate workflows from requirements (too complex for v1)
- Intelligent plugin recommendations
- Anomaly detection in configurations
- Future consideration: Phase 4+

**4. Real-Time Collaboration**
- Multi-user editing of same configuration
- Real-time chat/comments
- Conflict resolution for concurrent edits
- Future consideration: Year 2

**5. Advanced Workflow Features**
- Human-in-the-loop approvals
- Long-running workflows (days/weeks)
- Scheduled/cron jobs
- Complex event processing
- Future consideration: Based on customer need

**6. Billing & Monetization (Initially)**
- Paid templates
- Paid plugins
- Usage-based pricing tiers
- Revenue sharing with partners
- Future consideration: Phase 5 (Year 2)

**7. Other Insurance Domains (Phase 1)**
- Policy domain (Phase 4)
- Billing domain (Year 2)
- Claims domain (Year 2)
- Document domain (Year 2)
- Underwriting domain (Future)

**8. Advanced Integration Patterns**
- Event-driven architecture (complex events)
- CQRS/Event Sourcing
- GraphQL APIs
- gRPC protocols
- Future consideration: Based on technical need

---

## Assumptions & Dependencies

### Assumptions

**1. Customer Environment Assumptions**
- Customers have cloud infrastructure (AWS, Azure, or GCP)
- Customers can provide API access to source/target systems
- Customers have technical staff to configure platform
- Customers willing to adopt configuration-first approach

**2. Integration Assumptions**
- Source systems (Guidewire, Duck Creek) have stable APIs
- Target systems (Earnix, Ratabase) have documented APIs
- API credentials can be securely stored and managed
- Network connectivity between platform and external systems

**3. Data Assumptions**
- Quote/policy data is in JSON or XML format
- Data schemas are relatively stable
- Standard insurance fields are common across carriers
- Custom fields can be accommodated through field catalog

**4. Market Assumptions**
- Demand exists for faster integration solutions
- Customers willing to pay for platform (SaaS model)
- Partners willing to contribute templates/plugins
- Community adoption will grow over time

### Dependencies

**1. Technical Dependencies**
- **Database:** PostgreSQL 14+ (for JSONB support)
- **Runtime:** Node.js 18+ (for NestJS)
- **Cloud Provider:** AWS (S3, SQS, Secrets Manager)
- **Message Queue:** Kafka or RabbitMQ (for event plugins)
- **Authentication:** OAuth 2.0 / JWT (for API security)

**2. External API Dependencies**
- **Guidewire APIs:** Stable and documented
- **Earnix APIs:** Access and documentation available
- **Ratabase APIs:** Access and documentation available
- **D&B API:** Partnership and API access
- **Experian API:** Partnership and API access

**3. Partner Dependencies**
- **System Integrators:** For customer implementations
- **Insurance Consultants:** For template creation
- **Plugin Developers:** For ecosystem growth
- **Insurance Carriers:** For validation and feedback

**4. Internal Dependencies**
- **Development Team:** 5-7 engineers (full-stack, backend, frontend)
- **Product Team:** Product Manager + Designer
- **DevOps:** Cloud infrastructure and CI/CD
- **Support:** Customer success and technical support
- **Legal:** Contracts, terms of service, privacy policy

### Risks & Mitigation

**Risk 1: Template Adoption Low**
- **Mitigation:**
  - Partner with consultants to create templates
  - Provide incentives for template creation
  - Showcase template value through case studies

**Risk 2: Custom Code Overuse (defeats purpose)**
- **Mitigation:**
  - Make configuration tools powerful enough
  - Provide excellent plugin library
  - Charge premium for custom development

**Risk 3: Performance Issues at Scale**
- **Mitigation:**
  - Performance testing early and often
  - Caching strategies
  - Horizontal scaling architecture
  - Load balancing

**Risk 4: Security Vulnerabilities**
- **Mitigation:**
  - Security audits (quarterly)
  - Penetration testing
  - Secure coding practices
  - Regular dependency updates

**Risk 5: External API Changes Break Integrations**
- **Mitigation:**
  - Version all integrations
  - Monitor API changelog
  - Automated regression testing
  - Quick response to breaking changes

---

## Appendix

### Glossary

**Terms:**

- **Domain:** Business capability area (Rating, Policy, Billing, Claims)
- **Product Line:** Insurance product type (GL, WC, Property, etc.)
- **Template:** Pre-built package of mappings, rules, and workflow
- **Plugin:** Reusable component that adds specific capability
- **Mapping:** Field transformation from source to target system
- **Rule:** Business logic condition and action
- **Workflow:** Sequence of steps in integration process
- **Tenant:** Customer organization using the platform
- **Extension Hook:** Point in workflow where custom code can be injected
- **Connector:** Plugin that integrates with external system

### References

**Insurance Industry Standards:**
- ACORD Standards for data exchange
- ISO Insurance Programs
- NAIC Guidelines

**Technical References:**
- NestJS Framework Documentation
- TypeORM Documentation
- JSONPath Specification
- OAuth 2.0 Specification

**Competitive Analysis:**
- Guidewire Integration Framework
- Duck Creek OnDemand Integration
- Mulesoft for Insurance
- Informatica for Insurance
- Boomi Integration Platform

**Similar Platform Models:**
- Salesforce AppExchange
- Shopify App Store
- WordPress Plugin Directory
- Zapier Integration Marketplace
- AWS Marketplace

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | 2026-02-04 | Product Team | Initial draft |
| 0.5 | 2026-02-05 | Product Team | Added user journeys, marketplace details |
| 1.0 | 2026-02-05 | Product Team | Final approval for development |

---

## Approvals

**Product Owner:** ___________________________ Date: ___________

**Engineering Lead:** ___________________________ Date: ___________

**Customer Success:** ___________________________ Date: ___________

---

*END OF DOCUMENT*
