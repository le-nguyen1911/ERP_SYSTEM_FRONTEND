import { useAuthStore } from '../stores/useAuthStore';
import { ROLES } from '../utils/constants';

/**
 * Custom Hook for RBAC permission checks
 */
export function usePermission() {
  const { roles, permissions, isAuthenticated, user } = useAuthStore();

  const isSuperAdmin = roles?.includes(ROLES.SUPER_ADMIN) || false;
  const isAdmin = roles?.includes(ROLES.ADMIN) || false;
  const isManager = roles?.includes(ROLES.MANAGER) || false;

  const hasRole = (roleName) => {
    if (!isAuthenticated || !roles) return false;
    return roles.includes(roleName);
  };

  const hasAnyRole = (roleNames = []) => {
    if (!isAuthenticated || !roles) return false;
    return roleNames.some((r) => roles.includes(r));
  };

  const hasPermission = (permissionName) => {
    if (!isAuthenticated) return false;
    // SUPER_ADMIN and ADMIN have all permissions
    if (isSuperAdmin || isAdmin) return true;
    return permissions?.includes(permissionName) || false;
  };

  const hasAnyPermission = (permissionNames = []) => {
    if (!isAuthenticated) return false;
    if (isSuperAdmin || isAdmin) return true;
    return permissionNames.some((p) => permissions?.includes(p));
  };

  const hasAllPermissions = (permissionNames = []) => {
    if (!isAuthenticated) return false;
    if (isSuperAdmin || isAdmin) return true;
    return permissionNames.every((p) => permissions?.includes(p));
  };

  return {
    roles,
    permissions,
    isAuthenticated,
    user,
    isSuperAdmin,
    isAdmin,
    isManager,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}

