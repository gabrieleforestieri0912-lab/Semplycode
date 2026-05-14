import connectToDatabase from '@/lib/mongodb';
import ChatHistory from '@/models/ChatHistory';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function GET(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = token?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const chats = await ChatHistory.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title messages language createdAt updatedAt')
      .limit(50);

    return NextResponse.json({ chats });
  } catch (error) {
    console.error('Chat History API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = token?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const payload = await req.json();
    // Support legacy fields: code -> included as a user message preview, detectedLang -> language
    const chatId = payload.chatId;
    const title = payload.title || payload.name || 'New Chat';
    const messages = payload.messages || (payload.code ? [{ role: 'user', content: payload.code }] : []);
    const language = payload.detectedLang || payload.language || 'javascript';

    if (!messages || !messages.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (chatId) {
      const updated = await ChatHistory.findOneAndUpdate(
        { _id: chatId, userId },
        { title, messages, language, updatedAt: new Date() },
        { new: true }
      );
      return NextResponse.json({ chat: updated });
    } else {
      const newChat = await ChatHistory.create({
        userId,
        title,
        messages,
        language,
      });
      return NextResponse.json({ chat: newChat });
    }
  } catch (error) {
    console.error('Chat History API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const userId = token?.email;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('id') || searchParams.get('chatId');

    if (!chatId) {
      return NextResponse.json({ error: 'Chat ID required' }, { status: 400 });
    }

    await ChatHistory.findOneAndDelete({ _id: chatId, userId });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Chat History API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
