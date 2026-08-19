import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { UserIcon, MailIcon, LockIcon } from '../../../components/ui/Icons';

const createUserSchema = z.object({
  username: z
    .string()
    .min(6, 'Username phải từ 6 đến 30 ký tự')
    .max(30, 'Username tối đa 30 ký tự')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Username chỉ chứa chữ cái, số và dấu . _ -'),
  password: z
    .string()
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng'),
  fullname: z
    .string()
    .optional(),
});

export function CreateUserModal({ isOpen, onClose, onSubmit, isLoading }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      username: '',
      password: '',
      email: '',
      fullname: '',
    },
  });

  const handleFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Tạo mới tài khoản người dùng"
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <Input
          label="Tên đăng nhập (Username)"
          placeholder="Nhập tên đăng nhập (6-30 ký tự)"
          startIcon={<UserIcon size={16} />}
          error={errors.username?.message}
          required
          autoComplete="username"
          {...register('username')}
        />

        <Input
          label="Họ và tên"
          placeholder="Ví dụ: Nguyễn Văn A"
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
          autoComplete="email"
          {...register('email')}
        />

        <Input
          label="Mật khẩu khởi tạo"
          type="password"
          placeholder="Tối thiểu 6 ký tự"
          startIcon={<LockIcon size={16} />}
          error={errors.password?.message}
          required
          autoComplete="new-password"
          {...register('password')}
        />

        <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Tạo tài khoản
          </Button>
        </div>
      </form>
    </Modal>
  );
}
