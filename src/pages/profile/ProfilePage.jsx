import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePermission } from '../../hooks/usePermission';
import { authApi } from '../../api/authApi';
import { toast } from '../../stores/useToastStore';
import { ROLES } from '../../utils/constants';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';
import {
  LockIcon,
  ShieldIcon,
  KeyIcon,
} from '../../components/ui/Icons';

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu mới')
      .min(6, 'Mật khẩu mới tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu mới'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Mật khẩu mới không trùng khớp',
    path: ['confirmPassword'],
  })
  .refine((data) => data.oldPassword !== data.newPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu cũ',
    path: ['newPassword'],
  });

export function ProfilePage() {
  const { user } = useAuthStore();
  const { permissions, isAdmin } = usePermission();
  const [passwordError, setPasswordError] = useState(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmitPassword = async (data) => {
    try {
      setIsChangingPassword(true);
      setPasswordError(null);

      await authApi.changePassword({
        oldPassword: data.oldPassword,
        newPassword: data.newPassword,
      });

      toast.success('Đổi mật khẩu thành công!');
      reset();
    } catch (err) {
      setPasswordError(err.message || 'Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu cũ.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Hồ Sơ & Bảo Mật</h1>
          <p className="page-subtitle">
            Xem thông tin tài khoản, vai trò và thay đổi mật khẩu đăng nhập.
          </p>
        </div>
      </div>

      <div className="profile-grid">
        {/* Account Info Card */}
        <Card title="Thông tin tài khoản" className="profile-info-card">
          <div className="profile-user-header">
            <div className="profile-avatar-large">
              {user?.fullName ? user.fullName[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h3 className="profile-user-fullname">{user?.fullName || user?.username}</h3>
              <p className="profile-user-email text-muted">{user?.email}</p>
              <div className="profile-user-roles">
                {user?.roles?.map((r) => (
                  <Badge
                    key={r}
                    variant={r === ROLES.ADMIN ? 'danger' : r === ROLES.MANAGER ? 'warning' : 'primary'}
                  >
                    Vai trò: {r}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="profile-details-list">
            <div className="profile-detail-item">
              <span className="detail-label">Tên đăng nhập:</span>
              <span className="detail-value font-mono font-medium">{user?.username}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Mã định danh (ID):</span>
              <span className="detail-value font-mono text-muted text-xs">{user?.id}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Trạng thái:</span>
              <Badge variant="success" size="xs">Đang hoạt động</Badge>
            </div>
          </div>

          <div className="profile-permissions-section">
            <h4 className="permissions-title">
              <ShieldIcon size={16} /> Danh sách quyền truy cập ({isAdmin ? 'Toàn quyền ADMIN' : permissions.length}):
            </h4>
            <div className="permissions-tags">
              {isAdmin ? (
                <Badge variant="danger" size="sm">
                  ALL_PERMISSIONS (Toàn bộ 27+ quyền hệ thống)
                </Badge>
              ) : permissions.length > 0 ? (
                permissions.map((p) => (
                  <Badge key={p} variant="neutral" size="xs">
                    {p}
                  </Badge>
                ))
              ) : (
                <span className="text-muted text-sm">Chưa có quyền cụ thể</span>
              )}
            </div>
          </div>
        </Card>

        {/* Change Password Card */}
        <Card
          title="Đổi mật khẩu"
          subtitle="Cập nhật mật khẩu thường xuyên để tăng cường bảo mật"
          className="profile-password-card"
        >
          {passwordError && (
            <Alert
              variant="danger"
              className="mb-4"
              onClose={() => setPasswordError(null)}
            >
              {passwordError}
            </Alert>
          )}

          <form onSubmit={handleSubmit(onSubmitPassword)} noValidate>
            <Input
              label="Mật khẩu hiện tại"
              name="oldPassword"
              type="password"
              placeholder="Nhập mật khẩu đang sử dụng"
              icon={LockIcon}
              required
              error={errors.oldPassword?.message}
              {...register('oldPassword')}
            />

            <Input
              label="Mật khẩu mới"
              name="newPassword"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              icon={KeyIcon}
              required
              error={errors.newPassword?.message}
              {...register('newPassword')}
            />

            <Input
              label="Xác nhận mật khẩu mới"
              name="confirmPassword"
              type="password"
              placeholder="Nhập lại mật khẩu mới"
              icon={KeyIcon}
              required
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="mt-4">
              <Button
                type="submit"
                variant="primary"
                isLoading={isChangingPassword}
              >
                Cập nhật mật khẩu
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
