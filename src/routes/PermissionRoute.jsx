import { Navigate, Outlet } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';

export function PermissionRoute({
  requiredPermission,
  requiredRole,
  requiredPermissions = [],
  requiredRoles = [],
  children,
}) {
  const { hasPermission, hasRole, hasAnyPermission, hasAnyRole } = usePermission();

  let hasAccess = true;

  if (requiredRole && !hasRole(requiredRole)) {
    hasAccess = false;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    hasAccess = false;
  }

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    hasAccess = false;
  }

  if (requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    hasAccess = false;
  }

  if (!hasAccess) {
    return <Navigate to="/403" replace />;
  }

  return children ? children : <Outlet />;
}
