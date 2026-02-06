#!/bin/bash

# Test script for Rating API
# Tests all endpoints with sample data

API_URL="http://localhost:3002"
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "🧪 Testing InsurRateX Rating API"
echo "================================"
echo ""

# Test 1: Health Check
echo "${BLUE}Test 1: Health Check${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/health)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "${GREEN}✓ Health check passed${NC}"
    echo "$body" | jq '.'
else
    echo "${RED}✗ Health check failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 2: Get Product Lines
echo "${BLUE}Test 2: Get Product Lines${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/v1/product-lines)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "${GREEN}✓ Get product lines passed${NC}"
    count=$(echo "$body" | jq 'length')
    echo "Found $count product line(s)"
else
    echo "${RED}✗ Get product lines failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 3: Get Specific Product Line
echo "${BLUE}Test 3: Get GL_EXISTING Product Line${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/v1/product-lines/GL_EXISTING)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "${GREEN}✓ Get GL_EXISTING passed${NC}"
    echo "$body" | jq '{code: .code, name: .name, status: .status}'
else
    echo "${RED}✗ Get GL_EXISTING failed (HTTP $http_code)${NC}"
fi
echo ""

# Test 4: Execute Rating
echo "${BLUE}Test 4: Execute Rating for GL_EXISTING${NC}"
response=$(curl -s -w "\n%{http_code}" \
  -X POST ${API_URL}/api/v1/rating/GL_EXISTING/execute \
  -H "Content-Type: application/json" \
  -d @test-examples/rating-request-gl.json)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "${GREEN}✓ Rating execution passed${NC}"
    echo "$body" | jq '{success: .success, premium: .result.premium, executionTimeMs: .metadata.executionTimeMs}'
    echo ""
    echo "Workflow steps:"
    echo "$body" | jq '.metadata.steps[]'
else
    echo "${RED}✗ Rating execution failed (HTTP $http_code)${NC}"
    echo "$body" | jq '.'
fi
echo ""

# Test 5: Get Templates
echo "${BLUE}Test 5: Get Templates${NC}"
response=$(curl -s -w "\n%{http_code}" ${API_URL}/api/v1/product-lines/templates)
http_code=$(echo "$response" | tail -n 1)
body=$(echo "$response" | head -n -1)

if [ "$http_code" = "200" ]; then
    echo "${GREEN}✓ Get templates passed${NC}"
    count=$(echo "$body" | jq 'length')
    echo "Found $count template(s)"
    echo "$body" | jq '.[] | {code: .code, name: .name}'
else
    echo "${RED}✗ Get templates failed (HTTP $http_code)${NC}"
fi
echo ""

echo "================================"
echo "✅ Testing complete!"
echo ""
echo "View full API docs at: ${BLUE}${API_URL}/api/docs${NC}"
