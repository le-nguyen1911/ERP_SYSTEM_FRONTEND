import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  ShieldCheckIcon,
  EditIcon,
  TrashIcon,
  SlidersIcon,
} from '../../../components/ui/Icons';
import { groupPermissionsByModule, MODULE_CONFIG } from '../../../utils/permissionGrouping';

export function RoleDetailModal({
  isOpen,
  onClose,
  role,
  onEdit,
  onManagePermissions,
  onDelete,
  canUpdate,
  canDelete,
}) {
  if (!role) return null;

  const rolePermissions = role.permissions || [];
  const grouped = groupPermissionsByModule(rolePermissions);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết vai trò người dùng"
      size="lg"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheckIcon size={26} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-text-main)', margin: 0 }}>
                {role.name}
              </h3>
              {role.name === 'ADMIN' && (
                <span className="badge badge-primary">Quản trị tối cao</span>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
              Mã định danh ID: <code className="font-mono">{role.id}</code>
            </span>
          </div>
        </div>

        {/* Role Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tên vai trò
            </span>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-main)', marginTop: 4 }}>
              {role.name}
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Tổng số quyền hạn
            </span>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-primary)', marginTop: 4 }}>
              {rolePermissions.length} quyền
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mô tả chi tiết
            </span>
            <div
              style={{
                fontSize: 13,
                color: role.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)',
                marginTop: 4,
                lineHeight: 1.6,
                padding: '10px 14px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
              }}
            >
              {role.description || 'Không có mô tả cho vai trò này.'}
            </div>
          </div>
        </div>

        {/* Assigned Permissions List */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-main)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Danh sách quyền đã cấp ({rolePermissions.length})
            </span>
            {canUpdate && (
              <Button
                variant="outline"
                size="sm"
                icon={<SlidersIcon size={14} />}
                onClick={() => {
                  onClose();
                  onManagePermissions(role);
                }}
              >
                Tùy chỉnh phân quyền
              </Button>
            )}
          </div>

          {rolePermissions.length === 0 ? (
            <div
              style={{
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                color: 'var(--color-text-muted)',
                fontSize: 13,
                border: '1px dashed var(--color-border)',
              }}
            >
              Chưa có quyền hạn nào được gán cho vai trò này.
            </div>
          ) : (
            <div
              style={{
                maxHeight: '300px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 10,
                backgroundColor: '#f8fafc',
              }}
            >
              {Object.entries(grouped).map(([moduleKey, perms]) => {
                const config = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.OTHER;

                return (
                  <div
                    key={moduleKey}
                    style={{
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        padding: '6px 10px',
                        backgroundColor: config.bgColor,
                        borderBottom: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        color: config.color,
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          backgroundColor: config.color,
                        }}
                      />
                      {config.label} ({perms.length})
                    </div>

                    <div
                      style={{
                        padding: '8px 10px',
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 6,
                      }}
                    >
                      {perms.map((p) => {
                        const name = typeof p === 'string' ? p : p.name;
                        return (
                          <span
                            key={name}
                            style={{
                              fontSize: 11,
                              fontFamily: 'monospace',
                              padding: '2px 8px',
                              borderRadius: 4,
                              backgroundColor: '#f1f5f9',
                              color: 'var(--color-text-main)',
                              border: '1px solid #e2e8f0',
                            }}
                          >
                            {name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick action toolbar */}
        {(canUpdate || canDelete) && (
          <div
            style={{
              padding: 12,
              backgroundColor: '#f8fafc',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--color-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-secondary)' }}>
              Thao tác nhanh:
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {canUpdate && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<SlidersIcon size={14} />}
                    onClick={() => {
                      onClose();
                      onManagePermissions(role);
                    }}
                  >
                    Phân quyền
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={<EditIcon size={14} />}
                    onClick={() => {
                      onClose();
                      onEdit(role);
                    }}
                  >
                    Chỉnh sửa
                  </Button>
                </>
              )}
              {canDelete && role.name !== 'ADMIN' && (
                <Button
                  variant="outline-danger"
                  size="sm"
                  icon={<TrashIcon size={14} />}
                  onClick={() => {
                    onClose();
                    onDelete(role);
                  }}
                >
                  Xóa
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="modal-footer" style={{ margin: '20px -20px -20px -20px' }}>
        <Button variant="secondary" onClick={onClose}>
          Đóng
        </Button>
      </div>
    </Modal>
  );
}
