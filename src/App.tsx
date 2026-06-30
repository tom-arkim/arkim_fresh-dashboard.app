import './App.css';
import './i18n/i18n';
import OidcProtectedRoute from '@/components/auth/OidcProtectedRoute';
import PermissionRoute from '@/components/auth/PermissionRoute';
import { AuthProvider } from '@/components/contexts/AuthContext';
import { MessengerProvider } from '@/components/contexts/MessengerContext';
import { ThemeProvider } from '@/components/contexts/ThemeContext';
import MainLayout from '@/components/layout/main/Layout';
import SettingLayout from '@/components/layout/setting/Layout';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { MODULES } from '@/config/constant';
import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SidePanelChatProvider } from './components/contexts/SidePanelChat';

const SignInOidcCallback = lazy(
  () => import('@/pages/auth/SignInOidcCallback')
);
const CompanySelect = lazy(() => import('@/pages/auth/CompanySelect'));
const CompanySetup = lazy(() => import('@/pages/auth/CompanySetup'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ReadingsReport = lazy(() => import('@/pages/ReadingsReport'));
const MaintenanceScheduling = lazy(
  () => import('@/pages/MaintenanceScheduling')
);
const MaintenanceTasks = lazy(() => import('@/pages/MaintenanceTasks'));
const WorkOrders = lazy(() => import('@/pages/WorkOrders'));
const WorkOrderDetails = lazy(() => import('@/pages/WorkOrderDetails'));
const EquipmentManagement = lazy(() => import('@/pages/EquipmentManagement'));
const Monitoring = lazy(() => import('@/pages/Monitoring'));

const GeneralSettings = lazy(() => import('@/pages/settings/GeneralSettings'));
const CompanyManagement = lazy(
  () => import('@/pages/settings/CompanyManagement')
);
const SitesManagement = lazy(() => import('@/pages/settings/SitesManagement'));
const UserManagement = lazy(() => import('@/pages/settings/UserManagement'));
const WebhookManagement = lazy(
  () => import('@/pages/settings/WebhookManagement')
);
const NotFound = lazy(() => import('@/pages/NotFound'));

const Notification = lazy(() => import('@/pages/Notification'));

const Forbidden = lazy(() => import('@/pages/Forbidden'));

export default function App() {
  return (
    <ThemeProvider>
      <MessengerProvider>
        <AuthProvider>
          <SidePanelChatProvider>
            <Suspense fallback={<FullPageLoader />}>
              <Routes>
                {/* OIDC Callback Route */}
                <Route path="/signin-oidc" element={<SignInOidcCallback />} />

                {/* Company selection and setup - requires OIDC but no company selected yet */}
                <Route
                  path="/company-select"
                  element={
                    <OidcProtectedRoute>
                      <CompanySelect />
                    </OidcProtectedRoute>
                  }
                />
                <Route
                  path="/company-setup"
                  element={
                    <OidcProtectedRoute>
                      <CompanySetup />
                    </OidcProtectedRoute>
                  }
                />

                {/* Auth routes */}
                <Route
                  path="/login"
                  element={
                    <OidcProtectedRoute>
                      <Navigate to="/company-select" replace />
                    </OidcProtectedRoute>
                  }
                />

                {/* All routes are now protected with OIDC and will redirect to Cognito if not authenticated */}
                <Route
                  element={
                    <OidcProtectedRoute>
                      <MainLayout />
                    </OidcProtectedRoute>
                  }
                >
                  {/* Default route redirects to dashboard */}
                  <Route
                    path="/"
                    element={<Navigate to="/dashboard" replace />}
                  />

                  {/* Dashboard */}
                  <Route
                    path="/dashboard/*"
                    element={
                      <PermissionRoute tag={MODULES.DASHBOARD.TAG}>
                        <Dashboard />
                      </PermissionRoute>
                    }
                  />

                  {/* Readings Report */}
                  <Route
                    path="/readings"
                    element={
                      <PermissionRoute tag={MODULES.READINGS.TAG}>
                        <ReadingsReport />
                      </PermissionRoute>
                    }
                  />

                  {/* Maintenance Scheduling */}
                  <Route
                    path="/maintenance"
                    element={
                      <PermissionRoute tag={MODULES.MAINTENANCE.TAG}>
                        <MaintenanceScheduling />
                      </PermissionRoute>
                    }
                  />

                  {/* Maintenance Tasks */}
                  <Route
                    path="/maintenance-tasks"
                    element={
                      <PermissionRoute tag={MODULES.MAINTENANCE_TASKS.TAG}>
                        <MaintenanceTasks />
                      </PermissionRoute>
                    }
                  />

                  {/* Work Orders */}
                  <Route
                    path="/work-orders"
                    element={
                      <PermissionRoute tag={MODULES.WORK_ORDERS.TAG}>
                        <WorkOrders />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/work-orders/:workOrderId"
                    element={
                      <PermissionRoute tag={MODULES.WORK_ORDERS.TAG}>
                        <WorkOrderDetails />
                      </PermissionRoute>
                    }
                  />

                  {/* Monitoring */}
                  <Route
                    path="/monitoring"
                    element={
                      <PermissionRoute tag={MODULES.MONITORING.TAG}>
                        <Monitoring />
                      </PermissionRoute>
                    }
                  />

                  {/* Admin-only routes */}
                  <Route
                    path="/equipment"
                    element={
                      <PermissionRoute tag={MODULES.EQUIPMENT.TAG}>
                        <EquipmentManagement />
                      </PermissionRoute>
                    }
                  />

                  {/* Notification */}
                  <Route
                    path="/notifications"
                    element={
                      <PermissionRoute tag={MODULES.NOTIFICATION.TAG}>
                        <Notification />
                      </PermissionRoute>
                    }
                  />
                </Route>

                {/* Settings Layout (protected with OIDC) */}
                <Route element={<SettingLayout />} path="/settings">
                  <Route
                    path="/settings/general"
                    element={
                      <PermissionRoute tag={MODULES.GENERAL.TAG}>
                        <GeneralSettings />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/settings/company"
                    element={
                      <PermissionRoute tag={MODULES.COMPANY_DETAILS.TAG}>
                        <CompanyManagement />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/settings/sites"
                    element={
                      <PermissionRoute tag={MODULES.SITES.TAG}>
                        <SitesManagement />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/settings/users"
                    element={
                      <PermissionRoute tag={MODULES.USERS.TAG}>
                        <UserManagement />
                      </PermissionRoute>
                    }
                  />
                  <Route
                    path="/settings/webhooks"
                    element={
                      <PermissionRoute tag={MODULES.WEBHOOK.TAG}>
                        <WebhookManagement />
                      </PermissionRoute>
                    }
                  />
                </Route>

                {/* Fallback route for 404 */}
                <Route path="*" element={<NotFound />} />
                {/* Forbidden Route */}
                <Route path="/forbidden" element={<Forbidden />} />
              </Routes>
            </Suspense>
          </SidePanelChatProvider>
        </AuthProvider>
      </MessengerProvider>
    </ThemeProvider>
  );
}
