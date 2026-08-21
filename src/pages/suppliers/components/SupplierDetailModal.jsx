import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  BuildingIcon,
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  StarIcon,
  EditIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../../../components/ui/Icons';

function formatDateTime(val) {
  if (!val) return '—';
  return new Date(val).toLocaleString('vi-VN');
}

function RatingBadge({ rating }) {
  const colorMap = {
    'A+': { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
    'A': { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
    'B': { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
    'C': { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
    'D': { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  };

  const style = colorMap[rating] || colorMap['B'];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      <StarIcon size={11} /> {rating || 'B'}
    </span>
  );
}

function StatusBadge({ status }) {
  const isActive = status === 'ACTIVE';
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: isActive ? 'var(--color-success-light)' : 'var(--color-danger-light)',
        color: isActive ? 'var(--color-success)' : 'var(--color-danger)',
        fontSize: 11,
        fontWeight: 700,
      }}
    >
      {isActive ? <CheckCircleIcon size={11} /> : <XCircleIcon size={11} />}
      {isActive ? 'Đang hợp tác' : 'Ngừng hợp tác'}
    </span>
  );
}

export function SupplierDetailModal({ isOpen, onClose, supplier, onEdit, canEdit }) {
  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BuildingIcon size={20} className="text-primary" />
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{supplier.supplierName}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
              Mã: {supplier.supplierCode}
            </div>
          </div>
        </div>
      }
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Top Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', backgroundColor: '#f8fafc', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Xếp hạng:</span>
            <RatingBadge rating={supplier.rating} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-secondary)' }}>Trạng thái:</span>
            <StatusBadge status={supplier.status} />
          </div>
          {supplier.taxId && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginLeft: 'auto' }}>
              <span style={{ color: 'var(--color-text-secondary)' }}>MST:</span>
              <strong style={{ fontFamily: 'monospace' }}>{supplier.taxId}</strong>
            </div>
          )}
        </div>

        {/* Section: Contact & Location */}
        <div>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserIcon size={15} /> THÔNG TIN LIÊN HỆ & ĐỊA ĐIỂM
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12, fontSize: 13 }}>
            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Người liên hệ</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <UserIcon size={14} /> {supplier.contactPerson}
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Email</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MailIcon size={14} /> {supplier.email}
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Số điện thoại</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <PhoneIcon size={14} /> {supplier.phone}
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Khu vực</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPinIcon size={14} /> {supplier.city ? `${supplier.city}, ` : ''}{supplier.country || 'Việt Nam'}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1', padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Địa chỉ cụ thể</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {supplier.address}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Banking & Payment Terms */}
        <div style={{ paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCardIcon size={15} /> TÀI KHOẢN NGÂN HÀNG & ĐIỀU KHOẢN
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13 }}>
            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Ngân hàng</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {supplier.bankName || 'Chưa cập nhật'}
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Số tài khoản</div>
              <div style={{ fontWeight: 700, color: 'var(--color-text-main)', fontFamily: 'monospace' }}>
                {supplier.bankAccountNo || 'Chưa cập nhật'}
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Chủ tài khoản</div>
              <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                {supplier.bankAccountHolder || 'Chưa cập nhật'}
              </div>
            </div>

            <div style={{ padding: 12, backgroundColor: '#f8fafc', borderRadius: 'var(--radius-sm)' }}>
              <div style={{ color: 'var(--color-text-muted)', fontSize: 11, marginBottom: 2 }}>Điều khoản thanh toán</div>
              <div style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                {supplier.paymentTerms || 'NET 30'}
              </div>
            </div>
          </div>
        </div>

        {/* Section: Audit timestamps */}
        <div style={{ display: 'flex', gap: 24, fontSize: 12, color: 'var(--color-text-muted)', paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <div><strong>Ngày tạo:</strong> {formatDateTime(supplier.createdAt)}</div>
          <div><strong>Cập nhật lần cuối:</strong> {formatDateTime(supplier.updatedAt)}</div>
        </div>
      </div>

      <div className="modal-footer" style={{ margin: '20px -20px -20px -20px', paddingTop: 16 }}>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
        {canEdit && (
          <Button
            variant="primary"
            icon={<EditIcon size={14} />}
            onClick={() => {
              onClose();
              onEdit(supplier);
            }}
          >
            Chỉnh sửa
          </Button>
        )}
      </div>
    </Modal>
  );
}
