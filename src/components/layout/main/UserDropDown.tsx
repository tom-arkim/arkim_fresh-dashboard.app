import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Button } from '@/components/ui/shadcn/button';
import { useAuth, useUserContext } from '@/components/contexts/AuthContext';
import { useTheme } from '@/components/contexts/ThemeContext';
import { Avatar, AvatarFallback } from '@/components/ui/shadcn/avatar';
import { Link } from 'react-router-dom';
import {
  LogOut,
  Settings,
  Moon,
  Sun,
  Monitor,
  Building,
  MapPin,
  Users,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  Webhook,
} from 'lucide-react';
import { useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTranslation } from 'react-i18next';
import MessengerService from '@/services/ui/messengerService';
import { MenuItem } from '@/types/common/common';
import { MODULES } from '@/config/constant';
import Can from '@/components/auth/Can';
import { getAppConfig } from '@/config/environmentVariablesService';
import { cn } from '@/lib/utils';

export function UserDropDown() {
  const userContextDetails = useUserContext(),
    userDetails = userContextDetails?.user;
  const { themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();
  const auth = useAuth();

  const menuItems: MenuItem[] = [
    {
      label: t('layout.menu.general'),
      path: '/settings/general',
      icon: <Settings className="h-4 w-4" />,
      tag: MODULES.GENERAL.TAG,
    },
    {
      label: t('layout.menu.company'),
      path: '/settings/company',
      icon: <Building className="h-4 w-4" />,
      tag: MODULES.COMPANY_DETAILS.TAG,
    },
    {
      label: t('layout.menu.sites'),
      path: '/settings/sites',
      icon: <MapPin className="h-4 w-4" />,
      tag: MODULES.SITES.TAG,
    },
    {
      label: t('layout.menu.users'),
      path: '/settings/users',
      icon: <Users className="h-4 w-4" />,
      tag: MODULES.USERS.TAG,
    },
    {
      label: t('layout.menu.webhooks'),
      path: '/settings/webhooks',
      icon: <Webhook className="h-4 w-4" />,
      tag: MODULES.WEBHOOK.TAG,
    },
  ];

  // Get user initials for the avatar
  const getUserInitials = (): string => {
    if (!userDetails?.firstName) return '?';
    return `${userDetails.firstName.charAt(0)}${userDetails.lastName?.charAt(0) || ''}`;
  };

  const getUserFullName = (): string => {
    if (!userDetails?.firstName) return '?';
    return `${userDetails.firstName ?? ''} ${userDetails.lastName ?? ''}`;
  };

  const openSignOutConfirmation = () => {
    MessengerService.confirm(
      t('auth.signOutConfirmation'),
      t('auth.signOut'),
      async () => {
        await auth.signOut();
      },
      undefined,
      t('auth.signOut'),
      t('common.cancel')
    );
  };

  const isMobile = useIsMobile();
  const [openSettings, setOpenSettings] = useState(false);
  const [openTheme, setOpenTheme] = useState(false);
  const version = getAppConfig().appVersion;

  const toggleSettings = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenSettings((prev) => !prev);
  };

  const toggleTheme = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOpenTheme((prev) => !prev);
  };

  return (
    <DropdownMenu
      onOpenChange={(open) => {
        if (!open) {
          setOpenSettings(false);
          setOpenTheme(false);
        }
      }}
    >
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8 bg-[#84B7C8] text-black rounded-full hover:rounded-md hover:bg-[#84B7C8]">
          <Avatar>
            <AvatarFallback>{getUserInitials()}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-56" align="end">
        {userDetails && (
          <>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {getUserFullName()}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userDetails.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}

        {/* Account Section */}
        <DropdownMenuLabel className="font-medium">
          {t('layout.menu.account')}
        </DropdownMenuLabel>

        {isMobile ? (
          <>
            <div
              className={cn(
                'flex select-none items-center justify-between rounded-md px-2 py-1.5 text-sm outline-none hover:bg-sidebar-accent hover:text-accent-foreground cursor-pointer transition-colors',
                { 'font-medium text-primary bg-sidebar-accent': openSettings }
              )}
              onClick={toggleSettings}
            >
              <div className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                <span className='text-accent-foreground'>{t('layout.menu.settings')}</span>
              </div>
              {openSettings ? (
                <ChevronDown className="h-4 w-4 text-accent-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-accent-foreground" />
              )}
            </div>
            {openSettings && (
              <div className="ml-2 border-l pl-2 space-y-1 my-1">
                {menuItems.map((item) => (
                  <Can tag={item.tag} key={item.path}>
                    <DropdownMenuItem asChild>
                      <Link
                        to={item.path}
                        className="flex items-center w-full hover:cursor-pointer"
                      >
                        <span className="mr-2">{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </DropdownMenuItem>
                  </Can>
                ))}
              </div>
            )}
          </>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span className='text-accent-foreground'>{t('layout.menu.settings')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {menuItems.map((item) => (
                <Can tag={item.tag} key={item.path}>
                  <DropdownMenuItem asChild>
                    <Link
                      to={item.path}
                      className="flex items-center w-full hover:cursor-pointer"
                    >
                      <span className="mr-2">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </DropdownMenuItem>
                </Can>
              ))}
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        {isMobile ? (
          <>
            <div
              className={cn(
                'flex select-none items-center justify-between rounded-md px-2 py-1.5 text-sm outline-none hover:bg-sidebar-accent hover:text-accent-foreground cursor-pointer transition-colors',
                { 'font-medium text-primary bg-sidebar-accent': openTheme }
              )}
              onClick={toggleTheme}
            >
              <div className="flex items-center">
                {themeMode === 'light' ? (
                  <Sun className="mr-2 h-4 w-4" />
                ) : themeMode === 'dark' ? (
                  <Moon className="mr-2 h-4 w-4" />
                ) : (
                  <Monitor className="mr-2 h-4 w-4" />
                )}
                <span className='text-accent-foreground'>{t('layout.preferences.theme.title')}</span>
              </div>
              {openTheme ? (
                <ChevronDown className="h-4 w-4 text-accent-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-accent-foreground" />
              )}
            </div>
            {openTheme && (
              <div className="ml-2 border-l pl-2 space-y-1 my-1">
                <DropdownMenuItem
                  onClick={() => setThemeMode('light')}
                  className="hover:cursor-pointer"
                >
                  <Sun className="mr-2 h-4 w-4" />
                  {t('layout.preferences.theme.light')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setThemeMode('dark')}
                  className="hover:cursor-pointer"
                >
                  <Moon className="mr-2 h-4 w-4" />
                  {t('layout.preferences.theme.dark')}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setThemeMode('system')}
                  className="hover:cursor-pointer"
                >
                  <Monitor className="mr-2 h-4 w-4" />
                  {t('layout.preferences.theme.system')}
                </DropdownMenuItem>
              </div>
            )}
          </>
        ) : (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:cursor-pointer">
              {themeMode === 'light' ? (
                <Sun className="mr-2 h-4 w-4" />
              ) : themeMode === 'dark' ? (
                <Moon className="mr-2 h-4 w-4" />
              ) : (
                <Monitor className="mr-2 h-4 w-4" />
              )}
              <span className='text-accent-foreground'>{t('layout.preferences.theme.title')}</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem
                onClick={() => setThemeMode('light')}
                className="hover:cursor-pointer"
              >
                <Sun className="mr-2 h-4 w-4" />
                {t('layout.preferences.theme.light')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setThemeMode('dark')}
                className="hover:cursor-pointer"
              >
                <Moon className="mr-2 h-4 w-4" />
                {t('layout.preferences.theme.dark')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setThemeMode('system')}
                className="hover:cursor-pointer"
              >
                <Monitor className="mr-2 h-4 w-4" />
                {t('layout.preferences.theme.system')}
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        )}

        <DropdownMenuSeparator />

        {/* Help Center Section */}
        {/* <DropdownMenuLabel className="font-medium">
          {t('layout.menu.helpCenterAndLogout')}
        </DropdownMenuLabel>
        <DropdownMenuItem className="hover:cursor-pointer">
          <HelpCircle className="mr-2 h-4 w-4" />
          <span>{t('layout.menu.helpCenter')}</span>
        </DropdownMenuItem> */}
        <DropdownMenuItem
          onClick={openSignOutConfirmation}
          className="hover:cursor-pointer"
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('auth.signOut')}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <div className="flex items-center justify-between text-xs text-muted-foreground px-2.5 pb-1">
          <span>{t('layout.version')}</span>
          <span>{version}</span>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
