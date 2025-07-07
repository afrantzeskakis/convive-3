import { Request, Response } from "express";
import Stripe from "stripe";
import { db } from "./db";
import { InsertDinnerTicket, InsertUserSubscription, User, dinnerTickets, subscriptionPlans, userSubscriptions, users } from "@shared/schema";
import { eq } from "drizzle-orm";

// Initialize Stripe client if API key is available
let stripe: Stripe | null = null;
let stripeEnabled = false;

try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2023-10-16" as any, // Type cast to handle version mismatches
    });
    stripeEnabled = true;
    console.log("Stripe payments enabled");
  } else {
    console.log("Stripe payments disabled - STRIPE_SECRET_KEY not set");
  }
} catch (error) {
  console.error("Failed to initialize Stripe:", error);
  // Continue without Stripe
}

/**
 * Create a one-time payment intent for dinner tickets
 */
export async function createPaymentIntent(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { amount, meetupId, type } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ error: "Payment service is not available. Please try again later." });
    }
    
    // Determine ticket type and calculate final price
    const isHighRollerTicket = type === 'high_roller_ticket';
    let finalAmount = amount;
    
    // For high roller tickets, apply a 1.4x multiplier to the user's average dinner spend
    // if they have a history; otherwise use the base price
    const userWithAverage = await db.select().from(users).where(eq(users.id, req.user.id)).limit(1);
    
    if (isHighRollerTicket && userWithAverage.length > 0 && userWithAverage[0].averageSpendPerDinner) {
      const averageSpend = Number(userWithAverage[0].averageSpendPerDinner);
      if (averageSpend > 0) {
        const calculatedPrice = averageSpend * 1.4;
        // Ensure minimum price is the base price
        finalAmount = Math.max(amount, Math.round(calculatedPrice));
      }
    }
    
    const ticketType = isHighRollerTicket ? "high_roller_ticket" : "dinner_ticket";
    
    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalAmount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        userId: req.user.id.toString(),
        meetupId: meetupId?.toString() || "",
        type: ticketType,
        isHighRoller: isHighRollerTicket ? "true" : "false"
      }
    });

    // Create a pending dinner ticket in the database
    const newTicket: InsertDinnerTicket = {
      userId: req.user.id,
      ticketType: ticketType,
      tier: isHighRollerTicket ? "high_roller" : "standard", // Set the tier based on ticket type
      price: finalAmount,
      isPremium: isHighRollerTicket,
      stripePaymentIntentId: paymentIntent.id,
      status: "pending"
    };

    await db.insert(dinnerTickets).values(newTicket);

    // Return client secret to the client
    res.json({
      clientSecret: paymentIntent.client_secret,
      finalAmount: finalAmount // Return the final amount so client can display it
    });
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get all available subscription plans
 */
export async function getSubscriptionPlans(req: Request, res: Response) {
  try {
    // Note: we're not filtering by active as the column name was changed to isPremium
    const plans = await db.select().from(subscriptionPlans);
    res.json(plans);
  } catch (error: any) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Get a user's current subscription
 */
export async function getUserSubscription(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const userSubs = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.userId, req.user.id))
      .orderBy(userSubscriptions.createdAt);

    // Return the most recent subscription (if any)
    if (userSubs.length === 0) {
      return res.json({ hasSubscription: false });
    }

    const activeSub = userSubs.find(sub => sub.status === "active");
    
    if (!activeSub) {
      return res.json({ 
        hasSubscription: false,
        previousSubscriptions: userSubs
      });
    }

    // Get plan details
    const plan = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, activeSub.planId))
      .limit(1);

    res.json({
      hasSubscription: true,
      subscription: {
        ...activeSub,
        plan: plan[0] || null
      }
    });
  } catch (error: any) {
    console.error("Error fetching user subscription:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Start a subscription for a user
 */
export async function createSubscription(req: Request, res: Response) {
  try {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    // Get the plan
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, planId))
      .limit(1);

    if (!plan) {
      return res.status(404).json({ error: "Subscription plan not found" });
    }
    
    // Note: Previously we restricted Elite Tier (id === "tier4") to premium users only
    // We've removed this restriction as all subscription tiers should be purchasable by anyone
    // Matching for high-roller dinners will be handled separately based on eligibility

    // Check if user already has a Stripe customer ID
    let stripeCustomerId = (req.user as any).stripeCustomerId;

    // Check if Stripe is configured
    if (!stripe) {
      return res.status(503).json({ error: "Payment service is not available. Please try again later." });
    }
    
    // If not, create a Stripe customer
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.fullName,
        metadata: {
          userId: req.user.id.toString()
        }
      });

      stripeCustomerId = customer.id;

      // Update user with Stripe customer ID
      await db
        .update(users)
        .set({ stripeCustomerId })
        .where(eq(users.id, req.user.id));
    }

    // Create a Stripe Price object (if it doesn't exist already)
    let stripePrice;
    try {
      // Try to find an existing price for this plan
      const prices = await stripe.prices.list({
        lookup_keys: [`plan_${plan.id}`],
        active: true,
        limit: 1
      });
      
      if (prices.data.length > 0) {
        stripePrice = prices.data[0];
      } else {
        // Create a new price object for this plan
        stripePrice = await stripe.prices.create({
          unit_amount: Math.round(Number(plan.price) * 100), // Convert to cents
          currency: 'usd',
          recurring: {
            interval: 'month',
            // Apply the 2-month free trial for non-Elite tiers
            trial_period_days: plan.tier === 'elite' ? 0 : 60
          },
          product_data: {
            name: `${plan.name} Subscription`,
            metadata: { 
              dinnerCount: `${plan.dinnerCount} dinners per month` 
            },
          },
          lookup_key: `plan_${plan.id}`,
          metadata: {
            planId: plan.id.toString()
          }
        });
      }
    } catch (error) {
      console.error('Error creating or finding Stripe price:', error);
      return res.status(500).json({ error: 'Failed to set up subscription pricing.' });
    }

    // Create a Stripe subscription with automatic renewal
    let stripeSubscription;
    try {
      // First create the subscription in Stripe
      stripeSubscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          { price: stripePrice.id },
        ],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription',
          payment_method_types: ['card'],
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: req.user.id.toString(),
          planId: plan.id.toString(),
        }
      });
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      return res.status(500).json({ error: 'Failed to create subscription.' });
    }

    // Create our internal subscription record
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1); // Standard monthly billing
    
    const newSubscription: InsertUserSubscription = {
      userId: req.user.id,
      planId: plan.id,
      tier: plan.tier, 
      stripeSubscriptionId: stripeSubscription.id,
      status: plan.tier === 'elite' ? "pending" : "trial", // Elite tiers don't get trials
      dinnersRemaining: plan.dinnerCount, // Start with full dinners
      startDate: startDate,
      endDate: endDate,
      currentPeriodStart: startDate,
      currentPeriodEnd: endDate,
      autoRenew: true,
      cancelAtPeriodEnd: false
    };

    const [subscription] = await db
      .insert(userSubscriptions)
      .values(newSubscription)
      .returning();

    // Get the client secret from the subscription's latest invoice
    // Stripe types are complex, need to handle various objects
    let clientSecret: string | null = null;

    // Ensure stripe is initialized
    if (stripe && stripeSubscription.latest_invoice) {
      try {
        // Cast to any to handle Stripe's complex types
        const latestInvoice: any = typeof stripeSubscription.latest_invoice === 'string'
          ? await stripe.invoices.retrieve(stripeSubscription.latest_invoice, {
              expand: ['payment_intent']
            })
          : stripeSubscription.latest_invoice;
          
        // Get the payment intent safely
        if (latestInvoice && latestInvoice.payment_intent) {
          const paymentIntentId = typeof latestInvoice.payment_intent === 'string' 
            ? latestInvoice.payment_intent
            : latestInvoice.payment_intent.id;
            
          if (paymentIntentId) {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            clientSecret = paymentIntent.client_secret;
          }
        }
      } catch (error) {
        console.error('Error retrieving payment intent:', error);
      }
    }

    // Return client secret to the client
    res.json({
      clientSecret,
      subscription,
      plan,
      stripeSubscriptionId: stripeSubscription.id
    });
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    res.status(500).json({ error: error.message });
  }
}

/**
 * Handle the webhook from Stripe for payment events
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  // This endpoint needs to be updated with your webhook secret from Stripe dashboard
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;

  try {
    // For development without Stripe or when Stripe isn't configured
    if (!stripe || !endpointSecret) {
      console.log("Stripe not configured, accepting webhook payload without verification");
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } else {
      // For production with Stripe configured properly, verify the signature
      event = stripe.webhooks.constructEvent(
        (req as any).rawBody || req.body, 
        sig, 
        endpointSecret
      );
    }
  } catch (err: any) {
    console.error("Webhook Error:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handleSuccessfulPayment(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await handleFailedPayment(event.data.object);
        break;
      case 'invoice.paid':
        await handleInvoicePaid(event.data.object);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(event.data.object);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }
  } catch (error) {
    console.error(`Error handling webhook event ${event.type}:`, error);
  }

  // Return a 200 response to acknowledge receipt of the event
  res.send({ received: true });
}

/**
 * Handle successful payment
 */
async function handleSuccessfulPayment(paymentIntent: Stripe.PaymentIntent) {
  const { userId, meetupId, type, subscriptionId, planId } = paymentIntent.metadata;

  if (type === 'dinner_ticket') {
    // Update dinner ticket status
    await db
      .update(dinnerTickets)
      .set({ status: 'completed' })
      .where(eq(dinnerTickets.stripePaymentIntentId, paymentIntent.id));
  } 
  else if (type === 'subscription') {
    // Update subscription status
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, parseInt(planId)))
      .limit(1);
      
    if (!plan) {
      console.error('Plan not found for subscription', subscriptionId);
      return;
    }

    // Calculate subscription period based on the plan
    const startDate = new Date();
    const endDate = new Date();
    // Default to monthly subscription
    const duration = 1; // 1 month billing cycle
    endDate.setMonth(endDate.getMonth() + duration);

    await db
      .update(userSubscriptions)
      .set({
        status: 'active',
        startDate,
        endDate,
        currentPeriodStart: startDate,
        currentPeriodEnd: endDate,
        dinnersRemaining: plan.dinnerCount, // Reset dinners to full amount
        autoRenew: true,
        cancelAtPeriodEnd: false
      })
      .where(eq(userSubscriptions.id, parseInt(subscriptionId)));
  }
}

/**
 * Handle failed payment
 */
async function handleFailedPayment(paymentIntent: Stripe.PaymentIntent) {
  const { userId, type, subscriptionId } = paymentIntent.metadata;

  if (type === 'dinner_ticket') {
    // Update dinner ticket status
    await db
      .update(dinnerTickets)
      .set({ status: 'canceled' })
      .where(eq(dinnerTickets.stripePaymentIntentId, paymentIntent.id));
  } 
  else if (type === 'subscription') {
    // Update subscription status
    await db
      .update(userSubscriptions)
      .set({ status: 'canceled' })
      .where(eq(userSubscriptions.id, parseInt(subscriptionId)));
  }
}

/**
 * Handle invoice payment success
 * This occurs for recurring subscription payments
 */
async function handleInvoicePaid(invoice: any) {
  // If it's a subscription invoice
  if (invoice.subscription) {
    const stripeSubscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription.id;
      
    // Get associated subscription in our database
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
      
    if (!subscription) {
      console.error('Subscription not found for Stripe subscription ID:', stripeSubscriptionId);
      return;
    }
    
    // Get the subscription plan
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, subscription.planId))
      .limit(1);
      
    if (!plan) {
      console.error('Plan not found for subscription', subscription.id);
      return;
    }
    
    // Get the updated subscription information from Stripe (if Stripe is configured)
    if (!stripe) {
      console.warn('Stripe not configured, using default period dates');
      // Use default values if Stripe not configured
      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1); // Monthly billing cycle
      
      await db
        .update(userSubscriptions)
        .set({
          status: 'active',
          startDate: startDate,
          endDate: endDate,
          currentPeriodStart: startDate,
          currentPeriodEnd: endDate,
          dinnersRemaining: plan.dinnerCount,
          autoRenew: true,
          cancelAtPeriodEnd: false
        })
        .where(eq(userSubscriptions.id, subscription.id));
        
      console.log(`Subscription ${subscription.id} renewed successfully`);
      return;
    }
    
    try {
      // Cast to any to avoid TypeScript errors with Stripe types
      const stripeSubscriptionObj: any = await stripe.subscriptions.retrieve(stripeSubscriptionId);
      
      // Get period details from Stripe subscription
      const currentPeriodStart = new Date((stripeSubscriptionObj.current_period_start as number) * 1000);
      const currentPeriodEnd = new Date((stripeSubscriptionObj.current_period_end as number) * 1000);
      
      // Reset dinners remaining to plan amount
      await db
        .update(userSubscriptions)
        .set({
          status: 'active',
          startDate: currentPeriodStart,
          endDate: currentPeriodEnd,
          currentPeriodStart: currentPeriodStart,
          currentPeriodEnd: currentPeriodEnd,
          dinnersRemaining: plan.dinnerCount,
          cancelAtPeriodEnd: stripeSubscriptionObj.cancel_at_period_end,
          autoRenew: !stripeSubscriptionObj.cancel_at_period_end
        })
        .where(eq(userSubscriptions.id, subscription.id));
        
      console.log(`Subscription ${subscription.id} renewed successfully`);
    } catch (error) {
      console.error('Error retrieving Stripe subscription:', error);
    }
  }
}

/**
 * Handle invoice payment failure
 */
async function handleInvoicePaymentFailed(invoice: any) {
  if (invoice.subscription) {
    const stripeSubscriptionId = typeof invoice.subscription === 'string' 
      ? invoice.subscription 
      : invoice.subscription.id;
      
    // Mark subscription as past_due in our database
    const [subscription] = await db
      .select()
      .from(userSubscriptions)
      .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1);
      
    if (!subscription) {
      console.error('Subscription not found for Stripe subscription ID:', stripeSubscriptionId);
      return;
    }
    
    await db
      .update(userSubscriptions)
      .set({ status: 'past_due' })
      .where(eq(userSubscriptions.id, subscription.id));
      
    console.log(`Subscription ${subscription.id} payment failed, marked as past_due`);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCanceled(subscription: any) {
  const stripeSubscriptionId = subscription.id;
  
  // Mark subscription as canceled in our database
  const [dbSubscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
    
  if (!dbSubscription) {
    console.error('Subscription not found for Stripe subscription ID:', stripeSubscriptionId);
    return;
  }
  
  await db
    .update(userSubscriptions)
    .set({ status: 'canceled' })
    .where(eq(userSubscriptions.id, dbSubscription.id));
    
  console.log(`Subscription ${dbSubscription.id} canceled`);
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdated(subscription: any) {
  const stripeSubscriptionId = subscription.id;
  
  // Get subscription from database
  const [dbSubscription] = await db
    .select()
    .from(userSubscriptions)
    .where(eq(userSubscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
    
  if (!dbSubscription) {
    console.error('Subscription not found for Stripe subscription ID:', stripeSubscriptionId);
    return;
  }
  
  // Update status based on Stripe subscription status
  let status = 'active';
  
  switch(subscription.status) {
    case 'active':
      status = 'active';
      break;
    case 'canceled':
      status = 'canceled';
      break;
    case 'past_due':
      status = 'past_due';
      break;
    case 'unpaid':
      status = 'past_due';
      break;
    case 'trialing':
      status = 'trial';
      break;
    default:
      status = 'pending';
  }
  
  // Get periods from Stripe, cast to any for TypeScript compatibility
  const subscriptionData = subscription as any;
  const currentPeriodStart = new Date(subscriptionData.current_period_start * 1000);
  const currentPeriodEnd = new Date(subscriptionData.current_period_end * 1000);
  
  await db
    .update(userSubscriptions)
    .set({ 
      status, 
      currentPeriodStart,
      currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      autoRenew: !subscription.cancel_at_period_end
    })
    .where(eq(userSubscriptions.id, dbSubscription.id));
    
  console.log(`Subscription ${dbSubscription.id} updated to ${status}`);
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(subscription: any) {
  // This is mostly handled when creating the subscription in our database
  // But we'll add a log to confirm the event was received
  console.log(`Stripe subscription created: ${subscription.id}`);
}