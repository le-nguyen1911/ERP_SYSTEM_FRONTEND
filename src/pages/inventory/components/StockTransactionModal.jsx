import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ArrowDownIcon, ArrowUpIcon } from '../../../components/ui/Icons';

const transactionSchema = z.object({
  productId: z.string().uuid('Vui lòng chọn sản phẩm'),
  warehouseId: z.string().uuid('Vui lòng chọn kho'),
  type: z.enum(['IMPORT', 'EXPORT']),
  quantity: z
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Tối thiểu 1')
    .max(1_000_000, 'Tối đa 1.000.000'),
  unitPrice: z
    .number({ invalid_type_error: 'Đơn giá phải là số' })
    .min(0, 'Đơn giá không được âm')
    .optional()
    .nullable(),
  note: z.string().max(500, 'Tối đa 500 ký tự').optional().nullable(),
});

/**
 * StockTransactionModal
 * Props:
 *   isOpen, onClose, onSubmit, isLoading
 *   products: ProductResponse[]
 *   warehouses: WarehouseResponse[]
 *   defaultType: 'IMPORT' | 'EXPORT'
 *   defaultProductId?: string
 *   defaultWarehouseId?: string
 *   canImport: boolean
 *   canExport: boolean
 */
export function StockTransactionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  products = [],
  warehouses = [],
  defaultType = 'IMPORT',
  defaultProductId,
  defaultWarehouseId,
  canImport,
  canExport,
}) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      productId: defaultProductId || '',
      warehouseId: defaultWarehouseId || '',
      type: defaultType,
      quantity: '',
      unitPrice: '',
      note: '',
    },
  });

  const selectedType = useWatch({ control, name: 'type' }) || defaultType;

  useEffect(() => {
    if (isOpen) {
      reset({
        productId: defaultProductId || '',
        warehouseId: defaultWarehouseId || '',
        type: defaultType,
        quantity: '',
        unitPrice: '',
        note: '',
      });
    }
  }, [isOpen, defaultType, defaultProductId, defaultWarehouseId, reset]);

  const handleTypeChange = (type) => {
    setValue('type', type);
  };

  const handleFormSubmit = (data) => {
    const payload = {
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: data.type,
      quantity: Number(data.quantity),
      unitPrice: data.unitPrice ? Number(data.unitPrice) : null,
      note: data.note || null,
    };
    onSubmit(payload);
  };

  const isImport = selectedType === 'IMPORT';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {isImport ? (
            <ArrowDownIcon size={18} style={{ color: 'var(--color-success)' }} />
          ) : (
            <ArrowUpIcon size={18} style={{ color: 'var(--color-danger)' }} />
          )}
          {isImport ? 'Nhập kho thủ công' : 'Xuất kho thủ công'}
        </span>
      }
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="form-grid" style={{ gap: 16 }}>

          {/* Transaction type selector */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Loại giao dịch <span className="required">*</span></label>
            <div style={{ display: 'flex', gap: 8 }}>
              {canImport && (
                <button
                  type="button"
                  onClick={() => handleTypeChange('IMPORT')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedType === 'IMPORT' ? 'var(--color-success)' : 'var(--color-border)'}`,
                    backgroundColor: selectedType === 'IMPORT' ? 'var(--color-success-light)' : 'transparent',
                    color: selectedType === 'IMPORT' ? 'var(--color-success)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <ArrowDownIcon size={15} /> NHẬP KHO
                </button>
              )}
              {canExport && (
                <button
                  type="button"
                  onClick={() => handleTypeChange('EXPORT')}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${selectedType === 'EXPORT' ? 'var(--color-danger)' : 'var(--color-border)'}`,
                    backgroundColor: selectedType === 'EXPORT' ? 'var(--color-danger-light)' : 'transparent',
                    color: selectedType === 'EXPORT' ? 'var(--color-danger)' : 'var(--color-text-secondary)',
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    transition: 'all 0.15s',
                  }}
                >
                  <ArrowUpIcon size={15} /> XUẤT KHO
                </button>
              )}
            </div>
            <input type="hidden" {...register('type')} />
          </div>

          {/* Product */}
          <div className="form-group">
            <label className="form-label">Sản phẩm <span className="required">*</span></label>
            <select className={`form-input${errors.productId ? ' is-invalid' : ''}`} {...register('productId')}>
              <option value="">-- Chọn sản phẩm --</option>
              {products.filter(p => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
            {errors.productId && <div className="form-error">{errors.productId.message}</div>}
          </div>

          {/* Warehouse */}
          <div className="form-group">
            <label className="form-label">Kho <span className="required">*</span></label>
            <select className={`form-input${errors.warehouseId ? ' is-invalid' : ''}`} {...register('warehouseId')}>
              <option value="">-- Chọn kho --</option>
              {warehouses.filter(w => w.active).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.warehouseId && <div className="form-error">{errors.warehouseId.message}</div>}
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label">Số lượng <span className="required">*</span></label>
            <input
              type="number"
              min="1"
              max="1000000"
              className={`form-input${errors.quantity ? ' is-invalid' : ''}`}
              placeholder="Nhập số lượng..."
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && <div className="form-error">{errors.quantity.message}</div>}
          </div>

          {/* Unit price */}
          <div className="form-group">
            <label className="form-label">Đơn giá (VNĐ)</label>
            <input
              type="number"
              min="0"
              className={`form-input${errors.unitPrice ? ' is-invalid' : ''}`}
              placeholder="Tùy chọn..."
              {...register('unitPrice', { valueAsNumber: true })}
            />
            {errors.unitPrice && <div className="form-error">{errors.unitPrice.message}</div>}
          </div>

          {/* Note */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Ghi chú</label>
            <textarea
              className={`form-input${errors.note ? ' is-invalid' : ''}`}
              rows={2}
              placeholder="Ghi chú về lý do nhập/xuất kho..."
              {...register('note')}
            />
            {errors.note && <div className="form-error">{errors.note.message}</div>}
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '20px -20px -20px -20px', paddingTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant={isImport ? 'primary' : 'danger'}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isImport ? 'Xác nhận nhập kho' : 'Xác nhận xuất kho'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
