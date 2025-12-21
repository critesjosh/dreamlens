import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import {
  createSessionToken,
  createOpenAIApiKey,
  revokeOpenAIApiKey,
  getSubscriberByCustomerId,
  saveSubscriber,
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

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    const stripeClient = getStripe();
    event = stripeClient.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Webhook signature verification failed' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutComplete(session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const email = session.metadata?.email || session.customer_details?.email;

  if (!email) {
    console.error('No email found in checkout session');
    return;
  }

  // Get subscription details
  const stripeClient = getStripe();
  const subscription = await stripeClient.subscriptions.retrieve(subscriptionId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionData = subscription as any;
  const currentPeriodEnd = subscriptionData.current_period_end
    ? new Date(subscriptionData.current_period_end * 1000)
    : new Date();

  // Create a dedicated OpenAI API key for this subscriber
  const keyResult = await createOpenAIApiKey(email, customerId);

  if (!keyResult) {
    console.error('Failed to create OpenAI API key for subscriber:', email);
    // Continue anyway - admin can manually create the key later
  }

  // Create session token for the subscriber
  await createSessionToken({
    email,
    customerId,
    subscriptionId,
  });

  // Save subscriber data
  saveSubscriber({
    email,
    customerId,
    subscriptionId,
    openaiKeyId: keyResult?.keyId,
    openaiApiKey: keyResult?.apiKey,
    status: 'active',
    currentPeriodEnd,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`Subscription activated for ${email}`);
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriber = getSubscriberByCustomerId(customerId);

  if (!subscriber) {
    console.log('Subscriber not found for customer:', customerId);
    return;
  }

  const status = subscription.status === 'active' ? 'active' :
                 subscription.status === 'past_due' ? 'past_due' :
                 subscription.status === 'canceled' ? 'canceled' : 'none';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const subscriptionData = subscription as any;
  const currentPeriodEnd = subscriptionData.current_period_end
    ? new Date(subscriptionData.current_period_end * 1000)
    : new Date();

  updateSubscriber(subscriber.email, {
    status,
    subscriptionId: subscription.id,
    currentPeriodEnd,
  });

  console.log(`Subscription updated for ${subscriber.email}: ${status}`);
}

async function handleSubscriptionCanceled(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const subscriber = getSubscriberByCustomerId(customerId);

  if (!subscriber) {
    console.log('Subscriber not found for customer:', customerId);
    return;
  }

  // Revoke the OpenAI API key
  if (subscriber.openaiKeyId) {
    const revoked = await revokeOpenAIApiKey(subscriber.openaiKeyId);
    if (!revoked) {
      console.error('Failed to revoke OpenAI API key for:', subscriber.email);
    }
  }

  updateSubscriber(subscriber.email, {
    status: 'canceled',
    openaiKeyId: undefined,
    openaiApiKey: undefined,
  });

  console.log(`Subscription canceled for ${subscriber.email}`);
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string;
  const subscriber = getSubscriberByCustomerId(customerId);

  if (!subscriber) {
    console.log('Subscriber not found for customer:', customerId);
    return;
  }

  updateSubscriber(subscriber.email, {
    status: 'past_due',
  });

  console.log(`Payment failed for ${subscriber.email}`);
}
