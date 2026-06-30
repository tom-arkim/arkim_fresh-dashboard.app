import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useMemo,
} from 'react';
import userService from '../../services/api/userService';
import { NextThemeProvider } from '../../components/theme-provider';
import { STORAGE_KEYS } from '@/config/constant';
import { logger } from '@/lib/logger';

// Define theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Context interface
interface ThemeContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  actualTheme: 'light' | 'dark'; // The resolved theme (system resolves to light or dark)
}

// Create the context with default values
const ThemeContext = createContext<ThemeContextType | null>(null);

// Custom hook to use the ThemeContext
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Props interface for the provider
interface ThemeProviderProps {
  children: ReactNode;
  defaultTheme?: ThemeMode;
}

// TODO: Update this
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  defaultTheme = 'system',
}) => {
  // Initialize theme from localStorage or default
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
    return (saved as ThemeMode) || defaultTheme;
  });

  // System theme detection
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>(() => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light';
  });

  // Resolve actual theme (system mode resolves to light/dark)
  const actualTheme = useMemo(() => {
    return themeMode === 'system'
      ? systemTheme
      : (themeMode as 'light' | 'dark');
  }, [themeMode, systemTheme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme classes to document for shadcn/ui
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(actualTheme);
    root.setAttribute('data-theme', actualTheme);
  }, [actualTheme]);

  // Save theme to localStorage and sync with backend
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);

    // Send to backend
    try {
      await userService.setTheme(mode);
    } catch (error) {
      logger.error('Failed to save theme preference:', error);
    }
  };

  // Toggle between light and dark theme
  const toggleTheme = () => {
    const newMode = actualTheme === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  return (
    <NextThemeProvider
      defaultTheme={defaultTheme}
      attribute={'class'}
      enableSystem
      disableTransitionOnChange
    >
      <ThemeContext.Provider
        value={{
          themeMode,
          setThemeMode,
          isDarkMode: actualTheme === 'dark',
          toggleTheme,
          actualTheme,
        }}
      >
        {children}
      </ThemeContext.Provider>
    </NextThemeProvider>
  );
};

export default ThemeContext;
