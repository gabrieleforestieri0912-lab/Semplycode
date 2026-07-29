import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { findUserById, findUserByStripeCustomerId, updateUser } from '@/lib/supabase/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const sig = req.headers.get('stripe-signature');

    if (!sig) {
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
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
            await updateUser(user.email, {
              subscription_id: session.subscription as string,
              subscription_status: 'active',
              plan: planId || 'pro',
            });
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
            plan: (subscription.metadata?.planId) || user.plan,
          };
          const sub = subscription as unknown as Record<string, unknown>;
          if (sub.current_period_end) {
            updates.subscription_end_date = new Date((sub.current_period_end as number) * 1000).toISOString();
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
