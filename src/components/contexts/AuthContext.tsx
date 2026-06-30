import { createContext, useContext, useEffect, useState, useRef } from 'react';
import authService from '@/services/api/authService';
import UserContextDetails from '@/types/user/UserContextDetails';
import oidcAuthService from '@/services/auth/oidcAuthService';
import { useTranslation } from 'react-i18next';
import { useTheme, ThemeMode } from './ThemeContext';
import { STORAGE_KEYS } from '@/config/constant';
import { logger } from '@/lib/logger';

interface AuthContextType {
  context: UserContextDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: () => Promise<void>;
  refreshContext: (reset?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const useUserContext = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useUserContext must be used within an AuthProvider');
  }

  return context.context;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [context, setContext] = useState<UserContextDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setThemeMode } = useTheme();
  const { i18n } = useTranslation();
  const themeInitialized = useRef<boolean>(false);

  useEffect(() => {
    if (context?.user && !themeInitialized.current) {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME_MODE);
      if (!savedTheme && context.user.theme) {
        setThemeMode(context.user.theme as ThemeMode);
      }
      if (context.user.language) {
        logger.info('Language:', context.user.language);
        i18n.changeLanguage(context.user.language);
      }
      themeInitialized.current = true;
    }
  }, [context?.user, setThemeMode, i18n]);

  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);

      try {
        let authenticated = oidcAuthService.isAuthenticated();

        if (!authenticated) {
          try {
            const response = await authService.refreshTokens();
            if (response.idToken) {
              oidcAuthService.setAuthToken(response.idToken);
              authenticated = true;
            }
          } catch {
            // No valid session - user needs to login
          }
        }

        if (authenticated) {
          try {
            const userContext = await authService.getContext();
            setContext(userContext);
          } catch (error) {
            logger.warn('Failed to get user context from backend:', error);
          }
        }
      } catch (error) {
        logger.error('OIDC auth initialization error:', error);
        setContext(null);
      }

      setIsLoading(false);
    };

    initAuth();
  }, []);

  const signIn = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await oidcAuthService.signIn(window.location.pathname);
    } catch (error) {
      logger.error('OIDC sign in error:', error);
    } finally {
      setIsLoading(false);
    }
  };


  const refreshContext = async (reload = true) => {
    try {
      setIsLoading(true);
      // if reload is false, then only check context is not null otherwise refresh context
      if (!reload) {
        if (context) {
          return;
        }
      }
      const userContext = await authService.getContext();
      if (userContext) {
        setContext(userContext);

        setThemeMode(userContext.user.theme as ThemeMode);
        if (userContext.user.language) {
          logger.info('refreshLanguage:', userContext.user.language);
          i18n.changeLanguage(userContext.user.language);
        }
      }
    } catch (error) {
      logger.error('Error refreshing context:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      // Clear all session data
      localStorage.removeItem(STORAGE_KEYS.SELECTED_COMPANY_ID);
      await oidcAuthService.signOut();
    } catch (error) {
      logger.error('Sign out error:', error);
    } finally {
      setContext(null);
      setIsLoading(false);
    }
  };

  const value = {
    context,
    isAuthenticated: !!context,
    isLoading,
    signIn,
    refreshContext,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
