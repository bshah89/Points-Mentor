import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Profile } from '../types';

export interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code === 'PGRST116') {
        // Profile doesn't exist yet — create it
        const { data: newProfile } = await supabase
          .from('profiles')
          .insert({ id: userId })
          .select()
          .single();
        setProfile(newProfile);
      } else if (data) {
        setProfile(data);
      }
    } finally {
      setLoading(false);
    }
  }

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isConfigured: isSupabaseConfigured,
  };
}

export async function signInWithEmail(email: string): Promise<{ error: Error | null }> {
  if (!isSupabaseConfigured) {
    return { error: new Error('Supabase is not configured. Add your credentials to .env') };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: 'cardmentor://auth/callback',
    },
  });

  return { error: error as Error | null };
}

export async function signOut(): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
}
