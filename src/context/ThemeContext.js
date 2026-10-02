'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

const STORAGE_KEY = 'sdc_theme';

export function ThemeProvider({ children }) {
  // الديفولت دايمًا Dark، ما يتغيّر إلا إذا المستخدم بنفسه بدّل الوضع
  const [theme, setTheme] = useState('dark');

  // عند التحميل: نقرأ اختيار المستخدم المحفوظ (إن وجد)، وإلا نبقى على Dark
  useEffect(() => {
    let savedTheme = 'dark';
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored;
      }
    } catch (e) {
      // localStorage غير متاح (مثلاً SSR أو خصوصية المتصفح) — نبقى على الديفولت Dark
    }

    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const applyTheme = (nextTheme) => {
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch (e) {
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
