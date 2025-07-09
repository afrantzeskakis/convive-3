/**
 * Simple script to check which DATABASE_URL is being used
 */

console.log("=== DATABASE URL CHECK ===\n");

// Check all database-related environment variables
console.log("DATABASE_URL:", process.env.DATABASE_URL ? 
  process.env.DATABASE_URL.replace(/:\/\/[^@]*@/, '://***@').substring(0, 80) + '...' : 
  'NOT SET'
);

console.log("PGDATABASE:", process.env.PGDATABASE || 'NOT SET');
console.log("POSTGRES_DB:", process.env.POSTGRES_DB || 'NOT SET');
console.log("PGHOST:", process.env.PGHOST || 'NOT SET');

// Show which one the app is using
console.log("\n=== ACTIVE DATABASE ===");
console.log("The app uses DATABASE_URL, which points to:");
if (process.env.DATABASE_URL) {
  const parts = process.env.DATABASE_URL.split('@')[1]?.split('/');
  console.log("Host:", parts?.[0]?.split(':')[0]);
  console.log("Database:", parts?.[1]?.split('?')[0]);
} else {
  console.log("DATABASE_URL is not set!");
}

console.log("\n=== ENVIRONMENT ===");
console.log("Running on:", process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 'Local/Replit');