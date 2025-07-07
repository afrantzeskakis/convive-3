#!/bin/bash

# Workaround for platform-specific dependency issues
echo "Installing dependencies..."
npm ci || npm install

# Install missing Rollup module if needed
echo "Checking for Rollup module..."
npm list @rollup/rollup-linux-x64-gnu || npm install @rollup/rollup-linux-x64-gnu

# Rebuild Sharp for Linux platform
echo "Rebuilding Sharp for Linux..."
npm rebuild sharp

# Build the client
echo "Building client..."
npm run build:client

echo "Build complete!"