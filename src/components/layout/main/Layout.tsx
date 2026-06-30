import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';

// Import our components - fixed relative paths
import { SidebarInset, SidebarProvider } from '@/components/ui/shadcn/sidebar';
import TopNavBar from '@/components/layout/main/TopNavBar';
import SideMenu from '@/components/layout/main/SideMenu';
import useSiteStore from '@/store/siteStore';
import useDataStore from '@/store/dataStore';
import { usePermission } from '@/hooks/usePermission';
import { MODULES } from '@/config/constant';
import CompactLoader from '@/components/ui/CompactLoader';
import { useTranslation } from 'react-i18next';
import SidePanelChat from './side-panel-chat/SidePanelChat';
import { useCompanyBroadcast } from '@/hooks/broadcasts/use-company-broadcast';
import { useAuth } from '@/components/contexts/AuthContext';
import { useSidePanelChat } from '@/components/contexts/SidePanelChat';
import { MessageCircle } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isLoading: isLoadingStore, currentSite } = useSiteStore();
  const { openSidePanelChat, togglePanel } = useSidePanelChat();
  const { fetchUsers, fetchAssets } = useDataStore();
  const { hasPermission } = usePermission();
  const { t } = useTranslation();

  const { refreshContext } = useAuth();

  // broadcast setup
  const { companyUpdated } = useCompanyBroadcast((event) => {
    if (event.type === 'COMPANY_UPDATED') {
      refreshContext();
    }
  });

  useEffect(() => {
    // Fetch users if the user has permission to read users
    const canReadUsers = hasPermission(MODULES.USERS.TAG);
    fetchUsers(canReadUsers);
  }, [fetchUsers, hasPermission]);

  useEffect(() => {
    // Fetch assets when current site changes, if the user has permission to read equipment
    const canReadAssets = hasPermission(MODULES.EQUIPMENT.TAG, MODULES.EQUIPMENT.ACTIONS.READ);
    if (currentSite?.id) {
      fetchAssets(currentSite.id, canReadAssets);
    }
  }, [currentSite?.id, fetchAssets, hasPermission]);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        {/* Left Side Menu - now managed by SidebarProvider */}
        <SideMenu />

        {/* Main Content Area with Sidebar Inset */}
        <SidebarInset
          className="flex flex-col flex-1 h-screen overflow-hidden"
          style={{
            width: 'calc(100% - var(--sidebar-width))',
          }}
        >
          {/* Top Navigation Bar - Fixed at top */}
          <TopNavBar />

          {/* Content area with fixed height */}
          <div className="flex flex-row flex-1 overflow-hidden relative">
            {/* Main scrollable content */}
            <div
              className="flex-1 overflow-y-auto overflow-x-hidden"
              style={{
                backgroundImage: "var(--background-gradient)",
                backgroundAttachment: "fixed",
                backgroundSize: "cover"
              }}
            >
              {/* Main Content Area */}
              <main className="w-full max-w-[2400px] mx-auto px-6 py-8">
                {isLoadingStore ? (
                  <div className="flex items-center justify-center min-h-[400px]">
                    <CompactLoader loadingMessage={t('sites.sitesLoading')} />
                  </div>
                ) : (
                  <Outlet />
                )}
              </main>
            </div>

            {/* Floating Ask Arkim launcher — bottom-right, hidden while panel is open */}
            {!openSidePanelChat && (
              <button
                type="button"
                onClick={togglePanel}
                aria-label="Open Ask Arkim"
                className="ask-arkim-button absolute bottom-5 right-5 z-50 flex items-center gap-2 h-11 px-4 rounded-full text-white text-sm font-semibold shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a95d4] focus-visible:ring-offset-2"
              >
                <MessageCircle className="w-5 h-5 text-white" />
                Ask Arkim
              </button>
            )}

            {/* Fixed Side Panel */}
            <SidePanelChat />
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;