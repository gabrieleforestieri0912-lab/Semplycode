import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { once } from '@/lib/rateLimiter';
import { getAuthUser } from '@/lib/api-auth';
import {
  GUEST_DAILY_LIMIT,
  FREE_DAILY_LIMIT,
  isPreviousDay,
} from '@/lib/usageLimits';
import { GUEST_COOKIE, generateGuestId } from '@/lib/guestSession';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';
import { chatWithAI, chatWithAIStream, type ChatMessage } from '@/lib/ai-provider';

const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

async function checkGuestQuota(guestId: string) {
  return once(`guest-usage:${guestId}`, GUEST_WINDOW_MS, GUEST_DAILY_LIMIT);
}

export async function POST(req: NextRequest) {
  try {
    // Autenticazione: sessione cookie (webapp) oppure Bearer token (estensione)
    const authUser = await getAuthUser(req);
    const email = authUser?.email || null;
    const body: { messages?: unknown[]; model?: string; stream?: boolean } = await req.json();
    const messages = body.messages;
    const requestedModel = body.model;
    const wantsStream = body.stream !== false;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'messages array is required' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const model = requestedModel || process.env.OPENAI_MODEL || process.env.OLLAMA_MODEL || 'gpt-4o';
    let setGuestCookie: string | null = null;
    let plan: string | null = null;

    if (!email) {
      const cookieStore = await cookies();
      let guestId = cookieStore.get(GUEST_COOKIE)?.value;
      if (!guestId) {
        guestId = generateGuestId();
        setGuestCookie = guestId;
      }

      const rl = await checkGuestQuota(guestId);
      if (!rl.allowed) {
        return new Response(
          JSON.stringify({
            error: 'Hai usato le 3 analisi gratuite di oggi. Crea un account gratuito per 10 analisi al giorno.',
            code: 'GUEST_LIMIT',
            remainingAnalyses: 0,
          }),
          { status: 429, headers: { 'content-type': 'application/json' } },
        );
      }
    } else {
      const user = await findUserByEmail(email);
      if (!user) {
        return new Response(JSON.stringify({ error: 'Utente non trovato.' }), {
          status: 404,
          headers: { 'content-type': 'application/json' },
        });
      }

      plan = user.plan || 'free';
      if (plan === 'free') {
        const lastReset = user.daily_analyses_last_reset ? new Date(user.daily_analyses_last_reset) : new Date(0);
        if (isPreviousDay(lastReset)) {
          await updateUser(email, { daily_analyses_count: 0, daily_analyses_last_reset: new Date().toISOString() });
        }

        if (user.daily_analyses_count >= FREE_DAILY_LIMIT) {
          return new Response(
            JSON.stringify({
              error: 'Hai raggiunto il limite giornaliero di 10 analisi del piano Free.',
              code: 'FREE_LIMIT',
              remainingAnalyses: 0,
            }),
            { status: 429, headers: { 'content-type': 'application/json' } },
          );
        }
      }
    }

    const incrementUsage = async () => {
      if (email && plan === 'free') {
        const user = await findUserByEmail(email).catch(() => null);
        if (user) {
          await updateUser(email, {
            daily_analyses_count: (user.daily_analyses_count || 0) + 1,
            daily_analyses_last_reset: new Date().toISOString(),
          }).catch(() => {});
        }
      }
    };

    if (!wantsStream) {
      try {
        const result = await chatWithAI({ messages: messages as ChatMessage[], model });
        await incrementUsage();

        const res = new Response(JSON.stringify({ message: { content: result.content } }), {
          headers: { 'content-type': 'application/json' },
        });
        if (setGuestCookie) {
          res.headers.set('set-cookie', `${GUEST_COOKIE}=${setGuestCookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`);
        }
        return res;
      } catch (error) {
        console.error('AI Provider error:', error);
        return new Response(
          JSON.stringify({
            error: error instanceof Error ? error.message : 'Impossibile contattare il motore AI. Verifica la configurazione o riprova più tardi.',
            code: 'AI_ERROR',
          }),
          { status: 500, headers: { 'content-type': 'application/json' } },
        );
      }
    }

    try {
      const aiResponse = await chatWithAIStream({ messages: messages as ChatMessage[], model });
      const aiReader = aiResponse.body?.getReader();
      const decoder = new TextDecoder();

      const stream = new ReadableStream({
        async start(controller) {
          if (!aiReader) {
            controller.close();
            return;
          }

          try {
            while (true) {
              const { done, value } = await aiReader.read();
              if (done) break;
              controller.enqueue(value);
            }
          } catch (err) {
            console.error('Stream proxy error:', err);
          } finally {
            await incrementUsage();
            controller.close();
          }
        },
        cancel() {
          aiReader?.cancel().catch(() => {});
        },
      });

      const res = new Response(stream, {
        headers: {
          'content-type': 'text/event-stream',
          'cache-control': 'no-cache',
          connection: 'keep-alive',
        },
      });
      if (setGuestCookie) {
        res.headers.set('set-cookie', `${GUEST_COOKIE}=${setGuestCookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`);
      }
      return res;
    } catch (error) {
      console.error('AI Provider stream error:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Impossibile contattare il motore AI. Verifica la configurazione o riprova più tardi.',
          code: 'AI_ERROR',
        }),
        { status: 500, headers: { 'content-type': 'application/json' } },
      );
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Impossibile contattare il motore AI. Verifica la configurazione o riprova più tardi.',
        code: 'AI_ERROR',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
