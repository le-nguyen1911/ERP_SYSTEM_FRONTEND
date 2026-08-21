import axiosClient from './axiosClient';

/**
 * Goods Receipt Management API Module
 * Connected to Spring Boot GoodsReceiptController (/api/v1/goods-receipts)
 */
export const goodsReceiptApi = {
  /**
   * Get all goods receipts (paginated)
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<GoodsReceiptSummaryResponse>>>}
   */
  getGoodsReceipts: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/goods-receipts', { params });
  },

  /**
   * Get goods receipt by ID (full detail with items)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<GoodsReceiptDetailResponse>>}
   */
  getGoodsReceiptById: (id) => {
    return axiosClient.get(`/goods-receipts/${id}`);
  },

  /**
   * Get goods receipts by Purchase Order ID (paginated)
   * @param {string} poId - UUID
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<GoodsReceiptSummaryResponse>>>}
   */
  getGoodsReceiptsByPurchaseOrder: (poId, params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get(`/goods-receipts/by-purchase-order/${poId}`, { params });
  },

  /**
   * Create a new goods receipt in DRAFT status
   * @param {Object} data - { purchaseOrderId, items: [{ purchaseOrderItemId, quantityAccepted, quantityRejected, batchNumber, expiryDate, notes }] }
   * @returns {Promise<ApiResponse<GoodsReceiptDetailResponse>>}
   */
  createGoodsReceipt: (data) => {
    return axiosClient.post('/goods-receipts', data);
  },

  /**
   * Mark goods receipt as received (DRAFT -> RECEIVED)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<GoodsReceiptDetailResponse>>}
   */
  markAsReceived: (id) => {
    return axiosClient.post(`/goods-receipts/${id}/mark-as-received`);
  },

  /**
   * Perform Quality Check (RECEIVED -> QC_PASSED / QC_FAILED)
   * If PASSED, automatically triggers inventory import via StockService
   * @param {string} id - UUID
   * @param {Object} data - { result: 'PASSED' | 'FAILED', notes: string }
   * @returns {Promise<ApiResponse<GoodsReceiptDetailResponse>>}
   */
  performQualityCheck: (id, data) => {
    return axiosClient.post(`/goods-receipts/${id}/quality-check`, data);
  },

  /**
   * Retry failed inventory import manually (for FAILED inventoryImportStatus)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<GoodsReceiptDetailResponse>>}
   */
  retryInventoryImport: (id) => {
    return axiosClient.post(`/goods-receipts/${id}/retry-inventory-import`);
  },

  /**
   * Cancel goods receipt with reason (only for non-IMPORTED receipts)
   * @param {string} id - UUID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<ApiResponse<void>>}
   */
  cancelGoodsReceipt: (id, reason) => {
    return axiosClient.post(`/goods-receipts/${id}/cancel`, { reason });
  },
};
