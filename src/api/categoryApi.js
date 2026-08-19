import axiosClient from './axiosClient';

/**
 * Category Management API Module
 * Connected to Spring Boot CategoryController (/api/v1/categories)
 */
export const categoryApi = {
  /**
   * Get all categories (flat List)
   * @returns {Promise<ApiResponse<CategoryResponse[]>>}
   */
  getCategories: () => {
    return axiosClient.get('/categories');
  },

  /**
   * Get category by ID
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<CategoryResponse>>}
   */
  getCategoryById: (id) => {
    return axiosClient.get(`/categories/${id}`);
  },

  /**
   * Create new category
   * @param {Object} data - { name: string, description?: string }
   * @returns {Promise<ApiResponse<CategoryResponse>>}
   */
  createCategory: (data) => {
    return axiosClient.post('/categories', data);
  },

  /**
   * Update category
   * @param {string} id - UUID
   * @param {Object} data - { name: string, description?: string }
   * @returns {Promise<ApiResponse<CategoryResponse>>}
   */
  updateCategory: (id, data) => {
    return axiosClient.put(`/categories/${id}`, data);
  },

  /**
   * Delete category (returns HTTP 204 No Content)
   * @param {string} id - UUID
   * @returns {Promise<void>}
   */
  deleteCategory: (id) => {
    return axiosClient.delete(`/categories/${id}`);
  },
};
