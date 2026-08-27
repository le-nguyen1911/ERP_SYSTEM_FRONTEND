import { XIcon, TruckIcon, UserIcon, PackageIcon, AlertTriangleIcon } from '../../../components/ui/Icons';
import { DeliveryStatusBadge, InventoryExportBadge } from './DeliveryStatusBadge';
import { Button } from '../../../components/ui/Button';

function fmtDt(val) {
  return val ? new Date(val).toLocaleString('vi-VN') : '—';
}

function DetailField({ label, value, span }) {
  return (
    <div style={{ gridColumn: span ? `span ${span}` : undefined }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500 }}>
        {value || '—'}
      </div>
    </div>
  );
}

export function DeliveryDetailModal({ delivery, onClose, onRetryExport, onMarkDelivered, onCancel, canCreate, canExport }) {
  if (!delivery) return null;

  const items = delivery.items || [];
  const isFailedExport = delivery.inventoryExportStatus === 'FAILED';
  const isExported = delivery.status === 'EXPORTED';
  const isDraft = delivery.status === 'DRAFT';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 860,
        maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ position: 'sticky', top: 0, background: '#fff', zIndex: 10, padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <TruckIcon size={22} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>{delivery.deliveryNumber}</h2>
              <DeliveryStatusBadge status={delivery.status} />
              <InventoryExportBadge status={delivery.inventoryExportStatus} />
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              Phiếu giao hàng theo đơn bán hàng: <strong>{delivery.soNumber}</strong>
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 8 }}>
            <XIcon size={20} />
          </button>
        </div>

        <div style={{ padding: '24px 28px' }}>
          {/* Export Error Alert if failed */}
          {isFailedExport && (
            <div style={{
              background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12,
              padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 12,
            }}>
              <AlertTriangleIcon size={20} style={{ color: '#dc2626', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, color: '#dc2626' }}>
                  Lỗi xuất kho tự động
                </h4>
                <p style={{ margin: 0, fontSize: 13, color: '#991b1b', lineHeight: 1.4 }}>
                  {delivery.inventoryErrorMessage || 'Không đủ tồn kho hoặc có lỗi trong quá trình xuất kho.'}
                </p>
                {delivery.lastInventoryRetryAt && (
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#b91c1c' }}>
                    Thử lại lần cuối: {fmtDt(delivery.lastInventoryRetryAt)}
                  </p>
                )}
              </div>
              {canExport && (
                <button
                  onClick={() => onRetryExport(delivery)}
                  style={{
                    padding: '6px 14px', borderRadius: 8, background: '#dc2626', color: '#fff',
                    border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  Thử lại xuất kho
                </button>
              )}
            </div>
          )}

          {/* Cancellation reason if cancelled */}
          {delivery.rejectionReason && (
            <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 12, padding: '14px 18px', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#b91c1c' }}>
                <strong>Lý do huỷ:</strong> {delivery.rejectionReason}
              </p>
            </div>
          )}

          {/* Customer & Delivery metadata */}
          <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              <UserIcon size={14} /> Thông tin giao hàng & khách hàng
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              <DetailField label="Khách hàng" value={delivery.customer?.customerName} />
              <DetailField label="Mã khách hàng" value={delivery.customer?.customerCode} />
              <DetailField label="Số đơn bán hàng" value={delivery.soNumber} />
              <DetailField label="Ngày tạo phiếu" value={fmtDt(delivery.deliveryDate)} />
              <DetailField label="Trạng thái xuất kho" value={delivery.inventoryExportStatus} />
              <DetailField label="Trạng thái phiếu" value={delivery.status} />
            </div>
          </div>

          {/* Items table */}
          <div style={{ marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              <PackageIcon size={14} /> Danh sách sản phẩm xuất giao ({items.length})
            </h4>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['#', 'Tên sản phẩm', 'Số lượng giao', 'Số lô (Batch)', 'Ghi chú'].map((h) => (
                      <th key={h} style={{
                        padding: '10px 14px', textAlign: h === '#' || h === 'Số lượng giao' ? 'center' : 'left',
                        fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em',
                      }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>
                        Không có sản phẩm
                      </td>
                    </tr>
                  ) : items.map((item, i) => (
                    <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: '#94a3b8' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600, color: '#1e293b' }}>
                        {item.productName || 'Sản phẩm'}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, color: '#0284c7' }}>
                        {Number(item.quantityDelivered).toLocaleString('vi-VN')}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: '#64748b' }}>
                        {item.batchNumber || '—'}
                      </td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>
                        {item.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Timestamps */}
          <div style={{ marginTop: 16, display: 'flex', gap: 24, fontSize: 12, color: '#94a3b8' }}>
            <span>Tạo lúc: {fmtDt(delivery.createdAt)}</span>
            <span>Cập nhật: {fmtDt(delivery.updatedAt)}</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          {canCreate && isDraft && (
            <Button variant="outline" onClick={() => onCancel(delivery)} style={{ color: '#dc2626', borderColor: '#fca5a5' }}>
              Huỷ phiếu
            </Button>
          )}

          {canExport && isFailedExport && (
            <button
              onClick={() => onRetryExport(delivery)}
              style={{
                padding: '9px 20px', borderRadius: 8, background: '#ea580c', color: '#fff',
                border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Thử lại xuất kho
            </button>
          )}

          {canCreate && isExported && (
            <button
              onClick={() => onMarkDelivered(delivery)}
              style={{
                padding: '9px 20px', borderRadius: 8, background: '#16a34a', color: '#fff',
                border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}
            >
              Xác nhận đã giao hàng
            </button>
          )}

          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </div>
  );
}
