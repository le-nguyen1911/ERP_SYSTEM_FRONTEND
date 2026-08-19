import { useAuthStore } from '../stores/useAuthStore';
import { ROLES } from '../utils/constants';

/**
 * Custom Hook for RBAC permission checks
 */
export function usePermission() {
  const { roles, permissions, isAuthenticated, user } = useAuthStore();

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
    // ADMIN has all permissions
    if (roles?.includes(ROLES.ADMIN)) return true;
    return permissions?.includes(permissionName) || false;
  };

  const hasAnyPermission = (permissionNames = []) => {
    if (!isAuthenticated) return false;
    if (roles?.includes(ROLES.ADMIN)) return true;
    return permissionNames.some((p) => permissions?.includes(p));
  };

  const hasAllPermissions = (permissionNames = []) => {
    if (!isAuthenticated) return false;
    if (roles?.includes(ROLES.ADMIN)) return true;
    return permissionNames.every((p) => permissions?.includes(p));
  };

  const isAdmin = roles?.includes(ROLES.ADMIN) || false;
  const isManager = roles?.includes(ROLES.MANAGER) || false;

  return {
    roles,
    permissions,
    isAuthenticated,
    user,
    isAdmin,
    isManager,
    hasRole,
    hasAnyRole,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };
}
