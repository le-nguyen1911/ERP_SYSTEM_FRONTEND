import axiosClient from './axiosClient';

/**
 * Customer Management API Module
 * Connected to Spring Boot CustomerController (/api/v1/customers)
 */
export const customerApi = {
  /**
   * Get all customers (paginated) — used when no keyword/status filter is active.
   * Hits GET /api/v1/customers which supports Pageable (page, size).
   * NOTE: Do NOT pass a sort param; Spring JPA Pageable rejects "createdAt,desc"
   *       as a single value because it parses "desc" as a second property name.
   *       UUID v7 IDs are time-ordered, so default order is already newest-first.
   * @param {Object} params - { page, size }
   * @returns {Promise<ApiResponse<Page<CustomerResponse>>>}
   */
  getCustomers: (params = {}) => {
    const queryParams = {
      page: params.page ?? 0,
      size: params.size ?? 10,
    };
    return axiosClient.get('/customers', { params: queryParams });
  },

  /**
   * Search customers with keyword and/or status filter (paginated).
   * Hits GET /api/v1/customers/search.
   * Only called when at least one of keyword or status filter is active.
   * NOTE: Do NOT pass a sort param for the same reason as above.
   * @param {Object} params - { keyword, status, page, size }
   * @returns {Promise<ApiResponse<Page<CustomerResponse>>>}
   */
  searchCustomers: (params = {}) => {
    const searchParams = {
      keyword: params.keyword ?? '',
      ...(params.status && params.status !== 'ALL'
        ? { status: params.status }
        : {}),
      page: params.page ?? 0,
      size: params.size ?? 10,
    };

    return axiosClient.get('/customers/search', {
      params: searchParams,
    });
  },

  /**
   * Get customer by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<CustomerResponse>>}
   */
  getCustomerById: (id) => {
    return axiosClient.get(`/customers/${id}`);
  },

  /**
   * Create a new customer
   * @param {Object} data - CreateCustomerRequest
   * @returns {Promise<ApiResponse<CustomerResponse>>}
   */
  createCustomer: (data) => {
    return axiosClient.post('/customers', data);
  },

  /**
   * Update customer
   * @param {string} id - UUID
   * @param {Object} data - UpdateCustomerRequest
   * @returns {Promise<ApiResponse<CustomerResponse>>}
   */
  updateCustomer: (id, data) => {
    return axiosClient.put(`/customers/${id}`, data);
  },

  /**
   * Delete / Soft-delete customer
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<void>>}
   */
  deleteCustomer: (id) => {
    return axiosClient.delete(`/customers/${id}`);
  },
};
