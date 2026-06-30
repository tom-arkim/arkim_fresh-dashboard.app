import FullPageLoader from '@/components/ui/FullPageLoader';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Button } from '@/components/ui/shadcn/button';
import oidcAuthService from '@/services/auth/oidcAuthService';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { useTranslation } from 'react-i18next';

const SignInOidcCallback: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        setIsProcessing(true);
        logger.info('Starting OIDC callback processing...');
        logger.info('Current URL:', window.location.href);

        // Check if we have the required parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const error = urlParams.get('error');

        logger.info('URL params:', {
          code,
          error,
          state: urlParams.get('state'),
        });

        if (error) {
          throw new Error(t('auth.error.failed', { error }));
        }

        if (!code) {
          throw new Error(t('auth.error.noCode'));
        }

        await oidcAuthService.signInCallback();
        logger.info('Callback successful, redirecting to company selection');

        navigate('/company-select', { replace: true });
      } catch (error) {
        logger.error('OIDC callback error:', error);
        logger.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
        });
        setError(
          error instanceof Error
            ? `${error.name}: ${error.message}`
            : t('error.authenticationError')
        );
      } finally {
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [navigate]);

  if (isProcessing) {
    return <FullPageLoader />;
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full space-y-4">
          <Alert variant="destructive">
            <AlertDescription className="flex items-center justify-center">{error}</AlertDescription>
          </Alert>
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('auth.error.signInProblem')}
            </p>
            <Button onClick={() => navigate('/login')} variant="outline">
              {t('error.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null; // Should never reach here due to navigation
};

export default SignInOidcCallback;
