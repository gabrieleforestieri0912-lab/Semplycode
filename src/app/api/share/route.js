import connectToDatabase from '@/lib/mongodb';
import ShareLink from '@/models/ShareLink';

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { payload, days = 7, userId } = body;
    if (!payload) return new Response(JSON.stringify({ error: 'Missing payload' }), { status: 400 });

    const doc = await ShareLink.createLink({ payload, userId, days });
    const url = `${process.env.NEXTAUTH_URL || ''}/api/share/${doc.token}`;
    return new Response(JSON.stringify({ url, token: doc.token }));
  } catch (e) {
    console.error('Share create error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}

export async function GET(req) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const token = parts[parts.length - 1];
    if (!token) return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400 });
    const doc = await ShareLink.findOne({ token }).lean();
    if (!doc) return new Response(JSON.stringify({ error: 'Not found or expired' }), { status: 404 });
    return new Response(JSON.stringify({ payload: doc.payload }));
  } catch (e) {
    console.error('Share get error', e);
    return new Response(JSON.stringify({ error: 'Server error' }), { status: 500 });
  }
}
