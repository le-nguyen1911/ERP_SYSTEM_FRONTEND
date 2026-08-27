const SO_STATUS_CONFIG = {
  DRAFT:            { label: 'Bản nháp',        bg: '#f1f5f9', color: '#475569', border: '#cbd5e1' },
  PENDING_APPROVAL: { label: 'Chờ duyệt',       bg: '#fffbeb', color: '#d97706', border: '#fcd34d' },
  APPROVED:         { label: 'Đã duyệt',         bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  CONFIRMED:        { label: 'Đã xác nhận',      bg: '#eff6ff', color: '#2563eb', border: '#93c5fd' },
  DELIVERED:        { label: 'Đã giao hàng',     bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
  REJECTED:         { label: 'Bị từ chối',       bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  CANCELLED:        { label: 'Đã huỷ',           bg: '#fef2f2', color: '#b91c1c', border: '#fca5a5' },
  CLOSED:           { label: 'Đã đóng',          bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
};

export function SalesOrderStatusBadge({ status }) {
  const cfg = SO_STATUS_CONFIG[status] || {
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
