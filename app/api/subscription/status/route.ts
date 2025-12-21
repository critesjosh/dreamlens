import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  verifySessionToken,
  createSessionToken,
  getSubscriberByEmail,
  saveSubscriber,
  createOpenAIApiKey,
} from '@/lib/subscription';

// Lazy initialization to avoid build-time errors
let stripe: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
    });
  }
  return stripe;
}

// GET: Check subscription status
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json(
      { error: 'Authorization required' },
      { status: 401 }
    );
  }

  const session = await verifySessionToken(token);
  if (!session) {
    return NextResponse.json(
      { error: 'Invalid or expired session' },
      { status: 401 }
    );
  }

  const subscriber = getSubscriberByEmail(session.email);

  if (!subscriber) {
    return NextResponse.json({
      status: 'none',
      email: session.email,
    });
  }

  return NextResponse.json({
    status: subscriber.status,
    email: subscriber.email,
    currentPeriodEnd: subscriber.currentPeriodEnd?.toISOString(),
    hasApiKey: !!subscriber.openaiApiKey,
  });
}

// POST: Verify checkout session and create session token
export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    const stripeClient = getStripe();

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripeClient.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    });

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      );
    }

    const customerId = checkoutSession.customer as string;
    const customer = await stripeClient.customers.retrieve(customerId) as Stripe.Customer;
    const email = customer.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Customer email not found' },
        { status: 400 }
      );
    }

    // Get subscription ID from checkout session
    const subscriptionId = typeof checkoutSession.subscription === 'string'
      ? checkoutSession.subscription
      : checkoutSession.subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 400 }
      );
    }

    // Fetch full subscription details
    const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = subscription as any;
    const currentPeriodEnd = subscriptionData.current_period_end
      ? new Date(subscriptionData.current_period_end * 1000)
      : new Date();

    // Check if subscriber already exists
    let subscriber = getSubscriberByEmail(email);

    if (!subscriber) {
      // Create OpenAI API key for new subscriber
      const keyResult = await createOpenAIApiKey(email, customerId);

      subscriber = {
        email,
        customerId,
        subscriptionId: subscription.id,
        openaiKeyId: keyResult?.keyId,
        openaiApiKey: keyResult?.apiKey,
        status: 'active',
        currentPeriodEnd,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      saveSubscriber(subscriber);
    }

    // Create session token
    const sessionToken = await createSessionToken({
      email,
      customerId,
      subscriptionId: subscription.id,
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      email,
      status: subscriber.status,
      currentPeriodEnd: subscriber.currentPeriodEnd?.toISOString(),
    });
  } catch (error) {
    console.error('Status verification error:', error);
    return NextResponse.json(
      { error: 'Failed to verify subscription' },
      { status: 500 }
    );
  }
}
