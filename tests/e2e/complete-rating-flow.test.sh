#!/bin/bash

# End-to-End Rating Flow Test
# Tests the complete flow: Guidewire → CDM → Rules → Earnix

set -e

echo "🧪 InsurRateX End-to-End Test Suite"
echo "===================================="
echo ""

# Configuration
ORCHESTRATOR_URL="${ORCHESTRATOR_URL:-http://localhost:3000}"
GUIDEWIRE_URL="${GUIDEWIRE_URL:-http://localhost:3001}"
EARNIX_URL="${EARNIX_URL:-http://localhost:4001}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name=$1
    local url=$2
    local method=$3
    local data=$4
    local expected_status=${5:-200}

    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "Testing: $test_name... "

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$url")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$url" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')

    if [ "$http_code" -eq "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}✗ FAILED${NC} (Expected HTTP $expected_status, got $http_code)"
        echo "Response: $body"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

echo "Step 1: Health Checks"
echo "---------------------"
run_test "Orchestrator health" "$ORCHESTRATOR_URL/health" "GET"
run_test "Guidewire mock health" "$GUIDEWIRE_URL/health" "GET"
run_test "Earnix mock health" "$EARNIX_URL/health" "GET"
echo ""

echo "Step 2: Guidewire Mock - Submit for Rating"
echo "------------------------------------------"
GUIDEWIRE_PAYLOAD='{
  "quoteNumber": "Q-E2E-TEST-001",
  "productCode": "GL",
  "effectiveDate": "2026-03-01",
  "expirationDate": "2027-03-01",
  "insured": {
    "name": "E2E Test Company",
    "businessType": "MFG",
    "addressLine1": "123 Test Street",
    "city": "San Francisco",
    "state": "CA",
    "postalCode": "94102",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },
  "classification": {
    "code": "91580"
  },
  "primaryContact": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "415-555-1234"
  },
  "coverages": [
    {
      "id": "cov-001",
      "limit": 2000000,
      "deductible": 5000,
      "primary": true
    }
  ]
}'

run_test "Submit to Guidewire" "$GUIDEWIRE_URL/pc/rating/submit" "POST" "$GUIDEWIRE_PAYLOAD"
echo ""

echo "Step 3: Earnix Mock - Direct Rating"
echo "-----------------------------------"
EARNIX_PAYLOAD='{
  "requestId": "rate-e2e-test-001",
  "productLine": "general-liability",
  "productVersion": "gl-v1.2",
  "insured": {
    "state": "CA",
    "businessType": "manufacturing",
    "annualRevenue": 5000000,
    "employeeCount": 50
  },
  "coverages": [
    {
      "type": "general-liability",
      "limit": 2000000,
      "deductible": 5000
    }
  ],
  "ratingFactors": {
    "classCode": "91580",
    "yearsInBusiness": 10,
    "claimsHistory": {
      "priorClaimsCount": 0,
      "priorClaimsAmount": 0
    }
  }
}'

run_test "Rate with Earnix" "$EARNIX_URL/earnix/api/v1/rate" "POST" "$EARNIX_PAYLOAD"
echo ""

echo "Step 4: Orchestrator - Complete E2E Flow"
echo "----------------------------------------"
ORCHESTRATOR_PAYLOAD='{
  "sourceSystem": "guidewire",
  "ratingEngine": "earnix",
  "productLine": "general-liability",
  "requestId": "e2e-test-001",
  "applyRules": true,
  "policyData": {
    "quoteNumber": "Q-E2E-TEST-002",
    "productCode": "GL",
    "effectiveDate": "2026-03-01",
    "expirationDate": "2027-03-01",
    "insured": {
      "name": "E2E Test Company",
      "businessType": "MFG",
      "addressLine1": "123 Test Street",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "annualRevenue": 5000000,
      "employeeCount": 50
    },
    "classification": {
      "code": "91580"
    },
    "primaryContact": {
      "firstName": "Test",
      "lastName": "User",
      "email": "test@example.com"
    },
    "coverages": [
      {
        "id": "cov-001",
        "limit": 2000000,
        "deductible": 5000,
        "primary": true
      }
    ],
    "claimsHistory": {
      "count": 0,
      "totalAmount": 0,
      "years": 5
    }
  }
}'

echo "Testing complete orchestrated flow..."
response=$(curl -s -X POST "$ORCHESTRATOR_URL/api/v1/rating/execute" \
    -H "Content-Type: application/json" \
    -d "$ORCHESTRATOR_PAYLOAD")

echo "$response" | jq . 2>/dev/null || echo "$response"

# Validate response structure
if echo "$response" | jq -e '.success' > /dev/null 2>&1; then
    success=$(echo "$response" | jq -r '.success')
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✓ E2E Flow PASSED${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))

        total_premium=$(echo "$response" | jq -r '.totalPremium')
        execution_time=$(echo "$response" | jq -r '.metadata.executionTime')

        echo ""
        echo "Results:"
        echo "  Total Premium: \$$total_premium"
        echo "  Execution Time: ${execution_time}ms"
        echo "  Steps:"
        echo "$response" | jq -r '.metadata.steps[] | "    - \(.step): \(.duration)ms (\(if .success then "✓" else "✗" end))"'
    else
        echo -e "${RED}✗ E2E Flow FAILED${NC}"
        echo "Error: $(echo "$response" | jq -r '.error.message')"
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
else
    echo -e "${RED}✗ E2E Flow FAILED${NC}"
    echo "Invalid response format"
    TESTS_FAILED=$((TESTS_FAILED + 1))
fi

TESTS_RUN=$((TESTS_RUN + 1))
echo ""

echo "========================================"
echo "Test Summary"
echo "========================================"
echo "Total Tests: $TESTS_RUN"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
else
    echo "Failed: $TESTS_FAILED"
fi
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
