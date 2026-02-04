# InsurRateX AI Features - Quick Start

## 🚀 Get Running in 5 Minutes

### Step 1: Configure AWS Bedrock (30 seconds)
```bash
# Copy template
cp .env.example .env

# Add your AWS Bedrock credentials
# Get from AWS IAM: https://console.aws.amazon.com/iam/
echo "AWS_REGION=us-east-1" >> .env
echo "AWS_ACCESS_KEY_ID=your_access_key" >> .env
echo "AWS_SECRET_ACCESS_KEY=your_secret_key" >> .env
echo "BEDROCK_MODEL_ID=us.anthropic.claude-3-5-sonnet-20241022-v2:0" >> .env
echo "ENABLE_AI_FEATURES=true" >> .env
```

### Step 2: Start Services (2 minutes)
```bash
# Start everything with Docker Compose
docker-compose up -d

# Wait for services to be ready
sleep 10

# Run database migrations
docker-compose exec postgres psql -U insurratex -d insurratex \
  -f /docker-entrypoint-initdb.d/migrations/001_add_ai_features.sql
```

### Step 3: Verify It Works (1 minute)
```bash
# Test 1: List pre-loaded schemas
curl http://localhost:3000/api/v1/schemas/library | jq

# Expected: 3 schemas (guidewire, cdm, earnix)

# Test 2: Generate AI suggestions
curl -X POST http://localhost:3000/api/v1/ai/mappings/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSchemaId": "770e8400-e29b-41d4-a716-446655440001",
    "targetSchemaId": "770e8400-e29b-41d4-a716-446655440002",
    "productLine": "general-liability"
  }' | jq

# Expected: JSON with suggestions array, confidence scores
```

### Step 4: Open UI (30 seconds)
```bash
# Open in browser
open http://localhost:5173

# Click "Create New Mapping"
# Select "AI-Powered" method
# Choose Guidewire → CDM
# Click "Generate Suggestions"
# Review and accept!
```

## ✅ What You Get

### 3 Creation Methods
1. **Manual** - Traditional full control
2. **Excel Upload** - Upload BA requirements file
3. **AI-Powered** - Automatic schema analysis

### Key Features
- ✨ AI-powered field mapping suggestions
- 📊 Confidence scoring (color-coded badges)
- 📁 Excel/CSV parsing
- 🔍 Schema comparison
- 📚 Pre-loaded schema library
- 🎯 Interactive preview modal
- 📝 Audit trail

## 📊 Test Data

### Create Test Excel File
Save as `test-mappings.xlsx`:

| Source Field Path | Target Field | Transformation Type | Business Rule | Sample Value |
|-------------------|--------------|---------------------|---------------|--------------|
| quoteNumber | policy.id | direct | | Q-2026-001 |
| insured.name | insured.name | direct | | Acme Corp |
| insured.state | insured.address.state | direct | | CA |

### Upload via API
```bash
curl -X POST http://localhost:3000/api/v1/ai/mappings/parse-excel \
  -F "file=@test-mappings.xlsx" | jq
```

## 🎯 Key Endpoints

```bash
# Schema Management
GET  /api/v1/schemas/library
GET  /api/v1/schemas/:id
POST /api/v1/schemas/upload

# AI Mappings
POST /api/v1/ai/mappings/generate
POST /api/v1/ai/mappings/parse-excel
POST /api/v1/ai/mappings/similarity

# Example: Calculate field similarity
curl -X POST http://localhost:3000/api/v1/ai/mappings/similarity \
  -H "Content-Type: application/json" \
  -d '{"path1": "insured.state", "path2": "insuredState"}' | jq
```

## 📖 Full Documentation

- **Setup Guide**: `docs/AI_FEATURES_SETUP.md`
- **Feature Docs**: `docs/AI_ENHANCED_MAPPING.md`
- **Status**: `docs/IMPLEMENTATION_STATUS.md`
- **Summary**: `IMPLEMENTATION_SUMMARY.md`

## 💡 Quick Tips

### Best Practices
1. Always review AI suggestions (don't blindly accept)
2. Use Excel template for complex mappings
3. Start with high-confidence suggestions (≥80%)
4. Add descriptions in schemas for better AI results
5. Monitor API costs (~$0.01 per request)

### Troubleshooting
```bash
# Check services are running
docker-compose ps

# View orchestrator logs
docker-compose logs -f orchestrator

# Verify database
docker-compose exec postgres psql -U insurratex -d insurratex \
  -c "SELECT COUNT(*) FROM schemas;"
# Expected: 3

# Check AWS credentials are set
docker-compose exec orchestrator env | grep AWS
docker-compose exec orchestrator env | grep BEDROCK
docker-compose exec orchestrator env | grep ENABLE_AI
```

## 🎓 Next Steps

1. **Test with Real Data**
   - Upload your actual schemas
   - Try with production Guidewire payloads
   - Test all 3 creation methods

2. **Train Your Team**
   - Show BAs the Excel template
   - Demo the preview modal
   - Explain confidence scores

3. **Monitor & Optimize**
   - Track suggestion acceptance rates
   - Monitor API costs
   - Gather BA feedback
   - Iterate on prompts

4. **Scale Up**
   - Add more schemas to library
   - Implement JIRA integration (Phase 2)
   - Deploy to production (K8s)
   - Enable for all product lines

## 💰 Cost Estimate

**Typical Usage:**
- 1,000 mappings/month = $10-20/month
- 10,000 mappings/month = $100-200/month

**Very affordable for enterprise use!**

## 🆘 Need Help?

1. Check logs: `docker-compose logs orchestrator`
2. Verify DB: `psql -U insurratex -d insurratex`
3. Test API: `curl http://localhost:3000/api/v1/schemas/library`
4. Read docs: `docs/AI_FEATURES_SETUP.md`

## 🎉 Success!

If you see schemas listed and AI suggestions generating, you're ready to go!

**Platform Status: ✅ Production-Ready for Pilot**

---

Made with ❤️ by the InsurRateX team
