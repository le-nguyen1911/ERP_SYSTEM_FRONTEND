import axiosClient from './axiosClient';

/**
 * Delivery Management API Module
 * Connected to Spring Boot DeliveryController (/api/v1/deliveries)
 *
 * Permissions:
 *   DELIVERY_VIEW   – list, detail, getBySalesOrder
 *   DELIVERY_CREATE – create, markAsDelivered, cancel
 *   DELIVERY_EXPORT – retryInventoryExport
 */
export const deliveryApi = {
  /**
   * Get paginated deliveries list
   * GET /api/v1/deliveries?page=0&size=10
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<DeliverySummaryResponse>>>}
   */
  getDeliveries: (params = {}) => {
    return axiosClient.get('/deliveries', {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort ?? 'createdAt,desc',
      },
    });
  },

  /**
   * Get delivery detail by ID
   * GET /api/v1/deliveries/{id}
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<DeliveryDetailResponse>>}
   */
  getDeliveryById: (id) => axiosClient.get(`/deliveries/${id}`),

  /**
   * Get deliveries for a specific Sales Order
   * GET /api/v1/deliveries/by-sales-order/{salesOrderId}?page=0&size=10
   * @param {string} salesOrderId - UUID
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<DeliverySummaryResponse>>>}
   */
  getDeliveriesBySalesOrder: (salesOrderId, params = {}) => {
    return axiosClient.get(`/deliveries/by-sales-order/${salesOrderId}`, {
      params: {
        page: params.page ?? 0,
        size: params.size ?? 10,
        sort: params.sort ?? 'createdAt,desc',
      },
    });
  },

  /**
   * Create a new delivery against a CONFIRMED or DELIVERED Sales Order
   * POST /api/v1/deliveries
   * Body: { salesOrderId, items: [{ salesOrderItemId, quantityDelivered, batchNumber, notes }] }
   * @param {Object} data - CreateDeliveryRequest
   * @returns {Promise<ApiResponse<DeliveryDetailResponse>>}
   */
  createDelivery: (data) => axiosClient.post('/deliveries', data),

  /**
   * Mark delivery as delivered (EXPORTED -> DELIVERED)
   * POST /api/v1/deliveries/{id}/mark-as-delivered
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<DeliveryDetailResponse>>}
   */
  markAsDelivered: (id) => axiosClient.post(`/deliveries/${id}/mark-as-delivered`),

  /**
   * Retry failed inventory export
   * POST /api/v1/deliveries/{id}/retry-inventory-export
   * @param {string} id - UUID
   * @returns {Promise<ApiResponse<DeliveryDetailResponse>>}
   */
  retryInventoryExport: (id) => axiosClient.post(`/deliveries/${id}/retry-inventory-export`),

  /**
   * Cancel delivery (DRAFT only)
   * POST /api/v1/deliveries/{id}/cancel
   * Body: { reason: string }
   * @param {string} id - UUID
   * @param {string} reason - Cancellation reason
   * @returns {Promise<ApiResponse<void>>}
   */
  cancelDelivery: (id, reason) => axiosClient.post(`/deliveries/${id}/cancel`, { reason }),
};
