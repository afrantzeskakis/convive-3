import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { eq, desc } from 'drizzle-orm';
import { restaurants, insertRestaurantSchema, recipes } from '@shared/schema';
import { z } from 'zod';
import { onRestaurantCreated, updateRestaurantAwards } from '../services/restaurant-awards-service';

const router = Router();

// Create a new restaurant
router.post('/', async (req: Request, res: Response) => {
  try {
    // Validate input
    const restaurantData = insertRestaurantSchema.parse(req.body);
    
    // Create restaurant
    const newRestaurant = await storage.createRestaurant(restaurantData);
    
    // Trigger background award search (don't wait for it to complete)
    onRestaurantCreated(newRestaurant.id).catch(error => {
      console.error(`Error finding awards for new restaurant ${newRestaurant.id}:`, error);
    });
    
    res.status(201).json(newRestaurant);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: "Invalid restaurant data", errors: error.errors });
    } else {
      console.error("Error creating restaurant:", error);
      res.status(500).json({ message: "Failed to create restaurant" });
    }
  }
});

// Get all restaurants
router.get('/', async (_req: Request, res: Response) => {
  try {
    const restaurants = await storage.getAllRestaurants();
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching restaurants:", error);
    res.status(500).json({ message: "Failed to fetch restaurants" });
  }
});

// Get featured restaurants
router.get('/featured', async (req: Request, res: Response) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 4;
    const restaurants = await storage.getFeaturedRestaurants(limit);
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching featured restaurants:", error);
    res.status(500).json({ message: "Failed to fetch featured restaurants" });
  }
});

// Get restaurants managed by the logged-in admin
router.get('/managed-by-me', async (req: Request, res: Response) => {
  try {
    console.log('=== RESTAURANT ACCESS DEBUG ===');
    console.log('User authenticated:', req.isAuthenticated());
    console.log('User data:', req.user);
    console.log('User role:', req.user?.role);
    
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Super admins can access all restaurants
    if (req.user.role === "super_admin") {
      console.log('Super admin access granted - fetching all restaurants');
      const allRestaurants = await storage.getAllRestaurants();
      console.log('Found restaurants:', allRestaurants.length);
      return res.json(allRestaurants);
    }
    
    // Restaurant admins can only access restaurants they manage
    if (req.user.role !== "restaurant_admin") {
      console.log('Access denied for role:', req.user.role);
      return res.status(403).json({ message: "Access denied. Restaurant admin role required." });
    }
    
    const restaurants = await storage.getRestaurantsByManagerId(req.user.id);
    res.json(restaurants);
  } catch (error) {
    console.error("Error fetching managed restaurants:", error);
    res.status(500).json({ message: "Failed to fetch managed restaurants" });
  }
});

// Get a specific restaurant
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const restaurant = await storage.getRestaurant(restaurantId);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error("Error fetching restaurant:", error);
    res.status(500).json({ message: "Failed to fetch restaurant" });
  }
});

// Update restaurant featured status
router.patch('/:id/featured', async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const { isFeatured } = req.body;
    
    if (typeof isFeatured !== 'boolean') {
      return res.status(400).json({ message: "isFeatured field must be a boolean" });
    }
    
    const restaurant = await storage.updateRestaurantFeaturedStatus(restaurantId, isFeatured);
    
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    res.json(restaurant);
  } catch (error) {
    console.error("Error updating restaurant featured status:", error);
    res.status(500).json({ message: "Failed to update restaurant featured status" });
  }
});

// Get wines for a specific restaurant with search capabilities
router.get('/:id/wines/search', async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id);
    const { q, type, region } = req.query;
    
    // Import restaurant wine storage
    const { restaurantWineStorage } = await import('../storage/restaurant-wine-storage');
    
    // Get all wines for this restaurant
    let wines = await restaurantWineStorage.getWinesByRestaurant(restaurantId);
    
    // Apply search filter if provided
    if (q && typeof q === 'string') {
      const searchTerm = q.toLowerCase().trim();
      wines = wines.filter(wine => {
        if (!wine) return false;
        
        const searchableText = [
          wine.wine_name || '',
          wine.producer || '',
          wine.region || '',
          wine.varietals || '',
          wine.vintage?.toString() || ''
        ].join(' ').toLowerCase();
        
        // For single words, use simple includes
        if (!searchTerm.includes(' ')) {
          return searchableText.includes(searchTerm);
        }
        
        // For multi-word searches, check if all parts are found
        const searchParts = searchTerm.split(' ').filter(part => part.length > 0);
        return searchParts.every(part => searchableText.includes(part));
      });
    }
    
    // Apply wine type filter if provided
    if (type && type !== 'all' && typeof type === 'string') {
      wines = wines.filter(wine => wine && wine.wine_type?.toLowerCase() === type.toLowerCase());
    }
    
    // Apply region filter if provided
    if (region && region !== 'all' && typeof region === 'string') {
      wines = wines.filter(wine => wine && wine.region?.toLowerCase().includes(region.toLowerCase()));
    }
    
    res.json(wines);
  } catch (error) {
    console.error("Error fetching restaurant wines:", error);
    res.status(500).json({ message: "Failed to fetch restaurant wines" });
  }
});

// Get recipes for a specific restaurant
router.get('/:id/recipes', async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.id);
    
    // Get all recipes for this restaurant
    const allRecipes = await db.select()
      .from(recipes)
      .where(eq(recipes.restaurantId, restaurantId))
      .orderBy(desc(recipes.createdAt));
    
    res.json(allRecipes);
  } catch (error) {
    console.error("Error fetching restaurant recipes:", error);
    res.status(500).json({ message: "Failed to fetch restaurant recipes" });
  }
});

// Manually update restaurant awards
router.post('/:id/refresh-awards', async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated and is at least restaurant admin
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Only restaurant admins and super admins can refresh awards
    if (req.user.role !== "restaurant_admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    
    const restaurantId = parseInt(req.params.id);
    
    // Check if restaurant exists
    const [restaurant] = await db
      .select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId));
      
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    
    // Refresh awards
    const success = await updateRestaurantAwards(restaurantId);
    
    if (success) {
      // Get updated restaurant data
      const [updatedRestaurant] = await db
        .select()
        .from(restaurants)
        .where(eq(restaurants.id, restaurantId));
        
      res.json({ 
        message: "Restaurant awards refreshed successfully", 
        restaurant: updatedRestaurant
      });
    } else {
      res.status(500).json({ message: "Failed to refresh restaurant awards" });
    }
  } catch (error) {
    console.error("Error refreshing restaurant awards:", error);
    res.status(500).json({ message: "Failed to refresh restaurant awards" });
  }
});

export default router;