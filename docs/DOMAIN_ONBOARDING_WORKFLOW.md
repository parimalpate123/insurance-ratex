# Domain Onboarding Workflow
## From Scratch to Production

**Version:** 1.0
**Date:** February 5, 2026
**Purpose:** End-to-end workflow for onboarding a new insurance domain

---

## Table of Contents

1. [Overview](#overview)
2. [Stakeholders & Roles](#stakeholders--roles)
3. [Phase 1: Discovery & Planning](#phase-1-discovery--planning)
4. [Phase 2: Environment Setup](#phase-2-environment-setup)
5. [Phase 3: Configuration](#phase-3-configuration)
6. [Phase 4: Testing](#phase-4-testing)
7. [Phase 5: User Acceptance Testing (UAT)](#phase-5-user-acceptance-testing-uat)
8. [Phase 6: Production Deployment](#phase-6-production-deployment)
9. [Phase 7: Post-Production Support](#phase-7-post-production-support)
10. [Timeline Summary](#timeline-summary)
11. [Checklist](#checklist)

---

## Overview

This document describes the complete workflow for onboarding a new insurance domain (e.g., Rating, Policy, Billing) from initial discovery through production deployment.

### Workflow Stages

```
Discovery → Setup → Configuration → Testing → UAT → Production → Support
  (1 week)  (1 day)    (1-2 weeks)   (1 week) (1 week) (1 day)   (ongoing)
```

### Example Scenario

**Organization:** ABC Insurance Company
**Domain:** Rating
**Product Line:** General Liability (GL)
**Source System:** Guidewire PolicyCenter
**Target System:** Earnix Rating Engine
**Timeline:** 4-6 weeks (from kickoff to production)

---

## Stakeholders & Roles

### Customer Team

**1. Product Owner (Sarah)**
- Defines business requirements
- Prioritizes features
- Makes go/no-go decisions
- Approves production deployment

**2. Business Analyst (Michael)**
- Documents current process
- Maps data fields
- Configures mappings and rules
- Writes test scenarios

**3. Integration Developer (Lisa)**
- Provides API credentials
- Assists with custom requirements
- Develops custom plugins if needed
- Supports deployment

**4. QA Analyst (John)**
- Creates test plan
- Executes test cases
- Documents defects
- Signs off on UAT

**5. Business Users (3-5 people)**
- Provide subject matter expertise
- Validate business logic
- Participate in UAT
- Provide production feedback

### InsurRateX Team

**6. Implementation Consultant (Jennifer)**
- Leads onboarding process
- Guides configuration
- Trains customer team
- Troubleshoots issues

**7. Solution Architect (David)**
- Reviews requirements
- Recommends templates and plugins
- Designs custom solutions if needed
- Technical escalation point

**8. Support Engineer (Robert)**
- Post-production support
- Monitors system health
- Resolves incidents

---

## Phase 1: Discovery & Planning

**Duration:** 1 week
**Owner:** Implementation Consultant + Product Owner

### Objectives

1. Understand current state and requirements
2. Identify source and target systems
3. Select appropriate templates and plugins
4. Define success criteria
5. Create project plan

### Activities

#### Day 1-2: Discovery Sessions

**Session 1: Business Requirements (2 hours)**
- Review current rating process
- Understand business rules and calculations
- Identify stakeholders and decision makers
- Define scope (what's in/out)

**Deliverables:**
- Business requirements document
- Process flow diagram
- List of business rules

**Session 2: Technical Discovery (2 hours)**
- Review source system (Guidewire) setup
  - Version and edition
  - Data model and field names
  - API access and credentials
- Review target system (Earnix) setup
  - API version
  - Authentication method
  - Expected data format
- Discuss integration points
  - Sync vs. async
  - Batch vs. real-time
  - Volume and performance requirements

**Deliverables:**
- Technical architecture diagram
- API documentation links
- Access credentials (stored securely)

**Session 3: Data Mapping Workshop (3 hours)**
- Map source fields to target fields
- Identify transformations needed
- Discuss data enrichment needs (D&B, credit check, etc.)
- Review field catalog for standard fields

**Deliverables:**
- Field mapping spreadsheet (50-100 fields)
- Transformation requirements
- Data enrichment requirements

#### Day 3-4: Template & Plugin Selection

**Activity: Browse Marketplace**
1. Search marketplace for relevant templates
2. Find: "GL - Guidewire PolicyCenter to Earnix Rating v2.0"
3. Preview template:
   - 47 pre-configured mappings
   - 23 rating rules
   - Standard workflow (6 steps)
   - Dependencies: Earnix connector plugin
4. Compare with requirements (90% match)

**Activity: Identify Required Plugins**
- ✓ Earnix Connector (included in template)
- ✓ D&B Business Enrichment (marketplace plugin)
- ✓ PDF Worksheet Generator (marketplace plugin)
- ✓ AWS S3 Storage (marketplace plugin)
- ✓ Email Notifier (marketplace plugin)
- ? Custom Underwriting API (need custom plugin)

**Deliverables:**
- Selected template: GL - Guidewire to Earnix v2.0
- Plugin list (5 marketplace + 1 custom)
- Gap analysis (10% customization needed)

#### Day 5: Project Planning

**Activity: Create Project Plan**
- Define milestones and timeline
- Assign responsibilities
- Set up communication plan (weekly status calls)
- Define success criteria:
  - 95% accuracy on test cases
  - <5 second response time
  - Zero critical defects in UAT

**Activity: Environment Setup Planning**
- Request environments:
  - Development (for configuration)
  - Staging (for testing)
  - Production (for go-live)
- Define data strategy:
  - Use anonymized production data for testing
  - 100 sample quotes for test suite

**Deliverables:**
- Project plan with timeline
- Success criteria document
- Environment requirements
- Communication plan

### Phase 1 Outputs

✅ Business requirements documented
✅ Technical architecture defined
✅ Template and plugins selected
✅ Project plan created
✅ Stakeholders aligned

---

## Phase 2: Environment Setup

**Duration:** 1 day
**Owner:** Solution Architect + Integration Developer

### Objectives

1. Provision InsurRateX environments
2. Configure API access to source/target systems
3. Install selected template and plugins
4. Grant user access

### Activities

#### Morning: Provision Environments

**Activity: Create Tenant Account (1 hour)**
1. InsurRateX admin creates tenant for ABC Insurance
2. Configure tenant settings:
   - Tenant name: ABC Insurance
   - Admin email: sarah@abcinsurance.com
   - Environment: Multi-environment (dev, staging, prod)
3. Set resource quotas:
   - Max product lines: 20
   - Max custom plugins: 50
   - API rate limit: 5000 req/min
4. Enable features:
   - Marketplace access
   - Plugin SDK
   - Advanced workflow builder

**Activity: Create Environments (30 min)**
1. Create Development environment
2. Create Staging environment
3. Create Production environment (locked initially)

**Activity: Set Up Users (30 min)**
1. Add users to tenant:
   - Sarah (Product Owner) - Admin role
   - Michael (BA) - Editor role
   - Lisa (Developer) - Developer role
   - John (QA) - Viewer role
2. Send invitation emails
3. Users complete account setup

#### Afternoon: Install Template & Plugins

**Activity: Install Template (30 min)**
1. Michael logs into Development environment
2. Navigate to Marketplace → Templates
3. Search for "GL - Guidewire to Earnix"
4. Click "Install Template"
5. Installation wizard:
   - Product line name: "GL - Commercial"
   - Environment: Development
   - Source system: Guidewire PolicyCenter
   - Target system: Earnix Rating
6. Template installed successfully
   - 47 mappings created
   - 23 rules created
   - Workflow created (6 steps)
   - Field catalog imported

**Activity: Install Plugins (1 hour)**
1. Navigate to Marketplace → Plugins
2. Install required plugins:
   - D&B Business Enrichment v2.0
   - PDF Worksheet Generator v1.5
   - AWS S3 Storage v2.0
   - Email Notifier v1.2
3. Configure each plugin:

**D&B Plugin Configuration:**
- API Key: [stored in secrets manager]
- API Endpoint: https://api.dnb.com/v1
- Timeout: 10 seconds
- Cache TTL: 24 hours

**PDF Generator Configuration:**
- Template: gl-rating-worksheet.html
- Output format: PDF/A
- S3 bucket: abc-rating-worksheets

**S3 Storage Configuration:**
- Bucket name: abc-rating-transactions
- Region: us-east-1
- Retention: 7 years

**Email Notifier Configuration:**
- SMTP server: smtp.abcinsurance.com
- From address: rating@abcinsurance.com
- Template: rating-complete-notification

**Activity: Configure API Access (1 hour)**
1. Add Guidewire API credentials:
   - API URL: https://gw.abcinsurance.com/pc/api/v1
   - Username: [stored securely]
   - Password: [stored securely]
   - Authentication: OAuth 2.0

2. Add Earnix API credentials:
   - API URL: https://earnix.abcinsurance.com/rating/api
   - API Key: [stored securely]
   - Project ID: ABC_GL

3. Test connectivity:
   - Test Guidewire connection ✓
   - Test Earnix connection ✓
   - Test D&B connection ✓

### Phase 2 Outputs

✅ InsurRateX environments provisioned
✅ User accounts created and configured
✅ Template installed with 47 mappings + 23 rules
✅ 5 plugins installed and configured
✅ API connectivity tested and verified

---

## Phase 3: Configuration

**Duration:** 1-2 weeks
**Owner:** Business Analyst + Integration Developer

### Objectives

1. Customize mappings for ABC's specific fields
2. Configure rating rules per ABC's requirements
3. Build workflow with plugins
4. Develop custom plugin if needed
5. Create test scenarios

### Week 1: Mapping & Rules Configuration

#### Day 1-2: Customize Field Mappings

**Activity: Review Installed Mappings**
1. Michael opens Mapping Editor
2. Reviews 47 pre-configured mappings
3. Compares with ABC's Guidewire field names
4. Identifies differences (15 mappings need updates)

**Activity: Update Mappings**
1. Update source field paths (Guidewire field names differ):
   - Change: `Quote.GeneralLiabilityLine.PolicyPremium`
   - To: `Quote.GL_Line.TotalPremium`
   - (Repeat for 14 more fields)

2. Add 5 new mappings (ABC-specific fields):
   - `Quote.GL_Line.IndustrySegment` → `Rating.IndustryCode`
   - `Quote.GL_Line.YearsInBusiness` → `Rating.BusinessAge`
   - `Quote.GL_Line.PriorCarrier` → `Rating.PriorInsurer`
   - `Quote.GL_Line.ClaimsLast3Years` → `Rating.LossHistory`
   - `Quote.GL_Line.SICCode` → `Rating.IndustryClass`

3. Configure data types from field catalog:
   - Use data type: `money` for premium fields
   - Use data type: `policy_number` for policy numbers
   - Use data type: `integer` for years

4. Add sample values for testing:
   - Sample input: `"$1,000,000"`
   - Sample output: `1000000.00`

**Activity: Test Mappings**
1. Create sample Guidewire quote JSON (from ABC's system)
2. Test transformation:
   - Input: ABC Guidewire quote
   - Output: Earnix rating request format
3. Verify all fields mapped correctly ✓
4. Save mapping configuration

#### Day 3-4: Configure Rating Rules

**Activity: Review Installed Rules**
1. Review 23 pre-configured rules
2. Compare with ABC's rating manual
3. Identify changes needed (8 rules need updates, 5 new rules)

**Activity: Update Existing Rules**

**Rule 1: Base Premium Calculation**
- Template rule: `Premium = CoverageLimit × BaseRate`
- ABC's rule: `Premium = CoverageLimit × BaseRate × TerritoryFactor`
- Update: Add territory factor lookup

**Rule 2: Experience Modifier**
- Template rule: `IF ClaimsCount > 3 THEN Modifier = 1.25`
- ABC's rule: `IF ClaimsCount > 2 THEN Modifier = 1.35`
- Update: Change threshold from 3 to 2, modifier from 1.25 to 1.35

**Rule 3: State Surcharge**
- Template rule: (California only)
- ABC's rule: (California, New York, Florida)
- Update: Add NY and FL to condition

**Activity: Add New Rules (ABC-Specific)**

**New Rule 1: Industry Segment Discount**
```
IF IndustrySegment = "Healthcare" AND YearsInBusiness > 10
THEN Discount = 15%
```

**New Rule 2: Prior Carrier Credit**
```
IF PriorCarrier IN ["xyz", "abc", "pqr"]
THEN Credit = 5%
```

**New Rule 3: Claims-Free Discount**
```
IF ClaimsLast3Years = 0 AND YearsInBusiness > 5
THEN Discount = 10%
```

**New Rule 4: Large Deductible Credit**
```
IF Deductible >= $25,000
THEN Credit = 12%
```

**New Rule 5: Policy Limit Surcharge**
```
IF CoverageLimit > $5,000,000
THEN Surcharge = 8%
```

**Activity: Configure Rule Order**
1. Set rule execution sequence:
   - Base premium calculation (first)
   - Territory factor
   - Experience modifier
   - Industry discounts
   - Prior carrier credit
   - Claims-free discount
   - Deductible credit
   - Limit surcharge
   - Final premium calculation (last)

**Activity: Test Rules**
1. Create 10 test scenarios:
   - Scenario 1: Standard risk, no discounts
   - Scenario 2: Healthcare with 15 years, claims-free
   - Scenario 3: High limit with large deductible
   - Scenario 4: Multiple claims, CA state
   - ... (6 more scenarios)
2. Execute rules for each scenario
3. Verify premium calculations match ABC's manual calculations
4. All tests pass ✓

#### Day 5: Build Workflow

**Activity: Design Workflow**
1. Open Workflow Builder
2. Review template workflow (6 steps)
3. Customize for ABC's requirements

**Standard Template Workflow:**
```
1. Validate Input
2. Execute Mappings
3. Execute Rules
4. Call Earnix API
5. Return Response
```

**ABC's Custom Workflow:**
```
1. Validate Input
2. [Plugin] D&B Business Enrichment
3. Execute Mappings (Guidewire → Earnix format)
4. [Plugin] Custom Underwriting API Check
5. Execute Rating Rules
6. [Plugin] Call Earnix API
7. [Plugin] Generate PDF Worksheet
8. [Plugin] Store Transaction to S3
9. [Plugin] Send Email Notification
10. Return Response
```

**Activity: Configure Workflow Steps**
1. Drag components onto workflow canvas
2. Connect steps with arrows
3. Configure each step:

**Step 2: D&B Enrichment**
- Input: Tax ID from quote
- Output: Credit score, years in business, industry type
- Error handling: Continue if D&B unavailable (log warning)

**Step 4: Custom Underwriting Check**
- Custom plugin (to be developed)
- Input: Quote data + D&B data
- Output: Approved/Declined/Refer
- Error handling: Fail workflow if declined

**Step 6: Call Earnix API**
- Input: Transformed data from mappings
- Output: Earnix premium calculation
- Timeout: 30 seconds
- Retry: 3 attempts with exponential backoff

**Step 7: Generate PDF**
- Template: gl-rating-worksheet
- Include: All rating factors, discounts, final premium
- Store in S3: abc-rating-worksheets/[quote-number].pdf

**Step 8: Store to S3**
- Bucket: abc-rating-transactions
- File format: JSON
- Filename: [quote-number]-[timestamp].json
- Metadata: Product line, user, timestamp

**Step 9: Email Notification**
- To: Underwriter email from quote
- Subject: "GL Rating Complete - [Quote Number]"
- Body: Premium amount, PDF link
- Attachments: PDF worksheet

### Week 2: Custom Plugin Development

**Activity: Develop Custom Underwriting Plugin** (if needed)
1. Lisa (Integration Developer) uses Plugin SDK
2. Generate plugin scaffold:
   ```bash
   insurratex-plugin create abc-underwriting-connector
   ```
3. Implement plugin logic:
   - Call ABC's underwriting API
   - Parse response (Approved/Declined/Refer)
   - Add underwriting result to context
4. Write unit tests (10 test cases)
5. Deploy to Development environment
6. Add to workflow (Step 4)
7. Test integration ✓

**Activity: Create Test Scenarios**
1. John (QA) creates comprehensive test plan
2. Define 50 test scenarios:
   - 20 happy path (should approve and rate)
   - 15 edge cases (high limits, multiple claims)
   - 10 error cases (invalid data, API failures)
   - 5 performance tests (large volumes)
3. Prepare test data for each scenario
4. Document expected results

### Phase 3 Outputs

✅ 52 mappings configured (47 from template + 5 new)
✅ 28 rules configured (23 from template + 5 new)
✅ Custom workflow with 10 steps
✅ Custom underwriting plugin developed and deployed
✅ 50 test scenarios documented and ready

---

## Phase 4: Testing

**Duration:** 1 week
**Owner:** QA Analyst + Business Analyst

### Objectives

1. Execute all test scenarios
2. Validate mappings, rules, and workflow
3. Identify and fix defects
4. Achieve 95%+ accuracy

### Day 1-2: Unit Testing

**Activity: Test Mappings**
1. John executes mapping tests:
   - Input: 20 sample Guidewire quotes
   - Verify output format matches Earnix expectations
   - Check all 52 fields mapped correctly
2. Results:
   - 48 mappings ✓ correct
   - 4 mappings ✗ incorrect (data type issues)
3. Michael fixes 4 mapping issues
4. Retest: All 52 mappings ✓

**Activity: Test Rules**
1. Execute rule tests with 20 scenarios
2. Compare calculated premiums with manual calculations
3. Results:
   - 18 scenarios ✓ correct
   - 2 scenarios ✗ incorrect (rule order issue)
4. Michael reorders rules
5. Retest: All 20 scenarios ✓

**Activity: Test Individual Plugins**
1. Test D&B enrichment:
   - Input 10 tax IDs
   - Verify credit scores returned
   - All tests ✓
2. Test custom underwriting plugin:
   - 15 test cases (approved, declined, referred)
   - All tests ✓
3. Test PDF generation:
   - Generate 5 sample worksheets
   - Verify formatting and content
   - All tests ✓

### Day 3-4: Integration Testing

**Activity: End-to-End Workflow Tests**
1. Execute complete workflow for 30 scenarios:
   - Input: Guidewire quote JSON
   - Expected: Premium calculated, PDF generated, S3 stored, email sent

**Test Execution:**

**Scenario 1: Standard GL Quote**
- Input: $1M limit, no claims, 5 years in business
- Steps executed:
  - ✓ Validation passed
  - ✓ D&B enrichment (credit score: 75)
  - ✓ Mappings executed
  - ✓ Underwriting check: Approved
  - ✓ Rules executed (base + territory factor)
  - ✓ Earnix API called
  - ✓ Premium: $2,450
  - ✓ PDF generated
  - ✓ S3 storage successful
  - ✓ Email sent
- Result: ✓ PASS

**Scenario 2: Healthcare with Discounts**
- Input: Healthcare industry, 15 years, no claims, $25K deductible
- Expected premium: $3,200 (after 15% industry + 10% claims-free + 12% deductible credits)
- Calculated premium: $3,195 (rounding difference)
- Result: ✓ PASS (within tolerance)

**Scenario 5: Underwriting Declined**
- Input: High-risk industry, 5 claims in 3 years
- Steps executed:
  - ✓ Validation passed
  - ✓ D&B enrichment
  - ✓ Mappings executed
  - ✓ Underwriting check: **Declined**
  - ✗ Workflow stopped (expected)
- Result: ✓ PASS (correctly declined)

**Test Results Summary:**
- 30 test scenarios executed
- 28 passed ✓
- 2 failed ✗

**Defects Found:**
1. **Defect #1:** Email plugin timeout for large PDFs (>5MB)
   - Severity: Medium
   - Fix: Increase timeout from 10s to 30s
   - Status: Fixed

2. **Defect #2:** S3 storage fails if filename contains special characters
   - Severity: Low
   - Fix: Sanitize filenames
   - Status: Fixed

**Retest:**
- 2 failed scenarios retested
- Both now pass ✓
- **Final result: 30/30 passed (100%)**

### Day 5: Performance & Error Testing

**Activity: Performance Testing**
1. Load test with 100 concurrent quotes
2. Measure response time:
   - Average: 3.2 seconds
   - 95th percentile: 4.8 seconds
   - Max: 6.1 seconds
3. Target: <5 seconds for 95th percentile ✓
4. Result: Performance acceptable

**Activity: Error Handling Tests**
1. Test API failures:
   - Guidewire API unavailable → Error handled ✓
   - Earnix API timeout → Retry logic works ✓
   - D&B API down → Warning logged, workflow continues ✓
2. Test invalid data:
   - Missing required fields → Validation error ✓
   - Invalid data types → Error message ✓
3. All error scenarios handled correctly ✓

### Phase 4 Outputs

✅ 50 test scenarios executed
✅ 100% pass rate achieved
✅ 2 defects found and fixed
✅ Performance meets requirements (<5s)
✅ Error handling validated
✅ Ready for UAT

---

## Phase 5: User Acceptance Testing (UAT)

**Duration:** 1 week
**Owner:** Business Users + QA Analyst

### Objectives

1. Business users validate system meets requirements
2. Test real-world scenarios
3. Get sign-off for production deployment

### Day 1: UAT Preparation

**Activity: Deploy to Staging Environment**
1. Lisa deploys configuration from Dev to Staging
2. Use export/import functionality:
   - Export GL - Commercial config from Dev
   - Import to Staging environment
3. Update API credentials for Staging:
   - Guidewire Staging API
   - Earnix Staging API
   - D&B Production API (test mode)

**Activity: UAT Kickoff Meeting**
1. Review UAT objectives and timeline
2. Assign scenarios to business users:
   - User 1: Standard risks (10 scenarios)
   - User 2: Complex risks (10 scenarios)
   - User 3: Edge cases (10 scenarios)
3. Provide UAT guidelines and issue logging process

### Day 2-4: UAT Execution

**Activity: Business User Testing**

**User 1: Standard Risks (Sarah - Product Owner)**
- Tests 10 standard GL quotes
- Verifies premiums match manual calculations
- Results:
  - 9 scenarios: Premiums match ✓
  - 1 scenario: Premium $50 higher than expected
  - Issue logged: UAT-001

**User 2: Complex Risks (Rating Analyst)**
- Tests 10 complex scenarios:
  - High limits ($10M+)
  - Multiple locations
  - Claims history
  - Special endorsements
- Results:
  - 8 scenarios: Correct ✓
  - 2 scenarios: Issues found
  - Issues logged: UAT-002, UAT-003

**User 3: Edge Cases (Underwriter)**
- Tests 10 edge cases:
  - Minimum premium scenarios
  - Maximum limit scenarios
  - Unusual industry codes
  - Foreign exposures
- Results:
  - 7 scenarios: Correct ✓
  - 3 scenarios: Issues found
  - Issues logged: UAT-004, UAT-005, UAT-006

**Issues Summary:**
- UAT-001: Territory factor for Zone 5 incorrect
- UAT-002: Industry discount not applying for SIC code 8742
- UAT-003: Minimum premium logic missing
- UAT-004: Foreign exposure surcharge missing
- UAT-005: Email notification not sent for declined quotes
- UAT-006: PDF worksheet missing premium breakdown section

### Day 4-5: Issue Resolution

**Activity: Fix Issues**
1. Michael reviews and fixes issues:
   - UAT-001: Update territory lookup table (Zone 5: 1.15 → 1.25)
   - UAT-002: Add SIC code 8742 to industry discount rule
   - UAT-003: Add rule: IF Premium < MinimumPremium THEN Premium = MinimumPremium
   - UAT-004: Add foreign exposure surcharge rule (20%)
   - UAT-005: Update email plugin to send for declined quotes
   - UAT-006: Update PDF template to include premium breakdown

**Activity: Regression Testing**
1. John retests all 50 original test scenarios
2. All tests still pass ✓ (no regression)

**Activity: Retest UAT Issues**
1. Business users retest 6 failed scenarios
2. All now pass ✓

**Activity: Final UAT Sign-Off**
1. UAT completion meeting
2. Review results:
   - 30 scenarios tested
   - 6 issues found and fixed
   - All retests passed
   - 100% pass rate
3. **Sarah (Product Owner) approves for production** ✓

### Phase 5 Outputs

✅ 30 UAT scenarios executed
✅ 6 issues found and resolved
✅ No open critical or high severity defects
✅ Product Owner sign-off received
✅ Ready for production deployment

---

## Phase 6: Production Deployment

**Duration:** 1 day
**Owner:** Integration Developer + Implementation Consultant

### Objectives

1. Deploy configuration to Production
2. Validate production environment
3. Execute smoke tests
4. Go-live

### Morning: Pre-Deployment Checklist

**Activity: Final Verification**
- ✓ All UAT issues resolved and retested
- ✓ Product Owner approval received
- ✓ Deployment plan reviewed and approved
- ✓ Rollback plan documented
- ✓ Production credentials ready
- ✓ Communication plan in place (notify users)
- ✓ Support team on standby

**Activity: Backup Staging Environment**
1. Export complete Staging configuration
2. Save as backup: `GL-Commercial-Staging-v1.0.zip`
3. Store in version control

### Midday: Production Deployment

**Activity: Deploy to Production** (1 hour)
1. Lisa exports configuration from Staging
2. Logs into Production environment
3. Imports configuration:
   - 52 mappings
   - 28 rules
   - Workflow (10 steps)
   - 5 plugins
4. Updates production API credentials:
   - Guidewire Production API
   - Earnix Production API
   - D&B Production API (full access)
   - Production S3 bucket
   - Production email SMTP

**Activity: Configure Production Settings**
1. Set rate limits: 1000 req/min
2. Enable monitoring and alerts
3. Configure logging (verbose for first week)
4. Set up production support notifications

### Afternoon: Smoke Testing

**Activity: Execute Smoke Tests** (1 hour)
1. Test 5 critical scenarios in Production:
   - Scenario 1: Standard GL quote → Premium calculated ✓
   - Scenario 2: High limit quote → Approved and rated ✓
   - Scenario 3: Healthcare with discounts → Correct premium ✓
   - Scenario 4: High-risk → Declined correctly ✓
   - Scenario 5: Complex with claims → Correct calculations ✓
2. Verify all integrations working:
   - Guidewire API: ✓ Connected
   - Earnix API: ✓ Connected
   - D&B API: ✓ Connected
   - S3 Storage: ✓ Files stored
   - Email: ✓ Notifications sent
3. **All smoke tests pass ✓**

**Activity: Production Validation**
1. Check monitoring dashboards:
   - API response times: <2 seconds ✓
   - Error rate: 0% ✓
   - CPU/Memory: Normal ✓
2. Review logs for any warnings: None found ✓

### End of Day: Go-Live

**Activity: Production Cutover**
1. 2:00 PM: Production environment LIVE ✓
2. 2:15 PM: Notify business users via email
3. 2:30 PM: First production quote submitted
4. 2:32 PM: First production rating completed successfully ✓
5. 3:00 PM: Go-live meeting with stakeholders
   - Review first 10 production transactions
   - All successful ✓
   - **Sarah declares go-live successful** ✓

**Activity: Communication**
1. Send go-live announcement to all users
2. Update documentation with production details
3. Schedule post-go-live review meeting (1 week out)

### Phase 6 Outputs

✅ Configuration deployed to production
✅ Smoke tests passed (5/5)
✅ Production environment validated
✅ Go-live successful
✅ Users notified and onboarded

---

## Phase 7: Post-Production Support

**Duration:** Ongoing (first 2 weeks critical)
**Owner:** Support Engineer + Implementation Consultant

### Week 1: Hyper-Care Period

**Activity: Monitor Production** (Daily)
1. Review dashboards every 2 hours:
   - Transaction volume
   - Response times
   - Error rates
   - API health
2. Daily summary report to Product Owner

**Activity: Respond to Issues**

**Day 2: Issue Reported**
- Issue: Premium calculation slightly different than legacy system for 3 quotes
- Severity: Low
- Investigation: Rounding difference (legacy rounds to nearest $10, new system to nearest $1)
- Resolution: Document as expected behavior (new system more precise)
- Status: Closed

**Day 3: Issue Reported**
- Issue: PDF worksheet takes 15 seconds to generate for very large quotes
- Severity: Medium
- Investigation: Template inefficiency with large data sets
- Resolution: Optimize PDF template
- Deployed hotfix to production
- Status: Resolved

**Activity: User Support**
1. Provide daily office hours (2 hours/day) for questions
2. Answer 15 user questions during Week 1:
   - How to view transaction history (5 questions)
   - How to download PDFs (3 questions)
   - How to rerun a quote (4 questions)
   - Technical questions (3 questions)
3. Create FAQ document based on common questions

**Activity: Performance Tuning**
1. Analyze production usage patterns
2. Optimize:
   - Cache D&B lookups (reduce API calls by 40%)
   - Increase connection pool size
   - Pre-warm Earnix connections
3. Response time improved from 3.2s to 2.1s average

### Week 2: Stabilization

**Activity: Monitor & Optimize**
1. Production metrics (Week 2):
   - Transactions: 450 quotes rated
   - Success rate: 99.1% (4 failures due to external API timeouts)
   - Average response time: 2.1 seconds
   - Peak response time: 5.3 seconds (acceptable)
   - User satisfaction: 4.5/5 (survey)

**Activity: Post-Go-Live Review Meeting**
1. Review with stakeholders
2. Successes:
   - ✓ Zero critical defects
   - ✓ 99.1% success rate
   - ✓ Response time better than expected
   - ✓ Users adopting quickly
3. Areas for improvement:
   - User training on advanced features
   - More comprehensive user documentation
   - Dashboard for business users to monitor own quotes
4. Action items for future enhancements

**Activity: Knowledge Transfer**
1. Train ABC's support team (2-hour session)
2. Document common issues and resolutions
3. Hand off to standard support (exit hyper-care mode)

### Ongoing Support

**Activity: Monthly Reviews**
1. Review metrics monthly:
   - Transaction volume trends
   - Performance trends
   - Error trends
   - Feature requests
2. Plan enhancements quarterly

**Activity: Continuous Improvement**
1. Collect user feedback
2. Identify optimization opportunities
3. Plan next product line (Workers Comp) using lessons learned

---

## Timeline Summary

### Fast-Track Timeline (4 Weeks)

Using marketplace template with minimal customization:

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Discovery & Planning | 1 week | Requirements, template selection |
| Environment Setup | 1 day | Provision, install template |
| Configuration | 1 week | Customize mappings, rules, workflow |
| Testing | 1 week | QA testing, fix defects |
| UAT | 1 week | Business validation, sign-off |
| Production Deploy | 1 day | Deploy and go-live |
| **TOTAL** | **4 weeks** | **From kickoff to production** |

### Standard Timeline (6 Weeks)

With custom plugin development and complex requirements:

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Discovery & Planning | 1 week | Requirements, template selection |
| Environment Setup | 1 day | Provision, install template |
| Configuration | 2 weeks | Customize + develop custom plugin |
| Testing | 1 week | QA testing, fix defects |
| UAT | 1 week | Business validation, sign-off |
| Production Deploy | 1 day | Deploy and go-live |
| **TOTAL** | **6 weeks** | **From kickoff to production** |

### Complex Timeline (10-12 Weeks)

Building from scratch or heavy customization:

| Phase | Duration | Key Activities |
|-------|----------|----------------|
| Discovery & Planning | 2 weeks | Detailed requirements gathering |
| Environment Setup | 1 day | Provision environments |
| Configuration | 4 weeks | Build all mappings, rules, workflow from scratch |
| Testing | 2 weeks | Comprehensive QA testing |
| UAT | 2 weeks | Business validation, multiple rounds |
| Production Deploy | 1 day | Deploy and go-live |
| **TOTAL** | **10-12 weeks** | **From kickoff to production** |

### Comparison to Traditional Approach

| Approach | Timeline | Team Size | Cost |
|----------|----------|-----------|------|
| **Traditional Custom Development** | 6-12 months | 7 people | $500K+ |
| **InsurRateX - From Scratch** | 10-12 weeks | 2-3 people | $100K |
| **InsurRateX - With Template** | 4-6 weeks | 1-2 people | $50K |

**Time Savings:** 75-90% faster
**Cost Savings:** 80-90% lower cost

---

## Checklist

### Discovery Phase Checklist

- [ ] Business requirements documented
- [ ] Current process mapped
- [ ] Source system details gathered (API, credentials)
- [ ] Target system details gathered (API, credentials)
- [ ] Data mapping spreadsheet completed
- [ ] Template selected from marketplace
- [ ] Plugins identified (marketplace + custom)
- [ ] Gap analysis completed
- [ ] Project plan created
- [ ] Success criteria defined
- [ ] Stakeholders aligned

### Setup Phase Checklist

- [ ] Tenant account created
- [ ] Environments provisioned (Dev, Staging, Prod)
- [ ] User accounts created
- [ ] Roles and permissions assigned
- [ ] Template installed
- [ ] Plugins installed
- [ ] API credentials configured
- [ ] Connectivity tests passed

### Configuration Phase Checklist

- [ ] Mappings reviewed and customized
- [ ] New mappings added (if needed)
- [ ] Mapping tests passed
- [ ] Rules reviewed and customized
- [ ] New rules added (if needed)
- [ ] Rule tests passed
- [ ] Workflow designed
- [ ] Plugins configured in workflow
- [ ] Custom plugin developed (if needed)
- [ ] Test scenarios documented

### Testing Phase Checklist

- [ ] Mapping unit tests passed
- [ ] Rule unit tests passed
- [ ] Plugin tests passed
- [ ] Integration tests passed
- [ ] Performance tests passed
- [ ] Error handling tests passed
- [ ] All defects resolved
- [ ] Test summary report created

### UAT Phase Checklist

- [ ] Configuration deployed to Staging
- [ ] UAT kickoff meeting completed
- [ ] Test scenarios assigned to business users
- [ ] UAT execution completed
- [ ] UAT issues logged and resolved
- [ ] Regression testing completed
- [ ] Product Owner sign-off received

### Production Deployment Checklist

- [ ] Pre-deployment checklist completed
- [ ] Staging configuration backed up
- [ ] Production API credentials ready
- [ ] Rollback plan documented
- [ ] Support team on standby
- [ ] Configuration deployed to Production
- [ ] Production settings configured
- [ ] Smoke tests passed
- [ ] Production validation completed
- [ ] Go-live communication sent
- [ ] Users notified

### Post-Production Checklist

- [ ] Monitoring dashboards configured
- [ ] Daily monitoring in place (Week 1)
- [ ] User support office hours scheduled
- [ ] User questions answered and documented
- [ ] FAQ created
- [ ] Performance tuning completed
- [ ] Post-go-live review meeting completed
- [ ] Knowledge transfer to support team
- [ ] Monthly review process established

---

## Appendix: Example Documents

### A. Sample Field Mapping Spreadsheet

| Source System | Source Field Path | Target System | Target Field | Data Type | Transformation | Sample Input | Sample Output |
|--------------|------------------|---------------|--------------|-----------|----------------|--------------|---------------|
| Guidewire | Quote.PolicyNumber | Earnix | Policy.Number | policy_number | Direct | "POL-2024-001" | "POL-2024-001" |
| Guidewire | Quote.GL_Line.TotalPremium | Earnix | Rating.Premium | money | Direct | "$12,500.00" | 12500.00 |
| Guidewire | Quote.Insured.Name | Earnix | Insured.BusinessName | string | Direct | "ABC Corp" | "ABC Corp" |
| Guidewire | Quote.Insured.StateProv | Earnix | Insured.State | string | Lookup | "California" | "CA" |

### B. Sample Test Scenario

**Test Scenario ID:** TS-001
**Scenario Name:** Standard GL Quote - Healthcare Industry
**Category:** Happy Path
**Priority:** High

**Input Data:**
- Industry: Healthcare (SIC 8742)
- Coverage Limit: $1,000,000
- Deductible: $5,000
- Years in Business: 12
- Claims Last 3 Years: 0
- State: California
- Territory: Zone 3

**Expected Results:**
- Base Premium: $1,800
- Territory Factor (Zone 3): 1.10 → $1,980
- Industry Discount (Healthcare, 12 years): 15% → $1,683
- Claims-Free Discount (0 claims, 12 years): 10% → $1,515
- **Final Premium: $1,515**
- Underwriting Decision: Approved
- PDF Generated: Yes
- S3 Storage: Yes
- Email Sent: Yes

**Actual Results:**
- Final Premium: $1,515 ✓
- All steps completed successfully ✓
- **Status: PASS**

### C. Sample Issue Log

| Issue ID | Description | Severity | Reported By | Date | Status | Resolution |
|----------|-------------|----------|-------------|------|--------|------------|
| UAT-001 | Territory factor incorrect for Zone 5 | Medium | Sarah | 2026-01-15 | Resolved | Updated lookup table |
| UAT-002 | Industry discount not applying for SIC 8742 | High | Rating Analyst | 2026-01-15 | Resolved | Added SIC to rule |
| UAT-003 | Minimum premium logic missing | High | Sarah | 2026-01-16 | Resolved | Added new rule |
| PROD-001 | PDF generation slow for large quotes | Medium | User | 2026-01-22 | Resolved | Optimized template |

---

*END OF DOCUMENT*
