import React from 'react';
import { Outlet } from 'react-router-dom';

// Import our components - fixed relative paths
import SideMenu from './SideMenu';
import { SidebarInset, SidebarProvider } from '@/components/ui/shadcn/sidebar';
import TopNavBar from '@/components/layout/setting/TopNavBar';
import { useCompanyBroadcast } from '@/hooks/broadcasts/use-company-broadcast';
import { useAuth } from '@/components/contexts/AuthContext';

const MainLayout: React.FC = () => {
  const { refreshContext } = useAuth();
  // broadcast setup
  const { companyUpdated } = useCompanyBroadcast((event) => {
    if (event.type === 'COMPANY_UPDATED') {
      refreshContext();
    }
  });


  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Left Side Menu - now managed by SidebarProvider */}
        <SideMenu />

        {/* Main Content Area with Sidebar Inset */}
        <SidebarInset
          className="flex flex-col flex-1"
          style={{
            width: 'calc(100% - var(--sidebar-width))',
          }}
        >
          {/* Top Navigation Bar */}
          <TopNavBar />

          <div className="flex flex-1 relative overflow-hidden" >
            {/* Main Content Area */}
            <main className="flex-1 overflow-auto bg-background max-w-[2400px] mx-auto px-6 py-8 scrollable" style={{
              backgroundImage: "var(--background-gradient)",
              backgroundAttachment: "fixed",
              backgroundSize: "cover"
            }}>
              <Outlet />
            </main>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
