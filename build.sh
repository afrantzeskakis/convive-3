#!/bin/bash

# Workaround for platform-specific dependency issues
echo "Installing dependencies..."
npm ci || npm install

# Install missing Rollup module if needed
echo "Checking for Rollup module..."
npm list @rollup/rollup-linux-x64-gnu || npm install @rollup/rollup-linux-x64-gnu

# Reinstall Sharp for Linux platform
echo "Reinstalling Sharp for Linux..."
npm uninstall sharp
npm install sharp --platform=linux --arch=x64

# Build the client
echo "Building client..."
npm run build:client

echo "Build complete!"