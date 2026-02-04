# AI-Enhanced Mapping Creation

## Overview

InsurRateX now supports three powerful ways to create mappings:

1. **Manual Creation** - Traditional approach for full control
2. **Excel/CSV Upload** - BA-friendly requirements import
3. **AI-Powered Detection** - Automatic schema analysis and mapping suggestions

## Features

### 1. Excel/CSV Requirements Upload

Business analysts can prepare mapping requirements in Excel or CSV format and upload them directly.

#### Expected File Format

**Columns:**
- `Source Field Path` (required) - Path to source field (e.g., `quoteNumber`, `insured.state`)
- `Target Field` (required) - Path to target field (e.g., `policy.id`, `insured.address.state`)
- `Transformation Type` (optional) - Type of transformation (direct, lookup, expression, etc.)
- `Business Rule` (optional) - Additional business logic or lookup table reference
- `Sample Value` (optional) - Example value for testing
- `Description` (optional) - Notes about the mapping

**Example:**

| Source Field Path | Target Field | Transformation Type | Business Rule | Sample Value |
|-------------------|--------------|---------------------|---------------|--------------|
| quoteNumber | policy.id | direct | | Q-2026-001 |
| insured.state | insured.address.state | direct | | CA |
| insured.annualRevenue | ratingFactors.annualRevenue | direct | | 5000000 |
| classification.code | ratingFactors.businessType | lookup | state-class-mapping | 91580 |

#### Process Flow

1. BA creates Excel file with mapping requirements
2. Upload file in "Create New Mapping" screen
3. AI parses file and generates structured suggestions
4. Review suggestions in preview modal
5. Accept/reject individual mappings
6. Proceed to editor with pre-populated fields

#### Confidence Scoring

Each parsed mapping receives a confidence score:
- **70% base** - Basic validity
- **+10%** - Clear hierarchical paths (contains `.`)
- **+15%** - Direct transformation type
- **+10%** - Business rule provided for complex transformations
- **Maximum: 99%** - No suggestion is 100% certain (requires human review)

### 2. AI-Powered Schema Detection

AI analyzes source and target schemas to automatically suggest field mappings.

#### How It Works

1. Select source system (e.g., Guidewire)
2. Select target system (e.g., CDM)
3. Click "Generate Suggestions"
4. AI uses Claude API to:
   - Analyze field names, types, and descriptions
   - Apply insurance domain knowledge
   - Calculate semantic similarity
   - Suggest appropriate transformations
5. Review suggestions in preview modal
6. Accept selected mappings

#### AI Prompting Strategy

The system sends Claude a structured prompt including:
- Source and target schema definitions
- Field paths, types, and descriptions
- Product line context (if provided)
- Insurance domain instructions

Claude returns JSON array with:
```json
[
  {
    "sourcePath": "quoteNumber",
    "targetPath": "policy.id",
    "transformationType": "direct",
    "confidence": 95,
    "reasoning": "Both fields represent unique policy identifiers"
  }
]
```

#### Confidence Levels

- **90-100%** - High confidence (green badge)
  - Exact or near-exact field name matches
  - Clear semantic equivalence
  - Standard insurance field mappings

- **80-89%** - Good confidence (blue badge)
  - Strong similarity
  - Common patterns
  - May need minor adjustment

- **60-79%** - Medium confidence (yellow badge)
  - Possible match
  - Requires review
  - May need transformation logic

- **<60%** - Low confidence (gray badge)
  - Uncertain match
  - Manual review essential

### 3. Mapping Preview Modal

Interactive review interface for AI-generated suggestions.

#### Features

- **Visual Layout**
  - Three-column view: Source → Transformation → Target
  - Confidence badges (color-coded)
  - AI reasoning explanations

- **Filtering**
  - All suggestions
  - High confidence only (≥80%)
  - Medium confidence only (60-79%)

- **Bulk Actions**
  - Select/deselect all
  - Accept all high confidence
  - Individual accept/reject

- **Statistics**
  - Total suggestions
  - Selected count
  - Average confidence
  - High confidence count

#### User Flow

1. Review all suggestions
2. Filter by confidence if needed
3. Read AI reasoning for each mapping
4. Select mappings to accept
5. Click "Create Mapping" to proceed
6. Editor opens with pre-populated fields

## API Endpoints

### Parse Excel File

```bash
POST /api/v1/ai/mappings/parse-excel
Content-Type: multipart/form-data

Response:
{
  "success": true,
  "filename": "mappings.xlsx",
  "suggestions": [...],
  "totalSuggestions": 15,
  "highConfidenceCount": 12,
  "averageConfidence": 87.5
}
```

### Generate AI Suggestions

```bash
POST /api/v1/ai/mappings/generate
Content-Type: application/json

{
  "sourceSchemaId": "uuid",
  "targetSchemaId": "uuid",
  "productLine": "general-liability",
  "context": "Optional additional context"
}

Response:
{
  "suggestions": [...],
  "totalSuggestions": 20,
  "highConfidenceCount": 18,
  "averageConfidence": 92.1,
  "processingTimeMs": 3450
}
```

### Validate Excel Structure

```bash
POST /api/v1/ai/mappings/validate-excel
Content-Type: multipart/form-data

Response:
{
  "filename": "mappings.xlsx",
  "valid": true,
  "errors": [],
  "warnings": ["Large file with 150 rows"]
}
```

### Get Suggestion History

```bash
GET /api/v1/ai/mappings/history?mappingId=uuid&limit=50

Response: [
  {
    "id": "uuid",
    "suggestionType": "excel_parse",
    "suggestions": {...},
    "acceptedSuggestions": {...},
    "confidence scores": {...},
    "createdAt": "2026-02-03T10:30:00Z"
  }
]
```

## Schema Management

### Schema Library

Pre-configured schemas for common systems:
- Guidewire v10.0, v11.0
- CDM v2.0
- Earnix v8.0
- Duck Creek v2023
- Salesforce Policy Center

### Upload Custom Schema

```bash
POST /api/v1/schemas/upload
Content-Type: multipart/form-data

Parameters:
- file: JSON schema file
- systemName: System identifier
- version: Version string
- description: Optional description

Schema Format:
{
  "fields": [
    {
      "path": "policy.id",
      "type": "string",
      "description": "Unique policy identifier",
      "required": true
    }
  ]
}
```

### List Schemas

```bash
GET /api/v1/schemas/library?systemName=guidewire

Response: [
  {
    "id": "uuid",
    "systemName": "guidewire",
    "version": "v10.0",
    "schemaType": "library",
    "fieldCount": 47
  }
]
```

### Compare Schemas

```bash
POST /api/v1/schemas/compare
Content-Type: application/json

{
  "schema1Id": "uuid1",
  "schema2Id": "uuid2"
}

Response:
{
  "commonFields": ["state", "policyNumber"],
  "onlyInSchema1": ["glSpecificField"],
  "onlyInSchema2": ["ratingEngine Field"],
  "typeMismatches": [
    {
      "path": "premium",
      "type1": "number",
      "type2": "string"
    }
  ]
}
```

## Database Schema

### New Tables

#### `schemas`
Stores schema definitions for policy systems and rating engines.

```sql
CREATE TABLE schemas (
  id UUID PRIMARY KEY,
  system_name VARCHAR(100),
  version VARCHAR(50),
  schema_type VARCHAR(50), -- library, custom, detected
  schema_data JSONB,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

#### `ai_suggestions`
Audit trail of AI-generated suggestions.

```sql
CREATE TABLE ai_suggestions (
  id UUID PRIMARY KEY,
  mapping_id UUID REFERENCES mappings(id),
  suggestion_type VARCHAR(50), -- excel_parse, jira_parse, auto_detect
  input_data JSONB,
  suggestions JSONB,
  accepted_suggestions JSONB,
  confidence_scores JSONB,
  ai_model VARCHAR(100),
  processing_time_ms INTEGER,
  created_at TIMESTAMP
);
```

#### `uploaded_files`
Tracks uploaded Excel/CSV files.

```sql
CREATE TABLE uploaded_files (
  id UUID PRIMARY KEY,
  filename VARCHAR(255),
  file_type VARCHAR(20),
  file_size_bytes INTEGER,
  storage_path VARCHAR(500),
  mapping_id UUID REFERENCES mappings(id),
  processed BOOLEAN,
  uploaded_at TIMESTAMP
);
```

#### `mappings` (enhanced)
Added columns:
- `creation_method` - How mapping was created (manual, excel, ai_detect, hybrid)
- `source_reference` - Reference to source (Excel filename, JIRA key)
- `ai_confidence_score` - Average confidence of AI suggestions

## Configuration

### Environment Variables

```bash
# AWS Bedrock (for AI features via Claude Sonnet)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
ENABLE_AI_FEATURES=true

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=insurratex
DB_PASSWORD=yourpassword
DB_DATABASE=insurratex

# File Upload
MAX_UPLOAD_SIZE=10485760  # 10MB
ALLOWED_FILE_TYPES=xlsx,csv,json
```

## Testing

### Test Excel Parsing

```bash
curl -X POST http://localhost:3000/api/v1/ai/mappings/parse-excel \
  -F "file=@test-mappings.xlsx"
```

### Test AI Suggestions

```bash
curl -X POST http://localhost:3000/api/v1/ai/mappings/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSchemaId": "770e8400-e29b-41d4-a716-446655440001",
    "targetSchemaId": "770e8400-e29b-41d4-a716-446655440002",
    "productLine": "general-liability"
  }'
```

## Best Practices

### For Business Analysts

1. **Excel Format**
   - Use provided template
   - Include descriptions for complex mappings
   - Provide sample values for testing

2. **Review AI Suggestions**
   - Always review confidence scores
   - Read AI reasoning
   - Test with sample data before deploying

3. **Iterative Approach**
   - Start with high-confidence mappings
   - Add complex mappings manually
   - Use AI as starting point, not final answer

### For Developers

1. **Schema Definitions**
   - Keep schemas up to date
   - Include field descriptions
   - Provide sample values

2. **AI Integration**
   - Monitor API usage (costs)
   - Cache frequent requests
   - Implement fallbacks if API unavailable

3. **Audit Trail**
   - Track all AI suggestions
   - Monitor acceptance rates
   - Improve prompts based on feedback

## Troubleshooting

### Excel Parsing Fails

**Error:** "Missing required column: Source Field Path"
- Check column headers match expected format
- Use template file as reference

**Error:** "Invalid file type"
- Only .xlsx, .xls, .csv accepted
- Check file extension

### AI Suggestions Low Quality

**Issue:** Low confidence scores
- Verify schema definitions are accurate
- Add more field descriptions
- Provide product line context

**Issue:** Incorrect mappings
- Review AI reasoning
- Check for naming inconsistencies
- Manual review required

### Performance Issues

**Slow Excel parsing**
- Limit to <100 rows per file
- Split large files

**Slow AI generation**
- Claude API can take 2-5 seconds
- Consider caching common patterns
- Show loading indicator

## Roadmap

### Phase 2 (Future)
- JIRA integration for requirements import
- Natural language rule generation
- Multi-format schema detection (GraphQL, Avro)
- Learning from BA feedback (reinforcement learning)
- Context gathering from Confluence/SharePoint

### Phase 3 (Future)
- Real-time collaboration on mappings
- Version control integration (Git)
- Automated testing of mappings
- ML-powered anomaly detection
