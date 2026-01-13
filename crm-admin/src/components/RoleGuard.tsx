import { Navigate } from 'react-router-dom';
import type { User } from '../types';

interface RoleGuardProps {
  user: User;
  allowedRoles: string[];
  children: React.ReactNode;
  redirectPath?: string;
}

const RoleGuard: React.FC<RoleGuardProps> = ({
  user,
  allowedRoles,
  children,
  redirectPath = '/admin/dashboard'
}) => {
  if (!allowedRoles.includes(user.role)) {
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
