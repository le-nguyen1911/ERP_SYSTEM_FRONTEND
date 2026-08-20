import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ShieldIcon, FileTextIcon } from '../../../components/ui/Icons';
import { groupPermissionsByModule, MODULE_CONFIG } from '../../../utils/permissionGrouping';

const roleSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên vai trò không được để trống')
    .max(50, 'Tên vai trò tối đa 50 ký tự')
    .regex(/^[A-Za-z0-9_]+$/, 'Tên vai trò chỉ bao gồm chữ cái, số và dấu gạch dưới (VD: MANAGER, WAREHOUSE_STAFF)'),
  description: z
    .string()
    .max(255, 'Mô tả tối đa 255 ký tự')
    .optional()
    .or(z.literal('')),
});

function RoleForm({ initialData, allPermissions = [], onSubmit, onClose, isLoading, isEdit }) {
  const [selectedPermissions, setSelectedPermissions] = useState(
    () => new Set(initialData?.permissions || [])
  );

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
    },
  });

  const groupedPermissions = groupPermissionsByModule(allPermissions);

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

  const handleFormSubmit = async (data) => {
    await onSubmit({
      name: data.name.trim().toUpperCase(),
      description: data.description ? data.description.trim() : null,
      permissions: Array.from(selectedPermissions),
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      <Input
        label="Mã định danh vai trò (Role Code)"
        placeholder="Ví dụ: WAREHOUSE_LEAD, SALES_EXECUTIVE, v.v."
        startIcon={<ShieldIcon size={16} />}
        error={errors.name?.message}
        required
        autoFocus={!isEdit}
        disabled={isEdit && initialData?.name === 'ADMIN'}
        helperText={isEdit && initialData?.name === 'ADMIN' ? 'Vai trò quản trị tối cao không thể đổi tên' : 'Định dạng viết hoa, không dấu cách (VD: INVENTORY_MANAGER)'}
        {...register('name')}
        onChange={(e) => {
          setValue('name', e.target.value.toUpperCase());
        }}
      />

      <div className="form-group">
        <label className="form-label">
          Mô tả vai trò
        </label>
        <div className="input-wrapper">
          <span className="input-icon-left" style={{ top: 12 }}>
            <FileTextIcon size={16} />
          </span>
          <textarea
            className={`form-input has-icon-left ${errors.description ? 'is-invalid' : ''}`}
            placeholder="Nhập mô tả nhiệm vụ và quyền hạn của vai trò này..."
            rows={2}
            style={{ resize: 'vertical' }}
            {...register('description')}
          />
        </div>
        {errors.description && (
          <span className="form-error">{errors.description.message}</span>
        )}
      </div>

      {/* Permissions Picker */}
      <div className="form-group" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label className="form-label" style={{ margin: 0 }}>
            Gán quyền hạn ban đầu ({selectedPermissions.size}/{allPermissions.length} quyền)
          </label>
        </div>

        <div
          style={{
            maxHeight: '260px',
            overflowY: 'auto',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            backgroundColor: '#f8fafc',
          }}
        >
          {Object.entries(groupedPermissions).map(([moduleKey, perms]) => {
            const config = MODULE_CONFIG[moduleKey] || MODULE_CONFIG.OTHER;
            const moduleSelectedCount = perms.filter((p) => selectedPermissions.has(p.name)).length;

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
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  <span style={{ color: config.color }}>
                    {config.label} ({moduleSelectedCount}/{perms.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleSelectAllInModule(perms)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 11,
                      color: config.color,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {moduleSelectedCount === perms.length ? 'Bỏ chọn' : 'Chọn tất cả'}
                  </button>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 6,
                  }}
                >
                  {perms.map((perm) => (
                    <label
                      key={perm.name}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        fontSize: 11,
                        cursor: 'pointer',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermissions.has(perm.name)}
                        onChange={() => handleTogglePermission(perm.name)}
                        style={{ accentColor: 'var(--color-primary)' }}
                      />
                      <span
                        style={{
                          fontWeight: selectedPermissions.has(perm.name) ? 600 : 400,
                          color: selectedPermissions.has(perm.name) ? 'var(--color-primary)' : 'var(--color-text-main)',
                          fontFamily: 'monospace',
                        }}
                      >
                        {perm.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
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
        >
          {isEdit ? 'Lưu thay đổi' : 'Tạo vai trò'}
        </Button>
      </div>
    </form>
  );
}

export function RoleFormModal({
  isOpen,
  onClose,
  role = null,
  allPermissions = [],
  onSubmit,
  isLoading,
}) {
  const isEdit = Boolean(role);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa vai trò: ${role?.name}` : 'Tạo mới vai trò người dùng'}
      size="lg"
    >
      <RoleForm
        key={role?.id || 'new'}
        initialData={role}
        allPermissions={allPermissions}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
        isEdit={isEdit}
      />
    </Modal>
  );
}
