import { execSync } from 'child_process';

/**
 * Generate and push database migrations
 * This ensures local schema changes are reflected in production
 */
async function generateAndPushMigrations() {
  try {
    console.log("🔄 Generating migrations from schema...");
    
    // Generate migration files from current schema
    execSync('npm run db:generate', { stdio: 'inherit' });
    
    console.log("📤 Pushing migrations to database...");
    
    // Apply migrations to database
    execSync('npm run db:push', { stdio: 'inherit' });
    
    console.log("✅ Migrations successfully generated and applied!");
    
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  generateAndPushMigrations();
}

export { generateAndPushMigrations };