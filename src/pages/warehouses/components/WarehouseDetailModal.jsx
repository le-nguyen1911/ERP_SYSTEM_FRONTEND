import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  WarehouseIcon,
  MapPinIcon,
  EditIcon,
  TrashIcon,
} from '../../../components/ui/Icons';

export function WarehouseDetailModal({
  isOpen,
  onClose,
  warehouse,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}) {
  if (!warehouse) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết kho hàng"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: warehouse.active ? 'var(--color-primary-light)' : '#f1f5f9',
              color: warehouse.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <WarehouseIcon size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                {warehouse.name}
              </h3>
              {warehouse.active ? (
                <Badge variant="success" size="sm">Đang hoạt động</Badge>
              ) : (
                <Badge variant="danger" size="sm">Ngừng hoạt động</Badge>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Mã định danh ID: <code className="font-mono">{warehouse.id}</code>
            </span>
          </div>
        </div>

        {/* Warehouse Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Vị trí / Địa chỉ kho
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4, color: 'var(--color-text-main)', fontSize: 14 }}>
              <MapPinIcon size={16} className="text-muted" />
              <span>{warehouse.location || 'Chưa cập nhật địa chỉ'}</span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mô tả chi tiết
            </span>
            <div
              style={{
                fontSize: 13,
                color: warehouse.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                marginTop: 4,
                lineHeight: 1.6,
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              {warehouse.description || 'Không có mô tả cho kho này.'}
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
                    onEdit(warehouse);
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
                    onDelete(warehouse);
                  }}
                >
                  Ngừng hoạt động / Xóa
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
