import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { warehouseApi } from '../../api/warehouseApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  WarehouseIcon,
  MapPinIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../../components/ui/Icons';

// Sub-components
import { WarehouseFormModal } from './components/WarehouseFormModal';
import { WarehouseDetailModal } from './components/WarehouseDetailModal';

export function WarehouseManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC Permission checks
  const canCreate = hasPermission(PERMISSIONS.WAREHOUSE_CREATE) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.WAREHOUSE_UPDATE) || isAdmin;
  const canDelete = hasPermission(PERMISSIONS.WAREHOUSE_DELETE) || isAdmin;

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);

  // Query Warehouses
  const {
    data: warehousesResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseApi.getWarehouses(),
  });

  const warehousesList = useMemo(
    () => warehousesResponse?.data || [],
    [warehousesResponse?.data]
  );

  // Filtered warehouses
  const filteredWarehouses = useMemo(() => {
    return warehousesList.filter((wh) => {
      // Search matching (name, location, description)
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        wh.name?.toLowerCase().includes(term) ||
        wh.location?.toLowerCase().includes(term) ||
        wh.description?.toLowerCase().includes(term);

      // Status matching
      let matchesStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchesStatus = wh.active === true;
      } else if (statusFilter === 'INACTIVE') {
        matchesStatus = wh.active === false;
      }

      return matchesSearch && matchesStatus;
    });
  }, [warehousesList, searchTerm, statusFilter]);

  // Statistics
  const stats = useMemo(() => {
    const total = warehousesList.length;
    const active = warehousesList.filter((w) => w.active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [warehousesList]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => warehouseApi.createWarehouse(data),
    onSuccess: () => {
      toast.success('Tạo mới kho thành công');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setFormModalOpen(false);
      setSelectedWarehouse(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo kho');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => warehouseApi.updateWarehouse(id, data),
    onSuccess: () => {
      toast.success('Cập nhật kho thành công');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setFormModalOpen(false);
      setSelectedWarehouse(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật kho');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => warehouseApi.deleteWarehouse(id),
    onSuccess: () => {
      toast.success('Vô hiệu hóa kho thành công');
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setDeleteConfirmOpen(false);
      setSelectedWarehouse(null);
    },
    onError: (err) => {
      setDeleteConfirmOpen(false);
      setSelectedWarehouse(null);
      toast.error(err.message || 'Không thể vô hiệu hóa kho');
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedWarehouse(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (wh) => {
    setSelectedWarehouse(wh);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (wh) => {
    setSelectedWarehouse(wh);
    setDetailModalOpen(true);
  };

  const handleOpenDelete = (wh) => {
    setSelectedWarehouse(wh);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (selectedWarehouse) {
      await updateMutation.mutateAsync({
        id: selectedWarehouse.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <WarehouseIcon size={26} className="text-primary" />
            Quản lý Kho lưu trữ
          </h1>
          <p className="page-subtitle">
            Thiết lập danh mục các kho vật lý, địa điểm lưu trữ phục vụ quản lý tồn kho và điều chuyển.
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
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={handleOpenCreate}
            >
              Thêm mới kho
            </Button>
          )}
        </div>
      </div>

      {/* Top Metrics / Stats Cards */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <WarehouseIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng số kho</span>
            <span className="stat-value">{stats.total}</span>
            <span className="stat-sub">Địa điểm trong hệ thống</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <CheckCircleIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đang hoạt động</span>
            <span className="stat-value">{stats.active}</span>
            <span className="stat-sub">Sẵn sàng nhập/xuất</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
            <XCircleIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ngừng hoạt động</span>
            <span className="stat-value">{stats.inactive}</span>
            <span className="stat-sub">Tạm khóa hoặc lưu trữ</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar-left" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div className="table-search-input" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm theo tên kho, vị trí, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon
              size={20}
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

          <div style={{ display: 'flex', gap: 4, backgroundColor: '#f1f5f9', padding: 3, borderRadius: 'var(--radius-md)' }}>
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ALL' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ALL' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                boxShadow: statusFilter === 'ALL' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Tất cả ({stats.total})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('ACTIVE')}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === 'ACTIVE' ? '#ffffff' : 'transparent',
                color: statusFilter === 'ACTIVE' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                boxShadow: statusFilter === 'ACTIVE' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Hoạt động ({stats.active})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('INACTIVE')}
              style={{
                padding: '5px 12px',
                fontSize: 12,
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: statusFilter === 'INACTIVE' ? '#ffffff' : 'transparent',
                color: statusFilter === 'INACTIVE' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                boxShadow: statusFilter === 'INACTIVE' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              Đã khóa ({stats.inactive})
            </button>
          </div>
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Hiển thị: <strong>{filteredWarehouses.length}</strong> / {warehousesList.length} kho
          </span>
        </div>
      </div>

      {/* Main Table */}
      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Đang tải danh sách kho..." minHeight="300px" />
        ) : isError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải danh sách kho">
              {error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <EmptyState
            icon={WarehouseIcon}
            title="Không tìm thấy kho hàng"
            description={
              searchTerm || statusFilter !== 'ALL'
                ? 'Không có kho nào khớp với điều kiện tìm kiếm hoặc bộ lọc hiện tại.'
                : 'Chưa có kho lưu trữ nào trong hệ thống.'
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
                  Tạo kho đầu tiên
                </Button>
              ) : null
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '25%' }}>Tên kho</th>
                <th style={{ width: '30%' }}>Vị trí / Địa chỉ</th>
                <th style={{ width: '25%' }}>Mô tả</th>
                <th style={{ width: '10%' }}>Trạng thái</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredWarehouses.map((wh) => (
                <tr key={wh.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: wh.active ? 'var(--color-primary-light)' : '#f1f5f9',
                          color: wh.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <WarehouseIcon size={18} />
                      </div>
                      <div>
                        <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {wh.name}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-secondary)', fontSize: 13 }}>
                      <MapPinIcon size={14} className="text-muted" />
                      <span>{wh.location || '—'}</span>
                    </div>
                  </td>

                  <td>
                    <span style={{ color: wh.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', fontSize: 13 }}>
                      {wh.description || '—'}
                    </span>
                  </td>

                  <td>
                    {wh.active ? (
                      <Badge variant="success" size="sm">Hoạt động</Badge>
                    ) : (
                      <Badge variant="danger" size="sm">Đã khóa</Badge>
                    )}
                  </td>

                  <td>
                    <div className="table-actions-cell">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenDetail(wh)}
                        title="Xem chi tiết kho"
                      >
                        <EyeIcon size={14} />
                      </button>

                      {canUpdate && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenEdit(wh)}
                          title="Chỉnh sửa kho"
                        >
                          <EditIcon size={14} />
                        </button>
                      )}

                      {canDelete && wh.active && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenDelete(wh)}
                          title="Ngừng hoạt động kho"
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
        )}
      </div>

      {/* Modals */}
      <WarehouseFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <WarehouseDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedWarehouse(null);
        }}
        warehouse={selectedWarehouse}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedWarehouse(null);
        }}
        onConfirm={() => deleteMutation.mutateAsync(selectedWarehouse?.id)}
        title={`Vô hiệu hóa kho "${selectedWarehouse?.name}"?`}
        message="Hành động này sẽ chuyển trạng thái kho sang 'Ngừng hoạt động'. Lưu ý: Không thể vô hiệu hóa kho nếu vẫn còn số lượng hàng tồn kho lớn hơn 0."
        confirmText="Xác nhận vô hiệu hóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
