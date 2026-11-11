import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { api, ApiError, supabase } from '../api';
import type { Profile } from '../types';
import { AppContext } from './AppContext';

export function AppProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileError, setProfileError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [ready, setReady] = useState(false);
  const hadSession = useRef(false);

  const refreshSession = useCallback(async (nextSession?: Session | null, event?: string) => {
    let current = nextSession;
    if (nextSession === undefined) {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        setAuthNotice('Não foi possível verificar sua sessão. Entre novamente para continuar.');
        setSession(null);
        setProfile(null);
        setReady(true);
        return;
      }
      current = data.session;
    }

    const previousSession = hadSession.current;
    hadSession.current = Boolean(current);
    if (event === 'SIGNED_OUT' && previousSession) {
      setAuthNotice('Sua sessão terminou. Entre novamente para continuar.');
    } else if (event === 'SIGNED_IN') {
      setAuthNotice('');
    }

    setSession(current || null);
    if (current) {
      try {
        setProfile(await api<Profile>('/me', 'GET', undefined, current));
        setProfileError('');
      } catch (requestError) {
        setProfile(null);
        setProfileError(requestError instanceof ApiError && requestError.status === 404
          ? ''
          : 'Não foi possível carregar seu perfil. Verifique a conexão e tente novamente.');
      }
    } else {
      setProfile(null);
      setProfileError('');
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void refreshSession();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void refreshSession(nextSession, event);
    });
    return () => subscription.unsubscribe();
  }, [refreshSession]);

  if (!ready) return <div className="auth-initializing" role="status"><span className="ui-spinner" aria-hidden="true" />Verificando sessão...</div>;

  return <AppContext.Provider value={{
    session,
    profile,
    profileError,
    authNotice,
    clearAuthNotice: () => setAuthNotice(''),
    refresh: async () => refreshSession(),
  }}>
    {children}
  </AppContext.Provider>;
}
