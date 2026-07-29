import { createClient } from './server';
import type { User, ChatHistory, ShareLink } from './types';

// ─── USERS ───────────────────────────────────────────

export async function findUserByEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as User | null;
}

export async function findUserByResetToken(token: string) {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('reset_token', token)
    .gt('reset_token_expiry', now)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as User | null;
}

export async function findUserByStripeCustomerId(customerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('stripe_customer_id', customerId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as User | null;
}

export async function findUserById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as User | null;
}

export async function createUser(user: Partial<User>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .insert({
      email: user.email!.toLowerCase().trim(),
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      password: user.password,
      google_id: user.google_id,
      github_id: user.github_id,
      image: user.image,
    })
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

export async function updateUser(email: string, updates: Partial<User>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('email', email.toLowerCase().trim())
    .select()
    .single();
  if (error) throw error;
  return data as User;
}

export async function getUserStats(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase().trim())
    .single();
  if (error) throw error;
  return data as User;
}

// ─── CHAT HISTORY ────────────────────────────────────

export async function findChatsByUserId(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data || []) as ChatHistory[];
}

export async function findChatById(chatId: string, userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('id', chatId)
    .eq('user_id', userId)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as ChatHistory | null;
}

export async function createChat(chat: {
  user_id: string;
  title?: string;
  messages?: unknown[];
  language?: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_history')
    .insert({
      user_id: chat.user_id,
      title: chat.title || '',
      messages: chat.messages || [],
      language: chat.language || 'javascript',
    })
    .select()
    .single();
  if (error) throw error;
  return data as ChatHistory;
}

export async function updateChat(
  chatId: string,
  userId: string,
  updates: Partial<ChatHistory>,
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('chat_history')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', chatId)
    .eq('user_id', userId)
    .select()
    .single();
  if (error) throw error;
  return data as ChatHistory;
}

export async function deleteChat(chatId: string, userId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('chat_history')
    .delete()
    .eq('id', chatId)
    .eq('user_id', userId);
  if (error) throw error;
}

export async function countChatsByUserId(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from('chat_history')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) throw error;
  return count || 0;
}

// ─── SHARED LINKS ────────────────────────────────────

export async function findShareLinkByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shared_links')
    .select('*')
    .eq('token', token)
    .single();
  if (error && error.code !== 'PGRST116') throw error;
  return data as ShareLink | null;
}

export async function createShareLink(params: {
  payload: unknown;
  userId?: string;
  days?: number;
}) {
  const supabase = await createClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + (params.days || 7) * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from('shared_links')
    .insert({
      token,
      user_id: params.userId || null,
      payload: params.payload,
      expires_at: expiresAt,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ShareLink;
}
