'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { uiSettings } = useAppStore();

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (uiSettings.darkMode) {
      root.classList.add('dark');
      root.classList.remove('light');
      root.style.setProperty('--bg-primary', '0, 0, 0');
      root.style.setProperty('--bg-secondary', '15, 23, 42');
      root.style.setProperty('--bg-panel', 'rgba(15, 23, 42, 0.7)');
      root.style.setProperty('--bg-hover', 'rgba(30, 41, 59, 0.8)');
      root.style.setProperty('--text-primary', '255, 255, 255');
      root.style.setProperty('--text-secondary', '148, 163, 184');
      root.style.setProperty('--border-color', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--scrollbar-track', 'rgba(15, 23, 42, 0.5)');
      root.style.setProperty('--scrollbar-thumb', 'rgba(14, 165, 233, 0.5)');
      root.style.setProperty('--scrollbar-thumb-hover', 'rgba(14, 165, 233, 0.8)');
      body.style.backgroundColor = '#000';
      body.style.color = '#fff';
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      root.style.setProperty('--bg-primary', '255, 255, 255');
      root.style.setProperty('--bg-secondary', '241, 245, 249');
      root.style.setProperty('--bg-panel', 'rgba(255, 255, 255, 0.9)');
      root.style.setProperty('--bg-hover', 'rgba(241, 245, 249, 0.95)');
      root.style.setProperty('--text-primary', '15, 23, 42');
      root.style.setProperty('--text-secondary', '71, 85, 105');
      root.style.setProperty('--border-color', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--scrollbar-track', 'rgba(203, 213, 225, 0.5)');
      root.style.setProperty('--scrollbar-thumb', 'rgba(100, 116, 139, 0.5)');
      root.style.setProperty('--scrollbar-thumb-hover', 'rgba(71, 85, 105, 0.8)');
      body.style.backgroundColor = '#f8fafc';
      body.style.color = '#0f172a';
    }
  }, [uiSettings.darkMode]);

  return <>{children}</>;
}
