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
