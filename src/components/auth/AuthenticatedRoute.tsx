import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AuthenticatedRoute: React.FC<{ element: React.ReactNode }> = ({
  element,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return !isAuthenticated ? (
    <>{element}</>
  ) : (
    <Navigate to="/dashboard" replace />
  );
};

export default AuthenticatedRoute;
