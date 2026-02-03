#!/bin/bash

echo "======================================"
echo "Testing AI Rule Generation"
echo "======================================"
echo ""

curl -X POST http://localhost:3000/api/v1/ai/generate-rule \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Apply 10% surcharge if annual revenue exceeds 5 million dollars",
    "productLine": "general-liability",
    "context": {
      "availableFields": ["annualRevenue", "premium", "state", "employeeCount"],
      "operators": ["==", "!=", ">", "<", ">=", "<="],
      "actions": ["surcharge", "discount", "reject"]
    }
  }' | jq '.'

echo ""
echo "======================================"
echo ""
echo "Test another rule:"
echo ""

curl -X POST http://localhost:3000/api/v1/ai/generate-rule \
  -H "Content-Type: application/json" \
  -d '{
    "description": "For Texas commercial auto policies, apply 8% commission if premium is greater than 5000, otherwise 6%",
    "productLine": "commercial-auto",
    "context": {
      "availableFields": ["state", "premium", "productLine"],
      "operators": ["==", "!=", ">", "<"],
      "actions": ["commission", "surcharge"]
    }
  }' | jq '.'

echo ""
echo "======================================"
