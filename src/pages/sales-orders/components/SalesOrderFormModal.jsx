import { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { customerApi } from '../../../api/customerApi';
import { productApi } from '../../../api/productApi';
import { XIcon, PlusIcon, TrashIcon, SearchIcon, PackageIcon, UserIcon } from '../../../components/ui/Icons';
import { Button } from '../../../components/ui/Button';
import axiosClient from '../../../api/axiosClient';

// ── Zod schema matching CreateSalesOrderRequest / UpdateSalesOrderRequest ──
const itemSchema = z.object({
  productId:   z.string().uuid('Chọn sản phẩm hợp lệ'),
  productCode: z.string().min(1, 'Mã SP không được trống').max(50),
  productName: z.string().min(1, 'Tên SP không được trống').max(255),
  productUnit: z.string().min(1, 'ĐVT không được trống').max(20),
  quantity:    z.coerce.number({ invalid_type_error: 'Số lượng không hợp lệ' }).positive('Số lượng phải > 0'),
  unitPrice:   z.coerce.number({ invalid_type_error: 'Đơn giá không hợp lệ' }).positive('Đơn giá phải > 0'),
  description: z.string().optional().default(''),
});

const soSchema = z.object({
  customerId:     z.string().uuid('Chọn khách hàng').optional().nullable(),
  warehouseId:    z.string().uuid('Chọn kho xuất hàng'),
  deliveryDate:   z.string().min(1, 'Ngày giao hàng không được trống'),
  currency:       z.string().length(3, 'Tiền tệ phải 3 ký tự').default('VND'),
  taxPercentage:  z.coerce.number().min(0).max(100).default(10),
  shippingCost:   z.coerce.number().min(0).default(0),
  discountAmount: z.coerce.number().min(0).default(0),
  paymentTerms:   z.string().max(100).optional().default(''),
  shippingAddress: z.string().optional().default(''),
  notes:          z.string().optional().default(''),
  items: z.array(itemSchema).min(1, 'Phải có ít nhất 1 sản phẩm'),
});

function getTomorrow() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export function SalesOrderFormModal({ isOpen, onClose, onSuccess, editSO }) {
  const isEdit = Boolean(editSO);
  const [productSearch, setProductSearch] = useState('');
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [pickerIndex, setPickerIndex] = useState(null);
  const [backendError, setBackendError] = useState('');

  // ── React Hook Form ───────────────────────────────────────────────────────
  const { register, control, handleSubmit, watch, setValue, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(soSchema),
    defaultValues: {
      customerId: '', warehouseId: '', deliveryDate: getTomorrow(),
      currency: 'VND', taxPercentage: 10, shippingCost: 0, discountAmount: 0,
      paymentTerms: '', shippingAddress: '', notes: '',
      items: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems       = watch('items');
  const watchedTax         = watch('taxPercentage');
  const watchedShipping    = watch('shippingCost');
  const watchedDiscount    = watch('discountAmount');

  // Populate form when editing
  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && editSO) {
      reset({
        customerId:      editSO.customer?.id || '',
        warehouseId:     editSO.warehouseId || '',
        deliveryDate:    editSO.deliveryDate || getTomorrow(),
        currency:        editSO.currency || 'VND',
        taxPercentage:   Number(editSO.taxPercentage) || 10,
        shippingCost:    Number(editSO.shippingCost) || 0,
        discountAmount:  Number(editSO.discountAmount) || 0,
        paymentTerms:    editSO.paymentTerms || '',
        shippingAddress: editSO.shippingAddress || '',
        notes:           editSO.notes || '',
        items: (editSO.items || []).map((item) => ({
          productId:   item.productId,
          productCode: item.productCode,
          productName: item.productName,
          productUnit: item.productUnit,
          quantity:    Number(item.quantity),
          unitPrice:   Number(item.unitPrice),
          description: item.description || '',
        })),
      });
    } else {
      reset({
        customerId: '', warehouseId: '', deliveryDate: getTomorrow(),
        currency: 'VND', taxPercentage: 10, shippingCost: 0, discountAmount: 0,
        paymentTerms: '', shippingAddress: '', notes: '', items: [],
      });
    }
    setBackendError('');
  }, [isOpen, isEdit, editSO, reset]);

  // ── Customers query ───────────────────────────────────────────────────────
  const { data: customersData } = useQuery({
    queryKey: ['customers-active-select'],
    queryFn: () => customerApi.searchCustomers({ status: 'ACTIVE', page: 0, size: 100 }),
    enabled: isOpen,
  });
  const customers = useMemo(() => customersData?.data?.content || [], [customersData?.data?.content]);

  // ── Warehouses query ──────────────────────────────────────────────────────
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-active-select'],
    queryFn: () => axiosClient.get('/warehouses/active'),
    enabled: isOpen,
  });
  const warehouses = useMemo(() => {
    const d = warehousesData?.data;
    return Array.isArray(d) ? d : (d?.content || []);
  }, [warehousesData?.data]);

  // ── Product search ────────────────────────────────────────────────────────
  const { data: productsData } = useQuery({
    queryKey: ['products-search-so', productSearch],
    queryFn: () => productSearch
      ? productApi.searchProducts(productSearch, { page: 0, size: 20 })
      : productApi.getActiveProducts({ page: 0, size: 20 }),
    enabled: isOpen && showProductPicker,
  });
  const products = useMemo(() => {
    const d = productsData?.data;
    return d?.content || [];
  }, [productsData?.data]);

  // ── Calculated totals preview ─────────────────────────────────────────────
  const subtotal = useMemo(() => {
    return (watchedItems || []).reduce((sum, item) => {
      return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    }, 0);
  }, [watchedItems]);
  const taxAmt   = subtotal * (Number(watchedTax) || 0) / 100;
  const grandTotal = subtotal + taxAmt + (Number(watchedShipping) || 0) - (Number(watchedDiscount) || 0);

  // ── Product picker ────────────────────────────────────────────────────────
  const openProductPicker = useCallback((idx) => {
    setPickerIndex(idx); setProductSearch(''); setShowProductPicker(true);
  }, []);

  const selectProduct = useCallback((product) => {
    const priceEl = product.sellingPrice ?? product.price ?? product.unitPrice ?? 0;
    const unitEl  = product.unit?.name || product.unitName || '';
    if (pickerIndex === null) {
      // append new
      append({
        productId:   product.id,
        productCode: product.productCode || product.code || '',
        productName: product.productName || product.name || '',
        productUnit: unitEl,
        quantity:    1,
        unitPrice:   Number(priceEl),
        description: '',
      });
    } else {
      // replace existing
      setValue(`items.${pickerIndex}.productId`,   product.id);
      setValue(`items.${pickerIndex}.productCode`, product.productCode || product.code || '');
      setValue(`items.${pickerIndex}.productName`, product.productName || product.name || '');
      setValue(`items.${pickerIndex}.productUnit`, unitEl);
      setValue(`items.${pickerIndex}.unitPrice`,   Number(priceEl));
    }
    setShowProductPicker(false); setPickerIndex(null);
  }, [pickerIndex, append, setValue]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const onSubmit = async (data) => {
    setBackendError('');
    try {
      await onSuccess(data);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Lỗi không xác định';
      setBackendError(msg);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9997, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 16, overflowY: 'auto' }}>
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={onClose} />
      <div style={{
        position: 'relative', background: '#fff', borderRadius: 20, width: '100%', maxWidth: 900,
        marginTop: 20, marginBottom: 20, boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 28px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PackageIcon size={22} style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#1e293b' }}>
              {isEdit ? `Chỉnh sửa ${editSO.soNumber}` : 'Tạo đơn bán hàng mới'}
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: 13, color: '#64748b' }}>
              {isEdit ? 'Chỉnh sửa thông tin đơn hàng (chỉ DRAFT)' : 'Điền thông tin để tạo đơn bán hàng'}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 8 }}><XIcon size={20} /></button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={{ padding: '24px 28px' }}>
            {backendError && (
              <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 10, padding: '12px 16px', marginBottom: 20, fontSize: 13, color: '#dc2626' }}>
                {backendError}
              </div>
            )}

            {/* Section 1: Customer & Warehouse */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#374151' }}>
                <UserIcon size={14} style={{ marginRight: 6 }} />Khách hàng & kho xuất
              </h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
                {/* Customer */}
                {!isEdit && (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                      Khách hàng <span style={{ color: '#dc2626' }}>*</span>
                    </label>
                    <select {...register('customerId')}
                      style={{ width: '100%', padding: '9px 12px', border: `1px solid ${errors.customerId ? '#dc2626' : '#e2e8f0'}`, borderRadius: 8, fontSize: 14 }}>
                      <option value="">-- Chọn khách hàng --</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.customerCode} – {c.customerName}</option>
                      ))}
                    </select>
                    {errors.customerId && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{errors.customerId.message}</p>}
                  </div>
                )}

                {/* Warehouse */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Kho xuất hàng <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <select {...register('warehouseId')} disabled={isEdit}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${errors.warehouseId ? '#dc2626' : '#e2e8f0'}`, borderRadius: 8, fontSize: 14 }}>
                    <option value="">-- Chọn kho --</option>
                    {warehouses.map((w) => (
                      <option key={w.id} value={w.id}>{w.warehouseName || w.name}</option>
                    ))}
                  </select>
                  {errors.warehouseId && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{errors.warehouseId.message}</p>}
                </div>

                {/* Delivery Date */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>
                    Ngày giao hàng <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input type="date" {...register('deliveryDate')}
                    style={{ width: '100%', padding: '9px 12px', border: `1px solid ${errors.deliveryDate ? '#dc2626' : '#e2e8f0'}`, borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  {errors.deliveryDate && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{errors.deliveryDate.message}</p>}
                </div>

                {/* Payment Terms */}
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Điều khoản TT</label>
                  <input type="text" {...register('paymentTerms')} placeholder="VD: NET 30"
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                {/* Shipping Address */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Địa chỉ giao hàng</label>
                  <input type="text" {...register('shippingAddress')} placeholder="Địa chỉ giao hàng..."
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>

                {/* Notes */}
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Ghi chú</label>
                  <textarea {...register('notes')} rows={2} placeholder="Ghi chú đơn hàng..."
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Section 2: Tax / Shipping / Discount (Edit only shows these) */}
            <div style={{ background: '#f8fafc', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 700, color: '#374151' }}>Thuế & phí</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Thuế suất (%)</label>
                  <input type="number" step="0.01" {...register('taxPercentage')}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                  {errors.taxPercentage && <p style={{ margin: '4px 0 0', fontSize: 12, color: '#dc2626' }}>{errors.taxPercentage.message}</p>}
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Phí vận chuyển (VND)</label>
                  <input type="number" step="1" {...register('shippingCost')}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#374151', marginBottom: 6 }}>Giảm giá (VND)</label>
                  <input type="number" step="1" {...register('discountAmount')}
                    style={{ width: '100%', padding: '9px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                </div>
              </div>
            </div>

            {/* Section 3: Items (only for Create, not for header-only edit) */}
            {!isEdit && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#374151' }}>Danh sách sản phẩm</h4>
                  <button type="button" onClick={() => openProductPicker(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                    <PlusIcon size={14} /> Thêm sản phẩm
                  </button>
                </div>
                {errors.items?.root && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#dc2626' }}>{errors.items.root.message}</p>}
                {errors.items?.message && <p style={{ margin: '0 0 8px', fontSize: 12, color: '#dc2626' }}>{errors.items.message}</p>}

                {fields.length === 0 ? (
                  <div style={{ background: '#f8fafc', border: '2px dashed #e2e8f0', borderRadius: 10, padding: '32px', textAlign: 'center', color: '#94a3b8' }}>
                    <PackageIcon size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                    <p style={{ margin: 0 }}>Chưa có sản phẩm. Nhấn &ldquo;Thêm sản phẩm&rdquo; để thêm.</p>
                  </div>
                ) : (
                  <div style={{ border: '1px solid #e2e8f0', borderRadius: 10, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: '#f8fafc' }}>
                          {['Sản phẩm', 'ĐVT', 'Số lượng', 'Đơn giá', 'Thành tiền', ''].map((h) => (
                            <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#64748b', fontSize: 11, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((field, idx) => {
                          const lineTotal = (Number(watchedItems?.[idx]?.quantity) || 0) * (Number(watchedItems?.[idx]?.unitPrice) || 0);
                          return (
                            <tr key={field.id} style={{ borderTop: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '8px 12px' }}>
                                <div style={{ fontWeight: 500, color: '#1e293b', fontSize: 13 }}>
                                  [{watchedItems?.[idx]?.productCode}] {watchedItems?.[idx]?.productName}
                                </div>
                                <button type="button" onClick={() => openProductPicker(idx)}
                                  style={{ fontSize: 11, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: 2 }}>
                                  Đổi sản phẩm
                                </button>
                                <input type="hidden" {...register(`items.${idx}.productId`)} />
                                <input type="hidden" {...register(`items.${idx}.productCode`)} />
                                <input type="hidden" {...register(`items.${idx}.productName`)} />
                                <input type="hidden" {...register(`items.${idx}.productUnit`)} />
                              </td>
                              <td style={{ padding: '8px 12px', color: '#64748b' }}>{watchedItems?.[idx]?.productUnit}</td>
                              <td style={{ padding: '8px 12px' }}>
                                <input type="number" step="0.0001" {...register(`items.${idx}.quantity`)}
                                  style={{ width: 80, padding: '6px 8px', border: `1px solid ${errors.items?.[idx]?.quantity ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, fontSize: 13 }} />
                                {errors.items?.[idx]?.quantity && <div style={{ fontSize: 11, color: '#dc2626' }}>{errors.items[idx].quantity.message}</div>}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <input type="number" step="0.0001" {...register(`items.${idx}.unitPrice`)}
                                  style={{ width: 110, padding: '6px 8px', border: `1px solid ${errors.items?.[idx]?.unitPrice ? '#dc2626' : '#e2e8f0'}`, borderRadius: 6, fontSize: 13 }} />
                                {errors.items?.[idx]?.unitPrice && <div style={{ fontSize: 11, color: '#dc2626' }}>{errors.items[idx].unitPrice.message}</div>}
                              </td>
                              <td style={{ padding: '8px 12px', fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap' }}>
                                {Number(lineTotal).toLocaleString('vi-VN')} ₫
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <button type="button" onClick={() => remove(idx)}
                                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                                  <TrashIcon size={14} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Totals preview */}
                {fields.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', minWidth: 280, border: '1px solid #e2e8f0', fontSize: 13 }}>
                      {[
                        ['Tạm tính', `${subtotal.toLocaleString('vi-VN')} ₫`],
                        [`Thuế (${watchedTax}%)`, `${taxAmt.toLocaleString('vi-VN')} ₫`],
                        ['Vận chuyển', `${Number(watchedShipping || 0).toLocaleString('vi-VN')} ₫`],
                        ['Giảm giá', `- ${Number(watchedDiscount || 0).toLocaleString('vi-VN')} ₫`],
                      ].map(([l, v]) => (
                        <div key={l} style={{ display: 'flex', justifyContent: 'space-between', gap: 32, marginBottom: 6, color: '#64748b' }}>
                          <span>{l}</span><span style={{ fontWeight: 500 }}>{v}</span>
                        </div>
                      ))}
                      <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 32, fontWeight: 700, fontSize: 15, color: '#6366f1' }}>
                        <span>Tổng cộng</span>
                        <span>{grandTotal.toLocaleString('vi-VN')} ₫</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '16px 28px 24px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>Huỷ bỏ</Button>
            <button type="submit" disabled={isSubmitting}
              style={{ padding: '9px 24px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: isSubmitting ? 'not-allowed' : 'pointer', opacity: isSubmitting ? 0.7 : 1 }}>
              {isSubmitting ? 'Đang lưu...' : isEdit ? 'Cập nhật' : 'Tạo đơn hàng'}
            </button>
          </div>
        </form>
      </div>

      {/* Product Picker Modal */}
      {showProductPicker && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)' }} onClick={() => setShowProductPicker(false)} />
          <div style={{ position: 'relative', background: '#fff', borderRadius: 16, padding: 24, width: '100%', maxWidth: 560, maxHeight: '70vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, flex: 1, color: '#1e293b' }}>Chọn sản phẩm</h3>
              <button onClick={() => setShowProductPicker(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><XIcon size={18} /></button>
            </div>
            <div style={{ position: 'relative', marginBottom: 12 }}>
              <SearchIcon size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                autoFocus value={productSearch} onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Tìm theo mã, tên sản phẩm..."
                style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 32, color: '#94a3b8', fontSize: 13 }}>Không tìm thấy sản phẩm</div>
              ) : products.map((p) => (
                <div key={p.id} onClick={() => selectProduct(p)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 8, cursor: 'pointer', marginBottom: 4, transition: 'background 0.15s' }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PackageIcon size={16} style={{ color: '#6366f1' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#1e293b' }}>{p.productCode || p.code}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{p.productName || p.name} • {p.unit?.name || p.unitName || ''}</div>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#6366f1' }}>
                    {Number(p.sellingPrice ?? p.price ?? p.unitPrice ?? 0).toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
