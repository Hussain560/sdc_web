'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { signOut } from '@/modules/auth/actions';

// Read-only mirror of the cookie session for UI (header, forms). Authorization and every protected page
// use the server (`getUser()` / `requirePermission()`); sign-in, sign-up and reset are Server Actions.
interface AuthContextValue {
  user: User | null;
  isLoggedIn: boolean;
  loading: boolean;
  /** True when the user holds an active position (so a dashboard link makes sense). UI hint only. */
  hasPosition: boolean;
  logout: () => Promise<void>;
  /** Re-reads the cookie session — call after a Server Action changed it (sign-in). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<{ userId: string; has: boolean } | null>(null);

  useEffect(() => {
    // getUser() verifies the token with Supabase Auth; the cookie is the source of truth.
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, []);

  // Show the dashboard link only to people who have a position. RLS lets users read their own assignments;
  // authorization itself is always enforced on the server and in the database.
  useEffect(() => {
    if (!user) return;
    const now = new Date().toISOString();
    supabase
      .from('role_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gt.${now}`)
      .then(({ count }) => setPosition({ userId: user.id, has: (count ?? 0) > 0 }));
  }, [user]);
  const hasPosition = !!user && position?.userId === user.id && position.has;

  const refresh = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data.user ?? null);
  };

  const logout = async () => {
    await signOut();
    await supabase.auth.signOut({ scope: 'local' });
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoggedIn: !!user, loading, hasPosition, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
