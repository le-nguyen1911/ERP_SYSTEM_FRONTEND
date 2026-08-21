import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, ConfirmModal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { purchaseOrderApi } from '../../../api/purchaseOrderApi';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../utils/constants';
import { toast } from '../../../stores/useToastStore';
import {
  ClipboardIcon,
  CheckCircleIcon,
  XCircleIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  SendIcon,
  EditIcon,
} from '../../../components/ui/Icons';

// ─── Status config ───────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  DRAFT:             { label: 'Bản nháp',          bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  PENDING_APPROVAL:  { label: 'Chờ duyệt',          bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  APPROVED:          { label: 'Đã duyệt',           bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  SENT_TO_SUPPLIER:  { label: 'Đã gửi NCC',         bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  GOODS_RECEIVED:    { label: 'Đã nhận hàng',       bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  REJECTED:          { label: 'Bị từ chối',         bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  CANCELLED:         { label: 'Đã huỷ',             bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  CLOSED:            { label: 'Đã đóng',            bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}

function formatDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('vi-VN');
}
function formatDate(val) {
  if (!val) return '—';
  return new Date(val).toLocaleDateString('vi-VN');
}
function formatCurrency(val, currency = 'VND') {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN', { style: 'currency', currency });
}

// ─── Reason modal ────────────────────────────────────────────────────────────
function ReasonModal({ isOpen, onClose, title, placeholder, onConfirm, isLoading }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  function handleSubmit() {
    if (!reason.trim()) { setError('Lý do không được để trống'); return; }
    onConfirm(reason.trim());
  }
  function handleClose() { setReason(''); setError(''); onClose(); }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={title} size="sm">
      <div style={{ padding: '16px 0' }}>
        <textarea
          className="form-input"
          placeholder={placeholder}
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(''); }}
          rows={4}
          style={{ width: '100%', resize: 'vertical', fontFamily: 'inherit' }}
          disabled={isLoading}
        />
        {error && <p style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{error}</p>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
        <Button variant="outline" onClick={handleClose} disabled={isLoading}>Huỷ</Button>
        <Button variant="primary" onClick={handleSubmit} disabled={isLoading || !reason.trim()}>
          {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Main Detail Modal ────────────────────────────────────────────────────────
export function PurchaseOrderDetailModal({ isOpen, onClose, po, onEdit }) {
  const { hasPermission } = usePermission();
  const queryClient = useQueryClient();
  const [rejectModal, setRejectModal] = useState(false);
  const [cancelModal, setCancelModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { title, message, action }

  const [currentPo, setCurrentPo] = useState(po);

  const canUpdate  = hasPermission(PERMISSIONS.PURCHASE_UPDATE);
  const canApprove = hasPermission(PERMISSIONS.PURCHASE_APPROVE);
  const canCancel  = hasPermission(PERMISSIONS.PURCHASE_CANCEL);
  const canCreate  = hasPermission(PERMISSIONS.PURCHASE_CREATE);

  function invalidate(id) {
    queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
  }

  const submitMutation = useMutation({
    mutationFn: (id) => purchaseOrderApi.submitForApproval(id),
    onSuccess: (res) => {
      toast.success('Gửi duyệt đơn hàng thành công');
      setCurrentPo(res?.data);
      invalidate(currentPo.id);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể gửi duyệt'),
  });

  const approveMutation = useMutation({
    mutationFn: (id) => purchaseOrderApi.approve(id, {}),
    onSuccess: (res) => {
      toast.success('Duyệt đơn hàng thành công');
      setCurrentPo(res?.data);
      invalidate(currentPo.id);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể duyệt đơn hàng'),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => purchaseOrderApi.reject(id, { reason }),
    onSuccess: (res) => {
      toast.success('Từ chối đơn hàng thành công');
      setCurrentPo(res?.data);
      invalidate(currentPo.id);
      setRejectModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể từ chối đơn hàng'),
  });

  const sendMutation = useMutation({
    mutationFn: (id) => purchaseOrderApi.sendToSupplier(id),
    onSuccess: (res) => {
      toast.success('Đã gửi đơn hàng cho nhà cung cấp');
      setCurrentPo(res?.data);
      invalidate(currentPo.id);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể gửi đơn hàng'),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }) => purchaseOrderApi.cancel(id, { reason }),
    onSuccess: (res) => {
      toast.success('Huỷ đơn hàng thành công');
      setCurrentPo(res?.data);
      invalidate(currentPo.id);
      setCancelModal(false);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể huỷ đơn hàng'),
  });

  const closeMutation = useMutation({
    mutationFn: (id) => purchaseOrderApi.close(id),
    onSuccess: (res) => {
      toast.success('Đóng đơn hàng thành công');
      setCurrentPo(res?.data);
      invalidate(currentPo.id);
      setConfirmAction(null);
    },
    onError: (err) => toast.error(err?.response?.data?.message || 'Không thể đóng đơn hàng'),
  });

  if (!currentPo) return null;

  const isDraft           = currentPo.status === 'DRAFT';
  const isPendingApproval = currentPo.status === 'PENDING_APPROVAL';
  const isApproved        = currentPo.status === 'APPROVED';
  const isGoodsReceived   = currentPo.status === 'GOODS_RECEIVED';
  const isFinal           = ['CANCELLED', 'CLOSED', 'REJECTED'].includes(currentPo.status);

  const isActionLoading = submitMutation.isPending || approveMutation.isPending ||
    rejectMutation.isPending || sendMutation.isPending || cancelMutation.isPending || closeMutation.isPending;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title={`Chi tiết Đơn mua hàng — ${currentPo.poNumber}`} size="xl">
        {/* ── Header info ─────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <InfoBlock label="Mã PO" value={<strong style={{ fontSize: 15 }}>{currentPo.poNumber}</strong>} />
          <InfoBlock label="Trạng thái" value={<StatusBadge status={currentPo.status} />} />
          <InfoBlock label="Nhà cung cấp" value={currentPo.supplier?.supplierName || '—'} />
          <InfoBlock label="Mã NCC" value={currentPo.supplier?.supplierCode || '—'} />
          <InfoBlock label="Ngày tạo đơn" value={formatDateTime(currentPo.poDate)} />
          <InfoBlock label="Ngày giao hàng" value={formatDate(currentPo.deliveryDate)} />
          <InfoBlock label="Đơn vị tiền tệ" value={currentPo.currency || 'VND'} />
          <InfoBlock label="Điều khoản thanh toán" value={currentPo.paymentTerms || '—'} />
          <InfoBlock label="Incoterms" value={currentPo.incoterms || '—'} />
          <InfoBlock label="Ghi chú" value={currentPo.notes || '—'} />
        </div>

        {/* ── Items table ──────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Danh sách sản phẩm ({currentPo.items?.length ?? 0} dòng)
          </h4>
          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  {['#', 'Mã SP', 'Tên sản phẩm', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', 'Ghi chú'].map((h) => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(currentPo.items || []).map((item, i) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ padding: '8px 12px', fontFamily: 'monospace' }}>{item.productCode}</td>
                    <td style={{ padding: '8px 12px', fontWeight: 500 }}>{item.productName}</td>
                    <td style={{ padding: '8px 12px' }}>{item.productUnit}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number(item.quantity).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right' }}>{Number(item.unitPrice).toLocaleString('vi-VN')}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 600 }}>
                      {(Number(item.quantity) * Number(item.unitPrice)).toLocaleString('vi-VN')}
                    </td>
                    <td style={{ padding: '8px 12px', color: '#64748b' }}>{item.description || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Financial summary ────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
          <div style={{ width: 300, border: '1px solid var(--color-border)', borderRadius: 8, overflow: 'hidden' }}>
            <FinancialRow label="Tạm tính (Subtotal)" value={formatCurrency(currentPo.subtotal, currentPo.currency)} />
            <FinancialRow label={`Thuế (${currentPo.taxPercentage ?? 0}%)`} value={formatCurrency(currentPo.taxAmount, currentPo.currency)} />
            <FinancialRow label="Phí vận chuyển" value={formatCurrency(currentPo.shippingCost, currentPo.currency)} />
            <FinancialRow label="Giảm giá" value={formatCurrency(currentPo.discountAmount, currentPo.currency)} />
            <FinancialRow label="Tổng cộng" value={formatCurrency(currentPo.grandTotal, currentPo.currency)} highlight />
          </div>
        </div>

        {/* ── Rejection / Cancellation reason ─────────────────────── */}
        {currentPo.rejectionReason && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>
            <strong>Lý do từ chối:</strong> {currentPo.rejectionReason}
          </div>
        )}
        {currentPo.cancellationReason && (
          <div style={{ padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, marginBottom: 16, fontSize: 13, color: '#b91c1c' }}>
            <strong>Lý do huỷ:</strong> {currentPo.cancellationReason}
          </div>
        )}

        {/* ── Actions ─────────────────────────────────────────────── */}
        {!isFinal && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
            {isDraft && canUpdate && (
              <Button variant="outline" size="sm" onClick={() => onEdit(currentPo)} disabled={isActionLoading}>
                <EditIcon size={14} /> Chỉnh sửa
              </Button>
            )}
            {isDraft && canCreate && (
              <Button variant="primary" size="sm" onClick={() => submitMutation.mutate(currentPo.id)} disabled={isActionLoading}>
                <ClipboardIcon size={14} /> Gửi duyệt
              </Button>
            )}
            {isPendingApproval && canApprove && (
              <>
                <Button variant="success" size="sm" onClick={() => approveMutation.mutate(currentPo.id)} disabled={isActionLoading}>
                  <ThumbsUpIcon size={14} /> Duyệt
                </Button>
                <Button variant="danger" size="sm" onClick={() => setRejectModal(true)} disabled={isActionLoading}>
                  <ThumbsDownIcon size={14} /> Từ chối
                </Button>
              </>
            )}
            {isApproved && canUpdate && (
              <Button variant="primary" size="sm" onClick={() => sendMutation.mutate(currentPo.id)} disabled={isActionLoading}>
                <SendIcon size={14} /> Gửi cho NCC
              </Button>
            )}
            {isGoodsReceived && canUpdate && (
              <Button variant="outline" size="sm"
                onClick={() => setConfirmAction({
                  title: 'Đóng đơn hàng',
                  message: `Bạn có chắc chắn muốn đóng đơn hàng ${currentPo.poNumber}? Hành động này không thể hoàn tác.`,
                  action: () => closeMutation.mutate(currentPo.id),
                })}
                disabled={isActionLoading}
              >
                <CheckCircleIcon size={14} /> Đóng đơn
              </Button>
            )}
            {canCancel && (
              <Button variant="danger" size="sm" onClick={() => setCancelModal(true)} disabled={isActionLoading}>
                <XCircleIcon size={14} /> Huỷ đơn
              </Button>
            )}
          </div>
        )}
      </Modal>

      <ReasonModal
        isOpen={rejectModal}
        onClose={() => setRejectModal(false)}
        title="Từ chối đơn mua hàng"
        placeholder="Nhập lý do từ chối..."
        onConfirm={(reason) => rejectMutation.mutate({ id: currentPo.id, reason })}
        isLoading={rejectMutation.isPending}
      />

      <ReasonModal
        isOpen={cancelModal}
        onClose={() => setCancelModal(false)}
        title="Huỷ đơn mua hàng"
        placeholder="Nhập lý do huỷ đơn..."
        onConfirm={(reason) => cancelMutation.mutate({ id: currentPo.id, reason })}
        isLoading={cancelMutation.isPending}
      />

      {confirmAction && (
        <ConfirmModal
          isOpen
          onClose={() => setConfirmAction(null)}
          onConfirm={confirmAction.action}
          title={confirmAction.title}
          message={confirmAction.message}
          isLoading={closeMutation.isPending}
        />
      )}
    </>
  );
}

function InfoBlock({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14 }}>{value}</div>
    </div>
  );
}

function FinancialRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: highlight ? '#1e3a5f' : undefined,
      color: highlight ? '#fff' : undefined,
      borderBottom: highlight ? 'none' : '1px solid var(--color-border)',
      fontWeight: highlight ? 700 : 400,
      fontSize: highlight ? 15 : 13,
    }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
