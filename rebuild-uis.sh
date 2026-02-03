#!/bin/bash

echo "======================================"
echo "Rebuilding UIs with AI Integration"
echo "======================================"
echo ""

echo "Step 1: Rebuilding Mapping UI..."
docker-compose build mapping-ui

echo ""
echo "Step 2: Rebuilding Rules UI..."
docker-compose build rules-ui

echo ""
echo "Step 3: Restarting services..."
docker-compose restart mapping-ui rules-ui

echo ""
echo "======================================"
echo "✅ UIs rebuilt successfully!"
echo "======================================"
echo ""
echo "Access the UIs at:"
echo "  Mapping UI: http://localhost:8080"
echo "  Rules UI: http://localhost:8081"
echo ""
echo "Features added:"
echo "  📍 Mapping UI: Click 'AI Suggest' button on any mapping"
echo "  ✨ Rules UI: Click 'Generate with AI' when creating a new conditional rule"
