import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userApi } from '../../api/userApi';
import { usePermission } from '../../hooks/usePermission';
import { PERMISSIONS, ROLES } from '../../utils/constants';
import { toast } from '../../stores/useToastStore';

// UI & Feedback Components
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { ConfirmModal } from '../../components/ui/Modal';
import { LoadingState } from '../../components/feedback/LoadingState';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Alert } from '../../components/ui/Alert';

// Icons
import {
  UsersIcon,
  PlusIcon,
  SearchIcon,
  EditIcon,
  TrashIcon,
  LockIcon,
  UnlockIcon,
  ShieldIcon,
  EyeIcon,
  RefreshCwIcon,
} from '../../components/ui/Icons';

// Modal & Sub-components
import { CreateUserModal } from './components/CreateUserModal';
import { EditUserModal } from './components/EditUserModal';
import { AssignRoleModal } from './components/AssignRoleModal';
import { UserDetailModal } from './components/UserDetailModal';
import { UserPagination } from './components/UserPagination';

export function UserManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission, isAdmin } = usePermission();

  // RBAC Permission flags
  const canCreate = hasPermission(PERMISSIONS.USER_CREATE) || isAdmin;
  const canUpdate = hasPermission(PERMISSIONS.USER_UPDATE) || isAdmin;
  const canDelete = hasPermission(PERMISSIONS.USER_DELETE) || isAdmin;

  // Pagination & Filtering state
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');

  // Modal active states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [assignRoleModalOpen, setAssignRoleModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [lockConfirmOpen, setLockConfirmOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Selected user target
  const [selectedUser, setSelectedUser] = useState(null);

  // 1. Fetch Users Query (Spring Data Pageable)
  const {
    data: usersApiResponse,
    isLoading: isUsersLoading,
    isError: isUsersError,
    error: usersError,
    refetch: refetchUsers,
    isFetching: isUsersFetching,
  } = useQuery({
    queryKey: ['users', page, pageSize],
    queryFn: () => userApi.getUsers({ page, size: pageSize, sort: 'createdAt,desc' }),
  });

  // 2. Fetch Roles List Query (for role management & filter)
  const { data: rolesApiResponse } = useQuery({
    queryKey: ['roles'],
    queryFn: () => userApi.getRoles(),
    enabled: isAdmin,
  });

  const pageData = usersApiResponse?.data;
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;
  const allRoles = rolesApiResponse?.data || [];

  // Filter users by search term and role on the current page
  const filteredUsers = useMemo(() => {
    const list = usersApiResponse?.data?.content || [];
    return list.filter((user) => {
      const matchSearch =
        !searchTerm.trim() ||
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchRole =
        roleFilter === 'ALL' ||
        (user.roles && user.roles.includes(roleFilter));

      return matchSearch && matchRole;
    });
  }, [usersApiResponse?.data?.content, searchTerm, roleFilter]);

  // Mutations
  // Create User Mutation
  const createMutation = useMutation({
    mutationFn: (userData) => userApi.createUser(userData),
    onSuccess: () => {
      toast.success('Tạo tài khoản người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateModalOpen(false);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể tạo người dùng');
    },
  });

  // Update User Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => userApi.updateUser(id, data),
    onSuccess: () => {
      toast.success('Cập nhật thông tin thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể cập nhật thông tin');
    },
  });

  // Assign / Remove Roles Mutation
  const roleMutation = useMutation({
    mutationFn: async ({ userId, rolesToAdd, rolesToRemove }) => {
      if (rolesToAdd && rolesToAdd.length > 0) {
        await userApi.assignRoles(userId, rolesToAdd);
      }
      if (rolesToRemove && rolesToRemove.length > 0) {
        await userApi.removeRoles(userId, rolesToRemove);
      }
    },
    onSuccess: () => {
      toast.success('Cập nhật vai trò thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setAssignRoleModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Lỗi khi cập nhật vai trò');
    },
  });

  // Lock / Unlock Mutation
  const lockMutation = useMutation({
    mutationFn: (user) => {
      if (user.enabled !== false) {
        return userApi.lockUser(user.id);
      } else {
        return userApi.unlockUser(user.id);
      }
    },
    onSuccess: (_, user) => {
      const isLocking = user.enabled !== false;
      toast.success(isLocking ? 'Đã khóa tài khoản thành công' : 'Đã mở khóa tài khoản thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setLockConfirmOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể thực hiện thao tác khóa/mở khóa');
    },
  });

  // Delete User Mutation
  const deleteMutation = useMutation({
    mutationFn: (userId) => userApi.deleteUser(userId),
    onSuccess: () => {
      toast.success('Đã xóa người dùng thành công');
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setDeleteConfirmOpen(false);
      setSelectedUser(null);
    },
    onError: (err) => {
      toast.error(err.message || 'Không thể xóa người dùng');
    },
  });

  // Handlers
  const handleOpenDetail = (user) => {
    setSelectedUser(user);
    setDetailModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleOpenAssignRole = (user) => {
    setSelectedUser(user);
    setAssignRoleModalOpen(true);
  };

  const handleOpenToggleLock = (user) => {
    setSelectedUser(user);
    setLockConfirmOpen(true);
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    setDeleteConfirmOpen(true);
  };

  const getRoleVariant = (roleName) => {
    if (roleName === ROLES.ADMIN) return 'danger';
    if (roleName === ROLES.MANAGER) return 'warning';
    return 'primary';
  };

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <UsersIcon size={24} className="text-primary" />
            Quản lý Người dùng & Phân quyền
          </h1>
          <p className="page-subtitle">
            Quản lý danh sách tài khoản, thông tin nhân viên, vai trò hệ thống và trạng thái hoạt động.
          </p>
        </div>

        <div className="page-actions">
          <Button
            variant="outline"
            icon={<RefreshCwIcon size={16} className={isUsersFetching ? 'spinner-inline' : ''} />}
            onClick={() => refetchUsers()}
            disabled={isUsersFetching}
            title="Làm mới dữ liệu"
          >
            Làm mới
          </Button>

          {canCreate && (
            <Button
              variant="primary"
              icon={<PlusIcon size={16} />}
              onClick={() => setCreateModalOpen(true)}
            >
              Thêm người dùng
            </Button>
          )}
        </div>
      </div>

      {/* Toolbar (Search & Filter) */}
      <div className="table-toolbar">
        <div className="table-toolbar-left">
          <div className="table-search-input">
            <input
              type="text"
              className="form-input has-icon-left"
              placeholder="Tìm theo tên, username, email..."
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

          <select
            className="pagination-size-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            style={{ height: 36 }}
          >
            <option value="ALL">Tất cả vai trò</option>
            <option value={ROLES.ADMIN}>ADMIN</option>
            <option value={ROLES.MANAGER}>MANAGER</option>
            <option value={ROLES.USER}>USER</option>
          </select>
        </div>

        <div className="table-toolbar-right">
          <span style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
            Tổng cộng: <strong>{totalElements}</strong> tài khoản
          </span>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="table-container">
        {isUsersLoading ? (
          <LoadingState message="Đang tải danh sách người dùng từ hệ thống..." minHeight="320px" />
        ) : isUsersError ? (
          <div style={{ padding: 24 }}>
            <Alert
              variant="danger"
              title="Lỗi khi tải dữ liệu người dùng"
            >
              {usersError?.message || 'Không thể kết nối đến máy chủ. Vui lòng thử lại.'}
            </Alert>
            <div style={{ marginTop: 16, textAlign: 'center' }}>
              <Button variant="outline" onClick={() => refetchUsers()}>
                Thử lại
              </Button>
            </div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Không tìm thấy người dùng phù hợp"
            description={
              searchTerm || roleFilter !== 'ALL'
                ? 'Không có kết quả nào khớp với bộ lọc tìm kiếm hiện tại.'
                : 'Chưa có người dùng nào được tạo trong hệ thống.'
            }
            action={
              (searchTerm || roleFilter !== 'ALL') ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setRoleFilter('ALL');
                  }}
                >
                  Xóa bộ lọc
                </Button>
              ) : canCreate ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon size={14} />}
                  onClick={() => setCreateModalOpen(true)}
                >
                  Tạo người dùng đầu tiên
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Người dùng</th>
                  <th style={{ width: '25%' }}>Email</th>
                  <th style={{ width: '20%' }}>Vai trò (Roles)</th>
                  <th style={{ width: '10%' }}>Trạng thái</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isLocked = user.enabled === false;
                  return (
                    <tr key={user.id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="table-user-avatar">
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
                          <div className="table-user-details">
                            <span className="table-user-name">
                              {user.fullName || user.username}
                            </span>
                            <span className="table-user-username">
                              @{user.username}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span style={{ color: 'var(--color-text-secondary)' }}>{user.email}</span>
                      </td>

                      <td>
                        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                          {user.roles && Array.from(user.roles).length > 0 ? (
                            Array.from(user.roles).map((r) => (
                              <Badge key={r} variant={getRoleVariant(r)} size="xs">
                                {r}
                              </Badge>
                            ))
                          ) : (
                            <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>—</span>
                          )}
                        </div>
                      </td>

                      <td>
                        {isLocked ? (
                          <Badge variant="danger" size="xs">
                            Đã khóa
                          </Badge>
                        ) : (
                          <Badge variant="success" size="xs">
                            Hoạt động
                          </Badge>
                        )}
                      </td>

                      <td>
                        <div className="table-actions-cell">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => handleOpenDetail(user)}
                            title="Xem chi tiết"
                          >
                            <EyeIcon size={14} />
                          </button>

                          {canUpdate && (
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleOpenEdit(user)}
                              title="Chỉnh sửa thông tin"
                            >
                              <EditIcon size={14} />
                            </button>
                          )}

                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                className="btn btn-outline btn-sm"
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleOpenAssignRole(user)}
                                title="Phân quyền vai trò"
                              >
                                <ShieldIcon size={14} />
                              </button>

                              <button
                                type="button"
                                className={`btn btn-sm ${isLocked ? 'btn-outline' : 'btn-outline-danger'}`}
                                style={{ padding: '4px 8px' }}
                                onClick={() => handleOpenToggleLock(user)}
                                title={isLocked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                              >
                                {isLocked ? <UnlockIcon size={14} /> : <LockIcon size={14} />}
                              </button>
                            </>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm"
                              style={{ padding: '4px 8px' }}
                              onClick={() => handleOpenDelete(user)}
                              title="Xóa tài khoản"
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

            {/* Pagination Controls */}
            <UserPagination
              currentPage={page}
              totalPages={totalPages}
              totalElements={totalElements}
              pageSize={pageSize}
              onPageChange={(newPage) => setPage(newPage)}
              onPageSizeChange={(newSize) => {
                setPageSize(newSize);
                setPage(0);
              }}
            />
          </>
        )}
      </div>

      {/* Modals */}
      {/* 1. Create User Modal */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={(data) => createMutation.mutateAsync(data)}
        isLoading={createMutation.isPending}
      />

      {/* 2. Edit User Modal */}
      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onSubmit={(data) =>
          updateMutation.mutateAsync({ id: selectedUser.id, data })
        }
        isLoading={updateMutation.isPending}
      />

      {/* 3. Assign Role Modal */}
      <AssignRoleModal
        isOpen={assignRoleModalOpen}
        onClose={() => {
          setAssignRoleModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        allRoles={allRoles}
        onSubmit={(data) => roleMutation.mutateAsync(data)}
        isLoading={roleMutation.isPending}
      />

      {/* 4. User Detail Modal */}
      <UserDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
        onEdit={handleOpenEdit}
        onAssignRole={handleOpenAssignRole}
        onToggleLock={handleOpenToggleLock}
        isAdmin={isAdmin}
        canUpdate={canUpdate}
      />

      {/* 5. Lock / Unlock Confirm Modal */}
      <ConfirmModal
        isOpen={lockConfirmOpen}
        onClose={() => {
          setLockConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => lockMutation.mutateAsync(selectedUser)}
        title={
          selectedUser?.enabled !== false
            ? `Khóa tài khoản @${selectedUser?.username}?`
            : `Mở khóa tài khoản @${selectedUser?.username}?`
        }
        message={
          selectedUser?.enabled !== false
            ? 'Người dùng này sẽ không thể đăng nhập vào hệ thống ERP cho đến khi tài khoản được mở khóa lại.'
            : 'Tài khoản người dùng này sẽ được kích hoạt trở lại và có thể đăng nhập bình thường.'
        }
        confirmText={selectedUser?.enabled !== false ? 'Khóa tài khoản' : 'Mở khóa'}
        cancelText="Hủy bỏ"
        variant={selectedUser?.enabled !== false ? 'danger' : 'primary'}
        isLoading={lockMutation.isPending}
      />

      {/* 6. Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedUser(null);
        }}
        onConfirm={() => deleteMutation.mutateAsync(selectedUser.id)}
        title={`Xóa tài khoản @${selectedUser?.username}?`}
        message="Hành động này sẽ xóa vĩnh viễn tài khoản người dùng và tất cả phiên đăng nhập liên quan. Thao tác này không thể hoàn tác!"
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
