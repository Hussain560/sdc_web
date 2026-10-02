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
  logout: () => Promise<void>;
  /** Re-reads the cookie session — call after a Server Action changed it (sign-in). */
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, loading, logout, refresh }}>
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
