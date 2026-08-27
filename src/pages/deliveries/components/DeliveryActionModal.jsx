import { useState } from 'react';
import { AlertTriangleIcon, XIcon } from '../../../components/ui/Icons';
import { Button } from '../../../components/ui/Button';

/**
 * Action modal for Delivery Cancellation collecting a required reason
 */
export function DeliveryActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Xác nhận',
  confirmColor = '#dc2626',
  isLoading = false,
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setReason('');
    setError('');
    onClose();
  };

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Vui lòng nhập lý do hủy');
      return;
    }
    onConfirm(reason.trim());
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={handleClose} />
      <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 32, width: '100%', maxWidth: 480, boxShadow: '0 25px 50px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <AlertTriangleIcon size={22} style={{ color: confirmColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#1e293b' }}>{title}</h3>
            {description && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#64748b', lineHeight: 1.5 }}>{description}</p>}
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <XIcon size={18} />
          </button>
        </div>

        {/* Reason input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
            Lý do hủy <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim()) setError('');
            }}
            placeholder="Nhập lý do hủy phiếu giao hàng..."
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${error ? '#dc2626' : '#e2e8f0'}`,
              borderRadius: 8,
              fontSize: 14,
              resize: 'vertical',
              fontFamily: 'inherit',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          {error && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{error}</p>}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Đóng
          </Button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            style={{
              padding: '9px 20px',
              borderRadius: 8,
              border: 'none',
              background: confirmColor,
              color: '#fff',
              fontWeight: 600,
              fontSize: 14,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Đang xử lý...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
