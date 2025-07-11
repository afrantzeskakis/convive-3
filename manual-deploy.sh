#!/bin/bash

echo "=== Manual Deployment Script ==="
echo ""
echo "Since Railway CLI is not authenticated, follow these steps:"
echo ""
echo "1. COMMIT & PUSH (if connected to Git):"
echo "   git add server/public/assets/index.css"
echo "   git commit -m 'Fix CSS variables - remove hardcoded purple colors'"
echo "   git push"
echo ""
echo "2. OR use Railway Dashboard:"
echo "   - Go to https://railway.app/dashboard"
echo "   - Find your project"
echo "   - Click 'Deploy' or 'Redeploy'"
echo ""
echo "3. OR authenticate Railway CLI first:"
echo "   railway login"
echo "   railway up"
echo ""
echo "Current CSS file info:"
ls -lh server/public/assets/index.css
echo ""
echo "CSS was built at: $(date -r server/public/assets/index.css)"
echo ""
echo "To verify the fix worked locally, check if CSS contains variables:"
grep -c "hsl(var(--primary" server/public/assets/index.css | xargs echo "CSS variable references found:"
grep -c "hsl(262" server/public/assets/index.css | xargs echo "Hardcoded purple HSL values found:"