import { getAppConfig } from '@/config/environmentVariablesService';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';

const FullPageLoader = () => {
  const appConfig = getAppConfig();
  const { t } = useTranslation();
  const {actualTheme} = useTheme();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-12">
        {/* ARKIM Logo */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight flex items-center space-x-2 text-foreground no-underline hover:text-foreground/80 group-data-[collapsible=icon]:hidden">
               <img
              src={actualTheme === 'light' ? '/logo-light.svg' : '/logo-dark.svg'}
              alt={appConfig.appName}
              className='w-60'/>            
            </h1>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex flex-col items-center gap-3">
          {/* Spinner */}
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 border-[3px] border-muted rounded-full"></div>
            <div className="absolute inset-0 border-[3px] border-transparent border-t-primary rounded-full animate-spin"></div>
          </div>

          {/* Loading Text with Dots */}
          <div className="flex items-baseline gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {t('common.loading')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullPageLoader;
