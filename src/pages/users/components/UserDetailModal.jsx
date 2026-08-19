import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { ROLES } from '../../../utils/constants';
import { ShieldIcon, LockIcon, UnlockIcon, EditIcon } from '../../../components/ui/Icons';

export function UserDetailModal({
  isOpen,
  onClose,
  user,
  onEdit,
  onAssignRole,
  onToggleLock,
  isAdmin,
  canUpdate,
}) {
  if (!user) return null;

  const getRoleVariant = (roleName) => {
    if (roleName === ROLES.ADMIN) return 'danger';
    if (roleName === ROLES.MANAGER) return 'warning';
    return 'primary';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết tài khoản người dùng"
      size="md"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header with Avatar & Status */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              backgroundColor: 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 22,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.fullName || user.username}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            ) : (
              user.fullName ? user.fullName[0].toUpperCase() : user.username[0].toUpperCase()
            )}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
              {user.fullName || user.username}
            </h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '2px 0 6px' }}>
              @{user.username}
            </p>
            <div style={{ display: 'flex', gap: 6 }}>
              {user.enabled !== false ? (
                <Badge variant="success" size="xs">
                  Đang hoạt động
                </Badge>
              ) : (
                <Badge variant="danger" size="xs">
                  Đã bị khóa
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Mã định danh (ID):</span>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>
              {user.id}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Địa chỉ Email:</span>
            <span style={{ fontWeight: 500, color: 'var(--color-text-main)' }}>{user.email}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Họ và tên:</span>
            <span style={{ color: 'var(--color-text-main)' }}>{user.fullName || '—'}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
            <span style={{ color: 'var(--color-text-muted)' }}>Vai trò & Quyền hạn:</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {user.roles && Array.from(user.roles).length > 0 ? (
                Array.from(user.roles).map((r) => (
                  <Badge key={r} variant={getRoleVariant(r)} size="xs">
                    {r}
                  </Badge>
                ))
              ) : (
                <span style={{ color: 'var(--color-text-muted)' }}>Chưa có vai trò</span>
              )}
            </div>
          </div>
        </div>

        {/* Management Quick Actions */}
        <div
          style={{
            marginTop: 8,
            padding: 14,
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
            Thao tác nhanh:
          </span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                icon={<EditIcon size={14} />}
                onClick={() => {
                  onClose();
                  onEdit(user);
                }}
              >
                Chỉnh sửa
              </Button>
            )}

            {isAdmin && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ShieldIcon size={14} />}
                  onClick={() => {
                    onClose();
                    onAssignRole(user);
                  }}
                >
                  Phân vai trò
                </Button>

                <Button
                  variant={user.enabled !== false ? 'outline-danger' : 'outline'}
                  size="sm"
                  icon={user.enabled !== false ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
                  onClick={() => {
                    onClose();
                    onToggleLock(user);
                  }}
                >
                  {user.enabled !== false ? 'Khóa tài khoản' : 'Mở khóa'}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
