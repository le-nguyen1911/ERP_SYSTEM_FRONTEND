import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../stores/useToastStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { UserIcon, LockIcon, MailIcon } from '../../components/ui/Icons';

const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, 'Vui lòng nhập tên đăng nhập')
      .min(6, 'Tên đăng nhập từ 6 đến 30 ký tự')
      .max(30, 'Tên đăng nhập tối đa 30 ký tự'),
    fullname: z.string().min(1, 'Vui lòng nhập họ và tên'),
    email: z.string().min(1, 'Vui lòng nhập email').email('Email không đúng định dạng'),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu')
      .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu xác nhận không khớp',
    path: ['confirmPassword'],
  });

export function RegisterPage() {
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      fullname: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setServerError(null);

      const response = await authApi.register({
        username: data.username.trim(),
        fullname: data.fullname.trim(),
        email: data.email.trim(),
        password: data.password,
      });

      if (response?.data) {
        setAuth(response.data);
        toast.success('Đăng ký tài khoản thành công! Bạn đã được đăng nhập.');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Đăng ký không thành công. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-title">Đăng ký tài khoản</h2>
        <p className="auth-subtitle">
          Tạo tài khoản mới để tham gia vào hệ thống ERP
        </p>
      </div>

      {serverError && (
        <Alert
          variant="danger"
          className="mb-4"
          onClose={() => setServerError(null)}
        >
          {serverError}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="auth-form" noValidate>
        <Input
          label="Họ và tên"
          name="fullname"
          placeholder="Nguyễn Văn A"
          icon={UserIcon}
          required
          autoFocus
          error={errors.fullname?.message}
          {...register('fullname')}
        />

        <Input
          label="Tên đăng nhập"
          name="username"
          placeholder="username (tối thiểu 6 ký tự)"
          icon={UserIcon}
          required
          autoComplete="username"
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Địa chỉ Email"
          name="email"
          type="email"
          placeholder="example@company.com"
          icon={MailIcon}
          required
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />

        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          placeholder="••••••••"
          icon={LockIcon}
          required
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <Input
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          placeholder="••••••••"
          icon={LockIcon}
          required
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />

        <div className="auth-form-actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            Đăng ký tài khoản
          </Button>
        </div>
      </form>

      <div className="auth-card-footer">
        <p className="text-muted text-sm">
          Đã có tài khoản?{' '}
          <Link to="/login" className="auth-link font-medium">
            Đăng nhập ngay
          </Link>
        </p>
      </div>
    </div>
  );
}
