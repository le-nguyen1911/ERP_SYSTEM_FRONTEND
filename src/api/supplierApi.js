import axiosClient from './axiosClient';

/**
 * Supplier Management API Module
 * Connected to Spring Boot SupplierController (/api/v1/suppliers)
 */
export const supplierApi = {
  /**
   * Get all suppliers (paginated)
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<SupplierResponse>>>}
   */
  getSuppliers: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/suppliers', { params });
  },

  /**
   * Search suppliers with keyword and status filter (paginated)
   * @param {Object} params - { keyword, status, page, size, sort }
   * @returns {Promise<ApiResponse<Page<SupplierResponse>>>}
   */
  searchSuppliers: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    const searchParams = {
      keyword: params.keyword ?? '',
      ...(params.status ? { status: params.status } : {}),
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? 'createdAt,desc',
    };
    return axiosClient.get('/suppliers/search', { params: searchParams });
  },

  /**
   * Get supplier by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<SupplierResponse>>}
   */
  getSupplierById: (id) => {
    return axiosClient.get(`/suppliers/${id}`);
  },

  /**
   * Create a new supplier
   * @param {Object} data - CreateSupplierRequest
   * @returns {Promise<ApiResponse<SupplierResponse>>}
   */
  createSupplier: (data) => {
    return axiosClient.post('/suppliers', data);
  },

  /**
   * Update supplier
   * @param {string} id - UUID
   * @param {Object} data - UpdateSupplierRequest
   * @returns {Promise<ApiResponse<SupplierResponse>>}
   */
  updateSupplier: (id, data) => {
    return axiosClient.put(`/suppliers/${id}`, data);
  },

  /**
   * Delete / Deactivate supplier
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<void>>}
   */
  deleteSupplier: (id) => {
    return axiosClient.delete(`/suppliers/${id}`);
  },
};
