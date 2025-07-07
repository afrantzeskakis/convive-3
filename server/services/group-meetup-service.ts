import { 
  GroupMeetupSession, 
  InsertGroupMeetupSession, 
  GroupMeetupParticipant, 
  InsertGroupMeetupParticipant,
  InsertAiVoiceCallLog,
  InsertRestaurantContact
} from "@shared/schema";
import { storage } from "../storage";
import * as openAIService from "./openai-service";

export class GroupMeetupService {
  // Create a new group meetup session
  async createSession(session: InsertGroupMeetupSession): Promise<GroupMeetupSession> {
    try {
      return await storage.createGroupMeetupSession(session);
    } catch (error) {
      console.error("Error creating group meetup session:", error);
      throw error;
    }
  }
  
  // Get available group meetup sessions based on filters
  async getAvailableSessions(filters?: { 
    city?: string, 
    language?: string, 
    dayOfWeek?: string, 
    timeSlot?: string 
  }): Promise<GroupMeetupSession[]> {
    try {
      // First get sessions based on filters
      let sessions = await storage.getGroupMeetupSessions(filters);
      
      // Then filter to only include open sessions
      sessions = sessions.filter(session => session.status === "open");
      
      return sessions;
    } catch (error) {
      console.error("Error getting available group meetup sessions:", error);
      return [];
    }
  }
  
  // Add a participant to a group meetup session
  async addParticipant(sessionId: number, userId: number): Promise<GroupMeetupParticipant | null> {
    try {
      // Get the session to check if it's open and has capacity
      const session = await storage.getGroupMeetupSessionById(sessionId);
      if (!session) {
        throw new Error("Group meetup session not found");
      }
      
      if (session.status !== "open") {
        throw new Error("Group meetup session is not open for joining");
      }
      
      // Get current participants to check if user is already a participant
      const participants = await storage.getGroupMeetupParticipants(sessionId);
      if (participants.some(p => p.userId === userId)) {
        throw new Error("User is already a participant in this session");
      }
      
      // Check if session is at capacity
      if (participants.length >= session.capacity) {
        throw new Error("Group meetup session is at capacity");
      }
      
      // Add the participant
      const participant = await storage.addGroupMeetupParticipant({
        sessionId,
        userId,
        status: "confirmed"
      });
      
      // Check if session has reached minimum participants
      if (participants.length + 1 >= session.minParticipants) {
        // Try to find and assign a restaurant
        await this.tryAssignRestaurant(session);
      }
      
      return participant;
    } catch (error) {
      console.error("Error adding participant to group meetup:", error);
      return null;
    }
  }
  
  // Try to assign a restaurant to a group meetup session
  private async tryAssignRestaurant(session: GroupMeetupSession): Promise<void> {
    try {
      // Only try to assign restaurant if the session has no restaurant yet
      if (session.restaurantId || session.reservationStatus !== "pending") {
        return;
      }
      
      // Get available restaurants in the city
      const restaurants = await storage.getAllRestaurants();
      const cityRestaurants = restaurants.filter(r => {
        // Simple filtering for city match (in real app would use more sophisticated matching)
        return r.address.toLowerCase().includes(session.city.toLowerCase());
      });
      
      if (cityRestaurants.length === 0) {
        console.warn(`No restaurants found in ${session.city} for group meetup`);
        return;
      }
      
      // Select a restaurant (in real app would use more sophisticated selection)
      const restaurant = cityRestaurants[Math.floor(Math.random() * cityRestaurants.length)];
      
      // Update the session with the restaurant
      await storage.updateGroupMeetupSession(session.id, {
        restaurantId: restaurant.id,
        reservationStatus: "requested"
      });
      
      // Initiate reservation process if OpenAI is available
      if (openAIService.isAvailable()) {
        await this.initiateReservation(session.id, restaurant.id);
      }
    } catch (error) {
      console.error("Error assigning restaurant to group meetup:", error);
    }
  }
  
  // Initiate the AI-powered reservation process
  private async initiateReservation(sessionId: number, restaurantId: number): Promise<void> {
    try {
      // Get session details
      const session = await storage.getGroupMeetupSessionById(sessionId);
      if (!session) {
        throw new Error("Group meetup session not found");
      }
      
      // Get restaurant details
      const restaurant = await storage.getRestaurant(restaurantId);
      if (!restaurant) {
        throw new Error("Restaurant not found");
      }
      
      // Get restaurant contacts
      let contacts = await storage.getRestaurantContacts(restaurantId);
      
      // If no contacts exist, create a dummy one
      if (contacts.length === 0) {
        // In a real app, we would have actual contact information
        // This is just a placeholder for demonstration purposes
        const dummyContact: InsertRestaurantContact = {
          restaurantId,
          contactType: "primary",
          phoneNumber: "555-123-4567",
          name: "Reservation Desk"
        };
        
        const newContact = await storage.createRestaurantContact(dummyContact);
        contacts = [newContact];
      }
      
      // Use the primary contact
      const contact = contacts.find(c => c.contactType === "primary") || contacts[0];
      
      // Get participants count
      const participants = await storage.getGroupMeetupParticipants(sessionId);
      const partySize = participants.length;
      
      // Convert day of week and time slot to date and time
      // In a real app, this would be more sophisticated
      const meetupDate = session.meetupDate || new Date();
      const meetupTime = session.timeSlot;
      
      // Generate the reservation script using OpenAI
      const script = await openAIService.generateReservationCall(
        restaurant.name,
        contact.name || null,
        partySize,
        meetupDate,
        meetupTime,
        "This is a group from Convive dining matchmaking service"
      );
      
      // Log the call in the database
      const callLog: InsertAiVoiceCallLog = {
        sessionId,
        restaurantId,
        contactId: contact.id,
        callStatus: "initiated",
        callTranscript: script,
        callAttempt: 1
      };
      
      await storage.createAiVoiceCallLog(callLog);
      
      // In a real application, this would trigger an actual call through Twilio or similar
      console.log(`Initiated reservation call to ${restaurant.name} for session ${sessionId}`);
    } catch (error) {
      console.error("Error initiating reservation:", error);
    }
  }
  
  // Get details about a specific group meetup session
  async getSessionDetails(sessionId: number): Promise<{
    session: GroupMeetupSession | null;
    participants: Array<GroupMeetupParticipant & { user: any }>;
    restaurant: any | null;
    reservationStatus: {
      status: string;
      latestLog: any | null;
    };
  }> {
    try {
      const session = await storage.getGroupMeetupSessionById(sessionId);
      if (!session) {
        return {
          session: null,
          participants: [],
          restaurant: null,
          reservationStatus: {
            status: "unknown",
            latestLog: null
          }
        };
      }
      
      const participants = await storage.getGroupMeetupParticipants(sessionId);
      
      let restaurant = null;
      if (session.restaurantId) {
        restaurant = await storage.getRestaurant(session.restaurantId);
      }
      
      const latestLog = await storage.getLatestAiVoiceCallLog(sessionId);
      
      return {
        session,
        participants,
        restaurant,
        reservationStatus: {
          status: session.reservationStatus || "pending",
          latestLog
        }
      };
    } catch (error) {
      console.error("Error getting group meetup session details:", error);
      return {
        session: null,
        participants: [],
        restaurant: null,
        reservationStatus: {
          status: "error",
          latestLog: null
        }
      };
    }
  }
  
  // Update participant status (for cancellations, etc.)
  async updateParticipantStatus(sessionId: number, userId: number, status: string): Promise<boolean> {
    try {
      const result = await storage.updateGroupMeetupParticipantStatus(sessionId, userId, status);
      return !!result;
    } catch (error) {
      console.error("Error updating participant status:", error);
      return false;
    }
  }
  
  // Get all sessions that a user is participating in
  async getUserSessions(userId: number): Promise<{
    upcoming: GroupMeetupSession[];
    past: GroupMeetupSession[];
  }> {
    try {
      // Get all sessions
      const allSessions = await storage.getGroupMeetupSessions();
      
      // Get all participations for the user
      const participatedSessions: number[] = [];
      
      for (const session of allSessions) {
        const participants = await storage.getGroupMeetupParticipants(session.id);
        const isParticipant = participants.some(p => p.userId === userId && p.status !== "canceled");
        
        if (isParticipant) {
          participatedSessions.push(session.id);
        }
      }
      
      // Filter sessions based on user participation
      const userSessions = allSessions.filter(s => participatedSessions.includes(s.id));
      
      // Split into upcoming and past
      const now = new Date();
      const upcoming = userSessions.filter(s => {
        if (!s.meetupDate) return true; // If no date is set, consider it upcoming
        return new Date(s.meetupDate) >= now;
      });
      
      const past = userSessions.filter(s => {
        if (!s.meetupDate) return false;
        return new Date(s.meetupDate) < now;
      });
      
      return { upcoming, past };
    } catch (error) {
      console.error("Error getting user's group meetup sessions:", error);
      return { upcoming: [], past: [] };
    }
  }
}

// Export a singleton instance
export const groupMeetupService = new GroupMeetupService();