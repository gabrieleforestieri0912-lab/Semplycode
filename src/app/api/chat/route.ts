import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { once } from '@/lib/rateLimiter';
import {
  GUEST_DAILY_LIMIT,
  FREE_DAILY_LIMIT,
  isPreviousDay,
} from '@/lib/usageLimits';
import { GUEST_COOKIE, generateGuestId } from '@/lib/guestSession';
import { getSession } from '@/lib/supabase/server';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';

const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

async function checkGuestQuota(guestId: string) {
  return once(`guest-usage:${guestId}`, GUEST_WINDOW_MS, GUEST_DAILY_LIMIT);
}

export async function POST(req: NextRequest) {
  try {
    const supabaseSession = await getSession();
    const email = supabaseSession?.user?.email || null;
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

    const model = requestedModel || process.env.OLLAMA_MODEL || 'llama3';
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

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const ollamaResponse = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: wantsStream,
      }),
    });

    if (!ollamaResponse.ok) {
      const errText = await ollamaResponse.text().catch(() => '');
      throw new Error(`Ollama error: ${ollamaResponse.statusText} ${errText}`);
    }

    // Increment usage counter
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

    if (!wantsStream || !ollamaResponse.body) {
      // Non-streaming fallback
      const data = await ollamaResponse.json();
      let content = '';
      if (data?.message?.content) content = data.message.content;
      else if (Array.isArray(data.choices) && data.choices[0]?.message?.content) content = data.choices[0].message.content;
      else content = JSON.stringify(data);

      await incrementUsage();

      const res = new Response(JSON.stringify({ message: { content } }), {
        headers: { 'content-type': 'application/json' },
      });
      if (setGuestCookie) {
        res.headers.set('set-cookie', `${GUEST_COOKIE}=${setGuestCookie}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${60 * 60 * 24 * 365}`);
      }
      return res;
    }

    // Streaming response
    const encoder = new TextEncoder();
    const reader = ollamaResponse.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);

            for (const line of lines) {
              try {
                const parsed = JSON.parse(line);
                const delta = parsed.message?.content || parsed.response || '';
                if (delta) {
                  fullContent += delta;
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
                }
                if (parsed.done) break;
              } catch {
                // skip malformed JSON lines
              }
            }
          }
        } catch (err) {
          console.error('Stream error:', err);
        } finally {
          await incrementUsage();
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`));
          controller.close();
          reader.releaseLock();
        }
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
    console.error('API Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Impossibile contattare il motore AI. Verifica che Ollama sia in esecuzione o riprova più tardi.',
        code: 'OLLAMA_ERROR',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } },
    );
  }
}
