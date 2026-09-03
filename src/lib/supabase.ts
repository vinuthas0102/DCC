import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase environment variables — some features may not work.');
}

export const supabase = createClient(supabaseUrl || '', supabaseAnonKey || '', {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
  },
});

export const validateSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('Session validation error:', error);
      return { valid: false, session: null, error };
    }

    if (!session) {
      return { valid: false, session: null, error: new Error('No active session') };
    }

    const jwt = session.access_token;
    const payload = JSON.parse(atob(jwt.split('.')[1]));

    if (!payload.role && !payload.user_metadata?.role && !payload.app_metadata?.role) {
      console.warn('JWT missing role claim. Session needs refresh.');
      return { valid: false, session, error: new Error('JWT missing role claim'), needsRefresh: true };
    }

    return { valid: true, session, payload };
  } catch (error) {
    console.error('Session validation failed:', error);
    return { valid: false, session: null, error };
  }
};

export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();

    if (error) {
      console.error('Session refresh error:', error);
      throw error;
    }

    return session;
  } catch (error) {
    console.error('Failed to refresh session:', error);
    throw error;
  }
};
