import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import FullPageLoader from '@/components/ui/FullPageLoader';
import { useAuth } from '@/components/contexts/AuthContext';
import { usePermission } from '@/hooks/usePermission';
import { ModulesTag } from '@/types/common/common';
import oidcAuthService from '@/services/auth/oidcAuthService';

interface PermissionRouteProps {
  children: React.ReactNode;
  tag?: ModulesTag;
  action?: string | string[] | null;
}

const PermissionRoute: React.FC<PermissionRouteProps> = ({
  children,
  tag,
  action,
}) => {
  const { isLoading } = useAuth();
  const { hasPermission } = usePermission();
  const isSignOutInFlight = oidcAuthService.isSigningOut();
  // While auth context is loading, wait (so usePermission has access to user)
  if (isLoading || isSignOutInFlight) {
    return <FullPageLoader />;
  }

  if (tag && !hasPermission(tag as ModulesTag, action)) {
    return <Navigate to="/forbidden" replace />;
  }

  return <>{children}</>;
};

export default PermissionRoute;
