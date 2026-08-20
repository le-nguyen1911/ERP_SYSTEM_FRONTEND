import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitApi } from '../../api/unitApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  ScaleIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  RefreshCwIcon,
} from '../../components/ui/Icons';

// Sub-components
import { UnitFormModal } from './components/UnitFormModal';
import { UnitDetailModal } from './components/UnitDetailModal';

export function UnitManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC Permission checks
  const canCreate = hasPermission(PERMISSIONS.UNIT_CREATE) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.UNIT_UPDATE) || isAdmin;
  const canDelete = hasPermission(PERMISSIONS.UNIT_DELETE) || isAdmin;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState(null);

  // 1. Fetch Units Query (Flat list from ApiResponse<List<UnitResponse>>)
  const {
    data: unitsResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitApi.getUnits(),
  });

  const unitsList = unitsResponse?.data || [];

  // Client-side search filtering
  const filteredUnits = useMemo(() => {
    const list = unitsResponse?.data || [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (u) =>
        u.name?.toLowerCase().includes(term) ||
        u.description?.toLowerCase().includes(term)
    );
  }, [unitsResponse?.data, searchTerm]);

  // Mutations
  // Create Unit Mutation
  const createMutation = useMutation({
    mutationFn: (data) => unitApi.createUnit(data),
    onSuccess: () => {
      toast.success('Tạo đơn vị tính thành công');
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setFormModalOpen(false);
      setSelectedUnit(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo đơn vị tính');
    },
  });

  // Update Unit Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => unitApi.updateUnit(id, data),
    onSuccess: () => {
      toast.success('Cập nhật đơn vị tính thành công');
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setFormModalOpen(false);
      setSelectedUnit(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật đơn vị tính');
    },
  });

  // Delete Unit Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => unitApi.deleteUnit(id),
    onSuccess: () => {
      toast.success('Đã xóa đơn vị tính thành công');
      queryClient.invalidateQueries({ queryKey: ['units'] });
      setDeleteConfirmOpen(false);
      setSelectedUnit(null);
    },
    onError: (err) => {
      setDeleteConfirmOpen(false);
      setSelectedUnit(null);
      const msg = err?.message || '';
      if (msg.includes('sản phẩm') || msg.includes('product')) {
        toast.error('Không thể xóa đơn vị tính đang được sử dụng bởi sản phẩm.');
      } else {
        toast.error(msg || 'Không thể xóa đơn vị tính. Vui lòng thử lại.');
      }
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedUnit(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (unit) => {
    setSelectedUnit(unit);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (unit) => {
    setSelectedUnit(unit);
    setDetailModalOpen(true);
  };

  const handleOpenDelete = (unit) => {
    setSelectedUnit(unit);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (selectedUnit) {
      await updateMutation.mutateAsync({
        id: selectedUnit.id,
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
            <ScaleIcon size={24} className="text-primary" />
            Quản lý Đơn vị tính
          </h1>
          <p className="page-subtitle">
            Quản lý các đơn vị đo lường (Cái, Hộp, Kg, Thùng,...) dùng cho quản lý sản phẩm và xuất nhập kho.
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
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={handleOpenCreate}
            >
              Thêm đơn vị tính
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar (Search & Count) */}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-search-input">
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm kiếm đơn vị tính theo tên, mô tả..."
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
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Tổng cộng: <strong>{unitsList.length}</strong> đơn vị tính
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Đang tải danh sách đơn vị tính..." minHeight="300px" />
        ) : isError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi khi tải đơn vị tính">
              {error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : filteredUnits.length === 0 ? (
          <EmptyState
            icon={ScaleIcon}
            title="Không tìm thấy đơn vị tính"
            description={
              searchTerm
                ? `Không có đơn vị tính nào khớp với từ khóa "${searchTerm}".`
                : 'Chưa có đơn vị tính nào trong hệ thống.'
            }
            action={
              searchTerm ? (
                <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                  Xóa tìm kiếm
                </Button>
              ) : canCreate ? (
                <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={handleOpenCreate}>
                  Tạo đơn vị tính đầu tiên
                </Button>
              ) : null
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Tên đơn vị tính</th>
                <th style={{ width: '55%' }}>Mô tả</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredUnits.map((unit) => (
                <tr key={unit.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-md)',
                          backgroundColor: 'var(--color-primary-light)',
                          color: 'var(--color-primary)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <ScaleIcon size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {unit.name}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span style={{ color: unit.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                      {unit.description || '—'}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions-cell">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenDetail(unit)}
                        title="Xem chi tiết"
                      >
                        <EyeIcon size={14} />
                      </button>

                      {canUpdate && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenEdit(unit)}
                          title="Chỉnh sửa đơn vị tính"
                        >
                          <EditIcon size={14} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenDelete(unit)}
                          title="Xóa đơn vị tính"
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
      {/* 1. Create / Edit Modal */}
      <UnitFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* 2. Detail Modal */}
      <UnitDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedUnit(null);
        }}
        unit={selectedUnit}
        onEdit={handleOpenEdit}
        onDelete={handleOpenDelete}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      {/* 3. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedUnit(null);
        }}
        onConfirm={() => deleteMutation.mutateAsync(selectedUnit?.id)}
        title={`Xác nhận xóa đơn vị tính "${selectedUnit?.name}"?`}
        message="Hành động này sẽ xóa đơn vị tính khỏi hệ thống. Lưu ý: Không thể xóa đơn vị tính nếu đang có sản phẩm sử dụng."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
