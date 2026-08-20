import axiosClient from './axiosClient';

/**
 * Warehouse Management API Module
 * Connected to Spring Boot WarehouseController (/api/v1/warehouses)
 */
export const warehouseApi = {
  /**
   * Get all warehouses
   * @returns {Promise<ApiResponse<WarehouseResponse[]>>}
   */
  getWarehouses: () => {
    return axiosClient.get('/warehouses');
  },

  /**
   * Get all active warehouses (for select dropdowns)
   * @returns {Promise<ApiResponse<WarehouseResponse[]>>}
   */
  getActiveWarehouses: () => {
    return axiosClient.get('/warehouses/active');
  },

  /**
   * Get warehouse by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<WarehouseResponse>>}
   */
  getWarehouseById: (id) => {
    return axiosClient.get(`/warehouses/${id}`);
  },

  /**
   * Create a new warehouse
   * @param {Object} data - { name: string, location?: string, description?: string }
   * @returns {Promise<ApiResponse<WarehouseResponse>>}
   */
  createWarehouse: (data) => {
    return axiosClient.post('/warehouses', data);
  },

  /**
   * Update warehouse details
   * @param {string} id - UUID
   * @param {Object} data - { name: string, location?: string, description?: string, active: boolean }
   * @returns {Promise<ApiResponse<WarehouseResponse>>}
   */
  updateWarehouse: (id, data) => {
    return axiosClient.put(`/warehouses/${id}`, data);
  },

  /**
   * Delete / Deactivate warehouse
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<void>>}
   */
  deleteWarehouse: (id) => {
    return axiosClient.delete(`/warehouses/${id}`);
  },
};
