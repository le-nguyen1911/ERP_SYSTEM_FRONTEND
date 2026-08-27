const DELIVERY_STATUS_CONFIG = {
  DRAFT:     { label: 'Bản nháp / Chờ xuất', bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  EXPORTED:  { label: 'Đã xuất kho',         bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  DELIVERED: { label: 'Đã giao hàng',        bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  CANCELLED: { label: 'Đã huỷ',              bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
};

const EXPORT_STATUS_CONFIG = {
  PENDING: { label: 'Chờ xuất kho', bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  SUCCESS: { label: 'Xuất kho thành công', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  FAILED:  { label: 'Lỗi xuất kho', bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
};

export function DeliveryStatusBadge({ status }) {
  const cfg = DELIVERY_STATUS_CONFIG[status] || {
    label: status, bg: '#f1f5f9', color: '#475569', border: '#cbd5e1',
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

export function InventoryExportBadge({ status }) {
  const cfg = EXPORT_STATUS_CONFIG[status] || {
    label: status || 'Chưa có', bg: '#f8fafc', color: '#64748b', border: '#e2e8f0',
  };
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '2px 8px',
      borderRadius: 12,
      fontSize: 11,
      fontWeight: 600,
      backgroundColor: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}
