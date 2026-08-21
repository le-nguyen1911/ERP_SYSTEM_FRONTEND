import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { SlidersIcon } from '../../../components/ui/Icons';

const minQtySchema = z.object({
  minQuantity: z
    .number({ invalid_type_error: 'Vui lòng nhập số' })
    .int('Phải là số nguyên')
    .min(0, 'Không được âm'),
});

/**
 * UpdateMinQuantityModal
 * Props: isOpen, onClose, onSubmit, isLoading, stockRecord (ProductStockResponse)
 */
export function UpdateMinQuantityModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  stockRecord,
}) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(minQtySchema),
    defaultValues: { minQuantity: stockRecord?.minQuantity ?? 0 },
  });

  useEffect(() => {
    if (isOpen && stockRecord) {
      reset({ minQuantity: stockRecord.minQuantity ?? 0 });
    }
  }, [isOpen, stockRecord, reset]);

  const handleFormSubmit = (data) => {
    onSubmit({
      productId: stockRecord.product.id,
      warehouseId: stockRecord.warehouse.id,
      minQuantity: Number(data.minQuantity),
    });
  };

  if (!stockRecord) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <SlidersIcon size={18} />
          Cập nhật mức tồn kho tối thiểu
        </span>
      }
      size="sm"
    >
      <div
        style={{
          padding: '12px 14px',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 16,
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, color: 'var(--color-text-main)' }}>
          {stockRecord.product?.name}
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 400, color: 'var(--color-text-muted)' }}>
            ({stockRecord.product?.code})
          </span>
        </div>
        <div style={{ color: 'var(--color-text-secondary)', marginTop: 4 }}>
          Kho: <strong>{stockRecord.warehouse?.name}</strong>
          &nbsp;·&nbsp; Tồn hiện tại: <strong>{stockRecord.quantity}</strong> đơn vị
        </div>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="form-group">
          <label className="form-label">
            Mức tồn kho tối thiểu <span className="required">*</span>
          </label>
          <input
            type="number"
            min="0"
            className={`form-input${errors.minQuantity ? ' is-invalid' : ''}`}
            placeholder="0"
            {...register('minQuantity', { valueAsNumber: true })}
          />
          {errors.minQuantity && (
            <div className="form-error">{errors.minQuantity.message}</div>
          )}
          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Hệ thống sẽ cảnh báo khi tồn kho thực tế ≤ mức này.
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '20px -20px -20px -20px', paddingTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
