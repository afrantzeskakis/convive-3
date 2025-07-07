import { Router, Request, Response } from 'express';
import multer from 'multer';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { z } from 'zod';
import {
  processAndAnalyzeRecipeImage,
  saveAnalysisFeedback,
  setRecipeTrainingStatus,
  getRecipesForTraining,
  createTrainingData,
  initializeFineTuning,
  checkFineTuningStatus,
  listRecipesWithAnalysisStatus
} from '../services/recipe-training-service';

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup storage for recipe uploads
const storage = multer.memoryStorage();

// Create file filter for document and image types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = [
    'application/pdf', 
    'text/plain', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/webp'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type. Please upload a PDF, TXT, DOC, DOCX, JPEG, PNG, or WEBP file.'));
  }
};

// Initialize multer upload with memory storage
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Create router
const recipeTrainingRouter = Router();

// Authentication middleware
function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Not authenticated' });
}

// Restaurant access middleware
function hasRestaurantAccess(req: Request, res: Response, next: Function) {
  const restaurantId = parseInt(req.params.restaurantId || req.body.restaurantId || '0');
  
  if (!restaurantId) {
    return res.status(400).json({ message: 'Restaurant ID is required' });
  }
  
  // Super admins and admins have access to all restaurants
  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next();
  }
  
  // Restaurant admins have access only to their authorized restaurants
  const userRestaurants = req.user.authorizedRestaurants || [];
  if (userRestaurants.includes(restaurantId)) {
    return next();
  }
  
  res.status(403).json({ message: 'Not authorized to access this restaurant' });
}

// Route to upload and analyze a recipe image
recipeTrainingRouter.post(
  '/upload-image',
  isAuthenticated,
  hasRestaurantAccess,
  upload.single('recipeImage'),
  async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No recipe image uploaded' });
      }
      
      const { restaurantId, name, description, dishType, cuisine } = req.body;
      
      if (!restaurantId || !name) {
        return res.status(400).json({ message: 'Restaurant ID and recipe name are required' });
      }
      
      // Process and analyze the image
      const result = await processAndAnalyzeRecipeImage(
        req.file.buffer,
        req.file.originalname,
        {
          restaurantId: parseInt(restaurantId),
          name,
          description,
          dishType,
          cuisine,
          createdBy: req.user.id
        }
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error('Error uploading recipe image:', error);
      res.status(500).json({ message: 'Failed to process recipe image', error: error.message });
    }
  }
);

// Route to list recipes
recipeTrainingRouter.get(
  '/list/:restaurantId?',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const restaurantId = req.params.restaurantId ? parseInt(req.params.restaurantId) : undefined;
      
      // If restaurantId is provided, check access
      if (restaurantId) {
        // Super admins and admins have access to all restaurants
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
          // Restaurant admins have access only to their authorized restaurants
          const userRestaurants = req.user.authorizedRestaurants || [];
          if (!userRestaurants.includes(restaurantId)) {
            return res.status(403).json({ message: 'Not authorized to access this restaurant' });
          }
        }
      }
      
      const recipes = await listRecipesWithAnalysisStatus(restaurantId);
      res.json(recipes);
    } catch (error) {
      console.error('Error listing recipes:', error);
      res.status(500).json({ message: 'Failed to list recipes', error: error.message });
    }
  }
);

// Route to provide feedback on recipe analysis
recipeTrainingRouter.post(
  '/feedback/:analysisId',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      const analysisId = parseInt(req.params.analysisId);
      const { rating, notes } = req.body;
      
      // Validate rating
      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      
      const updatedAnalysis = await saveAnalysisFeedback(analysisId, {
        rating,
        notes
      });
      
      res.json(updatedAnalysis);
    } catch (error) {
      console.error('Error saving analysis feedback:', error);
      res.status(500).json({ message: 'Failed to save feedback', error: error.message });
    }
  }
);

// Route to set recipe training status
recipeTrainingRouter.post(
  '/training-status/:recipeId/:analysisId',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      // Only admins and super admins can manage training
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to manage training data' });
      }
      
      const recipeId = parseInt(req.params.recipeId);
      const analysisId = parseInt(req.params.analysisId);
      const { includeInTraining } = req.body;
      
      if (typeof includeInTraining !== 'boolean') {
        return res.status(400).json({ message: 'includeInTraining must be a boolean' });
      }
      
      const trainingData = await setRecipeTrainingStatus(recipeId, analysisId, includeInTraining);
      res.json(trainingData);
    } catch (error) {
      console.error('Error setting recipe training status:', error);
      res.status(500).json({ message: 'Failed to set training status', error: error.message });
    }
  }
);

// Route to initialize training
recipeTrainingRouter.post(
  '/initialize-training',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      // Only admins and super admins can initialize training
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to initialize training' });
      }
      
      // Get recipes marked for training
      const recipeIds = await getRecipesForTraining();
      
      if (recipeIds.length === 0) {
        return res.status(400).json({ message: 'No recipes marked for training' });
      }
      
      // Create training data
      const trainingData = await createTrainingData(recipeIds);
      
      // Initialize fine-tuning
      const jobId = await initializeFineTuning(trainingData);
      
      if (!jobId) {
        return res.status(500).json({ message: 'Failed to initialize fine-tuning' });
      }
      
      res.json({ jobId, recipeCount: recipeIds.length });
    } catch (error) {
      console.error('Error initializing training:', error);
      res.status(500).json({ message: 'Failed to initialize training', error: error.message });
    }
  }
);

// Route to check training status
recipeTrainingRouter.get(
  '/training-status/:jobId',
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      // Only admins and super admins can check training status
      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized to check training status' });
      }
      
      const jobId = req.params.jobId;
      const status = await checkFineTuningStatus(jobId);
      
      if (!status) {
        return res.status(404).json({ message: 'Training job not found' });
      }
      
      res.json(status);
    } catch (error) {
      console.error('Error checking training status:', error);
      res.status(500).json({ message: 'Failed to check training status', error: error.message });
    }
  }
);

export default recipeTrainingRouter;