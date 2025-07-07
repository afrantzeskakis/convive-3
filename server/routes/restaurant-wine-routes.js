// Restaurant Wine Management Routes
import { Router } from 'express';
import { Pool } from '@neondatabase/serverless';
import { completeRestaurantWineEnrichment } from '../services/restaurant-wine-enrichment.js';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Basic authentication middleware placeholder
const requireAuth = (req, res, next) => {
  // For super admin testing, allow access
  req.user = { id: 1, role: 'super_admin' };
  next();
};

// Get restaurant wine statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const restaurantId = 1; // Default for testing
    
    const totalResult = await pool.query(
      'SELECT COUNT(*) as count FROM restaurant_wines_isolated WHERE restaurant_id = $1',
      [restaurantId]
    );
    
    const enrichedResult = await pool.query(
      'SELECT COUNT(*) as count FROM restaurant_wines_isolated WHERE restaurant_id = $1 AND enrichment_status = $2',
      [restaurantId, 'completed']
    );
    
    const total = parseInt(totalResult.rows[0].count);
    const enriched = parseInt(enrichedResult.rows[0].count);
    
    res.json({
      total,
      enriched,
      premium: enriched,
      completionPercentage: total > 0 ? Math.round((enriched / total) * 100) : 0
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Get all restaurant wines
router.get('/', requireAuth, async (req, res) => {
  try {
    const restaurantId = 1; // Default for testing
    
    const result = await pool.query(
      'SELECT * FROM restaurant_wines_isolated WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [restaurantId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching wines:', error);
    res.status(500).json({ error: 'Failed to fetch wines' });
  }
});

// Upload wine list
router.post('/upload', requireAuth, async (req, res) => {
  try {
    const restaurantId = 1; // Default for testing
    const { wines } = req.body;
    
    if (!wines || !Array.isArray(wines)) {
      return res.status(400).json({ error: 'Invalid wine list format' });
    }
    
    let added = 0;
    let duplicates = 0;
    const addedWines = [];
    
    for (const wine of wines) {
      if (!wine.wine_name || !wine.producer) {
        continue;
      }
      
      // Check for duplicates
      const existing = await pool.query(
        'SELECT id FROM restaurant_wines_isolated WHERE restaurant_id = $1 AND wine_name = $2 AND producer = $3',
        [restaurantId, wine.wine_name, wine.producer]
      );
      
      if (existing.rows.length > 0) {
        duplicates++;
        continue;
      }
      
      // Insert new wine
      const result = await pool.query(
        `INSERT INTO restaurant_wines_isolated 
         (restaurant_id, wine_name, producer, vintage, region, country, varietals, wine_type, menu_price, cost_price, inventory_count, wine_list_category)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
        [
          restaurantId,
          wine.wine_name,
          wine.producer,
          wine.vintage,
          wine.region,
          wine.country,
          wine.varietals,
          wine.wine_type,
          wine.menu_price,
          wine.cost_price,
          wine.inventory_count || 0,
          wine.wine_list_category
        ]
      );
      
      addedWines.push(result.rows[0]);
      added++;
    }
    
    res.json({
      message: 'Wine list uploaded successfully',
      added,
      duplicates,
      wines: addedWines
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload wine list' });
  }
});

// Start wine enrichment process
router.post('/enrich', requireAuth, async (req, res) => {
  try {
    const restaurantId = 1; // Default for testing
    
    // Get pending wines for enrichment
    const pendingWines = await pool.query(
      'SELECT * FROM restaurant_wines_isolated WHERE restaurant_id = $1 AND enrichment_status = $2 LIMIT 5',
      [restaurantId, 'pending']
    );
    
    if (pendingWines.rows.length === 0) {
      return res.json({ message: 'No wines pending enrichment', processed: 0 });
    }
    
    // Start background enrichment process
    processWinesInBackground(pendingWines.rows);
    
    res.json({
      message: 'Enrichment process started',
      processed: pendingWines.rows.length,
      wines: pendingWines.rows.map(w => ({
        id: w.id,
        wine_name: w.wine_name,
        producer: w.producer
      }))
    });
  } catch (error) {
    console.error('Enrichment error:', error);
    res.status(500).json({ error: 'Failed to start enrichment process' });
  }
});

// Background wine processing
async function processWinesInBackground(wines) {
  for (const wine of wines) {
    try {
      console.log(`Starting enrichment for wine ID: ${wine.id}`);
      
      // Update status to processing
      await pool.query(
        'UPDATE restaurant_wines_isolated SET enrichment_status = $1 WHERE id = $2',
        ['processing', wine.id]
      );
      
      // Perform AI enrichment
      const enrichmentData = await completeRestaurantWineEnrichment(wine);
      
      // Update wine with enrichment data
      await pool.query(
        `UPDATE restaurant_wines_isolated SET 
         tasting_notes = $1, flavor_notes = $2, aroma_notes = $3, wine_rating = $4,
         what_makes_special = $5, body_description = $6, food_pairing = $7,
         serving_temp = $8, aging_potential = $9, verified = $10, verified_source = $11,
         enrichment_status = $12, updated_at = CURRENT_TIMESTAMP
         WHERE id = $13`,
        [
          enrichmentData.tasting_notes,
          enrichmentData.flavor_notes, 
          enrichmentData.aroma_notes,
          enrichmentData.wine_rating,
          enrichmentData.what_makes_special,
          enrichmentData.body_description,
          enrichmentData.food_pairing,
          enrichmentData.serving_temp,
          enrichmentData.aging_potential,
          enrichmentData.verified,
          enrichmentData.verified_source,
          enrichmentData.enrichment_status,
          wine.id
        ]
      );
      
      console.log(`✓ Completed enrichment for wine ID: ${wine.id}`);
      
    } catch (error) {
      console.error(`Failed to enrich wine ID ${wine.id}:`, error);
      
      // Mark as failed
      await pool.query(
        'UPDATE restaurant_wines_isolated SET enrichment_status = $1 WHERE id = $2',
        ['failed', wine.id]
      );
    }
  }
}

export default router;