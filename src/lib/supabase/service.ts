import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';

let serviceClient: SupabaseClient | null = null;

/**
 * Client Supabase con la service role key.
 *
 * Le route delle note lo usano per autenticare sia gli utenti con sessione
 * cookie (webapp) sia quelli con Bearer token (estensione): l'ownership è
 * sempre imposta nel codice tramite il filtro `user_id = email`.
 *
 * Richiede la variabile d'ambiente SUPABASE_SERVICE_ROLE_KEY (vedi .env.example).
 */
export function getServiceClient(): SupabaseClient {
  if (serviceClient) return serviceClient;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY.\n' +
        'Set SUPABASE_SERVICE_ROLE_KEY in your environment (needed by the notes APIs).',
    );
  }

  serviceClient = createSupabaseClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return serviceClient;
}
