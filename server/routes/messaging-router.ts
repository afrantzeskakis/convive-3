import { Router, Request, Response } from 'express';
import { storage } from '../storage';
import { z } from 'zod';
import { insertMessageSchema } from '@shared/schema';

const messagingRouter = Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req: Request, res: Response, next: Function) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  next();
};

// Get meetup messages with expirations
messagingRouter.get('/meetup/:meetupId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const meetupId = parseInt(req.params.meetupId);
    const messages = await storage.getMeetupMessages(meetupId);
    
    // Filter out expired messages unless there's an approved extension
    const now = new Date();
    const filteredMessages = await Promise.all(
      messages.map(async (message) => {
        // Include the sender info but only limited profile details (privacy-focused)
        const sender = await storage.getUser(message.senderId);
        return {
          ...message,
          sender: sender ? {
            id: sender.id,
            fullName: sender.fullName,
            profilePicture: sender.profilePicture
          } : null
        };
      })
    );
    
    res.json(filteredMessages);
  } catch (error) {
    console.error('Error fetching meetup messages:', error);
    res.status(500).json({ message: 'Failed to fetch meetup messages' });
  }
});

// Send a message
messagingRouter.post('/meetup/:meetupId', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const meetupId = parseInt(req.params.meetupId);
    const userId = req.user!.id;
    
    // Verify user is part of the meetup
    const participants = await storage.getMeetupParticipants(meetupId);
    const isParticipant = participants.some(p => p.userId === userId);
    
    if (!isParticipant) {
      return res.status(403).json({ message: 'You must be a participant of this meetup to send messages' });
    }
    
    // Calculate expiration date (1 week from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 1 week expiration
    
    const messageData = insertMessageSchema.parse({
      ...req.body,
      meetupId,
      senderId: userId,
      expiresAt
    });
    
    const newMessage = await storage.createMessage(messageData);
    
    // Get sender info for response
    const sender = await storage.getUser(userId);
    
    res.status(201).json({
      ...newMessage,
      sender: {
        id: sender!.id,
        fullName: sender!.fullName,
        profilePicture: sender!.profilePicture
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ message: 'Invalid message data', errors: error.errors });
    } else {
      console.error('Error sending message:', error);
      res.status(500).json({ message: 'Failed to send message' });
    }
  }
});

// Request message connection extension
messagingRouter.post('/extension/request', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const { meetupId, requestedUserId } = req.body;
    
    if (!meetupId || !requestedUserId) {
      return res.status(400).json({ message: 'meetupId and requestedUserId are required' });
    }
    
    const extension = await storage.requestMessageConnectionExtension({
      meetupId: parseInt(meetupId),
      requestedById: req.user!.id,
      requestedUserId: parseInt(requestedUserId),
      status: 'pending'
    });
    
    res.status(201).json(extension);
  } catch (error) {
    console.error('Error requesting extension:', error);
    res.status(500).json({ message: 'Failed to request message connection extension' });
  }
});

// Approve message connection extension
messagingRouter.post('/extension/approve/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const extensionId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const updatedExtension = await storage.approveMessageConnectionExtension(extensionId, userId);
    
    if (!updatedExtension) {
      return res.status(404).json({ message: 'Extension request not found or already processed' });
    }
    
    res.json(updatedExtension);
  } catch (error) {
    console.error('Error approving extension:', error);
    res.status(500).json({ message: 'Failed to approve message connection extension' });
  }
});

// Decline message connection extension (silently)
messagingRouter.post('/extension/decline/:id', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const extensionId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    // Mark as expired rather than declined to preserve privacy
    // This way the requester will just see it expired naturally, not that they were declined
    const result = await storage.silentlyDeclineMessageExtension(extensionId, userId);
    
    if (!result) {
      return res.status(404).json({ message: 'Extension request not found or already processed' });
    }
    
    // Return success but don't provide details
    res.json({ success: true });
  } catch (error) {
    console.error('Error declining extension:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
});

// Get pending extension requests for the current user
messagingRouter.get('/extensions/pending', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const pendingExtensions = await storage.getPendingExtensionsForUser(userId);
    res.json(pendingExtensions);
  } catch (error) {
    console.error('Error fetching pending extensions:', error);
    res.status(500).json({ message: 'Failed to fetch pending extension requests' });
  }
});

// Check if user has seen message expiration notice
messagingRouter.get('/expiration-notice-seen', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const hasSeenNotice = await storage.hasUserSeenMessageExpirationNotice(userId);
    res.json({ hasSeenNotice });
  } catch (error) {
    console.error('Error checking expiration notice status:', error);
    res.status(500).json({ message: 'Failed to check if user has seen expiration notice' });
  }
});

// Mark user as having seen message expiration notice
messagingRouter.post('/expiration-notice-seen', isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const updatedUser = await storage.updateUserMessageExpirationNoticeSeen(userId);
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating expiration notice status:', error);
    res.status(500).json({ message: 'Failed to update expiration notice status' });
  }
});

export default messagingRouter;