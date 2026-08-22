import axiosClient from './axiosClient';

/**
 * Customer Management API Module
 * Connected to Spring Boot CustomerController (/api/v1/customers)
 */
export const customerApi = {
  /**
   * Get all customers (paginated)
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<CustomerResponse>>>}
   */
  getCustomers: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/customers', { params });
  },

  /**
   * Search customers with keyword and status filter (paginated)
   * @param {Object} params - { keyword, status, page, size, sort }
   * @returns {Promise<ApiResponse<Page<CustomerResponse>>>}
   */
  searchCustomers: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    const searchParams = {
      ...(params.keyword ? { keyword: params.keyword } : {}),
      ...(params.status && params.status !== 'ALL' ? { status: params.status } : {}),
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? 'createdAt,desc',
    };
    return axiosClient.get('/customers/search', { params: searchParams });
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
