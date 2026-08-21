import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { purchaseOrderApi } from '../../../api/purchaseOrderApi';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { Alert } from '../../../components/ui/Alert';
import { AlertTriangleIcon } from '../../../components/ui/Icons';

export function GoodsReceiptFormModal({ isOpen, onClose, onSubmit, isLoading }) {
  // 1. All useState hooks declared at top level
  const [selectedPoId, setSelectedPoId] = useState('');
  const [itemInputs, setItemInputs] = useState({}); // { [poItemId]: { quantityAccepted, quantityRejected, batchNumber, expiryDate, notes } }
  const [validationError, setValidationError] = useState('');

  // 2. Fetch eligible POs (SENT_TO_SUPPLIER and GOODS_RECEIVED)
  const { data: sentPoData, isLoading: isSentLoading } = useQuery({
    queryKey: ['po-eligible-for-gr-sent'],
    queryFn: () => purchaseOrderApi.searchPurchaseOrders({ status: 'SENT_TO_SUPPLIER', page: 0, size: 100 }),
    enabled: isOpen,
  });

  const { data: receivedPoData, isLoading: isReceivedLoading } = useQuery({
    queryKey: ['po-eligible-for-gr-received'],
    queryFn: () => purchaseOrderApi.searchPurchaseOrders({ status: 'GOODS_RECEIVED', page: 0, size: 100 }),
    enabled: isOpen,
  });

  // Combine eligible POs
  const eligiblePOs = useMemo(() => {
    const sentList = sentPoData?.data?.content || [];
    const recList = receivedPoData?.data?.content || [];
    const combined = [...sentList, ...recList];
    // Deduplicate by ID just in case
    const seen = new Set();
    return combined.filter((po) => {
      if (seen.has(po.id)) return false;
      seen.add(po.id);
      return true;
    });
  }, [sentPoData, receivedPoData]);

  // 3. Fetch full PO detail when a PO is selected
  const {
    data: poDetailData,
    isLoading: isPoDetailLoading,
    isError: isPoDetailError,
    error: poDetailError,
  } = useQuery({
    queryKey: ['po-detail-for-gr', selectedPoId],
    queryFn: () => purchaseOrderApi.getPurchaseOrderById(selectedPoId),
    enabled: isOpen && Boolean(selectedPoId),
  });

  const poDetail = poDetailData?.data;

  // Derived initial inputs per item
  const defaultItemInputs = useMemo(() => {
    if (!poDetail?.items) return {};
    const defaults = {};
    poDetail.items.forEach((item) => {
      const ordered = parseFloat(item.quantity) || 0;
      const received = parseFloat(item.receivedQuantity) || 0;
      const rejected = parseFloat(item.rejectedQuantity) || 0;
      const remaining = Math.max(0, ordered - received - rejected);

      defaults[item.id] = {
        quantityAccepted: remaining,
        quantityRejected: 0,
        batchNumber: '',
        expiryDate: '',
        notes: '',
      };
    });
    return defaults;
  }, [poDetail]);

  function getItemInput(item) {
    return itemInputs[item.id] ?? defaultItemInputs[item.id] ?? {
      quantityAccepted: 0,
      quantityRejected: 0,
      batchNumber: '',
      expiryDate: '',
      notes: '',
    };
  }

  function handleSelectPo(poId) {
    setSelectedPoId(poId);
    setItemInputs({});
    setValidationError('');
  }

  function handleClose() {
    setSelectedPoId('');
    setItemInputs({});
    setValidationError('');
    onClose();
  }

  function handleItemChange(itemId, field, value) {
    const current = itemInputs[itemId] ?? defaultItemInputs[itemId] ?? {
      quantityAccepted: 0,
      quantityRejected: 0,
      batchNumber: '',
      expiryDate: '',
      notes: '',
    };
    setItemInputs((prev) => ({
      ...prev,
      [itemId]: {
        ...current,
        [field]: value,
      },
    }));
    setValidationError('');
  }

  function getTomorrowStr() {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!selectedPoId) {
      setValidationError('Vui lòng chọn đơn mua hàng (PO) cần nhận hàng.');
      return;
    }

    if (!poDetail?.items || poDetail.items.length === 0) {
      setValidationError('Đơn hàng không có sản phẩm nào.');
      return;
    }

    const itemsToSubmit = [];
    const tomorrowStr = getTomorrowStr();

    for (const poItem of poDetail.items) {
      const input = getItemInput(poItem);
      const accepted = parseFloat(input.quantityAccepted) || 0;
      const rejected = parseFloat(input.quantityRejected) || 0;
      const totalClaim = accepted + rejected;

      if (accepted < 0 || rejected < 0) {
        setValidationError(`Số lượng nhận của sản phẩm "${poItem.productName}" không được âm.`);
        return;
      }

      const ordered = parseFloat(poItem.quantity) || 0;
      const prevReceived = parseFloat(poItem.receivedQuantity) || 0;
      const prevRejected = parseFloat(poItem.rejectedQuantity) || 0;
      const remaining = Math.max(0, ordered - prevReceived - prevRejected);

      if (totalClaim > remaining) {
        setValidationError(
          `Tổng số lượng nhận (${totalClaim}) của sản phẩm "${poItem.productName}" vượt quá số lượng còn lại (${remaining}).`
        );
        return;
      }

      if (input.expiryDate && input.expiryDate < tomorrowStr) {
        setValidationError(`Hạn sử dụng của sản phẩm "${poItem.productName}" phải là ngày trong tương lai.`);
        return;
      }

      // Only include items where at least one unit is being received/rejected
      if (totalClaim > 0) {
        itemsToSubmit.push({
          purchaseOrderItemId: poItem.id,
          quantityAccepted: accepted,
          quantityRejected: rejected,
          batchNumber: input.batchNumber?.trim() || undefined,
          expiryDate: input.expiryDate || undefined,
          notes: input.notes?.trim() || undefined,
        });
      }
    }

    if (itemsToSubmit.length === 0) {
      setValidationError('Vui lòng nhập số lượng nhận cho ít nhất 1 sản phẩm.');
      return;
    }

    onSubmit({
      purchaseOrderId: selectedPoId,
      items: itemsToSubmit,
    });
  }

  const isPoListLoading = isSentLoading || isReceivedLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo Phiếu nhận hàng (Goods Receipt)"
      size="xl"
    >
      <form onSubmit={handleSubmit}>
        {/* PO Selection Section */}
        <div style={{ marginBottom: 20 }}>
          <label className="form-label" style={{ fontWeight: 600 }}>
            Chọn Đơn mua hàng (PO) cần nhận hàng <span style={{ color: '#e53e3e' }}>*</span>
          </label>
          <select
            className="form-input"
            value={selectedPoId}
            onChange={(e) => handleSelectPo(e.target.value)}
            disabled={isLoading || isPoListLoading}
            style={{ fontSize: 13, height: 40 }}
          >
            <option value="">— Chọn đơn hàng đang giao (SENT_TO_SUPPLIER / GOODS_RECEIVED) —</option>
            {eligiblePOs.map((po) => (
              <option key={po.id} value={po.id}>
                {po.poNumber} — {po.supplierName} ({po.status === 'SENT_TO_SUPPLIER' ? 'Đang giao hàng' : 'Đã nhận một phần'}) — {Number(po.grandTotal || 0).toLocaleString('vi-VN')} {po.currency || 'VND'}
              </option>
            ))}
          </select>
          {eligiblePOs.length === 0 && !isPoListLoading && (
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
              Không có đơn mua hàng nào ở trạng thái sẵn sàng nhận hàng (SENT_TO_SUPPLIER). Hãy gửi PO cho nhà cung cấp trước.
            </p>
          )}
        </div>

        {/* Loading PO Detail */}
        {selectedPoId && isPoDetailLoading && (
          <LoadingState message="Đang tải chi tiết đơn đặt hàng và danh sách sản phẩm..." minHeight="180px" />
        )}

        {/* PO Detail Error */}
        {selectedPoId && isPoDetailError && (
          <Alert variant="danger" title="Không thể tải chi tiết PO">
            {poDetailError?.message || 'Lỗi kết nối máy chủ.'}
          </Alert>
        )}

        {/* PO Detail Content */}
        {poDetail && (
          <div>
            {/* Header info cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: 12,
                padding: 14,
                backgroundColor: '#f8fafc',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                marginBottom: 20,
                fontSize: 13,
              }}
            >
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>Nhà cung cấp:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {poDetail.supplier?.supplierName} ({poDetail.supplier?.supplierCode})
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>Ngày đặt / Dự kiến giao:</span>
                <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
                  {poDetail.poDate ? new Date(poDetail.poDate).toLocaleDateString('vi-VN') : '—'} / {poDetail.deliveryDate || '—'}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>Trạng thái PO:</span>
                <div style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                  {poDetail.status}
                </div>
              </div>
              <div>
                <span style={{ color: '#64748b', fontSize: 12 }}>Tổng giá trị PO:</span>
                <div style={{ fontWeight: 700, color: '#059669' }}>
                  {Number(poDetail.grandTotal || 0).toLocaleString('vi-VN')} {poDetail.currency}
                </div>
              </div>
            </div>

            {/* Item receiving grid */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
              Chi tiết mặt hàng nhận kho
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 16 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid var(--color-border)' }}>
                    <th style={thStyle}>#</th>
                    <th style={{ ...thStyle, minWidth: 180 }}>Sản phẩm</th>
                    <th style={thStyle}>ĐVT</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Đặt hàng</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Đã nhận</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Còn lại</th>
                    <th style={{ ...thStyle, minWidth: 100 }}>Nhận (Đạt) <span style={{ color: '#e53e3e' }}>*</span></th>
                    <th style={{ ...thStyle, minWidth: 90 }}>Từ chối (Hỏng)</th>
                    <th style={{ ...thStyle, minWidth: 110 }}>Số lô (Batch)</th>
                    <th style={{ ...thStyle, minWidth: 120 }}>Hạn dùng</th>
                  </tr>
                </thead>
                <tbody>
                  {poDetail.items?.map((item, index) => {
                    const ordered = parseFloat(item.quantity) || 0;
                    const received = parseFloat(item.receivedQuantity) || 0;
                    const rejected = parseFloat(item.rejectedQuantity) || 0;
                    const remaining = Math.max(0, ordered - received - rejected);
                    const input = getItemInput(item);
                    const isFullyReceived = remaining <= 0;

                    return (
                      <tr
                        key={item.id}
                        style={{
                          borderBottom: '1px solid #f1f5f9',
                          backgroundColor: isFullyReceived ? '#f8fafc' : '#fff',
                        }}
                      >
                        <td style={tdStyle}>{index + 1}</td>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 600, color: isFullyReceived ? '#94a3b8' : 'var(--color-text-main)' }}>
                            {item.productName}
                          </div>
                          <div style={{ fontSize: 11, color: '#64748b' }}>
                            Mã: <span className="font-mono">{item.productCode}</span>
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: 12, color: '#475569' }}>{item.productUnit}</span>
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600 }}>
                          {ordered.toLocaleString('vi-VN')}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#059669' }}>
                          {received.toLocaleString('vi-VN')}
                          {rejected > 0 && <span style={{ color: '#dc2626', fontSize: 11 }}> (+{rejected} từ chối)</span>}
                        </td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 700, color: remaining > 0 ? 'var(--color-primary)' : '#94a3b8' }}>
                          {remaining.toLocaleString('vi-VN')}
                        </td>
                        <td style={tdStyle}>
                          <input
                            className="form-input"
                            type="number"
                            step="0.0001"
                            min="0"
                            max={remaining}
                            value={input.quantityAccepted}
                            onChange={(e) => handleItemChange(item.id, 'quantityAccepted', e.target.value)}
                            disabled={isLoading || isFullyReceived}
                            style={{ width: '100%', height: 32, fontSize: 12, fontWeight: 600, color: '#065f46' }}
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            className="form-input"
                            type="number"
                            step="0.0001"
                            min="0"
                            value={input.quantityRejected}
                            onChange={(e) => handleItemChange(item.id, 'quantityRejected', e.target.value)}
                            disabled={isLoading || isFullyReceived}
                            style={{ width: '100%', height: 32, fontSize: 12, color: '#991b1b' }}
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            className="form-input"
                            type="text"
                            placeholder="LOT/Batch"
                            value={input.batchNumber || ''}
                            onChange={(e) => handleItemChange(item.id, 'batchNumber', e.target.value)}
                            disabled={isLoading || isFullyReceived}
                            style={{ width: '100%', height: 32, fontSize: 12 }}
                          />
                        </td>
                        <td style={tdStyle}>
                          <input
                            className="form-input"
                            type="date"
                            min={getTomorrowStr()}
                            value={input.expiryDate || ''}
                            onChange={(e) => handleItemChange(item.id, 'expiryDate', e.target.value)}
                            disabled={isLoading || isFullyReceived}
                            style={{ width: '100%', height: 32, fontSize: 11 }}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Validation Error message */}
        {validationError && (
          <div style={{ marginBottom: 16, padding: '10px 14px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', fontSize: 13 }}>
            <AlertTriangleIcon size={16} style={{ flexShrink: 0 }} />
            <span>{validationError}</span>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid var(--color-border)' }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Huỷ
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading || !selectedPoId || isPoDetailLoading}
          >
            {isLoading ? 'Đang tạo phiếu...' : 'Tạo phiếu nhận hàng (DRAFT)'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

const thStyle = {
  padding: '8px 10px',
  textAlign: 'left',
  fontWeight: 600,
  fontSize: 12,
  color: 'var(--color-text-secondary)',
  whiteSpace: 'nowrap',
};

const tdStyle = {
  padding: '6px 8px',
  verticalAlign: 'middle',
};
