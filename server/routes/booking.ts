import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { bookingService } from '../services/booking-service';
import { getUncachableStripeClient, getStripePublishableKey } from '../stripeClient';

const router = Router();

function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized - Login required" });
  }
  next();
}

const createSlotSchema = z.object({
  city: z.string().min(1),
  date: z.string().transform(val => new Date(val)),
  timeSlot: z.string().min(1),
  pricePerPerson: z.number().positive(),
  capacity: z.number().positive().optional()
});

router.get('/slots', isAuthenticated, async (req, res) => {
  try {
    const city = req.query.city as string | undefined;
    const slots = await bookingService.getAvailableSlots(city);
    res.json(slots);
  } catch (error) {
    console.error('Error fetching slots:', error);
    res.status(500).json({ message: 'Failed to fetch available slots' });
  }
});

router.get('/slots/:id', isAuthenticated, async (req, res) => {
  try {
    const slotId = parseInt(req.params.id);
    const slot = await bookingService.getSlotById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }
    res.json(slot);
  } catch (error) {
    console.error('Error fetching slot:', error);
    res.status(500).json({ message: 'Failed to fetch slot' });
  }
});

router.post('/slots', isAuthenticated, async (req: any, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = createSlotSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ message: 'Invalid slot data', errors: result.error.flatten() });
    }

    const slot = await bookingService.createDinnerSlot({
      ...result.data,
      createdBy: req.user.id
    });

    res.status(201).json(slot);
  } catch (error) {
    console.error('Error creating slot:', error);
    res.status(500).json({ message: 'Failed to create slot' });
  }
});

router.post('/checkout/:slotId', isAuthenticated, async (req: any, res) => {
  try {
    const slotId = parseInt(req.params.slotId);
    const userId = req.user.id;

    const slot = await bookingService.getSlotById(slotId);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    if (slot.status !== 'open') {
      return res.status(400).json({ message: 'This dinner slot is no longer available' });
    }

    if (slot.currentBookings >= slot.capacity) {
      return res.status(400).json({ message: 'This dinner is fully booked' });
    }

    const stripe = await getUncachableStripeClient();
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Convive Dinner - ${slot.city}`,
            description: `${new Date(slot.date).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })} at ${slot.timeSlot}`,
          },
          unit_amount: Math.round(parseFloat(slot.pricePerPerson) * 100),
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${req.protocol}://${req.get('host')}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get('host')}/booking/cancel`,
      metadata: {
        userId: userId.toString(),
        slotId: slotId.toString(),
        type: 'dinner_booking'
      }
    });

    const booking = await bookingService.createBooking(userId, slotId, session.id);

    res.json({ 
      checkoutUrl: session.url,
      sessionId: session.id,
      bookingId: booking.id
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
});

router.get('/my-bookings', isAuthenticated, async (req: any, res) => {
  try {
    const bookings = await bookingService.getUserBookings(req.user.id);
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings' });
  }
});

router.get('/my-bookings/:id', isAuthenticated, async (req: any, res) => {
  try {
    const bookingId = parseInt(req.params.id);
    const booking = await bookingService.getBookingDetails(bookingId, req.user.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    
    res.json(booking);
  } catch (error) {
    console.error('Error fetching booking details:', error);
    res.status(500).json({ message: 'Failed to fetch booking details' });
  }
});

router.get('/stripe-key', isAuthenticated, async (req, res) => {
  try {
    const publishableKey = await getStripePublishableKey();
    res.json({ publishableKey });
  } catch (error) {
    console.error('Error fetching Stripe key:', error);
    res.status(500).json({ message: 'Failed to fetch payment configuration' });
  }
});

export default router;
