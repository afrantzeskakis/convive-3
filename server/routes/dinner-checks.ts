import { Router } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { DEFAULT_HIGH_CHECK_THRESHOLD } from "../../shared/constants";

const router = Router();

// Schema for dinner check creation
const createDinnerCheckSchema = z.object({
  meetupId: z.number(),
  restaurantId: z.number(),
  hostId: z.number(),
  totalBillAmount: z.number().positive(),
  participantCount: z.number().positive(),
  checkAveragePerPerson: z.number().positive(),
  notes: z.string().nullable().optional()
});

// Get all dinner checks that the user is authorized to see
router.get("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    // Super admins and admins can see all checks
    // Restaurant admins can only see checks for their restaurants
    // Restaurant users (hosts) can only see checks they're assigned to
    
    let checks;
    if (req.user.role === 'super_admin' || req.user.role === 'admin') {
      checks = await storage.getAllDinnerChecks();
    } else if (req.user.role === 'restaurant_admin') {
      const userRestaurants = await storage.getRestaurantsByAdminId(req.user.id);
      const restaurantIds = userRestaurants.map(r => r.id);
      checks = await storage.getDinnerChecksByRestaurantIds(restaurantIds);
    } else if (req.user.role === 'restaurant_user') {
      checks = await storage.getDinnerChecksByHostId(req.user.id);
    } else {
      // Regular users cannot see dinner checks
      return res.status(403).json({ message: "Not authorized to view dinner checks" });
    }
    
    // Add flag for high roller checks (above threshold per person)
    const checksWithFlags = checks.map(check => ({
      ...check,
      isHighCheckAverage: parseFloat(check.checkAveragePerPerson) > DEFAULT_HIGH_CHECK_THRESHOLD
    }));
    
    res.json(checksWithFlags);
  } catch (error) {
    console.error("Error fetching dinner checks:", error);
    res.status(500).json({ message: "Error fetching dinner checks" });
  }
});

// Create a new dinner check
router.post("/", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Validate input
    const parsedData = createDinnerCheckSchema.safeParse(req.body);
    if (!parsedData.success) {
      return res.status(400).json({ message: "Invalid input data", errors: parsedData.error.errors });
    }
    
    // Only restaurant admins and restaurant users can create dinner checks
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin' && 
        req.user.role !== 'restaurant_admin' && req.user.role !== 'restaurant_user') {
      return res.status(403).json({ message: "Not authorized to create dinner checks" });
    }
    
    // Check if the restaurant exists and user is authorized
    if (req.user.role === 'restaurant_admin' || req.user.role === 'restaurant_user') {
      const userRestaurants = await storage.getRestaurantsByAdminId(req.user.id);
      const restaurantIds = userRestaurants.map(r => r.id);
      
      if (!restaurantIds.includes(parsedData.data.restaurantId)) {
        return res.status(403).json({ message: "Not authorized for this restaurant" });
      }
    }
    
    // Create the dinner check
    const newCheck = await storage.createDinnerCheck({
      ...parsedData.data,
      reportedBy: req.user.id,
      reportedAt: new Date(),
      // Set default dates for overdue tracking
      inputDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      inputRequiredBy: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      inputProvided: true,
      isOverdue: false,
      notificationSent: false
    });
    
    // Create individual dinner check entries for each participant
    const meetup = await storage.getMeetup(parsedData.data.meetupId);
    if (meetup) {
      const participants = await storage.getMeetupParticipants(parsedData.data.meetupId);
      
      for (const participant of participants) {
        // Track each participant's check amount
        await storage.updateUser(participant.userId, {
          averageSpendPerDinner: parseFloat(parsedData.data.checkAveragePerPerson.toString())
        });
        
        // Increment user's dinner count
        const user = await storage.getUser(participant.userId);
        if (user) {
          const isHighCheck = parseFloat(parsedData.data.checkAveragePerPerson.toString()) > DEFAULT_HIGH_CHECK_THRESHOLD;
          await storage.updateUser(participant.userId, {
            dinnerCount: (user.dinnerCount || 0) + 1,
            highCheckDinnerCount: isHighCheck ? (user.highCheckDinnerCount || 0) + 1 : (user.highCheckDinnerCount || 0)
          });
        }
      }
      
      // Now all participants' spending metrics are updated
    }
    
    res.status(201).json(newCheck);
  } catch (error) {
    console.error("Error creating dinner check:", error);
    res.status(500).json({ message: "Error creating dinner check" });
  }
});

// Get dinner check by ID
router.get("/:checkId", async (req, res) => {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    const checkId = parseInt(req.params.checkId);
    if (isNaN(checkId)) {
      return res.status(400).json({ message: "Invalid check ID" });
    }
    
    const check = await storage.getDinnerCheckById(checkId);
    if (!check) {
      return res.status(404).json({ message: "Dinner check not found" });
    }
    
    // Check authorization
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      if (req.user.role === 'restaurant_admin') {
        const userRestaurants = await storage.getRestaurantsByAdminId(req.user.id);
        const restaurantIds = userRestaurants.map(r => r.id);
        
        if (!restaurantIds.includes(check.restaurantId)) {
          return res.status(403).json({ message: "Not authorized to view this dinner check" });
        }
      } else if (req.user.role === 'restaurant_user' && check.hostId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to view this dinner check" });
      } else if (req.user.role === 'user') {
        return res.status(403).json({ message: "Not authorized to view dinner checks" });
      }
    }
    
    // Add high roller flag
    const checkWithFlag = {
      ...check,
      isHighCheckAverage: parseFloat(check.checkAveragePerPerson) > DEFAULT_HIGH_CHECK_THRESHOLD
    };
    
    res.json(checkWithFlag);
  } catch (error) {
    console.error("Error fetching dinner check:", error);
    res.status(500).json({ message: "Error fetching dinner check" });
  }
});

export default router;