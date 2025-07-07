import { pool, db } from "../server/db";
import { sql } from "drizzle-orm";

async function updateRestaurantSchema() {
  try {
    console.log("Updating restaurants table to add awards column...");

    // Add the awards column if it doesn't exist
    await db.execute(sql`
      ALTER TABLE restaurants 
      ADD COLUMN IF NOT EXISTS awards JSONB
    `);

    console.log("Restaurant schema updated successfully!");
    
    return true;
  } catch (error) {
    console.error("Error updating restaurant schema:", error);
    return false;
  } finally {
    await pool.end();
  }
}

// Run the function
updateRestaurantSchema()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Script failed:", error);
    process.exit(1);
  });