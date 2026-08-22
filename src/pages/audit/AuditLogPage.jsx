import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { auditLogApi } from '../../api/auditLogApi';
import { usePermission } from '../../hooks/usePermission';
import { ROLES } from '../../utils/constants';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  FileTextIcon,
  SearchIcon,
  EyeIcon,
  RefreshCwIcon,
} from '../../components/ui/Icons';

// Sub-components
import { AuditLogDetailModal } from './components/AuditLogDetailModal';
import { AuditLogPagination } from './components/AuditLogPagination';

export function AuditLogPage() {
  const { hasRole, isAdmin } = usePermission();
  const isAuthorized = hasRole(ROLES.ADMIN) || isAdmin;

  // 1. All useState hooks declared at top level
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  // 2. Fetch Audit Logs Query (paginated)
  const {
    data: auditApiResponse,
    isLoading: isAuditLoading,
    isError: isAuditError,
    error: auditError,
    refetch: refetchAudit,
    isFetching: isAuditFetching,
  } = useQuery({
    queryKey: ['audit-logs', moduleFilter, page, pageSize],
    queryFn: () =>
      auditLogApi.getAuditLogs({
        module: moduleFilter !== 'ALL' ? moduleFilter : undefined,
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      }),
    enabled: isAuthorized,
  });

  const pageData = auditApiResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const rawList = useMemo(() => pageData?.content || [], [pageData?.content]);

  // Client-side filtering by search term (Entity Type, Entity ID)
  const displayedList = useMemo(() => {
    if (!searchTerm.trim()) return rawList;
    const term = searchTerm.trim().toLowerCase();
    return rawList.filter((log) => {
      const eType = (log.entityType || '').toLowerCase();
      const eId = (log.entityId || '').toLowerCase();
      const pId = (log.performedById || '').toLowerCase();
      return eType.includes(term) || eId.includes(term) || pId.includes(term);
    });
  }, [rawList, searchTerm]);

  // Handlers
  const handleOpenDetail = (log) => {
    setSelectedAuditLog(log);
    setDetailModalOpen(true);
  };

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="info">UPDATE</Badge>;
      case 'STATUS_CHANGE':
        return <Badge variant="warning">STATUS CHANGE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      default:
        return <Badge variant="neutral">{action}</Badge>;
    }
  };

  const getModuleBadge = (mod) => {
    const colorMap = {
      PURCHASE: { bg: '#e0f2fe', text: '#0369a1' },
      INVENTORY: { bg: '#fef3c7', text: '#b45309' },
      AUTH: { bg: '#ede9fe', text: '#6d28d9' },
      USER: { bg: '#dbeafe', text: '#1d4ed8' },
      SALES: { bg: '#dcfce7', text: '#15803d' },
      SYSTEM: { bg: '#f1f5f9', text: '#475569' },
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
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <FileTextIcon size={26} className="text-primary" />
            Nhật ký Audit & Lịch sử hệ thống (Audit Logs)
          </h1>
          <p className="page-subtitle">
            Ghi vết bất biến toàn bộ hoạt động, thay đổi trạng thái và dữ liệu của các phân hệ Mua hàng, Nhận kho, Tồn kho và Người dùng.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isAuditFetching ? 'spinner-inline' : ''} />}
            onClick={() => refetchAudit()}
            disabled={isAuditFetching}
            title="Làm mới danh sách nhật ký"
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
              placeholder="Tìm theo loại đối tượng, Entity ID, User ID..."
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

          {/* Module Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#f1f5f9', padding: 3, borderRadius: 'var(--radius-md)', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'PURCHASE', label: 'Mua hàng (PO/GR)' },
              { id: 'INVENTORY', label: 'Tồn kho (Stock)' },
              { id: 'AUTH', label: 'Xác thực (Auth)' },
              { id: 'USER', label: 'Người dùng (User)' },
              { id: 'SALES', label: 'Bán hàng (Sales)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setModuleFilter(tab.id);
                  setPage(0);
                }}
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: moduleFilter === tab.id ? '#ffffff' : 'transparent',
                  color: moduleFilter === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: moduleFilter === tab.id ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Tổng cộng: <strong>{totalElements}</strong> bản ghi
          </span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="table-container">
        {isAuditLoading ? (
          <LoadingState message="Đang tải nhật ký kiểm toán hệ thống..." minHeight="300px" />
        ) : isAuditError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải nhật ký Audit">
              {auditError?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetchAudit()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={FileTextIcon}
            title="Không tìm thấy bản ghi Audit"
            description={
              searchTerm || moduleFilter !== 'ALL'
                ? 'Không có bản ghi nào khớp với điều kiện lọc.'
                : 'Chưa có hoạt động nào được ghi nhận trong phân hệ này.'
            }
            action={
              searchTerm || moduleFilter !== 'ALL' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setModuleFilter('ALL');
                    setPage(0);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '13%' }}>Hành động</th>
                  <th style={{ width: '12%' }}>Phân hệ</th>
                  <th style={{ width: '16%' }}>Đối tượng (Entity)</th>
                  <th style={{ width: '22%' }}>Mã đối tượng (Entity ID)</th>
                  <th style={{ width: '15%' }}>Thời gian</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>Chi tiết</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.map((log) => (
                  <tr key={log.id}>
                    <td>{getActionBadge(log.action)}</td>
                    <td>{getModuleBadge(log.module)}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: 13 }}>
                        {log.entityType}
                      </span>
                    </td>
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontSize: 12,
                          color: '#475569',
                          backgroundColor: '#f8fafc',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid #e2e8f0',
                          display: 'inline-block',
                          maxWidth: 200,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={log.entityId}
                      >
                        {log.entityId}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: 12, color: '#64748b' }}>
                        {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : '—'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenDetail(log)}
                        title="Xem chi tiết thay đổi Before/After"
                      >
                        <EyeIcon size={14} /> Diff
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <AuditLogPagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
            />
          </>
        )}
      </div>

      {/* Detail Diff Modal */}
      <AuditLogDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedAuditLog(null);
        }}
        auditLog={selectedAuditLog}
      />
    </div>
  );
}
