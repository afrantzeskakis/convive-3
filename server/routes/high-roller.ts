import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { users, dinnerTickets, userSubscriptions } from '@shared/schema';
import { isUserEligibleForHighRollerDinners, getHighRollerEligibleUsers } from '../services/high-roller-eligibility';

const router = Router();

// Check if user is a super admin
function isSuperAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  
  if (req.user.role !== "super_admin") {
    return res.status(403).json({ message: "Access denied. Super admin role required." });
  }
  
  next();
}

// Get all users eligible for high roller events
router.get('/eligible-users', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const eligibleUsers = await getHighRollerEligibleUsers();
    res.json(eligibleUsers);
  } catch (error) {
    console.error("Error fetching high roller eligible users:", error);
    res.status(500).json({ message: "Failed to fetch eligible users" });
  }
});

// Check if a specific user is eligible for high roller events
router.get('/check-eligibility/:userId', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const eligibility = await isUserEligibleForHighRollerDinners(userId);
    
    res.json(eligibility);
  } catch (error) {
    console.error("Error checking user eligibility:", error);
    res.status(500).json({ message: "Failed to check user eligibility" });
  }
});

// Manually set a user's high roller tier
router.post('/set-tier/:userId', isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const { tier, expirationDate } = req.body;
    
    if (tier !== 'standard' && tier !== 'high_roller') {
      return res.status(400).json({ message: "Invalid tier. Must be 'standard' or 'high_roller'" });
    }
    
    // Create a new high roller ticket with specified expiration date
    try {
      // Checking the schema to see dinnerTickets has userId as an integer
      // We need to remove the meetupId field since it's causing the error
      // and set the price as a Decimal type
      const [newTicket] = await db
        .insert(dinnerTickets)
        .values({
          userId: userId,
          ticketType: 'admin_assigned',
          tier: tier,
          price: "0.00", // Price formatted as a decimal string
          isPremium: tier === 'high_roller',
          status: 'completed',
          expiresAt: expirationDate ? new Date(expirationDate) : null
        })
        .returning();
      
      res.status(201).json({
        message: `User ${userId} has been granted ${tier} access`,
        ticket: newTicket
      });
    } catch (error) {
      console.error("Error creating ticket:", error);
      res.status(500).json({ message: "Database error creating high roller ticket" });
    }
  } catch (error) {
    console.error("Error setting user tier:", error);
    res.status(500).json({ message: "Failed to set user tier" });
  }
});

export default router;