import { XIcon, ClipboardIcon, UserIcon } from '../../../components/ui/Icons';
import { SalesOrderStatusBadge } from './SalesOrderStatusBadge';
import { Button } from '../../../components/ui/Button';

function fmt(val) { return val ? new Date(val).toLocaleDateString('vi-VN') : '—'; }
function fmtDt(val) { return val ? new Date(val).toLocaleString('vi-VN') : '—'; }
function fmtMoney(val, cur = 'VND') {
  if (val == null) return '—';
  return Number(val).toLocaleString('vi-VN', { style: 'currency', currency: cur });
}

function DetailField({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>{value || '—'}</div>
    </div>
  );
}

export function SalesOrderDetailModal({ so, onClose }) {
  if (!so) return null;

  const items = so.items || [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860,
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ClipboardIcon size={22} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{so.soNumber}</h2>
              <SalesOrderStatusBadge status={so.status} />
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>Chi tiết đơn bán hàng</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 8 }}><XIcon size={20} /></button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Customer & Warehouse */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserIcon size={14} /> Thông tin khách hàng & đơn hàng
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <DetailField label="Khách hàng" value={so.customer?.customerName} />
              <DetailField label="Mã KH" value={so.customer?.customerCode} />
              <DetailField label="Liên hệ" value={so.customer?.contactPerson} />
              <DetailField label="Số điện thoại" value={so.customer?.phone} />
              <DetailField label="Ngày đặt hàng" value={fmtDt(so.soDate)} />
              <DetailField label="Ngày giao hàng" value={fmt(so.deliveryDate)} />
              <DetailField label="Điều khoản TT" value={so.paymentTerms} />
              <DetailField label="Tiền tệ" value={so.currency} />
            </div>
            {so.shippingAddress && (
              <div style={{ marginTop: 12 }}>
                <DetailField label="Địa chỉ giao hàng" value={so.shippingAddress} span={3} />
              </div>
            )}
            {so.notes && (
              <div style={{ marginTop: 12 }}>
                <DetailField label="Ghi chú" value={so.notes} span={3} />
              </div>
            )}
          </div>

          {/* Approval / Rejection / Cancellation info */}
          {(so.rejectionReason || so.cancellationReason || so.approvalDate) && (
            <div style={{
              background: so.rejectionReason || so.cancellationReason ? '#fef2f2' : '#f0fdf4',
              borderRadius: 12, padding: '16px 20px', marginBottom: 20, border: `1px solid ${so.rejectionReason || so.cancellationReason ? '#fca5a5' : '#bbf7d0'}`,
            }}>
              {so.rejectionReason && <p style={{ margin: 0, fontSize: 13, color: '#dc2626' }}><strong>Lý do từ chối:</strong> {so.rejectionReason}</p>}
              {so.cancellationReason && <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}><strong>Lý do huỷ:</strong> {so.cancellationReason}</p>}
              {so.approvalDate && !so.rejectionReason && !so.cancellationReason && (
                <p style={{ margin: 0, fontSize: 13, color: '#059669' }}><strong>Duyệt lúc:</strong> {fmtDt(so.approvalDate)}</p>
              )}
            </div>
          )}

          {/* Items table */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Danh sách sản phẩm ({items.length})</h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Mã SP', 'Tên sản phẩm', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền', 'Trạng thái'].map((h) => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: h === '#' || h === 'SL' ? 'center' : 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan={8} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Không có sản phẩm</td></tr>
                  ) : items.map((item, i) => (
                    <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#94a3b8' }}>{item.lineNumber}</td>
                      <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: '#6366f1' }}>{item.productCode}</td>
                      <td style={{ padding: '10px 12px', fontWeight: 500, color: '#1e293b' }}>
                        {item.productName}
                        {item.description && <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{item.description}</div>}
                      </td>
                      <td style={{ padding: '10px 12px', color: '#64748b' }}>{item.productUnit}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600 }}>{Number(item.quantity).toLocaleString('vi-VN')}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>{fmtMoney(item.unitPrice)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#1e293b' }}>{fmtMoney(item.lineTotal)}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                          background: item.status === 'PENDING' ? '#fffbeb' : item.status === 'FULLY_DELIVERED' ? '#f0fdf4' : '#eff6ff',
                          color: item.status === 'PENDING' ? '#d97706' : item.status === 'FULLY_DELIVERED' ? '#16a34a' : '#2563eb',
                        }}>
                          {item.status === 'PENDING' ? 'Chờ xuất' : item.status === 'PARTIALLY_DELIVERED' ? 'Xuất 1 phần' : item.status === 'FULLY_DELIVERED' ? 'Đã xuất' : 'Đã huỷ'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', minWidth: 300, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['Tạm tính', fmtMoney(so.subtotal, so.currency)],
                  [`Thuế (${so.taxPercentage}%)`, fmtMoney(so.taxAmount, so.currency)],
                  ['Phí vận chuyển', fmtMoney(so.shippingCost, so.currency)],
                  ['Giảm giá', `- ${fmtMoney(so.discountAmount, so.currency)}`],
                ].map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 40, fontSize: 13, color: '#64748b' }}>
                    <span>{label}</span><span style={{ fontWeight: 500 }}>{val}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: '#e2e8f0', margin: '4px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 40, fontSize: 16, fontWeight: 700, color: '#1e293b' }}>
                  <span>Tổng cộng</span>
                  <span style={{ color: '#6366f1' }}>{fmtMoney(so.grandTotal, so.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ marginTop: 20, display: 'flex', gap: 24, fontSize: 12, color: '#94a3b8' }}>
            <span>Tạo lúc: {fmtDt(so.createdAt)}</span>
            <span>Cập nhật: {fmtDt(so.updatedAt)}</span>
          </div>
        </div>

        <div style={{ padding: '16px 28px 24px', display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
