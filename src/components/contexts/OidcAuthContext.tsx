import { createContext, useContext, useEffect, useState } from 'react';
import oidcAuthService from '@/services/auth/oidcAuthService';
import authService from '@/services/api/authService';
import UserContextDetails from '@/types/user/UserContextDetails';
import { logger } from '@/lib/logger';

interface OidcAuthContextType {
  userContext: UserContextDetails | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refreshContext: () => Promise<void>;
  signOut: () => Promise<void>;
}

const OidcAuthContext = createContext<OidcAuthContextType | null>(null);

export const useOidcAuth = () => {
  const context = useContext(OidcAuthContext);
  if (!context) {
    throw new Error('useOidcAuth must be used within an OidcAuthProvider');
  }
  return context;
};

export const OidcAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [userContext, setUserContext] = useState<UserContextDetails | null>(
    null
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuth, setIsAuth] = useState<boolean>(false);

  useEffect(() => {
    const initOidcAuth = async () => {
      setIsLoading(true);

      try {
        const authenticated = oidcAuthService.isAuthenticated();
        setIsAuth(authenticated);

        if (authenticated) {
          try {
            const context = await authService.getContext();
            setUserContext(context);
          } catch (error) {
            logger.warn('Failed to get user context from backend:', error);
          }
        }
      } catch (error) {
        logger.error('OIDC auth initialization error:', error);
        setIsAuth(false);
        setUserContext(null);
      }

      setIsLoading(false);
    };

    initOidcAuth();
  }, []);

  const refreshContext = async () => {
    try {
      const context = await authService.getContext();
      setUserContext(context);
    } catch (error) {
      logger.error('Error refreshing user context:', error);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      await oidcAuthService.signOut();
    } catch (error) {
      logger.error('Sign out error:', error);
      window.location.href = '/login';
    } finally {
      setIsAuth(false);
      setUserContext(null);
      setIsLoading(false);
    }
  };

  const value = {
    userContext,
    isAuthenticated: isAuth,
    isLoading,
    refreshContext,
    signOut,
  };

  return (
    <OidcAuthContext.Provider value={value}>
      {children}
    </OidcAuthContext.Provider>
  );
};
