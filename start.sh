#!/bin/bash
# Production start script for Railway

# Set production environment
export NODE_ENV=production

# Install tsx globally if not available and start the server
npx tsx server/index.ts