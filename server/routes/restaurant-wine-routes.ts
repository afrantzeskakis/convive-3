import { Router, Request, Response } from 'express';
import { completeRestaurantWineEnrichment } from '../services/restaurant-wine-enrichment';
import { isAuthenticated, isRestaurantAdmin, isRestaurantUser, getRestaurantId } from '../middleware/auth';
import { RestaurantWineStorage } from '../storage/restaurant-wine-storage';
import { User } from '@shared/schema';
import { insertRestaurantWineIsolatedSchema } from '@shared/wine-schema';
import { z } from 'zod';

const router = Router();
const wineStorage = new RestaurantWineStorage();

// Upload wine list for restaurant
router.post('/upload', isAuthenticated, isRestaurantAdmin, async (req: Request, res: Response) => {
  try {
    const restaurantId = getRestaurantId(req.user!);
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID not found' });
    }

    const { wines } = req.body;
    if (!wines || !Array.isArray(wines)) {
      return res.status(400).json({ message: 'Wine list is required' });
    }

    const result = await wineStorage.processWineListUpload(restaurantId, wines);
    
    const stats = await wineStorage.getRestaurantWineStats(restaurantId);

    res.json({
      message: 'Wine list processed successfully',
      stats: result,
      wineStats: stats
    });

  } catch (error: any) {
    console.error('Wine upload failed:', error);
    res.status(500).json({ message: 'Upload failed', error: error.message });
  }
});

// Start wine enrichment process
router.post('/enrich', isAuthenticated, isRestaurantAdmin, async (req: Request, res: Response) => {
  try {
    const restaurantId = getRestaurantId(req.user!);
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID not found' });
    }

    const { limit = 5 } = req.body;
    
    // Get wines pending enrichment
    const pendingWines = await wineStorage.getWinesPendingEnrichment(restaurantId, limit);
    
    if (pendingWines.length === 0) {
      return res.json({ 
        message: 'No wines pending enrichment',
        processed: 0
      });
    }

    // Start background enrichment process
    processWinesInBackground(pendingWines);

    res.json({
      message: 'Enrichment process started',
      processed: pendingWines.length,
      wines: pendingWines.map((w: any) => ({ 
        id: w.id, 
        wine_name: w.wine_name, 
        producer: w.producer 
      }))
    });

  } catch (error: any) {
    console.error('Wine enrichment failed:', error);
    res.status(500).json({ message: 'Enrichment failed', error: error.message });
  }
});

// Get restaurant wine list
router.get('/', isAuthenticated, isRestaurantUser, async (req: Request, res: Response) => {
  try {
    const restaurantId = getRestaurantId(req.user!);
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID not found' });
    }

    const wines = await wineStorage.getRestaurantWines(restaurantId);
    const stats = await wineStorage.getRestaurantWineStats(restaurantId);

    res.json({
      wines,
      stats
    });

  } catch (error: any) {
    console.error('Failed to fetch restaurant wines:', error);
    res.status(500).json({ message: 'Failed to fetch wines', error: error.message });
  }
});

// Get single wine details
router.get('/:id', isAuthenticated, isRestaurantUser, async (req: Request, res: Response) => {
  try {
    const restaurantId = getRestaurantId(req.user!);
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID not found' });
    }

    const wineId = parseInt(req.params.id);
    if (isNaN(wineId)) {
      return res.status(400).json({ message: 'Invalid wine ID' });
    }

    const wine = await wineStorage.getRestaurantWine(wineId, restaurantId);
    if (!wine) {
      return res.status(404).json({ message: 'Wine not found' });
    }

    res.json(wine);

  } catch (error: any) {
    console.error('Failed to fetch wine:', error);
    res.status(500).json({ message: 'Failed to fetch wine', error: error.message });
  }
});

// Delete wine from restaurant collection
router.delete('/:id', isAuthenticated, isRestaurantAdmin, async (req: Request, res: Response) => {
  try {
    const restaurantId = getRestaurantId(req.user!);
    if (!restaurantId) {
      return res.status(400).json({ message: 'Restaurant ID not found' });
    }

    const wineId = parseInt(req.params.id);
    if (isNaN(wineId)) {
      return res.status(400).json({ message: 'Invalid wine ID' });
    }

    const deleted = await wineStorage.deleteRestaurantWine(wineId, restaurantId);
    if (!deleted) {
      return res.status(404).json({ message: 'Wine not found' });
    }

    res.json({ message: 'Wine deleted successfully' });

  } catch (error: any) {
    console.error('Failed to delete wine:', error);
    res.status(500).json({ message: 'Failed to delete wine', error: error.message });
  }
});

// Background enrichment processing function
async function processWinesInBackground(wines: any[]) {
  for (const wine of wines) {
    try {
      console.log(`Starting enrichment for wine: ${wine.wine_name}`);
      
      // Update status to processing
      await wineStorage.updateWineEnrichment(wine.id, {
        enrichment_status: 'processing',
        enrichment_started_at: new Date()
      });

      // Run 5-stage enrichment
      const enrichmentData = await completeRestaurantWineEnrichment(wine);
      
      // Update wine with enrichment results
      await wineStorage.updateWineEnrichment(wine.id, enrichmentData);
      
      console.log(`Completed enrichment for wine: ${wine.wine_name}`);
      
    } catch (error) {
      console.error(`Enrichment failed for wine ${wine.wine_name}:`, error);
      
      // Mark as failed
      await wineStorage.updateWineEnrichment(wine.id, {
        enrichment_status: 'failed',
        enrichment_completed_at: new Date()
      });
    }
  }
}

export { router as restaurantWineRoutes };