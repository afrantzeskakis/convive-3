import { db } from '../db';
import { 
  dinnerSlots, dinnerBookings, diningHistory, users, restaurants 
} from '../../shared/schema';
import { eq, and, desc, sql, ne, or } from 'drizzle-orm';
import { compatibilityCalculator } from './compatibility-calculator';

const RECENCY_PENALTY_WEEKS = 8;
const RECENCY_PENALTY_AMOUNT = 30;
const TARGET_GROUP_SIZE = 6;

export class BookingService {
  
  async getAvailableSlots(city?: string) {
    const query = db.select().from(dinnerSlots)
      .where(
        and(
          eq(dinnerSlots.status, 'open'),
          sql`${dinnerSlots.date} > NOW()`
        )
      )
      .orderBy(dinnerSlots.date);
    
    const slots = await query;
    
    if (city) {
      return slots.filter(s => s.city.toLowerCase() === city.toLowerCase());
    }
    return slots;
  }

  async getSlotById(slotId: number) {
    const [slot] = await db.select().from(dinnerSlots).where(eq(dinnerSlots.id, slotId));
    return slot;
  }

  async createBooking(userId: number, slotId: number, stripeSessionId: string) {
    const [booking] = await db.insert(dinnerBookings).values({
      userId,
      slotId,
      stripeSessionId,
      paymentStatus: 'processing'
    }).returning();
    
    return booking;
  }

  async confirmPayment(stripeSessionId: string, paymentIntentId: string, amount: number) {
    const [booking] = await db.select().from(dinnerBookings)
      .where(eq(dinnerBookings.stripeSessionId, stripeSessionId));
    
    if (!booking) {
      throw new Error('Booking not found');
    }

    await db.update(dinnerBookings)
      .set({
        paymentStatus: 'paid',
        stripePaymentIntentId: paymentIntentId,
        amountPaid: amount.toString(),
        paidAt: new Date()
      })
      .where(eq(dinnerBookings.id, booking.id));

    await db.update(dinnerSlots)
      .set({
        currentBookings: sql`${dinnerSlots.currentBookings} + 1`
      })
      .where(eq(dinnerSlots.id, booking.slotId));

    await this.assignToGroup(booking.id);

    return booking;
  }

  async assignToGroup(bookingId: number) {
    const [booking] = await db.select().from(dinnerBookings)
      .where(eq(dinnerBookings.id, bookingId));
    
    if (!booking || booking.groupId) {
      return;
    }

    const paidBookings = await db.select().from(dinnerBookings)
      .where(
        and(
          eq(dinnerBookings.slotId, booking.slotId),
          eq(dinnerBookings.paymentStatus, 'paid')
        )
      );

    const bookingsWithGroups = paidBookings.filter(b => b.groupId);
    const groupCounts = new Map<number, number>();
    bookingsWithGroups.forEach(b => {
      if (b.groupId) {
        groupCounts.set(b.groupId, (groupCounts.get(b.groupId) || 0) + 1);
      }
    });

    let bestGroupId: number | null = null;
    let bestScore = -1;

    for (const [groupId, count] of groupCounts) {
      if (count >= TARGET_GROUP_SIZE) continue;

      const groupMembers = paidBookings.filter(b => b.groupId === groupId);
      let totalScore = 0;
      
      for (const member of groupMembers) {
        const score = await this.getAdjustedCompatibility(booking.userId, member.userId, booking.slotId);
        totalScore += score;
      }
      
      const avgScore = totalScore / groupMembers.length;
      
      if (avgScore > bestScore) {
        bestScore = avgScore;
        bestGroupId = groupId;
      }
    }

    if (bestGroupId && bestScore >= 50) {
      await db.update(dinnerBookings)
        .set({ groupId: bestGroupId })
        .where(eq(dinnerBookings.id, booking.id));
    } else {
      const maxGroupId = Math.max(0, ...Array.from(groupCounts.keys()));
      const newGroupId = maxGroupId + 1;
      
      await db.update(dinnerBookings)
        .set({ groupId: newGroupId })
        .where(eq(dinnerBookings.id, booking.id));
    }
  }

  async getAdjustedCompatibility(user1Id: number, user2Id: number, slotId: number): Promise<number> {
    const baseScore = await compatibilityCalculator.calculateCompatibilityScore(user1Id, user2Id);
    
    const recentDining = await db.select().from(diningHistory)
      .where(
        and(
          or(
            and(eq(diningHistory.user1Id, user1Id), eq(diningHistory.user2Id, user2Id)),
            and(eq(diningHistory.user1Id, user2Id), eq(diningHistory.user2Id, user1Id))
          ),
          sql`${diningHistory.dinedAt} > NOW() - INTERVAL '${RECENCY_PENALTY_WEEKS} weeks'`
        )
      )
      .orderBy(desc(diningHistory.dinedAt))
      .limit(1);

    if (recentDining.length > 0) {
      return Math.max(0, baseScore - RECENCY_PENALTY_AMOUNT);
    }

    return baseScore;
  }

  async getUserBookings(userId: number) {
    const bookings = await db.select({
      booking: dinnerBookings,
      slot: dinnerSlots,
      restaurant: restaurants
    })
    .from(dinnerBookings)
    .innerJoin(dinnerSlots, eq(dinnerBookings.slotId, dinnerSlots.id))
    .leftJoin(restaurants, eq(dinnerBookings.restaurantId, restaurants.id))
    .where(eq(dinnerBookings.userId, userId))
    .orderBy(desc(dinnerSlots.date));

    return bookings.map(b => {
      const shouldRevealRestaurant = b.booking.restaurantRevealed || 
        (b.slot.restaurantRevealAt && new Date(b.slot.restaurantRevealAt) <= new Date());
      
      return {
        ...b.booking,
        slot: b.slot,
        restaurant: shouldRevealRestaurant ? b.restaurant : null,
        restaurantRevealed: shouldRevealRestaurant
      };
    });
  }

  async getBookingDetails(bookingId: number, userId: number) {
    const [result] = await db.select({
      booking: dinnerBookings,
      slot: dinnerSlots,
      restaurant: restaurants
    })
    .from(dinnerBookings)
    .innerJoin(dinnerSlots, eq(dinnerBookings.slotId, dinnerSlots.id))
    .leftJoin(restaurants, eq(dinnerBookings.restaurantId, restaurants.id))
    .where(
      and(
        eq(dinnerBookings.id, bookingId),
        eq(dinnerBookings.userId, userId)
      )
    );

    if (!result) return null;

    const shouldRevealRestaurant = result.booking.restaurantRevealed || 
      (result.slot.restaurantRevealAt && new Date(result.slot.restaurantRevealAt) <= new Date());

    const groupMembers = result.booking.groupId 
      ? await this.getGroupMembers(result.booking.slotId, result.booking.groupId, userId)
      : [];

    return {
      ...result.booking,
      slot: result.slot,
      restaurant: shouldRevealRestaurant ? result.restaurant : null,
      restaurantRevealed: shouldRevealRestaurant,
      groupMembers
    };
  }

  async getGroupMembers(slotId: number, groupId: number, excludeUserId: number) {
    const members = await db.select({
      booking: dinnerBookings,
      user: users
    })
    .from(dinnerBookings)
    .innerJoin(users, eq(dinnerBookings.userId, users.id))
    .where(
      and(
        eq(dinnerBookings.slotId, slotId),
        eq(dinnerBookings.groupId, groupId),
        eq(dinnerBookings.paymentStatus, 'paid'),
        ne(dinnerBookings.userId, excludeUserId)
      )
    );

    return members.map(m => ({
      id: m.user.id,
      fullName: m.user.fullName,
      occupation: m.user.occupation,
      bio: m.user.bio
    }));
  }

  async createDinnerSlot(data: {
    city: string;
    date: Date;
    timeSlot: string;
    pricePerPerson: number;
    capacity?: number;
    createdBy: number;
  }) {
    const revealDate = new Date(data.date);
    revealDate.setHours(revealDate.getHours() - 24);

    const [slot] = await db.insert(dinnerSlots).values({
      city: data.city,
      date: data.date,
      timeSlot: data.timeSlot,
      pricePerPerson: data.pricePerPerson.toString(),
      capacity: data.capacity || 24,
      createdBy: data.createdBy,
      restaurantRevealAt: revealDate
    }).returning();

    return slot;
  }

  async recordDiningHistory(slotId: number) {
    const paidBookings = await db.select().from(dinnerBookings)
      .where(
        and(
          eq(dinnerBookings.slotId, slotId),
          eq(dinnerBookings.paymentStatus, 'paid')
        )
      );

    const groupedBookings = new Map<number, typeof paidBookings>();
    paidBookings.forEach(b => {
      if (b.groupId) {
        if (!groupedBookings.has(b.groupId)) {
          groupedBookings.set(b.groupId, []);
        }
        groupedBookings.get(b.groupId)!.push(b);
      }
    });

    for (const [groupId, members] of groupedBookings) {
      for (let i = 0; i < members.length; i++) {
        for (let j = i + 1; j < members.length; j++) {
          await db.insert(diningHistory).values({
            user1Id: members[i].userId,
            user2Id: members[j].userId,
            slotId,
            groupId
          });
        }
      }
    }
  }
}

export const bookingService = new BookingService();
