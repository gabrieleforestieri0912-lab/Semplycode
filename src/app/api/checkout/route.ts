import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/supabase/server';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const PRICE_MAPPING: Record<string, { productName: string; price: number; interval: 'month' }> = {
  'price_1Rx1kF9ddZe187yvProPlan123': { productName: 'Semplycode Pro', price: 1900, interval: 'month' },
  'price_1Rx1kF9ddZe187yvEnterprisePlan123': { productName: 'Semplycode Enterprise', price: 4900, interval: 'month' }
};

async function getOrCreatePrice(priceId: string): Promise<Stripe.Price> {
  try {
    return await stripe.prices.retrieve(priceId);
  } catch {
    const config = PRICE_MAPPING[priceId];
    if (!config) throw new Error(`Unknown price: ${priceId}`);

    const products = await stripe.products.list({ limit: 1, active: true });
    let product = products.data.find(p => p.name === config.productName);

    if (!product) {
      product = await stripe.products.create({
        name: config.productName,
        description: `Semplycode ${config.productName.split(' ')[1]} Plan`
      });
    }

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: config.price,
      currency: 'usd',
      recurring: { interval: config.interval }
    });

    return price;
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabaseSession = await getSession();
    const email = supabaseSession?.user?.email;
    if (!email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, planId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const price = await getOrCreatePrice(priceId);

    let customerId: string | null = null;
    let customerEmail = email;
    let userId = 'guest';

    const user = await findUserByEmail(email);
    if (user) {
      userId = user.id;
      if (user.stripe_customer_id) {
        customerId = user.stripe_customer_id;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId }
        });
        customerId = customer.id;
        await updateUser(email, { stripe_customer_id: customer.id });
      }
      customerEmail = user.email;
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      payment_method_types: ['card'],
      success_url: `${req.headers.get('origin')}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/?canceled=true`,
      metadata: {
        planId: planId || '',
        userId: userId || 'guest'
      },
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
