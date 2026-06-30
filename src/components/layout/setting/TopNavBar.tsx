import React from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/shadcn/sidebar';
import { useUserContext } from '@/components/contexts/AuthContext';
import { Link } from 'react-router-dom';

const TopNavBar: React.FC = () => {
  const { t } = useTranslation();
  const userContextDetails = useUserContext(),
    userDetails = userContextDetails?.user;

  return (
    <header className="sticky top-0 z-50 w-full" style={{
      backgroundImage: "var(--background-gradient)",
      backgroundAttachment: "fixed",
      backgroundSize: "cover"
    }}>
      <div className="flex h-14 items-center px-4">
        {/* Left side - Menu Button and Logo */}
        <div className="flex items-center space-x-2">
          {/* Menu Button - only for admin users */}
          {userDetails?.isAdmin && <SidebarTrigger className="md:hidden" />}
        </div>

        <div className="flex items-center space-x-2">
          <Link
            to="/"
            className="flex items-center gap-2 hover:bg-muted py-2 px-4 rounded-md transition-colors"
            title={t('common.backToDashboard')}
          >
            <ArrowLeft className="sm:h-4 sm:w-4 h-6 w-6" />
            <span className='sm:block hidden'>
              {t('common.backToDashboard')}
            </span>
          </Link>
          <h1 className="font-semibold text-xl">{t('layout.menu.settings')}</h1>
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
