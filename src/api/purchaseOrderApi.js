import axiosClient from './axiosClient';

/**
 * Purchase Order Management API Module
 * Connected to Spring Boot PurchaseOrderController (/api/v1/purchase-orders)
 */
export const purchaseOrderApi = {
  /**
   * Get all purchase orders (paginated)
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<PurchaseOrderSummaryResponse>>>}
   */
  getPurchaseOrders: (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/purchase-orders', { params });
  },

  /**
   * Search purchase orders with filters (paginated)
   * @param {Object} params - { supplierId, status, fromDate, toDate, page, size, sort }
   * @returns {Promise<ApiResponse<Page<PurchaseOrderSummaryResponse>>>}
   */
  searchPurchaseOrders: (params = {}) => {
    const searchParams = {
      ...(params.supplierId ? { supplierId: params.supplierId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params.toDate ? { toDate: params.toDate } : {}),
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? 'createdAt,desc',
    };
    return axiosClient.get('/purchase-orders/search', { params: searchParams });
  },

  /**
   * Get purchase order by ID (detail with items)
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  getPurchaseOrderById: (id) => {
    return axiosClient.get(`/purchase-orders/${id}`);
  },

  /**
   * Create a new purchase order
   * @param {Object} data - CreatePurchaseOrderRequest
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  createPurchaseOrder: (data) => {
    return axiosClient.post('/purchase-orders', data);
  },

  /**
   * Update purchase order header (DRAFT only)
   * @param {string} id - UUID
   * @param {Object} data - UpdatePurchaseOrderRequest
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  updatePurchaseOrder: (id, data) => {
    return axiosClient.put(`/purchase-orders/${id}`, data);
  },

  /**
   * Delete a DRAFT purchase order
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<void>>}
   */
  deletePurchaseOrder: (id) => {
    return axiosClient.delete(`/purchase-orders/${id}`);
  },

  // ─── ITEM MANAGEMENT (DRAFT only) ───────────────────────────────────────────

  /**
   * Add an item to a DRAFT purchase order
   * @param {string} id - PO UUID
   * @param {Object} data - AddPurchaseOrderItemRequest
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  addItem: (id, data) => {
    return axiosClient.post(`/purchase-orders/${id}/items`, data);
  },

  /**
   * Update quantity/price of a DRAFT PO item
   * @param {string} id - PO UUID
   * @param {string} itemId - item UUID
   * @param {Object} data - UpdatePurchaseOrderItemRequest { quantity, unitPrice, description }
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  updateItem: (id, itemId, data) => {
    return axiosClient.put(`/purchase-orders/${id}/items/${itemId}`, data);
  },

  /**
   * Remove an item from a DRAFT purchase order
   * @param {string} id - PO UUID
   * @param {string} itemId - item UUID
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  removeItem: (id, itemId) => {
    return axiosClient.delete(`/purchase-orders/${id}/items/${itemId}`);
  },

  // ─── STATUS TRANSITIONS ──────────────────────────────────────────────────────

  /**
   * Submit DRAFT PO for approval → PENDING_APPROVAL
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  submitForApproval: (id) => {
    return axiosClient.post(`/purchase-orders/${id}/submit-for-approval`);
  },

  /**
   * Approve PENDING_APPROVAL PO → APPROVED
   * @param {string} id - UUID
   * @param {Object} data - ApprovePurchaseOrderRequest (optional)
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  approve: (id, data = {}) => {
    return axiosClient.post(`/purchase-orders/${id}/approve`, data);
  },

  /**
   * Reject PENDING_APPROVAL PO → REJECTED
   * @param {string} id - UUID
   * @param {Object} data - RejectPurchaseOrderRequest { reason: string }
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  reject: (id, data) => {
    return axiosClient.post(`/purchase-orders/${id}/reject`, data);
  },

  /**
   * Send APPROVED PO to supplier → SENT_TO_SUPPLIER
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  sendToSupplier: (id) => {
    return axiosClient.post(`/purchase-orders/${id}/send-to-supplier`);
  },

  /**
   * Cancel PO → CANCELLED (requires reason)
   * @param {string} id - UUID
   * @param {Object} data - CancelPurchaseOrderRequest { reason: string }
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  cancel: (id, data) => {
    return axiosClient.post(`/purchase-orders/${id}/cancel`, data);
  },

  /**
   * Close PO → CLOSED
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<PurchaseOrderDetailResponse>>}
   */
  close: (id) => {
    return axiosClient.post(`/purchase-orders/${id}/close`);
  },
};
