import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { getToken } from 'next-auth/jwt';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PRICE_MAPPING = {
  'price_1Rx1kF9ddZe187yvProPlan123': { productName: 'Semplycode Pro', price: 1900, interval: 'month' },
  'price_1Rx1kF9ddZe187yvEnterprisePlan123': { productName: 'Semplycode Enterprise', price: 4900, interval: 'month' }
};

async function getOrCreatePrice(priceId) {
  try {
    return await stripe.prices.retrieve(priceId);
  } catch {
    const config = PRICE_MAPPING[priceId];
    if (!config) throw new Error(`Unknown price: ${priceId}`);
    
    let product;
    const products = await stripe.products.list({ limit: 1, active: true });
    product = products.data.find(p => p.name === config.productName);
    
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

export async function POST(req) {
  try {
    await connectDB();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { priceId, planId } = await req.json();

    if (!priceId) {
      return NextResponse.json({ error: 'Missing priceId' }, { status: 400 });
    }

    const price = await getOrCreatePrice(priceId);

    let customerId = null;
    let customerEmail = token.email;
    let userId = 'guest';

    const user = await User.findOne({ email: token.email });
    if (user) {
      userId = user._id.toString();
      if (user.stripeCustomerId) {
        customerId = user.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId }
        });
        customerId = customer.id;
        user.stripeCustomerId = customer.id;
        await user.save();
      }
      customerEmail = user.email;
    }

    const sessionConfig = {
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
        planId: planId,
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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
