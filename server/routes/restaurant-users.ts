import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { hashPassword } from '../auth';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Middleware to check if user has access to restaurant
async function hasRestaurantAccess(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }

  const restaurantId = parseInt(req.params.restaurantId);
  if (isNaN(restaurantId)) {
    return res.status(400).json({ message: 'Invalid restaurant ID' });
  }

  // Super admins can access any restaurant
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Restaurant admins can only access restaurants they manage
  if (req.user.role === 'restaurant_admin') {
    try {
      // Check if this restaurant is in the user's authorized restaurants
      if (req.user.authorizedRestaurants && req.user.authorizedRestaurants.includes(restaurantId)) {
        return next();
      }

      // Also check if user is the manager of this restaurant
      const restaurant = await storage.getRestaurant(restaurantId);
      if (restaurant && restaurant.managerId === req.user.id) {
        return next();
      }
    } catch (error) {
      console.error('Error checking restaurant access:', error);
      return res.status(500).json({ message: 'Server error' });
    }
  }

  return res.status(403).json({ message: 'You do not have access to this restaurant' });
}

// Get all users for a restaurant
router.get('/:restaurantId/users', hasRestaurantAccess, async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    // Get all users who have access to this restaurant
    const users = await storage.getUsersByRestaurantId(restaurantId);
    
    // Don't send password and other sensitive data
    const sanitizedUsers = users.map(user => ({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    }));
    
    res.json(sanitizedUsers);
  } catch (error) {
    console.error('Error fetching restaurant users:', error);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

// Add a user to a restaurant
router.post('/:restaurantId/users', hasRestaurantAccess, async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    
    // Validate the user data
    const userData = insertUserSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByUsername(userData.username);
    if (existingUser) {
      // If user exists, add them to this restaurant
      const updatedUser = await storage.addUserToRestaurant(existingUser.id, restaurantId);
      if (!updatedUser) {
        return res.status(500).json({ message: 'Failed to add existing user to restaurant' });
      }
      
      return res.status(200).json({
        id: updatedUser.id,
        username: updatedUser.username,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        profilePicture: updatedUser.profilePicture
      });
    }
    
    // Hash the password
    const hashedPassword = await hashPassword(userData.password);
    
    // Create the new user
    const newUser = await storage.createUser({
      ...userData,
      password: hashedPassword,
      authorizedRestaurants: [restaurantId]
    });
    
    // Don't send back the password
    res.status(201).json({
      id: newUser.id,
      username: newUser.username,
      fullName: newUser.fullName,
      email: newUser.email,
      role: newUser.role,
      profilePicture: newUser.profilePicture
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid user data', errors: error.errors });
    }
    console.error('Error adding user to restaurant:', error);
    res.status(500).json({ message: 'Failed to add user' });
  }
});

// Get a specific user from a restaurant
router.get('/:restaurantId/users/:userId', hasRestaurantAccess, async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const userId = parseInt(req.params.userId);
    
    // Get all users for this restaurant
    const users = await storage.getUsersByRestaurantId(restaurantId);
    const user = users.find(user => user.id === userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found in this restaurant' });
    }
    
    res.json({
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture
    });
  } catch (error) {
    console.error('Error fetching restaurant user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Remove a user from a restaurant
router.delete('/:restaurantId/users/:userId', hasRestaurantAccess, async (req: Request, res: Response) => {
  try {
    const restaurantId = parseInt(req.params.restaurantId);
    const userId = parseInt(req.params.userId);
    
    // Don't allow removing oneself
    if (req.user.id === userId) {
      return res.status(400).json({ message: 'You cannot remove yourself from the restaurant' });
    }
    
    const updatedUser = await storage.removeUserFromRestaurant(userId, restaurantId);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(200).json({ message: 'User removed from restaurant' });
  } catch (error) {
    console.error('Error removing user from restaurant:', error);
    res.status(500).json({ message: 'Failed to remove user' });
  }
});

export const restaurantUsersRouter = router;