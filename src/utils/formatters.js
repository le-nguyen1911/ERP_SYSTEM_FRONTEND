/**
 * Formatting and Helper Utilities
 */

export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
    return formatDate(dateString);
  } catch {
    return dateString;
  }
}

export function getDeviceIconName(deviceInfo) {
  if (!deviceInfo) return 'laptop';
  const info = deviceInfo.toLowerCase();
  if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) {
    return 'smartphone';
  }
  if (info.includes('tablet') || info.includes('ipad')) {
    return 'tablet';
  }
  return 'laptop';
}
