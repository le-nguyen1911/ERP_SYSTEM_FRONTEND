import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';

function parseJsonValue(val) {
  if (!val) return null;
  try {
    if (typeof val === 'object') return val;
    return JSON.parse(val);
  } catch {
    return val;
  }
}

export function AuditLogDetailModal({ isOpen, onClose, auditLog }) {
  if (!isOpen || !auditLog) return null;

  const parsedOldValue = parseJsonValue(auditLog.oldValue);
  const parsedNewValue = parseJsonValue(auditLog.newValue);

  const action = auditLog.action;
  const actionBadge = {
    CREATE: { label: 'Tạo mới (CREATE)', variant: 'success' },
    UPDATE: { label: 'Cập nhật (UPDATE)', variant: 'info' },
    STATUS_CHANGE: { label: 'Đổi trạng thái (STATUS_CHANGE)', variant: 'warning' },
    DELETE: { label: 'Xóa (DELETE)', variant: 'danger' },
  }[action] || { label: action, variant: 'neutral' };

  const moduleColor = {
    PURCHASE: '#0284c7',
    INVENTORY: '#d97706',
    AUTH: '#7c3aed',
    USER: '#2563eb',
    SALES: '#16a34a',
    SYSTEM: '#4b5563',
  }[auditLog.module] || '#4b5563';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết Nhật ký Audit — #${auditLog.id?.slice(0, 8)}`}
      size="xl"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Metadata Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            padding: 16,
            backgroundColor: '#f8fafc',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            fontSize: 13,
          }}
        >
          <div>
            <span style={{ color: '#64748b', fontSize: 12 }}>Hành động:</span>
            <div style={{ marginTop: 4 }}>
              <Badge variant={actionBadge.variant}>{actionBadge.label}</Badge>
            </div>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: 12 }}>Phân hệ (Module):</span>
            <div style={{ marginTop: 4 }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  backgroundColor: `${moduleColor}15`,
                  color: moduleColor,
                }}
              >
                {auditLog.module}
              </span>
            </div>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: 12 }}>Đối tượng (Entity Type):</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: 4 }}>
              {auditLog.entityType}
            </div>
          </div>

          <div>
            <span style={{ color: '#64748b', fontSize: 12 }}>Thời gian thực hiện:</span>
            <div style={{ fontWeight: 600, color: 'var(--color-text-main)', marginTop: 4 }}>
              {auditLog.createdAt ? new Date(auditLog.createdAt).toLocaleString('vi-VN') : '—'}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: '#64748b', fontSize: 12 }}>Mã đối tượng (Entity ID):</span>
            <div className="font-mono" style={{ fontSize: 12, color: '#334155', wordBreak: 'break-all', backgroundColor: '#fff', padding: '6px 10px', borderRadius: 4, border: '1px solid #e2e8f0', marginTop: 4 }}>
              {auditLog.entityId || '—'}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ color: '#64748b', fontSize: 12 }}>Người thực hiện (User ID):</span>
            <div className="font-mono" style={{ fontSize: 12, color: '#334155', wordBreak: 'break-all', backgroundColor: '#fff', padding: '6px 10px', borderRadius: 4, border: '1px solid #e2e8f0', marginTop: 4 }}>
              {auditLog.performedById === '00000000-0000-0000-0000-000000000000'
                ? 'SYSTEM (Hệ thống tự động)'
                : auditLog.performedById || '—'}
            </div>
          </div>
        </div>

        {/* Diff Section: Old Value vs New Value */}
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>
            Chi tiết thay đổi dữ liệu (Before / After Diff)
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>
            {/* Old Value Box */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#fee2e2',
                  borderBottom: '1px solid #fecaca',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#991b1b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Giá trị trước (Old Value / Before)</span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  backgroundColor: '#fff5f5',
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#7f1d1d',
                  maxHeight: 280,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {parsedOldValue
                  ? typeof parsedOldValue === 'object'
                    ? JSON.stringify(parsedOldValue, null, 2)
                    : String(parsedOldValue)
                  : '(Không có dữ liệu trước / NULL)'}
              </pre>
            </div>

            {/* New Value Box */}
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
              <div
                style={{
                  padding: '8px 12px',
                  backgroundColor: '#dcfce7',
                  borderBottom: '1px solid #bbf7d0',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Giá trị sau (New Value / After)</span>
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 12,
                  backgroundColor: '#f0fdf4',
                  fontSize: 12,
                  fontFamily: 'ui-monospace, monospace',
                  color: '#14532d',
                  maxHeight: 280,
                  overflowY: 'auto',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {parsedNewValue
                  ? typeof parsedNewValue === 'object'
                    ? JSON.stringify(parsedNewValue, null, 2)
                    : String(parsedNewValue)
                  : '(Không có dữ liệu sau / NULL)'}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
