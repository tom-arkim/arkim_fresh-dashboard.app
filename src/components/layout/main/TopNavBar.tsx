import React from 'react';
import { SidebarTrigger } from '@/components/ui/shadcn/sidebar';
import { useUserContext } from '@/components/contexts/AuthContext';
import { UserDropDown } from '@/components/layout/main/UserDropDown';
import NotificationPopover from '@/components/notification/NotificationPopover';
import { ThemeToggle } from '@/components/theme-toggle';
import { Search } from 'lucide-react';

const TopNavBar: React.FC = () => {
  const userContextDetails = useUserContext();
  const userDetails = userContextDetails?.user;

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        backgroundImage: 'var(--background-gradient)',
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
      }}
    >
      <div className="relative flex h-14 items-center justify-between gap-2 px-2 sm:px-4">
        {/* Left: mobile sidebar trigger */}
        <div className="flex items-center min-w-0 flex-1 basis-0">
          <SidebarTrigger className="md:hidden shrink-0" />
        </div>

        {/* Center: company name */}
        <div className="hidden md:flex items-center justify-center px-4 shrink-0">
          {userDetails && (
            <h1 className="text-base lg:text-lg font-semibold whitespace-nowrap">
              {userContextDetails?.companyName}
            </h1>
          )}
        </div>

        {/* Right: search + theme + notifications + avatar */}
        <div className="flex items-center gap-1 sm:gap-2 justify-end flex-1 basis-0">
          {/* Search placeholder */}
          <div className="hidden sm:flex items-center gap-2 px-3 h-8 rounded-md border border-border bg-card/50 text-sm text-muted-foreground cursor-text min-w-[180px]">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <span>Search…</span>
          </div>

          <ThemeToggle />
          <NotificationPopover />
          <UserDropDown />
        </div>
      </div>
    </header>
  );
};

export default TopNavBar;
