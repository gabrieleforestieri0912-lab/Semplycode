export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  password?: string | null;
  google_id?: string | null;
  github_id?: string | null;
  image?: string | null;
  created_at: string;
  stripe_customer_id?: string | null;
  subscription_id?: string | null;
  subscription_status: string;
  plan: string;
  subscription_end_date?: string | null;
  daily_analyses_count: number;
  daily_analyses_last_reset: string;
  reset_token?: string | null;
  reset_token_expiry?: string | null;
  login_code?: string | null;
  login_code_expiry?: string | null;
}

export interface ChatMessage {
  role: string;
  content: string;
  timestamp?: string;
}

export interface ChatHistory {
  id: string;
  user_id: string;
  title: string;
  messages: ChatMessage[];
  language: string;
  created_at: string;
  updated_at: string;
}

export interface ShareLink {
  id: string;
  token: string;
  user_id?: string | null;
  payload: unknown;
  created_at: string;
  expires_at: string;
}

// ─── CASSETTO DELLE NOTE ─────────────────────────────────

export interface Note {
  id: string;
  user_id: string;
  title: string;
  snippet_code: string;
  explanation: string;
  language: string;
  source_type: 'webapp' | 'extension';
  source_url: string | null;
  source_ref: string | null;
  status: 'pending' | 'ready';
  leitner_box: number;
  next_review_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface NoteCategory {
  note_id: string;
  category_id: string;
}

export interface LearningPath {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
}

export interface LearningPathNote {
  path_id: string;
  note_id: string;
  position: number;
}

/** Nota arricchita con categorie, percorsi e note correlate (per la UI). */
export interface NoteWithRelations extends Note {
  categories: Category[];
  paths: LearningPath[];
  related?: NoteSummary[];
  due?: boolean;
}

/** Versione compatta della nota per liste e suggerimenti. */
export interface NoteSummary {
  id: string;
  title: string;
  language: string;
  source_type: Note['source_type'];
  status: Note['status'];
  leitner_box: number;
  next_review_at: string | null;
  created_at: string;
  snippet_excerpt: string;
  categories: Category[];
}
