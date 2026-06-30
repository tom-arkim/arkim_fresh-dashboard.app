import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import companyService from '@/services/api/companyService';
import CompanyListItem from '@/types/company/CompanyListItem';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/shadcn/card';
import { Button } from '@/components/ui/shadcn/button';
import { Alert, AlertDescription } from '@/components/ui/shadcn/alert';
import { Building2, ChevronRight, LogOut, ShieldBan } from 'lucide-react';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { STORAGE_KEYS } from '@/config/constant';
import { logger } from '@/lib/logger';
import { useAuth } from '@/components/contexts/AuthContext';
import MessengerService from '@/services/ui/messengerService';
import { CompanyPermission } from '@/config/enum';
import { isCancelledError } from '@/lib/utils';
import { useTheme } from '@/components/contexts/ThemeContext';
import { useCompanyBroadcast } from '@/hooks/broadcasts/use-company-broadcast';

const CompanySelect: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const { refreshContext, signOut, context } = useAuth();
  const { actualTheme } = useTheme();

  // broadcast setup
  const { companyUpdated } = useCompanyBroadcast((event) => {
    if (event.type === 'COMPANY_UPDATED') {
      refreshContext();
    }
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setIsLoading(true);
        const companiesList = await companyService.getList(CompanyPermission.Monitoring);
        setCompanies(companiesList);

        // if (companiesList.length === 0) {
        //   navigate('/company-setup', { replace: true });
        // }
      } catch (err: any) {
        if (isCancelledError(err)) return;
        logger.error('Failed to fetch companies:', err);
        setError(err.message || t('auth.companySelect.loadError'));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, [navigate]);

  const handleSelectCompany = async (companyId: string) => {
    localStorage.setItem(STORAGE_KEYS.SELECTED_COMPANY_ID, companyId);

    companyUpdated();
    await refreshContext();

    if (!context?.user.isAdmin) {
      if (context?.user?.isTechnician && !context.user.isMonitoring) {
        MessengerService.error(t('auth.companySelect.noCompanyPermissions'));
        return;
      }
    }
    navigate('/dashboard', { replace: true });
  };

  const handleLogout = async () => {
    await signOut();
  };

  if (isLoading) {
    return <FullPageLoader />;
  }

  return (
    <main
      className="flex items-center justify-center min-h-screen"
      style={{
        backgroundImage: 'url("/bg-centre-gradient.png")',
      }}
    >
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="space-y-1">
          <CardTitle className="w-full flex items-center justify-center">
            <img
              src={actualTheme === 'light' ? '/logo-light.svg' : '/logo-dark.svg'}
              alt={t('layout.title')}
              className="h-14 w-auto"
            />
          </CardTitle>
          <h2 className="text-xl font-semibold text-center mt-4">
            {t('auth.companySelect.title')}
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            {t('auth.companySelect.subTitle')}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2 max-h-80 overflow-auto">
            {
              companies.length === 0 && (
                <div className='flex flex-col text-center items-center gap-4 mt-2 mb-5'>
                  <ShieldBan className='size-18' strokeWidth={1} />
                  <div className='flex flex-col gap-1'>
                    <p className='font-semibold text-sm'>No assigned company found</p>
                    <p className='text-xs text-muted-foreground'>Please ask admin to assign you a company or else sign in with different account. If you are admin, please create a company.</p>
                  </div>
                </div>
              )
            }
            {companies.map((company) => (
              <button
                key={company.companyId}
                onClick={() => handleSelectCompany(company.companyId)}
                className="w-full flex items-center justify-between p-4 border rounded-lg hover:bg-accent hover:border-primary transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div className="text-left">
                    <div className="font-medium">{company.companyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {company.companyId}
                      {company.isAdmin && (
                        <span className="ml-2 text-primary">
                          {t('users.admin')}
                        </span>
                      )}
                      {!company.isActive && (
                        <span className="ml-2 text-destructive">
                          {t('common.inactive')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>

          <div className="pt-4 border-t flex items-center justify-between gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/company-setup')}
              className="flex-1"
            >
              {t('auth.companySelect.createNew')}
            </Button>

            <Button
              variant="destructive"
              onClick={() => {
                handleLogout();
              }}
            >
              <LogOut />
              {t('layout.preferences.signOut')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default CompanySelect;
