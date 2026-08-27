import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { findUserById, findUserByStripeCustomerId, updateUser } from '@/lib/supabase/db';

let stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY non configurata');
    }
    stripe = new Stripe(key);
  }
  return stripe;
}

/** Estrae l'id della subscription dall'evento checkout.session.completed. */
function subscriptionIdFromSession(session: Stripe.Checkout.Session): string | null {
  if (typeof session.subscription === 'string') return session.subscription;
  if (session.subscription && typeof session.subscription === 'object') {
    return session.subscription.id;
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = getStripe().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET as string);
    } catch (err) {
      console.error('Webhook signature verification failed:', (err as Error).message);
      return NextResponse.json({ error: (err as Error).message }, { status: 400 });
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const planId = session.metadata?.planId;

        if (userId && userId !== 'guest') {
          const user = await findUserById(userId);
          if (user) {
            const subscriptionId = subscriptionIdFromSession(session);
            const updates: Record<string, unknown> = {
              subscription_status: 'active',
              plan: planId || 'pro',
            };
            if (subscriptionId) updates.subscription_id = subscriptionId;
            await updateUser(user.email, updates);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          const updates: Record<string, unknown> = {
            subscription_status: subscription.status,
            plan: subscription.metadata?.planId || user.plan,
          };
          // In Stripe v20 il periodo corrente sta sul subscription item.
          const periodEnd = subscription.items?.data?.[0]?.current_period_end;
          if (periodEnd) {
            updates.subscription_end_date = new Date(periodEnd * 1000).toISOString();
          }
          await updateUser(user.email, updates);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await updateUser(user.email, {
            subscription_status: 'canceled',
            plan: 'free',
            subscription_id: null,
          });
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const user = await findUserByStripeCustomerId(customerId);
        if (user) {
          await updateUser(user.email, { subscription_status: 'past_due' });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('Webhook Error:', err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
