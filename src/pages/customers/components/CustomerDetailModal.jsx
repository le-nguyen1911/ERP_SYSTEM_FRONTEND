import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import {
  UserIcon,
  MailIcon,
  PhoneIcon,
  MapPinIcon,
  CreditCardIcon,
  CalendarIcon,
} from '../../../components/ui/Icons';

export function CustomerDetailModal({ isOpen, onClose, customer }) {
  if (!isOpen || !customer) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Chi tiết Khách hàng — ${customer.customerCode}`}
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Summary Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: 16,
            backgroundColor: '#f8fafc',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-text-main)' }}>
              {customer.customerName}
            </div>
            <div className="font-mono" style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Mã KH: <strong>{customer.customerCode}</strong>
            </div>
          </div>
          <div>
            {customer.status === 'ACTIVE' ? (
              <Badge variant="success">ĐANG HOẠT ĐỘNG</Badge>
            ) : (
              <Badge variant="neutral">NGƯNG HOẠT ĐỘNG</Badge>
            )}
          </div>
        </div>

        {/* Details Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 16,
            fontSize: 13,
          }}
        >
          {/* Contact Info */}
          <div style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserIcon size={16} /> Thông tin liên hệ
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ color: '#64748b' }}>Người liên hệ: </span>
                <strong>{customer.contactPerson || '—'}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MailIcon size={14} style={{ color: '#64748b' }} />
                <span>{customer.email || '—'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PhoneIcon size={14} style={{ color: '#64748b' }} />
                <span>{customer.phone || '—'}</span>
              </div>
            </div>
          </div>

          {/* Address & Location */}
          <div style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPinIcon size={16} /> Địa chỉ & Khu vực
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ color: '#64748b' }}>Địa chỉ: </span>
                <strong>{customer.address || '—'}</strong>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Thành phố: </span>
                <span>{customer.city || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Quốc gia: </span>
                <span>{customer.country || '—'}</span>
              </div>
            </div>
          </div>

          {/* Business & Payment Terms */}
          <div style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CreditCardIcon size={16} /> Pháp lý & Thanh toán
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ color: '#64748b' }}>Mã số thuế (Tax ID): </span>
                <span className="font-mono">{customer.taxId || '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Điều khoản thanh toán: </span>
                <span style={{ fontWeight: 600, color: '#0369a1' }}>{customer.paymentTerms || '—'}</span>
              </div>
            </div>
          </div>

          {/* System & Audit Info */}
          <div style={{ padding: 14, border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <CalendarIcon size={16} /> Thời gian & Hệ thống
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div>
                <span style={{ color: '#64748b' }}>Ngày tạo: </span>
                <span>{customer.createdAt ? new Date(customer.createdAt).toLocaleString('vi-VN') : '—'}</span>
              </div>
              <div>
                <span style={{ color: '#64748b' }}>Cập nhật lần cuối: </span>
                <span>{customer.updatedAt ? new Date(customer.updatedAt).toLocaleString('vi-VN') : '—'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
