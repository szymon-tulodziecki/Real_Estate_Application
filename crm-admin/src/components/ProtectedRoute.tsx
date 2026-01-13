import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
  agentOnly?: boolean;
  redirectTo?: string;
}

const ProtectedRoute = ({ 
  children, 
  adminOnly = false, 
  agentOnly = false, 
  redirectTo = '/admin/dashboard' 
}: ProtectedRouteProps) => {
  const { user, loading, isAdmin, isAgent } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/admin/login" replace />;
  }

  // Sprawdzanie uprawnień administratora
  if (adminOnly && !isAdmin()) {
    return <Navigate to={redirectTo} replace />;
  }

  // Sprawdzanie uprawnień agenta
  if (agentOnly && !isAgent()) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
