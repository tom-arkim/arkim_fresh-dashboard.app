import React from 'react';
import { useUserContext } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Route wrapper that only allows admin users to access the wrapped component
 * Non-admin users will see the NotFound (404) page instead
 */
const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const context = useUserContext();
  const isAdmin = context?.user?.isAdmin || false;

  // If user is admin, show the requested component, otherwise show 404
  return isAdmin ? <>{children}</> : <Navigate to="/forbidden" replace />;
};

export default AdminRoute;
