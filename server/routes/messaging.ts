import { Request, Response } from "express";
import { storage } from "../storage";
import { insertMessageSchema, insertMessageConnectionExtensionSchema } from "@shared/schema";

// Get messages for a meetup with expiration handling
export async function getMeetupMessages(req: Request, res: Response) {
  try {
    const meetupId = parseInt(req.params.meetupId);
    const messages = await storage.getMeetupMessages(meetupId);
    res.json(messages);
  } catch (error) {
    console.error("Error fetching meetup messages:", error);
    res.status(500).json({ message: "Failed to fetch messages" });
  }
}

// Send a message with automatic 1-week expiration
export async function sendMessage(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const meetupId = parseInt(req.params.meetupId);
    const userId = req.user!.id;

    // Validate that the user is a participant in this meetup
    const participants = await storage.getMeetupParticipants(meetupId);
    const isParticipant = participants.some(p => p.userId === userId);

    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant in this meetup" });
    }

    // Validate message data
    const result = insertMessageSchema.safeParse({
      meetupId,
      senderId: userId,
      content: req.body.content
    });

    if (!result.success) {
      return res.status(400).json({ message: "Invalid message data", errors: result.error.flatten() });
    }

    // Create the message with 1-week expiration
    const message = await storage.createMessage(result.data);
    res.status(201).json(message);
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Failed to send message" });
  }
}

// Request to extend the messaging connection for a meetup
export async function requestMessageExtension(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const meetupId = parseInt(req.params.meetupId);
    const userId = req.user!.id;

    // Validate that the user is a participant in this meetup
    const participants = await storage.getMeetupParticipants(meetupId);
    const isParticipant = participants.some(p => p.userId === userId);

    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant in this meetup" });
    }

    // Validate extension data
    const result = insertMessageConnectionExtensionSchema.safeParse({
      meetupId,
      requestedById: userId,
      status: "pending"
    });

    if (!result.success) {
      return res.status(400).json({ message: "Invalid extension request", errors: result.error.flatten() });
    }

    // Create the extension request
    const extension = await storage.requestMessageConnectionExtension(result.data);
    res.status(201).json(extension);
  } catch (error) {
    console.error("Error requesting message extension:", error);
    res.status(500).json({ message: "Failed to request message extension" });
  }
}

// Approve a message extension request
export async function approveMessageExtension(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const extensionId = parseInt(req.params.extensionId);
    const userId = req.user!.id;

    // Update the extension as approved
    const updatedExtension = await storage.approveMessageConnectionExtension(extensionId, userId);

    if (!updatedExtension) {
      return res.status(404).json({ message: "Extension request not found" });
    }

    res.json(updatedExtension);
  } catch (error) {
    console.error("Error approving message extension:", error);
    res.status(500).json({ message: "Failed to approve message extension" });
  }
}

// Get pending extension requests for a user
export async function getPendingExtensions(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;
    const extensions = await storage.getPendingExtensionsForUser(userId);
    res.json(extensions);
  } catch (error) {
    console.error("Error fetching pending extensions:", error);
    res.status(500).json({ message: "Failed to fetch pending extensions" });
  }
}

// Check if a user has seen the message expiration notice
export async function hasSeenExpirationNotice(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;
    const hasSeen = await storage.hasUserSeenMessageExpirationNotice(userId);
    res.json({ hasSeen });
  } catch (error) {
    console.error("Error checking expiration notice status:", error);
    res.status(500).json({ message: "Failed to check expiration notice status" });
  }
}

// Mark that a user has seen the message expiration notice
export async function markExpirationNoticeSeen(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const userId = req.user!.id;
    const updatedUser = await storage.updateUserMessageExpirationNoticeSeen(userId);
    
    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking expiration notice as seen:", error);
    res.status(500).json({ message: "Failed to mark expiration notice as seen" });
  }
}