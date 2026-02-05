#!/bin/bash

# Show status of all services

echo "📊 InsurRateX Services Status"
echo ""
echo "Containers:"
docker ps -a --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "NAMES|insurratex"

echo ""
echo "🌐 Access Points:"
echo "   • Mapping UI:        http://localhost:8080"
echo "   • Rules UI:          http://localhost:8081"
echo "   • Orchestrator API:  http://localhost:3000/health"
echo "   • PostgreSQL:        localhost:5432"
echo ""
echo "📚 API Endpoints:"
echo "   • Field Catalog:     http://localhost:3000/api/v1/field-catalog"
echo "   • Data Types:        http://localhost:3000/api/v1/data-types"
echo "   • Mappings:          http://localhost:3000/api/v1/mappings"
echo ""

# Test if services are responding
echo "🔍 Health Checks:"
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "   ✅ Orchestrator API is responding"
else
    echo "   ❌ Orchestrator API is not responding"
fi

if curl -s http://localhost:8080 > /dev/null 2>&1; then
    echo "   ✅ Mapping UI is responding"
else
    echo "   ❌ Mapping UI is not responding"
fi

echo ""
