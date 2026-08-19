import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryApi } from '../../api/categoryApi';
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
  TagIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  RefreshCwIcon,
} from '../../components/ui/Icons';

// Sub-components
import { CategoryFormModal } from './components/CategoryFormModal';
import { CategoryDetailModal } from './components/CategoryDetailModal';

export function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC Permission checks
  const canCreate = hasPermission(PERMISSIONS.CATEGORY_CREATE) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.CATEGORY_UPDATE) || isAdmin;
  const canDelete = hasPermission(PERMISSIONS.CATEGORY_DELETE) || isAdmin;

  // State
  const [searchTerm, setSearchTerm] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Fetch Categories Query (Flat list from ApiResponse<List<CategoryResponse>>)
  const {
    data: categoriesResponse,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
  });

  const categoriesList = categoriesResponse?.data || [];

  // Client-side search filtering
  const filteredCategories = useMemo(() => {
    const list = categoriesResponse?.data || [];
    if (!searchTerm.trim()) return list;
    const term = searchTerm.toLowerCase();
    return list.filter(
      (c) =>
        c.name?.toLowerCase().includes(term) ||
        c.description?.toLowerCase().includes(term)
    );
  }, [categoriesResponse?.data, searchTerm]);

  // Mutations
  // Create Category Mutation
  const createMutation = useMutation({
    mutationFn: (data) => categoryApi.createCategory(data),
    onSuccess: () => {
      toast.success('Tạo danh mục hàng hóa thành công');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormModalOpen(false);
      setSelectedCategory(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo danh mục');
    },
  });

  // Update Category Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => categoryApi.updateCategory(id, data),
    onSuccess: () => {
      toast.success('Cập nhật danh mục thành công');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setFormModalOpen(false);
      setSelectedCategory(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật danh mục');
    },
  });

  // Delete Category Mutation (204 No Content)
  const deleteMutation = useMutation({
    mutationFn: (id) => categoryApi.deleteCategory(id),
    onSuccess: () => {
      toast.success('Đã xóa danh mục thành công');
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setDeleteConfirmOpen(false);
      setSelectedCategory(null);
    },
    onError: (err) => {
      // Close modal even on error to avoid stuck UI
      setDeleteConfirmOpen(false);
      setSelectedCategory(null);
      // Show the actual backend error message
      const msg = err?.message || '';
      if (msg.includes('sản phẩm') || msg.includes('product')) {
        toast.error('Không thể xóa danh mục đang có sản phẩm. Hãy xóa hoặc chuyển sản phẩm trước.');
      } else {
        toast.error(msg || 'Không thể xóa danh mục. Vui lòng thử lại.');
      }
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedCategory(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setSelectedCategory(category);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (category) => {
    setSelectedCategory(category);
    setDetailModalOpen(true);
  };

  const handleOpenDelete = (category) => {
    setSelectedCategory(category);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (selectedCategory) {
      await updateMutation.mutateAsync({
        id: selectedCategory.id,
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
            <TagIcon size={24} className="text-primary" />
            Quản lý Danh mục Hàng hóa
          </h1>
          <p className="page-subtitle">
            Tạo và phân loại danh mục sản phẩm, phục vụ công tác quản lý kho và danh mục hàng hóa.
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
              Thêm danh mục
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
              placeholder="Tìm kiếm danh mục theo tên, mô tả..."
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
            Tổng cộng: <strong>{categoriesList.length}</strong> danh mục
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="table-container">
        {isLoading ? (
          <LoadingState message="Đang tải danh sách danh mục hàng hóa..." minHeight="300px" />
        ) : isError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi khi tải danh mục">
              {error?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetch()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <EmptyState
            icon={TagIcon}
            title="Không tìm thấy danh mục"
            description={
              searchTerm
                ? `Không có danh mục nào khớp với từ khóa "${searchTerm}".`
                : 'Chưa có danh mục hàng hóa nào trong hệ thống.'
            }
            action={
              searchTerm ? (
                <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                  Xóa tìm kiếm
                </Button>
              ) : canCreate ? (
                <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={handleOpenCreate}>
                  Tạo danh mục đầu tiên
                </Button>
              ) : null
            }
          />
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '30%' }}>Tên danh mục</th>
                <th style={{ width: '55%' }}>Mô tả</th>
                <th style={{ width: '15%', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.map((cat) => (
                <tr key={cat.id}>
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
                        <TagIcon size={16} />
                      </div>
                      <span style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                        {cat.name}
                      </span>
                    </div>
                  </td>

                  <td>
                    <span style={{ color: cat.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)' }}>
                      {cat.description || '—'}
                    </span>
                  </td>

                  <td>
                    <div className="table-actions-cell">
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenDetail(cat)}
                        title="Xem chi tiết"
                      >
                        <EyeIcon size={14} />
                      </button>

                      {canUpdate && (
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenEdit(cat)}
                          title="Chỉnh sửa danh mục"
                        >
                          <EditIcon size={14} />
                        </button>
                      )}

                      {canDelete && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenDelete(cat)}
                          title="Xóa danh mục"
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
      <CategoryFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      {/* 2. Detail Modal */}
      <CategoryDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedCategory(null);
        }}
        category={selectedCategory}
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
          setSelectedCategory(null);
        }}
        onConfirm={() => deleteMutation.mutateAsync(selectedCategory?.id)}
        title={`Xác nhận xóa danh mục "${selectedCategory?.name}"?`}
        message="Hành động này sẽ xóa danh mục khỏi hệ thống. Lưu ý: Không thể xóa danh mục nếu đang có sản phẩm thuộc danh mục này."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
