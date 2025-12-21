import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  verifySessionToken,
  getSubscriberByEmail,
  updateSubscriber,
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

// POST: Cancel subscription at period end
export async function POST(request: NextRequest) {
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

  if (!subscriber || !subscriber.subscriptionId) {
    return NextResponse.json(
      { error: 'No active subscription found' },
      { status: 404 }
    );
  }

  try {
    const stripeClient = getStripe();

    // Cancel at period end (subscriber can still use until then)
    const subscription = await stripeClient.subscriptions.update(
      subscriber.subscriptionId,
      { cancel_at_period_end: true }
    );

    updateSubscriber(session.email, {
      status: 'active', // Still active until period ends
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const subscriptionData = subscription as any;
    const cancelAt = subscriptionData.cancel_at
      ? new Date(subscriptionData.cancel_at * 1000).toISOString()
      : undefined;

    return NextResponse.json({
      success: true,
      cancelAt,
      currentPeriodEnd: subscriber.currentPeriodEnd?.toISOString(),
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
