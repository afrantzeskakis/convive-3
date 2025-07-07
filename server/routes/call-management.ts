import { Router, Request, Response } from "express";
import { storage } from "../storage";
import { z } from "zod";
import { insertCallScriptSchema } from "@shared/schema";

const router = Router();

// Middleware to check if user is a super admin
function isSuperAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  
  if (req.user?.role !== "super_admin") {
    return res.status(403).json({ message: "Forbidden: Super Admin access required" });
  }
  
  next();
}

// Get all call scripts
router.get("/scripts", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const scripts = await storage.getAllCallScripts();
    res.json(scripts);
  } catch (error) {
    console.error("Error fetching call scripts:", error);
    res.status(500).json({ message: "Failed to fetch call scripts" });
  }
});

// Get a specific call script
router.get("/scripts/:id", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const scriptId = parseInt(req.params.id);
    const script = await storage.getCallScript(scriptId);
    
    if (!script) {
      return res.status(404).json({ message: "Call script not found" });
    }
    
    res.json(script);
  } catch (error) {
    console.error("Error fetching call script:", error);
    res.status(500).json({ message: "Failed to fetch call script" });
  }
});

// Create a new call script
router.post("/scripts", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    // Validate request body
    const result = insertCallScriptSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid call script data", 
        errors: result.error.errors 
      });
    }
    
    // Add user ID as creator
    const scriptData = {
      ...result.data,
      createdBy: req.user?.id,
      lastModifiedBy: req.user?.id
    };
    
    const newScript = await storage.createCallScript(scriptData);
    res.status(201).json(newScript);
  } catch (error) {
    console.error("Error creating call script:", error);
    res.status(500).json({ message: "Failed to create call script" });
  }
});

// Update a call script
router.put("/scripts/:id", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const scriptId = parseInt(req.params.id);
    
    // Check if script exists
    const existingScript = await storage.getCallScript(scriptId);
    if (!existingScript) {
      return res.status(404).json({ message: "Call script not found" });
    }
    
    // Validate request body
    const result = insertCallScriptSchema.partial().safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ 
        message: "Invalid call script data", 
        errors: result.error.errors 
      });
    }
    
    // Add last modified by
    const scriptData = {
      ...result.data,
      lastModifiedBy: req.user?.id,
      updatedAt: new Date()
    };
    
    const updatedScript = await storage.updateCallScript(scriptId, scriptData);
    res.json(updatedScript);
  } catch (error) {
    console.error("Error updating call script:", error);
    res.status(500).json({ message: "Failed to update call script" });
  }
});

// Delete a call script
router.delete("/scripts/:id", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const scriptId = parseInt(req.params.id);
    
    // Check if script exists
    const existingScript = await storage.getCallScript(scriptId);
    if (!existingScript) {
      return res.status(404).json({ message: "Call script not found" });
    }
    
    // Instead of deleting, mark it as inactive
    const updatedScript = await storage.updateCallScript(scriptId, { 
      isActive: false,
      lastModifiedBy: req.user?.id
    });
    
    res.json({ message: "Call script deactivated successfully" });
  } catch (error) {
    console.error("Error deactivating call script:", error);
    res.status(500).json({ message: "Failed to deactivate call script" });
  }
});

// Get all call recordings
router.get("/recordings", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    // Check if the table exists first
    try {
      const recordings = await storage.getAllCallRecordings();
      res.json(recordings);
    } catch (tableError: any) {
      // If the error is about a missing table, return an empty array instead of an error
      if (tableError.code === '42P01') { // PostgreSQL error code for "relation does not exist"
        console.log("Call recordings table doesn't exist yet. Returning empty array.");
        return res.json([]);
      }
      // For other errors, rethrow to be caught by the outer catch
      throw tableError;
    }
  } catch (error) {
    console.error("Error fetching call recordings:", error);
    res.status(500).json({ message: "Failed to fetch call recordings" });
  }
});

// Get call recordings with details (including call logs)
router.get("/recordings/detailed", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const recordings = await storage.getCallRecordingsWithDetails();
    res.json(recordings);
  } catch (error) {
    console.error("Error fetching detailed call recordings:", error);
    res.status(500).json({ message: "Failed to fetch detailed call recordings" });
  }
});

// Get a specific call recording
router.get("/recordings/:id", isSuperAdmin, async (req: Request, res: Response) => {
  try {
    const recordingId = parseInt(req.params.id);
    const recording = await storage.getCallRecording(recordingId);
    
    if (!recording) {
      return res.status(404).json({ message: "Call recording not found" });
    }
    
    res.json(recording);
  } catch (error) {
    console.error("Error fetching call recording:", error);
    res.status(500).json({ message: "Failed to fetch call recording" });
  }
});

export default router;