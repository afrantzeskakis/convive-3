#!/bin/bash
# Custom build script for Railway that handles alias imports

# Install all dependencies (including devDependencies)
npm ci

# Build the client
npm run build:client

# Keep all dependencies for runtime (tsx needs them)
echo "Build completed successfully"