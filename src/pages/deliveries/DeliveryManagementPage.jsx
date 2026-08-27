import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { deliveryApi } from '../../api/deliveryApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { ConfirmModal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import {
  TruckIcon,
  PlusIcon,
  RefreshCwIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  ClipboardIcon,
  SearchIcon,
} from '../../components/ui/Icons';

import { DeliveryFormModal } from './components/DeliveryFormModal';
import { DeliveryDetailModal } from './components/DeliveryDetailModal';
import { DeliveryPagination } from './components/DeliveryPagination';
import { DeliveryStatusBadge, InventoryExportBadge } from './components/DeliveryStatusBadge';
import { DeliveryActionModal } from './components/DeliveryActionModal';

function fmtDt(val) {
  return val ? new Date(val).toLocaleString('vi-VN') : '—';
}

const DELIVERY_STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'DRAFT', label: 'Bản nháp / Chờ xuất' },
  { value: 'EXPORTED', label: 'Đã xuất kho' },
  { value: 'DELIVERED', label: 'Đã giao hàng' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
];

export function DeliveryManagementPage() {
  const { hasPermission, isAdmin } = usePermission();
  const queryClient = useQueryClient();

  const canView = hasPermission(PERMISSIONS.DELIVERY_VIEW) || isAdmin;
  const canCreate = hasPermission(PERMISSIONS.DELIVERY_CREATE) || isAdmin;
  const canExport = hasPermission(PERMISSIONS.DELIVERY_EXPORT) || isAdmin;

  // Pagination & Filtering
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [detailDelivery, setDetailDelivery] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [cancelModalDelivery, setCancelModalDelivery] = useState(null);
  const [confirmMarkDelivered, setConfirmMarkDelivered] = useState(null);
  const [confirmRetryExport, setConfirmRetryExport] = useState(null);

  // Queries
  const { data: deliveryApiResponse, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['deliveries', page, pageSize],
    queryFn: () => deliveryApi.getDeliveries({ page, size: pageSize }),
    enabled: canView,
  });

  const pageData = deliveryApiResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const rawList = useMemo(() => pageData?.content || [], [pageData?.content]);

  // Client-side filtering by status & search keyword
  const filteredList = useMemo(() => {
    return rawList.filter((d) => {
      let matchStatus = true;
      if (statusFilter !== 'ALL') {
        matchStatus = d.status === statusFilter;
      }
      let matchSearch = true;
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        matchSearch =
          (d.deliveryNumber && d.deliveryNumber.toLowerCase().includes(term)) ||
          (d.soNumber && d.soNumber.toLowerCase().includes(term)) ||
          (d.customerName && d.customerName.toLowerCase().includes(term));
      }
      return matchStatus && matchSearch;
    });
  }, [rawList, statusFilter, searchTerm]);

  // KPI Calculations
  const kpiCounts = useMemo(() => {
    const counts = { ALL: totalElements, EXPORTED: 0, DELIVERED: 0, FAILED: 0, CANCELLED: 0 };
    rawList.forEach((d) => {
      if (d.status === 'EXPORTED') counts.EXPORTED++;
      if (d.status === 'DELIVERED') counts.DELIVERED++;
      if (d.inventoryExportStatus === 'FAILED') counts.FAILED++;
      if (d.status === 'CANCELLED') counts.CANCELLED++;
    });
    return counts;
  }, [rawList, totalElements]);

  // Mutations
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['deliveries'] });
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
  };

  const createMutation = useMutation({
    mutationFn: (data) => deliveryApi.createDelivery(data),
    onSuccess: (res) => {
      invalidateAll();
      setCreateModalOpen(false);
      const delivery = res.data;
      if (delivery?.inventoryExportStatus === 'FAILED') {
        toast.error('Tạo phiếu giao hàng thành công nhưng lỗi xuất kho tự động: ' + (delivery.inventoryErrorMessage || ''));
      } else {
        toast.success('Tạo phiếu giao hàng và xuất kho thành công');
      }
    },
    onError: (err) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Lỗi khi tạo phiếu giao hàng';
      toast.error(msg);
    },
  });

  const markDeliveredMutation = useMutation({
    mutationFn: (id) => deliveryApi.markAsDelivered(id),
    onSuccess: (res) => {
      invalidateAll();
      toast.success('Đã xác nhận giao hàng thành công');
      setConfirmMarkDelivered(null);
      if (detailDelivery && detailDelivery.id === res.data?.id) {
        setDetailDelivery(res.data);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi xác nhận giao hàng');
      setConfirmMarkDelivered(null);
    },
  });

  const retryExportMutation = useMutation({
    mutationFn: (id) => deliveryApi.retryInventoryExport(id),
    onSuccess: (res) => {
      invalidateAll();
      setConfirmRetryExport(null);
      const delivery = res.data;
      if (delivery?.inventoryExportStatus === 'SUCCESS') {
        toast.success('Thử lại xuất kho thành công');
      } else {
        toast.error('Xuất kho vẫn thất bại: ' + (delivery.inventoryErrorMessage || ''));
      }
      if (detailDelivery && detailDelivery.id === delivery?.id) {
        setDetailDelivery(delivery);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi thử lại xuất kho');
      setConfirmRetryExport(null);
    },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => deliveryApi.cancelDelivery(id, reason),
    onSuccess: () => {
      invalidateAll();
      toast.success('Đã huỷ phiếu giao hàng');
      setCancelModalDelivery(null);
      if (detailDelivery) {
        setDetailDelivery(null);
      }
    },
    onError: (err) => {
      toast.error(err?.response?.data?.message || 'Lỗi khi huỷ phiếu');
    },
  });

  // Open detail handler
  const handleViewDetail = async (delivery) => {
    setDetailLoading(true);
    try {
      const res = await deliveryApi.getDeliveryById(delivery.id);
      setDetailDelivery(res.data);
    } catch {
      toast.error('Không thể tải chi tiết phiếu giao hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TruckIcon size={26} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Giao Hàng (Outbound Delivery)</h1>
            <p style={{ margin: '3px 0 0', fontSize: 14, color: '#64748b' }}>
              Quản lý phiếu xuất giao hàng và tự động xuất kho theo đơn bán hàng
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCwIcon size={14} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Làm mới
          </Button>
          {canCreate && (
            <button
              onClick={() => setCreateModalOpen(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px',
                background: 'linear-gradient(135deg,#0284c7,#0369a1)', color: '#fff',
                border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              <PlusIcon size={16} /> Tạo phiếu giao hàng
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng phiếu giao', value: kpiCounts.ALL, icon: ClipboardIcon, color: '#0284c7' },
          { label: 'Đã xuất kho', value: kpiCounts.EXPORTED, icon: TruckIcon, color: '#2563eb' },
          { label: 'Đã giao hàng', value: kpiCounts.DELIVERED, icon: CheckCircleIcon, color: '#16a34a' },
          { label: 'Lỗi xuất kho', value: kpiCounts.FAILED, icon: AlertTriangleIcon, color: '#dc2626' },
          { label: 'Đã huỷ', value: kpiCounts.CANCELLED, icon: XCircleIcon, color: '#94a3b8' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} style={{ color }} />
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#1e293b' }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f1f5f9', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 260px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>TÌM KIẾM</label>
            <div style={{ position: 'relative' }}>
              <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Mã phiếu, số đơn SO, khách hàng..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>TRẠNG THÁI</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}
            >
              {DELIVERY_STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          {(statusFilter !== 'ALL' || searchTerm) && (
            <button
              onClick={() => { setStatusFilter('ALL'); setSearchTerm(''); }}
              style={{
                padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
                background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#64748b',
                display: 'flex', alignItems: 'center', gap: 6,
              }}
            >
              <XCircleIcon size={14} /> Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Delivery Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48 }}><LoadingState message="Đang tải danh sách phiếu giao hàng..." /></div>
        ) : isError ? (
          <div style={{ padding: 48 }}><EmptyState title="Lỗi tải dữ liệu" description={error?.message} /></div>
        ) : filteredList.length === 0 ? (
          <div style={{ padding: 48 }}>
            <EmptyState
              icon={TruckIcon}
              title="Chưa có phiếu giao hàng"
              description="Tạo phiếu giao hàng đầu tiên từ đơn bán hàng đã xác nhận."
            />
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['Mã phiếu giao', 'Số đơn SO', 'Khách hàng', 'Ngày giao', 'Xuất kho', 'Trạng thái', 'Hành động'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                          color: '#64748b', fontSize: 11, textTransform: 'uppercase',
                          letterSpacing: '0.05em', whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((d, i) => (
                    <tr
                      key={d.id}
                      style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}
                    >
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#0284c7' }}>
                          {d.deliveryNumber}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#6366f1' }}>
                          {d.soNumber}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b' }}>
                        {d.customerName || '—'}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>
                        {fmtDt(d.deliveryDate)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <InventoryExportBadge status={d.inventoryExportStatus} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <DeliveryStatusBadge status={d.status} />
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {/* View Detail */}
                          <button
                            onClick={() => handleViewDetail(d)}
                            title="Xem chi tiết"
                            style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#64748b' }}
                          >
                            <EyeIcon size={13} />
                          </button>

                          {/* Retry Inventory Export */}
                          {canExport && d.inventoryExportStatus === 'FAILED' && (
                            <button
                              onClick={() => setConfirmRetryExport(d)}
                              title="Thử lại xuất kho"
                              style={{ padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', color: '#dc2626' }}
                            >
                              <RefreshCwIcon size={13} />
                            </button>
                          )}

                          {/* Mark as Delivered (EXPORTED only) */}
                          {canCreate && d.status === 'EXPORTED' && (
                            <button
                              onClick={() => setConfirmMarkDelivered(d)}
                              title="Xác nhận đã giao hàng"
                              style={{ padding: '5px 8px', border: '1px solid #a7f3d0', borderRadius: 6, background: '#ecfdf5', cursor: 'pointer', color: '#059669' }}
                            >
                              <CheckCircleIcon size={13} />
                            </button>
                          )}

                          {/* Cancel (DRAFT only) */}
                          {canCreate && d.status === 'DRAFT' && (
                            <button
                              onClick={() => setCancelModalDelivery(d)}
                              title="Huỷ phiếu"
                              style={{ padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', color: '#b91c1c' }}
                            >
                              <XCircleIcon size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
              <DeliveryPagination
                page={page}
                totalPages={totalPages}
                totalElements={totalElements}
                pageSize={pageSize}
                onPageChange={setPage}
                onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Create Delivery Modal */}
      <DeliveryFormModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        isLoading={createMutation.isPending}
        onSubmit={(data) => createMutation.mutate(data)}
      />

      {/* Detail Modal */}
      {detailDelivery && (
        <DeliveryDetailModal
          delivery={detailDelivery}
          onClose={() => setDetailDelivery(null)}
          canCreate={canCreate}
          canExport={canExport}
          onMarkDelivered={(d) => {
            setConfirmMarkDelivered(d);
          }}
          onRetryExport={(d) => {
            setConfirmRetryExport(d);
          }}
          onCancel={(d) => {
            setCancelModalDelivery(d);
          }}
        />
      )}

      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 32px', fontSize: 14, color: '#64748b' }}>
            Đang tải chi tiết...
          </div>
        </div>
      )}

      {/* Cancel Action Modal (reason input) */}
      {cancelModalDelivery && (
        <DeliveryActionModal
          isOpen={Boolean(cancelModalDelivery)}
          onClose={() => setCancelModalDelivery(null)}
          title="Huỷ phiếu giao hàng"
          description={`Bạn có chắc muốn huỷ phiếu "${cancelModalDelivery.deliveryNumber}"? Vui lòng nhập lý do huỷ.`}
          confirmLabel="Huỷ phiếu"
          isLoading={cancelMutation.isPending}
          onConfirm={(reason) => cancelMutation.mutate({ id: cancelModalDelivery.id, reason })}
        />
      )}

      {/* Confirm Mark as Delivered Modal */}
      {confirmMarkDelivered && (
        <ConfirmModal
          isOpen={Boolean(confirmMarkDelivered)}
          title="Xác nhận đã giao hàng?"
          message={`Xác nhận đơn vị vận chuyển đã giao hàng thành công phiếu "${confirmMarkDelivered.deliveryNumber}" tới khách hàng.`}
          confirmLabel="Xác nhận giao hàng"
          onConfirm={() => markDeliveredMutation.mutate(confirmMarkDelivered.id)}
          onCancel={() => setConfirmMarkDelivered(null)}
          isLoading={markDeliveredMutation.isPending}
        />
      )}

      {/* Confirm Retry Inventory Export */}
      {confirmRetryExport && (
        <ConfirmModal
          isOpen={Boolean(confirmRetryExport)}
          title="Thử lại xuất kho tự động?"
          message={`Hệ thống sẽ thực hiện lại lệnh xuất kho cho phiếu "${confirmRetryExport.deliveryNumber}".`}
          confirmLabel="Thử lại xuất kho"
          onConfirm={() => retryExportMutation.mutate(confirmRetryExport.id)}
          onCancel={() => setConfirmRetryExport(null)}
          isLoading={retryExportMutation.isPending}
        />
      )}
    </div>
  );
}
