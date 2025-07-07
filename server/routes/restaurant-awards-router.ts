/**
 * Router for restaurant awards API endpoints
 */

import { Router, Request, Response } from 'express';
import { checkPerplexityApiAvailability, getRestaurantAwards } from '../services/perplexity-service';
import { storage } from '../storage';

const restaurantAwardsRouter = Router();

/**
 * GET /api/awards/status
 * Check if the awards service is available
 */
restaurantAwardsRouter.get('/status', async (req: Request, res: Response) => {
  try {
    const status = await checkPerplexityApiAvailability();
    res.json(status);
  } catch (error: any) {
    console.error('Error checking awards service:', error);
    res.status(500).json({
      available: false,
      message: `Error checking awards service: ${error.message}`
    });
  }
});

/**
 * GET /api/awards/restaurant/:id
 * Get awards for a specific restaurant
 */
restaurantAwardsRouter.get('/restaurant/:id', async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id);
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: 'Invalid restaurant ID' });
    }

    // Check if Perplexity API is configured
    const status = await checkPerplexityApiAvailability();
    if (!status.available) {
      // Return 202 Accepted with a message that the service is not yet available
      return res.status(202).json({
        message: 'Awards service is not yet configured',
        apiConfigured: false
      });
    }

    // Get restaurant details from database
    const restaurant = await storage.getRestaurant(restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    // Get awards using Perplexity API
    const awards = await getRestaurantAwards(restaurant.name, restaurant.address);

    res.json({
      restaurantId,
      restaurantName: restaurant.name,
      awards,
      apiConfigured: true
    });
  } catch (error: any) {
    console.error('Error fetching restaurant awards:', error);
    res.status(500).json({ error: `Error fetching restaurant awards: ${error.message}` });
  }
});

export default restaurantAwardsRouter;