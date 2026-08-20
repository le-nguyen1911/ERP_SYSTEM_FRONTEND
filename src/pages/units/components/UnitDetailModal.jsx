import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ScaleIcon, EditIcon, TrashIcon } from '../../../components/ui/Icons';

export function UnitDetailModal({
  isOpen,
  onClose,
  unit,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}) {
  if (!unit) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết đơn vị tính"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Icon + Name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ScaleIcon size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
              {unit.name}
            </h3>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Mã định danh ID: <code className="font-mono">{unit.id}</code>
            </span>
          </div>
        </div>

        {/* Content details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tên đơn vị tính
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-main)', marginTop: 4 }}>
              {unit.name}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mô tả chi tiết
            </span>
            <div
              style={{
                fontSize: 13,
                color: unit.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                marginTop: 4,
                lineHeight: 1.6,
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              {unit.description || 'Không có mô tả cho đơn vị tính này.'}
            </div>
          </div>
        </div>

        {/* Quick action toolbar */}
        {(canUpdate || canDelete) && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Thao tác nhanh:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {canUpdate && (
                <Button
                  variant="outline"
                  size="sm"
                  icon={<EditIcon size={14} />}
                  onClick={() => {
                    onClose();
                    onEdit(unit);
                  }}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  icon={<TrashIcon size={14} />}
                  onClick={() => {
                    onClose();
                    onDelete(unit);
                  }}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
