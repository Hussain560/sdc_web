'use client';

import { Moon, Sun } from 'lucide-react';
import { IconAction } from '@/components/ui/IconAction';
import { Switch } from '@/components/ui/Switch';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { CHROME } from './chrome-strings';

/** Icon toggle (header). Shows Sun in dark mode (go light) and Moon in light mode, `aria-pressed` = light is on. */
export function ThemeSwitch() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { lang } = useLanguage();
  const s = CHROME[lang];
  return (
    <IconAction
      label={isDarkMode ? s.toLight : s.toDark}
      variant="ghost"
      pressed={!isDarkMode}
      onClick={toggleTheme}
    >
      {isDarkMode ? (
        <Sun aria-hidden="true" className="size-5" />
      ) : (
        <Moon aria-hidden="true" className="size-5" />
      )}
    </IconAction>
  );
}

/** Row version with a switch, for the mobile sheet. */
export function ThemeSwitchRow() {
  const { isDarkMode, setTheme } = useTheme();
  const { lang } = useLanguage();
  return (
    <Switch
      checked={!isDarkMode}
      onChange={(light) => setTheme(light ? 'light' : 'dark')}
      label={CHROME[lang].lightMode}
    />
  );
}
