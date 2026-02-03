#!/bin/bash

echo "======================================"
echo "Building and Testing AI Integration"
echo "======================================"
echo ""

# Step 1: Build AI Services
echo "Step 1: Installing and building AI services..."
cd packages/ai-services
npm install
npm run build
cd ../..
echo "✅ AI services built successfully"
echo ""

# Step 2: Install Orchestrator Dependencies
echo "Step 2: Installing orchestrator dependencies..."
cd apps/orchestrator
npm install
cd ../..
echo "✅ Orchestrator dependencies installed"
echo ""

# Step 3: Rebuild Orchestrator Docker Image
echo "Step 3: Rebuilding orchestrator Docker image..."
docker-compose build orchestrator
echo "✅ Docker image rebuilt"
echo ""

# Step 4: Restart Orchestrator
echo "Step 4: Restarting orchestrator service..."
docker-compose restart orchestrator
echo "✅ Service restarted"
echo ""

# Wait for service to be ready
echo "Waiting 10 seconds for service to initialize..."
sleep 10
echo ""

# Step 5: Check AI Initialization
echo "Step 5: Checking AI Services initialization..."
echo "Looking for AI Services log..."
docker-compose logs orchestrator | grep "AI Services"
echo ""

echo "======================================"
echo "Build complete! Ready to test."
echo "======================================"
echo ""
echo "To test the AI endpoints, run:"
echo ""
echo "1. Test Mapping Suggestions:"
echo "   ./test-mapping-ai.sh"
echo ""
echo "2. Test Rule Generation:"
echo "   ./test-rule-ai.sh"
echo ""
echo "Or check logs:"
echo "   docker-compose logs -f orchestrator"
