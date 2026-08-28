import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api/notificationApi';
import { toast } from '../../stores/useToastStore';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  BellIcon,
  CheckIcon,
  Trash2Icon,
  RefreshCwIcon,
  SearchIcon,
  InfoIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from '../../components/ui/Icons';

export function NotificationManagementPage() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'UNREAD'
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [searchTerm, setSearchTerm] = useState('');

  // 1. Query notifications
  const {
    data: notificationResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['notifications', filterType, page, pageSize],
    queryFn: () =>
      filterType === 'UNREAD'
        ? notificationApi.getUnreadNotifications({ page, size: pageSize, sort: 'createdAt,desc' })
        : notificationApi.getNotifications({ page, size: pageSize, sort: 'createdAt,desc' }),
  });

  // 2. Query unread count
  const { data: unreadCountResponse, refetch: refetchUnreadCount } = useQuery({
    queryKey: ['notifications-unread-count'],
    queryFn: () => notificationApi.getUnreadCount(),
  });

  const unreadCount = unreadCountResponse?.data?.count ?? unreadCountResponse?.data?.unreadCount ?? 0;

  const pageData = notificationResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const rawList = useMemo(() => pageData?.content || [], [pageData?.content]);

  // Client-side search filter by title or message
  const displayedList = useMemo(() => {
    if (!searchTerm.trim()) return rawList;
    const term = searchTerm.trim().toLowerCase();
    return rawList.filter(
      (n) =>
        (n.title || '').toLowerCase().includes(term) ||
        (n.message || '').toLowerCase().includes(term) ||
        (n.module || '').toLowerCase().includes(term)
    );
  }, [rawList, searchTerm]);

  // 3. Mutation: Mark as read
  const markAsReadMutation = useMutation({
    mutationFn: (id) => notificationApi.markAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Đã đánh dấu đã đọc');
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái thông báo');
    },
  });

  // 4. Mutation: Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Đã đánh dấu tất cả là đã đọc');
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi cập nhật thông báo');
    },
  });

  // 5. Mutation: Delete notification
  const deleteMutation = useMutation({
    mutationFn: (id) => notificationApi.deleteNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] });
      toast.success('Đã xóa thông báo');
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi xóa thông báo');
    },
  });

  const getTypeBadge = (type) => {
    switch (type) {
      case 'SUCCESS':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#16a34a', fontWeight: 600, fontSize: 12 }}>
            <CheckCircleIcon size={14} /> Thành công
          </span>
        );
      case 'WARNING':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#d97706', fontWeight: 600, fontSize: 12 }}>
            <AlertTriangleIcon size={14} /> Cảnh báo
          </span>
        );
      case 'ERROR':
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#dc2626', fontWeight: 600, fontSize: 12 }}>
            <AlertCircleIcon size={14} /> Lỗi
          </span>
        );
      case 'INFO':
      default:
        return (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2563eb', fontWeight: 600, fontSize: 12 }}>
            <InfoIcon size={14} /> Thông tin
          </span>
        );
    }
  };

  const getModuleBadge = (mod) => {
    if (!mod) return null;
    const colorMap = {
      PURCHASE: { bg: '#e0f2fe', text: '#0369a1' },
      INVENTORY: { bg: '#fef3c7', text: '#b45309' },
      SALES: { bg: '#dcfce7', text: '#15803d' },
      AUTH: { bg: '#ede9fe', text: '#6d28d9' },
      USER: { bg: '#dbeafe', text: '#1d4ed8' },
    };
    const c = colorMap[mod] || { bg: '#f1f5f9', text: '#475569' };
    return (
      <span
        style={{
          display: 'inline-block',
          padding: '2px 8px',
          borderRadius: 4,
          fontSize: 11,
          fontWeight: 700,
          backgroundColor: c.bg,
          color: c.text,
        }}
      >
        {mod}
      </span>
    );
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <BellIcon size={26} className="text-primary" />
            Trung tâm Thông báo
            {unreadCount > 0 && (
              <Badge variant="danger" size="sm">
                {unreadCount} chưa đọc
              </Badge>
            )}
          </h1>
          <p className="page-subtitle">
            Theo dõi thông báo tự động từ hệ thống: đơn mua hàng, duyệt đơn bán hàng, cảnh báo tồn kho và giao dịch kho.
          </p>
        </div>

        <div className="page-actions" style={{ display: 'flex', gap: 8 }}>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              icon={<CheckIcon size={16} />}
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isFetching ? 'spinner-inline' : ''} />}
            onClick={() => {
              refetch();
              refetchUnreadCount();
            }}
            disabled={isFetching}
          >
            Làm mới
          </Button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar-left" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="table-search-input" style={{ minWidth: 280 }}>
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm kiếm thông báo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--color-text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#f1f5f9', padding: 3, borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => {
                setFilterType('ALL');
                setPage(0);
              }}
              style={{
                padding: '5px 14px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterType === 'ALL' ? '#ffffff' : 'transparent',
                color: filterType === 'ALL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: filterType === 'ALL' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Tất cả
            </button>
            <button
              type="button"
              onClick={() => {
                setFilterType('UNREAD');
                setPage(0);
              }}
              style={{
                padding: '5px 14px',
                fontSize: 13,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: filterType === 'UNREAD' ? '#ffffff' : 'transparent',
                color: filterType === 'UNREAD' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: filterType === 'UNREAD' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Chưa đọc {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Tổng cộng: <strong>{totalElements}</strong> thông báo
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="table-container" style={{ padding: 0 }}>
        {isLoading ? (
          <LoadingState message="Đang tải thông báo..." minHeight="300px" />
        ) : isError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải danh sách thông báo">
              {error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={BellIcon}
            title={filterType === 'UNREAD' ? 'Không có thông báo chưa đọc' : 'Chưa có thông báo nào'}
            description={
              searchTerm
                ? 'Không tìm thấy thông báo khớp với từ khóa tìm kiếm.'
                : 'Bạn đã xem hết các thông báo từ hệ thống.'
            }
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {displayedList.map((item) => {
              const isUnread = !item.isRead;
              return (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    padding: '16px 20px',
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: isUnread ? '#f8fafc' : '#ffffff',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 14, flex: 1, alignItems: 'flex-start' }}>
                    <div style={{ marginTop: 2 }}>
                      {isUnread ? (
                        <div
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: '50%',
                            backgroundColor: 'var(--color-primary, #0284c7)',
                            marginTop: 6,
                          }}
                          title="Chưa đọc"
                        />
                      ) : (
                        <div style={{ width: 10, height: 10 }} />
                      )}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span style={{ fontWeight: isUnread ? 700 : 600, fontSize: 14, color: '#0f172a' }}>
                          {item.title}
                        </span>
                        {getTypeBadge(item.type)}
                        {getModuleBadge(item.module)}
                      </div>

                      <p style={{ margin: 0, fontSize: 13, color: isUnread ? '#334155' : '#64748b', lineHeight: 1.5 }}>
                        {item.message}
                      </p>

                      <div style={{ marginTop: 6, fontSize: 11, color: '#94a3b8' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '—'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, marginLeft: 16, alignItems: 'center' }}>
                    {isUnread && (
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        onClick={() => markAsReadMutation.mutate(item.id)}
                        disabled={markAsReadMutation.isPending}
                        title="Đánh dấu đã đọc"
                      >
                        <CheckIcon size={14} /> Đã đọc
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn-outline btn-sm text-danger"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                      onClick={() => deleteMutation.mutate(item.id)}
                      disabled={deleteMutation.isPending}
                      title="Xóa thông báo"
                    >
                      <Trash2Icon size={14} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Pagination */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 20px',
                  borderTop: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                }}
              >
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Trang {page + 1} / {totalPages} (Tổng {totalElements} thông báo)
                </span>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                    disabled={page >= totalPages - 1}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
