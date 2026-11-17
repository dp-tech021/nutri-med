import { createContext, useContext } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Profile } from '../types';

export type AppContextValue = {
  session: Session | null;
  profile: Profile | null;
  refresh: () => Promise<void>;
  profileError?: string;
  authNotice?: string;
  clearAuthNotice?: () => void;
};

export const AppContext = createContext<AppContextValue>({
  session: null,
  profile: null,
  refresh: async () => undefined,
});

export const useApp = () => useContext(AppContext);
