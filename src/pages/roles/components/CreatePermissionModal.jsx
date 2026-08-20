import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { KeyRoundIcon, FileTextIcon } from '../../../components/ui/Icons';

const permissionSchema = z.object({
  name: z
    .string()
    .min(1, 'Mã quyền không được để trống')
    .max(50, 'Mã quyền tối đa 50 ký tự')
    .regex(/^[A-Za-z0-9_]+$/, 'Mã quyền chỉ bao gồm chữ in hoa, số và dấu gạch dưới (VD: INVENTORY_AUDIT, REPORT_EXPORT)'),
  description: z
    .string()
    .max(255, 'Mô tả tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
});

export function CreatePermissionModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) {
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(permissionSchema),
    defaultValues: {
      name: '',
      description: '',
    },
  });

  const handleFormSubmit = async (data) => {
    await onSubmit({
      name: data.name.trim().toUpperCase(),
      description: data.description ? data.description.trim() : null,
    });
    reset();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Tạo mới Quyền hạn Hệ thống"
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <Input
          label="Mã quyền hạn (Permission Code)"
          placeholder="Ví dụ: REPORT_EXPORT, AUDIT_PURGE, v.v."
          startIcon={<KeyRoundIcon size={16} />}
          error={errors.name?.message}
          required
          autoFocus
          helperText="Định dạng viết hoa, không dấu cách (VD: PRODUCT_EXPORT_EXCEL)"
          {...register('name')}
          onChange={(e) => {
            setValue('name', e.target.value.toUpperCase());
          }}
        />

        <div className="form-group">
          <label className="form-label">
            Mô tả quyền hạn
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left" style={{ top: 12 }}>
              <FileTextIcon size={16} />
            </span>
            <textarea
              className={`form-input has-icon-left ${errors.description ? 'is-invalid' : ''}`}
              placeholder="Nhập mô tả chi tiết quyền hạn này làm được những gì trong hệ thống..."
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
            Tạo quyền hạn
          </Button>
        </div>
      </form>
    </Modal>
  );
}
