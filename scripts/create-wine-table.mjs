/**
 * Script to create the wines table for the sommelier application
 */

import pg from 'pg';
const { Pool } = pg;

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createWineTable() {
  try {
    console.log('Creating/verifying wines table...');
    
    // SQL to create the wine table with proper schema
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS wines (
        id SERIAL PRIMARY KEY,
        cache_key TEXT UNIQUE NOT NULL,
        wine_name TEXT NOT NULL,
        vintage TEXT,
        producer TEXT,
        region TEXT,
        country TEXT,
        varietals TEXT,
        wine_data JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS wines_wine_name_idx ON wines (wine_name);
      CREATE INDEX IF NOT EXISTS wines_vintage_idx ON wines (vintage);
      CREATE INDEX IF NOT EXISTS wines_producer_idx ON wines (producer);
      CREATE INDEX IF NOT EXISTS wines_region_idx ON wines (region);
      CREATE INDEX IF NOT EXISTS wines_country_idx ON wines (country);
    `;
    
    await pool.query(createTableSQL);
    
    // Check if wines table exists and has records
    const checkResult = await pool.query('SELECT COUNT(*) FROM wines');
    const count = parseInt(checkResult.rows[0].count);
    
    console.log(`Wines table is ready. Current record count: ${count}`);
    return { success: true, message: 'Wines table created/verified successfully', count };
    
  } catch (error) {
    console.error('Error creating wines table:', error);
    return { success: false, message: `Error: ${error.message}` };
  } finally {
    // Close the pool
    await pool.end();
  }
}

// Run the script
createWineTable()
  .then(result => {
    console.log(result.message);
    process.exit(result.success ? 0 : 1);
  })
  .catch(err => {
    console.error('Uncaught error:', err);
    process.exit(1);
  });