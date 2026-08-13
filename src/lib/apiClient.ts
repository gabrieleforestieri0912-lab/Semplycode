/**
 * Client API condiviso tra webapp ed estensione Chrome.
 *
 * - Webapp: `api = createApiClient()` → URL relativi, auth a cookie.
 * - Estensione: `createApiClient({ baseUrl: () => API_BASE, getToken: () => token })`
 *   → stessa identica logica, auth Bearer.
 *
 * Unica fonte di verità per endpoint, errori e forme delle risposte.
 */

import type {
  Category,
  LearningPath,
  Note,
  NoteWithRelations,
} from '@/lib/supabase/types';

export interface ApiError extends Error {
  status?: number;
  code?: string;
}

export interface ApiClientConfig {
  /** Base URL ('' per la webapp same-origin, l'API_BASE per l'estensione). */
  baseUrl?: string | (() => string);
  /** Fornisce il Bearer token (estensione). */
  getToken?: () => string | null;
  /** Chiamato quando il server risponde 401 (token scaduto). */
  onUnauthorized?: () => void;
}

export interface CreateNoteInput {
  title?: string;
  snippet_code: string;
  explanation: string;
  language?: string;
  source_type?: 'webapp' | 'extension';
  source_url?: string | null;
  source_ref?: string | null;
}

export interface ListNotesParams {
  category?: string;
  q?: string;
  status?: 'pending' | 'ready';
  due?: boolean;
  limit?: number;
}

export function createApiClient(config: ApiClientConfig = {}) {
  const resolveBase = () => {
    const base = typeof config.baseUrl === 'function' ? config.baseUrl() : (config.baseUrl || '');
    return base.replace(/\/$/, '');
  };

  async function fetch(path: string, options: RequestInit = {}): Promise<Response> {
    const base = resolveBase();
    const token = config.getToken?.() || null;

    const headers = new Headers(options.headers);
    if (options.body && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (token) headers.set('Authorization', `Bearer ${token}`);

    const res = await globalThis.fetch(`${base}${path}`, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (!res.ok) {
      if (res.status === 401) config.onUnauthorized?.();
      let data: { error?: string; code?: string } | null = null;
      try {
        data = await res.json();
      } catch {
        /* non-JSON */
      }
      const err = new Error(data?.error || `Errore ${res.status}`) as ApiError;
      err.status = res.status;
      err.code = data?.code;
      throw err;
    }
    return res;
  }

  async function json<T>(path: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(path, options);
    return res.json() as Promise<T>;
  }

  // ── Note ─────────────────────────────────────────────
  const notes = {
    list: (params: ListNotesParams = {}) => {
      const qs = new URLSearchParams();
      if (params.category) qs.set('category', params.category);
      if (params.q) qs.set('q', params.q);
      if (params.status) qs.set('status', params.status);
      if (params.due) qs.set('due', 'true');
      if (params.limit) qs.set('limit', String(params.limit));
      const suffix = qs.toString() ? `?${qs.toString()}` : '';
      return json<{ notes: NoteWithRelations[] }>(`/api/notes${suffix}`);
    },
    create: (input: CreateNoteInput) =>
      json<{ note: Note }>('/api/notes', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    get: (id: string) => json<{ note: NoteWithRelations }>(`/api/notes/${id}`),
    update: (id: string, patch: Partial<Pick<Note, 'title' | 'snippet_code' | 'explanation' | 'language'>>) =>
      json<{ note: Note }>(`/api/notes/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    remove: (id: string) => fetch(`/api/notes/${id}`, { method: 'DELETE' }),
    categorize: (id: string) =>
      json<{ categories: Category[] }>(`/api/notes/${id}/categorize`, { method: 'POST' }),
    categorizePending: () =>
      json<{ processed: number }>('/api/notes/categorize-pending', { method: 'POST' }),
    related: (id: string) =>
      json<{ related: NoteWithRelations[] }>(`/api/notes/${id}/related`),
    findRelated: (id: string) =>
      json<{ related: NoteWithRelations[] }>(`/api/notes/${id}/related`, { method: 'POST' }),
    quiz: (id: string) =>
      json<{ quiz: { question: string; options: string[]; correct: number; explanation: string } }>(
        `/api/notes/${id}/quiz`,
        { method: 'POST' },
      ),
    review: (id: string, correct: boolean) =>
      json<{ note: Note }>(`/api/notes/${id}/review`, {
        method: 'POST',
        body: JSON.stringify({ correct }),
      }),
    dueReviews: (limit = 20) =>
      json<{ notes: NoteWithRelations[] }>(`/api/notes/due-reviews?limit=${limit}`),
  };

  // ── Categorie ────────────────────────────────────────
  const categories = {
    list: () => json<{ categories: Category[] }>('/api/categories'),
  };

  // ── Learning paths ───────────────────────────────────
  const paths = {
    list: () => json<{ paths: LearningPath[] }>('/api/learning-paths'),
    create: (title: string, noteIds: string[]) =>
      json<{ path: LearningPath }>('/api/learning-paths', {
        method: 'POST',
        body: JSON.stringify({ title, noteIds }),
      }),
    remove: (id: string) => fetch(`/api/learning-paths/${id}`, { method: 'DELETE' }),
  };

  // ── Chat ─────────────────────────────────────────────
  const chat = {
    analyze: (messages: { role: string; content: string }[]) =>
      json<{ message: { content: string } }>('/api/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, stream: false }),
      }),
  };

  // ── Auth (link tra webapp ed estensione) ─────────────
  const auth = {
    linkCode: (code: string) =>
      json<{ token: string; user: { email: string } }>('/api/auth/link-code', {
        method: 'POST',
        body: JSON.stringify({ code }),
      }),
  };

  return {
    fetch,
    json,
    notes,
    categories,
    paths,
    chat,
    auth,
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;

/** Singleton per la webapp (URL relativi, auth a cookie). */
export const api = createApiClient();
