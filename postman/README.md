# Postman Collection for InsurRateX

Pre-configured Postman collection for testing all InsurRateX APIs locally.

## Quick Start

### 1. Import Collection

1. Open Postman (download from https://www.postman.com/downloads/)
2. Click **Import** button (top left)
3. Select **File** tab
4. Choose `InsurRateX-Local.postman_collection.json`
5. Click **Import**

### 2. Start Services

```bash
# Make sure Docker services are running
docker-compose up -d

# Wait for services to start
sleep 30

# Verify health
curl http://localhost:3000/health
```

### 3. Run Tests

1. In Postman, select **Collections** → **InsurRateX - Local Testing**
2. Click **Run** button (top right)
3. Select all requests
4. Click **Run InsurRateX - Local Testing**

## Collection Structure

### 📁 Health Checks (3 requests)
- Orchestrator Health
- Guidewire Mock Health
- Earnix Mock Health

### 📁 Orchestrator API (7 requests)
- Execute Rating - Basic GL
- Execute Rating - California
- Execute Rating - Texas
- Execute Rating - New York
- Execute Rating - High Revenue
- Execute Rating - No Rules
- Execute Rating - Property

### 📁 Guidewire Mock API (2 requests)
- Submit Policy
- Get Policy

### 📁 Earnix Mock API (2 requests)
- Rate Policy
- Get Rate Table

### 📁 Error Scenarios (3 requests)
- Invalid Source System
- Missing Required Fields
- Invalid JSON

**Total: 17 requests**

## Test Scenarios

### Scenario 1: Basic Rating Flow

**Steps:**
1. Run "Orchestrator Health" - verify 200 OK
2. Run "Execute Rating - Basic GL" - verify 200 OK
3. Check response has:
   - `success: true`
   - `totalPremium` (number > 0)
   - `premiumBreakdown` object
   - `metadata.steps` array with 4 steps

### Scenario 2: State Comparison

**Steps:**
1. Run "Execute Rating - California"
2. Run "Execute Rating - Texas"
3. Run "Execute Rating - New York"
4. Compare `totalPremium` values

**Expected:** NY > CA > TX (due to territorial surcharges)

### Scenario 3: Business Rules Testing

**Steps:**
1. Run "Execute Rating - High Revenue"
   - Check `premiumBreakdown.rulesApplied` contains "High Revenue Surcharge"
2. Run "Execute Rating - No Rules"
   - Check `premiumBreakdown.rulesApplied` is empty or minimal

**Expected:** High Revenue has higher premium due to surcharge

### Scenario 4: Direct Service Testing

**Steps:**
1. Run "Guidewire Mock API → Submit Policy"
   - Verify 200 OK and `success: true`
2. Run "Guidewire Mock API → Get Policy"
   - Verify policy details returned
3. Run "Earnix Mock API → Rate Policy"
   - Verify premium calculation
4. Run "Earnix Mock API → Get Rate Table"
   - Verify rate table for class code 91580

### Scenario 5: Error Handling

**Steps:**
1. Run "Error Scenarios → Invalid Source System"
   - Expect 400 or 500 error
2. Run "Error Scenarios → Missing Required Fields"
   - Expect validation error
3. Run "Error Scenarios → Invalid JSON"
   - Expect 400 Bad Request

## Variables

The collection uses these variables (pre-configured for local):

- `{{baseUrl}}` = http://localhost:3000
- `{{guidewireUrl}}` = http://localhost:3001
- `{{earnixUrl}}` = http://localhost:4001

To test against different environments, update these variables.

## Expected Response Times

- Health checks: < 100ms
- Basic rating: < 2 seconds
- With rules: < 3 seconds
- Direct service calls: < 500ms

## Response Validation

Each request should return:

### Health Checks
```json
{
  "status": "ok",
  "service": "service-name",
  "version": "1.0.0"
}
```

### Rating Execution
```json
{
  "success": true,
  "requestId": "...",
  "totalPremium": 15689.94,
  "premiumBreakdown": {
    "basePremium": 12500.00,
    "adjustments": [...],
    "rulesApplied": [...]
  },
  "metadata": {
    "executionTime": 1523,
    "steps": [...]
  }
}
```

## Troubleshooting

### Connection Refused

**Problem:** Postman shows "Could not get response"

**Solution:**
```bash
# Check services are running
docker-compose ps

# Check specific service
curl http://localhost:3000/health

# Restart if needed
docker-compose restart orchestrator
```

### 500 Internal Server Error

**Problem:** API returns 500 error

**Solution:**
```bash
# Check orchestrator logs
docker-compose logs orchestrator | tail -50

# Verify mock services are running
curl http://localhost:3001/health
curl http://localhost:4001/health
```

### Timeout Errors

**Problem:** Requests timeout

**Solution:**
1. Increase timeout in Postman settings
2. Check if services are under heavy load
3. Restart services

### Invalid Response

**Problem:** Response doesn't match expected format

**Solution:**
1. Check request body is valid JSON
2. Verify all required fields are present
3. Check service logs for errors

## Running Tests via Newman (CLI)

You can also run the collection from command line:

```bash
# Install Newman
npm install -g newman

# Run collection
newman run InsurRateX-Local.postman_collection.json

# Run with detailed output
newman run InsurRateX-Local.postman_collection.json \
  --reporters cli,json \
  --reporter-json-export results.json

# Run specific folder
newman run InsurRateX-Local.postman_collection.json \
  --folder "Health Checks"
```

## Automated Testing

### Run All Tests

```bash
# Using Newman
newman run InsurRateX-Local.postman_collection.json \
  --bail \
  --delay-request 500

# Expected output:
# ✓ Orchestrator Health
# ✓ Guidewire Mock Health
# ✓ Earnix Mock Health
# ...
# ┌─────────────────────────┬───────────────────┐
# │                         │          executed │
# ├─────────────────────────┼───────────────────┤
# │              iterations │                 1 │
# ├─────────────────────────┼───────────────────┤
# │                requests │                17 │
# ├─────────────────────────┼───────────────────┤
# │            test-scripts │                 0 │
# ├─────────────────────────┼───────────────────┤
# │      prerequest-scripts │                 0 │
# ├─────────────────────────┼───────────────────┤
# │              assertions │                 0 │
# ├─────────────────────────┴───────────────────┤
# │ total run duration: 15.2s                   │
# ├─────────────────────────────────────────────┤
# │ total data received: 8.5KB (approx)         │
# └─────────────────────────────────────────────┘
```

## Tips

1. **Use Variables**: Collection variables make it easy to switch environments
2. **Save Examples**: Save response examples for documentation
3. **Add Tests**: Use Postman test scripts to automate validation
4. **Environment Setup**: Create different environments (dev, staging, prod)
5. **Monitor**: Set up Postman monitors for continuous testing

## Adding Custom Tests

You can add test scripts to validate responses:

```javascript
// In Postman Tests tab
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
});

pm.test("Total premium is positive", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData.totalPremium).to.be.above(0);
});
```

## Next Steps

1. **Run all requests** to verify complete functionality
2. **Save responses** as examples for documentation
3. **Create environment** for production testing
4. **Add test scripts** for automated validation
5. **Set up monitoring** for continuous testing

## Support

For issues or questions:
1. Check [TESTING_INSTRUCTIONS.md](../TESTING_INSTRUCTIONS.md)
2. Review service logs
3. Consult [API.md](../docs/API.md)

---

**Happy Testing!** 🚀

Use this collection to quickly test and validate all InsurRateX APIs.
