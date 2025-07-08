#!/bin/bash

echo "🔍 Testing Railway Production Login"
echo "=================================="

# Get the Railway URL from user
echo -n "Enter your Railway URL (e.g., https://your-app.up.railway.app): "
read RAILWAY_URL

# Remove trailing slash if present
RAILWAY_URL=${RAILWAY_URL%/}

echo ""
echo "Testing login endpoint..."
echo "Username: superadmin"
echo "Password: convive2023"
echo ""

# Test the login
response=$(curl -s -w "\n%{http_code}" -X POST "$RAILWAY_URL/api/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"superadmin","password":"convive2023"}' \
  -c cookies.txt)

# Extract body and status code
body=$(echo "$response" | sed '$d')
status_code=$(echo "$response" | tail -n1)

echo "Response Status: $status_code"
echo "Response Body:"
echo "$body" | jq . 2>/dev/null || echo "$body"

# If login was successful, test auth status
if [ "$status_code" = "200" ] || [ "$status_code" = "201" ]; then
    echo ""
    echo "✅ Login successful! Testing auth status..."
    curl -s "$RAILWAY_URL/api/user" -b cookies.txt | jq . 2>/dev/null || curl -s "$RAILWAY_URL/api/user" -b cookies.txt
else
    echo ""
    echo "❌ Login failed with status $status_code"
fi

# Clean up
rm -f cookies.txt
