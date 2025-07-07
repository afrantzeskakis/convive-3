import { Request, Response, Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db';
import { wines, restaurantWines } from '../../shared/wine-schema';
import { restaurants } from '../../shared/schema';
import OpenAI from 'openai';

// Authentication middleware
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Authentication required" });
  }
  next();
};

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Middleware to validate restaurant access
const validateRestaurantAccess = async (req: Request, res: Response, next: Function) => {
  const restaurantId = parseInt(req.params.restaurantId);
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: "Authentication required" });
  }

  // Super admin: full access
  if (user.role === 'super_admin') {
    return next();
  }

  // Restaurant admin: check managed restaurants
  if (user.role === 'restaurant_admin') {
    const restaurant = await db.select()
      .from(restaurants)
      .where(eq(restaurants.id, restaurantId))
      .limit(1);

    if (restaurant.length > 0 && restaurant[0].managerId === user.id) {
      return next();
    }
  }

  // Restaurant user: check assigned restaurant
  if (user.authorizedRestaurants?.includes(restaurantId)) {
    return next();
  }

  return res.status(403).json({ message: "Access denied to this restaurant" });
};

// POST /api/restaurants/{id}/wine-pairing - Generate wine pairings for dishes
router.post('/:restaurantId/wine-pairing', isAuthenticated, validateRestaurantAccess, async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { dishes, preferences } = req.body;

    if (!dishes || !Array.isArray(dishes) || dishes.length === 0) {
      return res.status(400).json({ message: 'Dishes array is required' });
    }

    // Get restaurant's available wines with full details
    const availableWines = await db
      .select({
        id: wines.id,
        wine_name: wines.wine_name,
        producer: wines.producer,
        vintage: wines.vintage,
        region: wines.region,
        country: wines.country,
        wine_type: wines.wine_type,
        wine_style: wines.wine_style,
        tasting_notes: wines.tasting_notes,
        what_makes_special: wines.what_makes_special,
        wine_rating: wines.wine_rating,
        acidity: wines.acidity,
        tannins: wines.tannins,
        intensity: wines.intensity,
        sweetness: wines.sweetness,
        body_description: wines.body_description,
        flavor_notes: wines.flavor_notes,
        food_pairing: wines.food_pairing,
        restaurant_price: restaurantWines.price,
        by_the_glass: restaurantWines.by_the_glass,
        featured: restaurantWines.featured,
        inventory_count: restaurantWines.inventory_count
      })
      .from(restaurantWines)
      .innerJoin(wines, eq(restaurantWines.wine_id, wines.id))
      .where(and(
        eq(restaurantWines.restaurant_id, restaurantId),
        eq(restaurantWines.active, true)
      ));

    if (availableWines.length === 0) {
      return res.status(404).json({ message: 'No wines available in restaurant inventory' });
    }

    // Generate wine pairings using OpenAI with restaurant's wine inventory
    const pairings = await generateWinePairings(dishes, availableWines, preferences);

    res.json({
      restaurantId,
      dishes,
      totalWinesAvailable: availableWines.length,
      pairings
    });

  } catch (error) {
    console.error('Error generating wine pairings:', error);
    res.status(500).json({ message: 'Failed to generate wine pairings' });
  }
});

// POST /api/restaurants/{id}/wine-recommendation - Get wine recommendations by preferences
router.post('/:restaurantId/wine-recommendation', isAuthenticated, validateRestaurantAccess, async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { preferences, occasion, budget } = req.body;

    // Get restaurant's available wines
    const availableWines = await db
      .select({
        id: wines.id,
        wine_name: wines.wine_name,
        producer: wines.producer,
        vintage: wines.vintage,
        region: wines.region,
        wine_type: wines.wine_type,
        wine_style: wines.wine_style,
        tasting_notes: wines.tasting_notes,
        what_makes_special: wines.what_makes_special,
        wine_rating: wines.wine_rating,
        acidity: wines.acidity,
        tannins: wines.tannins,
        intensity: wines.intensity,
        sweetness: wines.sweetness,
        body_description: wines.body_description,
        flavor_notes: wines.flavor_notes,
        restaurant_price: restaurantWines.price,
        by_the_glass: restaurantWines.by_the_glass,
        featured: restaurantWines.featured
      })
      .from(restaurantWines)
      .innerJoin(wines, eq(restaurantWines.wine_id, wines.id))
      .where(and(
        eq(restaurantWines.restaurant_id, restaurantId),
        eq(restaurantWines.active, true)
      ));

    // Filter wines based on preferences
    let filteredWines = availableWines;

    if (preferences) {
      if (preferences.wine_type) {
        filteredWines = filteredWines.filter(wine => 
          wine.wine_type?.toLowerCase() === preferences.wine_type.toLowerCase()
        );
      }
      
      if (preferences.body) {
        filteredWines = filteredWines.filter(wine => 
          wine.body_description?.toLowerCase().includes(preferences.body.toLowerCase())
        );
      }
      
      if (preferences.region) {
        filteredWines = filteredWines.filter(wine => 
          wine.region?.toLowerCase().includes(preferences.region.toLowerCase())
        );
      }
    }

    // Generate recommendations using OpenAI
    const recommendations = await generateWineRecommendations(filteredWines, preferences, occasion, budget);

    res.json({
      restaurantId,
      preferences,
      totalWinesConsidered: filteredWines.length,
      recommendations
    });

  } catch (error) {
    console.error('Error generating wine recommendations:', error);
    res.status(500).json({ message: 'Failed to generate wine recommendations' });
  }
});

// Generate wine pairings using OpenAI
async function generateWinePairings(dishes: string[], availableWines: any[], preferences?: any) {
  const wineContext = availableWines.map(wine => ({
    id: wine.id,
    name: `${wine.producer} ${wine.wine_name} ${wine.vintage || ''}`.trim(),
    type: wine.wine_type,
    style: wine.wine_style,
    tasting_notes: wine.tasting_notes || '',
    food_pairing: wine.food_pairing || '',
    characteristics: {
      acidity: wine.acidity,
      tannins: wine.tannins,
      intensity: wine.intensity,
      sweetness: wine.sweetness,
      body: wine.body_description
    },
    restaurant_details: {
      price: wine.restaurant_price,
      by_the_glass: wine.by_the_glass,
      featured: wine.featured
    }
  }));

  const prompt = `As a professional sommelier, analyze these dishes and recommend wine pairings from the restaurant's available wine list.

DISHES TO PAIR:
${dishes.map((dish, i) => `${i + 1}. ${dish}`).join('\n')}

AVAILABLE WINES:
${wineContext.map(wine => `- ${wine.name} (${wine.type}): ${wine.tasting_notes || 'Classic characteristics'}`).join('\n')}

${preferences ? `GUEST PREFERENCES: ${JSON.stringify(preferences)}` : ''}

For each dish, recommend 2-3 wines from the available list and explain:
1. Why this pairing works (flavor interaction, complementary/contrasting elements)
2. What makes each wine special for this dish
3. Serving suggestions (temperature, glassware, order)

Format as JSON with this structure:
{
  "pairings": [
    {
      "dish": "dish name",
      "recommended_wines": [
        {
          "wine_id": number,
          "wine_name": "full wine name",
          "pairing_explanation": "detailed explanation",
          "confidence_score": 0.85,
          "serving_notes": "temperature and service tips"
        }
      ]
    }
  ],
  "sommelier_notes": "overall pairing philosophy and tips"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || '{}');
}

// Generate wine recommendations using OpenAI
async function generateWineRecommendations(availableWines: any[], preferences?: any, occasion?: string, budget?: string) {
  const wineContext = availableWines.slice(0, 50).map(wine => ({
    id: wine.id,
    name: `${wine.producer} ${wine.wine_name} ${wine.vintage || ''}`.trim(),
    type: wine.wine_type,
    style: wine.wine_style,
    tasting_notes: wine.tasting_notes || '',
    what_makes_special: wine.what_makes_special || '',
    rating: wine.wine_rating,
    price: wine.restaurant_price,
    by_the_glass: wine.by_the_glass,
    featured: wine.featured
  }));

  const prompt = `As a professional sommelier, recommend wines from this restaurant's collection based on the guest's preferences.

AVAILABLE WINES:
${wineContext.map(wine => `- ${wine.name} (${wine.type}): ${wine.tasting_notes || 'Classic style'} - Price: ${wine.price || 'Market price'}`).join('\n')}

${preferences ? `PREFERENCES: ${JSON.stringify(preferences)}` : ''}
${occasion ? `OCCASION: ${occasion}` : ''}
${budget ? `BUDGET: ${budget}` : ''}

Recommend 3-5 wines that best match the criteria. For each recommendation, explain:
1. Why it matches their preferences
2. What makes this wine special
3. Tasting experience they can expect
4. Value proposition

Format as JSON:
{
  "recommendations": [
    {
      "wine_id": number,
      "wine_name": "full wine name",
      "match_explanation": "why it fits preferences",
      "tasting_preview": "what to expect",
      "value_notes": "price/quality assessment",
      "confidence_score": 0.90
    }
  ],
  "sommelier_insights": "overall recommendations and guidance"
}`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
    temperature: 0.3
  });

  const content = response.choices[0].message.content;
  return JSON.parse(content || '{}');
}

export default router;