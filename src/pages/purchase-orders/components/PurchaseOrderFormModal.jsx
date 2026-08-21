import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { supplierApi } from '../../../api/supplierApi';
import { warehouseApi } from '../../../api/warehouseApi';
import { productApi } from '../../../api/productApi';
import { PlusIcon, TrashIcon } from '../../../components/ui/Icons';

// ─── Validation schema ────────────────────────────────────────────────────────
const itemSchema = z.object({
  productId:   z.string().uuid('Sản phẩm không hợp lệ'),
  productCode: z.string().min(1, 'Mã SP không được để trống').max(50),
  productName: z.string().min(1, 'Tên SP không được để trống').max(255),
  productUnit: z.string().min(1, 'Đơn vị không được để trống').max(20),
  quantity:    z.coerce.number({ invalid_type_error: 'Số lượng không hợp lệ' }).min(0.0001, 'Số lượng phải > 0'),
  unitPrice:   z.coerce.number({ invalid_type_error: 'Đơn giá không hợp lệ' }).min(0.0001, 'Đơn giá phải > 0'),
  description: z.string().max(500).optional().or(z.literal('')),
});

const createSchema = z.object({
  supplierId:     z.string().uuid('Vui lòng chọn nhà cung cấp'),
  warehouseId:    z.string().uuid('Vui lòng chọn kho'),
  deliveryDate:   z.string().min(1, 'Ngày giao hàng không được để trống'),
  currency:       z.string().length(3, 'Mã tiền tệ phải đúng 3 ký tự'),
  taxPercentage:  z.coerce.number().min(0).max(100).optional().default(10),
  shippingCost:   z.coerce.number().min(0).optional().default(0),
  discountAmount: z.coerce.number().min(0).optional().default(0),
  paymentTerms:   z.string().max(100).optional().or(z.literal('')),
  incoterms:      z.string().max(50).optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
  items:          z.array(itemSchema).min(1, 'Đơn hàng phải có ít nhất 1 sản phẩm'),
});

const updateSchema = z.object({
  deliveryDate:   z.string().min(1, 'Ngày giao hàng không được để trống'),
  taxPercentage:  z.coerce.number().min(0).max(100).optional(),
  shippingCost:   z.coerce.number().min(0).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  paymentTerms:   z.string().max(100).optional().or(z.literal('')),
  incoterms:      z.string().max(50).optional().or(z.literal('')),
  notes:          z.string().optional().or(z.literal('')),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getTomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function lineTotal(qty, price) {
  const q = parseFloat(qty) || 0;
  const p = parseFloat(price) || 0;
  return (q * p).toLocaleString('vi-VN');
}

function subtotalPreview(items) {
  return (items || []).reduce((sum, it) => {
    return sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0);
  }, 0);
}

function grandTotalPreview(items, taxPct, shipping, discount) {
  const sub = subtotalPreview(items);
  const tax = sub * ((parseFloat(taxPct) || 0) / 100);
  const ship = parseFloat(shipping) || 0;
  const disc = parseFloat(discount) || 0;
  return sub + tax + ship - disc;
}

// ─── Form Modal ───────────────────────────────────────────────────────────────
export function PurchaseOrderFormModal({ isOpen, onClose, onSubmit, isLoading, poToEdit }) {
  const isEdit = Boolean(poToEdit);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? updateSchema : createSchema),
    defaultValues: isEdit
      ? {
          deliveryDate:   poToEdit?.deliveryDate ?? getTomorrowStr(),
          taxPercentage:  Number(poToEdit?.taxPercentage ?? 10),
          shippingCost:   Number(poToEdit?.shippingCost ?? 0),
          discountAmount: Number(poToEdit?.discountAmount ?? 0),
          paymentTerms:   poToEdit?.paymentTerms ?? '',
          incoterms:      poToEdit?.incoterms ?? '',
          notes:          poToEdit?.notes ?? '',
        }
      : {
          supplierId:     '',
          warehouseId:    '',
          deliveryDate:   getTomorrowStr(),
          currency:       'VND',
          taxPercentage:  10,
          shippingCost:   0,
          discountAmount: 0,
          paymentTerms:   '',
          incoterms:      '',
          notes:          '',
          items:          [{ productId: '', productCode: '', productName: '', productUnit: '', quantity: 1, unitPrice: 0, description: '' }],
        },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems       = watch('items');
  const watchedTax         = watch('taxPercentage');
  const watchedShipping    = watch('shippingCost');
  const watchedDiscount    = watch('discountAmount');
  const watchedCurrency    = watch('currency');

  // UI state for product selection
  const [selectedProductRowIndex, setSelectedProductRowIndex] = useState(null);
  const [productSearch, setProductSearch] = useState('');

  // Supplier list
  const { data: suppliersData } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: () => supplierApi.searchSuppliers({ keyword: '', page: 0, size: 100 }),
    enabled: isOpen && !isEdit,
  });
  const suppliers = suppliersData?.data?.content || [];

  // Warehouse list
  const { data: warehousesData } = useQuery({
    queryKey: ['warehouses-active'],
    queryFn: () => warehouseApi.getActiveWarehouses(),
    enabled: isOpen && !isEdit,
  });
  const warehouses = warehousesData?.data || [];

  // Product list & search for PO items
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products-for-po', productSearch],
    queryFn: () => {
      if (productSearch.trim()) {
        return productApi.searchProducts(productSearch.trim(), { page: 0, size: 50 });
      }
      return productApi.getActiveProducts({ page: 0, size: 50, sort: 'name,asc' });
    },
    enabled: isOpen && !isEdit && selectedProductRowIndex !== null,
  });
  const products = productsData?.data?.content || [];

  useEffect(() => {
    if (!isOpen) { reset(); setProductSearch(''); setSelectedProductRowIndex(null); }
  }, [isOpen, reset]);

  function handleSelectProduct(product) {
    if (selectedProductRowIndex === null) return;
    setValue(`items.${selectedProductRowIndex}.productId`,   product.id, { shouldValidate: true });
    setValue(`items.${selectedProductRowIndex}.productCode`, product.code, { shouldValidate: true });
    setValue(`items.${selectedProductRowIndex}.productName`, product.name, { shouldValidate: true });
    setValue(`items.${selectedProductRowIndex}.productUnit`, product.unit?.name || '', { shouldValidate: true });
    if (product.price) {
      setValue(`items.${selectedProductRowIndex}.unitPrice`, Number(product.price), { shouldValidate: true });
    }
    setSelectedProductRowIndex(null);
    setProductSearch('');
  }

  function handleFormSubmit(data) {
    if (isEdit) {
      onSubmit({
        deliveryDate:   data.deliveryDate,
        taxPercentage:  data.taxPercentage,
        shippingCost:   data.shippingCost,
        discountAmount: data.discountAmount,
        paymentTerms:   data.paymentTerms || null,
        incoterms:      data.incoterms || null,
        notes:          data.notes || null,
      });
    } else {
      onSubmit({
        supplierId:     data.supplierId,
        warehouseId:    data.warehouseId,
        deliveryDate:   data.deliveryDate,
        currency:       data.currency,
        taxPercentage:  data.taxPercentage,
        shippingCost:   data.shippingCost,
        discountAmount: data.discountAmount,
        paymentTerms:   data.paymentTerms || null,
        incoterms:      data.incoterms || null,
        notes:          data.notes || null,
        items:          data.items.map((it) => ({
          productId:   it.productId,
          productCode: it.productCode,
          productName: it.productName,
          productUnit: it.productUnit,
          quantity:    it.quantity,
          unitPrice:   it.unitPrice,
          description: it.description || null,
        })),
      });
    }
  }

  const sub   = subtotalPreview(watchedItems);
  const grand = grandTotalPreview(watchedItems, watchedTax, watchedShipping, watchedDiscount);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa Đơn mua hàng — ${poToEdit?.poNumber}` : 'Tạo Đơn mua hàng mới'}
      size="xl"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* ── Section 1: PO header ─────────────────────────────────── */}
        <SectionTitle>Thông tin chung</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
          {!isEdit && (
            <>
              <div>
                <label className="form-label">Nhà cung cấp <span style={{ color: '#e53e3e' }}>*</span></label>
                <select className="form-input" {...register('supplierId')} disabled={isLoading}>
                  <option value="">— Chọn nhà cung cấp —</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>{s.supplierName} ({s.supplierCode})</option>
                  ))}
                </select>
                {errors.supplierId && <p className="form-error">{errors.supplierId.message}</p>}
              </div>

              <div>
                <label className="form-label">Kho nhận hàng <span style={{ color: '#e53e3e' }}>*</span></label>
                <select className="form-input" {...register('warehouseId')} disabled={isLoading}>
                  <option value="">— Chọn kho —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
                {errors.warehouseId && <p className="form-error">{errors.warehouseId.message}</p>}
              </div>

              <div>
                <label className="form-label">Tiền tệ <span style={{ color: '#e53e3e' }}>*</span></label>
                <select className="form-input" {...register('currency')} disabled={isLoading}>
                  <option value="VND">VND — Việt Nam Đồng</option>
                  <option value="USD">USD — US Dollar</option>
                  <option value="EUR">EUR — Euro</option>
                </select>
                {errors.currency && <p className="form-error">{errors.currency.message}</p>}
              </div>
            </>
          )}

          <div>
            <label className="form-label">Ngày giao hàng <span style={{ color: '#e53e3e' }}>*</span></label>
            <input className="form-input" type="date" {...register('deliveryDate')} disabled={isLoading} min={getTomorrowStr()} />
            {errors.deliveryDate && <p className="form-error">{errors.deliveryDate.message}</p>}
          </div>

          <div>
            <label className="form-label">Thuế suất (%)</label>
            <input className="form-input" type="number" step="0.01" min="0" max="100" {...register('taxPercentage')} disabled={isLoading} />
            {errors.taxPercentage && <p className="form-error">{errors.taxPercentage.message}</p>}
          </div>

          <div>
            <label className="form-label">Phí vận chuyển</label>
            <input className="form-input" type="number" step="0.01" min="0" {...register('shippingCost')} disabled={isLoading} />
            {errors.shippingCost && <p className="form-error">{errors.shippingCost.message}</p>}
          </div>

          <div>
            <label className="form-label">Giảm giá</label>
            <input className="form-input" type="number" step="0.01" min="0" {...register('discountAmount')} disabled={isLoading} />
            {errors.discountAmount && <p className="form-error">{errors.discountAmount.message}</p>}
          </div>

          <div>
            <label className="form-label">Điều khoản thanh toán</label>
            <input className="form-input" type="text" placeholder="VD: NET 30, COD..." {...register('paymentTerms')} disabled={isLoading} />
          </div>

          <div>
            <label className="form-label">Incoterms</label>
            <input className="form-input" type="text" placeholder="VD: FOB, CIF..." {...register('incoterms')} disabled={isLoading} />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Ghi chú</label>
            <textarea className="form-input" rows={2} {...register('notes')} disabled={isLoading} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
          </div>
        </div>

        {/* ── Section 2: Items (create only) ───────────────────────── */}
        {!isEdit && (
          <>
            <SectionTitle>Danh sách sản phẩm <span style={{ color: '#e53e3e' }}>*</span></SectionTitle>

            {/* Product search popup */}
            {selectedProductRowIndex !== null && (
              <div style={{ marginBottom: 12, padding: 12, border: '1px solid #93c5fd', borderRadius: 8, backgroundColor: '#eff6ff' }}>
                <div style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    className="form-input"
                    placeholder="Tìm sản phẩm theo mã SKU hoặc tên..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    autoFocus
                    style={{ flex: 1 }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => { setSelectedProductRowIndex(null); setProductSearch(''); }}>Đóng</Button>
                </div>

                {isProductsLoading ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: '#64748b', fontSize: 13, backgroundColor: '#fff', borderRadius: 6 }}>
                    Đang tải danh sách sản phẩm...
                  </div>
                ) : products.length > 0 ? (
                  <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 6, backgroundColor: '#fff' }}>
                    {products.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectProduct(p)}
                        style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #f1f5f9', fontSize: 13, transition: 'background 0.1s' }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f0f9ff'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <strong style={{ color: 'var(--color-primary)' }}>{p.code}</strong> — <span>{p.name}</span>
                            {p.category?.name && (
                              <span style={{ fontSize: 11, color: '#64748b', marginLeft: 8 }}>({p.category.name})</span>
                            )}
                          </div>
                          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: '#059669' }}>
                              {Number(p.price || 0).toLocaleString('vi-VN')} {watchedCurrency || 'VND'}
                            </span>
                            <span style={{ fontSize: 11, color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>
                              {p.unit?.name || '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: 13, backgroundColor: '#fff', borderRadius: 6 }}>
                    {productSearch ? 'Không tìm thấy sản phẩm phù hợp' : 'Không có sản phẩm đang kinh doanh'}
                  </div>
                )}
              </div>
            )}

            <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 12 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ backgroundColor: '#f8fafc' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Sản phẩm <span style={{ color: '#e53e3e' }}>*</span></th>
                    <th style={thStyle}>ĐVT</th>
                    <th style={thStyle}>Số lượng <span style={{ color: '#e53e3e' }}>*</span></th>
                    <th style={thStyle}>Đơn giá <span style={{ color: '#e53e3e' }}>*</span></th>
                    <th style={thStyle}>Thành tiền</th>
                    <th style={thStyle}>Ghi chú</th>
                    <th style={thStyle}></th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={tdStyle}>{index + 1}</td>
                      <td style={{ ...tdStyle, minWidth: 200 }}>
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <input
                            className="form-input"
                            placeholder="Mã sản phẩm"
                            {...register(`items.${index}.productCode`)}
                            style={{ width: 90, fontSize: 12 }}
                            readOnly
                            disabled={isLoading}
                          />
                          <input
                            className="form-input"
                            placeholder="Tên sản phẩm"
                            {...register(`items.${index}.productName`)}
                            style={{ flex: 1, fontSize: 12 }}
                            readOnly
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: 11, whiteSpace: 'nowrap' }}
                            onClick={() => setSelectedProductRowIndex(index)}
                            disabled={isLoading}
                          >
                            Chọn
                          </button>
                        </div>
                        {errors.items?.[index]?.productId && (
                          <p className="form-error">{errors.items[index].productId.message}</p>
                        )}
                        <input type="hidden" {...register(`items.${index}.productId`)} />
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="form-input"
                          {...register(`items.${index}.productUnit`)}
                          style={{ width: 70, fontSize: 12 }}
                          placeholder="ĐVT"
                          disabled={isLoading}
                        />
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="form-input"
                          type="number"
                          step="0.0001"
                          min="0.0001"
                          {...register(`items.${index}.quantity`)}
                          style={{ width: 90, fontSize: 12 }}
                          disabled={isLoading}
                        />
                        {errors.items?.[index]?.quantity && (
                          <p className="form-error">{errors.items[index].quantity.message}</p>
                        )}
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="form-input"
                          type="number"
                          step="0.0001"
                          min="0"
                          {...register(`items.${index}.unitPrice`)}
                          style={{ width: 110, fontSize: 12 }}
                          disabled={isLoading}
                        />
                        {errors.items?.[index]?.unitPrice && (
                          <p className="form-error">{errors.items[index].unitPrice.message}</p>
                        )}
                      </td>
                      <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#1e3a5f', whiteSpace: 'nowrap' }}>
                        {lineTotal(watchedItems?.[index]?.quantity, watchedItems?.[index]?.unitPrice)}
                      </td>
                      <td style={tdStyle}>
                        <input
                          className="form-input"
                          {...register(`items.${index}.description`)}
                          placeholder="Ghi chú dòng..."
                          style={{ width: 120, fontSize: 12 }}
                          disabled={isLoading}
                        />
                      </td>
                      <td style={tdStyle}>
                        <button
                          type="button"
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 6px', color: '#dc2626', border: '1px solid #fca5a5' }}
                          onClick={() => remove(index)}
                          disabled={fields.length === 1 || isLoading}
                          title="Xoá dòng"
                        >
                          <TrashIcon size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {errors.items?.root && (
              <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{errors.items.root.message}</p>
            )}
            {typeof errors.items?.message === 'string' && (
              <p style={{ color: '#dc2626', fontSize: 12, marginBottom: 8 }}>{errors.items.message}</p>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ productId: '', productCode: '', productName: '', productUnit: '', quantity: 1, unitPrice: 0, description: '' })}
              disabled={isLoading}
            >
              <PlusIcon size={14} /> Thêm dòng
            </Button>
          </>
        )}

        {/* ── Section 3: Preview totals (create only) ──────────────── */}
        {!isEdit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16, marginBottom: 8 }}>
            <div style={{ width: 280, fontSize: 13 }}>
              <PreviewRow label="Tạm tính" value={sub.toLocaleString('vi-VN')} />
              <PreviewRow label={`Thuế (${watchedTax ?? 0}%)`} value={(sub * ((parseFloat(watchedTax) || 0) / 100)).toLocaleString('vi-VN')} />
              <PreviewRow label="Phí vận chuyển" value={(parseFloat(watchedShipping) || 0).toLocaleString('vi-VN')} />
              <PreviewRow label="Giảm giá" value={(parseFloat(watchedDiscount) || 0).toLocaleString('vi-VN')} />
              <PreviewRow label="Dự kiến tổng cộng" value={grand.toLocaleString('vi-VN')} highlight />
            </div>
          </div>
        )}

        {/* ── Submit buttons ────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 16, borderTop: '1px solid var(--color-border)', marginTop: 8 }}>
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Huỷ</Button>
          <Button type="submit" variant="primary" disabled={isLoading}>
            {isLoading ? 'Đang lưu...' : isEdit ? 'Cập nhật đơn hàng' : 'Tạo đơn hàng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function SectionTitle({ children }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, paddingBottom: 6, borderBottom: '1px solid var(--color-border)' }}>
      {children}
    </div>
  );
}

function PreviewRow({ label, value, highlight }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: highlight ? 'none' : '1px dashed #e2e8f0', fontWeight: highlight ? 700 : 400, color: highlight ? '#1e3a5f' : undefined }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const thStyle = { padding: '8px 10px', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)', whiteSpace: 'nowrap', fontSize: 12 };
const tdStyle = { padding: '6px 8px', verticalAlign: 'top' };
