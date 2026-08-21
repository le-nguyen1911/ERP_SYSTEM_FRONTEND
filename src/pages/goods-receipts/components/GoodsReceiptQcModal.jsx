import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { CheckCircleIcon, XCircleIcon, AlertTriangleIcon } from '../../../components/ui/Icons';

export function GoodsReceiptQcModal({ isOpen, onClose, goodsReceipt, onSubmit, isLoading }) {
  const [result, setResult] = useState('PASSED');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      result,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Kiểm tra chất lượng (QC) — ${goodsReceipt?.grNumber}`}
      size="md"
    >
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Kết quả kiểm tra <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 8 }}>
            <button
              type="button"
              onClick={() => setResult('PASSED')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 12px',
                border: result === 'PASSED' ? '2px solid #059669' : '1px solid var(--color-border)',
                backgroundColor: result === 'PASSED' ? '#ecfdf5' : '#fff',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <CheckCircleIcon size={24} style={{ color: '#059669' }} />
              <span style={{ fontWeight: 700, color: '#065f46', fontSize: 14 }}>ĐẠT TIÊU CHUẨN (PASSED)</span>
              <span style={{ fontSize: 12, color: '#047857', textAlign: 'center' }}>
                Hàng hóa đạt chuẩn, cho phép tự động nhập kho
              </span>
            </button>

            <button
              type="button"
              onClick={() => setResult('FAILED')}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: '16px 12px',
                border: result === 'FAILED' ? '2px solid #dc2626' : '1px solid var(--color-border)',
                backgroundColor: result === 'FAILED' ? '#fef2f2' : '#fff',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <XCircleIcon size={24} style={{ color: '#dc2626' }} />
              <span style={{ fontWeight: 700, color: '#991b1b', fontSize: 14 }}>KHÔNG ĐẠT (FAILED)</span>
              <span style={{ fontSize: 12, color: '#b91c1c', textAlign: 'center' }}>
                Hàng lỗi/hỏng, không đưa vào kho hàng
              </span>
            </button>
          </div>
        </div>

        {/* Informational banner based on chosen result */}
        {result === 'PASSED' ? (
          <div style={{ padding: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CheckCircleIcon size={18} style={{ color: '#16a34a', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: '#166534', lineHeight: 1.5 }}>
              <strong>Tự động nhập kho:</strong> Khi xác nhận ĐẠT, hệ thống sẽ tự động tạo giao dịch tồn kho (Stock Transaction IMPORT) cho các mặt hàng được chấp nhận và cập nhật số lượng đã nhận trên Đơn mua hàng (PO).
            </div>
          </div>
        ) : (
          <div style={{ padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <AlertTriangleIcon size={18} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
            <div style={{ fontSize: 12, color: '#991b1b', lineHeight: 1.5 }}>
              <strong>Không nhập kho:</strong> Phiếu nhận hàng sẽ chuyển sang trạng thái <strong>QC_FAILED</strong>. Hàng hóa này sẽ <strong>KHÔNG</strong> được tăng tồn kho trong hệ thống.
            </div>
          </div>
        )}

        <div style={{ marginBottom: 16 }}>
          <label className="form-label">Ghi chú kiểm tra chất lượng</label>
          <textarea
            className="form-input"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Nhập nhận xét kiểm tra chất lượng, tình trạng bao bì, lý do từ chối (nếu có)..."
            disabled={isLoading}
            style={{ resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Đóng
          </Button>
          <Button
            type="submit"
            variant={result === 'PASSED' ? 'primary' : 'danger'}
            disabled={isLoading}
          >
            {isLoading ? 'Đang xử lý...' : result === 'PASSED' ? 'Xác nhận Đạt & Nhập kho' : 'Xác nhận Không đạt'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
