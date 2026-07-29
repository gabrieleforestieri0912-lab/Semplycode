'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Session, User } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  status: 'loading',
  refreshSession: async () => {},
});

export function useSupabaseSession() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const refreshSession = async () => {
    const supabase = createClient();
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
    setStatus(currentSession ? 'authenticated' : 'unauthenticated');
  };

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      setStatus(initialSession ? 'authenticated' : 'unauthenticated');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setStatus(currentSession ? 'authenticated' : 'unauthenticated');
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ session, user, status, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}
