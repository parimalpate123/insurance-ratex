# InsurRateX — Transformation & Pipeline Framework Design
## Enterprise Insurance Integration Platform

**Version:** 2.0
**Status:** Design / Pre-Implementation
**Date:** 2026-02-12

---

## 1. Executive Summary

InsurRateX is a **configuration-driven insurance integration platform** that sits between source systems (Guidewire, Duck Creek, ServiceNow, Applied Epic) and rating engines (Earnix, CGI Ratabase, ISO e-Rating, Majesco, custom engines). It transforms, validates, enriches, and routes data between these systems without requiring code changes for each new integration.

**Key capabilities:**
- Any source system can connect to any rating engine
- A single organization can use multiple rating engines simultaneously — routed by product line, transaction type, state, or any other criteria
- Each product line can have a completely different process, step sequence, and target engine
- Multiple organizations (tenants) are fully isolated from each other
- Business users design their own pipelines via Admin UI — no developer needed for new integrations
- Plug-and-play step library — developers add new capabilities once, all users benefit

**The platform is NOT a rating engine.** It does not calculate premiums. It orchestrates the flow between systems that do.

---

## 2. Platform Concepts

### 2.1 Organization (Tenant)

An **Organization** is a single insurance company or business unit using the platform. Each organization has:
- Complete data isolation from all other organizations
- Its own set of pipelines, mappings, rules, tables, and credentials
- Its own system connections
- Its own product lines

Multiple organizations can use the same source systems (e.g., both use Guidewire) or the same target engines (e.g., both use Earnix) — but their configurations, pipelines, and data never touch.

### 2.2 Product Line

A **Product Line** is a line of insurance business (GL, WC, CA, BOP, IM, PL, etc.). Within a single organization:
- Each product line can route to a different rating engine
- Each product line has its own field mappings, rules, and rate tables
- The same product line can route to different engines based on transaction type or state

### 2.3 Pipeline

A **Pipeline** is the complete, executable definition of how data flows from a source system to a target system and back for a specific combination of product line, transaction type, and source system.

A pipeline owns:
- An ordered sequence of inbound steps (request direction)
- An ordered sequence of outbound steps (response direction)
- References to its source system and target system
- Its own versioning and activation state

**Pipeline is identified by:**
```
Organization + Product Line + Source System + Transaction Type (+ optional: State/Channel)
```

### 2.4 Pipeline Router

The **Pipeline Router** is the entry point for all inbound requests. Before executing any pipeline, the router evaluates configurable routing rules to determine which pipeline should handle the request. Routing rules are defined by the user in the Admin UI.

### 2.5 Step

A **Step** is a single unit of work in a pipeline. Steps are pluggable — users pick from a Step Library and configure them. Each step:
- Receives a context object from the previous step
- Performs its operation (transform, validate, enrich, connect, etc.)
- Passes the updated context to the next step

### 2.6 Context Object

The **Context** is the internal carrier that flows through every step in a pipeline. It always uses JSON internally regardless of external formats.

```
Context {
  request:      {}    // original inbound request — immutable, always preserved
  working:      {}    // current data being transformed — mutated by each step
  response:     {}    // response from target system — populated after connector step
  metadata: {
    org:              // organization identifier
    productLine:      // product line code
    transactionType:  // NewBusiness | Renewal | Endorsement | Cancellation
    pipelineId:       // which pipeline is executing
    correlationId:    // unique ID for this execution (tracing)
    sourceSystem:     // which source system sent the request
    targetSystem:     // which target system will receive it
  }
  errors:       []    // validation errors and warnings
  auditTrail:   []    // per-step log: what changed, timing, values before/after
}
```

### 2.7 Canonical Format

Internally, InsurRateX **always works in JSON**. Format adapters (XML, CSV, SOAP, ACORD) convert at the boundary only — the very first step deserializes the inbound format to JSON, and a late step serializes back to the target system's format. Every step in between works on JSON.

This means:
- Adding XML support requires one new adapter — not changes to any other step
- All transformations, rules, and enrichments work the same regardless of external format
- The audit trail is always readable JSON

---

## 3. Multi-Engine, Multi-Product Architecture

### 3.1 Single Organization, Multiple Rating Engines

A single organization routinely uses different rating engines for different products. The platform supports this natively through the Pipeline Router.

```
ABC Insurance Company
│
├── Source: Guidewire PolicyCenter
│   │
│   ├── GL  (New Business)  ──────► Earnix              (REST/JSON)
│   ├── GL  (Renewal)       ──────► Earnix              (REST/JSON, different steps)
│   ├── WC  (All)           ──────► CGI Ratabase        (HTTP/XML)
│   ├── CA  (All)           ──────► In-house engine     (REST/JSON)
│   ├── BOP (All, non-CA)   ──────► ISO e-Rating        (SOAP/XML)
│   ├── BOP (CA only)       ──────► ISO e-Rating CA     (SOAP/XML, CA-specific rules)
│   └── IM  (All)           ──────► Majesco Rating      (REST/JSON)
│
└── Source: Applied Epic (Agent portal)
    │
    ├── GL  (All)           ──────► Earnix              (different field mapping from GW)
    └── WC  (All)           ──────► CGI Ratabase        (different field mapping from GW)
```

### 3.2 Why the Same Product Can Have Different Pipelines

Even for the same product + engine combination, the process differs by transaction type:

**GL → Earnix, New Business:**
```
validate → map fields → enrich territory → apply rules → rate → respond
```

**GL → Earnix, Renewal:**
```
validate → map fields → load prior policy → enrich territory → apply renewal credits → apply rules → rate → respond
```

**GL → Earnix, Endorsement:**
```
validate → map fields → load existing policy → calculate midterm difference → rate delta → respond
```

Same product, same engine — completely different step sequence, different rules, different enrichment logic.

### 3.3 Multi-Organization (Multi-Tenant)

Different insurance companies use the same platform with complete isolation:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        InsurRateX Platform                           │
│                                                                      │
│  ┌───────────────────┐   ┌───────────────────┐   ┌───────────────┐  │
│  │  Org A            │   │  Org B            │   │  Org C        │  │
│  │  ABC Insurance    │   │  XYZ Mutual       │   │  DEF Group    │  │
│  │                   │   │                   │   │               │  │
│  │  GW → Earnix      │   │  DC → Majesco     │   │  SN → Custom  │  │
│  │  GW → Ratabase    │   │  DC → Ratabase    │   │               │  │
│  │  AE → Earnix      │   │                   │   │               │  │
│  └───────────────────┘   └───────────────────┘   └───────────────┘  │
│                                                                      │
│  Shared Infrastructure (code, not data):                             │
│  Step Library | System Catalog | Pipeline Templates                  │
└─────────────────────────────────────────────────────────────────────┘
```

Data never crosses organization boundaries. Credentials, pipelines, mappings, rules, and tables are all org-scoped.

---

## 4. Pipeline Router

### 4.1 How Routing Works

Every inbound request arrives at the platform's entry endpoint. Before any pipeline executes, the Router extracts routing metadata from the request and evaluates the organization's routing rules to find the matching pipeline.

```
Inbound Request
      │
      ▼
┌──────────────────────────────────────────────────┐
│  Step 1: Identify Organization                    │
│  (from API key, subdomain, or header)            │
└──────────────────────────┬───────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────┐
│  Step 2: Extract Routing Metadata                 │
│  Read from request:                              │
│  - productLine  (GL, WC, CA...)                  │
│  - transactionType (NewBusiness, Renewal...)     │
│  - sourceSystem (Guidewire, AppliedEpic...)      │
│  - state / jurisdiction (optional)               │
│  - channel (Direct, Agent, API)  (optional)      │
└──────────────────────────┬───────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────┐
│  Step 3: Evaluate Routing Rules                   │
│  Top-down, first match wins                      │
│  Returns: Pipeline ID to execute                 │
└──────────────────────────┬───────────────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
         GL/Earnix    WC/Ratabase   BOP/ISO
         Pipeline     Pipeline      Pipeline
```

### 4.2 Routing Rule Configuration

Routing rules are configured per organization in the Admin UI. They are evaluated top-down — first match wins. More specific rules are placed above more general rules.

**Example routing table for ABC Insurance:**

| Priority | Product | Source | Transaction | State | Channel | → Pipeline |
|----------|---------|--------|-------------|-------|---------|------------|
| 1 | BOP | Guidewire | * | CA | * | GW-BOP-ISOeRating-CA-v2 |
| 2 | BOP | Guidewire | * | * | * | GW-BOP-ISOeRating-v2 |
| 3 | GL | Guidewire | Renewal | * | * | GW-GL-Earnix-Renewal-v3 |
| 4 | GL | Guidewire | Endorsement | * | * | GW-GL-Earnix-Endorsement-v1 |
| 5 | GL | Guidewire | * | * | * | GW-GL-Earnix-NewBiz-v3 |
| 6 | WC | Guidewire | * | * | * | GW-WC-Ratabase-v2 |
| 7 | GL | AppliedEpic | * | * | * | AE-GL-Earnix-v1 |
| 8 | WC | AppliedEpic | * | * | * | AE-WC-Ratabase-v1 |

**Wildcard (*) means "match any value."**
A request for GL / Guidewire / Renewal hits rule 3.
A request for BOP / Guidewire / NewBusiness / CA hits rule 1 (not rule 2).
An unmatched request returns a structured "no pipeline configured" error.

### 4.3 Routing Metadata Extraction

The metadata fields the router reads can come from:
- The request body (e.g., `$.productCode`, `$.transactionType`)
- A request header (e.g., `X-Product-Line: GL`)
- The API endpoint path (e.g., `/inbound/gl/new-business`)

Where to read each field is configured per source system in the System Catalog. For example, Guidewire might send `policyTransaction.lineOfBusiness` while Duck Creek sends `submission.lineCode`. The router normalizes these to the platform's canonical routing fields.

---

## 5. Step Library

Steps are grouped into categories. Each step type is registered in the Step Registry by developers and appears in the Admin UI pipeline builder for all users.

### 5.1 Format Adapters

Handle conversion between external formats and the platform's internal JSON.

| Step Type | Direction | Description |
|-----------|-----------|-------------|
| `json-deserializer` | In | Parse inbound JSON string → context.working |
| `json-serializer` | Out | Serialize context.working → JSON string |
| `xml-deserializer` | In | Parse XML → context.working (JSON), handles namespaces |
| `xml-serializer` | Out | Serialize context.working → XML per a configured schema |
| `soap-deserializer` | In | Unwrap SOAP envelope, parse body XML → context.working |
| `soap-serializer` | Out | Wrap context.working in SOAP envelope |
| `csv-deserializer` | In | Parse CSV rows → context.working array |
| `acord-deserializer` | In | Parse ACORD XML (insurance standard) → context.working |
| `acord-serializer` | Out | Serialize context.working → ACORD XML |
| `flat-file-deserializer` | In | Parse fixed-width flat files (legacy mainframe) |

### 5.2 Transformation Steps

Reshape and compute data within context.working.

| Step Type | Description |
|-----------|-------------|
| `field-mapper` | Apply a saved Mapping — move/rename fields, apply per-field transformations |
| `expression-transformer` | Evaluate named expressions: arithmetic, conditionals, string ops, lookups |
| `template-builder` | Build a new JSON structure from a Handlebars-style template |
| `static-enricher` | Set fixed/constant values into context.working |
| `field-filter` | Include or exclude specific fields (whitelist/blacklist) |
| `array-transformer` | Map/filter/flatten array fields |
| `type-coercer` | Force type conversions (string → number, date format changes) |

### 5.3 Validation Steps

Verify data quality and business eligibility before routing to rating engine.

| Step Type | Description |
|-----------|-------------|
| `schema-validator` | Validate context.working against a JSON Schema — fail fast with field-level errors |
| `rule-engine` | Apply a saved Rule Set — surcharges, discounts, eligibility flags, rejections |
| `eligibility-checker` | Check product-specific eligibility criteria (appetite, state filing, class codes) |
| `required-field-checker` | Verify required fields exist and are non-empty per product config |

### 5.4 Enrichment Steps

Add data to context.working from the platform's reference data.

| Step Type | Description |
|-----------|-------------|
| `lookup-enricher` | Look up a value from a Lookup Table, add to context.working |
| `decision-table-enricher` | Evaluate a Decision Table matrix, add result to context.working |
| `factor-chain` | Apply an ordered sequence of lookup factors and accumulate a product |
| `prior-policy-loader` | Load prior policy data for renewal/endorsement transactions |
| `external-enricher` | Call an external enrichment API (e.g., address validation, credit score) |

### 5.5 Connector Steps

Call external systems and receive responses.

| Step Type | Description |
|-----------|-------------|
| `http-connector` | POST/GET to a REST endpoint, put response in context.response |
| `soap-connector` | Call a SOAP web service endpoint |
| `mock-connector` | Return a configured mock response (for dev/test — no real HTTP call) |
| `file-connector` | Write/read from S3 (for batch scenarios) |

### 5.6 Response Steps

Process the target system's response and build the final reply to the source system.

| Step Type | Description |
|-----------|-------------|
| `response-mapper` | Map target system response fields → source system response format |
| `response-builder` | Build the final response envelope using a template |
| `error-handler` | Normalize target system errors into a standard error response |
| `audit-logger` | Write execution details to the audit log (always runs, even on failure) |

---

## 6. Integration Scenarios

---

### Scenario 1: Guidewire → InsurRateX → Earnix (JSON to JSON)

**Profile:** Org uses Guidewire PolicyCenter. GL product routes to Earnix. Both systems speak JSON. No format conversion needed.

#### Inbound Pipeline (Request)

```
Guidewire sends JSON:
{
  "policyTransaction": {
    "lineOfBusiness": "GL",
    "transactionType": "NewBusiness",
    "insured": { "name": "ABC Corp", "state": "CA", "annualRevenue": 6000000 },
    "classification": { "isoCode": "91580" },
    "coverages": [{ "type": "OccurrenceLimit", "amount": 1000000 }]
  }
}

Step 1: json-deserializer
  → Parses into context.working

Step 2: schema-validator
  config: gl-newbiz-inbound-schema
  → Validates required fields, data types, value ranges
  → Fails with field-level errors if invalid

Step 3: field-mapper
  config: mapping "GW-to-Earnix-GL"
  → policyTransaction.insured.state           → submission.riskState
  → policyTransaction.insured.annualRevenue   → submission.exposure
  → policyTransaction.classification.isoCode  → submission.classificationCode
  → policyTransaction.coverages[0].amount     → submission.occurrenceLimit

Step 4: expression-transformer
  config: expressions "GL-derived-fields"
  → submission.exposureUnits = submission.exposure / 1000
  → submission.limitTier = if(submission.occurrenceLimit >= 1000000, "standard", "basic")

Step 5: lookup-enricher
  config: table "gl-territory-factors", key: submission.riskState
  → submission.territoryFactor = 1.15  (for CA)

Step 6: decision-table-enricher
  config: table "gl-base-rates", inputs: [classificationCode, limitTier]
  → submission.baseRatePer1000 = 1.42

Step 7: rule-engine
  config: rule set "GL-NewBiz-Rules-v3"
  → if state == 'CA' and businessType == 'construction' → apply 12% surcharge flag
  → if annualRevenue > 5M → add schedule mod flag

Step 8: http-connector
  config: system "Earnix", endpoint "/rate/gl"
  → POST context.working as JSON to Earnix
  → Earnix responds with premium breakdown
  → Response stored in context.response
```

#### Outbound Pipeline (Response)

```
Earnix returns JSON:
{
  "premium": { "total": 8742.00, "base": 7600.00, "taxes": 1142.00 },
  "factors": [...],
  "referenceId": "ERN-2026-001"
}

Step 1: response-mapper
  config: mapping "Earnix-to-GW-GL-Response"
  → premium.total       → policyTransaction.quotedPremium
  → premium.base        → policyTransaction.basePremium
  → referenceId         → policyTransaction.ratingReferenceId

Step 2: response-builder
  config: template "GW-QuoteResponse-Envelope"
  → Wraps mapped fields in Guidewire's expected response structure
  → Adds timestamp, correlationId, status: "Quoted"

Step 3: json-serializer
  → Serialize to JSON string

Guidewire receives:
{
  "status": "Quoted",
  "policyTransaction": {
    "quotedPremium": 8742.00,
    "basePremium": 7600.00,
    "ratingReferenceId": "ERN-2026-001",
    ...
  }
}
```

---

### Scenario 2: Guidewire → InsurRateX → CGI Ratabase (JSON to XML)

**Profile:** Same org, WC product routes to CGI Ratabase. Ratabase requires XML. InsurRateX handles the JSON↔XML conversion transparently — Guidewire only ever sees JSON.

#### Inbound Pipeline (Request)

```
Guidewire sends JSON (same format as always):
{
  "policyTransaction": {
    "lineOfBusiness": "WC",
    "insured": { "name": "ABC Corp", "state": "TX", "annualPayroll": 2400000 },
    "classifications": [{ "code": "5403", "payroll": 1200000 }]
  }
}

Step 1: json-deserializer
  → Parse into context.working

Step 2: schema-validator
  config: wc-inbound-schema

Step 3: field-mapper
  config: mapping "GW-to-Ratabase-WC"
  → policyTransaction.insured.state              → RatingInput.StateCode
  → policyTransaction.insured.annualPayroll      → RatingInput.TotalPayroll
  → policyTransaction.classifications[0].code    → RatingInput.ClassificationCode
  → policyTransaction.classifications[0].payroll → RatingInput.ClassPayroll

Step 4: rule-engine
  config: rule set "WC-Eligibility-Rules"
  → Verify state has WC filing
  → Check class code is in appetite

Step 5: xml-serializer     ← FORMAT CONVERSION HAPPENS HERE
  config: schema "Ratabase-WC-XML-v4"
  namespace: "http://cgi.com/ratabase/wc/v4"
  → Serializes context.working to XML:
    <GLRatingRequest xmlns="http://cgi.com/ratabase/wc/v4">
      <RatingInput>
        <StateCode>TX</StateCode>
        <TotalPayroll>2400000</TotalPayroll>
        <ClassificationCode>5403</ClassificationCode>
        <ClassPayroll>1200000</ClassPayroll>
      </RatingInput>
    </GLRatingRequest>

Step 6: http-connector
  config: system "CGI-Ratabase", contentType: application/xml
  → POST XML to Ratabase
  → Ratabase returns XML response
  → XML response stored in context.response (as raw XML string)
```

#### Outbound Pipeline (Response)

```
Ratabase returns XML:
<RatingResponse>
  <Premium>
    <Standard>4820.00</Standard>
    <Modified>4338.00</Modified>
  </Premium>
  <ExperienceMod>0.90</ExperienceMod>
</RatingResponse>

Step 1: xml-deserializer     ← FORMAT CONVERSION HAPPENS HERE
  config: schema "Ratabase-WC-Response-Fields"
  → Parses XML → JSON in context.working:
    { "premium": { "standard": 4820.00, "modified": 4338.00 }, "experienceMod": 0.90 }

Step 2: response-mapper
  config: mapping "Ratabase-to-GW-WC-Response"
  → premium.modified    → policyTransaction.quotedPremium
  → experienceMod       → policyTransaction.experienceMod

Step 3: response-builder
  config: template "GW-QuoteResponse-Envelope"

Step 4: json-serializer
  → Serialize to JSON

Guidewire receives JSON — never knew XML was involved.
```

---

### Scenario 3: Applied Epic → InsurRateX → Earnix (Same Engine, Different Mapping)

**Profile:** Same org, same GL product, same Earnix engine — but request comes from Applied Epic (agent portal) instead of Guidewire. Field names are completely different.

```
Inbound Pipeline differs only in:
  - Step 1: json-deserializer (same)
  - Step 2: schema-validator — uses "AE-GL-schema" (different required fields)
  - Step 3: field-mapper — uses "AE-to-Earnix-GL" mapping (different source paths)
             Applied sends: account.address.stateCode   (not policyTransaction.insured.state)
             Applied sends: account.revenue.annual      (not policyTransaction.insured.annualRevenue)
  - Steps 4-8: identical to Scenario 1 from here on

Outbound Pipeline:
  - Step 1: response-mapper — uses "Earnix-to-AE-GL-Response" (different target paths)
  - Steps 2-3: same

The rating engine (Earnix) receives the exact same payload in both scenarios.
Only the mapping steps differ between Guidewire and Applied Epic.
```

---

### Scenario 4: Duck Creek → InsurRateX → ISO e-Rating (SOAP/XML)

**Profile:** Different org entirely (XYZ Mutual). Uses Duck Creek. BOP routes to ISO e-Rating which requires SOAP/XML.

```
Inbound Pipeline:
  Step 1: json-deserializer     ← Duck Creek sends JSON
  Step 2: schema-validator      config: bop-inbound-schema
  Step 3: field-mapper          config: "DC-to-ISO-BOP"
  Step 4: lookup-enricher       config: iso-territory-table
  Step 5: rule-engine           config: bop-rules-v2
  Step 6: soap-serializer       ← Wraps in SOAP envelope with ISO namespace
  Step 7: http-connector        config: ISO-eRating-SOAP endpoint

Outbound Pipeline:
  Step 1: soap-deserializer     ← Unwraps SOAP response
  Step 2: xml-deserializer      ← Parses XML body → JSON
  Step 3: response-mapper       config: "ISO-to-DC-BOP-Response"
  Step 4: response-builder      config: "DC-QuoteResponse-Envelope"
  Step 5: json-serializer       ← Duck Creek gets JSON back
```

---

## 7. Expression Transformer Design

The `expression-transformer` step handles computed fields that cannot be expressed as simple field-to-field mappings.

### Expression Types

**Arithmetic:**
```
submission.exposureUnits   = submission.annualRevenue / 1000
rating.adjustedPremium     = rating.basePremium * rating.territoryFactor * rating.classFactor
rating.annualizedPremium   = rating.proRataPremium * (365 / policy.termDays)
```

**Conditional:**
```
risk.tier          = if(submission.annualRevenue > 5000000, "large", "small")
rating.schedMod    = if(risk.claimCount > 3, 1.15, if(risk.claimCount > 1, 1.05, 1.0))
submission.eligible = if(insured.state in ["AK","HI"], false, true)
```

**String Operations:**
```
insured.stateCode  = toUpperCase(insured.state)
insured.fullName   = concat(insured.firstName, " ", insured.lastName)
policy.description = trim(policy.rawDescription)
```

**Date Operations:**
```
policy.termDays    = dateDiff(policy.effectiveDate, policy.expirationDate, "days")
policy.term        = dateFormat(policy.effectiveDate, "YYYY-MM-DD")
```

**Reference Data (inline lookup):**
```
rating.territoryFactor  = lookup("gl-territory-factors", risk.state)
rating.baseRate         = decisionTable("gl-base-rates", { class: risk.classCode, limit: coverage.limit })
```

### Design Principles

- **No eval() or arbitrary code execution** — the expression language is a defined DSL
- **Safe** — cannot access filesystem, network, or system resources
- **Auditable** — every expression result is logged in the audit trail with input values and output
- **Testable** — expressions can be tested in isolation in the Admin UI expression editor
- **Versioned** — expression sets are versioned alongside the pipeline

---

## 8. Format Adapter Design

### XML Serializer Configuration

Users configure XML serialization through a visual schema mapper in the Admin UI — not by writing XML schemas manually.

The configuration defines:
- Root element name and XML namespace
- How each JSON field maps to an XML element or attribute
- Data type handling (decimal precision, date formats)
- Null/empty field handling (omit element, empty element, or xsi:nil)
- Array field handling (repeating elements or wrapper elements)
- Element ordering (some systems require strict ordering)

### XML Deserializer Configuration

Defines:
- Which XML elements map to which JSON fields
- Type coercions (XML is always string, convert to number/boolean/date)
- Namespace stripping
- Array detection (repeating elements → JSON array)
- Error element paths (where to find error codes/messages in the response)

### SOAP Support

SOAP is handled as a wrapper around XML:
- `soap-serializer` wraps the serialized XML in a SOAP envelope with the correct headers
- `soap-deserializer` strips the SOAP envelope and passes the body to `xml-deserializer`
- SOAP action header is configurable per connector

### ACORD Support

ACORD (Association for Cooperative Operations Research and Development) is the insurance industry's standard XML format. The platform includes a pre-built ACORD adapter that understands ACORD field semantics — users map their internal fields to ACORD logical names, not raw XML paths.

---

## 9. System Catalog

The System Catalog is a platform-level asset — maintained by InsurRateX developers, available to all organizations. It contains pre-built configurations for common insurance systems.

### Source Systems

| System | Format | Auth | Notes |
|--------|--------|------|-------|
| Guidewire PolicyCenter | JSON | OAuth 2.0 | Common field schema pre-mapped |
| Guidewire ClaimCenter | JSON | OAuth 2.0 | Claims-specific schema |
| Duck Creek Policy | JSON | API Key | Field path conventions pre-configured |
| Applied Epic | JSON | OAuth 2.0 | Agent portal format |
| ServiceNow | JSON | OAuth 2.0 | ITSM-based insurance workflows |
| Majesco Policy | JSON | API Key | |
| Custom / Generic | JSON or XML | Configurable | User defines all fields |

### Target Systems (Rating Engines)

| System | Format | Protocol | Notes |
|--------|--------|----------|-------|
| Earnix | JSON | REST | Pre-built field schema |
| CGI Ratabase | XML | HTTP | XML schema v3 and v4 pre-configured |
| ISO e-Rating | XML | SOAP | ACORD-based request format |
| Majesco Rating | JSON | REST | |
| Guidewire Rating | JSON | REST | When GW is both source and target |
| Custom / Mock | JSON or XML | REST or Mock | For dev/test or custom engines |

### Pipeline Templates

Common combinations are packaged as Pipeline Templates — pre-built pipelines that any organization can import and customize. This reduces a new integration from weeks to days.

| Template | Description |
|----------|-------------|
| GW-GL-Earnix | Guidewire GL → Earnix, new business |
| GW-WC-Ratabase | Guidewire WC → CGI Ratabase |
| GW-BOP-ISO | Guidewire BOP → ISO e-Rating |
| DC-GL-Earnix | Duck Creek GL → Earnix |
| Generic-JSON-JSON | Blank template, both systems JSON |
| Generic-JSON-XML | Blank template, source JSON, target XML |

---

## 10. Mock Systems

### Mock Source System (Mock RQI)

Simulates inbound requests from any source system for testing without a real integration.

Features:
- Pre-built request templates per product line (GL, WC, CA, BOP)
- Realistic field values with randomizable test data
- Named test scenarios (e.g., "CA Construction High Revenue", "NY Low Risk Renewal")
- Configurable to simulate any source system format
- Available in pipeline tester and Test Rating page

### Mock Rating Engine (Mock Target)

Simulates responses from any rating engine for testing without calling the real engine.

Features:
- Configurable response templates per target system format (JSON or XML)
- Simple mock premium calculation (can be formula-based or fixed)
- Configurable error scenarios: timeout, validation error, system unavailable, partial response
- Returns XML or JSON based on target system configuration
- Response delay simulation for performance testing

---

## 11. User Flow — Designing a New Integration

### Persona: Integration Configurator (technical business analyst or tech lead)

This flow shows how a user configures a new integration entirely through the Admin UI.

#### Step 1: Define the Integration

Navigate to: **Pipelines → New Pipeline**

User specifies:
- Pipeline name (e.g., "GW WC Ratabase Production")
- Product line (WC)
- Source system (select from catalog: Guidewire PolicyCenter)
- Target system (select from catalog: CGI Ratabase)
- Transaction type (New Business / Renewal / Endorsement / All)
- Description and notes

Platform auto-suggests a Pipeline Template if one exists for this combination.

#### Step 2: Configure Source System Connection

If using a catalog system, most fields are pre-filled:
- Source format (JSON — pre-set for Guidewire)
- Inbound endpoint path (auto-generated: `/inbound/{pipelineId}`)
- Routing metadata field paths (pre-configured for Guidewire)

User provides:
- Their specific Guidewire instance URL (for validation purposes)
- Authentication method and credentials reference

#### Step 3: Configure Target System Connection

If using a catalog system:
- Target format (XML — pre-set for Ratabase)
- Default content-type header (application/xml)

User provides:
- Their Ratabase endpoint URL
- Authentication type (Basic Auth)
- Reference to credentials in secrets vault (the platform never stores raw credentials)
- Timeout and retry settings

#### Step 4: Build Inbound Pipeline (Visual Builder)

User sees a canvas. If a template was selected, steps are pre-populated and can be modified.

Left panel: Step Library, grouped by category
Canvas: Current pipeline steps as connected boxes

Auto-populated steps (from GW→Ratabase template):
```
[json-deserializer] → [schema-validator] → [field-mapper] → [rule-engine] → [xml-serializer] → [http-connector]
```

User customizes each step by clicking it:

**schema-validator:** Select or upload a JSON Schema for WC inbound validation.

**field-mapper:** Opens the Mapping Editor inline.
- User maps Guidewire WC fields to Ratabase WC input fields
- Can use existing mapping or create new one
- AI-assisted: paste field documentation, get suggestions

**rule-engine:** Select or create a Rule Set.
- WC eligibility rules
- State-specific modifiers

**xml-serializer:** Opens the XML Schema Mapper.
- Defines how JSON fields become XML elements
- Preview: shows sample XML output based on test data

User can add additional steps by dragging from Step Library:
- `lookup-enricher` for territory factors
- `expression-transformer` for payroll-based calculations
- `eligibility-checker` for class code appetite validation

User can reorder steps by dragging.

#### Step 5: Build Outbound Pipeline (Response Direction)

Separate canvas tab. Auto-populated:
```
[xml-deserializer] → [response-mapper] → [response-builder] → [json-serializer]
```

User configures:
- **xml-deserializer:** Map Ratabase response XML elements to JSON fields
- **response-mapper:** Map Ratabase response fields to Guidewire's expected response structure
- **response-builder:** Select or create a response envelope template

#### Step 6: Configure Routing Rule

Navigate to **Routing Rules** for this organization. Add:
- Product = WC
- Source = Guidewire
- Transaction = All
- → This Pipeline

Set priority relative to existing rules.

#### Step 7: Test

Navigate to **Pipeline Tester** (or click "Test" on the pipeline).

User can:
- Select a pre-built test scenario ("WC TX Standard Payroll") or paste custom JSON
- Run in mock mode (no real external calls)
- See the full execution trace step by step:
  - Context.working before and after each step
  - Field-level diff (what was added/changed/removed)
  - The XML that would have been sent to Ratabase
  - The mock XML response from Ratabase
  - The final JSON response Guidewire would receive
- Run individual steps in isolation to debug

#### Step 8: Activate

User reviews pipeline summary:
- Steps configured: 6
- Mappings used: GW-to-Ratabase-WC
- Rules used: WC-Eligibility-v1
- Routing rule: configured
- Test status: passing

User sets effective date, activates pipeline. Previous version (if any) archived automatically.

---

## 12. Audit Trail & Compliance

Every pipeline execution produces a complete audit record:

```
Execution Record {
  executionId:      UUID
  timestamp:        ISO datetime
  org:              Organization ID
  pipelineId:       Pipeline ID + version
  correlationId:    Caller's reference ID
  productLine:      GL / WC / CA...
  transactionType:  NewBusiness / Renewal...
  durationMs:       Total execution time

  steps: [
    {
      stepType:     "field-mapper"
      stepName:     "GW-to-Earnix-GL"
      durationMs:   12
      status:       "success"
      inputSummary: { fieldCount: 18 }
      outputSummary: { fieldCount: 24, fieldsAdded: 6, fieldsChanged: 0 }
    },
    {
      stepType:     "rule-engine"
      stepName:     "GL-NewBiz-Rules-v3"
      durationMs:   8
      status:       "success"
      rulesEvaluated: 12
      rulesFired: [
        { rule: "CA-Construction-Surcharge", action: "surcharge 12%", applied: true }
      ]
    },
    ...
  ]

  requestSentToTarget:   { ... }  // what was sent to the rating engine
  responseFromTarget:    { ... }  // raw response received
  finalResponse:         { ... }  // what was returned to the source system

  errors: []
}
```

Audit records are retained per regulatory requirements (configurable per org, default 7 years). They support:
- Debugging failed rating transactions
- Regulatory audits of rating decisions
- Rate change impact analysis
- SLA monitoring

---

## 13. Database Schema (Conceptual)

### New Tables Required

| Table | Purpose |
|-------|---------|
| `organizations` | Tenant registry |
| `pipelines` | Pipeline definitions (steps as JSONB) |
| `pipeline_versions` | Full version snapshots per pipeline |
| `pipeline_executions` | Execution audit log (per run) |
| `routing_rules` | Configurable routing rules per org |
| `system_catalog` | Pre-configured source/target system definitions |
| `expressions` | Named expression sets per pipeline |
| `xml_schemas` | XML field mapping configurations |
| `test_scenarios` | Saved test cases per pipeline |
| `secrets_references` | Pointers to external secret vault entries (no raw values) |

### Existing Tables — No Changes Required

These tables are referenced by steps as-is:
- `mappings` + `field_mappings` — used by `field-mapper` step
- `conditional_rules` + `rule_conditions` + `rule_actions` — used by `rule-engine` step
- `lookup_tables` + `lookup_entries` — used by `lookup-enricher` step
- `decision_tables` + `decision_table_rows` — used by `decision-table-enricher` step
- `ai_prompts` — used by AI-assisted configuration features
- `uploaded_files` — used by `knowledge-base` for document storage

---

## 14. Admin UI Pages

### New Pages Required

| Page | Description |
|------|-------------|
| Pipelines | List all pipelines with status, version, last executed |
| Pipeline Builder | Visual drag-and-drop canvas — inbound + outbound step design |
| Pipeline Tester | Step-by-step execution trace with mock systems |
| Routing Rules | Configure routing rule table per organization |
| System Catalog | Browse source/target system connectors |
| Expression Editor | Write, test, and manage transformation expressions |
| Audit Log | Search and browse execution records |
| Secrets | Manage references to external credential vault |

### Existing Pages (Referenced by Pipelines)

| Page | Role in Pipeline |
|------|-----------------|
| Mappings | Field-mapper step selects a mapping from here |
| Rules | Rule-engine step selects a rule set from here |
| Decision Tables | Decision-table-enricher step references these |
| Lookup Tables | Lookup-enricher step references these |
| Knowledge Base | Documents inform AI-assisted mapping/rule creation |
| AI Prompts | AI assistance for mapping and rule generation |

---

## 15. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Internal format | Always JSON | All steps work uniformly, XML/SOAP isolated to adapters |
| Expression language | Custom safe DSL | No arbitrary code execution, auditable, no security risk |
| Step extensibility | Registry + interface | Add new steps without changing pipeline engine |
| XML/SOAP handling | Adapter at boundary only | Core engine stays format-agnostic |
| Routing | Configurable rules table | No code change to route new product/engine combinations |
| Pipeline granularity | Per product + transaction type | Each flow independently versionable and testable |
| Multi-tenancy | Org-scoped all resources | Full data isolation |
| Credentials | Reference only | Raw secrets never stored in app DB |
| Versioning | Full pipeline snapshot | Complete rollback capability |
| Audit trail | Per-step, per-execution | Regulatory compliance and debugging |
| Mock systems | Built-in, configurable | Full pipeline testable without external system access |

---

## 16. What InsurRateX Is NOT

- **Not a rating engine.** Premium calculation is done by Earnix, Ratabase, ISO, or whatever engine the org connects. InsurRateX orchestrates the call.
- **Not a policy system.** It does not store policies, quotes, or claims. That is the source system's job.
- **Not a general-purpose ESB.** It is scoped to the insurance rating integration workflow.
- **Not a direct database integration.** All connections are API-based (REST, SOAP, HTTP).

---

## 17. Implementation Roadmap

| Phase | Focus | Key Deliverables |
|-------|-------|-----------------|
| Phase 1 | Transformation Engine | Expression evaluator, field mapper runtime, enrichment steps |
| Phase 2 | Pipeline Engine | Step runner, context passing, pipeline execution from config |
| Phase 3 | Mock Systems | Mock RQI, Mock Rating Engine, Pipeline Tester UI |
| Phase 4 | XML/SOAP Adapters | xml-serializer, xml-deserializer, soap wrappers |
| Phase 5 | Pipeline Builder UI | Visual canvas, step library, routing rule editor |
| Phase 6 | Multi-tenancy | Org isolation, tenant management, secrets references |
| Phase 7 | System Catalog | Pre-built Guidewire, Earnix, Ratabase, ISO connectors |
| Phase 8 | Audit & Compliance | Execution logging, audit log UI, retention policies |
| Phase 9 | RAG Enrichment | Bedrock KB integration, document-informed AI assistance |

---

*Document prepared for InsurRateX architecture review.*
*Implementation details, code design, and API specifications to follow after framework approval.*
