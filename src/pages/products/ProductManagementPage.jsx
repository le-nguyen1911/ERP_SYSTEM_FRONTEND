import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productApi } from '../../api/productApi';
import { categoryApi } from '../../api/categoryApi';
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
  PackageIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
} from '../../components/ui/Icons';

// Sub-components
import { ProductFormModal } from './components/ProductFormModal';
import { ProductDetailModal } from './components/ProductDetailModal';
import { ProductPagination } from './components/ProductPagination';

export function ProductManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC Permission checks
  const canCreate = hasPermission(PERMISSIONS.PRODUCT_CREATE) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.PRODUCT_UPDATE) || isAdmin;
  const canDelete = hasPermission(PERMISSIONS.PRODUCT_DELETE) || isAdmin;

  // Pagination & Filtering state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'INACTIVE'

  // Modal active states
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false);
  const [activateConfirmOpen, setActivateConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // 1. Fetch Products Query (Spring Data Pageable)
  const {
    data: productsApiResponse,
    isLoading: isProductsLoading,
    isError: isProductsError,
    error: productsError,
    refetch: refetchProducts,
    isFetching: isProductsFetching,
  } = useQuery({
    queryKey: ['products', page, pageSize, searchTerm],
    queryFn: () => {
      if (searchTerm.trim()) {
        return productApi.searchProducts(searchTerm.trim(), {
          page,
          size: pageSize,
          sort: 'createdAt,desc',
        });
      }
      return productApi.getProducts({
        page,
        size: pageSize,
        sort: 'createdAt,desc',
      });
    },
  });

  // 2. Fetch Categories for Form & Filter
  const { data: categoriesApiResponse } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoryApi.getCategories(),
  });

  // 3. Fetch Units for Form
  const { data: unitsApiResponse } = useQuery({
    queryKey: ['units'],
    queryFn: () => unitApi.getUnits(),
  });

  const categoriesList = useMemo(() => categoriesApiResponse?.data || [], [categoriesApiResponse?.data]);
  const unitsList = useMemo(() => unitsApiResponse?.data || [], [unitsApiResponse?.data]);

  const pageData = productsApiResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const rawProducts = useMemo(() => pageData?.content || [], [pageData?.content]);

  // Client-side additional filter by category and status
  const displayedProducts = useMemo(() => {
    return rawProducts.filter((product) => {
      let matchCat = true;
      if (categoryFilter !== 'ALL') {
        matchCat = product.category?.id === categoryFilter;
      }

      let matchStatus = true;
      if (statusFilter === 'ACTIVE') {
        matchStatus = product.active === true;
      } else if (statusFilter === 'INACTIVE') {
        matchStatus = product.active === false;
      }

      return matchCat && matchStatus;
    });
  }, [rawProducts, categoryFilter, statusFilter]);

  // Derived stats from current view
  const activeCount = useMemo(() => rawProducts.filter((p) => p.active).length, [rawProducts]);
  const inactiveCount = useMemo(() => rawProducts.filter((p) => !p.active).length, [rawProducts]);

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => productApi.createProduct(data),
    onSuccess: () => {
      toast.success('Tạo sản phẩm mới thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormModalOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo sản phẩm');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => productApi.updateProduct(id, data),
    onSuccess: () => {
      toast.success('Cập nhật sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setFormModalOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật sản phẩm');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id) => productApi.deactivateProduct(id),
    onSuccess: () => {
      toast.success('Đã chuyển sản phẩm sang trạng thái ngừng kinh doanh');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setDeactivateConfirmOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      setDeactivateConfirmOpen(false);
      setSelectedProduct(null);
      toast.error(err.message || 'Không thể vô hiệu hóa sản phẩm');
    },
  });

  const activateMutation = useMutation({
    mutationFn: (id) => productApi.activateProduct(id),
    onSuccess: () => {
      toast.success('Đã kích hoạt lại sản phẩm thành công');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setActivateConfirmOpen(false);
      setSelectedProduct(null);
    },
    onError: (err) => {
      setActivateConfirmOpen(false);
      setSelectedProduct(null);
      toast.error(err.message || 'Không thể kích hoạt lại sản phẩm');
    },
  });

  // Handlers
  const handleOpenCreate = () => {
    setSelectedProduct(null);
    setFormModalOpen(true);
  };

  const handleOpenEdit = (prod) => {
    setSelectedProduct(prod);
    setFormModalOpen(true);
  };

  const handleOpenDetail = (prod) => {
    setSelectedProduct(prod);
    setDetailModalOpen(true);
  };

  const handleOpenDeactivate = (prod) => {
    setSelectedProduct(prod);
    setDeactivateConfirmOpen(true);
  };

  const handleOpenActivate = (prod) => {
    setSelectedProduct(prod);
    setActivateConfirmOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (selectedProduct) {
      await updateMutation.mutateAsync({
        id: selectedProduct.id,
        data: formData,
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price || 0);
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <PackageIcon size={26} className="text-primary" />
            Danh mục Sản phẩm
          </h1>
          <p className="page-subtitle">
            Quản lý mã hàng hóa, phân loại theo danh mục và đơn vị tính, thiết lập bảng giá niêm yết.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isProductsFetching ? 'spinner-inline' : ''} />}
            onClick={() => refetchProducts()}
            disabled={isProductsFetching}
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
              Thêm sản phẩm mới
            </Button>
          )}
        </div>
      </div>

      {/* Top Metrics Cards */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <PackageIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Tổng sản phẩm</span>
            <span className="stat-value">{totalElements}</span>
            <span className="stat-sub">Mã hàng trong hệ thống</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <CheckCircleIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Đang kinh doanh</span>
            <span className="stat-value">{activeCount}</span>
            <span className="stat-sub">Trên trang hiện tại</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
            <XCircleIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Ngừng kinh doanh</span>
            <span className="stat-value">{inactiveCount}</span>
            <span className="stat-sub">Tạm ngưng nhập/bán</span>
          </div>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="table-toolbar">
        <div className="table-toolbar-left" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="table-search-input" style={{ minWidth: 260 }}>
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm theo mã SKU, tên sản phẩm..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(0);
              }}
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

          {/* Category Filter */}
          <div style={{ minWidth: 180 }}>
            <select
              className="form-input"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              style={{ height: 38, fontSize: 13 }}
            >
              <option value="ALL">Tất cả danh mục</option>
              {categoriesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter buttons */}
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
              Tất cả
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
              Kinh doanh
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
              Ngừng bán
            </button>
          </div>
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Hiển thị: <strong>{displayedProducts.length}</strong> / {totalElements} sản phẩm
          </span>
        </div>
      </div>

      {/* Main Data Table */}
      <div className="table-container">
        {isProductsLoading ? (
          <LoadingState message="Đang tải danh mục sản phẩm..." minHeight="300px" />
        ) : isProductsError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải danh mục sản phẩm">
              {productsError?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetchProducts()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : displayedProducts.length === 0 ? (
          <EmptyState
            icon={PackageIcon}
            title="Không tìm thấy sản phẩm"
            description={
              searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL'
                ? 'Không có sản phẩm nào khớp với điều kiện tìm kiếm hoặc bộ lọc.'
                : 'Chưa có sản phẩm nào trong danh mục hàng hóa.'
            }
            action={
              searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('ALL');
                    setStatusFilter('ALL');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : canCreate ? (
                <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={handleOpenCreate}>
                  Tạo sản phẩm đầu tiên
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Mã SKU</th>
                  <th style={{ width: '30%' }}>Tên sản phẩm</th>
                  <th style={{ width: '16%' }}>Danh mục</th>
                  <th style={{ width: '10%' }}>Đơn vị tính</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Đơn giá niêm yết</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {displayedProducts.map((prod) => (
                  <tr key={prod.id}>
                    <td>
                      <span className="font-mono" style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 13 }}>
                        {prod.code}
                      </span>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 'var(--radius-sm)',
                            backgroundColor: prod.active ? 'var(--color-primary-light)' : '#f1f5f9',
                            color: prod.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <PackageIcon size={16} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                            {prod.name}
                          </div>
                          {!prod.active && (
                            <span style={{ fontSize: 11, color: 'var(--color-danger)', fontWeight: 600 }}>
                              (Ngừng kinh doanh)
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <TagIcon size={13} className="text-muted" />
                        <span>{prod.category?.name || '—'}</span>
                      </div>
                    </td>

                    <td>
                      <span style={{ fontSize: 13, color: 'var(--color-text-main)', fontWeight: 500 }}>
                        {prod.unit?.name || '—'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <span style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: 13 }}>
                        {formatVND(prod.price)}
                      </span>
                    </td>

                    <td>
                      <div className="table-actions-cell">
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => handleOpenDetail(prod)}
                          title="Xem chi tiết sản phẩm"
                        >
                          <EyeIcon size={14} />
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleOpenEdit(prod)}
                            title="Chỉnh sửa sản phẩm"
                          >
                            <EditIcon size={14} />
                          </button>
                        )}

                        {canDelete && prod.active && (
                          <button
                            type="button"
                            className="btn btn-outline-danger btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleOpenDeactivate(prod)}
                            title="Ngừng kinh doanh"
                          >
                            <TrashIcon size={14} />
                          </button>
                        )}

                        {canUpdate && !prod.active && (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                            onClick={() => handleOpenActivate(prod)}
                            title="Kích hoạt lại kinh doanh"
                          >
                            <CheckCircleIcon size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <ProductPagination
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

      {/* Modals */}
      <ProductFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        categories={categoriesList}
        units={unitsList}
        onSubmit={handleFormSubmit}
        isLoading={createMutation.isPending || updateMutation.isPending}
      />

      <ProductDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onEdit={handleOpenEdit}
        onDeactivate={handleOpenDeactivate}
        onActivate={handleOpenActivate}
        canUpdate={canUpdate}
        canDelete={canDelete}
      />

      <ConfirmModal
        isOpen={deactivateConfirmOpen}
        onClose={() => {
          setDeactivateConfirmOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={() => deactivateMutation.mutateAsync(selectedProduct?.id)}
        title={`Ngừng kinh doanh sản phẩm "${selectedProduct?.name}"?`}
        message="Hành động này sẽ vô hiệu hóa sản phẩm. Sản phẩm này sẽ không thể được thêm vào các đơn đặt hàng mới nhưng lịch sử giao dịch cũ vẫn được bảo lưu."
        confirmText="Xác nhận ngừng bán"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deactivateMutation.isPending}
      />

      <ConfirmModal
        isOpen={activateConfirmOpen}
        onClose={() => {
          setActivateConfirmOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={() => activateMutation.mutateAsync(selectedProduct?.id)}
        title={`Kích hoạt lại sản phẩm "${selectedProduct?.name}"?`}
        message="Sản phẩm sẽ được chuyển về trạng thái đang kinh doanh và có thể được thêm vào các đơn hàng mới."
        confirmText="Xác nhận kích hoạt"
        cancelText="Hủy bỏ"
        variant="primary"
        isLoading={activateMutation.isPending}
      />
    </div>
  );
}
