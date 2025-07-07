#!/bin/bash
# Custom build script for Railway that handles alias imports

# Install dependencies
npm ci

# Build the client with NODE_ENV set to production
# This ensures Vite uses the correct configuration
export NODE_ENV=production
npm run build:client

echo "Build completed successfully"