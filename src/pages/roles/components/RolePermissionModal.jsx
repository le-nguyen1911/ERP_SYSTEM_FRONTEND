import { useState, useMemo } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import {
  ShieldCheckIcon,
  SearchIcon,
  CheckIcon,
} from '../../../components/ui/Icons';
import { groupPermissionsByModule, MODULE_CONFIG } from '../../../utils/permissionGrouping';

function RolePermissionForm({
  role,
  allPermissions = [],
  onSubmit,
  onClose,
  isLoading,
}) {
  const [selectedPermissions, setSelectedPermissions] = useState(
    () => new Set(role?.permissions || [])
  );
  const [searchTerm, setSearchTerm] = useState('');

  // Filter permissions based on search keyword
  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) return allPermissions;
    const term = searchTerm.toLowerCase();
    return allPermissions.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [allPermissions, searchTerm]);

  // Group filtered permissions by module
  const groupedPermissions = useMemo(() => {
    return groupPermissionsByModule(filteredPermissions);
  }, [filteredPermissions]);

  // Handlers
  const handleTogglePermission = (permName) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(permName)) {
        next.delete(permName);
      } else {
        next.add(permName);
      }
      return next;
    });
  };

  const handleSelectAllInModule = (modulePerms) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev);
      const allSelected = modulePerms.every((p) => next.has(p.name));
      if (allSelected) {
        modulePerms.forEach((p) => next.delete(p.name));
      } else {
        modulePerms.forEach((p) => next.add(p.name));
      }
      return next;
    });
  };

  const handleSelectAllGlobal = () => {
    if (selectedPermissions.size === allPermissions.length) {
      setSelectedPermissions(new Set());
    } else {
      setSelectedPermissions(new Set(allPermissions.map((p) => p.name)));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onSubmit(Array.from(selectedPermissions));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header Info & Progress */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: '#f8fafc',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--color-primary-light)',
                color: 'var(--color-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShieldCheckIcon size={20} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-main)' }}>
                {role?.name}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                {role?.description || 'Không có mô tả'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: 999,
                backgroundColor: selectedPermissions.size > 0 ? 'var(--color-primary-light)' : '#f1f5f9',
                color: selectedPermissions.size > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
              }}
            >
              Đã chọn: <strong>{selectedPermissions.size}</strong> / {allPermissions.length} quyền
            </span>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAllGlobal}
            >
              {selectedPermissions.size === allPermissions.length ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
            </Button>
          </div>
        </div>

        {/* Search bar */}
        <div className="table-search-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            className="form-input has-icon-left"
            placeholder="Tìm kiếm quyền theo mã (VD: USER_CREATE, CATEGORY_VIEW) hoặc mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchIcon
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
            }}
          />
        </div>

        {/* Grouped Permission Accordion / Cards */}
        <div
          style={{
            maxHeight: '420px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            paddingRight: 4,
          }}
        >
          {Object.keys(groupedPermissions).length === 0 ? (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: 13,
              }}
            >
              Không tìm thấy quyền nào khớp với từ khóa &quot;{searchTerm}&quot;
            </div>
          ) : (
            Object.entries(groupedPermissions).map(([moduleKey, perms]) => {
              const config = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.OTHER;
              const moduleSelectedCount = perms.filter((p) => selectedPermissions.has(p.name)).length;
              const isAllModuleSelected = moduleSelectedCount === perms.length && perms.length > 0;

              return (
                <div
                  key={moduleKey}
                  style={{
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: '#ffffff',

                  }}
                >
                  {/* Module Header */}
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: config.bgColor,
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      objectFit: "cover",
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: config.color,
                        }}
                      />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)' }}>
                        {config.label} ({moduleKey})
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: config.color,
                          backgroundColor: '#ffffff',
                          padding: '2px 8px',
                          borderRadius: 10,
                          border: `1px solid ${config.color}30`,
                        }}
                      >
                        {moduleSelectedCount}/{perms.length}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectAllInModule(perms)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: 12,
                        color: config.color,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: '2px 6px',
                      }}
                    >
                      {isAllModuleSelected ? 'Bỏ chọn nhóm' : 'Chọn tất cả nhóm'}
                    </button>
                  </div>

                  {/* Permissions Grid */}
                  <div
                    style={{
                      padding: '12px 14px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                      gap: 10,
                    }}
                  >
                    {perms.map((perm) => {
                      const isChecked = selectedPermissions.has(perm.name);

                      return (
                        <label
                          key={perm.name}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 10,
                            padding: '8px 10px',
                            borderRadius: 'var(--radius-sm)',
                            border: `1px solid ${isChecked ? 'var(--color-primary)' : 'var(--color-border)'}`,
                            backgroundColor: isChecked ? 'var(--color-primary-light)' : '#ffffff',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                            userSelect: 'none',
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.name)}
                            style={{
                              marginTop: 3,
                              accentColor: 'var(--color-primary)',
                              cursor: 'pointer',
                            }}
                          />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: isChecked ? 'var(--color-primary)' : 'var(--color-text-main)',
                                fontFamily: 'monospace',
                                wordBreak: 'break-all',
                              }}
                            >
                              {perm.name}
                            </div>
                            {perm.description && (
                              <div
                                style={{
                                  fontSize: 11,
                                  color: 'var(--color-text-muted)',
                                  marginTop: 2,
                                }}
                              >
                                {perm.description}
                              </div>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
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
          icon={<CheckIcon size={16} />}
        >
          Lưu phân quyền ({selectedPermissions.size} quyền)
        </Button>
      </div>
    </form>
  );
}

export function RolePermissionModal({
  isOpen,
  onClose,
  role,
  allPermissions = [],
  onSubmit,
  isLoading,
}) {
  if (!role) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Phân quyền cho vai trò: ${role.name}`}
      size="lg"
    >
      <RolePermissionForm
        key={`${role.id}_${isOpen}`}
        role={role}
        allPermissions={allPermissions}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
      />
    </Modal>
  );
}
