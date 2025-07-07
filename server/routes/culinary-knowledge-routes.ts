import { Router } from "express";
import { culinaryKnowledgeService } from "../services/culinary-knowledge-service";

const router = Router();

// Get cached terms for a restaurant
router.get("/cached-terms/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    const terms = await culinaryKnowledgeService.getCachedTerms(restaurantId);
    const stats = await culinaryKnowledgeService.getCacheStats(restaurantId);

    res.json({
      terms,
      stats
    });
  } catch (error) {
    console.error("Error fetching cached terms:", error);
    res.status(500).json({ error: "Failed to fetch cached terms" });
  }
});

// Regenerate content for all terms in a restaurant
router.post("/regenerate-cache/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    // Start background processing to avoid HTTP timeout
    setImmediate(async () => {
      try {
        console.log(`Starting background cache regeneration for restaurant ${restaurantId}`);
        await culinaryKnowledgeService.regenerateRestaurantCache(restaurantId);
        console.log(`Completed background cache regeneration for restaurant ${restaurantId}`);
      } catch (error) {
        console.error(`Background cache regeneration failed for restaurant ${restaurantId}:`, error);
      }
    });

    res.json({ message: "Cache regeneration started in background" });
  } catch (error) {
    console.error("Error starting cache regeneration:", error);
    res.status(500).json({ error: "Failed to start cache regeneration" });
  }
});

// Regenerate content for a specific term
router.post("/regenerate-term/:termId", async (req, res) => {
  try {
    const termId = parseInt(req.params.termId);
    
    if (isNaN(termId)) {
      return res.status(400).json({ error: "Invalid term ID" });
    }

    await culinaryKnowledgeService.regenerateTermContent(termId);

    res.json({ message: "Term content regenerated successfully" });
  } catch (error) {
    console.error("Error regenerating term content:", error);
    res.status(500).json({ error: "Failed to regenerate term content" });
  }
});

// Clear cache for a restaurant
router.delete("/clear-cache/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    await culinaryKnowledgeService.clearRestaurantCache(restaurantId);

    res.json({ message: "Cache cleared successfully" });
  } catch (error) {
    console.error("Error clearing cache:", error);
    res.status(500).json({ error: "Failed to clear cache" });
  }
});

// Get content performance metrics
router.get("/metrics/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    const metrics = await culinaryKnowledgeService.getContentMetrics(restaurantId);

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching content metrics:", error);
    res.status(500).json({ error: "Failed to fetch content metrics" });
  }
});

// Phase 7: Get term relationships (cross-term relationship mapping)
router.get("/relationships/:restaurantId/:term", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const term = req.params.term;
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    const relationships = await culinaryKnowledgeService.getTermRelationships(term, restaurantId);

    res.json({
      term,
      relationships,
      count: relationships.length
    });
  } catch (error) {
    console.error("Error fetching term relationships:", error);
    res.status(500).json({ error: "Failed to fetch term relationships" });
  }
});

// Phase 7: Get term combinations (multi-term combination explanations)
router.post("/combinations/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { terms } = req.body;
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    if (!Array.isArray(terms) || terms.length < 2) {
      return res.status(400).json({ error: "At least 2 terms required for combination analysis" });
    }

    const combinations = await culinaryKnowledgeService.getTermCombinations(terms, restaurantId);

    res.json({
      inputTerms: terms,
      combinations,
      count: combinations.length
    });
  } catch (error) {
    console.error("Error fetching term combinations:", error);
    res.status(500).json({ error: "Failed to fetch term combinations" });
  }
});

// Phase 7: Get seasonal context (seasonal content relevance)
router.get("/seasonal/:restaurantId/:term", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const term = req.params.term;
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    const seasonalContext = await culinaryKnowledgeService.getSeasonalContext(term, restaurantId);

    res.json({
      term,
      seasonalContext
    });
  } catch (error) {
    console.error("Error fetching seasonal context:", error);
    res.status(500).json({ error: "Failed to fetch seasonal context" });
  }
});

// Phase 7: Get staff training content (staff training mode integration)
router.post("/staff-training/:restaurantId/:term", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const term = req.params.term;
    const { staffRole, trainingLevel, focusAreas } = req.body;
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    if (!staffRole || !trainingLevel) {
      return res.status(400).json({ error: "Staff role and training level are required" });
    }

    const staffContext = {
      staffRole,
      trainingLevel,
      focusAreas: focusAreas || []
    };

    const trainingContent = await culinaryKnowledgeService.getStaffTrainingContent(term, restaurantId, staffContext);

    res.json({
      term,
      staffContext,
      trainingContent
    });
  } catch (error) {
    console.error("Error fetching staff training content:", error);
    res.status(500).json({ error: "Failed to fetch staff training content" });
  }
});

// Phase 7: Add restaurant-specific terminology
router.post("/restaurant-terminology/:restaurantId", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const { terminology } = req.body;
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    if (!Array.isArray(terminology)) {
      return res.status(400).json({ error: "Terminology must be an array of term objects" });
    }

    await culinaryKnowledgeService.addRestaurantSpecificTerminology(restaurantId, terminology);

    res.json({
      message: "Restaurant-specific terminology added successfully",
      termsAdded: terminology.length
    });
  } catch (error) {
    console.error("Error adding restaurant terminology:", error);
    res.status(500).json({ error: "Failed to add restaurant terminology" });
  }
});

// Phase 7: Get comprehensive term data with all advanced features
router.get("/advanced/:restaurantId/:term", async (req, res) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const term = req.params.term;
    
    if (isNaN(restaurantId)) {
      return res.status(400).json({ error: "Invalid restaurant ID" });
    }

    // Get complete term data including relationships, combinations, and seasonal context
    const termData = await culinaryKnowledgeService.getCulinaryTermDefinition(term, restaurantId);

    if (!termData) {
      return res.status(404).json({ error: "Term not found or could not be generated" });
    }

    res.json({
      term,
      termData,
      features: {
        relationships: termData.relationships?.length || 0,
        combinations: termData.combinations?.length || 0,
        seasonalContext: !!termData.seasonalContext,
        carouselSlides: termData.carouselContent.length
      }
    });
  } catch (error) {
    console.error("Error fetching advanced term data:", error);
    res.status(500).json({ error: "Failed to fetch advanced term data" });
  }
});

export { router as culinaryKnowledgeRoutes };