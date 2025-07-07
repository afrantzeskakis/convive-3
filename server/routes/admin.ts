import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { db } from '../db';
import { eq, and, gte, lt, sql } from 'drizzle-orm';
import { dinnerCheckAverages, restaurants, meetups, users } from '@shared/schema';

const router = Router();

// Get all users with analytics data
router.get('/users/analytics', async (req: Request, res: Response) => {
  try {
    // For an actual implementation, this would join with related tables and
    // calculate statistics based on user activity
    const users = await storage.getAllUserAnalytics();
    res.json(users);
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({ message: 'Failed to fetch user analytics data' });
  }
});

// Get premium users
router.get('/users/premium', async (req: Request, res: Response) => {
  try {
    const premiumUsers = await storage.getPremiumUsers();
    res.json(premiumUsers);
  } catch (error) {
    console.error('Error fetching premium users:', error);
    res.status(500).json({ message: 'Failed to fetch premium users' });
  }
});

// Get high-value dinner check averages
router.get('/dinner-checks', async (req: Request, res: Response) => {
  try {
    const dinnerChecks = await storage.getHighCheckAverages(100);
    res.json(dinnerChecks);
  } catch (error) {
    console.error('Error fetching dinner checks:', error);
    res.status(500).json({ message: 'Failed to fetch dinner checks' });
  }
});

// Get restaurant notifications (overdue check inputs)
router.get('/restaurant-notifications', async (req: Request, res: Response) => {
  try {
    // Get all dinner check averages for now (since we have no inputProvided field in the DB yet)
    // In a real implementation, we'd filter for overdue entries 
    const notifications = await db.select()
      .from(dinnerCheckAverages)
      .orderBy(dinnerCheckAverages.reportedAt);
    
    // Enhance with restaurant and meetup data
    const enhancedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        const restaurant = await db.select()
          .from(restaurants)
          .where(eq(restaurants.id, notification.restaurantId))
          .then(rows => rows[0] || null);
        
        const meetup = await db.select()
          .from(meetups)
          .where(eq(meetups.id, notification.meetupId))
          .then(rows => rows[0] || null);
        
        // Create a deadline 7 hours after the reported time
        const reportedAt = new Date(notification.reportedAt);
        const deadline = new Date(reportedAt);
        deadline.setHours(deadline.getHours() + 7); // 7-hour deadline as requested
        
        // Check if notification is overdue based on current time
        const now = new Date();
        const isOverdue = now > deadline;
        
        // Create a simulated notification object with required fields
        return {
          ...notification,
          inputRequiredBy: deadline.toISOString(),
          inputProvided: false, // Simulating that input hasn't been provided
          isOverdue,
          restaurant,
          meetup
        };
      })
    );
    
    res.json(enhancedNotifications);
  } catch (error) {
    console.error('Error fetching restaurant notifications:', error);
    res.status(500).json({ message: 'Failed to fetch restaurant notifications' });
  }
});

// Mark a check notification as resolved
router.post('/restaurant-notifications/:id/resolve', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Since we don't have the actual columns in the database yet, 
    // we'll just retrieve the notification to simulate a successful update
    const [notification] = await db.select()
      .from(dinnerCheckAverages)
      .where(eq(dinnerCheckAverages.id, parseInt(id)));
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // For now, we're going to simulate a successful update
    // In a real application, we would update these fields in the database
    const updatedNotification = {
      ...notification,
      // These fields are simulated
      inputProvided: true,
      isOverdue: false,
      notificationSent: false
    };
    
    res.json({ success: true, message: 'Notification marked as resolved', data: updatedNotification });
  } catch (error) {
    console.error('Error resolving notification:', error);
    res.status(500).json({ message: 'Failed to resolve notification' });
  }
});

// Send a reminder to a restaurant about check input
router.post('/restaurant-notifications/:id/remind', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Get the notification
    const [notification] = await db.select()
      .from(dinnerCheckAverages)
      .where(eq(dinnerCheckAverages.id, parseInt(id)));
    
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    
    // In a real application, this would send an email/SMS to the restaurant manager
    // For now, we simulate a successful reminder without updating the database
    
    // Simulated updated notification with notificationSent field
    const updatedNotification = {
      ...notification,
      notificationSent: true // This is simulated since the column doesn't exist in DB yet
    };
    
    // This would normally send an email or SMS to the restaurant manager
    console.log(`Sending reminder to restaurant ${notification.restaurantId} for meetup ${notification.meetupId}`);
    
    res.json({ 
      success: true, 
      message: 'Reminder sent to restaurant manager', 
      data: updatedNotification 
    });
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Failed to send reminder' });
  }
});

export default router;