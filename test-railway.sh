#!/bin/bash

# Replace this with your actual Railway URL
RAILWAY_URL="https://your-app.up.railway.app"

echo "Testing Railway Production"
echo "========================="
echo ""

# Test login
echo "1. Testing login endpoint..."
curl -X POST "$RAILWAY_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"convive2023"}' \
  -i -s | head -20

echo ""
echo ""
echo "2. Testing health check..."
curl -s "$RAILWAY_URL/api/user" -i | head -10

echo ""
echo ""
echo "3. Testing if server is running..."
curl -s -o /dev/null -w "%{http_code}" "$RAILWAY_URL/"
