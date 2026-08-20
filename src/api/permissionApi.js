import axiosClient from './axiosClient';

/**
 * Permission Management API Module
 * Connected to Spring Boot PermissionController (/api/v1/permissions)
 */
export const permissionApi = {
  /**
   * Get all system permissions
   * @returns {Promise<ApiResponse<PermissionResponse[]>>}
   */
  getPermissions: () => {
    return axiosClient.get('/permissions');
  },

  /**
   * Create a new custom permission
   * @param {Object} data - { name: string, description?: string }
   * @returns {Promise<ApiResponse<PermissionResponse>>}
   */
  createPermission: (data) => {
    return axiosClient.post('/permissions', data);
  },
};
