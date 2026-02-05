#!/bin/bash

# View the Master Field Catalog
# Usage: ./view-catalog.sh [category]
#
# Examples:
#   ./view-catalog.sh           # View all fields
#   ./view-catalog.sh policy    # View policy fields only
#   ./view-catalog.sh coverage  # View coverage fields only

CATEGORY=${1:-}

echo "📚 Master Field Catalog"
echo ""

if [ -z "$CATEGORY" ]; then
    # Show all fields
    echo "Fetching all fields from catalog..."
    echo ""
    curl -s http://localhost:3000/api/v1/field-catalog | jq -r '.data[] | "[\(.category | ascii_upcase)] \(.displayName) (\(.fieldName)) - \(.dataType) \(if .isRequired then "⚠️  REQUIRED" else "" end)"' | column -t

    echo ""
    echo "Categories available:"
    curl -s http://localhost:3000/api/v1/field-catalog/categories | jq -r '.data[]' | sort
else
    # Show specific category
    echo "Fetching $CATEGORY fields..."
    echo ""
    curl -s "http://localhost:3000/api/v1/field-catalog/category/$CATEGORY" | jq -r '.data[] | "\(.displayName) (\(.fieldName))\n  Type: \(.dataType)\n  Required: \(.isRequired)\n  Description: \(.description // "N/A")\n  Sample: \(.sampleValue // "N/A")\n"'
fi

echo ""
echo "💡 Tip: Use the Browse Field Catalog button in the Mapping UI to see all fields visually!"
