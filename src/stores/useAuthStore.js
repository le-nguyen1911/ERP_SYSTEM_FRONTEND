import { create } from 'zustand';
import { STORAGE_KEYS, ROLE_PERMISSIONS, ROLES } from '../utils/constants';

function computePermissions(roles = []) {
  const permSet = new Set();
  if (!roles || !Array.isArray(roles)) return [];

  // If ADMIN, grant all permissions
  if (roles.includes(ROLES.ADMIN)) {
    return ROLE_PERMISSIONS[ROLES.ADMIN] || [];
  }

  roles.forEach((role) => {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) {
      perms.forEach((p) => permSet.add(p));
    }
  });

  return Array.from(permSet);
}

// Initial state from localStorage
const storedAccessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
const storedRefreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
let storedUser = null;
try {
  const rawUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
  if (rawUser) storedUser = JSON.parse(rawUser);
} catch {
  storedUser = null;
}

const initialRoles = storedUser?.roles ? Array.from(storedUser.roles) : [];
const initialPermissions = computePermissions(initialRoles);

export const useAuthStore = create((set) => ({
  accessToken: storedAccessToken || null,
  refreshToken: storedRefreshToken || null,
  user: storedUser || null,
  roles: initialRoles,
  permissions: initialPermissions,
  isAuthenticated: !!storedAccessToken,
  isLoading: false,

  setAuth: (authResponse) => {
    if (!authResponse) return;

    const { accessToken, refreshToken, user } = authResponse;
    const rolesArray = user?.roles ? Array.from(user.roles) : [];
    const permissionsArray = computePermissions(rolesArray);

    if (accessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
    }
    if (refreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
    }
    if (user) {
      localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
    }

    set({
      accessToken: accessToken || null,
      refreshToken: refreshToken || null,
      user: user || null,
      roles: rolesArray,
      permissions: permissionsArray,
      isAuthenticated: !!accessToken,
      isLoading: false,
    });
  },

  refreshTokens: (newAccessToken, newRefreshToken) => {
    if (newAccessToken) {
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, newAccessToken);
    }
    if (newRefreshToken) {
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);
    }

    set((state) => ({
      accessToken: newAccessToken || state.accessToken,
      refreshToken: newRefreshToken || state.refreshToken,
      isAuthenticated: true,
    }));
  },

  setUser: (updatedUser) => {
    if (!updatedUser) return;
    const rolesArray = updatedUser.roles ? Array.from(updatedUser.roles) : [];
    const permissionsArray = computePermissions(rolesArray);

    localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(updatedUser));
    set({
      user: updatedUser,
      roles: rolesArray,
      permissions: permissionsArray,
    });
  },

  setLoading: (isLoading) => set({ isLoading }),

  clearAuth: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER_INFO);

    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      roles: [],
      permissions: [],
      isAuthenticated: false,
      isLoading: false,
    });
  },
}));
