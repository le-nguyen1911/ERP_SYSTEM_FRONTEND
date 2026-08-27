import axiosClient from './axiosClient';

/**
 * Sales Order Management API Module
 * Connected to Spring Boot SalesOrderController (/api/v1/sales-orders)
 *
 * Permissions:
 *   SALES_VIEW   – list, search, detail
 *   SALES_CREATE – create, submit-for-approval
 *   SALES_UPDATE – update (DRAFT only), confirm, close, delete, item CRUD
 *   SALES_APPROVE – approve, reject
 *   SALES_CANCEL – cancel
 */
export const salesOrderApi = {
  // ── Queries ──────────────────────────────────────────────────────────────

  /**
   * Get all SOs (paginated) – used when no filter is active.
   * GET /api/v1/sales-orders?page=0&size=10
   */
  getSalesOrders: (params = {}) => {
    return axiosClient.get('/sales-orders', {
      params: { page: params.page ?? 0, size: params.size ?? 10 },
    });
  },

  /**
   * Search SOs with optional filters.
   * GET /api/v1/sales-orders/search?customerId=&status=&fromDate=&toDate=&page=0&size=10
   * NOTE: Only include params that are actually set (avoid lower(bytea) bug).
   */
  searchSalesOrders: (params = {}) => {
    const searchParams = {
      ...(params.customerId ? { customerId: params.customerId } : {}),
      ...(params.status ? { status: params.status } : {}),
      ...(params.fromDate ? { fromDate: params.fromDate } : {}),
      ...(params.toDate ? { toDate: params.toDate } : {}),
      page: params.page ?? 0,
      size: params.size ?? 10,
    };
    return axiosClient.get('/sales-orders/search', { params: searchParams });
  },

  /**
   * Get SO detail by ID (includes full item list).
   * GET /api/v1/sales-orders/{id}
   */
  getSalesOrderById: (id) => axiosClient.get(`/sales-orders/${id}`),

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Create a new SO in DRAFT status.
   * POST /api/v1/sales-orders
   * Body: CreateSalesOrderRequest
   *   { customerId, warehouseId, deliveryDate (LocalDate), currency,
   *     taxPercentage, shippingCost, discountAmount, paymentTerms,
   *     shippingAddress, notes,
   *     items: [{ productId, productCode, productName, productUnit, quantity, unitPrice, description }] }
   */
  createSalesOrder: (data) => axiosClient.post('/sales-orders', data),

  /**
   * Update a DRAFT SO (header fields only – not items).
   * PUT /api/v1/sales-orders/{id}
   * Body: UpdateSalesOrderRequest
   *   { deliveryDate, taxPercentage, shippingCost, discountAmount, paymentTerms, shippingAddress, notes }
   */
  updateSalesOrder: (id, data) => axiosClient.put(`/sales-orders/${id}`, data),

  // ── Item-level mutations (DRAFT only) ────────────────────────────────────

  /**
   * Add an item to a DRAFT SO.
   * POST /api/v1/sales-orders/{id}/items
   * Body: AddSalesOrderItemRequest
   *   { productId, productCode, productName, productUnit, quantity, unitPrice, description }
   */
  addItem: (soId, data) => axiosClient.post(`/sales-orders/${soId}/items`, data),

  /**
   * Update a specific item in a DRAFT SO.
   * PUT /api/v1/sales-orders/{id}/items/{itemId}
   * Body: UpdateSalesOrderItemRequest { quantity, unitPrice, description }
   */
  updateItem: (soId, itemId, data) =>
    axiosClient.put(`/sales-orders/${soId}/items/${itemId}`, data),

  /**
   * Remove a specific item from a DRAFT SO.
   * DELETE /api/v1/sales-orders/{id}/items/{itemId}
   */
  removeItem: (soId, itemId) =>
    axiosClient.delete(`/sales-orders/${soId}/items/${itemId}`),

  // ── Workflow actions ──────────────────────────────────────────────────────

  /**
   * Submit DRAFT → PENDING_APPROVAL.
   * POST /api/v1/sales-orders/{id}/submit-for-approval
   * Requires: SALES_CREATE
   */
  submitForApproval: (id) =>
    axiosClient.post(`/sales-orders/${id}/submit-for-approval`),

  /**
   * Approve PENDING_APPROVAL → APPROVED.
   * POST /api/v1/sales-orders/{id}/approve
   * Body: {} (ApproveSalesOrderRequest is empty)
   * Requires: SALES_APPROVE
   */
  approve: (id) => axiosClient.post(`/sales-orders/${id}/approve`, {}),

  /**
   * Reject PENDING_APPROVAL → REJECTED.
   * POST /api/v1/sales-orders/{id}/reject
   * Body: { reason: string } (required, @NotBlank)
   * Requires: SALES_APPROVE
   */
  reject: (id, reason) =>
    axiosClient.post(`/sales-orders/${id}/reject`, { reason }),

  /**
   * Confirm APPROVED → CONFIRMED.
   * POST /api/v1/sales-orders/{id}/confirm
   * Requires: SALES_UPDATE
   */
  confirm: (id) => axiosClient.post(`/sales-orders/${id}/confirm`),

  /**
   * Cancel DRAFT | APPROVED | CONFIRMED → CANCELLED.
   * POST /api/v1/sales-orders/{id}/cancel
   * Body: { reason: string } (required, @NotBlank)
   * Requires: SALES_CANCEL
   */
  cancel: (id, reason) =>
    axiosClient.post(`/sales-orders/${id}/cancel`, { reason }),

  /**
   * Close DELIVERED → CLOSED.
   * POST /api/v1/sales-orders/{id}/close
   * Requires: SALES_UPDATE
   */
  close: (id) => axiosClient.post(`/sales-orders/${id}/close`),

  /**
   * Soft-delete a DRAFT SO only.
   * DELETE /api/v1/sales-orders/{id}
   * Requires: SALES_UPDATE
   */
  deleteSalesOrder: (id) => axiosClient.delete(`/sales-orders/${id}`),
};
