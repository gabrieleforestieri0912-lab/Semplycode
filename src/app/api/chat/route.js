import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

const FREE_DAILY_LIMIT = 10;

function isPreviousDay(date) {
  if (!date) return true;
  const current = new Date();
  const previous = new Date(date);
  return current.toDateString() !== previous.toDateString();
}

export async function POST(req) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const messages = body.messages;
    const requestedModel = body.model;

    // Basic payload validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }
    // Allow overriding model via request, otherwise use env default or fallback
    const model = requestedModel || process.env.OLLAMA_MODEL || 'llama3';
    await connectToDatabase();

    const user = await User.findOne({ email: token.email });
    if (!user) {
      return NextResponse.json({ error: 'Utente non trovato.' }, { status: 404 });
    }

    const plan = user.plan || 'free';
    if (plan === 'free') {
      if (!user.dailyAnalyses || isPreviousDay(user.dailyAnalyses.lastReset)) {
        user.dailyAnalyses = { count: 0, lastReset: new Date() };
        await user.save();
      }

      if (user.dailyAnalyses.count >= FREE_DAILY_LIMIT) {
        return NextResponse.json(
          { error: 'Hai raggiunto il limite giornaliero di 10 analisi del piano Free.' },
          { status: 429 }
        );
      }
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    const response = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama error: ${response.statusText}`);
    }

    const data = await response.json();

    // Normalize response shape for the frontend: expect { message: { content: string } }
    let message = null;
    if (data?.message) {
      // Ollama (or other LLM) might return message as a string or as an object
      if (typeof data.message === 'string') {
        message = { content: data.message };
      } else if (typeof data.message === 'object' && data.message.content) {
        message = data.message;
      } else if (Array.isArray(data)) {
        // some adapters return an array of candidate messages
        const first = data[0];
        if (first && (first.content || typeof first === 'string')) {
          message = { content: first.content || first };
        }
      } else {
        // fallback: stringify
        message = { content: JSON.stringify(data.message) };
      }
    } else if (data?.choices && Array.isArray(data.choices) && data.choices[0]) {
      // OpenAI-like shape
      const c = data.choices[0];
      message = { content: c.message?.content || c.text || JSON.stringify(c) };
    } else {
      message = { content: JSON.stringify(data) };
    }

    if (plan === 'free') {
      user.dailyAnalyses.count += 1;
      user.dailyAnalyses.lastReset = new Date();
      await user.save();
    }

    return NextResponse.json({ message });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Unable to connect to local model. Verify that Ollama is running.' },
      { status: 500 }
    );
  }
}
