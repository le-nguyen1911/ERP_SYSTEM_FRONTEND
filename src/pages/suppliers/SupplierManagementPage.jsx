import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supplierApi } from '../../api/supplierApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI Components
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmModal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  TruckIcon,
  PlusIcon,
  SearchIcon,
  RefreshCwIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  StarIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  PhoneIcon,
  MailIcon,
  FilterIcon,
} from '../../components/ui/Icons';

// Sub-components
import { SupplierFormModal } from './components/SupplierFormModal';
import { SupplierDetailModal } from './components/SupplierDetailModal';
import { SupplierPagination } from './components/SupplierPagination';

function RatingBadge({ rating }) {
  const colorMap = {
    'A+': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    'A': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    'B': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    'C': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    'D': { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };

  const style = colorMap[rating] || colorMap['B'];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <StarIcon size={11} /> {rating || 'B'}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)',
        color: isActive ? 'var(--color-success)' : 'var(--color-danger)',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {isActive ? <CheckCircleIcon size={11} /> : <XCircleIcon size={11} />}
      {isActive ? 'Đang hợp tác' : 'Ngừng hợp tác'}
    </span>
  );
}

export function SupplierManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC
  const canCreate = hasPermission(PERMISSIONS.SUPPLIER_CREATE) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.SUPPLIER_UPDATE) || isAdmin;

  // Filter & Pagination States
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '' | 'ACTIVE' | 'INACTIVE'
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Modal States
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // Query
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['suppliers', { keyword, status: statusFilter, page, size }],
    queryFn: () => {
      if (keyword.trim() || statusFilter) {
        return supplierApi.searchSuppliers({
          keyword: keyword.trim(),
          status: statusFilter || undefined,
          page,
          size,
          sort: 'createdAt,desc',
        });
      }
      return supplierApi.getSuppliers({ page, size, sort: 'createdAt,desc' });
    },
  });

  const pageData = data?.data;
  const suppliers = useMemo(() => pageData?.content || [], [pageData]);
  const totalElements = pageData?.totalElements || 0;
  const totalPages = pageData?.totalPages || 0;

  // Derived Stats
  const activeCount = useMemo(() => {
    return suppliers.filter((s) => s.status === 'ACTIVE').length;
  }, [suppliers]);

  const highRatingCount = useMemo(() => {
    return suppliers.filter((s) => s.rating === 'A+' || s.rating === 'A').length;
  }, [suppliers]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newSupplier) => supplierApi.createSupplier(newSupplier),
    onSuccess: () => {
      toast.success('Thêm mới nhà cung cấp thành công');
      setFormModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi tạo nhà cung cấp');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => supplierApi.updateSupplier(id, data),
    onSuccess: () => {
      toast.success('Cập nhật nhà cung cấp thành công');
      setFormModalOpen(false);
      setSelectedSupplier(null);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi cập nhật nhà cung cấp');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => supplierApi.deleteSupplier(id),
    onSuccess: () => {
      toast.success('Xoá nhà cung cấp thành công');
      setDeleteModalOpen(false);
      setSelectedSupplier(null);
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi xoá nhà cung cấp');
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedSupplier(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (supplier) => {
    setSelectedSupplier(supplier);
    setDetailModalOpen(true);
  };

  const handleOpenDelete = (supplier) => {
    setSelectedSupplier(supplier);
    setDeleteModalOpen(true);
  };

  const handleFormSubmit = (formData) => {
    if (selectedSupplier) {
      updateMutation.mutate({ id: selectedSupplier.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleConfirmDelete = () => {
    if (selectedSupplier) {
      deleteMutation.mutate(selectedSupplier.id);
    }
  };

  const handleSearchChange = (e) => {
    setKeyword(e.target.value);
    setPage(0);
  };

  const handleStatusFilterChange = (status) => {
    setStatusFilter(status);
    setPage(0);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TruckIcon size={26} className="text-primary" />
            Quản lý Nhà cung cấp
          </h1>
          <p className="page-subtitle">
            Quản lý danh sách đối tác cung ứng, thông tin liên hệ, điều khoản thanh toán và xếp hạng uy tín.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isFetching ? 'spinner-inline' : ''} />}
            onClick={() => refetch()}
            disabled={isFetching}
            title="Làm mới dữ liệu"
          >
            Làm mới
          </Button>

          {canCreate && (
            <Button variant="primary" icon={<PlusIcon size={16} />} onClick={handleOpenCreate}>
              Thêm nhà cung cấp
            </Button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <TruckIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng nhà cung cấp</span>
            <span className="stat-value">{totalElements}</span>
            <span className="stat-sub">Đối tác trên hệ thống</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <CheckCircleIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đang hợp tác</span>
            <span className="stat-value" style={{ color: 'var(--color-success)' }}>{activeCount}</span>
            <span className="stat-sub">Trạng thái ACTIVE</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#fffbeb', color: '#d97706' }}>
            <StarIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Uy tín cao (A+ / A)</span>
            <span className="stat-value" style={{ color: '#d97706' }}>{highRatingCount}</span>
            <span className="stat-sub">Xếp hạng ưu tiên</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 16,
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1, minWidth: 280, maxWidth: 460 }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--color-text-muted)', pointerEvents: 'none' }}>
              <SearchIcon size={16} />
            </span>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: 36, height: 38 }}
              placeholder="Tìm theo tên, mã, người liên hệ, email, SĐT..."
              value={keyword}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', display: 'flex', alignItems: 'center', gap: 4, marginRight: 4 }}>
            <FilterIcon size={14} /> Lọc:
          </span>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === '' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 12px' }}
            onClick={() => handleStatusFilterChange('')}
          >
            Tất cả
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'ACTIVE' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 12px' }}
            onClick={() => handleStatusFilterChange('ACTIVE')}
          >
            Đang hợp tác
          </button>
          <button
            type="button"
            className={`btn btn-sm ${statusFilter === 'INACTIVE' ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '6px 12px' }}
            onClick={() => handleStatusFilterChange('INACTIVE')}
          >
            Ngừng hợp tác
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container" style={{ minHeight: 250 }}>
        {isLoading ? (
          <LoadingState message="Đang tải danh sách nhà cung cấp..." minHeight="250px" />
        ) : isError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải dữ liệu">
              Không thể tải danh sách nhà cung cấp. Vui lòng thử lại.
            </Alert>
          </div>
        ) : suppliers.length === 0 ? (
          <EmptyState
            icon={TruckIcon}
            title={keyword || statusFilter ? 'Không tìm thấy kết quả' : 'Chưa có nhà cung cấp nào'}
            description={
              keyword || statusFilter
                ? 'Thử thay đổi từ khóa tìm kiếm hoặc bỏ bộ lọc trạng thái.'
                : 'Bắt đầu bằng cách thêm mới nhà cung cấp đầu tiên vào hệ thống.'
            }
            action={
              canCreate && !keyword && !statusFilter ? (
                <Button variant="primary" icon={<PlusIcon size={16} />} onClick={handleOpenCreate}>
                  Thêm nhà cung cấp
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Nhà cung cấp</th>
                  <th style={{ width: '18%' }}>Người liên hệ</th>
                  <th style={{ width: '22%' }}>Thông tin liên lạc</th>
                  <th style={{ width: '10%', textAlign: 'center' }}>Xếp hạng</th>
                  <th style={{ width: '12%' }}>Trạng thái</th>
                  <th style={{ width: '16%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.id}>
                    <td>
                      <div
                        style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: 13, cursor: 'pointer' }}
                        onClick={() => handleOpenDetail(supplier)}
                        title="Xem chi tiết"
                      >
                        {supplier.supplierName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                        {supplier.supplierCode}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: 13, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <UserIcon size={13} style={{ color: 'var(--color-text-muted)' }} />
                        {supplier.contactPerson}
                      </div>
                      {supplier.city && (
                        <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {supplier.city}, {supplier.country || 'VN'}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-main)' }}>
                        <PhoneIcon size={12} style={{ color: 'var(--color-text-muted)' }} />
                        <span style={{ fontFamily: 'monospace' }}>{supplier.phone}</span>
                      </div>
                      <div style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 5, color: 'var(--color-text-secondary)' }}>
                        <MailIcon size={12} style={{ color: 'var(--color-text-muted)' }} />
                        <span>{supplier.email}</span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <RatingBadge rating={supplier.rating} />
                    </td>

                    <td>
                      <StatusBadge status={supplier.status} />
                    </td>

                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="Xem chi tiết"
                          onClick={() => handleOpenDetail(supplier)}
                        >
                          <EyeIcon size={14} />
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Chỉnh sửa"
                            onClick={() => handleOpenEdit(supplier)}
                          >
                            <EditIcon size={14} />
                          </button>
                        )}

                        {canUpdate && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            style={{ padding: '4px 8px' }}
                            title="Xoá nhà cung cấp"
                            onClick={() => handleOpenDelete(supplier)}
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
            <SupplierPagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={size}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setSize(newSize);
                setPage(0);
              }}
            />
          </>
        )}
      </div>

      {/* Modals */}
      <SupplierFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedSupplier(null);
        }}
        onSubmit={handleFormSubmit}
        supplier={selectedSupplier}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <SupplierDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedSupplier(null);
        }}
        supplier={selectedSupplier}
        onEdit={(supp) => handleOpenEdit(supp)}
        canEdit={canUpdate}
      />

      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedSupplier(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Xác nhận xoá nhà cung cấp"
        message={
          selectedSupplier ? (
            <div>
              Bạn có chắc chắn muốn xoá nhà cung cấp <strong>{selectedSupplier.supplierName}</strong> (
              <code>{selectedSupplier.supplierCode}</code>)?
              <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-danger)' }}>
                Lưu ý: Không thể xoá nếu nhà cung cấp đang có đơn hàng mua (PO) chưa hoàn tất.
              </div>
            </div>
          ) : (
            'Bạn có chắc chắn muốn xoá nhà cung cấp này?'
          )
        }
        confirmText="Xoá nhà cung cấp"
        confirmVariant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
