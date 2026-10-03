'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light';

interface ThemeContextValue {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (nextTheme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'sdc_theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // الديفولت دايمًا Dark، ما يتغيّر إلا إذا المستخدم بنفسه بدّل الوضع
  const [theme, setTheme] = useState<Theme>('dark');

  // عند التحميل: نقرأ اختيار المستخدم المحفوظ (إن وجد)، وإلا نبقى على Dark
  useEffect(() => {
    let savedTheme: Theme = 'dark';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored;
      }
    } catch {
      // localStorage غير متاح (مثلاً SSR أو خصوصية المتصفح) — نبقى على الديفولت Dark
    }

    // Syncs React state with the attribute already set by the pre-paint script in app/layout.tsx.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const applyTheme = (nextTheme: Theme) => {
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // تجاهل أي خطأ بتخزين التفضيل محليًا
    }
  };

  const toggleTheme = () => {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const isDarkMode = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, isDarkMode, toggleTheme, setTheme: applyTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
