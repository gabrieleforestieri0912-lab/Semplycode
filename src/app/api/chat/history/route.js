import connectToDatabase from '@/lib/mongodb';
import ChatHistory from '@/models/ChatHistory';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

async function getUserKey(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  return token?.email || null;
}

export async function GET(req) {
  try {
    const userId = await getUserKey(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const chats = await ChatHistory.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title messages language createdAt updatedAt')
      .limit(50);

    return NextResponse.json({ chats: chats || [] });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req) {
  try {
    const userId = await getUserKey(req);
    const { chatId, title, messages, language } = await req.json();

    if (!userId || !messages || !messages.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await connectToDatabase();

    let chat;
    if (chatId) {
      chat = await ChatHistory.findOneAndUpdate(
        { _id: chatId, userId },
        { title: title || 'New Chat', messages, language, updatedAt: new Date() },
        { new: true }
      );
    } else {
      chat = await ChatHistory.create({
        userId,
        title: title || 'New Chat',
        messages,
        language: language || 'javascript'
      });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Save Chat History Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const userId = await getUserKey(req);

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing chatId or userId' }, { status: 400 });
    }

    await connectToDatabase();
    await ChatHistory.findOneAndDelete({ _id: chatId, userId });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Chat History Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}