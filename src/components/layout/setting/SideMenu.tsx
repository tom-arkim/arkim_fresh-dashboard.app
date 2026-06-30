import React from 'react';
import { getAppConfig } from '../../../config/environmentVariablesService';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { MapPin, Users, Building, Settings, Webhook } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from '../../ui/shadcn/sidebar';
import { useUserContext } from '@/components/contexts/AuthContext';
import { MenuItem } from '@/types/common/common';
import { MODULES } from '@/config/constant';
import Can from '@/components/auth/Can';
import { useTheme } from '@/components/contexts/ThemeContext';

const SideMenu: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const version = getAppConfig().appVersion;
  const userContextDetails = useUserContext(),
    userDetails = userContextDetails?.user;
  const appConfig = getAppConfig();

  // Define menu items
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

  // Check if a menu item is active
  const isActiveRoute = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const { actualTheme } = useTheme();

  return (
    <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="h-14">
        <div className="flex items-center justify-center h-full">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-foreground no-underline group-data-[collapsible=icon]:hidden hover:bg-accent p-1 rounded-md"
          >
            <img
              src={actualTheme === 'light' ? '/logo-light.svg' : '/logo-dark.svg'}
              alt={appConfig.appName}
              className='w-auto h-7'
            />
          </Link>
          <SidebarTrigger className="ml-auto hover:cursor-pointer" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item, index) => (
                <Can tag={item.tag}>
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActiveRoute(item.path)}
                      tooltip={item.label}
                    >
                      <Link to={item.path} className="flex items-center gap-3">
                        {item.icon}
                        <span className="group-data-[collapsible=icon]:hidden text-foreground">
                          {item.label}
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Can>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default SideMenu;
