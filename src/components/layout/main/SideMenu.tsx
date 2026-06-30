import React from 'react';
import { getAppConfig } from '../../../config/environmentVariablesService';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Database,
  LayoutDashboard,
  Box,
  Wrench,
  Activity,
  Settings,
  ArrowLeftFromLine,
  ClipboardList,
  CalendarDays,
} from 'lucide-react';
import { SiteDropDown } from '@/components/layout/main/SiteDropDown';
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
import { MenuItem } from '@/types/common/common';
import Can from '@/components/auth/Can';
import { MODULES } from '@/config/constant';
import { useTheme } from '@/components/contexts/ThemeContext';

const SideMenu: React.FC = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const appConfig = getAppConfig();
  const { actualTheme } = useTheme();

  // Define menu items
  const menuItems: MenuItem[] = [
    {
      label: t('layout.menu.dashboard'),
      path: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      tag: MODULES.DASHBOARD.TAG,
    },
    {
      label: t('layout.menu.monitoring'),
      path: '/monitoring',
      icon: <Activity className="h-4 w-4" />,
      tag: MODULES.MONITORING.TAG,
    },
    {
      label: t('layout.menu.equipment'),
      path: '/equipment',
      icon: <Box className="h-4 w-4" />,
      tag: MODULES.EQUIPMENT.TAG,
    },
    {
      label: t('layout.menu.workOrders'),
      path: '/work-orders',
      icon: <ClipboardList className="h-4 w-4" />,
      tag: MODULES.WORK_ORDERS.TAG,
    },
    {
      label: t('layout.menu.maintenance'),
      path: '/maintenance',
      icon: <CalendarDays className="h-4 w-4" />,
      tag: MODULES.MAINTENANCE.TAG,
    },
    {
      label: t('layout.menu.maintenanceTasks'),
      path: '/maintenance-tasks',
      icon: <Wrench className="h-4 w-4" />,
      tag: MODULES.MAINTENANCE_TASKS.TAG,
    },
    {
      label: t('layout.menu.readings'),
      path: '/readings',
      icon: <Database className="h-4 w-4" />,
      tag: MODULES.READINGS.TAG,
    }
  ];

  // Check if a menu item is active
  const isActiveRoute = (path: string) => {
    // For exact matching, check if the path matches exactly or is followed by a slash
    if (location.pathname === path) {
      return true;
    }
    // For nested routes, check if pathname starts with path followed by a slash
    return location.pathname.startsWith(path + '/');
  };

  return (
    <Sidebar collapsible="icon" className="border-0">
      <SidebarHeader className="h-14">
        <div className="flex items-center justify-center h-full">
          <Link
            to="/dashboard"
            className="flex items-center space-x-2 text-foreground no-underline group-data-[collapsible=icon]:hidden hover:bg-sidebar-accent p-1 rounded-md"
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

      {/* Site selector — hidden when sidebar is collapsed to icon rail */}
      <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
        <SiteDropDown />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <Can tag={item.tag} key={item.path}>
                  <SidebarMenuItem>
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


      <SidebarMenu className='p-2'>
        <Can tag={MODULES.GENERAL.TAG} key={'/settings/general'}>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              isActive={isActiveRoute('/settings/general')}
              tooltip={t('layout.menu.settings')}
            >
              <Link to={'/settings/general'} className="flex items-center gap-3">
                <Settings className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden text-sidebar-foreground">
                  {t('layout.menu.settings')}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </Can>
      </SidebarMenu>

      <SidebarFooter className='border-t-1'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip='Back to Company'>
              <Link to={'/company-select'} className="flex items-center gap-2">
                <ArrowLeftFromLine className="h-4 w-4" />
                <span className="group-data-[collapsible=icon]:hidden">
                  {t('layout.menu.backToCompanySelect')}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default SideMenu;
