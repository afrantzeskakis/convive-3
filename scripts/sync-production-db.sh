#!/bin/bash

# Script to sync production database with local schema
# Run this after making schema changes

echo "🔄 Syncing production database with local schema..."

# Push current schema to database (creates missing tables)
echo "📤 Pushing schema to database..."
npx drizzle-kit push

echo "✅ Database sync complete!"