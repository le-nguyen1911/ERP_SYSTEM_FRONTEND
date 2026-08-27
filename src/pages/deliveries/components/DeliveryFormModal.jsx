import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { salesOrderApi } from '../../../api/salesOrderApi';
import { XIcon, TruckIcon, PackageIcon, AlertTriangleIcon } from '../../../components/ui/Icons';
import { Button } from '../../../components/ui/Button';

export function DeliveryFormModal({ isOpen, onClose, onSubmit, isLoading }) {
  const [selectedSoId, setSelectedSoId] = useState('');
  const [itemInputs, setItemInputs] = useState({}); // { [soItemId]: { quantityDelivered, batchNumber, notes } }
  const [validationError, setValidationError] = useState('');

  // 1. Fetch eligible Sales Orders (CONFIRMED and DELIVERED)
  const { data: confirmedSoData } = useQuery({
    queryKey: ['so-eligible-for-delivery-confirmed'],
    queryFn: () => salesOrderApi.searchSalesOrders({ status: 'CONFIRMED', page: 0, size: 100 }),
    enabled: isOpen,
  });

  const { data: deliveredSoData } = useQuery({
    queryKey: ['so-eligible-for-delivery-delivered'],
    queryFn: () => salesOrderApi.searchSalesOrders({ status: 'DELIVERED', page: 0, size: 100 }),
    enabled: isOpen,
  });

  const eligibleSOs = useMemo(() => {
    const list1 = confirmedSoData?.data?.content || [];
    const list2 = deliveredSoData?.data?.content || [];
    const combined = [...list1, ...list2];
    const seen = new Set();
    return combined.filter((so) => {
      if (seen.has(so.id)) return false;
      seen.add(so.id);
      return true;
    });
  }, [confirmedSoData, deliveredSoData]);

  // 2. Fetch selected SO detail with items
  const { data: soDetailData, isLoading: isSoLoading } = useQuery({
    queryKey: ['so-detail-for-delivery', selectedSoId],
    queryFn: () => salesOrderApi.getSalesOrderById(selectedSoId),
    enabled: isOpen && Boolean(selectedSoId),
  });

  const soDetail = soDetailData?.data;

  // Compute default inputs per item
  const defaultItemInputs = useMemo(() => {
    if (!soDetail?.items) return {};
    const defaults = {};
    soDetail.items.forEach((item) => {
      const ordered = parseFloat(item.quantity) || 0;
      const delivered = parseFloat(item.deliveredQuantity) || 0;
      const remaining = Math.max(0, ordered - delivered);

      defaults[item.id] = {
        quantityDelivered: remaining,
        batchNumber: '',
        notes: '',
      };
    });
    return defaults;
  }, [soDetail]);

  function getItemInput(item) {
    return (
      itemInputs[item.id] ??
      defaultItemInputs[item.id] ?? {
        quantityDelivered: 0,
        batchNumber: '',
        notes: '',
      }
    );
  }

  function handleInputChange(itemId, field, value) {
    setItemInputs((prev) => {
      const current = prev[itemId] ?? defaultItemInputs[itemId] ?? {
        quantityDelivered: 0,
        batchNumber: '',
        notes: '',
      };
      return {
        ...prev,
        [itemId]: {
          ...current,
          [field]: value,
        },
      };
    });
  }

  function handleSelectSo(soId) {
    setSelectedSoId(soId);
    setItemInputs({});
    setValidationError('');
  }

  function handleClose() {
    setSelectedSoId('');
    setItemInputs({});
    setValidationError('');
    onClose();
  }

  function handleSubmit(e) {
    e.preventDefault();
    setValidationError('');

    if (!selectedSoId) {
      setValidationError('Vui lòng chọn Đơn bán hàng.');
      return;
    }

    if (!soDetail?.items || soDetail.items.length === 0) {
      setValidationError('Đơn bán hàng này không có sản phẩm.');
      return;
    }

    const deliverItems = [];

    for (const item of soDetail.items) {
      const input = getItemInput(item);
      const qty = parseFloat(input.quantityDelivered) || 0;
      const ordered = parseFloat(item.quantity) || 0;
      const delivered = parseFloat(item.deliveredQuantity) || 0;
      const remaining = Math.max(0, ordered - delivered);

      if (qty < 0) {
        setValidationError(`Số lượng giao của "${item.productName}" không được âm.`);
        return;
      }

      if (qty > remaining) {
        setValidationError(
          `Số lượng giao của "${item.productName}" (${qty}) vượt quá số lượng còn lại có thể giao (${remaining}).`
        );
        return;
      }

      if (qty > 0) {
        deliverItems.push({
          salesOrderItemId: item.id,
          quantityDelivered: qty,
          batchNumber: input.batchNumber?.trim() || null,
          notes: input.notes?.trim() || null,
        });
      }
    }

    if (deliverItems.length === 0) {
      setValidationError('Vui lòng nhập số lượng giao lớn hơn 0 cho ít nhất 1 sản phẩm.');
      return;
    }

    onSubmit({
      salesOrderId: selectedSoId,
      items: deliverItems,
    });
  }

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9997, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={handleClose} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900,
        marginTop: 20, marginBottom: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TruckIcon size={22} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              Tạo phiếu giao hàng (Outbound Delivery)
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              Xuất kho và giao hàng theo Đơn bán hàng đã xác nhận
            </p>
          </div>
          <button onClick={handleClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 8 }}>
            <XIcon size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ padding: '24px 28px' }}>
            {validationError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangleIcon size={16} />
                <span>{validationError}</span>
              </div>
            )}

            {/* Sales Order Selection */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 8 }}>
                Chọn đơn bán hàng (Sales Order) <span style={{ color: '#dc2626' }}>*</span>
              </label>
              <select
                value={selectedSoId}
                onChange={(e) => handleSelectSo(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, background: '#fff' }}
              >
                <option value="">-- Chọn đơn bán hàng (CONFIRMED / DELIVERED) --</option>
                {eligibleSOs.map((so) => (
                  <option key={so.id} value={so.id}>
                    {so.soNumber} — {so.customerName || 'Khách hàng'} ({so.status})
                  </option>
                ))}
              </select>

              {soDetail && (
                <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, fontSize: 13, background: '#fff', padding: '14px 18px', borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <div><strong>Khách hàng:</strong> {soDetail.customer?.customerName}</div>
                  <div><strong>Mã KH:</strong> {soDetail.customer?.customerCode}</div>
                  <div><strong>Tiền tệ:</strong> {soDetail.currency}</div>
                  <div><strong>Địa chỉ giao:</strong> {soDetail.shippingAddress || '—'}</div>
                </div>
              )}
            </div>

            {/* Items Section */}
            {selectedSoId && (
              <div>
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 700, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <PackageIcon size={16} /> Danh sách sản phẩm xuất giao
                </h4>

                {isSoLoading ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#64748b' }}>Đang tải danh sách sản phẩm...</div>
                ) : !soDetail?.items || soDetail.items.length === 0 ? (
                  <div style={{ padding: 24, textAlign: 'center', color: '#94a3b8' }}>Đơn hàng không có sản phẩm</div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Sản phẩm', 'Đã đặt', 'Đã giao', 'Còn lại', 'SL giao lần này', 'Số lô (Batch)', 'Ghi chú'].map((h) => (
                            <th key={h} style={{
                              padding: '10px 12px', textAlign: h.startsWith('SL') || h === 'Đã đặt' || h === 'Đã giao' || h === 'Còn lại' ? 'center' : 'left',
                              fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase',
                            }}>
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {soDetail.items.map((item, i) => {
                          const input = getItemInput(item);
                          const ordered = parseFloat(item.quantity) || 0;
                          const delivered = parseFloat(item.deliveredQuantity) || 0;
                          const remaining = Math.max(0, ordered - delivered);

                          return (
                            <tr key={item.id} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                              <td style={{ padding: '10px 12px' }}>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>
                                  [{item.productCode}] {item.productName}
                                </div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>ĐVT: {item.productUnit}</div>
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                                {ordered.toLocaleString('vi-VN')}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', color: '#64748b' }}>
                                {delivered.toLocaleString('vi-VN')}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: remaining > 0 ? '#0284c7' : '#16a34a' }}>
                                {remaining.toLocaleString('vi-VN')}
                              </td>
                              <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                                <input
                                  type="number"
                                  step="0.0001"
                                  min="0"
                                  max={remaining}
                                  value={input.quantityDelivered}
                                  onChange={(e) => handleInputChange(item.id, 'quantityDelivered', e.target.value)}
                                  disabled={remaining <= 0}
                                  style={{
                                    width: 80, padding: '6px 8px', textAlign: 'center',
                                    border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13,
                                    background: remaining <= 0 ? '#f1f5f9' : '#fff',
                                  }}
                                />
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <input
                                  type="text"
                                  placeholder="VD: LOT-2026"
                                  value={input.batchNumber}
                                  onChange={(e) => handleInputChange(item.id, 'batchNumber', e.target.value)}
                                  disabled={remaining <= 0}
                                  style={{ width: 100, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                                />
                              </td>
                              <td style={{ padding: '10px 12px' }}>
                                <input
                                  type="text"
                                  placeholder="Ghi chú dòng..."
                                  value={input.notes}
                                  onChange={(e) => handleInputChange(item.id, 'notes', e.target.value)}
                                  disabled={remaining <= 0}
                                  style={{ width: 120, padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="outline" type="button" onClick={handleClose} disabled={isLoading}>
              Huỷ bỏ
            </Button>
            <button
              type="submit"
              disabled={isLoading || !selectedSoId}
              style={{
                padding: '9px 24px',
                background: 'linear-gradient(135deg,#0284c7,#0369a1)',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 14,
                cursor: isLoading || !selectedSoId ? 'not-allowed' : 'pointer',
                opacity: isLoading || !selectedSoId ? 0.7 : 1,
              }}
            >
              {isLoading ? 'Đang tạo...' : 'Tạo phiếu giao hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
