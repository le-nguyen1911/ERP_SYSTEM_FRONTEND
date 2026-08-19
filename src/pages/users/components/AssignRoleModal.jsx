import { useState } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Alert } from '../../../components/ui/Alert';
import { ROLES } from '../../../utils/constants';

function AssignRoleForm({ user, allRoles = [], onSubmit, onClose, isLoading }) {
  const [selectedRoles, setSelectedRoles] = useState(() => Array.from(user?.roles || []));
  const [error, setError] = useState(null);

  const toggleRole = (roleName) => {
    setError(null);
    setSelectedRoles((prev) => {
      if (prev.includes(roleName)) {
        // Prevent deselecting all roles
        if (prev.length === 1) {
          setError('Người dùng phải có ít nhất một vai trò (Role)');
          return prev;
        }
        return prev.filter((r) => r !== roleName);
      } else {
        return [...prev, roleName];
      }
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (selectedRoles.length === 0) {
      setError('Vui lòng chọn ít nhất một vai trò');
      return;
    }

    const currentRoles = Array.from(user?.roles || []);
    const rolesToAdd = selectedRoles.filter((r) => !currentRoles.includes(r));
    const rolesToRemove = currentRoles.filter((r) => !selectedRoles.includes(r));

    if (rolesToAdd.length === 0 && rolesToRemove.length === 0) {
      onClose();
      return;
    }

    await onSubmit({
      userId: user.id,
      rolesToAdd,
      rolesToRemove,
      newRoles: selectedRoles,
    });
  };

  const getRoleVariant = (roleName) => {
    if (roleName === ROLES.ADMIN) return 'danger';
    if (roleName === ROLES.MANAGER) return 'warning';
    return 'primary';
  };

  return (
    <form onSubmit={handleFormSubmit}>
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 8 }}>
          Tài khoản: <strong>{user?.username}</strong> ({user?.email})
        </p>
        <p style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
          Chọn một hoặc nhiều vai trò để cấp quyền truy cập hệ thống cho người dùng này.
        </p>
      </div>

      {error && (
        <div style={{ marginBottom: 14 }}>
          <Alert variant="danger" title="Lỗi phân quyền">
            {error}
          </Alert>
        </div>
      )}

      <div className="checkbox-group">
        {allRoles.map((role) => {
          const isChecked = selectedRoles.includes(role.name);
          return (
            <label
              key={role.id || role.name}
              className={`checkbox-item ${isChecked ? 'checked' : ''}`}
              onClick={() => toggleRole(role.name)}
            >
              <input
                type="checkbox"
                className="checkbox-input"
                checked={isChecked}
                onChange={() => {}}
              />
              <div className="checkbox-text">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="checkbox-label">{role.name}</span>
                  <Badge variant={getRoleVariant(role.name)} size="xs">
                    {role.name}
                  </Badge>
                </div>
                <span className="checkbox-description">
                  {role.description || (role.name === 'ADMIN' ? 'Toàn quyền quản trị hệ thống' : role.name === 'MANAGER' ? 'Quản lý kho và sản phẩm' : 'Người dùng thông thường xem dữ liệu')}
                </span>
              </div>
            </label>
          );
        })}
      </div>

      <div className="modal-footer" style={{ margin: '24px -20px -20px -20px' }}>
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
          Cập nhật vai trò
        </Button>
      </div>
    </form>
  );
}

export function AssignRoleModal({
  isOpen,
  onClose,
  user,
  allRoles = [],
  onSubmit,
  isLoading,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phân quyền Vai trò: ${user?.fullName || user?.username || ''}`}
      size="md"
    >
      {user && (
        <AssignRoleForm
          key={user.id}
          user={user}
          allRoles={allRoles}
          onSubmit={onSubmit}
          onClose={onClose}
          isLoading={isLoading}
        />
      )}
    </Modal>
  );
}
