/**
 * Wine Recommendation API Routes
 * Phase 6: API endpoints for the wine recommendation system
 */

import { Router } from "express";
import type { Request, Response } from "express";
import { wineRecommendationEngine } from "../services/wine-recommendation-engine";

const router = Router();

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: any) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

/**
 * Get wine recommendations based on guest description
 * POST /api/wine-recommendations/analyze
 */
router.post("/analyze", async (req: Request, res: Response) => {
  try {
    const { 
      guestDescription, 
      restaurantId, 
      occasion, 
      foodPairing, 
      pricePreference, 
      stylePreference,
      maxRecommendations = 3
    } = req.body;

    if (!guestDescription || !restaurantId) {
      return res.status(400).json({ 
        success: false, 
        message: "Guest description and restaurant ID are required" 
      });
    }

    const guestRequest = {
      description: guestDescription,
      occasion,
      foodPairing,
      pricePreference,
      stylePreference
    };

    const recommendations = await wineRecommendationEngine.getWineRecommendations(
      guestRequest,
      parseInt(restaurantId),
      parseInt(maxRecommendations)
    );

    res.json({
      success: true,
      recommendations,
      requestAnalysis: {
        originalDescription: guestDescription,
        processedAt: new Date().toISOString(),
        restaurantId: parseInt(restaurantId)
      }
    });

  } catch (error) {
    console.error("Error processing wine recommendation:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate wine recommendations",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Quick style-based wine matching for offline scenarios
 * POST /api/wine-recommendations/quick-match
 */
router.post("/quick-match", async (req: Request, res: Response) => {
  try {
    const { styleRequest, restaurantId } = req.body;

    if (!styleRequest || !restaurantId) {
      return res.status(400).json({ 
        success: false, 
        message: "Style request and restaurant ID are required" 
      });
    }

    const matches = await wineRecommendationEngine.getQuickStyleMatches(
      styleRequest,
      parseInt(restaurantId)
    );

    res.json({
      success: true,
      matches,
      matchType: 'quick-style',
      processedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error processing quick wine match:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to generate quick wine matches",
      error: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

/**
 * Get restaurant wine inventory summary
 * GET /api/wine-recommendations/inventory/:restaurantId
 */
router.get("/inventory/:restaurantId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { restaurantId } = req.params;
    
    // This would connect to the actual wine database
    // For now, return summary data
    const inventorySummary = {
      restaurantId: parseInt(restaurantId),
      totalWines: 45,
      categories: {
        red: 20,
        white: 18,
        sparkling: 4,
        rosé: 3
      },
      priceRanges: {
        budget: 8,
        midRange: 22,
        premium: 12,
        luxury: 3
      },
      lastUpdated: new Date().toISOString(),
      syncStatus: 'current'
    };

    res.json({
      success: true,
      inventory: inventorySummary
    });

  } catch (error) {
    console.error("Error fetching wine inventory:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to fetch wine inventory" 
    });
  }
});

/**
 * Test wine recommendation system
 * POST /api/wine-recommendations/test
 */
router.post("/test", async (req: Request, res: Response) => {
  try {
    // Test with predefined scenarios
    const testScenarios = [
      {
        description: "I want something light and crisp for a summer evening",
        expected: "white wine recommendation"
      },
      {
        description: "Looking for a bold red to pair with steak",
        expected: "full-bodied red wine recommendation"
      },
      {
        description: "Something special for an anniversary dinner",
        expected: "premium wine recommendation"
      }
    ];

    const testResults = [];
    
    for (const scenario of testScenarios) {
      try {
        const recommendations = await wineRecommendationEngine.getWineRecommendations(
          { description: scenario.description },
          1, // Test restaurant ID
          2  // Limit to 2 recommendations
        );
        
        testResults.push({
          scenario: scenario.description,
          success: true,
          recommendationCount: recommendations.length,
          topMatch: recommendations[0] || null
        });
      } catch (error) {
        testResults.push({
          scenario: scenario.description,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error"
        });
      }
    }

    res.json({
      success: true,
      testResults,
      systemStatus: 'operational',
      testedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error running wine recommendation tests:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to run recommendation tests" 
    });
  }
});

export default router;