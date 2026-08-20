import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { roleApi } from '../../api/roleApi';
import { permissionApi } from '../../api/permissionApi';
import { usePermission } from '../../hooks/usePermission';
import { ROLES, PERMISSIONS } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { ConfirmModal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  ShieldCheckIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  EyeIcon,
  RefreshCwIcon,
  SlidersIcon,
  KeyRoundIcon,
} from '../../components/ui/Icons';

// Sub-components
import { RoleFormModal } from './components/RoleFormModal';
import { RoleDetailModal } from './components/RoleDetailModal';
import { RolePermissionModal } from './components/RolePermissionModal';
import { CreatePermissionModal } from './components/CreatePermissionModal';
import { groupPermissionsByModule, MODULE_CONFIG } from '../../utils/permissionGrouping';

export function RoleManagementPage() {
  const queryClient = useQueryClient();
  const { hasRole, hasPermission, isAdmin } = usePermission();

  // Admin access check
  const canManageRoles = hasRole(ROLES.ADMIN) || isAdmin;
  const canCreateRole = canManageRoles || hasPermission(PERMISSIONS.USER_CREATE);
  const canUpdateRole = canManageRoles || hasPermission(PERMISSIONS.USER_UPDATE);
  const canDeleteRole = canManageRoles || hasPermission(PERMISSIONS.USER_DELETE);

  // Active view tab ('roles' | 'permissions')
  const [activeTab, setActiveTab] = useState('roles');

  // State for modals
  const [searchTerm, setSearchTerm] = useState('');
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [createPermModalOpen, setCreatePermModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // 1. Fetch Roles Query
  const {
    data: rolesResponse,
    isLoading: isLoadingRoles,
    isError: isErrorRoles,
    error: errorRoles,
    refetch: refetchRoles,
    isFetching: isFetchingRoles,
  } = useQuery({
    queryKey: ['roles'],
    queryFn: () => roleApi.getRoles(),
  });

  // 2. Fetch All Permissions Query
  const {
    data: permissionsResponse,
    isLoading: isLoadingPerms,
    refetch: refetchPerms,
    isFetching: isFetchingPerms,
  } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => permissionApi.getPermissions(),
  });

  const rolesList = useMemo(() => rolesResponse?.data || [], [rolesResponse?.data]);
  const permissionsList = useMemo(() => permissionsResponse?.data || [], [permissionsResponse?.data]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return rolesList;
    const term = searchTerm.toLowerCase();
    return rolesList.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    );
  }, [rolesList, searchTerm]);

  // Filtered Permissions for Permissions Tab
  const filteredPermissions = useMemo(() => {
    if (!searchTerm.trim()) return permissionsList;
    const term = searchTerm.toLowerCase();
    return permissionsList.filter(
      (p) =>
        p.name?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [permissionsList, searchTerm]);

  const groupedPermissionsTab = useMemo(() => {
    return groupPermissionsByModule(filteredPermissions);
  }, [filteredPermissions]);

  // Mutations
  // Create Role Mutation
  const createRoleMutation = useMutation({
    mutationFn: (data) => roleApi.createRole(data),
    onSuccess: () => {
      toast.success('Tạo vai trò người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setFormModalOpen(false);
      setSelectedRole(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo vai trò');
    },
  });

  // Update Role Mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }) => roleApi.updateRole(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin vai trò thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setFormModalOpen(false);
      setSelectedRole(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật vai trò');
    },
  });

  // Delete Role Mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id) => roleApi.deleteRole(id),
    onSuccess: () => {
      toast.success('Đã xóa vai trò thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setDeleteConfirmOpen(false);
      setSelectedRole(null);
    },
    onError: (err) => {
      setDeleteConfirmOpen(false);
      setSelectedRole(null);
      toast.error(err.message || 'Không thể xóa vai trò. Vui lòng kiểm tra lại.');
    },
  });

  // Set Permissions for Role Mutation
  const setPermissionsMutation = useMutation({
    mutationFn: ({ id, permissions }) => roleApi.setPermissions(id, permissions),
    onSuccess: () => {
      toast.success('Cập nhật phân quyền cho vai trò thành công');
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      setPermissionModalOpen(false);
      setSelectedRole(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi cập nhật phân quyền');
    },
  });

  // Create Custom Permission Mutation
  const createPermissionMutation = useMutation({
    mutationFn: (data) => permissionApi.createPermission(data),
    onSuccess: () => {
      toast.success('Tạo quyền hạn hệ thống thành công');
      queryClient.invalidateQueries({ queryKey: ['permissions'] });
      setCreatePermModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo quyền hạn');
    },
  });

  // Handlers
  const handleOpenCreateRole = () => {
    setSelectedRole(null);
    setFormModalOpen(true);
  };

  const handleOpenEditRole = (role) => {
    setSelectedRole(role);
    setFormModalOpen(true);
  };

  const handleOpenDetailRole = (role) => {
    setSelectedRole(role);
    setDetailModalOpen(true);
  };

  const handleOpenManagePermissions = (role) => {
    setSelectedRole(role);
    setPermissionModalOpen(true);
  };

  const handleOpenDeleteRole = (role) => {
    if (role.name === 'ADMIN') {
      toast.error('Không thể xóa vai trò quản trị hệ thống ADMIN');
      return;
    }
    setSelectedRole(role);
    setDeleteConfirmOpen(true);
  };

  const handleRoleFormSubmit = async (formData) => {
    if (selectedRole) {
      await updateRoleMutation.mutateAsync({
        id: selectedRole.id,
        data: formData,
      });
    } else {
      await createRoleMutation.mutateAsync(formData);
    }
  };

  const handlePermissionSave = async (selectedPermsList) => {
    if (!selectedRole) return;
    await setPermissionsMutation.mutateAsync({
      id: selectedRole.id,
      permissions: selectedPermsList,
    });
  };

  const handleRefresh = () => {
    refetchRoles();
    refetchPerms();
  };

  const isFetching = isFetchingRoles || isFetchingPerms;

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheckIcon size={26} className="text-primary" />
            Quản lý Vai trò & Phân quyền (RBAC)
          </h1>
          <p className="page-subtitle">
            Thiết lập vai trò người dùng, cấu hình ma trận phân quyền chi tiết cho từng phân hệ nghiệp vụ.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isFetching ? 'spinner-inline' : ''} />}
            onClick={handleRefresh}
            disabled={isFetching}
            title="Làm mới dữ liệu"
          >
            Làm mới
          </Button>

          {canCreateRole && activeTab === 'roles' && (
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={handleOpenCreateRole}
            >
              Thêm vai trò mới
            </Button>
          )}

          {canCreateRole && activeTab === 'permissions' && (
            <Button
              variant="primary"
              icon={<KeyRoundIcon size={16} />}
              onClick={() => setCreatePermModalOpen(true)}
            >
              Tạo quyền tùy chỉnh
            </Button>
          )}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', marginBottom: 20 }}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('roles');
            setSearchTerm('');
          }}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            color: activeTab === 'roles' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'roles' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <ShieldCheckIcon size={18} />
          Danh sách Vai trò ({rolesList.length})
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('permissions');
            setSearchTerm('');
          }}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 700,
            color: activeTab === 'permissions' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            borderBottom: activeTab === 'permissions' ? '2px solid var(--color-primary)' : '2px solid transparent',
            background: 'none',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <KeyRoundIcon size={18} />
          Ma trận Quyền hạn Hệ thống ({permissionsList.length})
        </button>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-search-input" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder={
                activeTab === 'roles'
                  ? 'Tìm kiếm vai trò theo mã, mô tả...'
                  : 'Tìm kiếm mã quyền, chức năng phân hệ...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <SearchIcon
              size={18}
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
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            {activeTab === 'roles' ? (
              <>Tổng cộng: <strong>{rolesList.length}</strong> vai trò</>
            ) : (
              <>Tổng cộng: <strong>{permissionsList.length}</strong> quyền hạn</>
            )}
          </span>
        </div>
      </div>

      {/* Content View: Tab 1 (Roles) */}
      {activeTab === 'roles' && (
        <div className="table-container">
          {isLoadingRoles ? (
            <LoadingState message="Đang tải danh sách vai trò..." minHeight="300px" />
          ) : isErrorRoles ? (
            <div style={{ padding: 24 }}>
              <Alert variant="danger" title="Lỗi khi tải danh sách vai trò">
                {errorRoles?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
              </Alert>
              <div style={{ marginTop: 16, textAlign: 'center' }}>
                <Button variant="outline" onClick={() => refetchRoles()}>
                  Thử lại
                </Button>
              </div>
            </div>
          ) : filteredRoles.length === 0 ? (
            <EmptyState
              icon={ShieldCheckIcon}
              title="Không tìm thấy vai trò"
              description={
                searchTerm
                  ? `Không có vai trò nào khớp với từ khóa "${searchTerm}".`
                  : 'Chưa có vai trò người dùng nào trong hệ thống.'
              }
              action={
                searchTerm ? (
                  <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                    Xóa tìm kiếm
                  </Button>
                ) : canCreateRole ? (
                  <Button variant="primary" size="sm" icon={<PlusIcon size={14} />} onClick={handleOpenCreateRole}>
                    Tạo vai trò đầu tiên
                  </Button>
                ) : null
              }
            />
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '22%' }}>Tên vai trò</th>
                  <th style={{ width: '38%' }}>Mô tả vai trò</th>
                  <th style={{ width: '20%' }}>Quyền hạn đã cấp</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRoles.map((role) => {
                  const permCount = role.permissions?.length || 0;
                  const isAdminRole = role.name === 'ADMIN';

                  return (
                    <tr key={role.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 'var(--radius-md)',
                              backgroundColor: isAdminRole ? '#fef3c7' : 'var(--color-primary-light)',
                              color: isAdminRole ? '#d97706' : 'var(--color-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <ShieldCheckIcon size={18} />
                          </div>
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--color-text-main)' }}>
                              {role.name}
                            </span>
                            {isAdminRole && (
                              <span
                                style={{
                                  display: 'inline-block',
                                  marginLeft: 8,
                                  fontSize: 10,
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: 4,
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  border: '1px solid #fde68a',
                                }}
                              >
                                Hệ thống
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ color: role.description ? 'var(--color-text-secondary)' : 'var(--color-text-muted)', fontSize: 13 }}>
                          {role.description || '—'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenManagePermissions(role)}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                          title="Bấm để tùy chỉnh phân quyền"
                        >
                          <span
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              padding: '3px 8px',
                              borderRadius: 999,
                              backgroundColor: permCount > 0 ? 'var(--color-primary-light)' : '#f1f5f9',
                              color: permCount > 0 ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <SlidersIcon size={12} />
                            {permCount} quyền
                          </span>
                        </button>
                      </td>

                      <td>
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleOpenDetailRole(role)}
                            title="Xem chi tiết vai trò"
                          >
                            <EyeIcon size={14} />
                          </button>

                          {canUpdateRole && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleOpenManagePermissions(role)}
                                title="Phân quyền hạn"
                              >
                                <SlidersIcon size={14} />
                              </button>

                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleOpenEditRole(role)}
                                title="Chỉnh sửa thông tin"
                              >
                                <EditIcon size={14} />
                              </button>
                            </>
                          )}

                          {canDeleteRole && !isAdminRole && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleOpenDeleteRole(role)}
                              title="Xóa vai trò"
                            >
                              <TrashIcon size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Content View: Tab 2 (Permissions Matrix) */}
      {activeTab === 'permissions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isLoadingPerms ? (
            <LoadingState message="Đang tải danh sách quyền hạn..." minHeight="300px" />
          ) : filteredPermissions.length === 0 ? (
            <EmptyState
              icon={KeyRoundIcon}
              title="Không tìm thấy quyền hạn"
              description={`Không có quyền nào khớp với từ khóa "${searchTerm}".`}
              action={
                <Button variant="outline" size="sm" onClick={() => setSearchTerm('')}>
                  Xóa tìm kiếm
                </Button>
              }
            />
          ) : (
            Object.entries(groupedPermissionsTab).map(([moduleKey, perms]) => {
              const config = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.OTHER;

              return (
                <div
                  key={moduleKey}
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--radius-md)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '10px 16px',
                      backgroundColor: config.bgColor,
                      borderBottom: '1px solid var(--color-border)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        backgroundColor: config.color,
                      }}
                    />
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-main)' }}>
                      {config.label}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        backgroundColor: '#ffffff',
                        color: config.color,
                        padding: '2px 8px',
                        borderRadius: 10,
                        border: `1px solid ${config.color}30`,
                      }}
                    >
                      {perms.length} quyền
                    </span>
                  </div>

                  <div
                    style={{
                      padding: 16,
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: 12,
                    }}
                  >
                    {perms.map((perm) => (
                      <div
                        key={perm.name}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          backgroundColor: '#f8fafc',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <KeyRoundIcon size={14} style={{ color: config.color }} />
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'monospace', color: 'var(--color-text-main)' }}>
                            {perm.name}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginTop: 4 }}>
                          {perm.description || 'Không có mô tả'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Modals */}
      {/* 1. Create / Edit Role Modal */}
      <RoleFormModal
        isOpen={formModalOpen}
        onClose={() => {
          setFormModalOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        allPermissions={permissionsList}
        onSubmit={handleRoleFormSubmit}
        isLoading={createRoleMutation.isPending || updateRoleMutation.isPending}
      />

      {/* 2. Detail Role Modal */}
      <RoleDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        onEdit={handleOpenEditRole}
        onManagePermissions={handleOpenManagePermissions}
        onDelete={handleOpenDeleteRole}
        canUpdate={canUpdateRole}
        canDelete={canDeleteRole}
      />

      {/* 3. Manage Permissions Modal */}
      <RolePermissionModal
        isOpen={permissionModalOpen}
        onClose={() => {
          setPermissionModalOpen(false);
          setSelectedRole(null);
        }}
        role={selectedRole}
        allPermissions={permissionsList}
        onSubmit={handlePermissionSave}
        isLoading={setPermissionsMutation.isPending}
      />

      {/* 4. Create Custom Permission Modal */}
      <CreatePermissionModal
        isOpen={createPermModalOpen}
        onClose={() => setCreatePermModalOpen(false)}
        onSubmit={createPermissionMutation.mutateAsync}
        isLoading={createPermissionMutation.isPending}
      />

      {/* 5. Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedRole(null);
        }}
        onConfirm={() => deleteRoleMutation.mutateAsync(selectedRole?.id)}
        title={`Xác nhận xóa vai trò "${selectedRole?.name}"?`}
        message="Hành động này sẽ xóa vai trò khỏi hệ thống. Lưu ý: Không thể xóa vai trò nếu đang có người dùng được gán vai trò này."
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteRoleMutation.isPending}
      />
    </div>
  );
}
