import axiosClient from './axiosClient';

/**
 * User Management & RBAC API Module
 * Uses real Spring Boot backend contracts
 */
export const userApi = {
  /**
   * Get paginated users
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<UserInfoResponse>>>}
   */
  getUsers: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/users', { params });
  },

  /**
   * Get user by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<UserInfoResponse>>}
   */
  getUserById: (id) => {
    return axiosClient.get(`/users/${id}`);
  },

  /**
   * Update user details
   * @param {string} id - UUID
   * @param {Object} data - { email, fullname, avatar }
   * @returns {Promise<ApiResponse<UserInfoResponse>>}
   */
  updateUser: (id, data) => {
    return axiosClient.put(`/users/${id}`, data);
  },

  /**
   * Delete user by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<Object>>}
   */
  deleteUser: (id) => {
    return axiosClient.delete(`/users/${id}`);
  },

  /**
   * Lock user account (Admin only)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<Object>>}
   */
  lockUser: (id) => {
    return axiosClient.patch(`/users/${id}/lock`);
  },

  /**
   * Unlock user account (Admin only)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<Object>>}
   */
  unlockUser: (id) => {
    return axiosClient.patch(`/users/${id}/unlock`);
  },

  /**
   * Assign roles to user (Admin only)
   * @param {string} id - UUID
   * @param {string[]} roles - Array of role names, e.g. ['ADMIN', 'MANAGER']
   * @returns {Promise<ApiResponse<UserInfoResponse>>}
   */
  assignRoles: (id, roles) => {
    return axiosClient.post(`/users/${id}/roles`, {
      roles: Array.isArray(roles) ? roles : [roles],
    });
  },

  /**
   * Remove roles from user (Admin only)
   * @param {string} id - UUID
   * @param {string[]} roles - Array of role names
   * @returns {Promise<ApiResponse<Object>>}
   */
  removeRoles: (id, roles) => {
    return axiosClient.delete(`/users/${id}/roles`, {
      data: {
        roles: Array.isArray(roles) ? roles : [roles],
      },
    });
  },

  /**
   * Get all roles list (Admin only)
   * @returns {Promise<ApiResponse<RoleResponse[]>>}
   */
  getRoles: () => {
    return axiosClient.get('/roles');
  },

  /**
   * Create new user via registration endpoint
   * @param {Object} data - { username, password, email, fullname }
   * @returns {Promise<ApiResponse<AuthResponse>>}
   */
  createUser: (data) => {
    return axiosClient.post('/auth/register', data);
  },
};
