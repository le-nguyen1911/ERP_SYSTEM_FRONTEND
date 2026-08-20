import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ScaleIcon, FileTextIcon } from '../../../components/ui/Icons';

const unitSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên đơn vị tính không được để trống')
    .max(50, 'Tên đơn vị tính tối đa 50 ký tự'),
  description: z
    .string()
    .max(255, 'Mô tả tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
});

function UnitForm({ initialData, onSubmit, onClose, isLoading, isEdit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(unitSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  const handleFormSubmit = async (data) => {
    await onSubmit({
      name: data.name.trim(),
      description: data.description ? data.description.trim() : null,
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Input
        label="Tên đơn vị tính"
        placeholder="Ví dụ: Cái, Hộp, Kg, Thùng, Chiếc, v.v."
        startIcon={<ScaleIcon size={16} />}
        error={errors.name?.message}
        required
        autoFocus
        {...register('name')}
      />

      <div className="form-group">
        <label className="form-label">
          Mô tả đơn vị tính
        </label>
        <div className="input-wrapper">
          <span className="input-icon-left" style={{ top: 12 }}>
            <FileTextIcon size={16} />
          </span>
          <textarea
            className={`form-input has-icon-left ${errors.description ? 'is-invalid' : ''}`}
            placeholder="Nhập mô tả chi tiết đơn vị tính (tối đa 255 ký tự)..."
            rows={3}
            style={{ resize: 'vertical' }}
            {...register('description')}
          />
        </div>
        {errors.description && (
          <span className="form-error">{errors.description.message}</span>
        )}
      </div>

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
          {isEdit ? 'Lưu thay đổi' : 'Tạo đơn vị tính'}
        </Button>
      </div>
    </form>
  );
}

export function UnitFormModal({
  isOpen,
  onClose,
  unit = null,
  onSubmit,
  isLoading,
}) {
  const isEdit = Boolean(unit);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa đơn vị tính: ${unit?.name}` : 'Tạo mới đơn vị tính'}
      size="md"
    >
      <UnitForm
        key={unit?.id || 'new'}
        initialData={unit}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
        isEdit={isEdit}
      />
    </Modal>
  );
}
