import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import { useAuthStore } from '../../stores/useAuthStore';
import { toast } from '../../stores/useToastStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Alert } from '../../components/ui/Alert';
import { UserIcon, LockIcon } from '../../components/ui/Icons';

const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Vui lòng nhập tên đăng nhập')
    .min(6, 'Tên đăng nhập từ 6 đến 30 ký tự')
    .max(30, 'Tên đăng nhập tối đa 30 ký tự'),
  password: z
    .string()
    .min(1, 'Vui lòng nhập mật khẩu')
    .min(6, 'Mật khẩu tối thiểu 6 ký tự'),
});

export function LoginPage() {
  const [serverError, setServerError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const from = location.state?.from?.pathname || '/dashboard';

  const onSubmit = async (data) => {
    try {
      setIsLoading(true);
      setServerError(null);

      const response = await authApi.login({
        username: data.username.trim(),
        password: data.password,
      });

      if (response?.data) {
        setAuth(response.data);
        toast.success(`Chào mừng trở lại, ${response.data.user?.fullName || response.data.user?.username}!`);
        navigate(from, { replace: true });
      }
    } catch (err) {
      setServerError(err.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại tài khoản.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card">
      <div className="auth-card-header">
        <h2 className="auth-title">Đăng nhập hệ thống</h2>
        <p className="auth-subtitle">
          Nhập thông tin xác thực để truy cập cổng quản trị ERP
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
          label="Tên đăng nhập"
          name="username"
          placeholder="Nhập username (VD: admin, manager, user)"
          icon={UserIcon}
          required
          autoComplete="username"
          autoFocus
          error={errors.username?.message}
          {...register('username')}
        />

        <Input
          label="Mật khẩu"
          name="password"
          type="password"
          placeholder="••••••••"
          icon={LockIcon}
          required
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />

        <div className="auth-form-actions">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            className="w-full"
          >
            Đăng nhập
          </Button>
        </div>
      </form>

      <div className="auth-card-footer">
        <p className="text-muted text-sm">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link font-medium">
            Đăng ký tài khoản mới
          </Link>
        </p>
      </div>
    </div>
  );
}
