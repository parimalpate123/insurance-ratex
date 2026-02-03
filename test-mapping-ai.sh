#!/bin/bash

echo "======================================"
echo "Testing AI Mapping Suggestions"
echo "======================================"
echo ""

curl -X POST http://localhost:3000/api/v1/ai/suggest-mappings \
  -H "Content-Type: application/json" \
  -d '{
    "sourceFields": [
      {"path": "quoteNumber", "name": "quoteNumber", "type": "string"},
      {"path": "insuredName", "name": "insuredName", "type": "string"},
      {"path": "effectiveDate", "name": "effectiveDate", "type": "date"},
      {"path": "totalPremium", "name": "totalPremium", "type": "number"}
    ],
    "targetFields": [
      {"path": "policyId", "name": "policyId", "type": "string"},
      {"path": "name", "name": "name", "type": "string"},
      {"path": "effectiveDate", "name": "effectiveDate", "type": "date"},
      {"path": "premium", "name": "premium", "type": "number"}
    ],
    "sourceSystem": "guidewire",
    "targetSystem": "CDM",
    "productLine": "general-liability"
  }' | jq '.'

echo ""
echo "======================================"
