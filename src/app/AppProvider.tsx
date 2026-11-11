import { useCallback, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { api, supabase } from '../api';
import type { Profile } from '../types';
import { AppContext } from './AppContext';

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);

  const refreshSession = useCallback(async (nextSession?: Session | null) => {
    const current = nextSession === undefined
      ? (await supabase.auth.getSession()).data.session
      : nextSession;

    setSession(current || null);
    if (current) {
      try {
        setProfile(await api<Profile>('/me', 'GET', undefined, current));
      } catch {
        setProfile(null);
      }
    } else {
      setProfile(null);
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void refreshSession(nextSession);
    });
    return () => subscription.unsubscribe();
  }, [refreshSession]);

  if (!ready) return <p className="p-8">Iniciando sessão...</p>;

  return <AppContext.Provider value={{
    session,
    profile,
    refresh: async () => refreshSession(),
  }}>
    {children}
  </AppContext.Provider>;
}
