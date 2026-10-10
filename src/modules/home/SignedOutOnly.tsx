'use client';

import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';

/**
 * The home page is cached and shared, so who is signed in is decided in the browser. Visitors and members see
 * different calls to action: `SignedOutOnly` hides its children for members, `SignedInOnly` is the reverse.
 */
export function SignedOutOnly({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? null : children;
}

export function SignedInOnly({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : null;
}
