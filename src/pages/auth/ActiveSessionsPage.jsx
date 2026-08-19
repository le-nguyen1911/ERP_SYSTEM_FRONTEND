import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../stores/useToastStore';
import { formatDate, formatRelativeTime } from '../../utils/formatters';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { ConfirmModal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import {
  LaptopIcon,
  SmartphoneIcon,
  RefreshCwIcon,
  TrashIcon,
  LogOutIcon,
} from '../../components/ui/Icons';

export function ActiveSessionsPage() {
  const queryClient = useQueryClient();
  const { clearAuth } = useAuthStore();
  const [sessionToRevoke, setSessionToRevoke] = useState(null);
  const [logoutAllModalOpen, setLogoutAllModalOpen] = useState(false);

  // Fetch active sessions
  const {
    data: sessionsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['activeSessions'],
    queryFn: () => authApi.getSessions(),
  });

  const sessions = sessionsResponse?.data || [];

  // Mutation to revoke a single remote session
  const revokeMutation = useMutation({
    mutationFn: (sessionId) => authApi.revokeSession(sessionId),
    onSuccess: () => {
      toast.success('Đã thu hồi phiên đăng nhập thành công');
      queryClient.invalidateQueries({ queryKey: ['activeSessions'] });
      setSessionToRevoke(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể thu hồi phiên đăng nhập');
    },
  });

  // Mutation to logout all devices
  const logoutAllMutation = useMutation({
    mutationFn: () => authApi.logoutAll(),
    onSuccess: () => {
      toast.success('Đã đăng xuất tất cả các thiết bị');
      clearAuth();
      window.location.href = '/login';
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi đăng xuất tất cả thiết bị');
    },
  });

  const getDeviceIcon = (deviceInfo = '') => {
    const lower = deviceInfo.toLowerCase();
    if (lower.includes('mobile') || lower.includes('android') || lower.includes('iphone')) {
      return <SmartphoneIcon size={24} className="text-primary" />;
    }
    return <LaptopIcon size={24} className="text-primary" />;
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Quản lý Phiên Đăng Nhập</h1>
          <p className="page-subtitle">
            Theo dõi và kiểm soát tất cả các thiết bị đang đăng nhập vào tài khoản của bạn.
          </p>
        </div>
        <div className="page-actions">
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCwIcon}
            onClick={() => refetch()}
            isLoading={isFetching}
          >
            Làm mới
          </Button>
          <Button
            variant="danger"
            size="sm"
            icon={LogOutIcon}
            onClick={() => setLogoutAllModalOpen(true)}
            disabled={sessions.length === 0}
          >
            Đăng xuất tất cả thiết bị
          </Button>
        </div>
      </div>

      {isError && (
        <Alert variant="danger" className="mb-4">
          {error?.message || 'Không thể tải danh sách phiên đăng nhập'}
        </Alert>
      )}

      <Card
        title="Danh sách thiết bị đang hoạt động"
        subtitle={`Tổng cộng: ${sessions.length} phiên hoạt động`}
      >
        {isLoading ? (
          <LoadingState message="Đang tải danh sách phiên..." />
        ) : sessions.length === 0 ? (
          <EmptyState
            title="Không tìm thấy phiên hoạt động nào"
            description="Có thể phiên đăng nhập của bạn đã hết hạn."
            icon={LaptopIcon}
          />
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`session-item ${session.current ? 'is-current-session' : ''}`}
              >
                <div className="session-icon-box">
                  {getDeviceIcon(session.deviceInfo)}
                </div>

                <div className="session-details">
                  <div className="session-title-row">
                    <h4 className="session-device-name">
                      {session.deviceInfo || 'Thiết bị không xác định'}
                    </h4>
                    {session.current && (
                      <Badge variant="success" size="xs">
                        Thiết bị hiện tại
                      </Badge>
                    )}
                  </div>

                  <div className="session-meta-row">
                    <span className="session-meta-item">
                      <strong>Đăng nhập:</strong> {formatDate(session.createdAt)} ({formatRelativeTime(session.createdAt)})
                    </span>
                    <span className="session-meta-divider">•</span>
                    <span className="session-meta-item">
                      <strong>Hết hạn:</strong> {formatDate(session.expiresAt)}
                    </span>
                  </div>
                </div>

                <div className="session-actions">
                  {session.current ? (
                    <span className="text-muted text-xs font-medium">Phiên này đang mở</span>
                  ) : (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      icon={TrashIcon}
                      onClick={() => setSessionToRevoke(session)}
                    >
                      Thu hồi
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Revoke Single Session Modal */}
      <ConfirmModal
        isOpen={!!sessionToRevoke}
        onClose={() => setSessionToRevoke(null)}
        onConfirm={() => sessionToRevoke && revokeMutation.mutate(sessionToRevoke.id)}
        title="Thu hồi phiên đăng nhập?"
        message={`Bạn có chắc muốn đăng xuất thiết bị "${sessionToRevoke?.deviceInfo}" từ xa không? Người dùng trên thiết bị đó sẽ phải đăng nhập lại.`}
        confirmText="Thu hồi phiên"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={revokeMutation.isPending}
      />

      {/* Logout All Devices Modal */}
      <ConfirmModal
        isOpen={logoutAllModalOpen}
        onClose={() => setLogoutAllModalOpen(false)}
        onConfirm={() => logoutAllMutation.mutate()}
        title="Đăng xuất tất cả thiết bị?"
        message="Hành động này sẽ hủy mọi phiên làm việc trên mọi thiết bị và trình duyệt. Bạn sẽ được chuyển hướng về trang Đăng nhập."
        confirmText="Đăng xuất tất cả"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={logoutAllMutation.isPending}
      />
    </div>
  );
}
