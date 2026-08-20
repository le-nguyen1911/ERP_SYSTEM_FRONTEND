import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { WarehouseIcon, MapPinIcon, FileTextIcon } from '../../../components/ui/Icons';

const warehouseSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên kho không được để trống')
    .max(100, 'Tên kho tối đa 100 ký tự'),
  location: z
    .string()
    .max(255, 'Địa điểm/Vị trí tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
  description: z
    .string()
    .max(255, 'Mô tả tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
  active: z.boolean().default(true),
});

function WarehouseForm({ initialData, onSubmit, onClose, isLoading, isEdit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(warehouseSchema),
    defaultValues: {
      name: initialData?.name || '',
      location: initialData?.location || '',
      description: initialData?.description || '',
      active: initialData?.active !== undefined ? initialData.active : true,
    },
  });

  const handleFormSubmit = async (data) => {
    await onSubmit({
      name: data.name.trim(),
      location: data.location ? data.location.trim() : null,
      description: data.description ? data.description.trim() : null,
      ...(isEdit ? { active: Boolean(data.active) } : {}),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Input
        label="Tên kho hàng"
        placeholder="Ví dụ: Kho Tổng Hà Nội, Kho Linh Kiện TP.HCM..."
        startIcon={<WarehouseIcon size={16} />}
        error={errors.name?.message}
        required
        autoFocus
        {...register('name')}
      />

      <Input
        label="Vị trí / Địa chỉ kho"
        placeholder="Ví dụ: Số 123 Đường Giải Phóng, Q. Hoàng Mai, Hà Nội"
        startIcon={<MapPinIcon size={16} />}
        error={errors.location?.message}
        {...register('location')}
      />

      <div className="form-group">
        <label className="form-label">
          Mô tả kho hàng
        </label>
        <div className="input-wrapper">
          <span className="input-icon-left" style={{ top: 12 }}>
            <FileTextIcon size={16} />
          </span>
          <textarea
            className={`form-input has-icon-left ${errors.description ? 'is-invalid' : ''}`}
            placeholder="Nhập ghi chú hoặc thông tin bổ sung về kho..."
            rows={3}
            style={{ resize: 'vertical' }}
            {...register('description')}
          />
        </div>
        {errors.description && (
          <span className="form-error">{errors.description.message}</span>
        )}
      </div>

      {isEdit && (
        <div className="form-group" style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{
                width: 16,
                height: 16,
                accentColor: 'var(--color-primary)',
                cursor: 'pointer',
              }}
              {...register('active')}
            />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)' }}>
                Đang hoạt động (Active)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                Kho không hoạt động sẽ không thể chọn khi tạo phiếu nhập/xuất hoặc chuyển kho mới.
              </p>
            </div>
          </label>
        </div>
      )}

      <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          Hủy bỏ
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {isEdit ? 'Lưu thay đổi' : 'Tạo mới kho'}
        </Button>
      </div>
    </form>
  );
}

export function WarehouseFormModal({
  isOpen,
  onClose,
  warehouse = null,
  onSubmit,
  isLoading,
}) {
  const isEdit = Boolean(warehouse);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa kho: ${warehouse?.name}` : 'Thêm mới kho lưu trữ'}
      size="md"
    >
      <WarehouseForm
        key={warehouse?.id || 'new'}
        initialData={warehouse}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
        isEdit={isEdit}
      />
    </Modal>
  );
}
