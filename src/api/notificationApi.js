import axiosClient from './axiosClient';

export const notificationApi = {
  /**
   * Get all notifications for current user with pagination
   * @param {Object} params { page, size, sort }
   */
  getNotifications: async (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/notifications', { params });
  },

  /**
   * Get unread notifications for current user
   * @param {Object} params { page, size, sort }
   */
  getUnreadNotifications: async (params = { page: 0, size: 10, sort: 'createdAt,desc' }) => {
    return axiosClient.get('/notifications/unread', { params });
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async () => {
    return axiosClient.get('/notifications/unread-count');
  },

  /**
   * Mark a notification as read
   * @param {string} id UUID of the notification
   */
  markAsRead: async (id) => {
    return axiosClient.patch(`/notifications/${id}/read`);
  },

  /**
   * Mark all notifications as read for current user
   */
  markAllAsRead: async () => {
    return axiosClient.patch('/notifications/read-all');
  },

  /**
   * Delete a notification
   * @param {string} id UUID of the notification
   */
  deleteNotification: async (id) => {
    return axiosClient.delete(`/notifications/${id}`);
  },
};
