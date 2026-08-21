import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { ArrowRightLeftIcon } from '../../../components/ui/Icons';

const transferSchema = z.object({
  productId: z.string().uuid('Vui lòng chọn sản phẩm'),
  fromWarehouseId: z.string().uuid('Vui lòng chọn kho nguồn'),
  toWarehouseId: z.string().uuid('Vui lòng chọn kho đích'),
  quantity: z
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Tối thiểu 1'),
  note: z.string().max(500, 'Tối đa 500 ký tự').optional().nullable(),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  { message: 'Kho nguồn và kho đích không được giống nhau', path: ['toWarehouseId'] }
);

/**
 * StockTransferModal
 * Props: isOpen, onClose, onSubmit, isLoading, products, warehouses
 *        defaultProductId?, defaultFromWarehouseId?
 */
export function StockTransferModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  products = [],
  warehouses = [],
  defaultProductId,
  defaultFromWarehouseId,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      productId: defaultProductId || '',
      fromWarehouseId: defaultFromWarehouseId || '',
      toWarehouseId: '',
      quantity: '',
      note: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        productId: defaultProductId || '',
        fromWarehouseId: defaultFromWarehouseId || '',
        toWarehouseId: '',
        quantity: '',
        note: '',
      });
    }
  }, [isOpen, defaultProductId, defaultFromWarehouseId, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      productId: data.productId,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      quantity: Number(data.quantity),
      note: data.note || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowRightLeftIcon size={18} style={{ color: 'var(--color-primary)' }} />
          Điều chuyển hàng giữa kho
        </span>
      }
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="form-grid" style={{ gap: 16 }}>

          {/* Product */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Sản phẩm <span className="required">*</span></label>
            <select className={`form-input${errors.productId ? ' is-invalid' : ''}`} {...register('productId')}>
              <option value="">-- Chọn sản phẩm cần điều chuyển --</option>
              {products.filter(p => p.active).map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
              ))}
            </select>
            {errors.productId && <div className="form-error">{errors.productId.message}</div>}
          </div>

          {/* From Warehouse */}
          <div className="form-group">
            <label className="form-label">Kho nguồn <span className="required">*</span></label>
            <select className={`form-input${errors.fromWarehouseId ? ' is-invalid' : ''}`} {...register('fromWarehouseId')}>
              <option value="">-- Xuất từ kho --</option>
              {warehouses.filter(w => w.active).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.fromWarehouseId && <div className="form-error">{errors.fromWarehouseId.message}</div>}
          </div>

          {/* To Warehouse */}
          <div className="form-group">
            <label className="form-label">Kho đích <span className="required">*</span></label>
            <select className={`form-input${errors.toWarehouseId ? ' is-invalid' : ''}`} {...register('toWarehouseId')}>
              <option value="">-- Nhập vào kho --</option>
              {warehouses.filter(w => w.active).map((w) => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
            {errors.toWarehouseId && <div className="form-error">{errors.toWarehouseId.message}</div>}
          </div>

          {/* Quantity */}
          <div className="form-group">
            <label className="form-label">Số lượng <span className="required">*</span></label>
            <input
              type="number"
              min="1"
              className={`form-input${errors.quantity ? ' is-invalid' : ''}`}
              placeholder="Số lượng điều chuyển..."
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && <div className="form-error">{errors.quantity.message}</div>}
          </div>

          {/* Note */}
          <div className="form-group">
            <label className="form-label">Ghi chú</label>
            <input
              type="text"
              className={`form-input${errors.note ? ' is-invalid' : ''}`}
              placeholder="Lý do điều chuyển (tuỳ chọn)..."
              {...register('note')}
            />
            {errors.note && <div className="form-error">{errors.note.message}</div>}
          </div>

          {/* Info note */}
          <div style={{ gridColumn: '1 / -1', padding: '10px 14px', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-md)', fontSize: 12, color: 'var(--color-primary)' }}>
            ℹ️ Điều chuyển sẽ tạo 1 lệnh <strong>XUẤT</strong> khỏi kho nguồn và 1 lệnh <strong>NHẬP</strong> vào kho đích với cùng mã tham chiếu.
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '20px -20px -20px -20px', paddingTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            Xác nhận điều chuyển
          </Button>
        </div>
      </form>
    </Modal>
  );
}
