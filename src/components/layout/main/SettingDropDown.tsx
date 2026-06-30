import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/shadcn/dropdown-menu';
import { Button } from '@/components/ui/shadcn/button';
import { Settings, LogOut } from 'lucide-react';
import { useUserContext, useAuth } from '@/components/contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MessengerService from '@/services/ui/messengerService';
import authService from '@/services/api/authService';

export function SettingMenu() {
  const { t } = useTranslation();
  const auth = useAuth();
  const userContextDetails = useUserContext(),
    userDetails = userContextDetails?.user;

  const navigate = useNavigate();

  const openSignOutConfirmation = () => {
    MessengerService.confirm(
      t('auth.signOutConfirmation'),
      t('auth.signOut'),
      async () => {
        await authService.signOut();
        navigate('/login', { replace: true });
      },
      undefined,
      t('auth.signOut'),
      t('common.cancel')
    );
  };

  const getUserFullName = (): string => {
    if (!userDetails?.firstName) return '?';
    return `${userDetails.firstName ?? ''} ${userDetails.lastName ?? ''}`;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings />
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

        <DropdownMenuItem>
          <Link to={'/settings/general'} className="flex items-center w-full">
            <Settings className="mr-2 h-4 w-4" />
            <span>{t('layout.menu.settings')}</span>
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={openSignOutConfirmation} className='hover:cursor-pointer'>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t('auth.signOut')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
