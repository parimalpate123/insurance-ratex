# Build and Test AI Integration

## Step 1: Install AI Services Dependencies

```bash
cd packages/ai-services
npm install
npm run build
cd ../..
```

## Step 2: Update Orchestrator Dependencies

```bash
cd apps/orchestrator
npm install
cd ../..
```

## Step 3: Rebuild Orchestrator Docker Image

```bash
docker-compose build orchestrator
```

## Step 4: Restart Orchestrator Service

```bash
docker-compose restart orchestrator
```

## Step 5: Verify AI Services Initialized

```bash
docker-compose logs orchestrator | grep "AI Services"
```

You should see:
```
✅ AI Services initialized with AWS Bedrock
   Region: us-east-1
   Model: anthropic.claude-3-5-sonnet-20241022-v2:0
```

## Step 6: Test Mapping Suggestions

```bash
curl -X POST http://localhost:3000/api/v1/ai/suggest-mappings \
  -H "Content-Type: application/json" \
  -d '{
    "sourceFields": [
      {"path": "quoteNumber", "name": "quoteNumber", "type": "string"},
      {"path": "insuredName", "name": "insuredName", "type": "string"}
    ],
    "targetFields": [
      {"path": "policyId", "name": "policyId", "type": "string"},
      {"path": "name", "name": "name", "type": "string"}
    ],
    "sourceSystem": "guidewire",
    "targetSystem": "CDM",
    "productLine": "general-liability"
  }'
```

## Step 7: Test Rule Generation

```bash
curl -X POST http://localhost:3000/api/v1/ai/generate-rule \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Apply 10% surcharge if annual revenue exceeds 5 million dollars",
    "productLine": "general-liability",
    "context": {
      "availableFields": ["annualRevenue", "premium", "state"],
      "operators": ["==", "!=", ">", "<", ">=", "<="],
      "actions": ["surcharge", "discount", "reject"]
    }
  }'
```

## Expected Results

Both endpoints should return JSON with:
- `"success": true`
- AI-generated suggestions/rules
- Confidence scores
- Reasoning from Claude Sonnet

If you see errors, check:
```bash
docker-compose logs orchestrator
```
