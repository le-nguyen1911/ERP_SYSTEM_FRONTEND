import axiosClient from './axiosClient';

/**
 * Role Management API Module
 * Connected to Spring Boot RoleController (/api/v1/roles)
 */
export const roleApi = {
  /**
   * Get all roles with their assigned permissions
   * @returns {Promise<ApiResponse<RoleResponse[]>>}
   */
  getRoles: () => {
    return axiosClient.get('/roles');
  },

  /**
   * Get role by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<RoleResponse>>}
   */
  getRoleById: (id) => {
    return axiosClient.get(`/roles/${id}`);
  },

  /**
   * Create a new role with optional initial permissions
   * @param {Object} data - { name: string, description?: string, permissions?: string[] }
   * @returns {Promise<ApiResponse<RoleResponse>>}
   */
  createRole: (data) => {
    return axiosClient.post('/roles', data);
  },

  /**
   * Update role information (name, description, permissions)
   * @param {string} id - UUID
   * @param {Object} data - { name: string, description?: string, permissions?: string[] }
   * @returns {Promise<ApiResponse<RoleResponse>>}
   */
  updateRole: (id, data) => {
    return axiosClient.put(`/roles/${id}`, data);
  },

  /**
   * Delete role
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<void>>}
   */
  deleteRole: (id) => {
    return axiosClient.delete(`/roles/${id}`);
  },

  /**
   * Add permissions to role
   * @param {string} id - UUID
   * @param {string[]} permissions - List of permission names
   * @returns {Promise<ApiResponse<RoleResponse>>}
   */
  addPermissions: (id, permissions) => {
    return axiosClient.post(`/roles/${id}/permissions`, permissions);
  },

  /**
   * Remove permissions from role
   * @param {string} id - UUID
   * @param {string[]} permissions - List of permission names
   * @returns {Promise<ApiResponse<RoleResponse>>}
   */
  removePermissions: (id, permissions) => {
    return axiosClient.delete(`/roles/${id}/permissions`, { data: permissions });
  },

  /**
   * Replace the entire permission set for a role
   * @param {string} id - UUID
   * @param {string[]} permissions - Full list of permission names
   * @returns {Promise<ApiResponse<RoleResponse>>}
   */
  setPermissions: (id, permissions) => {
    return axiosClient.put(`/roles/${id}/permissions`, permissions);
  },
};
