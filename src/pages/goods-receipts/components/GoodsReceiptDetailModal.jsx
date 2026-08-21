import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../utils/constants';
import {
  XCircleIcon,
  RefreshCwIcon,
} from '../../../components/ui/Icons';
import { GoodsReceiptQcModal } from './GoodsReceiptQcModal';

export function GoodsReceiptDetailModal({
  isOpen,
  onClose,
  goodsReceipt,
  onMarkReceived,
  onPerformQc,
  onRetryImport,
  onCancel,
  isActionLoading,
}) {
  const { hasPermission, isAdmin } = usePermission();

  // State hooks declared at top level
  const [qcModalOpen, setQcModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelError, setCancelError] = useState('');

  if (!isOpen || !goodsReceipt) return null;

  const canCreate = hasPermission(PERMISSIONS.GOODS_RECEIPT_CREATE) || isAdmin;
  const canImport = hasPermission(PERMISSIONS.GOODS_RECEIPT_IMPORT) || isAdmin;

  const status = goodsReceipt.status;
  const qcStatus = goodsReceipt.qualityCheckStatus;
  const importStatus = goodsReceipt.inventoryImportStatus;

  // Status badge config
  const statusBadge = {
    DRAFT: { label: 'Bản nháp (DRAFT)', variant: 'neutral' },
    RECEIVED: { label: 'Đã nhận hàng (RECEIVED)', variant: 'info' },
    QC_PASSED: { label: 'QC Đạt (QC_PASSED)', variant: 'success' },
    QC_FAILED: { label: 'QC Không đạt (QC_FAILED)', variant: 'danger' },
    IMPORTED: { label: 'Đã nhập kho (IMPORTED)', variant: 'success' },
    CANCELLED: { label: 'Đã huỷ (CANCELLED)', variant: 'neutral' },
  }[status] || { label: status, variant: 'neutral' };

  function handleOpenCancel() {
    setCancelReason('');
    setCancelError('');
    setCancelModalOpen(true);
  }

  function handleConfirmCancel() {
    if (!cancelReason.trim()) {
      setCancelError('Vui lòng nhập lý do hủy phiếu.');
      return;
    }
    onCancel(goodsReceipt.id, cancelReason.trim());
    setCancelModalOpen(false);
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Chi tiết Phiếu nhận hàng — ${goodsReceipt.grNumber}`}
        size="xl"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header Summary Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
              padding: 16,
              backgroundColor: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 13,
            }}
          >
            <div>
              <span style={{ color: '#64748b', fontSize: 12 }}>Đơn mua hàng liên kết:</span>
              <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 14 }}>
                {goodsReceipt.poNumber || '—'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: 12 }}>Nhà cung cấp:</span>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {goodsReceipt.supplier?.supplierName || goodsReceipt.supplierName || '—'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: 12 }}>Thời gian nhận hàng:</span>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {goodsReceipt.grDate ? new Date(goodsReceipt.grDate).toLocaleString('vi-VN') : '—'}
              </div>
            </div>

            <div>
              <span style={{ color: '#64748b', fontSize: 12 }}>Trạng thái phiếu:</span>
              <div style={{ marginTop: 4 }}>
                <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              </div>
            </div>
          </div>

          {/* QC & Inventory Import Status Alerts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* QC Status card */}
            <div style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: '#fff', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Kiểm tra chất lượng (QC):</span>
                {qcStatus === 'PASSED' ? (
                  <Badge variant="success">ĐẠT (PASSED)</Badge>
                ) : qcStatus === 'FAILED' ? (
                  <Badge variant="danger">KHÔNG ĐẠT (FAILED)</Badge>
                ) : (
                  <Badge variant="warning">CHỜ KIỂM TRA (PENDING)</Badge>
                )}
              </div>
              {goodsReceipt.qualityCheckNotes && (
                <div style={{ fontSize: 12, color: '#334155', marginTop: 4 }}>
                  <strong>Ghi chú QC:</strong> {goodsReceipt.qualityCheckNotes}
                </div>
              )}
              {goodsReceipt.qualityCheckDate && (
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>
                  Ngày QC: {new Date(goodsReceipt.qualityCheckDate).toLocaleString('vi-VN')}
                </div>
              )}
            </div>

            {/* Inventory Import card */}
            <div style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8, backgroundColor: '#fff', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, color: '#475569' }}>Nhập tồn kho (Stock):</span>
                {importStatus === 'SUCCESS' ? (
                  <Badge variant="success">THÀNH CÔNG (SUCCESS)</Badge>
                ) : importStatus === 'FAILED' ? (
                  <Badge variant="danger">THẤT BẠI (FAILED)</Badge>
                ) : (
                  <Badge variant="neutral">CHƯA NHẬP (PENDING)</Badge>
                )}
              </div>
              {importStatus === 'FAILED' && goodsReceipt.inventoryErrorMessage && (
                <div style={{ fontSize: 12, color: '#dc2626', marginTop: 4 }}>
                  <strong>Lỗi:</strong> {goodsReceipt.inventoryErrorMessage}
                </div>
              )}
              {status === 'IMPORTED' && (
                <div style={{ fontSize: 12, color: '#059669', marginTop: 4 }}>
                  Đã tự động tăng tồn kho cho các sản phẩm được chấp nhận.
                </div>
              )}
            </div>
          </div>

          {/* Cancellation reason if cancelled */}
          {status === 'CANCELLED' && (
            <div style={{ padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <XCircleIcon size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ color: '#991b1b', fontSize: 13 }}>Phiếu đã bị huỷ:</strong>
                <p style={{ margin: '4px 0 0', color: '#b91c1c', fontSize: 13 }}>{goodsReceipt.rejectionReason || 'Không có lý do chi tiết.'}</p>
              </div>
            </div>
          )}

          {/* Item Details Table */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Danh sách sản phẩm nhận hàng
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, minWidth: 200 }}>Sản phẩm</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Chấp nhận (Đạt)</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Từ chối (Lỗi)</th>
                    <th style={{ ...thStyle, minWidth: 120 }}>Số lô (Batch)</th>
                    <th style={{ ...thStyle, minWidth: 120 }}>Hạn dùng</th>
                    <th style={{ ...thStyle, minWidth: 140 }}>Ghi chú</th>
                  </tr>
                </thead>
                <tbody>
                  {goodsReceipt.items?.map((item, index) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={tdStyle}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                          {item.productName}
                        </div>
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: '#059669' }}>
                        {Number(item.quantityAccepted || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: Number(item.quantityRejected) > 0 ? '#dc2626' : '#94a3b8' }}>
                        {Number(item.quantityRejected || 0).toLocaleString('vi-VN')}
                      </td>
                      <td style={tdStyle}>
                        {item.batchNumber ? <span className="font-mono" style={{ backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{item.batchNumber}</span> : '—'}
                      </td>
                      <td style={tdStyle}>
                        {item.expiryDate ? item.expiryDate : '—'}
                      </td>
                      <td style={tdStyle}>
                        <span style={{ color: '#64748b' }}>{item.notes || '—'}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Action Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--color-border)', flexWrap: 'wrap', gap: 8 }}>
            <div>
              {/* Left action: Cancel button (allowed if not IMPORTED or CANCELLED) */}
              {canCreate && status !== 'IMPORTED' && status !== 'CANCELLED' && (
                <Button
                  type="button"
                  variant="outline-danger"
                  size="sm"
                  onClick={handleOpenCancel}
                  disabled={isActionLoading}
                >
                  Huỷ phiếu nhận hàng
                </Button>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <Button type="button" variant="outline" onClick={onClose} disabled={isActionLoading}>
                Đóng
              </Button>

              {/* Status: DRAFT -> Mark as Received */}
              {canCreate && status === 'DRAFT' && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => onMarkReceived(goodsReceipt.id)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Đang cập nhật...' : 'Xác nhận đã nhận hàng (Mark Received)'}
                </Button>
              )}

              {/* Status: RECEIVED -> Perform QC */}
              {canCreate && status === 'RECEIVED' && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setQcModalOpen(true)}
                  disabled={isActionLoading}
                >
                  Kiểm tra chất lượng (QC)
                </Button>
              )}

              {/* Retry import if import failed */}
              {canImport && importStatus === 'FAILED' && (
                <Button
                  type="button"
                  variant="primary"
                  icon={<RefreshCwIcon size={14} />}
                  onClick={() => onRetryImport(goodsReceipt.id)}
                  disabled={isActionLoading}
                >
                  {isActionLoading ? 'Đang thử lại...' : 'Thử lại nhập kho'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* QC Modal */}
      <GoodsReceiptQcModal
        isOpen={qcModalOpen}
        onClose={() => setQcModalOpen(false)}
        goodsReceipt={goodsReceipt}
        onSubmit={(qcData) => {
          onPerformQc(goodsReceipt.id, qcData);
          setQcModalOpen(false);
        }}
        isLoading={isActionLoading}
      />

      {/* Cancel Confirmation Modal with Reason */}
      <Modal
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        title={`Huỷ Phiếu nhận hàng — ${goodsReceipt.grNumber}`}
        size="sm"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--color-text-secondary)' }}>
            Hành động này sẽ hủy phiếu nhận hàng. Số lượng hàng hóa trong phiếu sẽ được giải phóng để tạo phiếu nhận mới.
          </p>

          <div>
            <label className="form-label" style={{ fontWeight: 600 }}>
              Lý do huỷ <span style={{ color: '#e53e3e' }}>*</span>
            </label>
            <textarea
              className="form-input"
              rows={3}
              value={cancelReason}
              onChange={(e) => {
                setCancelReason(e.target.value);
                setCancelError('');
              }}
              placeholder="Nhập lý do huỷ phiếu nhận hàng..."
              disabled={isActionLoading}
              style={{ resize: 'vertical', fontFamily: 'inherit' }}
            />
            {cancelError && <p className="form-error">{cancelError}</p>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
            <Button type="button" variant="outline" onClick={() => setCancelModalOpen(false)} disabled={isActionLoading}>
              Đóng
            </Button>
            <Button type="button" variant="danger" onClick={handleConfirmCancel} disabled={isActionLoading}>
              {isActionLoading ? 'Đang xử lý...' : 'Xác nhận huỷ phiếu'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

const thStyle = {
  padding: '8px 12px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '8px 12px',
  verticalAlign: 'middle',
};
