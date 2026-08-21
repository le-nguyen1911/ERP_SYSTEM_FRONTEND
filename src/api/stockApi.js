import axiosClient from './axiosClient';

/**
 * Inventory / Stock Management API Module
 * Connected to Spring Boot StockController (/api/v1/stocks)
 */
export const stockApi = {
  /**
   * Get stock levels for a product across all warehouses
   * @param {string} productId - UUID
   * @returns {Promise<ApiResponse<ProductStockResponse[]>>}
   */
  getStockByProduct: (productId) => {
    return axiosClient.get(`/stocks/product/${productId}`);
  },

  /**
   * Get stock levels for all products in a specific warehouse
   * @param {string} warehouseId - UUID
   * @returns {Promise<ApiResponse<ProductStockResponse[]>>}
   */
  getStockByWarehouse: (warehouseId) => {
    return axiosClient.get(`/stocks/warehouse/${warehouseId}`);
  },

  /**
   * Get all stock records where quantity <= minQuantity
   * @returns {Promise<ApiResponse<ProductStockResponse[]>>}
   */
  getLowStock: () => {
    return axiosClient.get('/stocks/low-stock');
  },

  /**
   * Get paginated transaction history for a stock record (by stockId/productStockId)
   * @param {string} stockId - UUID of the ProductStock record
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<StockTransactionResponse>>>}
   */
  getStockHistory: (stockId, params = { page: 0, size: 20, sort: 'createdAt,desc' }) => {
    return axiosClient.get(`/stocks/history/${stockId}`, { params });
  },

  /**
   * Process a manual IMPORT or EXPORT transaction
   * @param {Object} data - { productId, warehouseId, type('IMPORT'|'EXPORT'), quantity, unitPrice?, note? }
   * @returns {Promise<ApiResponse<StockTransactionResponse>>}
   */
  processTransaction: (data) => {
    return axiosClient.post('/stocks/transaction', data);
  },

  /**
   * Transfer stock between warehouses
   * @param {Object} data - { productId, fromWarehouseId, toWarehouseId, quantity, note? }
   * @returns {Promise<ApiResponse<StockTransactionResponse[]>>}
   */
  transferStock: (data) => {
    return axiosClient.post('/stocks/transfer', data);
  },

  /**
   * Update the minimum quantity threshold for a product-warehouse pair
   * @param {Object} data - { productId, warehouseId, minQuantity }
   * @returns {Promise<ApiResponse<ProductStockResponse>>}
   */
  updateMinQuantity: (data) => {
    return axiosClient.put('/stocks', data);
  },
};
