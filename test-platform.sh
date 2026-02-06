#!/bin/bash

# InsurRateX - Test Platform
# Quick tests to verify everything is working

set -e

echo "🧪 Testing InsurRateX Platform"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Test function
test_endpoint() {
    local name=$1
    local url=$2
    local expected_code=${3:-200}

    echo -n "Testing $name... "

    response=$(curl -s -w "\n%{http_code}" "$url" 2>/dev/null || echo "0")
    http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "$expected_code" ]; then
        echo "${GREEN}✓ PASS${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo "${RED}✗ FAIL${NC} (HTTP $http_code, expected $expected_code)"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "${BLUE}Testing Backend (Rating API)${NC}"
echo "----------------------------"
test_endpoint "Health Check" "http://localhost:3002/health"
test_endpoint "Get Product Lines" "http://localhost:3002/api/v1/product-lines"
test_endpoint "Get Templates" "http://localhost:3002/api/v1/product-lines/templates"
echo ""

echo "${BLUE}Testing Frontend (Admin UI)${NC}"
echo "---------------------------"
test_endpoint "Admin UI Home" "http://localhost:5173"
echo ""

echo "${BLUE}Testing Rating Execution${NC}"
echo "-----------------------"
echo -n "Executing sample rating... "

result=$(curl -s -X POST http://localhost:3002/api/v1/rating/GL_EXISTING/execute \
  -H "Content-Type: application/json" \
  -d '{
    "data": {
      "quoteNumber": "TEST-001",
      "productCode": "GL",
      "insured": {
        "name": "Test Company",
        "state": "CA",
        "annualRevenue": 5000000
      }
    }
  }' 2>/dev/null || echo '{"success":false}')

if echo "$result" | grep -q '"success":true'; then
    echo "${GREEN}✓ PASS${NC}"
    TESTS_PASSED=$((TESTS_PASSED + 1))
    echo "  Platform is working correctly!"
else
    echo "${RED}✗ FAIL${NC}"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi
echo ""

# Summary
echo "=============================="
echo "${GREEN}Tests Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo "${RED}Tests Failed: $TESTS_FAILED${NC}"
else
    echo "${GREEN}Tests Failed: 0${NC}"
fi
echo "=============================="
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo "${GREEN}✅ All tests passed! Platform is working correctly.${NC}"
    echo ""
    echo "🎉 You can now use:"
    echo "  Admin UI:  http://localhost:5173"
    echo "  API Docs:  http://localhost:3002/api/docs"
    exit 0
else
    echo "${RED}❌ Some tests failed. Please check the logs:${NC}"
    echo "  docker-compose logs rating-api"
    echo "  docker-compose logs admin-ui"
    exit 1
fi
