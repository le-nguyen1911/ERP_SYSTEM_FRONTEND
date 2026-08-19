import axiosClient from './axiosClient';
import { useAuthStore } from '../stores/useAuthStore';

export const authApi = {
  /**
   * Đăng nhập hệ thống
   * @param {{ username: string, password: string }} credentials
   * @returns {Promise<{ success: boolean, message: string, data: { accessToken: string, refreshToken: string, user: Object } }>}
   */
  login: (credentials) => {
    return axiosClient.post('/auth/login', credentials);
  },

  /**
   * Đăng ký tài khoản mới (mặc định nhận role USER)
   * @param {{ username: string, password: string, email: string, fullname: string }} data
   */
  register: (data) => {
    return axiosClient.post('/auth/register', data);
  },

  /**
   * Lấy thông tin người dùng hiện tại
   */
  getMe: () => {
    return axiosClient.get('/auth/me');
  },

  /**
   * Đăng xuất phiên làm việc hiện tại
   */
  logout: () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    return axiosClient.post(
      '/auth/logout',
      {},
      {
        headers: {
          'Refresh-Token': refreshToken || '',
        },
      }
    );
  },

  /**
   * Đăng xuất tất cả các thiết bị đang đăng nhập
   */
  logoutAll: () => {
    return axiosClient.post('/auth/logout-all', {});
  },

  /**
   * Lấy danh sách các phiên đăng nhập còn hiệu lực
   */
  getSessions: () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    return axiosClient.get('/auth/sessions', {
      headers: {
        'Refresh-Token': refreshToken || '',
      },
    });
  },

  /**
   * Thu hồi một phiên đăng nhập từ xa
   * @param {string} sessionId UUID của phiên
   */
  revokeSession: (sessionId) => {
    return axiosClient.delete(`/auth/sessions/${sessionId}`);
  },

  /**
   * Đổi mật khẩu cá nhân
   * @param {{ oldPassword: string, newPassword: string }} data
   */
  changePassword: (data) => {
    return axiosClient.put('/users/me/password', data);
  },
};
