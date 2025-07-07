import { db } from '../server/db';
import { recipes, recipeAnalyses, recipeTrainingData } from '../shared/schema';
import { promises as fs } from 'fs';
import * as path from 'path';

/**
 * Script to create recipe analysis and training tables
 */
async function createRecipeTables() {
  console.log("Creating recipe database tables...");

  try {
    // Create uploads directory for recipe images
    const uploadsDir = path.join(process.cwd(), 'uploads', 'recipes');
    await fs.mkdir(uploadsDir, { recursive: true });
    console.log(`Created uploads directory: ${uploadsDir}`);

    // Create tables using Drizzle schema
    await db.execute(`
      CREATE TABLE IF NOT EXISTS recipes (
        id SERIAL PRIMARY KEY,
        restaurant_id INTEGER NOT NULL REFERENCES restaurants(id),
        name TEXT NOT NULL,
        description TEXT,
        dish_type TEXT,
        cuisine TEXT,
        recipe_text TEXT,
        original_file_path TEXT,
        file_type TEXT,
        is_image BOOLEAN DEFAULT FALSE,
        status VARCHAR(50) DEFAULT 'pending' NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created recipes table");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS recipe_analyses (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id),
        ingredients JSONB,
        techniques JSONB,
        allergen_summary JSONB,
        dietary_restriction_summary JSONB,
        ai_generated BOOLEAN DEFAULT TRUE,
        confidence DECIMAL(5,2),
        feedback_rating INTEGER,
        feedback_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created recipe_analyses table");

    await db.execute(`
      CREATE TABLE IF NOT EXISTS recipe_training_data (
        id SERIAL PRIMARY KEY,
        recipe_id INTEGER NOT NULL REFERENCES recipes(id),
        analysis_id INTEGER NOT NULL REFERENCES recipe_analyses(id),
        training_set_id TEXT,
        include_in_training BOOLEAN DEFAULT TRUE,
        training_result JSONB,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created recipe_training_data table");

    // Create AI cache table for storing recipe analysis results
    await db.execute(`
      CREATE TABLE IF NOT EXISTS ai_recipe_cache (
        id SERIAL PRIMARY KEY,
        recipe_text TEXT NOT NULL,
        analysis_result JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("Created ai_recipe_cache table");

    console.log("All recipe database tables created successfully");
  } catch (error) {
    console.error("Error creating recipe tables:", error);
    throw error;
  }
}

// Run the function
createRecipeTables()
  .then(() => {
    console.log("Recipe tables setup complete!");
    process.exit(0);
  })
  .catch(error => {
    console.error("Failed to create recipe tables:", error);
    process.exit(1);
  });