import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/api-auth';
import {
  findChatsByUserId,
  findChatById,
  createChat,
  updateChat,
  deleteChat,
} from '@/lib/supabase/db';
import {
  fallbackChatTitle,
  generateChatTitleWithAI,
} from '@/lib/chatTitle';
import { findUserByEmail, countChatsByUserId } from '@/lib/supabase/db';
import { getPlanLimits } from '@/lib/planLimits';

interface ChatMessage {
  role: string;
  content: string;
  timestamp?: Date;
}

async function getUserKey(req: NextRequest): Promise<string | null> {
  const user = await getAuthUser(req);
  return user?.email || null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserKey(req);

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const chats = await findChatsByUserId(userId);

    return NextResponse.json({ chats: chats || [] });
  } catch (error) {
    console.error('Get Chat History Error:', error);
    return NextResponse.json({ chats: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserKey(req);
    const body: { chatId?: string; title?: string; messages?: ChatMessage[]; language?: string; generateTitleFrom?: string } = await req.json();
    const { chatId, title, messages, language, generateTitleFrom } = body;

    if (!userId || !messages || !messages.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let chat;
    if (chatId) {
      const update: Record<string, unknown> = { messages, language };
      if (title) update.title = title;
      chat = await updateChat(chatId, userId, update as any);
    } else {
      // Enforce piano: limite numero chat
      const user = await findUserByEmail(userId).catch(() => null);
      const limits = getPlanLimits(user?.plan || 'free');
      if (limits.maxChatHistory !== null) {
        const currentCount = await countChatsByUserId(userId).catch(() => 0);
        if (currentCount >= limits.maxChatHistory) {
          return NextResponse.json({ error: `Hai raggiunto il limite di ${limits.maxChatHistory} chat per il piano ${user?.plan || 'free'}. Passa a un piano superiore.` }, { status: 403 });
        }
      }
      const firstUserMessage: string =
        generateTitleFrom ||
        (messages.find((m: ChatMessage) => m.role === 'user')?.content) ||
        '';

      let resolvedTitle = title;
      if (!resolvedTitle && generateTitleFrom) {
        resolvedTitle = await generateChatTitleWithAI(firstUserMessage);
      }
      if (!resolvedTitle) {
        resolvedTitle = fallbackChatTitle(firstUserMessage);
      }

      chat = await createChat({
        user_id: userId,
        title: resolvedTitle,
        messages: messages as unknown as { role?: string; content?: string; timestamp?: Date }[],
        language: language || 'javascript',
      });
    }

    return NextResponse.json({ chat });
  } catch (error) {
    console.error('Save Chat History Error:', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatId = searchParams.get('chatId');
    const userId = await getUserKey(req);

    if (!chatId || !userId) {
      return NextResponse.json({ error: 'Missing chatId or userId' }, { status: 400 });
    }

    await deleteChat(chatId, userId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Chat History Error:', error);
    const err = error as Error;
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
