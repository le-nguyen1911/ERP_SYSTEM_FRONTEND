import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseOrderApi } from '../../api/purchaseOrderApi';
import { supplierApi } from '../../api/supplierApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmModal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  ShoppingCartIcon,
  PlusIcon,
  RefreshCwIcon,
  EyeIcon,
  EditIcon,
  TrashIcon,
  FilterIcon,
  ClipboardIcon,
  CalendarIcon,
  DollarSignIcon,
} from '../../components/ui/Icons';
import { PurchaseOrderFormModal } from './components/PurchaseOrderFormModal';
import { PurchaseOrderDetailModal } from './components/PurchaseOrderDetailModal';
import { PurchaseOrderPagination } from './components/PurchaseOrderPagination';

// ─── Status config ─────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT:             { label: 'Bản nháp',     bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  PENDING_APPROVAL:  { label: 'Chờ duyệt',    bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  APPROVED:          { label: 'Đã duyệt',     bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  SENT_TO_SUPPLIER:  { label: 'Đã gửi NCC',   bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  GOODS_RECEIVED:    { label: 'Đã nhận hàng', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  REJECTED:          { label: 'Bị từ chối',   bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  CANCELLED:         { label: 'Đã huỷ',       bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  CLOSED:            { label: 'Đã đóng',      bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

const ALL_STATUSES = Object.keys(STATUS_CONFIG);

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 9px', borderRadius: 20, fontSize: 11, fontWeight: 600,
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDate(val) { return val ? new Date(val).toLocaleDateString('vi-VN') : '—'; }
function formatCurrency(val, cur = 'VND') {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN', { style: 'currency', currency: cur });
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export function PurchaseOrderManagementPage() {
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();

  const canCreate  = hasPermission(PERMISSIONS.PURCHASE_CREATE);
  const canUpdate  = hasPermission(PERMISSIONS.PURCHASE_UPDATE);
  const canApprove = hasPermission(PERMISSIONS.PURCHASE_APPROVE);

  // ── Filters / Pagination ────────────────────────────────────────────────
  const [page, setPage]               = useState(0);
  const [size, setSize]               = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');

  // ── UI State ────────────────────────────────────────────────────────────
  const [createModal, setCreateModal]   = useState(false);
  const [editPO, setEditPO]             = useState(null);
  const [detailPO, setDetailPO]         = useState(null);
  const [deletePO, setDeletePO]         = useState(null);

  // ── Supplier list for filter dropdown ───────────────────────────────────
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.searchSuppliers({ keyword: '', page: 0, size: 200 }),
  });
  const suppliers = useMemo(() => suppliersData?.data?.content || [], [suppliersData]);

  // ── Determine if search is active ───────────────────────────────────────
  const hasFilters = statusFilter || supplierFilter || fromDate || toDate;

  const queryKey = useMemo(
    () => ['purchase-orders', { page, size, statusFilter, supplierFilter, fromDate, toDate }],
    [page, size, statusFilter, supplierFilter, fromDate, toDate]
  );

  // ── Data fetch ──────────────────────────────────────────────────────────
  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey,
    queryFn: () => {
      if (hasFilters) {
        return purchaseOrderApi.searchPurchaseOrders({
          supplierId: supplierFilter || undefined,
          status:     statusFilter || undefined,
          fromDate:   fromDate || undefined,
          toDate:     toDate || undefined,
          page, size,
          sort: 'createdAt,desc',
        });
      }
      return purchaseOrderApi.getPurchaseOrders({ page, size, sort: 'createdAt,desc' });
    },
  });

  const pageData      = data?.data;
  const orders        = useMemo(() => pageData?.content || [], [pageData]);
  const totalElements = pageData?.totalElements || 0;
  const totalPages    = pageData?.totalPages || 0;

  // ── KPI counts ──────────────────────────────────────────────────────────
  const draftCount   = useMemo(() => orders.filter((o) => o.status === 'DRAFT').length, [orders]);
  const pendingCount = useMemo(() => orders.filter((o) => o.status === 'PENDING_APPROVAL').length, [orders]);
  const approvedCount= useMemo(() => orders.filter((o) => o.status === 'APPROVED').length, [orders]);

  function invalidate() {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
  }

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: purchaseOrderApi.createPurchaseOrder,
    onSuccess: (res) => {
      toast.success(`Đã tạo đơn hàng ${res.data?.poNumber} thành công`);
      invalidate();
      setCreateModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể tạo đơn hàng'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data: d }) => purchaseOrderApi.updatePurchaseOrder(id, d),
    onSuccess: (res) => {
      toast.success('Cập nhật đơn hàng thành công');
      invalidate();
      // Refresh detail if open
      if (detailPO?.id === editPO?.id) {
        setDetailPO(res?.data);
      }
      setEditPO(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể cập nhật đơn hàng'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => purchaseOrderApi.deletePurchaseOrder(id),
    onSuccess: () => {
      toast.success('Đã xoá đơn hàng thành công');
      invalidate();
      setDeletePO(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể xoá đơn hàng. Chỉ được xoá đơn hàng ở trạng thái Bản nháp.'),
  });

  function handleEditClick(po) {
    setEditPO(po);
    setDetailPO(null);
  }

  function handleReset() {
    setStatusFilter('');
    setSupplierFilter('');
    setFromDate('');
    setToDate('');
    setPage(0);
  }

  return (
    <div style={{ padding: '24px', maxWidth: 1400, margin: '0 auto' }}>
      {/* ── Page header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg, #1e3a5f, #2563eb)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
              <ShoppingCartIcon size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: 'var(--color-text-primary)' }}>Đơn mua hàng (Purchase Order)</h1>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>Quản lý toàn bộ đơn đặt hàng nhà cung cấp</p>
            </div>
          </div>
        </div>
        {canCreate && (
          <Button variant="primary" onClick={() => setCreateModal(true)}>
            <PlusIcon size={16} /> Tạo đơn mua hàng
          </Button>
        )}
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 24 }}>
        <KpiCard label="Tổng đơn hàng" value={totalElements} icon={<ClipboardIcon size={20} />} color="#2563eb" />
        <KpiCard label="Bản nháp" value={draftCount} icon={<FilterIcon size={20} />} color="#64748b" />
        <KpiCard label="Chờ duyệt" value={pendingCount} icon={<CalendarIcon size={20} />} color="#d97706" />
        <KpiCard label="Đã duyệt" value={approvedCount} icon={<DollarSignIcon size={20} />} color="#059669" />
      </div>

      {/* ── Filters ──────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid var(--color-border)', padding: '14px 16px', marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
          {/* Status filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Trạng thái</label>
            <select
              className="form-input"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="">Tất cả trạng thái</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
              ))}
            </select>
          </div>

          {/* Supplier filter */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 200 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Nhà cung cấp</label>
            <select
              className="form-input"
              value={supplierFilter}
              onChange={(e) => { setSupplierFilter(e.target.value); setPage(0); }}
              style={{ height: 36, fontSize: 13 }}
            >
              <option value="">Tất cả nhà cung cấp</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>{s.supplierName}</option>
              ))}
            </select>
          </div>

          {/* Date range */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Từ ngày</label>
            <input
              className="form-input"
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(0); }}
              style={{ height: 36, fontSize: 13 }}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>Đến ngày</label>
            <input
              className="form-input"
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(0); }}
              style={{ height: 36, fontSize: 13 }}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-end' }}>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={handleReset}>
                Xoá lọc
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCwIcon size={14} /> Làm mới
            </Button>
          </div>
        </div>
      </div>

      {/* ── Table ────────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: '#fff', borderRadius: 12, border: '1px solid var(--color-border)', overflow: 'hidden' }}>
        {isLoading ? (
          <LoadingState message="Đang tải danh sách đơn mua hàng..." />
        ) : isError ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>Không thể tải dữ liệu. Vui lòng thử lại.</div>
        ) : orders.length === 0 ? (
          <EmptyState
            title="Chưa có đơn mua hàng"
            description={hasFilters ? 'Không có đơn hàng phù hợp với bộ lọc hiện tại.' : 'Tạo đơn mua hàng đầu tiên để bắt đầu.'}
            action={canCreate && !hasFilters ? { label: 'Tạo đơn mua hàng', onClick: () => setCreateModal(true) } : undefined}
          />
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                    {['Mã PO', 'Nhà cung cấp', 'Ngày tạo', 'Ngày giao', 'Tổng tiền', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, fontSize: 12, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.03em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orders.map((po) => (
                    <tr
                      key={po.id}
                      style={{ borderBottom: '1px solid #f1f5f9', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fafafa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                    >
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 700, color: '#1e3a5f' }}>{po.poNumber}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 500 }}>{po.supplierName || '—'}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(po.poDate || po.createdAt)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatDate(po.deliveryDate)}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 600 }}>
                        {formatCurrency(po.grandTotal, po.currency)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <StatusBadge status={po.status} />
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(canUpdate || canApprove) && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => setDetailPO(po)}
                              title="Xem chi tiết"
                            >
                              <EyeIcon size={13} />
                            </button>
                          )}
                          {po.status === 'DRAFT' && canUpdate && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleEditClick(po)}
                              title="Chỉnh sửa"
                            >
                              <EditIcon size={13} />
                            </button>
                          )}
                          {po.status === 'DRAFT' && canUpdate && (
                            <button
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fca5a5' }}
                              onClick={() => setDeletePO(po)}
                              title="Xoá đơn nháp"
                            >
                              <TrashIcon size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <PurchaseOrderPagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={size}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setSize(s); setPage(0); }}
            />
          </>
        )}
      </div>

      {/* ── Modals ───────────────────────────────────────────────────── */}
      <PurchaseOrderFormModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      <PurchaseOrderFormModal
        isOpen={Boolean(editPO)}
        onClose={() => setEditPO(null)}
        poToEdit={editPO}
        onSubmit={(data) => updateMutation.mutate({ id: editPO.id, data })}
        isLoading={updateMutation.isPending}
      />

      {detailPO && (
        <PurchaseOrderDetailModal
          isOpen={Boolean(detailPO)}
          onClose={() => setDetailPO(null)}
          po={detailPO}
          onEdit={handleEditClick}
        />
      )}

      <ConfirmModal
        isOpen={Boolean(deletePO)}
        onClose={() => setDeletePO(null)}
        onConfirm={() => deleteMutation.mutate(deletePO?.id)}
        title="Xoá đơn mua hàng"
        message={`Bạn có chắc chắn muốn xoá đơn hàng "${deletePO?.poNumber}"? Chỉ đơn hàng ở trạng thái Bản nháp mới có thể xoá.`}
        confirmLabel="Xoá"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div style={{
      backgroundColor: '#fff',
      border: '1px solid var(--color-border)',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}
