import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { goodsReceiptApi } from '../../api/goodsReceiptApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  InboxIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  ClockIcon,
  TruckIcon,
  CheckSquareIcon,
} from '../../components/ui/Icons';

// Sub-components
import { GoodsReceiptFormModal } from './components/GoodsReceiptFormModal';
import { GoodsReceiptDetailModal } from './components/GoodsReceiptDetailModal';
import { GoodsReceiptPagination } from './components/GoodsReceiptPagination';

export function GoodsReceiptManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC Permission checks
  const canView = hasPermission(PERMISSIONS.GOODS_RECEIPT_VIEW) || isAdmin;
  const canCreate = hasPermission(PERMISSIONS.GOODS_RECEIPT_CREATE) || isAdmin;

  // 1. All useState hooks declared at top level
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal active states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedGrId, setSelectedGrId] = useState(null);

  // 2. Fetch Goods Receipts Query (paginated)
  const {
    data: grApiResponse,
    isLoading: isGrLoading,
    isError: isGrError,
    error: grError,
    refetch: refetchGr,
    isFetching: isGrFetching,
  } = useQuery({
    queryKey: ['goods-receipts', page, pageSize],
    queryFn: () => goodsReceiptApi.getGoodsReceipts({ page, size: pageSize, sort: 'createdAt,desc' }),
    enabled: canView,
  });

  // 3. Fetch specific GR detail when modal is open
  const {
    data: grDetailApiResponse,
    isLoading: isDetailLoading,
    refetch: refetchDetail,
  } = useQuery({
    queryKey: ['goods-receipt-detail', selectedGrId],
    queryFn: () => goodsReceiptApi.getGoodsReceiptById(selectedGrId),
    enabled: Boolean(selectedGrId) && detailModalOpen,
  });

  const selectedGrDetail = grDetailApiResponse?.data;

  const pageData = grApiResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const rawList = useMemo(() => pageData?.content || [], [pageData?.content]);

  // Client-side filtering by search term and status tab
  const displayedList = useMemo(() => {
    return rawList.filter((gr) => {
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = gr.status === statusFilter;
      }

      let matchSearch = true;
      if (searchTerm.trim()) {
        const term = searchTerm.trim().toLowerCase();
        const grNo = (gr.grNumber || '').toLowerCase();
        const poNo = (gr.poNumber || '').toLowerCase();
        const supp = (gr.supplierName || '').toLowerCase();
        matchSearch = grNo.includes(term) || poNo.includes(term) || supp.includes(term);
      }

      return matchStatus && matchSearch;
    });
  }, [rawList, statusFilter, searchTerm]);

  // Derived KPI counts
  const draftCount = useMemo(() => rawList.filter((g) => g.status === 'DRAFT').length, [rawList]);
  const receivedCount = useMemo(() => rawList.filter((g) => g.status === 'RECEIVED').length, [rawList]);
  const importedCount = useMemo(() => rawList.filter((g) => g.status === 'IMPORTED').length, [rawList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => goodsReceiptApi.createGoodsReceipt(data),
    onSuccess: (res) => {
      toast.success('Tạo phiếu nhận hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-eligible-for-gr-sent'] });
      queryClient.invalidateQueries({ queryKey: ['po-eligible-for-gr-received'] });
      setFormModalOpen(false);
      if (res.data?.id) {
        setSelectedGrId(res.data.id);
        setDetailModalOpen(true);
      }
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo phiếu nhận hàng');
    },
  });

  const markReceivedMutation = useMutation({
    mutationFn: (id) => goodsReceiptApi.markAsReceived(id),
    onSuccess: () => {
      toast.success('Đã xác nhận nhận hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-detail', selectedGrId] });
      refetchDetail();
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể xác nhận nhận hàng');
    },
  });

  const qcMutation = useMutation({
    mutationFn: ({ id, data }) => goodsReceiptApi.performQualityCheck(id, data),
    onSuccess: (res) => {
      const isPassed = res.data?.qualityCheckStatus === 'PASSED';
      toast.success(
        isPassed
          ? 'Kiểm tra chất lượng ĐẠT — Đã tự động nhập tồn kho thành công'
          : 'Kiểm tra chất lượng KHÔNG ĐẠT — Phiếu đã chuyển sang QC_FAILED'
      );
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-detail', selectedGrId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['product-stocks'] });
      refetchDetail();
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi thực hiện kiểm tra chất lượng');
    },
  });

  const retryImportMutation = useMutation({
    mutationFn: (id) => goodsReceiptApi.retryInventoryImport(id),
    onSuccess: () => {
      toast.success('Thử lại nhập tồn kho thành công');
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-detail', selectedGrId] });
      queryClient.invalidateQueries({ queryKey: ['product-stocks'] });
      refetchDetail();
    },
    onError: (err) => {
      toast.error(err.message || 'Thử lại nhập tồn kho thất bại');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => goodsReceiptApi.cancelGoodsReceipt(id, reason),
    onSuccess: () => {
      toast.success('Đã hủy phiếu nhận hàng thành công');
      queryClient.invalidateQueries({ queryKey: ['goods-receipts'] });
      queryClient.invalidateQueries({ queryKey: ['goods-receipt-detail', selectedGrId] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['po-eligible-for-gr-sent'] });
      setDetailModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể hủy phiếu nhận hàng');
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setFormModalOpen(true);
  };

  const handleOpenDetail = (id) => {
    setSelectedGrId(id);
    setDetailModalOpen(true);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="neutral">Bản nháp</Badge>;
      case 'RECEIVED':
        return <Badge variant="info">Đã nhận hàng</Badge>;
      case 'QC_PASSED':
        return <Badge variant="success">QC Đạt</Badge>;
      case 'QC_FAILED':
        return <Badge variant="danger">QC Lỗi</Badge>;
      case 'IMPORTED':
        return <Badge variant="success">Đã nhập kho</Badge>;
      case 'CANCELLED':
        return <Badge variant="neutral">Đã huỷ</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getQcBadge = (qc) => {
    switch (qc) {
      case 'PASSED':
        return <Badge variant="success">QC Đạt</Badge>;
      case 'FAILED':
        return <Badge variant="danger">QC Lỗi</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">Chờ QC</Badge>;
    }
  };

  const getImportBadge = (imp, status) => {
    if (status === 'IMPORTED' || imp === 'SUCCESS') {
      return <Badge variant="success">Đã nhập kho</Badge>;
    }
    if (imp === 'FAILED') {
      return <Badge variant="danger">Lỗi nhập kho</Badge>;
    }
    return <Badge variant="neutral">Chưa nhập</Badge>;
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <InboxIcon size={26} className="text-primary" />
            Nhận hàng & Nhập kho (Goods Receipt)
          </h1>
          <p className="page-subtitle">
            Tiếp nhận hàng hóa từ Đơn mua hàng (PO), kiểm tra chất lượng (QC) và tự động đồng bộ tồn kho hàng hóa.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isGrFetching ? 'spinner-inline' : ''} />}
            onClick={() => refetchGr()}
            disabled={isGrFetching}
            title="Làm mới danh sách"
          >
            Làm mới
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={handleOpenCreate}
            >
              Tạo phiếu nhận hàng
            </Button>
          )}
        </div>
      </div>

      {/* KPI Dashboard Cards */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <InboxIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng phiếu nhận</span>
            <span className="stat-value">{totalElements}</span>
            <span className="stat-sub">Trong hệ thống</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
            <ClockIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Bản nháp (DRAFT)</span>
            <span className="stat-value">{draftCount}</span>
            <span className="stat-sub">Chưa xác nhận nhận</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-warning-light)', color: 'var(--color-warning)' }}>
            <CheckSquareIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Chờ kiểm tra QC</span>
            <span className="stat-value">{receivedCount}</span>
            <span className="stat-sub">Đã nhận tại kho</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <CheckCircleIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đã nhập kho</span>
            <span className="stat-value">{importedCount}</span>
            <span className="stat-sub">Đã tăng tồn kho</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar-left" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="table-search-input" style={{ minWidth: 280 }}>
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm theo mã GR, mã PO, nhà cung cấp..."
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

          {/* Status Filter Tabs */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#f1f5f9', padding: 3, borderRadius: 'var(--radius-md)' }}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'DRAFT', label: 'Nháp' },
              { id: 'RECEIVED', label: 'Chờ QC' },
              { id: 'IMPORTED', label: 'Đã nhập kho' },
              { id: 'QC_FAILED', label: 'QC Lỗi' },
              { id: 'CANCELLED', label: 'Đã huỷ' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  padding: '5px 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: 'var(--radius-sm)',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: statusFilter === tab.id ? '#ffffff' : 'transparent',
                  color: statusFilter === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                  boxShadow: statusFilter === tab.id ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Hiển thị: <strong>{displayedList.length}</strong> / {totalElements} phiếu
          </span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="table-container">
        {isGrLoading ? (
          <LoadingState message="Đang tải danh sách phiếu nhận hàng..." minHeight="300px" />
        ) : isGrError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải danh sách phiếu nhận hàng">
              {grError?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetchGr()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : displayedList.length === 0 ? (
          <EmptyState
            icon={InboxIcon}
            title="Không tìm thấy phiếu nhận hàng"
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Không có phiếu nhận hàng nào khớp với điều kiện lọc.'
                : 'Chưa có phiếu nhận hàng nào trong hệ thống.'
            }
            action={
              searchTerm || statusFilter !== 'ALL' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('ALL');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : canCreate ? (
                <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={handleOpenCreate}>
                  Tạo phiếu nhận hàng đầu tiên
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '16%' }}>Mã phiếu (GR)</th>
                  <th style={{ width: '16%' }}>Đơn mua hàng (PO)</th>
                  <th style={{ width: '22%' }}>Nhà cung cấp</th>
                  <th style={{ width: '13%' }}>Ngày nhận</th>
                  <th style={{ width: '11%' }}>Trạng thái</th>
                  <th style={{ width: '11%' }}>QC / Nhập kho</th>
                  <th style={{ width: '11%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayedList.map((gr) => (
                  <tr key={gr.id}>
                    <td>
                      <span
                        className="font-mono"
                        style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 13, cursor: 'pointer' }}
                        onClick={() => handleOpenDetail(gr.id)}
                      >
                        {gr.grNumber}
                      </span>
                    </td>

                    <td>
                      <span className="font-mono" style={{ fontWeight: 600, color: '#334155', fontSize: 13 }}>
                        {gr.poNumber || '—'}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <TruckIcon size={14} style={{ color: '#64748b', flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {gr.supplierName || '—'}
                        </span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: 13, color: '#475569' }}>
                        {gr.grDate ? new Date(gr.grDate).toLocaleDateString('vi-VN') : '—'}
                      </span>
                    </td>

                    <td>{getStatusBadge(gr.status)}</td>

                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
                        {getQcBadge(gr.qualityCheckStatus)}
                        {getImportBadge(gr.inventoryImportStatus, gr.status)}
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenDetail(gr.id)}
                        title="Xem chi tiết phiếu nhận hàng"
                      >
                        <EyeIcon size={14} /> Chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <GoodsReceiptPagination
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

      {/* Create Modal */}
      <GoodsReceiptFormModal
        isOpen={formModalOpen}
        onClose={() => setFormModalOpen(false)}
        onSubmit={(formData) => createMutation.mutateAsync(formData)}
        isLoading={createMutation.isPending}
      />

      {/* Detail & Workflow Modal */}
      <GoodsReceiptDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedGrId(null);
        }}
        goodsReceipt={selectedGrDetail}
        onMarkReceived={(id) => markReceivedMutation.mutateAsync(id)}
        onPerformQc={(id, data) => qcMutation.mutateAsync({ id, data })}
        onRetryImport={(id) => retryImportMutation.mutateAsync(id)}
        onCancel={(id, reason) => cancelMutation.mutateAsync({ id, reason })}
        isActionLoading={
          markReceivedMutation.isPending ||
          qcMutation.isPending ||
          retryImportMutation.isPending ||
          cancelMutation.isPending ||
          isDetailLoading
        }
      />
    </div>
  );
}
