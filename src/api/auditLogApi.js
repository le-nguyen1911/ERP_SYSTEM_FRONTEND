import axiosClient from './axiosClient';

/**
 * Audit Log Management API Module
 * Connected to Spring Boot AuditLogController (/api/v1/audit-logs)
 */
export const auditLogApi = {
  /**
   * Get all audit logs with optional module filter (paginated)
   * @param {Object} params - { module, page, size, sort }
   * @returns {Promise<ApiResponse<Page<AuditLogResponse>>>}
   */
  getAuditLogs: (params = {}) => {
    const queryParams = {
      ...(params.module && params.module !== 'ALL' ? { module: params.module } : {}),
      page: params.page ?? 0,
      size: params.size ?? 10,
      sort: params.sort ?? 'createdAt,desc',
    };
    return axiosClient.get('/audit-logs', { params: queryParams });
  },

  /**
   * Get audit logs filtered by SourceModule (paginated)
   * @param {string} module - 'PURCHASE' | 'INVENTORY' | 'AUTH' | 'USER' | 'SALES' | 'SYSTEM'
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<AuditLogResponse>>>}
   */
  getAuditLogsByModule: (module, params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get(`/audit-logs/by-module/${module}`, { params });
  },

  /**
   * Get audit logs for a specific entity instance (paginated)
   * @param {string} entityType - e.g. 'PurchaseOrder', 'GoodsReceipt', 'Supplier', 'StockTransaction'
   * @param {string} entityId - UUID
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<AuditLogResponse>>>}
   */
  getAuditLogsByEntity: (entityType, entityId, params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/audit-logs/by-entity', {
      params: { entityType, entityId, ...params },
    });
  },

  /**
   * Get audit logs performed by a specific user (paginated)
   * @param {string} performedById - UUID
   * @param {Object} params - { page, size, sort }
   * @returns {Promise<ApiResponse<Page<AuditLogResponse>>>}
   */
  getAuditLogsByUser: (performedById, params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get(`/audit-logs/by-user/${performedById}`, { params });
  },
};
