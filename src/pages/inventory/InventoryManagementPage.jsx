import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { stockApi } from '../../api/stockApi';
import { productApi } from '../../api/productApi';
import { warehouseApi } from '../../api/warehouseApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI Components
import { Button } from '../../components/ui/Button';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  WarehouseIcon,
  PackageIcon,
  AlertTriangleIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  ArrowRightLeftIcon,
  HistoryIcon,
  SlidersIcon,
  RefreshCwIcon,
  CheckCircleIcon,
  LayersIcon,
} from '../../components/ui/Icons';

// Sub-components
import { StockTransactionModal } from './components/StockTransactionModal';
import { StockTransferModal } from './components/StockTransferModal';
import { StockHistoryModal } from './components/StockHistoryModal';
import { UpdateMinQuantityModal } from './components/UpdateMinQuantityModal';

// ─── View mode tabs ──────────────────────────────────────────────────
const VIEWS = {
  WAREHOUSE: 'WAREHOUSE',
  PRODUCT: 'PRODUCT',
  LOW_STOCK: 'LOW_STOCK',
};

function StockStatusBadge({ lowStock, quantity, minQuantity }) {
  if (lowStock || quantity <= minQuantity) {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--color-danger-light)',
          color: 'var(--color-danger)',
          fontSize: 11,
          fontWeight: 700,
        }}
      >
        <AlertTriangleIcon size={11} /> Tồn thấp
      </span>
    );
  }
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--color-success-light)',
        color: 'var(--color-success)',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <CheckCircleIcon size={11} /> Đủ hàng
    </span>
  );
}

// ─── Stock table shared between warehouse/product views ────────────────
function StockTable({ stocks, canUpdate, canImport, canExport, canTransfer, onImport, onExport, onTransfer, onHistory, onMinQty }) {
  if (stocks.length === 0) {
    return (
      <EmptyState
        icon={PackageIcon}
        title="Không có dữ liệu tồn kho"
        description="Chưa có giao dịch nhập kho nào cho bộ lọc đã chọn."
      />
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th>Kho</th>
            <th style={{ textAlign: 'right' }}>Tồn kho</th>
            <th style={{ textAlign: 'right' }}>Tối thiểu</th>
            <th>Trạng thái</th>
            <th style={{ textAlign: 'right' }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((s) => (
            <tr key={s.id} style={{ backgroundColor: (s.lowStock || s.quantity <= s.minQuantity) ? 'rgba(239,68,68,0.03)' : undefined }}>
              <td>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: 13 }}>
                  {s.product?.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                  {s.product?.code}
                </div>
              </td>
              <td>
                <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                  {s.warehouse?.name}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: 16,
                    color: (s.lowStock || s.quantity <= s.minQuantity) ? 'var(--color-danger)' : 'var(--color-text-main)',
                  }}
                >
                  {s.quantity}
                </span>
              </td>
              <td style={{ textAlign: 'right', color: 'var(--color-text-secondary)', fontSize: 13 }}>
                {s.minQuantity}
              </td>
              <td>
                <StockStatusBadge lowStock={s.lowStock} quantity={s.quantity} minQuantity={s.minQuantity} />
              </td>
              <td>
                <div className="table-actions-cell">
                  {canImport && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px', color: 'var(--color-success)', borderColor: 'var(--color-success)' }}
                      title="Nhập kho"
                      onClick={() => onImport(s)}
                    >
                      <ArrowDownIcon size={13} />
                    </button>
                  )}
                  {canExport && (
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      style={{ padding: '4px 8px' }}
                      title="Xuất kho"
                      onClick={() => onExport(s)}
                    >
                      <ArrowUpIcon size={13} />
                    </button>
                  )}
                  {canTransfer && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px' }}
                      title="Điều chuyển"
                      onClick={() => onTransfer(s)}
                    >
                      <ArrowRightLeftIcon size={13} />
                    </button>
                  )}
                  {canUpdate && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      style={{ padding: '4px 8px' }}
                      title="Cập nhật mức tối thiểu"
                      onClick={() => onMinQty(s)}
                    >
                      <SlidersIcon size={13} />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    style={{ padding: '4px 8px' }}
                    title="Lịch sử giao dịch"
                    onClick={() => onHistory(s)}
                  >
                    <HistoryIcon size={13} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────
export function InventoryManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC
  const canView = hasPermission(PERMISSIONS.STOCK_VIEW) || isAdmin;
  const canImport = hasPermission(PERMISSIONS.STOCK_IMPORT) || isAdmin;
  const canExport = hasPermission(PERMISSIONS.STOCK_EXPORT) || isAdmin;
  const canTransfer = hasPermission(PERMISSIONS.STOCK_TRANSFER) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.STOCK_UPDATE) || isAdmin;

  // View state
  const [activeView, setActiveView] = useState(VIEWS.WAREHOUSE);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // Modal states
  const [transactionModal, setTransactionModal] = useState({ open: false, type: 'IMPORT', stockRecord: null });
  const [transferModal, setTransferModal] = useState({ open: false, stockRecord: null });
  const [historyModal, setHistoryModal] = useState({ open: false, stockRecord: null });
  const [minQtyModal, setMinQtyModal] = useState({ open: false, stockRecord: null });

  // ── Data queries ──────────────────────────────────────────────────

  const { data: warehousesRes, isLoading: loadingWarehouses } = useQuery({
    queryKey: ['warehouses'],
    queryFn: () => warehouseApi.getWarehouses(),
  });

  const { data: productsRes, isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => productApi.getProducts({ page: 0, size: 200, sort: 'name,asc' }),
  });

  const {
    data: warehouseStockRes,
    isLoading: loadingWarehouseStock,
    isError: errorWarehouseStock,
    refetch: refetchWarehouseStock,
    isFetching: fetchingWarehouseStock,
  } = useQuery({
    queryKey: ['stock', 'warehouse', selectedWarehouseId],
    queryFn: () => stockApi.getStockByWarehouse(selectedWarehouseId),
    enabled: activeView === VIEWS.WAREHOUSE && !!selectedWarehouseId,
  });

  const {
    data: productStockRes,
    isLoading: loadingProductStock,
    isError: errorProductStock,
    refetch: refetchProductStock,
    isFetching: fetchingProductStock,
  } = useQuery({
    queryKey: ['stock', 'product', selectedProductId],
    queryFn: () => stockApi.getStockByProduct(selectedProductId),
    enabled: activeView === VIEWS.PRODUCT && !!selectedProductId,
  });

  const {
    data: lowStockRes,
    isLoading: loadingLowStock,
    isError: errorLowStock,
    refetch: refetchLowStock,
    isFetching: fetchingLowStock,
  } = useQuery({
    queryKey: ['stock', 'low-stock'],
    queryFn: () => stockApi.getLowStock(),
    enabled: activeView === VIEWS.LOW_STOCK || canView,
  });

  // ── Derived data ─────────────────────────────────────────────────

  const warehouses = useMemo(() => warehousesRes?.data || [], [warehousesRes]);
  const products = useMemo(() => {
    const content = productsRes?.data?.content || productsRes?.data || [];
    return Array.isArray(content) ? content : [];
  }, [productsRes]);

  const warehouseStocks = useMemo(() => warehouseStockRes?.data || [], [warehouseStockRes]);
  const productStocks = useMemo(() => productStockRes?.data || [], [productStockRes]);
  const lowStocks = useMemo(() => lowStockRes?.data || [], [lowStockRes]);

  // Summary stats
  const totalLowStock = lowStocks.length;
  const totalWarehouseItems = activeView === VIEWS.WAREHOUSE ? warehouseStocks.length : 0;

  // ── Mutations ─────────────────────────────────────────────────────

  const invalidateStock = () => {
    queryClient.invalidateQueries({ queryKey: ['stock'] });
  };

  const transactionMutation = useMutation({
    mutationFn: (data) => stockApi.processTransaction(data),
    onSuccess: (_, vars) => {
      const label = vars.type === 'IMPORT' ? 'Nhập kho' : 'Xuất kho';
      toast.success(`${label} thành công`);
      setTransactionModal({ open: false, type: 'IMPORT', stockRecord: null });
      invalidateStock();
    },
    onError: (err) => {
      toast.error(err.message || 'Giao dịch thất bại');
    },
  });

  const transferMutation = useMutation({
    mutationFn: (data) => stockApi.transferStock(data),
    onSuccess: () => {
      toast.success('Điều chuyển kho thành công');
      setTransferModal({ open: false, stockRecord: null });
      invalidateStock();
    },
    onError: (err) => {
      toast.error(err.message || 'Điều chuyển thất bại');
    },
  });

  const minQtyMutation = useMutation({
    mutationFn: (data) => stockApi.updateMinQuantity(data),
    onSuccess: () => {
      toast.success('Cập nhật mức tối thiểu thành công');
      setMinQtyModal({ open: false, stockRecord: null });
      invalidateStock();
    },
    onError: (err) => {
      toast.error(err.message || 'Cập nhật thất bại');
    },
  });

  // ── Handlers ──────────────────────────────────────────────────────

  const handleImport = (stockRecord) => setTransactionModal({ open: true, type: 'IMPORT', stockRecord });
  const handleExport = (stockRecord) => setTransactionModal({ open: true, type: 'EXPORT', stockRecord });
  const handleTransfer = (stockRecord) => setTransferModal({ open: true, stockRecord });
  const handleHistory = (stockRecord) => setHistoryModal({ open: true, stockRecord });
  const handleMinQty = (stockRecord) => setMinQtyModal({ open: true, stockRecord });

  const openImportBlank = () => setTransactionModal({ open: true, type: 'IMPORT', stockRecord: null });
  const openExportBlank = () => setTransactionModal({ open: true, type: 'EXPORT', stockRecord: null });
  const openTransferBlank = () => setTransferModal({ open: true, stockRecord: null });

  const refetchCurrentView = () => {
    if (activeView === VIEWS.WAREHOUSE && selectedWarehouseId) refetchWarehouseStock();
    else if (activeView === VIEWS.PRODUCT && selectedProductId) refetchProductStock();
    else if (activeView === VIEWS.LOW_STOCK) refetchLowStock();
  };

  // ── Determine current stock list and loading state ────────────────

  const currentStocks = useMemo(() => {
    if (activeView === VIEWS.WAREHOUSE) return warehouseStocks;
    if (activeView === VIEWS.PRODUCT) return productStocks;
    return lowStocks;
  }, [activeView, warehouseStocks, productStocks, lowStocks]);

  const isCurrentLoading =
    activeView === VIEWS.WAREHOUSE
      ? loadingWarehouseStock
      : activeView === VIEWS.PRODUCT
      ? loadingProductStock
      : loadingLowStock;

  const isCurrentFetching =
    activeView === VIEWS.WAREHOUSE
      ? fetchingWarehouseStock
      : activeView === VIEWS.PRODUCT
      ? fetchingProductStock
      : fetchingLowStock;

  const isCurrentError =
    activeView === VIEWS.WAREHOUSE
      ? errorWarehouseStock
      : activeView === VIEWS.PRODUCT
      ? errorProductStock
      : errorLowStock;

  const needsSelection =
    (activeView === VIEWS.WAREHOUSE && !selectedWarehouseId) ||
    (activeView === VIEWS.PRODUCT && !selectedProductId);

  // ── Tab style helper ──────────────────────────────────────────────

  const tabStyle = (view) => ({
    padding: '8px 18px',
    fontSize: 13,
    fontWeight: 600,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: 'pointer',
    backgroundColor: activeView === view ? 'var(--color-primary)' : 'transparent',
    color: activeView === view ? '#fff' : 'var(--color-text-secondary)',
    transition: 'all 0.15s',
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  });

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <LayersIcon size={26} className="text-primary" />
            Quản lý Tồn kho & Điều chuyển
          </h1>
          <p className="page-subtitle">
            Theo dõi số lượng tồn theo kho vật lý, cảnh báo tồn thấp, điều chuyển giữa kho và lịch sử giao dịch.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isCurrentFetching ? 'spinner-inline' : ''} />}
            onClick={refetchCurrentView}
            disabled={isCurrentFetching || needsSelection}
            title="Làm mới"
          >
            Làm mới
          </Button>
          {canImport && (
            <Button variant="primary" icon={<ArrowDownIcon size={15} />} onClick={openImportBlank}>
              Nhập kho
            </Button>
          )}
          {canExport && (
            <Button variant="outline" icon={<ArrowUpIcon size={15} />} onClick={openExportBlank}
              style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger)' }}>
              Xuất kho
            </Button>
          )}
          {canTransfer && (
            <Button variant="outline" icon={<ArrowRightLeftIcon size={15} />} onClick={openTransferBlank}>
              Điều chuyển
            </Button>
          )}
        </div>
      </div>

      {/* Summary stat cards */}
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', marginBottom: 20 }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-primary-light)', color: 'var(--color-primary)' }}>
            <WarehouseIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Kho đang hoạt động</span>
            <span className="stat-value">{warehouses.filter(w => w.active).length}</span>
            <span className="stat-sub">Kho vật lý</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-success-light)', color: 'var(--color-success)' }}>
            <PackageIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Sản phẩm đang KD</span>
            <span className="stat-value">{products.filter(p => p.active).length}</span>
            <span className="stat-sub">Đang kinh doanh</span>
          </div>
        </div>

        <div
          className="stat-card"
          style={{ cursor: 'pointer' }}
          onClick={() => setActiveView(VIEWS.LOW_STOCK)}
          title="Xem sản phẩm tồn thấp"
        >
          <div className="stat-icon" style={{ backgroundColor: 'var(--color-danger-light)', color: 'var(--color-danger)' }}>
            <AlertTriangleIcon size={22} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Cảnh báo tồn thấp</span>
            <span className="stat-value" style={{ color: totalLowStock > 0 ? 'var(--color-danger)' : undefined }}>
              {loadingLowStock ? '...' : totalLowStock}
            </span>
            <span className="stat-sub">Cần nhập hàng</span>
          </div>
        </div>

        {activeView === VIEWS.WAREHOUSE && selectedWarehouseId && (
          <div className="stat-card">
            <div className="stat-icon" style={{ backgroundColor: '#f0f9ff', color: '#0284c7' }}>
              <LayersIcon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-label">Mã hàng trong kho</span>
              <span className="stat-value">{totalWarehouseItems}</span>
              <span className="stat-sub">Dòng tồn kho</span>
            </div>
          </div>
        )}
      </div>

      {/* Low stock alert banner */}
      {totalLowStock > 0 && activeView !== VIEWS.LOW_STOCK && !loadingLowStock && (
        <Alert
          variant="warning"
          title={`⚠️ ${totalLowStock} sản phẩm có tồn kho thấp hơn mức tối thiểu`}
          style={{ marginBottom: 16 }}
        >
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'inherit',
              fontWeight: 600,
              textDecoration: 'underline',
              padding: 0,
              fontSize: 13,
            }}
            onClick={() => setActiveView(VIEWS.LOW_STOCK)}
          >
            Xem danh sách cảnh báo →
          </button>
        </Alert>
      )}

      {/* View tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          backgroundColor: '#f1f5f9',
          padding: 4,
          borderRadius: 'var(--radius-md)',
          marginBottom: 16,
          width: 'fit-content',
        }}
      >
        <button type="button" style={tabStyle(VIEWS.WAREHOUSE)} onClick={() => setActiveView(VIEWS.WAREHOUSE)}>
          <WarehouseIcon size={14} /> Theo kho
        </button>
        <button type="button" style={tabStyle(VIEWS.PRODUCT)} onClick={() => setActiveView(VIEWS.PRODUCT)}>
          <PackageIcon size={14} /> Theo sản phẩm
        </button>
        <button type="button" style={tabStyle(VIEWS.LOW_STOCK)} onClick={() => setActiveView(VIEWS.LOW_STOCK)}>
          <AlertTriangleIcon size={14} />
          Tồn thấp
          {totalLowStock > 0 && (
            <span
              style={{
                backgroundColor: 'var(--color-danger)',
                color: '#fff',
                borderRadius: 'var(--radius-full)',
                padding: '0 6px',
                fontSize: 10,
                fontWeight: 700,
                marginLeft: 2,
              }}
            >
              {totalLowStock}
            </span>
          )}
        </button>
      </div>

      {/* Selector row */}
      {activeView === VIEWS.WAREHOUSE && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 280 }}>
            <select
              className="form-input"
              value={selectedWarehouseId}
              onChange={(e) => setSelectedWarehouseId(e.target.value)}
              style={{ height: 40, fontSize: 13 }}
              disabled={loadingWarehouses}
            >
              <option value="">-- Chọn kho để xem tồn kho --</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}{!w.active ? ' (Không hoạt động)' : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedWarehouseId && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {warehouseStocks.length} dòng tồn kho
            </span>
          )}
        </div>
      )}

      {activeView === VIEWS.PRODUCT && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ minWidth: 320 }}>
            <select
              className="form-input"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              style={{ height: 40, fontSize: 13 }}
              disabled={loadingProducts}
            >
              <option value="">-- Chọn sản phẩm để xem tồn kho --</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.code}){!p.active ? ' [Ngừng KD]' : ''}
                </option>
              ))}
            </select>
          </div>
          {selectedProductId && (
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              {productStocks.length} kho chứa sản phẩm này
            </span>
          )}
        </div>
      )}

      {/* Main content */}
      <div className="table-container" style={{ minHeight: 200 }}>
        {needsSelection ? (
          <div
            style={{
              padding: 48,
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: 14,
            }}
          >
            {activeView === VIEWS.WAREHOUSE ? (
              <>
                <WarehouseIcon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>Vui lòng chọn kho để xem tồn kho</div>
              </>
            ) : (
              <>
                <PackageIcon size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
                <div>Vui lòng chọn sản phẩm để xem tồn kho theo kho</div>
              </>
            )}
          </div>
        ) : isCurrentLoading ? (
          <LoadingState message="Đang tải dữ liệu tồn kho..." minHeight="200px" />
        ) : isCurrentError ? (
          <div style={{ padding: 24 }}>
            <Alert variant="danger" title="Lỗi tải dữ liệu tồn kho">
              Không thể kết nối máy chủ. Vui lòng thử lại.
            </Alert>
          </div>
        ) : (
          <StockTable
            stocks={currentStocks}
            canImport={canImport}
            canExport={canExport}
            canTransfer={canTransfer}
            canUpdate={canUpdate}
            onImport={handleImport}
            onExport={handleExport}
            onTransfer={handleTransfer}
            onHistory={handleHistory}
            onMinQty={handleMinQty}
          />
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}

      <StockTransactionModal
        isOpen={transactionModal.open}
        onClose={() => setTransactionModal({ open: false, type: 'IMPORT', stockRecord: null })}
        onSubmit={(data) => transactionMutation.mutate(data)}
        isLoading={transactionMutation.isPending}
        products={products}
        warehouses={warehouses}
        defaultType={transactionModal.type}
        defaultProductId={transactionModal.stockRecord?.product?.id}
        defaultWarehouseId={transactionModal.stockRecord?.warehouse?.id}
        canImport={canImport}
        canExport={canExport}
      />

      <StockTransferModal
        isOpen={transferModal.open}
        onClose={() => setTransferModal({ open: false, stockRecord: null })}
        onSubmit={(data) => transferMutation.mutate(data)}
        isLoading={transferMutation.isPending}
        products={products}
        warehouses={warehouses}
        defaultProductId={transferModal.stockRecord?.product?.id}
        defaultFromWarehouseId={transferModal.stockRecord?.warehouse?.id}
      />

      <UpdateMinQuantityModal
        isOpen={minQtyModal.open}
        onClose={() => setMinQtyModal({ open: false, stockRecord: null })}
        onSubmit={(data) => minQtyMutation.mutate(data)}
        isLoading={minQtyMutation.isPending}
        stockRecord={minQtyModal.stockRecord}
      />

      <StockHistoryModal
        isOpen={historyModal.open}
        onClose={() => setHistoryModal({ open: false, stockRecord: null })}
        stockRecord={historyModal.stockRecord}
      />
    </div>
  );
}
