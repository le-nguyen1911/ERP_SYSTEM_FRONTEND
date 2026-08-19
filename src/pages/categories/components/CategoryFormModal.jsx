import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { TagIcon, FileTextIcon } from '../../../components/ui/Icons';

const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Tên danh mục không được để trống')
    .max(100, 'Tên danh mục tối đa 100 ký tự'),
  description: z
    .string()
    .max(255, 'Mô tả tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
});

function CategoryForm({ initialData, onSubmit, onClose, isLoading, isEdit }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(categorySchema),
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
        label="Tên danh mục"
        placeholder="Ví dụ: Thiết bị điện tử, Linh kiện, v.v."
        startIcon={<TagIcon size={16} />}
        error={errors.name?.message}
        required
        autoFocus
        {...register('name')}
      />

      <div className="form-group">
        <label className="form-label">
          Mô tả danh mục
        </label>
        <div className="input-wrapper">
          <span className="input-icon-left" style={{ top: 12 }}>
            <FileTextIcon size={16} />
          </span>
          <textarea
            className={`form-input has-icon-left ${errors.description ? 'is-invalid' : ''}`}
            placeholder="Nhập mô tả chi tiết danh mục (tối đa 255 ký tự)..."
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
          {isEdit ? 'Lưu thay đổi' : 'Tạo danh mục'}
        </Button>
      </div>
    </form>
  );
}

export function CategoryFormModal({
  isOpen,
  onClose,
  category = null,
  onSubmit,
  isLoading,
}) {
  const isEdit = Boolean(category);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa danh mục: ${category?.name}` : 'Tạo mới danh mục hàng hóa'}
      size="md"
    >
      <CategoryForm
        key={category?.id || 'new'}
        initialData={category}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
        isEdit={isEdit}
      />
    </Modal>
  );
}
