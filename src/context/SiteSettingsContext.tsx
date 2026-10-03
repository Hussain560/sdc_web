'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_SETTINGS, type PublicSettings } from '@/lib/site-settings-defaults';

const Ctx = createContext<PublicSettings>(DEFAULT_SETTINGS);

/** Public site settings for client components (the footer). Filled once in the root layout. */
export function SiteSettingsProvider({
  value,
  children,
}: {
  value: PublicSettings;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSiteSettings = () => useContext(Ctx);
