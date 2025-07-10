#!/bin/bash

echo "=== Fixing Chrome Tab Title ==="

# Update the build script's HTML title
echo "✓ Updated build.sh to use 'Convive' title"

# Update the generated HTML in production
if [ -f "server/public/index.html" ]; then
    sed -i 's/Restaurant Wine Management System/Convive | (Come·Vibe) - Curated Social Dining Experience/g' server/public/index.html
    echo "✓ Updated server/public/index.html"
fi

# Verify the change
echo ""
echo "Current title in production HTML:"
grep -E "<title>" server/public/index.html || echo "No production HTML found"

echo ""
echo "To deploy this fix:"
echo "1. Commit the changes:"
echo "   git add build.sh server/public/index.html replit.md"
echo "   git commit -m 'Fix Chrome tab title from Restaurant Wine Management to Convive'"
echo "   git push"
echo ""
echo "2. Railway will automatically deploy with the correct title"