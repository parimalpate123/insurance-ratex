# Unified Admin UI - Mappings & Rules Integration Plan

**Date**: 2026-02-06
**Goal**: Integrate Mappings and Rules management into the new Admin UI (port 5173)
**Status**: Planning Phase

---

## 📋 Executive Summary

**Current State:**
- ✅ New Admin UI running on port 5173 (Product Lines, Testing, Settings)
- ✅ Old Mapping UI running on port 8080
- ✅ Old Rules UI running on port 8081
- ✅ Backend APIs and database tables already exist
- ✅ MappingsService and RulesService implemented

**Objective:**
Build unified Mappings and Rules pages in the new Admin UI to eliminate need for separate UIs (ports 8080, 8081) and provide single administrative interface.

**Benefits:**
- Single UI for all admin tasks
- Consistent user experience
- Product line context awareness
- Easier onboarding
- Reduced maintenance (one UI instead of three)

---

## 🎯 What We'll Build

### **1. Mappings Page** (`/mappings`)

**Purpose**: Manage field mappings for data transformation between systems

**Features:**
- List all mappings filtered by current product line
- Create new mapping sets
- Edit existing mappings
- Add/remove field-level mappings
- Configure transformations (uppercase, lowercase, trim, number, etc.)
- Set required fields and default values
- Activate/deactivate mappings
- Delete mappings

**UI Sections:**
```
┌─────────────────────────────────────────────────────┐
│ Mappings for GL_EXISTING                           │
├─────────────────────────────────────────────────────┤
│ [+ New Mapping]                    [Search: ____]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ Guidewire to Earnix          [Active ✓]     │   │
│ │ guidewire → earnix                          │   │
│ │ 12 field mappings          [Edit] [Delete]  │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ CDM to Earnix                [Draft]        │   │
│ │ cdm → earnix                                │   │
│ │ 8 field mappings           [Edit] [Delete]  │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Mapping Editor:**
```
┌─────────────────────────────────────────────────────┐
│ Edit Mapping: Guidewire to Earnix                  │
├─────────────────────────────────────────────────────┤
│ Name:     [Guidewire to Earnix               ]     │
│ Source:   [guidewire ▼]                            │
│ Target:   [earnix ▼]                               │
│ Status:   [active ▼]                               │
├─────────────────────────────────────────────────────┤
│ Field Mappings:                    [+ Add Field]   │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Source Path: policy.insured.businessName      │ │
│ │ Target Path: insured_name                     │ │
│ │ Transform:   [UPPERCASE ▼]                    │ │
│ │ Required:    [✓]  Default: [____]            │ │
│ │                              [Remove]         │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Source Path: policy.insured.annualRevenue     │ │
│ │ Target Path: annual_revenue                   │ │
│ │ Transform:   [NUMBER ▼]                       │ │
│ │ Required:    [✓]  Default: [0]               │ │
│ │                              [Remove]         │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel]                              [Save]       │
└─────────────────────────────────────────────────────┘
```

---

### **2. Decision Tables Page** (`/decision-tables`)

**Purpose**: Define multiple related rules in a tabular format

**Features:**
- List all decision tables filtered by product line
- Create new decision table
- Edit existing table
- Add/remove columns (inputs and outputs)
- Add/remove rows (rule scenarios)
- Edit cell values
- Validate completeness (all combinations covered)
- Detect conflicts (same inputs, different outputs)
- Activate/deactivate tables
- Delete tables

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Decision Tables for GL_EXISTING                    │
├─────────────────────────────────────────────────────┤
│ [+ New Decision Table]             [Search: ____]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ Territory Rating Factors  [Active ✓]        │   │
│ │ 2 input columns, 1 output column            │   │
│ │ 12 rows • Complete ✓                        │   │
│ │                          [Edit] [Delete]     │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ Deductible Credits       [Active ✓]         │   │
│ │ 1 input column, 1 output column             │   │
│ │ 5 rows • Complete ✓                         │   │
│ │                          [Edit] [Delete]     │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Table Editor:**
```
┌─────────────────────────────────────────────────────┐
│ Edit Decision Table: Territory Rating Factors      │
├─────────────────────────────────────────────────────┤
│ Name:   [Territory Rating Factors            ]     │
│ Status: [active ▼]                                 │
├─────────────────────────────────────────────────────┤
│ Columns:                                           │
│                                                     │
│ Input Columns:                    [+ Add Input]    │
│ • State (text)                    [Remove]         │
│ • Building Type (text)            [Remove]         │
│                                                     │
│ Output Columns:                   [+ Add Output]   │
│ • Territory Factor (number)       [Remove]         │
├─────────────────────────────────────────────────────┤
│ Table Data:                       [+ Add Row]      │
│                                                     │
│ ┌────────┬──────────────┬──────────────────┐      │
│ │ State  │ Building Type│ Territory Factor │ [×]  │
│ ├────────┼──────────────┼──────────────────┤      │
│ │ CA     │ Frame        │ 1.2              │ [×]  │
│ │ CA     │ Masonry      │ 1.0              │ [×]  │
│ │ CA     │ Steel        │ 0.9              │ [×]  │
│ │ NY     │ Frame        │ 1.5              │ [×]  │
│ │ ...                                      │      │
│ └────────┴──────────────┴──────────────────┘      │
│                                                     │
│ ✓ Completeness: 12/12 combinations covered        │
│ ✓ No conflicts detected                            │
│                                                     │
│ [Import CSV] [Export CSV] [Validate] [Save]       │
└─────────────────────────────────────────────────────┘
```

---

### **3. Lookup Tables Page** (`/lookup-tables`)

**Purpose**: Store and manage reference data for use in rules

**Features:**
- List all lookup tables
- Create new lookup table
- Edit existing table
- Add/remove columns
- Add/remove rows
- Import from CSV
- Export to CSV
- Reference in rules and mappings
- Version control

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Lookup Tables for GL_EXISTING                      │
├─────────────────────────────────────────────────────┤
│ [+ New Lookup Table]               [Search: ____]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ NAICS Code Descriptions      [Active ✓]     │   │
│ │ 3 columns, 487 rows                         │   │
│ │ Last updated: 2024-02-01                    │   │
│ │                          [Edit] [Delete]     │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ ZIP to Territory Mapping     [Active ✓]     │   │
│ │ 2 columns, 1,247 rows                       │   │
│ │ Last updated: 2024-01-15                    │   │
│ │                          [Edit] [Delete]     │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

---

### **4. Knowledge Base Page** (`/knowledge-base`)

**Purpose**: Upload and manage documents for AI learning and context

**Features:**
- Upload documents (PDF, DOCX, XLSX, CSV, TXT)
- Organize by category and tags
- Search documents
- View document details
- AI processing status
- Usage analytics (how many AI suggestions used this doc)
- Enable/disable documents for AI
- Delete documents
- Reprocess documents

**UI Layout:**
```
┌─────────────────────────────────────────────────────┐
│ Knowledge Base                                      │
├─────────────────────────────────────────────────────┤
│ 📊 Overview                                         │
│ ┌──────────┬──────────┬──────────┬──────────┐     │
│ │ 47 Docs  │ 2.3 GB   │ 156 Tags │ Active   │     │
│ └──────────┴──────────┴──────────┴──────────┘     │
│                                                     │
│ [+ Upload Document] [Search KB] [Settings]         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📁 Categories:                                      │
│ • System Documentation (12)                        │
│ • Rating Manuals (8)                               │
│ • Field Catalogs (15)                              │
│ • Underwriting Guidelines (7)                      │
│ • Regulatory Documents (5)                         │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 📄 Recent Documents:                                │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │ 📄 Guidewire Field Catalog v10               │  │
│ │ System Documentation • 2.3 MB • PDF          │  │
│ │ ✅ Indexed (247 chunks) • Used in 34 AI      │  │
│ │ [View] [Download] [Edit] [Disable] [Delete] │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │ 📄 CA Rating Manual 2026                     │  │
│ │ Rating Manuals • 8.7 MB • PDF                │  │
│ │ ✅ Indexed (532 chunks) • Used in 67 AI      │  │
│ │ [View] [Download] [Edit] [Disable] [Delete] │  │
│ └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

**Upload Interface:**
```
┌─────────────────────────────────────────────────────┐
│ Upload to Knowledge Base                            │
├─────────────────────────────────────────────────────┤
│ 📤 Upload File                                      │
│ ┌────────────────────────────────────────────┐     │
│ │ Drag & drop files here                     │     │
│ │ or click to browse                         │     │
│ │                                            │     │
│ │ Supported: PDF, DOCX, XLSX, CSV, TXT       │     │
│ │ Max size: 100 MB per file                  │     │
│ └────────────────────────────────────────────┘     │
│                                                     │
│ Document Details:                                   │
│ Name:     [Guidewire_Field_Catalog_v10.pdf  ]      │
│ Category: [System Documentation ▼]                 │
│ Tags:     [guidewire] [fields] [+ Add]             │
│                                                     │
│ 🤖 AI Processing:                                   │
│ [✓] Enable for AI suggestions                      │
│ [✓] Generate embeddings for search                 │
│ [✓] Extract structured data                        │
│                                                     │
│ [Cancel] [Upload & Process]                        │
└─────────────────────────────────────────────────────┘
```

---

### **5. Rules Page** (`/rules`)

**Purpose**: Manage conditional business rules for rating logic

**Features:**
- List all rules filtered by current product line
- Create new rules
- Edit existing rules
- Configure conditions (IF statements)
- Configure actions (THEN statements)
- Set rule priority/order
- Activate/deactivate rules
- Delete rules

**UI Sections:**
```
┌─────────────────────────────────────────────────────┐
│ Business Rules for GL_EXISTING                     │
├─────────────────────────────────────────────────────┤
│ [+ New Rule]                       [Search: ____]  │
├─────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────┐   │
│ │ 1. Minimum Premium Rule      [Active ✓]     │   │
│ │ IF state = "CA" AND revenue < 1000000       │   │
│ │ THEN SET minimum_premium = 750              │   │
│ │                            [Edit] [Delete]   │   │
│ └─────────────────────────────────────────────┘   │
│                                                     │
│ ┌─────────────────────────────────────────────┐   │
│ │ 2. High Risk Surcharge       [Active ✓]     │   │
│ │ IF claims > 2 OR loss_ratio > 0.8           │   │
│ │ THEN MULTIPLY premium BY 1.25               │   │
│ │                            [Edit] [Delete]   │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

**Rule Editor:**
```
┌─────────────────────────────────────────────────────┐
│ Edit Rule: Minimum Premium Rule                    │
├─────────────────────────────────────────────────────┤
│ Name:     [Minimum Premium Rule              ]     │
│ Priority: [1      ]  Status: [active ▼]           │
├─────────────────────────────────────────────────────┤
│ Conditions (IF):                   [+ Add Condition]│
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Field:    [state ▼]                           │ │
│ │ Operator: [equals ▼]                          │ │
│ │ Value:    [CA               ]                 │ │
│ │ Logic:    [AND ▼]            [Remove]        │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Field:    [annual_revenue ▼]                  │ │
│ │ Operator: [less_than ▼]                       │ │
│ │ Value:    [1000000          ]                 │ │
│ │                              [Remove]         │ │
│ └───────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ Actions (THEN):                    [+ Add Action]  │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │ Action:   [set ▼]                             │ │
│ │ Field:    [minimum_premium]                   │ │
│ │ Value:    [750              ]                 │ │
│ │                              [Remove]         │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ [Cancel]                              [Save]       │
└─────────────────────────────────────────────────────┘
```

---

### **3. Navigation Updates**

**Add to main navigation:**
```
┌─────────────────────────────────────────────┐
│ Dashboard | Product Lines | Test Rating |  │
│ Mappings | Rules | Settings               │ ← NEW
└─────────────────────────────────────────────┘
```

**Product Line Detail - Add Tabs:**
```
┌─────────────────────────────────────────────┐
│ General Liability (Legacy)                  │
├─────────────────────────────────────────────┤
│ [Overview] [Configuration] [Mappings] [Rules]│
│                              ↑        ↑      │
│                             NEW      NEW     │
└─────────────────────────────────────────────┘
```

---

## 🔄 What We'll Reuse

### **From Old Mapping UI:**

**Components to adapt:**
- `MappingsList.tsx` → List view logic
- `MappingEditor.tsx` → Form logic
- `AddFieldModal.tsx` → Field mapping form

**Logic to reuse:**
- Field path validation
- Transformation type options
- API integration patterns
- Form validation rules

**NOT reusing:**
- Full component code (will streamline)
- Complex state management (use TanStack Query like rest of app)
- Separate routing (integrate into main app)

---

### **From Old Rules UI:**

**Components to adapt:**
- `ConditionalRules.tsx` → List view logic
- `ConditionalRuleEditor.tsx` → Form logic

**Logic to reuse:**
- Condition operators (equals, greater_than, etc.)
- Action types (set, multiply, add, etc.)
- Rule validation
- Priority ordering

**NOT reusing:**
- Decision tables (not needed for MVP)
- Lookup tables (future feature)
- Separate routing

---

### **From Backend (Already Exists):**

**API Endpoints:**
```
GET    /api/v1/mappings                    - List mappings
GET    /api/v1/mappings/:id               - Get mapping
POST   /api/v1/mappings                   - Create mapping
PUT    /api/v1/mappings/:id               - Update mapping
DELETE /api/v1/mappings/:id               - Delete mapping

GET    /api/v1/rules                      - List rules
GET    /api/v1/rules/:id                  - Get rule
POST   /api/v1/rules                      - Create rule
PUT    /api/v1/rules/:id                  - Update rule
DELETE /api/v1/rules/:id                  - Delete rule
```

**Database Tables:**
- `mappings` - Mapping configurations
- `field_mappings` - Individual field transformations
- `conditional_rules` - Business rules
- `rule_conditions` - Rule condition logic
- `rule_actions` - Rule action definitions

**Services:**
- `MappingsService` - Transformation execution
- `RulesService` - Rule execution
- `WorkflowEngine` - Orchestration

---

## 📁 Complete File Structure Plan

```
apps/admin-ui/src/
├── api/
│   ├── mappings.ts          # NEW - API client for mappings
│   ├── rules.ts             # NEW - API client for conditional rules
│   ├── decision-tables.ts   # NEW - API client for decision tables
│   ├── lookup-tables.ts     # NEW - API client for lookup tables
│   └── knowledge-base.ts    # NEW - API client for KB documents
│
├── pages/
│   ├── Mappings.tsx                # NEW - Mappings list page
│   ├── MappingDetail.tsx           # NEW - Edit/create mapping
│   ├── FieldCatalog.tsx            # NEW - Field catalog browser
│   │
│   ├── Rules.tsx                   # NEW - Conditional rules list
│   ├── RuleDetail.tsx              # NEW - Edit/create rule
│   │
│   ├── DecisionTables.tsx          # NEW - Decision tables list
│   ├── DecisionTableEditor.tsx     # NEW - Edit/create decision table
│   │
│   ├── LookupTables.tsx            # NEW - Lookup tables list
│   ├── LookupTableEditor.tsx       # NEW - Edit/create lookup table
│   │
│   ├── KnowledgeBase.tsx           # NEW - KB dashboard
│   ├── KBUpload.tsx                # NEW - Upload documents
│   └── KBDocument.tsx              # NEW - View document details
│
├── components/
│   ├── mappings/
│   │   ├── MappingCard.tsx              # NEW - Mapping list item
│   │   ├── FieldMappingForm.tsx         # NEW - Field mapping editor
│   │   ├── FieldMappingRow.tsx          # NEW - Single field mapping
│   │   ├── TransformationSelect.tsx     # NEW - Transformation dropdown
│   │   ├── FieldCatalogBrowser.tsx      # NEW - Browse source/target fields
│   │   └── AIMappingSuggestions.tsx     # NEW - AI mapping suggestions
│   │
│   ├── rules/
│   │   ├── RuleCard.tsx                 # NEW - Rule list item
│   │   ├── ConditionForm.tsx            # NEW - Condition builder
│   │   ├── ConditionRow.tsx             # NEW - Single condition
│   │   ├── ActionForm.tsx               # NEW - Action builder
│   │   ├── ActionRow.tsx                # NEW - Single action
│   │   └── AIRuleGenerator.tsx          # NEW - AI rule generation
│   │
│   ├── decision-tables/
│   │   ├── DecisionTableCard.tsx        # NEW - Table list item
│   │   ├── TableEditor.tsx              # NEW - Grid editor
│   │   ├── ColumnManager.tsx            # NEW - Add/remove columns
│   │   ├── TableValidation.tsx          # NEW - Completeness check
│   │   └── CSVImportExport.tsx          # NEW - CSV handling
│   │
│   ├── lookup-tables/
│   │   ├── LookupTableCard.tsx          # NEW - Table list item
│   │   ├── TableGrid.tsx                # NEW - Data grid
│   │   └── CSVUploader.tsx              # NEW - CSV import
│   │
│   ├── knowledge-base/
│   │   ├── KBDocumentCard.tsx           # NEW - Document list item
│   │   ├── DocumentUploader.tsx         # NEW - File upload
│   │   ├── DocumentViewer.tsx           # NEW - PDF/Doc viewer
│   │   ├── KBStats.tsx                  # NEW - Statistics dashboard
│   │   ├── AIProcessingStatus.tsx       # NEW - Processing status
│   │   └── KBSearch.tsx                 # NEW - Search interface
│   │
│   └── shared/
│       ├── DataGrid.tsx                 # NEW - Reusable grid component
│       ├── FileUploader.tsx             # NEW - Drag-drop uploader
│       └── TagInput.tsx                 # NEW - Tag management
│
└── types/
    ├── mapping.ts                       # NEW - Mapping interfaces
    ├── rule.ts                          # NEW - Rule interfaces
    ├── decision-table.ts                # NEW - Decision table interfaces
    ├── lookup-table.ts                  # NEW - Lookup table interfaces
    └── knowledge-base.ts                # NEW - KB interfaces
```

**Total New Files:** ~50 files
**Organized by Feature:** Each module has its own folder
**Reusable Components:** Shared components to reduce duplication

---

## 🎨 Design Consistency

**Reuse existing patterns from Admin UI:**
- ✅ TanStack Query for data fetching
- ✅ React Router for navigation
- ✅ Tailwind CSS for styling
- ✅ Lucide icons
- ✅ Product Line context from header
- ✅ Card-based layouts
- ✅ Modal patterns for create/edit
- ✅ Same color scheme and buttons

**Match existing components:**
- Dashboard cards → Mapping/Rule cards
- Product Line list → Mappings list, Rules list
- Test Rating editor → Mapping editor, Rule editor
- Form inputs → Consistent styling

---

## 🔧 Implementation Approach

### **Phase 1: API Layer** (Fastest)

**Files to create:**
1. `apps/admin-ui/src/api/mappings.ts`
2. `apps/admin-ui/src/api/rules.ts`
3. `apps/admin-ui/src/types/mapping.ts`
4. `apps/admin-ui/src/types/rule.ts`

**Strategy:**
- Copy API pattern from `product-lines.ts`
- Define TypeScript interfaces
- Add React Query hooks

**Estimated Tokens:** ~1,500 tokens

---

### **Phase 2: Mappings Pages** (Core Feature)

**Files to create:**
1. `apps/admin-ui/src/pages/Mappings.tsx` - List view
2. `apps/admin-ui/src/pages/MappingDetail.tsx` - Edit/create
3. `apps/admin-ui/src/components/mappings/FieldMappingForm.tsx`
4. Update routing in `App.tsx`

**Strategy:**
- Simplified version of old mapping-ui
- Focus on essential fields only
- Use existing admin UI patterns
- Table view for field mappings

**Estimated Tokens:** ~3,000 tokens

---

### **Phase 3: Rules Pages** (Core Feature)

**Files to create:**
1. `apps/admin-ui/src/pages/Rules.tsx` - List view
2. `apps/admin-ui/src/pages/RuleDetail.tsx` - Edit/create
3. `apps/admin-ui/src/components/rules/ConditionForm.tsx`
4. `apps/admin-ui/src/components/rules/ActionForm.tsx`
5. Update routing in `App.tsx`

**Strategy:**
- Simplified version of old rules-ui
- Dynamic condition/action rows
- Drag-to-reorder priority (optional)
- Focus on conditional rules only (skip decision/lookup tables)

**Estimated Tokens:** ~3,000 tokens

---

### **Phase 4: Navigation Integration** (Quick)

**Files to update:**
1. `apps/admin-ui/src/components/Layout.tsx` - Add nav links
2. `apps/admin-ui/src/App.tsx` - Add routes
3. `apps/admin-ui/src/pages/ProductLineDetail.tsx` - Add tabs (optional)

**Strategy:**
- Add "Mappings" and "Rules" to top navigation
- Wire up routes
- Optional: Add tabs to Product Line detail page

**Estimated Tokens:** ~500 tokens

---

### **Phase 5: Polish & Testing** (Final)

**Tasks:**
- Add loading states
- Add error handling
- Add empty states ("No mappings yet")
- Add confirmation dialogs for delete
- Test all CRUD operations
- Update QUICK_START.md

**Estimated Tokens:** ~1,000 tokens

---

## 📊 Complete Implementation Plan - All Features

**Building ALL Features with Human-in-the-Loop Reviews**

### **Core Modules:**

| Phase | Module | Features | Tokens | Review Points |
|-------|--------|----------|--------|---------------|
| **Phase 1** | **Foundation** | API Layer, TypeScript types, interfaces | ~2,000 | ✋ API structure review |
| **Phase 2a** | **Mappings - Core** | List, create, edit, delete mappings | ~2,500 | ✋ Mappings UI/UX |
| **Phase 2b** | **Mappings - Fields** | Field mapping editor, 9 transformations | ~2,500 | ✋ Transformation logic |
| **Phase 2c** | **Mappings - Advanced** | Field catalog, AI suggestions, templates | ~3,000 | ✋ Field catalog & AI |
| **Phase 3a** | **Rules - Conditional** | IF-THEN rules, conditions, actions | ~2,500 | ✋ Conditional rules UI |
| **Phase 3b** | **Rules - Decision Tables** | ✅ Table editor, validation, completeness | ~3,000 | ✋ Decision table UI |
| **Phase 3c** | **Rules - Lookup Tables** | Reference data, CSV import/export | ~2,000 | ✋ Lookup table structure |
| **Phase 3d** | **Rules - Advanced** | AI rule generation, templates, testing | ~2,500 | ✋ Rule AI features |
| **Phase 4** | **Knowledge Base** | ✅ Document upload, AI learning, RAG | ~4,000 | ✋ KB & AI integration |
| **Phase 5** | **Import/Export** | Bulk operations, migration tools | ~2,000 | ✋ Import formats |
| **Phase 6** | **Navigation** | Routes, tabs, breadcrumbs, context | ~1,000 | ✋ Navigation flow |
| **Phase 7** | **Polish & Test** | Error handling, validation, docs | ~2,000 | ✋ Final review |
| **Total** | **Complete Platform** | **ALL features + KB** | **~29,000** | **12 reviews** |

### **New Additions Confirmed:**
- ✅ **Decision Tables** - Tabular rule definition for multi-factor scenarios
- ✅ **Knowledge Base** - Document upload and AI learning system
- ✅ **Lookup Tables** - Reference data management (from old Rules UI)

**Why More Tokens:**
- ✅ Including ALL features (decision tables, lookup tables, AI)
- ✅ Field catalog management
- ✅ Import/export functionality
- ✅ Template systems
- ✅ Complete feature parity with old UIs
- ✅ Human review at each phase ensures quality

---

## ✅ Success Criteria

**Must Have:**
- ✅ List mappings filtered by product line
- ✅ Create/edit/delete mappings
- ✅ Add/remove field-level mappings
- ✅ Configure transformations (9 types)
- ✅ List rules filtered by product line
- ✅ Create/edit/delete rules
- ✅ Add/remove conditions and actions
- ✅ Test integration with Test Rating page

**Nice to Have (Future):**
- Field catalog browser
- AI-assisted mapping suggestions
- Rule testing/simulation
- Import/export mappings
- Mapping templates
- Rule templates
- Drag-to-reorder rules

---

## 🚀 Migration Strategy

**Before:**
```
User needs to:
1. Use Admin UI (port 5173) for product lines
2. Switch to Mapping UI (port 8080) for mappings
3. Switch to Rules UI (port 8081) for rules
4. Remember 3 different URLs
5. Different UIs, different patterns
```

**After:**
```
User only needs:
1. Admin UI (port 5173) for EVERYTHING
2. Single URL to remember
3. Consistent UI experience
4. Product line context always visible
5. Integrated workflow
```

**Transition Plan:**
1. Build new pages in admin UI
2. Test thoroughly with existing data
3. Announce new integrated UI
4. Keep old UIs running for 1 week (backup)
5. Deprecate old UIs (ports 8080, 8081)
6. Remove old UI services from docker-compose

---

## 🎯 Key Decisions

### **What to Include (EVERYTHING):**
✅ Conditional rules (IF-THEN logic)
✅ Decision tables (tabular rule definition)
✅ Lookup tables (reference data)
✅ Field mappings with all 9 transformations
✅ Field catalog management
✅ AI-assisted mapping suggestions
✅ AI rule generation
✅ Bulk import/export
✅ Mapping templates
✅ Rule templates
✅ All CRUD operations
✅ Product line filtering
✅ Full integration with workflow

### **Implementation Approach:**
✅ **Human-in-the-loop** - Get approval at each step
✅ **Incremental builds** - Build feature by feature, review each
✅ **No skipping** - Include all features from old UIs
✅ **Preserve functionality** - Everything that worked before must work after

### **Architecture Decisions:**

**Use TanStack Query:**
- Consistent with rest of admin UI
- Automatic caching and refetching
- Loading/error states handled

**Modal vs. Page for Edit:**
- **Decision: Use separate pages** (like ProductLineDetail)
- Better for complex forms with many fields
- Easier navigation and bookmarking

**Product Line Context:**
- **Decision: Auto-filter by selected product line**
- Reduces clutter
- Prevents cross-product-line confusion
- Can add "All Product Lines" view later

**Form Validation:**
- **Decision: Client-side first, server-side backup**
- Immediate feedback to user
- Backend validates for safety
- Use Zod schemas (like existing forms)

---

## 📝 Human-in-the-Loop Implementation Workflow

**Every feature will follow this process:**

```
1. DESIGN REVIEW
   ├─ Show wireframes/mockups
   ├─ Explain data flow
   ├─ Present architecture decisions
   └─ 👤 WAIT FOR APPROVAL

2. BUILD
   ├─ Implement approved design
   ├─ Write code incrementally
   └─ Show progress

3. CODE REVIEW
   ├─ Show what was built
   ├─ Explain key decisions made
   ├─ Highlight any changes from design
   └─ 👤 WAIT FOR APPROVAL

4. DEPLOY & TEST
   ├─ Rebuild Docker container
   ├─ Test functionality
   └─ Show working feature

5. FEATURE REVIEW
   ├─ Demonstrate feature
   ├─ Show edge cases
   ├─ Gather feedback
   └─ 👤 APPROVE TO CONTINUE or REQUEST CHANGES

6. NEXT FEATURE
   └─ Repeat process for next phase
```

**Review Checkpoints:**

| Phase | Approval Required For | What You'll Review |
|-------|----------------------|-------------------|
| Phase 1 | API structure | TypeScript interfaces, endpoint design |
| Phase 2a | Mappings list UI | Layout, cards, navigation |
| Phase 2b | Field mapping editor | Form fields, transformation options |
| Phase 2c | Field catalog & AI | Catalog browser, AI suggestion UI |
| Phase 3a | Conditional rules | Condition builder, action builder |
| Phase 3b | Decision tables | Table layout, cell editing |
| Phase 3c | Lookup tables | Table structure, data management |
| Phase 3d | Rule AI features | AI generation UI, prompts |
| Phase 4 | Import/Export | File formats, validation |
| Phase 5 | Navigation | Menu structure, routing |
| Phase 6 | Final product | Complete walkthrough |

## 📋 Complete Feature Checklist

### **Mappings Module**

**Core Features:**
- [ ] List all mappings (filtered by product line)
- [ ] Create new mapping
- [ ] Edit existing mapping
- [ ] Delete mapping (with confirmation)
- [ ] Activate/deactivate mapping
- [ ] Search/filter mappings
- [ ] Sort by name, date, status

**Field Mappings:**
- [ ] Add field mapping row
- [ ] Remove field mapping row
- [ ] Configure source path
- [ ] Configure target path
- [ ] Select transformation type (9 types):
  - [ ] Direct (no transformation)
  - [ ] Uppercase
  - [ ] Lowercase
  - [ ] Trim
  - [ ] Number conversion
  - [ ] String conversion
  - [ ] Boolean conversion
  - [ ] Date formatting
  - [ ] Custom (JavaScript expression)
- [ ] Set required flag
- [ ] Set default value
- [ ] Validation rules
- [ ] Reorder field mappings

**Field Catalog:**
- [ ] Browse source system fields
- [ ] Browse target system fields
- [ ] Search fields
- [ ] View field metadata (type, description)
- [ ] Drag-and-drop field to mapping
- [ ] Field usage tracking

**AI Features:**
- [ ] AI-suggested mappings
- [ ] Confidence scores
- [ ] Accept/reject suggestions
- [ ] AI reasoning display
- [ ] Learning from manual mappings

**Advanced:**
- [ ] Mapping templates
- [ ] Import mapping from JSON
- [ ] Export mapping to JSON
- [ ] Duplicate mapping
- [ ] Mapping version history
- [ ] Test mapping with sample data
- [ ] Preview transformation results

---

### **Rules Module**

**Conditional Rules:**
- [ ] List all conditional rules
- [ ] Create new rule
- [ ] Edit existing rule
- [ ] Delete rule (with confirmation)
- [ ] Activate/deactivate rule
- [ ] Set rule priority/order
- [ ] Drag to reorder rules

**Conditions (IF):**
- [ ] Add condition row
- [ ] Remove condition row
- [ ] Select field
- [ ] Select operator (15+ types):
  - [ ] equals
  - [ ] not_equals
  - [ ] greater_than
  - [ ] less_than
  - [ ] greater_than_or_equal
  - [ ] less_than_or_equal
  - [ ] contains
  - [ ] starts_with
  - [ ] ends_with
  - [ ] in (list)
  - [ ] not_in
  - [ ] is_null
  - [ ] is_not_null
  - [ ] is_empty
  - [ ] is_not_empty
- [ ] Enter value
- [ ] AND/OR logic between conditions
- [ ] Condition groups (parentheses)

**Actions (THEN):**
- [ ] Add action row
- [ ] Remove action row
- [ ] Select action type (7 types):
  - [ ] set (assign value)
  - [ ] add (numeric)
  - [ ] subtract (numeric)
  - [ ] multiply (numeric)
  - [ ] divide (numeric)
  - [ ] append (array/string)
  - [ ] remove (array)
- [ ] Select target field
- [ ] Enter value/expression

**Decision Tables:**
- [ ] Create decision table
- [ ] Edit decision table
- [ ] Add input column
- [ ] Add output column
- [ ] Add row (rule)
- [ ] Edit cell values
- [ ] Delete row
- [ ] Table validation
- [ ] Conflict detection
- [ ] Completeness check

**Lookup Tables:**
- [ ] Create lookup table
- [ ] Edit lookup table
- [ ] Add column
- [ ] Add row
- [ ] Edit cell values
- [ ] Delete row
- [ ] Import from CSV
- [ ] Export to CSV
- [ ] Reference in rules

**AI Features:**
- [ ] Generate rule from natural language
- [ ] AI rule suggestions
- [ ] Rule optimization suggestions
- [ ] Conflict detection
- [ ] Test rule with sample data

**Advanced:**
- [ ] Rule templates
- [ ] Import rules from JSON
- [ ] Export rules to JSON
- [ ] Duplicate rule
- [ ] Rule version history
- [ ] Rule testing/simulation
- [ ] Rule coverage analysis

---

### **Integration Features**

**Product Line Context:**
- [ ] Auto-filter by selected product line
- [ ] Show product line in breadcrumb
- [ ] Switch product line warning
- [ ] Cross-product-line view (optional)

**Workflow Integration:**
- [ ] Test mappings from Test Rating page
- [ ] Test rules from Test Rating page
- [ ] Show which mappings/rules executed
- [ ] Link to edit from execution results

**Data Management:**
- [ ] Bulk import mappings
- [ ] Bulk import rules
- [ ] Bulk export mappings
- [ ] Bulk export rules
- [ ] Migration tools
- [ ] Backup/restore

---

## 🎯 Next Steps

1. **✅ Plan Approved** - Review complete feature list above
2. **👤 YOUR APPROVAL NEEDED**:
   - Confirm all features should be included
   - Confirm human-in-the-loop workflow is acceptable
   - Any additional features to add?
3. **Start Phase 1** - Build API layer (WAIT FOR APPROVAL)
4. **Phase 1 Review** - Show API structure (WAIT FOR APPROVAL)
5. **Continue** - Iterate through all phases with reviews

---

## 🤔 Open Questions

1. **Should we include decision tables in MVP?**
   - Recommendation: No, defer to future release

2. **Should mapping editor be modal or full page?**
   - Recommendation: Full page (better for complex forms)

3. **How to handle product line switching while editing?**
   - Recommendation: Prompt to save/discard changes

4. **Import/export functionality?**
   - Recommendation: Defer, can use API directly for now

5. **Field path autocomplete/suggestions?**
   - Recommendation: Nice to have, defer to Phase 6

---

## 📚 References

**Existing Code:**
- Old Mapping UI: `apps/mapping-ui/src/`
- Old Rules UI: `apps/rules-ui/src/`
- New Admin UI: `apps/admin-ui/src/`
- Backend Services: `apps/rating-api/src/modules/`

**Database Schema:**
- Migration: `database/migrations/005_product_line_configuration.sql`
- Tables: mappings, field_mappings, conditional_rules, rule_conditions, rule_actions

**API Documentation:**
- Swagger: http://localhost:3002/api/docs

---

**Plan Status:** ✅ Ready for Review
**Next Action:** Await approval to proceed with implementation
