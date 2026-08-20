import axiosClient from './axiosClient';

/**
 * Product Management API Module
 * Connected to Spring Boot ProductController (/api/v1/products)
 */
export const productApi = {
  /**
   * Get paginated active products list
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<ProductResponse>>>}
   */
  getProducts: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/products', { params });
  },

  /**
   * Search products by keyword (name or code)
   * @param {string} search - Search query keyword
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<ProductResponse>>>}
   */
  searchProducts: (search, params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/products/search', {
      params: { search, ...params },
    });
  },

  /**
   * Get product by UUID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<ProductResponse>>}
   */
  getProductById: (id) => {
    return axiosClient.get(`/products/${id}`);
  },

  /**
   * Get product by unique code/SKU
   * @param {string} code - Product Code
   * @returns {Promise<ApiResponse<ProductResponse>>}
   */
  getProductByCode: (code) => {
    return axiosClient.get(`/products/code/${code}`);
  },

  /**
   * Create a new product
   * @param {Object} data - { code, name, description, price, categoryId, unitId }
   * @returns {Promise<ApiResponse<ProductResponse>>}
   */
  createProduct: (data) => {
    return axiosClient.post('/products', data);
  },

  /**
   * Update existing product
   * @param {string} id - UUID
   * @param {Object} data - { name, description, price, categoryId, unitId, active }
   * @returns {Promise<ApiResponse<ProductResponse>>}
   */
  updateProduct: (id, data) => {
    return axiosClient.put(`/products/${id}`, data);
  },

  /**
   * Get only active products (for dropdowns / order selection)
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<ProductResponse>>>}
   */
  getActiveProducts: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/products/active', { params });
  },

  /**
   * Deactivate product (ngừng kinh doanh)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<ProductResponse>>}
   */
  deactivateProduct: (id) => {
    return axiosClient.patch(`/products/${id}/deactivate`);
  },

  /**
   * Activate / Reactivate product (kinh doanh lại)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<ProductResponse>>}
   */
  activateProduct: (id) => {
    return axiosClient.patch(`/products/${id}/activate`);
  },
};
