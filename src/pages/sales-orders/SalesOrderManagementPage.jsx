import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesOrderApi } from '../../api/salesOrderApi';
import { customerApi } from '../../api/customerApi';
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
  CheckCircleIcon,
  XCircleIcon,
  ClipboardIcon,
  FilterIcon,
  DollarSignIcon,
  CalendarIcon,
} from '../../components/ui/Icons';

import { SalesOrderFormModal } from './components/SalesOrderFormModal';
import { SalesOrderDetailModal } from './components/SalesOrderDetailModal';
import { SalesOrderPagination } from './components/SalesOrderPagination';
import { SalesOrderStatusBadge } from './components/SalesOrderStatusBadge';
import { SalesOrderActionModal } from './components/SalesOrderActionModal';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(val) { return val ? new Date(val).toLocaleDateString('vi-VN') : '—'; }
function fmtDt(val) { return val ? new Date(val).toLocaleString('vi-VN') : '—'; }
function fmtMoney(val, cur = 'VND') {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN', { style: 'currency', currency: cur });
}

const SO_STATUS_OPTIONS = [
  { value: 'DRAFT', label: 'Bản nháp' },
  { value: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
  { value: 'APPROVED', label: 'Đã duyệt' },
  { value: 'CONFIRMED', label: 'Đã xác nhận' },
  { value: 'DELIVERED', label: 'Đã giao hàng' },
  { value: 'REJECTED', label: 'Bị từ chối' },
  { value: 'CANCELLED', label: 'Đã huỷ' },
  { value: 'CLOSED', label: 'Đã đóng' },
];

// ── Main Page ─────────────────────────────────────────────────────────────────
export function SalesOrderManagementPage() {
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();

  const canCreate  = hasPermission(PERMISSIONS.SALES_CREATE);
  const canUpdate  = hasPermission(PERMISSIONS.SALES_UPDATE);
  const canApprove = hasPermission(PERMISSIONS.SALES_APPROVE);
  const canCancel  = hasPermission(PERMISSIONS.SALES_CANCEL);

  // ── Filters ───────────────────────────────────────────────────────────────
  const [page, setPage]               = useState(0);
  const [pageSize, setPageSize]       = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [customerFilter, setCustomerFilter] = useState('');
  const [fromDate, setFromDate]       = useState('');
  const [toDate, setToDate]           = useState('');

  // ── UI State ──────────────────────────────────────────────────────────────
  const [createModal, setCreateModal]         = useState(false);
  const [editSO, setEditSO]                   = useState(null);
  const [detailSO, setDetailSO]               = useState(null);
  const [detailLoading, setDetailLoading]     = useState(false);
  const [deleteSO, setDeleteSO]               = useState(null);
  // Action modals (reject / cancel)
  const [actionModal, setActionModal]         = useState(null); // { so, type: 'reject'|'cancel' }
  // Simple confirm actions (submit / approve / confirm / close)
  const [confirmAction, setConfirmAction]     = useState(null); // { so, type }

  // ── Data Queries ──────────────────────────────────────────────────────────
  const hasFilter = statusFilter || customerFilter || fromDate || toDate;
  const { data: soApiResponse, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['sales-orders', statusFilter, customerFilter, fromDate, toDate, page, pageSize],
    queryFn: () => hasFilter
      ? salesOrderApi.searchSalesOrders({
          status:     statusFilter || undefined,
          customerId: customerFilter || undefined,
          fromDate:   fromDate ? `${fromDate}T00:00:00` : undefined,
          toDate:     toDate   ? `${toDate}T23:59:59`   : undefined,
          page, size: pageSize,
        })
      : salesOrderApi.getSalesOrders({ page, size: pageSize }),
  });

  // Customer list for filter dropdown
  const { data: customersData } = useQuery({
    queryKey: ['customers-for-so-filter'],
    queryFn: () => customerApi.searchCustomers({ status: 'ACTIVE', page: 0, size: 200 }),
  });
  const customerList = useMemo(() => customersData?.data?.content || [], [customersData?.data?.content]);

  const pageData    = soApiResponse?.data;
  const totalPages  = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const soList      = useMemo(() => pageData?.content || [], [pageData?.content]);

  // ── KPI counts ────────────────────────────────────────────────────────────
  const kpiCounts = useMemo(() => {
    const counts = { ALL: totalElements, DRAFT: 0, PENDING_APPROVAL: 0, APPROVED: 0, CONFIRMED: 0 };
    soList.forEach((so) => { if (counts[so.status] !== undefined) counts[so.status]++; });
    return counts;
  }, [soList, totalElements]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['sales-orders'] });

  const createMutation = useMutation({
    mutationFn: (data) => salesOrderApi.createSalesOrder(data),
    onSuccess: () => { invalidate(); toast.success('Tạo đơn bán hàng thành công'); setCreateModal(false); },
    onError: (e) => { throw e; },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => salesOrderApi.updateSalesOrder(id, data),
    onSuccess: () => { invalidate(); toast.success('Cập nhật đơn bán hàng thành công'); setEditSO(null); },
    onError: (e) => { throw e; },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => salesOrderApi.deleteSalesOrder(id),
    onSuccess: () => { invalidate(); toast.success('Đã xoá đơn bán hàng'); setDeleteSO(null); },
    onError: (e) => toast.error(e?.response?.data?.message || 'Không thể xoá'),
  });

  const submitMutation = useMutation({
    mutationFn: (id) => salesOrderApi.submitForApproval(id),
    onSuccess: () => { invalidate(); toast.success('Đã gửi duyệt đơn bán hàng'); setConfirmAction(null); },
    onError: (e) => { toast.error(e?.response?.data?.message || 'Không thể gửi duyệt'); setConfirmAction(null); },
  });

  const approveMutation = useMutation({
    mutationFn: (id) => salesOrderApi.approve(id),
    onSuccess: () => { invalidate(); toast.success('Đã duyệt đơn bán hàng'); setConfirmAction(null); },
    onError: (e) => { toast.error(e?.response?.data?.message || 'Không thể duyệt'); setConfirmAction(null); },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => salesOrderApi.reject(id, reason),
    onSuccess: () => { invalidate(); toast.success('Đã từ chối đơn bán hàng'); setActionModal(null); },
    onError: (e) => { toast.error(e?.response?.data?.message || 'Không thể từ chối'); },
  });

  const confirmMutation = useMutation({
    mutationFn: (id) => salesOrderApi.confirm(id),
    onSuccess: () => { invalidate(); toast.success('Đã xác nhận đơn bán hàng'); setConfirmAction(null); },
    onError: (e) => { toast.error(e?.response?.data?.message || 'Không thể xác nhận'); setConfirmAction(null); },
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => salesOrderApi.cancel(id, reason),
    onSuccess: () => { invalidate(); toast.success('Đã huỷ đơn bán hàng'); setActionModal(null); },
    onError: (e) => { toast.error(e?.response?.data?.message || 'Không thể huỷ'); },
  });

  const closeMutation = useMutation({
    mutationFn: (id) => salesOrderApi.close(id),
    onSuccess: () => { invalidate(); toast.success('Đã đóng đơn bán hàng'); setConfirmAction(null); },
    onError: (e) => { toast.error(e?.response?.data?.message || 'Không thể đóng'); setConfirmAction(null); },
  });

  // ── Detail loading ────────────────────────────────────────────────────────
  const handleViewDetail = async (so) => {
    setDetailLoading(true);
    try {
      const res = await salesOrderApi.getSalesOrderById(so.id);
      setDetailSO(res.data);
    } catch {
      toast.error('Không thể tải chi tiết đơn bán hàng');
    } finally {
      setDetailLoading(false);
    }
  };

  // ── Confirm action dispatch ───────────────────────────────────────────────
  const handleConfirmAction = () => {
    if (!confirmAction) return;
    const { so, type } = confirmAction;
    if (type === 'submit')  submitMutation.mutate(so.id);
    if (type === 'approve') approveMutation.mutate(so.id);
    if (type === 'confirm') confirmMutation.mutate(so.id);
    if (type === 'close')   closeMutation.mutate(so.id);
    if (type === 'delete')  deleteMutation.mutate(so.id);
  };

  const CONFIRM_CONFIG = {
    submit:  { title: 'Gửi duyệt đơn bán hàng?', desc: 'Đơn hàng sẽ chuyển sang trạng thái Chờ duyệt.', confirmLabel: 'Gửi duyệt', color: '#d97706' },
    approve: { title: 'Duyệt đơn bán hàng?',      desc: 'Đơn hàng sẽ được duyệt và chuyển trạng thái APPROVED.',  confirmLabel: 'Phê duyệt', color: '#059669' },
    confirm: { title: 'Xác nhận đơn bán hàng?',   desc: 'Đơn hàng sẽ chuyển sang trạng thái CONFIRMED.',        confirmLabel: 'Xác nhận', color: '#2563eb' },
    close:   { title: 'Đóng đơn bán hàng?',        desc: 'Đơn hàng sẽ được đóng lại.',                            confirmLabel: 'Đóng đơn', color: '#64748b' },
    delete:  { title: 'Xoá đơn bán hàng?',         desc: 'Thao tác này không thể hoàn tác.',                       confirmLabel: 'Xoá', color: '#dc2626' },
  };

  // ── Reset page on filter change ───────────────────────────────────────────
  const handleFilterChange = (setter) => (val) => { setter(val); setPage(0); };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingCartIcon size={26} style={{ color: '#fff' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#1e293b' }}>Đơn Bán Hàng</h1>
            <p style={{ margin: '3px 0 0', fontSize: 14, color: '#64748b' }}>Quản lý toàn bộ Sales Order trong hệ thống</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <RefreshCwIcon size={14} style={{ animation: isFetching ? 'spin 1s linear infinite' : 'none' }} />
            Làm mới
          </Button>
          {canCreate && (
            <button onClick={() => setCreateModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 18px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              <PlusIcon size={16} /> Tạo đơn hàng
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Tổng đơn hàng',    value: kpiCounts.ALL,              icon: ClipboardIcon,    color: '#6366f1' },
          { label: 'Bản nháp',          value: kpiCounts.DRAFT,            icon: FilterIcon,       color: '#94a3b8' },
          { label: 'Chờ duyệt',         value: kpiCounts.PENDING_APPROVAL, icon: CalendarIcon,     color: '#d97706' },
          { label: 'Đã duyệt',          value: kpiCounts.APPROVED,         icon: CheckCircleIcon,  color: '#059669' },
          { label: 'Đã xác nhận',       value: kpiCounts.CONFIRMED,        icon: DollarSignIcon,   color: '#2563eb' },
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

      {/* Filters */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '18px 20px', border: '1px solid #f1f5f9', marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ flex: '1 1 200px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>KHÁCH HÀNG</label>
            <select value={customerFilter} onChange={(e) => handleFilterChange(setCustomerFilter)(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}>
              <option value="">Tất cả khách hàng</option>
              {customerList.map((c) => <option key={c.id} value={c.id}>{c.customerCode} – {c.customerName}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 160px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>TRẠNG THÁI</label>
            <select value={statusFilter} onChange={(e) => handleFilterChange(setStatusFilter)(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14 }}>
              <option value="">Tất cả trạng thái</option>
              {SO_STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>TỪ NGÀY</label>
            <input type="date" value={fromDate} onChange={(e) => handleFilterChange(setFromDate)(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          <div style={{ flex: '1 1 150px' }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>ĐẾN NGÀY</label>
            <input type="date" value={toDate} onChange={(e) => handleFilterChange(setToDate)(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
          </div>
          {(statusFilter || customerFilter || fromDate || toDate) && (
            <button onClick={() => { setStatusFilter(''); setCustomerFilter(''); setFromDate(''); setToDate(''); setPage(0); }}
              style={{ padding: '8px 14px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#f8fafc', cursor: 'pointer', fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
              <XCircleIcon size={14} /> Xoá bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.04)', overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: 48 }}><LoadingState message="Đang tải danh sách đơn bán hàng..." /></div>
        ) : isError ? (
          <div style={{ padding: 48 }}><EmptyState title="Lỗi tải dữ liệu" description={error?.message} /></div>
        ) : soList.length === 0 ? (
          <div style={{ padding: 48 }}>
            <EmptyState icon={ShoppingCartIcon} title="Chưa có đơn bán hàng" description="Tạo đơn bán hàng đầu tiên để bắt đầu." />
          </div>
        ) : (
          <>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
                    {['Số đơn hàng', 'Khách hàng', 'Ngày đặt', 'Ngày giao', 'Tổng tiền', 'Trạng thái', 'Hành động'].map((h) => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 700, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {soList.map((so, i) => (
                    <tr key={so.id} style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fff' : '#fafafa', transition: 'background 0.15s' }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                      onMouseLeave={(e) => e.currentTarget.style.background = i % 2 === 0 ? '#fff' : '#fafafa'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 13, color: '#6366f1' }}>{so.soNumber}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{fmtDt(so.createdAt)}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{so.customerName || '—'}</div>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDt(so.soDate)}</td>
                      <td style={{ padding: '12px 16px', color: '#64748b', whiteSpace: 'nowrap' }}>{fmt(so.deliveryDate)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>{fmtMoney(so.grandTotal, so.currency)}</td>
                      <td style={{ padding: '12px 16px' }}><SalesOrderStatusBadge status={so.status} /></td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {/* View */}
                          <button onClick={() => handleViewDetail(so)} title="Xem chi tiết"
                            style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#64748b' }}>
                            <EyeIcon size={13} />
                          </button>

                          {/* Edit (DRAFT only) */}
                          {canUpdate && so.status === 'DRAFT' && (
                            <button onClick={() => handleViewDetail(so).then?.() || salesOrderApi.getSalesOrderById(so.id).then((r) => setEditSO(r.data))}
                              title="Chỉnh sửa"
                              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#fff', cursor: 'pointer', color: '#6366f1' }}>
                              <EditIcon size={13} />
                            </button>
                          )}

                          {/* Submit for approval (DRAFT) */}
                          {canCreate && so.status === 'DRAFT' && (
                            <button onClick={() => setConfirmAction({ so, type: 'submit' })} title="Gửi duyệt"
                              style={{ padding: '5px 8px', border: '1px solid #fcd34d', borderRadius: 6, background: '#fffbeb', cursor: 'pointer', color: '#d97706' }}>
                              <ClipboardIcon size={13} />
                            </button>
                          )}

                          {/* Approve (PENDING_APPROVAL) */}
                          {canApprove && so.status === 'PENDING_APPROVAL' && (
                            <button onClick={() => setConfirmAction({ so, type: 'approve' })} title="Phê duyệt"
                              style={{ padding: '5px 8px', border: '1px solid #a7f3d0', borderRadius: 6, background: '#ecfdf5', cursor: 'pointer', color: '#059669' }}>
                              <CheckCircleIcon size={13} />
                            </button>
                          )}

                          {/* Reject (PENDING_APPROVAL) */}
                          {canApprove && so.status === 'PENDING_APPROVAL' && (
                            <button onClick={() => setActionModal({ so, type: 'reject' })} title="Từ chối"
                              style={{ padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', color: '#dc2626' }}>
                              <XCircleIcon size={13} />
                            </button>
                          )}

                          {/* Confirm (APPROVED) */}
                          {canUpdate && so.status === 'APPROVED' && (
                            <button onClick={() => setConfirmAction({ so, type: 'confirm' })} title="Xác nhận"
                              style={{ padding: '5px 8px', border: '1px solid #93c5fd', borderRadius: 6, background: '#eff6ff', cursor: 'pointer', color: '#2563eb' }}>
                              <CheckCircleIcon size={13} />
                            </button>
                          )}

                          {/* Close (DELIVERED) */}
                          {canUpdate && so.status === 'DELIVERED' && (
                            <button onClick={() => setConfirmAction({ so, type: 'close' })} title="Đóng đơn"
                              style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', cursor: 'pointer', color: '#64748b' }}>
                              <XCircleIcon size={13} />
                            </button>
                          )}

                          {/* Cancel (DRAFT | APPROVED | CONFIRMED) */}
                          {canCancel && ['DRAFT','APPROVED','CONFIRMED'].includes(so.status) && (
                            <button onClick={() => setActionModal({ so, type: 'cancel' })} title="Huỷ đơn"
                              style={{ padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', color: '#b91c1c' }}>
                              <XCircleIcon size={13} />
                            </button>
                          )}

                          {/* Delete (DRAFT only) */}
                          {canUpdate && so.status === 'DRAFT' && (
                            <button onClick={() => setDeleteSO(so)} title="Xoá"
                              style={{ padding: '5px 8px', border: '1px solid #fca5a5', borderRadius: 6, background: '#fef2f2', cursor: 'pointer', color: '#dc2626' }}>
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
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
              <SalesOrderPagination
                page={page} totalPages={totalPages} totalElements={totalElements}
                pageSize={pageSize} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(0); }}
              />
            </div>
          </>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Create SO */}
      <SalesOrderFormModal
        isOpen={createModal}
        onClose={() => setCreateModal(false)}
        onSuccess={async (data) => {
          await createMutation.mutateAsync(data);
        }}
      />

      {/* Edit SO (header fields only for DRAFT) */}
      {editSO && (
        <SalesOrderFormModal
          isOpen={Boolean(editSO)}
          editSO={editSO}
          onClose={() => setEditSO(null)}
          onSuccess={async (data) => {
            // UpdateSalesOrderRequest: deliveryDate, taxPercentage, shippingCost, discountAmount, paymentTerms, shippingAddress, notes
            const updateData = {
              deliveryDate:    data.deliveryDate,
              taxPercentage:   data.taxPercentage,
              shippingCost:    data.shippingCost,
              discountAmount:  data.discountAmount,
              paymentTerms:    data.paymentTerms || null,
              shippingAddress: data.shippingAddress || null,
              notes:           data.notes || null,
            };
            await updateMutation.mutateAsync({ id: editSO.id, data: updateData });
          }}
        />
      )}

      {/* Detail */}
      {detailSO && <SalesOrderDetailModal so={detailSO} onClose={() => setDetailSO(null)} />}
      {detailLoading && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.3)' }}>
          <div style={{ background: '#fff', borderRadius: 12, padding: '20px 32px', fontSize: 14, color: '#64748b' }}>Đang tải...</div>
        </div>
      )}

      {/* Reason modal (reject / cancel) */}
      {actionModal && (
        <SalesOrderActionModal
          isOpen={Boolean(actionModal)}
          onClose={() => setActionModal(null)}
          title={actionModal.type === 'reject' ? 'Từ chối đơn bán hàng' : 'Huỷ đơn bán hàng'}
          description={actionModal.type === 'reject'
            ? `Từ chối đơn ${actionModal.so.soNumber}. Nhập lý do từ chối.`
            : `Huỷ đơn ${actionModal.so.soNumber}. Nhập lý do huỷ.`}
          confirmLabel={actionModal.type === 'reject' ? 'Từ chối' : 'Huỷ đơn'}
          confirmColor={actionModal.type === 'reject' ? '#dc2626' : '#b91c1c'}
          isLoading={rejectMutation.isPending || cancelMutation.isPending}
          onConfirm={(reason) => {
            if (actionModal.type === 'reject') rejectMutation.mutate({ id: actionModal.so.id, reason });
            if (actionModal.type === 'cancel') cancelMutation.mutate({ id: actionModal.so.id, reason });
          }}
        />
      )}

      {/* Simple confirm (submit / approve / confirm / close) */}
      {confirmAction && CONFIRM_CONFIG[confirmAction.type] && (
        <ConfirmModal
          isOpen={Boolean(confirmAction)}
          title={CONFIRM_CONFIG[confirmAction.type].title}
          message={CONFIRM_CONFIG[confirmAction.type].desc}
          confirmLabel={CONFIRM_CONFIG[confirmAction.type].confirmLabel}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
          isLoading={submitMutation.isPending || approveMutation.isPending || confirmMutation.isPending || closeMutation.isPending}
        />
      )}

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={Boolean(deleteSO)}
        title="Xoá đơn bán hàng?"
        message={`Bạn có chắc muốn xoá đơn hàng "${deleteSO?.soNumber}"? Thao tác này không thể hoàn tác.`}
        confirmLabel="Xoá"
        onConfirm={() => deleteMutation.mutate(deleteSO.id)}
        onCancel={() => setDeleteSO(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
