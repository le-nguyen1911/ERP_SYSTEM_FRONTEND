import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  PackageIcon,
  TagIcon,
  ScaleIcon,
  EditIcon,
  TrashIcon,
} from '../../../components/ui/Icons';

export function ProductDetailModal({
  isOpen,
  onClose,
  product,
  onEdit,
  onDeactivate,
  onActivate,
  canUpdate,
  canDelete,
}) {
  if (!product) return null;

  // Format currency VND
  const formattedPrice = new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(product.price || 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết sản phẩm"
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
              backgroundColor: product.active ? 'var(--color-primary-light)' : '#f1f5f9',
              color: product.active ? 'var(--color-primary)' : 'var(--color-text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <PackageIcon size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                {product.name}
              </h3>
              {product.active ? (
                <Badge variant="success" size="sm">Đang kinh doanh</Badge>
              ) : (
                <Badge variant="danger" size="sm">Ngừng kinh doanh</Badge>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Mã sản phẩm: <code className="font-mono" style={{ fontWeight: 700, color: 'var(--color-primary)' }}>{product.code}</code>
            </span>
          </div>
        </div>

        {/* Product Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Danh mục hàng hóa
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <TagIcon size={14} className="text-muted" />
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: 13 }}>
                {product.category?.name || '—'}
              </span>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Đơn vị tính
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <ScaleIcon size={14} className="text-muted" />
              <span style={{ fontWeight: 600, color: 'var(--color-text-main)', fontSize: 13 }}>
                {product.unit?.name || '—'}
              </span>
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Đơn giá niêm yết
            </span>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
              {formattedPrice}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mô tả chi tiết
            </span>
            <div
              style={{
                fontSize: 13,
                color: product.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                marginTop: 4,
                lineHeight: 1.6,
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                whiteSpace: 'pre-wrap',
              }}
            >
              {product.description || 'Không có mô tả chi tiết cho sản phẩm này.'}
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
                    onEdit(product);
                  }}
                >
                  Chỉnh sửa
                </Button>
              )}
              {canDelete && product.active && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  icon={<TrashIcon size={14} />}
                  onClick={() => {
                    onClose();
                    onDeactivate(product);
                  }}
                >
                  Ngừng kinh doanh
                </Button>
              )}
              {canUpdate && !product.active && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    onClose();
                    onActivate(product);
                  }}
                >
                  Kinh doanh lại
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
