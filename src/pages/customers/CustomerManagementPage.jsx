import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi } from '../../api/customerApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';

// UI Components
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';
import { toast } from '../../stores/useToastStore';

// Icons
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../../components/ui/Icons';

// Sub-components
import { CustomerFormModal } from './components/CustomerFormModal';
import { CustomerDetailModal } from './components/CustomerDetailModal';
import { CustomerPagination } from './components/CustomerPagination';

export function CustomerManagementPage() {
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();

  // Permission flags
  const canCreate = hasPermission(PERMISSIONS.CUSTOMER_CREATE);
  const canUpdate = hasPermission(PERMISSIONS.CUSTOMER_UPDATE);

  // 1. Component State
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // 2. Fetch Customer List Query
  const {
    data: customerApiResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['customers', statusFilter, activeSearch, page, pageSize],
    queryFn: () =>
      customerApi.searchCustomers({
        keyword: activeSearch || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      }),
  });

  const pageData = customerApiResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const customerList = useMemo(() => pageData?.content || [], [pageData?.content]);

  // 3. KPI Statistics
  const activeCount = useMemo(
    () => customerList.filter((c) => c.status === 'ACTIVE').length,
    [customerList]
  );
  const inactiveCount = useMemo(
    () => customerList.filter((c) => c.status === 'INACTIVE').length,
    [customerList]
  );

  // 4. Mutations
  const createMutation = useMutation({
    mutationFn: (data) => customerApi.createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Tạo khách hàng mới thành công');
      setIsFormModalOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Không thể tạo khách hàng';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => customerApi.updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Cập nhật khách hàng thành công');
      setIsFormModalOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Không thể cập nhật khách hàng';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => customerApi.deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      toast.success('Xóa khách hàng thành công');
      setIsDeleteModalOpen(false);
      setSelectedCustomer(null);
    },
    onError: (err) => {
      const msg = err.response?.data?.message || err.message || 'Không thể xóa khách hàng';
      toast.error(msg);
    },
  });

  // Handlers
  const handleSearchSubmit = (e) => {
    e?.preventDefault();
    setActiveSearch(searchTerm.trim());
    setPage(0);
  };

  const handleOpenCreate = () => {
    setSelectedCustomer(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEdit = (cust) => {
    setSelectedCustomer(cust);
    setIsFormModalOpen(true);
  };

  const handleOpenDetail = (cust) => {
    setSelectedCustomer(cust);
    setIsDetailModalOpen(true);
  };

  const handleOpenDelete = (cust) => {
    setSelectedCustomer(cust);
    setIsDeleteModalOpen(true);
  };

  const handleFormSubmit = (data) => {
    if (selectedCustomer) {
      updateMutation.mutate({ id: selectedCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedCustomer) {
      deleteMutation.mutate(selectedCustomer.id);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UsersIcon size={26} className="text-primary" />
            Quản lý Khách hàng (Customer Management)
          </h1>
          <p className="page-subtitle">
            Quản lý hồ sơ đối tác khách hàng, thông tin liên hệ, mã số thuế và điều khoản thanh toán phục vụ đơn bán hàng.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isFetching ? 'spinner-inline' : ''} />}
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới danh sách"
          >
            Làm mới
          </Button>

          {canCreate && (
            <Button variant="primary" icon={<PlusIcon size={16} />} onClick={handleOpenCreate}>
              Thêm khách hàng
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: '#e0f2fe',
              color: '#0284c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UsersIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>TỔNG KHÁCH HÀNG</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-text-main)' }}>{totalElements}</div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: '#dcfce7',
              color: '#16a34a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CheckCircleIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>ĐANG HOẠT ĐỘNG</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>
              {statusFilter === 'ACTIVE' ? totalElements : activeCount}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 16, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <XCircleIcon size={22} />
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 600 }}>NGỪNG HOẠT ĐỘNG</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#64748b' }}>
              {statusFilter === 'INACTIVE' ? totalElements : inactiveCount}
            </div>
          </div>
        </div>
      </div>

      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar-left" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <form onSubmit={handleSearchSubmit} className="table-search-input" style={{ minWidth: 280 }}>
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm theo mã, tên KH, SĐT, email..."
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
          </form>

          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 4, backgroundColor: '#f1f5f9', padding: 3, borderRadius: 'var(--radius-md)' }}>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'ACTIVE', label: 'Đang hoạt động' },
              { id: 'INACTIVE', label: 'Ngừng hoạt động' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.id);
                  setPage(0);
                }}
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
            Tổng cộng: <strong>{totalElements}</strong> khách hàng
          </span>
        </div>
      </div>

      {/* Data Table */}
      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Đang tải danh sách khách hàng..." minHeight="300px" />
        ) : isError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải dữ liệu">
              {error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : customerList.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Không tìm thấy khách hàng"
            description={
              activeSearch || statusFilter !== 'ALL'
                ? 'Không có khách hàng nào khớp với điều kiện tìm kiếm/bộ lọc.'
                : 'Hệ thống chưa có khách hàng nào. Hãy thêm mới khách hàng đầu tiên.'
            }
            action={
              activeSearch || statusFilter !== 'ALL' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setActiveSearch('');
                    setStatusFilter('ALL');
                    setPage(0);
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : canCreate ? (
                <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={handleOpenCreate}>
                  Thêm khách hàng
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '12%' }}>Mã KH</th>
                  <th style={{ width: '20%' }}>Tên khách hàng</th>
                  <th style={{ width: '14%' }}>Người liên hệ</th>
                  <th style={{ width: '13%' }}>Số điện thoại</th>
                  <th style={{ width: '12%' }}>Mã số thuế</th>
                  <th style={{ width: '11%' }}>Điều khoản TT</th>
                  <th style={{ width: '10%' }}>Trạng thái</th>
                  <th style={{ width: '8%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {customerList.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <span
                        className="font-mono"
                        style={{
                          fontWeight: 700,
                          color: '#0284c7',
                          backgroundColor: '#f0f9ff',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid #bae6fd',
                          fontSize: 12,
                        }}
                      >
                        {c.customerCode || '—'}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: 13 }}>
                        {c.customerName || '—'}
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.email || '—'}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: 13, color: '#334155' }}>{c.contactPerson || '—'}</span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: 12, color: '#475569' }}>
                        {c.phone || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono" style={{ fontSize: 12, color: '#64748b' }}>
                        {c.taxId || '—'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: '#0369a1',
                          backgroundColor: '#f8fafc',
                          padding: '2px 6px',
                          borderRadius: 4,
                          border: '1px solid #e2e8f0',
                        }}
                      >
                        {c.paymentTerms || '—'}
                      </span>
                    </td>
                    <td>
                      {c.status === 'ACTIVE' ? (
                        <Badge variant="success">ACTIVE</Badge>
                      ) : (
                        <Badge variant="neutral">INACTIVE</Badge>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4 }}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 6px' }}
                          onClick={() => handleOpenDetail(c)}
                          title="Xem chi tiết hồ sơ khách hàng"
                        >
                          <EyeIcon size={14} />
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 6px' }}
                            onClick={() => handleOpenEdit(c)}
                            title="Chỉnh sửa thông tin khách hàng"
                          >
                            <EditIcon size={14} />
                          </button>
                        )}

                        {canUpdate && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm text-danger"
                            style={{ padding: '4px 6px' }}
                            onClick={() => handleOpenDelete(c)}
                            title="Xóa khách hàng"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <CustomerPagination
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

      {/* Form Modal (Create / Edit) */}
      <CustomerFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSubmit={handleFormSubmit}
        customer={selectedCustomer}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* Detail Modal */}
      <CustomerDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedCustomer(null);
        }}
        title="Xác nhận xóa khách hàng"
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontSize: 14, color: 'var(--color-text-main)', margin: 0 }}>
            Bạn có chắc chắn muốn xóa khách hàng{' '}
            <strong>{selectedCustomer?.customerName}</strong> ({selectedCustomer?.customerCode})?
          </p>
          <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
            Lưu ý: Không thể xóa khách hàng đang có đơn bán hàng chưa hoàn tất.
          </div>
          <div className="modal-footer" style={{ margin: '16px -20px -20px -20px', paddingTop: 16 }}>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedCustomer(null);
              }}
              disabled={deleteMutation.isPending}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDelete}
              isLoading={deleteMutation.isPending}
              disabled={deleteMutation.isPending}
            >
              Xác nhận xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
