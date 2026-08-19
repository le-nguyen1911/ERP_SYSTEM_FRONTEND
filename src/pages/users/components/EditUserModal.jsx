import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { MailIcon, UserIcon } from '../../../components/ui/Icons';

const editUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ'),
  fullname: z
    .string()
    .optional(),
  avatar: z
    .string()
    .optional(),
});

export function EditUserModal({ isOpen, onClose, user, onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      email: '',
      fullname: '',
      avatar: '',
    },
  });

  useEffect(() => {
    if (user) {
      reset({
        email: user.email || '',
        fullname: user.fullName || '',
        avatar: user.avatar || '',
      });
    }
  }, [user, reset]);

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Cập nhật thông tin: ${user?.username || ''}`}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <Input
          label="Tên đăng nhập"
          value={user?.username || ''}
          disabled
          helperText="Tên đăng nhập không thể thay đổi"
        />

        <Input
          label="Họ và tên"
          placeholder="Nhập họ và tên"
          startIcon={<UserIcon size={16} />}
          error={errors.fullname?.message}
          {...register('fullname')}
        />

        <Input
          label="Địa chỉ Email"
          type="email"
          placeholder="name@company.com"
          startIcon={<MailIcon size={16} />}
          error={errors.email?.message}
          required
          {...register('email')}
        />

        <Input
          label="Đường dẫn Avatar (Tùy chọn)"
          placeholder="https://example.com/avatar.jpg"
          error={errors.avatar?.message}
          {...register('avatar')}
        />

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
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}
