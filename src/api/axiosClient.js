import axios from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { useAuthStore } from '../stores/useAuthStore';

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Flag and queue for Refresh Token Rotation
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request Interceptor: Attach Access Token
axiosClient.interceptors.request.use(
  (config) => {
    const accessToken = useAuthStore.getState().accessToken;
    if (accessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Data Wrapper and 401 Refresh Token
axiosClient.interceptors.response.use(
  (response) => {
    return response.data;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle Network / Connection Errors
    if (!error.response) {
      return Promise.reject({
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        status: 0,
      });
    }

    const { status } = error.response;
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh-token');

    // 401 Unauthorized Handling with Refresh Token Rotation
    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const currentRefreshToken = useAuthStore.getState().refreshToken;

      if (!currentRefreshToken) {
        useAuthStore.getState().clearAuth();
        isRefreshing = false;
        return Promise.reject(formatApiError(error));
      }

      try {
        // Direct call to refresh endpoint using raw axios to avoid interceptor loop
        const refreshResponse = await axios.post(
          `${API_BASE_URL}/auth/refresh-token`,
          {},
          {
            headers: {
              'Refresh-Token': currentRefreshToken,
            },
          }
        );

        const authData = refreshResponse.data?.data;
        if (!authData?.accessToken) {
          throw new Error('Không nhận được Access Token mới');
        }

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } = authData;

        // Update Zustand Store & localStorage
        useAuthStore.getState().refreshTokens(newAccessToken, newRefreshToken);

        // Update current request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry queued requests
        processQueue(null, newAccessToken);
        isRefreshing = false;

        return axiosClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        isRefreshing = false;
        useAuthStore.getState().clearAuth();
        return Promise.reject(formatApiError(refreshErr));
      }
    }

    return Promise.reject(formatApiError(error));
  }
);

function formatApiError(error) {
  if (error.response?.data) {
    const resData = error.response.data;
    return {
      message: resData.message || resData.error || 'Đã xảy ra lỗi khi xử lý yêu cầu',
      error: resData.error || null,
      status: error.response.status,
      timestamp: resData.timestamp,
    };
  }

  return {
    message: error.message || 'Lỗi không xác định',
    status: error.response?.status || 500,
  };
}

export default axiosClient;
