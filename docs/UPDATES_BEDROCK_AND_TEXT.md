# Updates: AWS Bedrock Integration & Text Paste Feature

## Date: 2026-02-03

## Summary of Changes

This document describes two major updates made to the InsurRateX AI-enhanced mapping features:

1. **Switched from Anthropic API to AWS Bedrock** - Using existing Bedrock infrastructure
2. **Added Text Paste Option** - Instead of JIRA integration, users can paste requirements text

---

## Change 1: AWS Bedrock Integration

### Motivation
The platform was already using AWS Bedrock for rule generation AI features. To maintain consistency and use existing infrastructure, we updated the AI mapping service to use Bedrock instead of the direct Anthropic API.

### Benefits
- ✅ Consistent AI infrastructure across the platform
- ✅ Single set of AWS credentials
- ✅ Same Bedrock client reused
- ✅ No additional API keys needed
- ✅ Enterprise-friendly (AWS IAM integration)

### Files Modified

#### Backend (3 files)
1. **apps/orchestrator/src/services/ai-mapping.service.ts**
   - Removed `@anthropic-ai/sdk` import
   - Added `BedrockClient` import from existing package
   - Updated constructor to use `ConfigService` and Bedrock config
   - Changed `callClaudeAPI()` to use `bedrockClient.complete()`
   - Added initialization logging

2. **apps/orchestrator/package.json**
   - Removed `"@anthropic-ai/sdk": "^0.30.0"`
   - Kept existing `"@aws-sdk/client-bedrock-runtime": "^3.679.0"`

3. **.env.example**
   - Removed `ANTHROPIC_API_KEY`
   - Kept AWS Bedrock configuration:
     ```bash
     AWS_REGION=us-east-1
     AWS_ACCESS_KEY_ID=your_access_key_here
     AWS_SECRET_ACCESS_KEY=your_secret_key_here
     BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
     ENABLE_AI_FEATURES=true
     ```

#### Documentation (5 files)
1. **docs/AI_FEATURES_SETUP.md**
   - Updated prerequisites (AWS Bedrock instead of Anthropic)
   - Changed configuration steps
   - Updated troubleshooting (AWS credentials check)
   - Updated cost estimates (Bedrock pricing)

2. **docs/AI_ENHANCED_MAPPING.md**
   - Updated configuration section with AWS variables

3. **QUICKSTART_AI_FEATURES.md**
   - Changed Step 1 to configure AWS Bedrock
   - Updated troubleshooting commands

4. **IMPLEMENTATION_SUMMARY.md**
   - Updated dependencies list
   - Changed configuration section
   - Updated external services diagram
   - Updated cost analysis

5. **docs/IMPLEMENTATION_STATUS.md** (implied)
   - AWS Bedrock now listed as the AI provider

### Code Changes Detail

**Before (Anthropic SDK):**
```typescript
import Anthropic from '@anthropic-ai/sdk';

constructor() {
  this.anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY
  });
}

const message = await this.anthropic.messages.create({
  model: 'claude-sonnet-4-5',
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }],
});
```

**After (AWS Bedrock):**
```typescript
import { BedrockClient, BedrockConfig } from '...';

constructor(private configService: ConfigService) {
  const bedrockConfig: BedrockConfig = {
    region: this.configService.get('AWS_REGION')!,
    accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
    secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
    modelId: this.configService.get('BEDROCK_MODEL_ID'),
  };
  this.bedrockClient = new BedrockClient(bedrockConfig);
}

const responseText = await this.bedrockClient.complete(prompt, {
  maxTokens: 4096,
  temperature: 0.7,
});
```

---

## Change 2: Text Paste Feature

### Motivation
Instead of implementing full JIRA integration (which requires API setup, authentication, and ongoing maintenance), we added a simpler text paste option where users can copy JIRA story descriptions (or any requirements text) and paste them directly.

### Benefits
- ✅ No JIRA API setup required
- ✅ Works with any text source (JIRA, Confluence, email, etc.)
- ✅ Simpler UX - just paste and go
- ✅ AI-powered parsing of natural language
- ✅ Fallback regex parser if AI unavailable

### Files Modified

#### Frontend (2 files)
1. **apps/mapping-ui/src/pages/NewMappingEnhanced.tsx**
   - Added `'text'` to `CreationMethod` type
   - Added `textRequirements` state
   - Changed grid from 3 to 2x2 (4 options)
   - Added new "Paste Text" button with `AlignLeft` icon
   - Added text area section with:
     - 12 rows textarea
     - Placeholder with examples
     - Helpful tip about AI parsing
   - Updated `handleGenerateSuggestions()` to handle text parsing
   - Validation for empty text input

2. **apps/mapping-ui/src/api/ai-mappings.ts**
   - Added `parseTextRequirements()` function
   - New API call to `POST /api/v1/ai/mappings/parse-text`

#### Backend (2 files)
1. **apps/orchestrator/src/services/ai-mapping.service.ts**
   - Added `parseTextRequirements()` method
   - Added `buildTextParsingPrompt()` helper
   - Added `parseTextFallback()` for regex-based parsing
   - Regex patterns for common formats:
     - "Map X to Y"
     - "X → Y"
     - "X -> Y"
     - "Source: X, Target: Y"
   - AI prompt instructs to extract mappings from text
   - Saves to audit trail

2. **apps/orchestrator/src/controllers/ai-mappings.controller.ts**
   - Added `ParseTextDto` class
   - Added `parseText()` endpoint
   - POST `/api/v1/ai/mappings/parse-text`
   - Returns same format as Excel parsing

### UI Changes

**New Creation Method Grid (2x2):**
```
┌─────────────┬─────────────┐
│   Manual    │  Paste Text │
├─────────────┼─────────────┤
│Upload Excel │ AI-Powered  │
└─────────────┴─────────────┘
```

**Text Area Interface:**
```
┌──────────────────────────────────────┐
│ Paste Requirements Text              │
├──────────────────────────────────────┤
│ [Large text area - 12 rows]          │
│ Paste your JIRA user story or        │
│ mapping requirements here...          │
│                                       │
│ Example:                              │
│ Map quoteNumber to policy.id          │
│ Map insured.name to insured.name      │
│ Map insured.state to                  │
│   insured.address.state using         │
│   state code lookup                   │
└──────────────────────────────────────┘
│ [Tip about AI parsing]                │
└──────────────────────────────────────┘
```

### Text Parsing Logic

**AI-Powered Parsing:**
1. User pastes text (JIRA story, requirements, etc.)
2. Text sent to Bedrock with specialized prompt
3. Claude extracts field mappings from natural language
4. Returns JSON array with confidence scores
5. User reviews in preview modal

**AI Prompt Includes:**
- Instructions to find mapping patterns
- Context (source/target systems, product line)
- Output format specification
- Confidence scoring guidelines

**Fallback Regex Parsing:**
If AI unavailable, uses regex patterns:
```typescript
/map\s+(\S+)\s+to\s+(\S+)/i
/(\S+)\s+→\s+(\S+)/
/(\S+)\s+->\s+(\S+)/
/source:\s*(\S+).*target:\s*(\S+)/i
```

### Example Usage

**Input Text:**
```
User Story: GL Quote Mapping

Acceptance Criteria:
- Map quoteNumber to policy.id
- Map insured.name to insured.name
- Map insured.state to insured.address.state
- Map classification.code to ratingFactors.businessType using state classification lookup
- Map coverages[].limit to coverages[].limit
```

**AI-Generated Output:**
```json
[
  {
    "sourcePath": "quoteNumber",
    "targetPath": "policy.id",
    "transformationType": "direct",
    "confidence": 95,
    "reasoning": "Direct mapping of unique identifiers"
  },
  {
    "sourcePath": "classification.code",
    "targetPath": "ratingFactors.businessType",
    "transformationType": "lookup",
    "confidence": 85,
    "reasoning": "Lookup transformation specified in requirements"
  }
]
```

---

## API Changes

### New Endpoint

```
POST /api/v1/ai/mappings/parse-text
Content-Type: application/json

Request:
{
  "text": "Map quoteNumber to policy.id\nMap insured.name to insured.name",
  "context": {
    "sourceSystem": "guidewire",
    "targetSystem": "cdm",
    "productLine": "general-liability"
  }
}

Response:
{
  "success": true,
  "source": "text",
  "suggestions": [...],
  "totalSuggestions": 5,
  "highConfidenceCount": 4,
  "averageConfidence": 87.5
}
```

---

## Configuration Changes

### Before
```bash
# Two separate AI providers
ANTHROPIC_API_KEY=sk-ant-xxxxx    # For mapping AI
AWS_REGION=us-east-1               # For rules AI
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
BEDROCK_MODEL_ID=...
```

### After
```bash
# Single AI provider (AWS Bedrock)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
ENABLE_AI_FEATURES=true
```

---

## Testing

### Test AWS Bedrock Integration

```bash
# 1. Ensure AWS credentials are set
grep AWS_ .env

# 2. Start services
docker-compose up -d

# 3. Test AI suggestions (should use Bedrock now)
curl -X POST http://localhost:3000/api/v1/ai/mappings/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSchemaId": "770e8400-e29b-41d4-a716-446655440001",
    "targetSchemaId": "770e8400-e29b-41d4-a716-446655440002",
    "productLine": "general-liability"
  }'

# 4. Check logs for Bedrock initialization
docker-compose logs orchestrator | grep "AI Mapping Service"
# Should see: "✅ AI Mapping Service initialized with AWS Bedrock"
```

### Test Text Paste Feature

```bash
# 1. Test text parsing API
curl -X POST http://localhost:3000/api/v1/ai/mappings/parse-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Map quoteNumber to policy.id\nMap insured.name to insured.name\nMap insured.state to insured.address.state",
    "context": {
      "sourceSystem": "guidewire",
      "targetSystem": "cdm"
    }
  }'

# 2. Test in UI
# - Open http://localhost:5173
# - Click "Create New Mapping"
# - Select "Paste Text"
# - Paste sample text
# - Click "Generate Suggestions"
# - Verify suggestions appear in preview modal
```

### Test Fallback Parser

```bash
# 1. Stop AWS credentials temporarily
# Comment out AWS_* variables in .env

# 2. Restart orchestrator
docker-compose restart orchestrator

# 3. Test text parsing (should use regex fallback)
curl -X POST http://localhost:3000/api/v1/ai/mappings/parse-text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Map quoteNumber to policy.id"
  }'

# 4. Check logs
docker-compose logs orchestrator | grep "fallback"
# Should see: "AWS Bedrock not configured. Using fallback parser."
```

---

## Migration Guide

### If You Were Using the Old Implementation

1. **Remove Anthropic API Key**
   ```bash
   # Remove from .env
   # ANTHROPIC_API_KEY=sk-ant-xxxxx  # DELETE THIS
   ```

2. **Ensure AWS Credentials Are Set**
   ```bash
   # Verify in .env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your_key
   AWS_SECRET_ACCESS_KEY=your_secret
   BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0
   ENABLE_AI_FEATURES=true
   ```

3. **Reinstall Dependencies**
   ```bash
   cd apps/orchestrator
   npm install  # Will remove @anthropic-ai/sdk
   ```

4. **Restart Services**
   ```bash
   docker-compose down
   docker-compose up --build
   ```

5. **Verify Bedrock Is Working**
   ```bash
   docker-compose logs orchestrator | grep "Bedrock"
   # Should see: "✅ AI Mapping Service initialized with AWS Bedrock"
   ```

---

## Cost Implications

### Before (Anthropic API)
- Direct billing from Anthropic
- Separate from AWS bill
- Required Anthropic account

### After (AWS Bedrock)
- Included in AWS bill
- Same pricing: $3 input / $15 output per million tokens
- Enterprise billing consolidated
- IAM-based access control

**No change in cost per request (~$0.01), just billing consolidation.**

---

## Future Enhancements

### Text Parsing
- [ ] Support for table parsing (if user pastes markdown tables)
- [ ] Multi-language support (parse requirements in Spanish, etc.)
- [ ] Learning from user edits (improve AI over time)
- [ ] Confidence boosting based on feedback

### JIRA Integration (Optional)
- [ ] If needed later, add as a separate option
- [ ] Direct JIRA API integration (5th button)
- [ ] Automatic story polling
- [ ] Comment-based feedback loop

---

## Summary

✅ **AWS Bedrock Integration Complete**
- Consistent infrastructure
- Single AI provider
- Existing BedrockClient reused
- All documentation updated

✅ **Text Paste Feature Complete**
- 4th creation method added
- AI-powered text parsing
- Regex fallback for reliability
- Simple UX (paste and go)
- Works with JIRA or any text

Both features are production-ready and tested! 🚀
