import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useUIStore } from '../../store/ui-store';
import type { Theme } from '../../store/types';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export default function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  // Hydrate UIStore from localStorage on first mount (before IndexedDB hydration completes)
  useEffect(() => {
    const saved = localStorage.getItem('genechat-theme');
    if (saved === 'light' || saved === 'dark') {
      useUIStore.getState().setTheme(saved);
    }
  }, []);

  // Side effects: sync data-theme attribute and localStorage whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('genechat-theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
