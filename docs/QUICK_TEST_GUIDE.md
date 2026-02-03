# InsurRateX - Quick Test Guide

**5-Minute Quick Start** for testing InsurRateX locally

---

## Prerequisites ✅

- [x] Docker Desktop installed and running
- [x] 8GB+ RAM available
- [x] Ports 3000, 3001, 4001, 8080, 8081 free

---

## 1. Start Services (2 minutes)

```bash
cd rating-poc
docker-compose up -d
sleep 30  # Wait for services to start
```

---

## 2. Verify Health (30 seconds)

```bash
# Quick health check
curl http://localhost:3000/health  # Orchestrator
curl http://localhost:3001/health  # Guidewire
curl http://localhost:4001/health  # Earnix

# All should return: {"status":"ok",...}
```

---

## 3. Test Rating API (1 minute)

```bash
# Simple test
curl -X POST http://localhost:3000/api/v1/rating/execute \
  -H "Content-Type: application/json" \
  -d '{
    "sourceSystem": "guidewire",
    "ratingEngine": "earnix",
    "productLine": "general-liability",
    "policyData": {
      "quoteNumber": "Q-QUICK-001",
      "productCode": "GL",
      "insured": {
        "name": "Quick Test Co",
        "state": "CA",
        "annualRevenue": 5000000
      },
      "classification": {"code": "91580"},
      "coverages": [{"id": "cov-001", "limit": 2000000, "deductible": 5000}]
    }
  }' | python3 -m json.tool

# Expected: {"success": true, "totalPremium": 15689.94, ...}
```

---

## 4. Test UIs (1 minute)

Open in browser:
- **Mapping UI**: http://localhost:8080
- **Rules UI**: http://localhost:8081

---

## 5. Use Postman (Optional)

```bash
# Import collection
# File: postman/InsurRateX-Local.postman_collection.json

# Or test with Newman CLI:
npm install -g newman
newman run postman/InsurRateX-Local.postman_collection.json
```

---

## Common Commands

```bash
# View logs
docker-compose logs -f orchestrator

# Stop services
docker-compose down

# Rebuild and restart
docker-compose build && docker-compose up -d

# Full cleanup
docker-compose down -v
```

---

## Quick Test Results

✅ **All Healthy** - Services return 200 OK
✅ **Rating Works** - API returns premium calculation
✅ **UIs Load** - Browsers show interfaces
✅ **No Errors** - Logs show no errors

---

## Troubleshooting

**Services won't start?**
```bash
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

**Connection refused?**
```bash
# Wait longer
sleep 60

# Check status
docker-compose ps
```

**Need help?**
- See: [TESTING_INSTRUCTIONS.md](TESTING_INSTRUCTIONS.md)
- Check: `docker-compose logs`

---

## Full Test Suite

For complete testing, see:
- **[TESTING_INSTRUCTIONS.md](TESTING_INSTRUCTIONS.md)** - Detailed guide
- **[postman/README.md](postman/README.md)** - Postman collection
- **[tests/e2e/](tests/e2e/)** - Automated tests

---

## Service URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **Orchestrator** | http://localhost:3000 | Main API |
| **Mapping UI** | http://localhost:8080 | Visual mapper |
| **Rules UI** | http://localhost:8081 | Rules editor |
| Guidewire Mock | http://localhost:3001 | Test system |
| Earnix Mock | http://localhost:4001 | Test engine |

---

## Success Criteria

Your platform is working when:
- [x] All 5 services start without errors
- [x] Health checks return 200 OK
- [x] Rating API calculates premiums
- [x] UIs load in browser
- [x] No errors in logs

---

**That's it! You're ready to test InsurRateX.** 🎉

For advanced testing, see [TESTING_INSTRUCTIONS.md](TESTING_INSTRUCTIONS.md)
