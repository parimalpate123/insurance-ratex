# AI Features Setup Guide

## Quick Start

This guide helps you set up and test the new AI-enhanced mapping creation features.

## Prerequisites

1. **AWS Account with Bedrock Access**
   - AWS account with access to Amazon Bedrock
   - IAM credentials (Access Key ID and Secret Access Key)
   - Bedrock model access enabled for Claude Sonnet 3.5
   - See: https://docs.aws.amazon.com/bedrock/

2. **PostgreSQL Database**
   - PostgreSQL 15+
   - Database named `insurratex`

3. **Node.js**
   - Version 18+
   - npm or yarn

## Step 1: Environment Configuration

Create or update `.env` file in the project root:

```bash
# Copy from template
cp .env.example .env

# Edit .env and add your AWS Bedrock credentials
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key_here
AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
ENABLE_AI_FEATURES=true

# Database configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=insurratex
DB_PASSWORD=dev_password_change_in_prod
DB_DATABASE=insurratex

# File upload limits
MAX_UPLOAD_SIZE=10485760
ALLOWED_FILE_TYPES=xlsx,csv,json
```

## Step 2: Database Setup

### Option A: Using Docker Compose (Recommended)

```bash
# Start database
docker-compose up -d postgres

# Wait for database to be ready
sleep 5

# Run migrations
docker-compose exec postgres psql -U insurratex -d insurratex -f /docker-entrypoint-initdb.d/init.sql
docker-compose exec postgres psql -U insurratex -d insurratex -f /docker-entrypoint-initdb.d/migrations/001_add_ai_features.sql
```

### Option B: Manual Setup

```bash
# Create database
createdb insurratex

# Run initial schema
psql -U insurratex -d insurratex -f database/init.sql

# Run AI features migration
psql -U insurratex -d insurratex -f database/migrations/001_add_ai_features.sql
```

## Step 3: Install Dependencies

```bash
# Install orchestrator dependencies
cd apps/orchestrator
npm install

# Install mapping UI dependencies
cd ../mapping-ui
npm install

# Return to root
cd ../..
```

## Step 4: Verify Schema Library

The migration script automatically populates sample schemas. Verify:

```bash
# Connect to database
psql -U insurratex -d insurratex

# Check schemas
SELECT system_name, version, schema_type,
       jsonb_array_length(schema_data->'fields') as field_count
FROM schemas
ORDER BY system_name, version;

# Expected output:
#  system_name | version | schema_type | field_count
# -------------+---------+-------------+-------------
#  cdm         | v2.0    | library     | 8
#  earnix      | v8.0    | library     | 6
#  guidewire   | v10.0   | library     | 8
```

## Step 5: Start Services

### Start All Services

```bash
# Using Docker Compose
docker-compose up

# Or start individually:

# Terminal 1: Orchestrator
cd apps/orchestrator
npm run dev

# Terminal 2: Mapping UI
cd apps/mapping-ui
npm run dev

# Terminal 3: Rules UI
cd apps/rules-ui
npm run dev
```

Services will be available at:
- Orchestrator API: http://localhost:3000
- Mapping UI: http://localhost:5173
- Rules UI: http://localhost:5174

## Step 6: Test AI Features

### Test 1: Schema Library API

```bash
# List all schemas
curl http://localhost:3000/api/v1/schemas/library | jq

# Get specific schema
curl http://localhost:3000/api/v1/schemas/system/guidewire/latest | jq

# Search fields
curl "http://localhost:3000/api/v1/schemas/search/fields?q=state" | jq
```

### Test 2: Excel Parsing

Create a test Excel file `test-mappings.xlsx`:

| Source Field Path | Target Field | Transformation Type | Business Rule | Sample Value |
|-------------------|--------------|---------------------|---------------|--------------|
| quoteNumber | policy.id | direct | | Q-2026-001 |
| insured.name | insured.name | direct | | Acme Corp |
| insured.state | insured.address.state | direct | | CA |
| classification.code | ratingFactors.businessType | lookup | state-class-mapping | 91580 |

Upload via API:

```bash
curl -X POST http://localhost:3000/api/v1/ai/mappings/parse-excel \
  -F "file=@test-mappings.xlsx" | jq
```

Expected response:
```json
{
  "success": true,
  "filename": "test-mappings.xlsx",
  "suggestions": [
    {
      "sourcePath": "quoteNumber",
      "targetPath": "policy.id",
      "transformationType": "direct",
      "confidence": 95,
      "reasoning": "Map quoteNumber to policy.id"
    }
  ],
  "totalSuggestions": 4,
  "highConfidenceCount": 4,
  "averageConfidence": 92.5
}
```

### Test 3: AI-Powered Suggestions

```bash
# Get schema IDs first
GUIDEWIRE_ID=$(curl -s http://localhost:3000/api/v1/schemas/library | jq -r '.[] | select(.systemName=="guidewire") | .id')
CDM_ID=$(curl -s http://localhost:3000/api/v1/schemas/library | jq -r '.[] | select(.systemName=="cdm") | .id')

# Generate suggestions
curl -X POST http://localhost:3000/api/v1/ai/mappings/generate \
  -H "Content-Type: application/json" \
  -d "{
    \"sourceSchemaId\": \"$GUIDEWIRE_ID\",
    \"targetSchemaId\": \"$CDM_ID\",
    \"productLine\": \"general-liability\"
  }" | jq
```

Expected response:
```json
{
  "suggestions": [
    {
      "sourcePath": "quoteNumber",
      "targetPath": "policy.id",
      "transformationType": "direct",
      "confidence": 95,
      "reasoning": "Both fields represent unique policy identifiers"
    },
    {
      "sourcePath": "insured.name",
      "targetPath": "insured.name",
      "transformationType": "direct",
      "confidence": 99,
      "reasoning": "Exact field name match"
    }
  ],
  "totalSuggestions": 8,
  "highConfidenceCount": 7,
  "averageConfidence": 91.2,
  "processingTimeMs": 2450
}
```

### Test 4: Field Similarity

```bash
curl -X POST http://localhost:3000/api/v1/ai/mappings/similarity \
  -H "Content-Type: application/json" \
  -d '{
    "path1": "quoteNumber",
    "path2": "policy.id"
  }' | jq

# Expected:
{
  "path1": "quoteNumber",
  "path2": "policy.id",
  "similarity": 45,
  "match": "none"
}

curl -X POST http://localhost:3000/api/v1/ai/mappings/similarity \
  -H "Content-Type: application/json" \
  -d '{
    "path1": "insured.state",
    "path2": "insuredState"
  }' | jq

# Expected:
{
  "path1": "insured.state",
  "path2": "insuredState",
  "similarity": 92,
  "match": "high"
}
```

## Step 7: Test UI Features

### Create Mapping via UI

1. Open Mapping UI: http://localhost:5173
2. Click "Create New Mapping"
3. Select creation method:
   - **Manual**: Traditional approach
   - **Excel Upload**: Upload test-mappings.xlsx
   - **AI-Powered**: Select Guidewire → CDM
4. Fill in metadata (name, product line, version)
5. Click "Generate Suggestions" (for Excel or AI)
6. Review suggestions in preview modal
7. Select mappings to accept
8. Click "Create Mapping"
9. Verify in editor

### Excel Upload Flow

1. Select "Upload Excel/CSV" method
2. Drag and drop `test-mappings.xlsx`
3. Click "Generate Suggestions"
4. Wait for parsing (should be < 1 second)
5. Review 4 suggestions in modal
6. Note confidence scores (all should be 90%+)
7. Accept all or select individually
8. Proceed to editor

### AI-Powered Flow

1. Select "AI-Powered" method
2. Choose Source: Guidewire
3. Choose Target: CDM
4. Select Product Line: General Liability
5. Click "Generate Suggestions"
6. Wait for AI processing (2-5 seconds)
7. Review 8-10 suggestions
8. Filter by "High Confidence Only"
9. Click "Accept All High Confidence"
10. Create mapping

## Troubleshooting

### Issue: "AWS Bedrock not configured"

**Solution:**
```bash
# Check .env file exists
ls -la .env

# Verify AWS credentials are set
grep AWS_ .env

# Should see:
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=...
# AWS_SECRET_ACCESS_KEY=...
# BEDROCK_MODEL_ID=...
# ENABLE_AI_FEATURES=true

# Restart orchestrator
cd apps/orchestrator
npm run dev
```

### Issue: "Access Denied" when calling Bedrock

**Solution:**
1. Verify your AWS credentials have Bedrock access
2. Check IAM policy includes `bedrock:InvokeModel` permission
3. Ensure Claude Sonnet 3.5 model is enabled in your AWS region
4. Try a different region if model not available

### Issue: "Schema with ID ... not found"

**Solution:**
```bash
# Re-run migration
psql -U insurratex -d insurratex -f database/migrations/001_add_ai_features.sql

# Verify schemas exist
psql -U insurratex -d insurratex -c "SELECT COUNT(*) FROM schemas;"
```

### Issue: Excel parsing fails

**Error:** "Missing required column"

**Solution:**
- Check column headers exactly match: `Source Field Path`, `Target Field`
- Ensure first row is headers
- No empty rows at top

**Error:** "Invalid file type"

**Solution:**
- Only .xlsx, .xls, .csv accepted
- Verify file extension

### Issue: AI suggestions low confidence

**Possible Causes:**
- Schema definitions incomplete
- Field names very different
- Missing descriptions

**Solutions:**
1. Add field descriptions to schemas
2. Provide context in request
3. Use Excel upload for complex cases

### Issue: Slow AI generation

**Expected:** 2-5 seconds for Claude API
**If slower:**
- Check network connectivity
- Verify API key is valid
- Monitor Anthropic API status

## Performance Benchmarks

Expected performance on standard hardware:

| Operation | Expected Time |
|-----------|---------------|
| Excel parsing (20 rows) | < 500ms |
| Excel parsing (100 rows) | < 2s |
| AI suggestions (10 fields) | 2-5s |
| Schema comparison | < 100ms |
| Field similarity | < 10ms |

## Cost Estimates

### AWS Bedrock Costs

Based on Claude Sonnet 3.5 on Bedrock pricing (us-east-1):
- Input: $3 per million tokens
- Output: $15 per million tokens

Typical mapping suggestion request:
- Input: ~2,000 tokens (schemas)
- Output: ~500 tokens (suggestions)
- Cost per request: ~$0.01

For 1,000 mappings/month:
- **Monthly cost: ~$10-20**

Note: AWS Bedrock pricing may vary by region. Check current pricing at:
https://aws.amazon.com/bedrock/pricing/

### Optimization Tips

1. **Cache schemas** - Load once, reuse
2. **Batch requests** - Group similar mappings
3. **Use confidence threshold** - Only call AI for uncertain cases
4. **Fallback to similarity** - Use Levenshtein for simple matches

## Next Steps

1. **Test with real data** - Upload actual Guidewire payload
2. **Create custom schemas** - Add your system schemas
3. **Train BAs** - Show them Excel template
4. **Monitor metrics** - Track confidence scores, acceptance rates
5. **Gather feedback** - Iterate on UI/UX

## Support

For issues or questions:
1. Check logs: `docker-compose logs orchestrator`
2. Review database: `psql -U insurratex -d insurratex`
3. Test API directly with curl
4. Check environment variables

## Resources

- Main README: ../README.md
- AI Features Doc: ./AI_ENHANCED_MAPPING.md
- Implementation Status: ./IMPLEMENTATION_STATUS.md
- API Endpoints: http://localhost:3000/api/docs (coming soon)
