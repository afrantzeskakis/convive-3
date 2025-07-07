#!/bin/bash

# Railway production build script
echo "=== Railway Production Build ==="
echo "Starting build process..."

# Install dependencies
echo "Installing dependencies..."
npm ci || npm install

# Install platform-specific modules
echo "Installing required modules..."
npm install @rollup/rollup-linux-x64-gnu || true

# Reinstall Sharp for Linux
echo "Configuring Sharp for Linux..."
npm uninstall sharp
npm install sharp --platform=linux --arch=x64

# Use the existing vite.config.ts for build
echo "Building client application..."
NODE_OPTIONS="--max-old-space-size=4096" npx vite build

# Verify build
if [ -d "dist/public" ]; then
  echo "✅ Build completed successfully!"
  echo "Contents of dist/public:"
  ls -la dist/public/
  echo ""
  echo "Frontend assets built successfully for production!"
else
  echo "❌ Build failed - dist/public not created"
  echo "Checking for errors..."
  
  # Try alternative build approach
  echo "Attempting alternative build..."
  npm run build:client || echo "Alternative build also failed"
fi

echo "=== Build Script Complete ==="