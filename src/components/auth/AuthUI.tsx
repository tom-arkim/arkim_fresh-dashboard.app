import React from 'react';
import { useTranslation } from 'react-i18next';

interface ErrorDisplayProps {
  message: string;
  onRetry: () => void;
}

export const LoadingSpinner: React.FC<{ message?: string }> = ({ message }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        <p className="mt-4 text-gray-700 text-lg">
          {message || t('common.loading')}
        </p>
      </div>
    </div>
  );
};

export const RedirectingMessage: React.FC = () => {
  const { t } = useTranslation();

  return <LoadingSpinner message={t('common.redirecting')} />;
};

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  message,
  onRetry,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="max-w-md w-full">
        <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mx-auto">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mt-4 text-center">
          {t('error.authenticationError')}
        </h3>
        <p className="text-sm text-gray-600 mt-2 text-center">{message}</p>
        <button
          onClick={onRetry}
          className="mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-xs text-sm font-medium text-white hover:opacity-90 focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {t('error.tryAgain')}
        </button>
      </div>
    </div>
  );
};
