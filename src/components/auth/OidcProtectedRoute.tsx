import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { useEffect, useState } from 'react';
import oidcAuthService from '@/services/auth/oidcAuthService';
import { STORAGE_KEYS } from '@/config/constant';
import { useAuth } from '@/components/contexts/AuthContext';
import { logger } from '@/lib/logger';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const OidcProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [hasValidAuth, setHasValidAuth] = useState(false);
  const { isLoading, refreshContext } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      logger.info('[OidcProtectedRoute] checkAuthAndRedirect called', {
        pathname: location.pathname,
        isSigningOut: oidcAuthService.isSigningOut(),
      });

      try {
        // If we're on /login after logout, clear the signout flag and proceed
        if (location.pathname === '/login' && oidcAuthService.isSigningOut()) {
          logger.info(
            '[OidcProtectedRoute] Arrived at /login after signout, clearing flag...'
          );
          oidcAuthService.clearSignOutFlag();
        }

        // Check if user has valid OIDC token
        const hasValidOidcToken = oidcAuthService.isAuthenticated();

        if (oidcAuthService.isSigningOut()) {
          if (hasValidOidcToken) {
            oidcAuthService.clearSignOutFlag();
          } else {
            // Don't fight the logout redirect with an auth redirect (this can cancel Cognito /logout).
            logger.info(
              '[OidcProtectedRoute] signOut in progress; skipping auth redirect checks.'
            );
            setHasValidAuth(false);
            setIsCheckingAuth(true);

            if (location.pathname !== '/login') {
              navigate('/login', { replace: true });
            }
            return;
          }
        }

        if (!hasValidOidcToken) {
          // No valid token, initiate OIDC sign-in
          logger.info('No valid OIDC token, redirecting to Cognito...');
          await oidcAuthService.signIn(location.pathname);
          return; // This will redirect, so we don't need to do anything else
        }

        const hasCompanySelected = localStorage.getItem(
          STORAGE_KEYS.SELECTED_COMPANY_ID
        );
        const isCompanySelectionPage = location.pathname === '/company-select';
        const isCompanySetupPage = location.pathname === '/company-setup';
        const shouldRedirectToCompanySelection =
          !hasCompanySelected &&
          !isCompanySelectionPage &&
          !isCompanySetupPage;

        if (shouldRedirectToCompanySelection) {
          logger.info(
            'No company selected, redirecting to company selection...'
          );
          navigate('/company-select', { replace: true });
          return;
        }

        if (hasCompanySelected) {
          await refreshContext(false);
        }

        setHasValidAuth(true);
        setIsCheckingAuth(false);
      } catch (error) {
        logger.error('Error checking OIDC authentication:', error);
        setIsCheckingAuth(false);
        setHasValidAuth(false);
      }
    };

    checkAuthAndRedirect();
  }, [location.pathname, navigate]);

  if (isCheckingAuth || isLoading) {
    return <FullPageLoader />;
  }

  if (!hasValidAuth) {
    // Fallback - shouldn't normally reach here due to redirect above
    return <Navigate to="/signin-oidc" replace />;
  }

  return <>{children}</>;
};

export default OidcProtectedRoute;
