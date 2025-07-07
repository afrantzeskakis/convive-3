import { Router } from "express";
import type { Request, Response, NextFunction } from "express";
import { groupMeetupService } from "../services/group-meetup-service";
import * as openAIService from "../services/openai-service";
import { z } from "zod";

// Custom middleware to check if a user is authenticated
function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  next();
}

const router = Router();

// Schema for creating a group meetup session
const createSessionSchema = z.object({
  city: z.string().min(1),
  language: z.string().min(1),
  dayOfWeek: z.string().min(1),
  timeSlot: z.string().min(1),
  capacity: z.number().int().positive().optional().default(6),
  minParticipants: z.number().int().positive().optional().default(4),
  meetupDate: z.string().optional().transform(val => val ? new Date(val) : undefined)
});

// Schema for filtering group meetup sessions
const filterSessionsSchema = z.object({
  city: z.string().optional(),
  language: z.string().optional(),
  dayOfWeek: z.string().optional(),
  timeSlot: z.string().optional()
});

// Schema for joining a group meetup
const joinSessionSchema = z.object({
  sessionId: z.number().int().positive()
});

// Schema for updating participant status
const updateParticipantSchema = z.object({
  sessionId: z.number().int().positive(),
  status: z.string().min(1)
});

// GET /api/group-meetups - Get available group meetup sessions
router.get("/", isAuthenticated, async (req, res) => {
  try {
    const filters = req.query;
    
    // Validate filters
    const result = filterSessionsSchema.safeParse(filters);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid filters", errors: result.error.flatten() });
    }
    
    const sessions = await groupMeetupService.getAvailableSessions(result.data);
    res.json(sessions);
  } catch (error) {
    console.error("Error getting group meetup sessions:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get group meetup sessions";
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/group-meetups - Create a new group meetup session
router.post("/", isAuthenticated, async (req, res) => {
  try {
    // Only admin and super_admin can create sessions
    if (req.user && req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ message: "Insufficient permissions to create group meetup sessions" });
    }
    
    // Validate request body
    const result = createSessionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid session data", errors: result.error.flatten() });
    }
    
    const session = await groupMeetupService.createSession(result.data);
    res.status(201).json(session);
  } catch (error) {
    console.error("Error creating group meetup session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to create group meetup session";
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/group-meetups/:id - Get a specific group meetup session
router.get("/:id", isAuthenticated, async (req, res) => {
  try {
    const sessionId = parseInt(req.params.id);
    if (isNaN(sessionId)) {
      return res.status(400).json({ message: "Invalid session ID" });
    }
    
    const sessionDetails = await groupMeetupService.getSessionDetails(sessionId);
    if (!sessionDetails.session) {
      return res.status(404).json({ message: "Group meetup session not found" });
    }
    
    res.json(sessionDetails);
  } catch (error) {
    console.error("Error getting group meetup session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get group meetup session";
    res.status(500).json({ message: errorMessage });
  }
});

// POST /api/group-meetups/join - Join a group meetup session
router.post("/join", isAuthenticated, async (req, res) => {
  try {
    // Validate request body
    const result = joinSessionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
    }
    
    const { sessionId } = result.data;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userId = req.user.id;
    const participant = await groupMeetupService.addParticipant(sessionId, userId);
    if (!participant) {
      return res.status(400).json({ message: "Failed to join group meetup session" });
    }
    
    res.status(201).json(participant);
  } catch (error) {
    console.error("Error joining group meetup session:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to join group meetup session";
    res.status(500).json({ message: errorMessage });
  }
});

// PUT /api/group-meetups/participant - Update participant status
router.put("/participant", isAuthenticated, async (req, res) => {
  try {
    // Validate request body
    const result = updateParticipantSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: "Invalid data", errors: result.error.flatten() });
    }
    
    const { sessionId, status } = result.data;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userId = req.user.id;
    const success = await groupMeetupService.updateParticipantStatus(sessionId, userId, status);
    if (!success) {
      return res.status(400).json({ message: "Failed to update participant status" });
    }
    
    res.json({ message: "Participant status updated" });
  } catch (error) {
    console.error("Error updating participant status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to update participant status";
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/group-meetups/user/sessions - Get all sessions for the current user
router.get("/user/sessions", isAuthenticated, async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    
    const userId = req.user.id;
    const sessions = await groupMeetupService.getUserSessions(userId);
    res.json(sessions);
  } catch (error) {
    console.error("Error getting user sessions:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to get user sessions";
    res.status(500).json({ message: errorMessage });
  }
});

// GET /api/group-meetups/openai-status - Check if OpenAI is available
router.get("/openai-status", isAuthenticated, async (req, res) => {
  try {
    // Only admin and super_admin can check OpenAI status
    if (!req.user || (req.user.role !== "admin" && req.user.role !== "super_admin")) {
      return res.status(403).json({ message: "Insufficient permissions to check OpenAI status" });
    }
    
    const isAvailable = openAIService.isAvailable();
    res.json({ available: isAvailable });
  } catch (error) {
    console.error("Error checking OpenAI status:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to check OpenAI status";
    res.status(500).json({ message: errorMessage });
  }
});

export default router;