import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';
import ChatHistory from '@/models/ChatHistory';

const FREE_DAILY_LIMIT = 10;

function isPreviousDay(date) {
  if (!date) return true;
  const current = new Date();
  const previous = new Date(date);
  return current.toDateString() !== previous.toDateString();
}

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: token.email });

    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });
    }

    if (!user.dailyAnalyses || isPreviousDay(user.dailyAnalyses.lastReset)) {
      user.dailyAnalyses = { count: 0, lastReset: new Date() };
      await user.save();
    }

    const chats = await ChatHistory.countDocuments({ userId: user.email });
    const plan = user.plan || 'free';
    const analyses = user.dailyAnalyses?.count || 0;
    const remainingAnalyses = plan === 'free' ? Math.max(FREE_DAILY_LIMIT - analyses, 0) : null;

    return NextResponse.json({
      plan,
      chats,
      analyses,
      remainingAnalyses,
      dailyLimit: plan === 'free' ? FREE_DAILY_LIMIT : null,
    });
  } catch (error) {
    console.error('User Stats Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}