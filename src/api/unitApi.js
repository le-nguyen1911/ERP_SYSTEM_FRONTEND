import axiosClient from './axiosClient';

/**
 * Unit Management API Module
 * Connected to Spring Boot UnitController (/api/v1/units)
 */
export const unitApi = {
  /**
   * Get all units (flat List)
   * @returns {Promise<ApiResponse<UnitResponse[]>>}
   */
  getUnits: () => {
    return axiosClient.get('/units');
  },

  /**
   * Get unit by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<UnitResponse>>}
   */
  getUnitById: (id) => {
    return axiosClient.get(`/units/${id}`);
  },

  /**
   * Create new unit
   * @param {Object} data - { name: string, description?: string }
   * @returns {Promise<ApiResponse<UnitResponse>>}
   */
  createUnit: (data) => {
    return axiosClient.post('/units', data);
  },

  /**
   * Update unit
   * @param {string} id - UUID
   * @param {Object} data - { name: string, description?: string }
   * @returns {Promise<ApiResponse<UnitResponse>>}
   */
  updateUnit: (id, data) => {
    return axiosClient.put(`/units/${id}`, data);
  },

  /**
   * Delete unit
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<void>>}
   */
  deleteUnit: (id) => {
    return axiosClient.delete(`/units/${id}`);
  },
};
