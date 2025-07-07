import { Request, Response, NextFunction } from 'express';
import { User } from '@shared/schema';

// Extend User type for restaurant context
interface RestaurantUser extends User {
  restaurantId?: number;
}

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: RestaurantUser;
    }
  }
}

// Basic authentication middleware - checks if user is logged in
export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

// Restaurant admin middleware - checks if user is a restaurant admin
export const isRestaurantAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  if (req.user.role !== 'restaurant_admin' && req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({ message: 'Restaurant admin access required' });
  }
  
  next();
};

// Restaurant user middleware - checks if user has restaurant access (admin or user)
export const isRestaurantUser = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  const hasRestaurantAccess = req.user.role === 'restaurant_admin' || 
                              req.user.role === 'admin' || 
                              req.user.role === 'super_admin' ||
                              (req.user.authorizedRestaurants && req.user.authorizedRestaurants.length > 0);
  
  if (!hasRestaurantAccess) {
    return res.status(403).json({ message: 'Restaurant access required' });
  }
  
  next();
};

// Extract restaurant ID from user (for restaurant isolation)
export const getRestaurantId = (user: RestaurantUser): number | null => {
  // For super admin testing, we can use a default restaurant ID
  if (user.role === 'super_admin') {
    return user.restaurantId || 1; // Default to restaurant ID 1 for testing
  }
  
  // For restaurant admin, use their assigned restaurant
  if (user.role === 'restaurant_admin') {
    return user.restaurantId || null;
  }
  
  // For authorized users, use the first authorized restaurant
  if (user.authorizedRestaurants && user.authorizedRestaurants.length > 0) {
    return user.authorizedRestaurants[0];
  }
  
  return null;
};