import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSession } from '@/lib/supabase/server';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';

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

// I prezzi sono in centesimi e allineati a quelli mostrati nella UI (/pricing).
// La chiave è il priceId inviato dal frontend (o il planId come fallback).
const PLANS: Record<string, { productName: string; amount: number; currency: string; interval: 'month' }> = {
  starter: { productName: 'Semplycode Starter', amount: 999, currency: 'eur', interval: 'month' },
  pro: { productName: 'Semplycode Pro', amount: 1999, currency: 'eur', interval: 'month' },
  enterprise: { productName: 'Semplycode Enterprise', amount: 4999, currency: 'eur', interval: 'month' },
};

// Alias: i priceId del frontend puntano al piano corrispondente.
const PRICE_ALIASES: Record<string, string> = {
  'price_1Rx1kF9ddZe187yvStarterPlan123': 'starter',
  'price_1Rx1kF9ddZe187yvProPlan123': 'pro',
  'price_1Rx1kF9ddZe187yvEnterprisePlan123': 'enterprise',
};

function resolvePlan(priceId: string, planId?: string): string {
  return PRICE_ALIASES[priceId] || planId || priceId;
}

async function getOrCreatePrice(planKey: string): Promise<Stripe.Price> {
  const plan = PLANS[planKey];
  if (!plan) {
    throw new Error(`Piano sconosciuto: ${planKey}`);
  }

  const stripe = getStripe();

  // 1) Cerca un prezzo esistente per prodotto + importo + valuta + intervallo,
  //    così non si creano prezzi duplicati a ogni checkout.
  const products = await stripe.products.list({ active: true, limit: 100 });
  let product = products.data.find((p) => p.name === plan.productName);

  if (!product) {
    product = await stripe.products.create({
      name: plan.productName,
      description: `Semplycode ${planKey} Plan`,
    });
  }

  const prices = await stripe.prices.list({
    product: product.id,
    active: true,
    limit: 100,
  });
  const existing = prices.data.find(
    (p) =>
      p.unit_amount === plan.amount &&
      p.currency === plan.currency &&
      p.recurring?.interval === plan.interval,
  );
  if (existing) return existing;

  // 2) Nessun prezzo compatibile: creane uno nuovo.
  return stripe.prices.create({
    product: product.id,
    unit_amount: plan.amount,
    currency: plan.currency,
    recurring: { interval: plan.interval },
  });
}

function getSiteUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get('origin') ||
    'http://localhost:3000'
  );
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

    const planKey = resolvePlan(priceId, planId);
    const price = await getOrCreatePrice(planKey);

    let customerId: string | null = null;
    let customerEmail = email;
    let userId = 'guest';

    const user = await findUserByEmail(email);
    if (user) {
      userId = user.id;
      if (user.stripe_customer_id) {
        customerId = user.stripe_customer_id;
      } else {
        const customer = await getStripe().customers.create({
          email: user.email,
          metadata: { userId },
        });
        customerId = customer.id;
        await updateUser(email, { stripe_customer_id: customer.id });
      }
      customerEmail = user.email;
    }

    const siteUrl = getSiteUrl(req);
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${siteUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/#prezzi?canceled=true`,
      metadata: {
        planId: planKey,
        userId: userId || 'guest',
      },
      // Il planId serve al webhook customer.subscription.updated per ripristinare
      // il piano quando Stripe invia eventi di subscription (rinnovi, cambi).
      subscription_data: {
        metadata: { planId: planKey },
      },
    };

    if (customerId) {
      sessionConfig.customer = customerId;
    } else if (customerEmail) {
      sessionConfig.customer_email = customerEmail;
    }

    const session = await getStripe().checkout.sessions.create(sessionConfig);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (err) {
    console.error('Stripe Checkout Error:', err);
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
