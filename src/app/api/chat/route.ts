import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { addTokens, peekTokens } from '@/lib/rateLimiter';
import { getAuthUser } from '@/lib/api-auth';
import { GUEST_COOKIE, generateGuestId } from '@/lib/guestSession';
import { findUserByEmail, updateUser } from '@/lib/supabase/db';
import { chatWithAI, chatWithAIStream, type ChatMessage } from '@/lib/ai-provider';
import {
  GUEST_DAILY_TOKEN_BUDGET,
  estimateMessagesTokens,
  estimateTokens,
  getPlanTokenBudget,
  isNewMonth,
} from '@/lib/tokenBudget';

const GUEST_WINDOW_MS = 24 * 60 * 60 * 1000;

async function checkGuestQuota(guestId: string, inputTokens: number) {
  // Pre-check: stima input disponibile nella finestra giornaliera.
  return peekTokens(`guest-tokens:${guestId}`, GUEST_WINDOW_MS, GUEST_DAILY_TOKEN_BUDGET);
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

    const model = requestedModel || process.env.GEMINI_MODEL || 'gemini-2.0-flash';
    let setGuestCookie: string | null = null;
    let plan: string | null = null;

    // Stima dei token di input (conosciuti prima della risposta)
    const inputTokens = estimateMessagesTokens(messages as ChatMessage[]);

    if (!email) {
      const cookieStore = await cookies();
      let guestId = cookieStore.get(GUEST_COOKIE)?.value;
      if (!guestId) {
        guestId = generateGuestId();
        setGuestCookie = guestId;
      }

      const rl = await checkGuestQuota(guestId, inputTokens);
      if (!rl.allowed || inputTokens >= rl.remaining) {
        return new Response(
          JSON.stringify({
            error: 'Hai esaurito i 30 token gratuiti di oggi. Crea un account gratuito per 100 token al mese.',
            code: 'GUEST_LIMIT',
            remainingTokens: Math.max(0, rl.remaining - inputTokens),
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
      const budget = getPlanTokenBudget(plan);

      if (budget !== null) {
        // Reset mensile: se il periodo salvato non è il mese corrente, azzera.
        let tokensUsed = user.tokens_used_month || 0;
        if (isNewMonth(user.tokens_period_start)) {
          tokensUsed = 0;
          await updateUser(email, {
            tokens_used_month: 0,
            tokens_period_start: new Date().toISOString(),
          }).catch(() => {});
        }

        const remaining = Math.max(0, budget - tokensUsed);
        if (inputTokens >= remaining) {
          return new Response(
            JSON.stringify({
              error:
                plan === 'free'
                  ? `Hai esaurito i 100 token mensili del piano Free. Passa a un piano superiore per più token.`
                  : `Hai esaurito i token mensili del tuo piano.`,
              code: 'PLAN_LIMIT',
              remainingTokens: 0,
            }),
            { status: 429, headers: { 'content-type': 'application/json' } },
          );
        }
      }
    }

    const consumeTokens = async (outputContent: string) => {
      const outputTokens = estimateTokens(outputContent);
      const total = inputTokens + outputTokens;

      if (email && plan) {
        const budget = getPlanTokenBudget(plan);
        if (budget !== null) {
          const user = await findUserByEmail(email).catch(() => null);
          if (user) {
            const current = isNewMonth(user.tokens_period_start) ? 0 : (user.tokens_used_month || 0);
            await updateUser(email, {
              tokens_used_month: current + total,
              tokens_period_start: new Date().toISOString(),
            }).catch(() => {});
          }
        }
        return;
      }

      const cookieStore = await cookies();
      const guestId = cookieStore.get(GUEST_COOKIE)?.value;
      if (guestId) {
        await addTokens(`guest-tokens:${guestId}`, GUEST_WINDOW_MS, GUEST_DAILY_TOKEN_BUDGET, total).catch(() => {});
      }
    };

    if (!wantsStream) {
      try {
        const result = await chatWithAI({ messages: messages as ChatMessage[], model });
        await consumeTokens(result.content);

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
      let streamedText = '';

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
              streamedText += decoder.decode(value, { stream: true });
              controller.enqueue(value);
            }
          } catch (err) {
            console.error('Stream proxy error:', err);
          } finally {
            await consumeTokens(streamedText);
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
