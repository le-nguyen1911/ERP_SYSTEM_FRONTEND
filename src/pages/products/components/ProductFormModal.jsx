import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import {
  PackageIcon,
  TagIcon,
  ScaleIcon,
  FileTextIcon,
} from '../../../components/ui/Icons';

const createProductSchema = z.object({
  code: z
    .string()
    .min(1, 'Mã sản phẩm không được để trống')
    .max(50, 'Mã sản phẩm tối đa 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã sản phẩm chỉ gồm chữ cái, số, dấu gạch ngang hoặc gạch dưới'),
  name: z
    .string()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(100, 'Tên sản phẩm tối đa 100 ký tự'),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .optional()
    .or(z.literal('')),
  price: z
    .coerce
    .number({ invalid_type_error: 'Vui lòng nhập giá tiền hợp lệ' })
    .min(0, 'Giá sản phẩm không được âm'),
  categoryId: z
    .string()
    .min(1, 'Vui lòng chọn danh mục sản phẩm'),
  unitId: z
    .string()
    .min(1, 'Vui lòng chọn đơn vị tính'),
});

const updateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Tên sản phẩm không được để trống')
    .max(100, 'Tên sản phẩm tối đa 100 ký tự'),
  description: z
    .string()
    .max(1000, 'Mô tả tối đa 1000 ký tự')
    .optional()
    .or(z.literal('')),
  price: z
    .coerce
    .number({ invalid_type_error: 'Vui lòng nhập giá tiền hợp lệ' })
    .min(0, 'Giá sản phẩm không được âm'),
  categoryId: z
    .string()
    .min(1, 'Vui lòng chọn danh mục sản phẩm'),
  unitId: z
    .string()
    .min(1, 'Vui lòng chọn đơn vị tính'),
  active: z.boolean().default(true),
});

function ProductForm({
  initialData,
  categories = [],
  units = [],
  onSubmit,
  onClose,
  isLoading,
  isEdit,
}) {
  const schema = isEdit ? updateProductSchema : createProductSchema;

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price !== undefined ? initialData.price : 0,
      categoryId: initialData?.category?.id || initialData?.categoryId || '',
      unitId: initialData?.unit?.id || initialData?.unitId || '',
      active: initialData?.active !== undefined ? initialData.active : true,
    },
  });

  const handleFormSubmit = async (data) => {
    if (isEdit) {
      await onSubmit({
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
        price: data.price,
        categoryId: data.categoryId,
        unitId: data.unitId,
        active: Boolean(data.active),
      });
    } else {
      await onSubmit({
        code: data.code.trim().toUpperCase(),
        name: data.name.trim(),
        description: data.description ? data.description.trim() : null,
        price: data.price,
        categoryId: data.categoryId,
        unitId: data.unitId,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
      {/* Product Code / SKU */}
      <Input
        label="Mã sản phẩm (SKU / Code)"
        placeholder="Ví dụ: SP001, LAPTOP-DELL-G15, BANPHIM-RGB..."
        startIcon={<PackageIcon size={16} />}
        error={errors.code?.message}
        required={!isEdit}
        disabled={isEdit}
        helperText={isEdit ? 'Mã sản phẩm là duy nhất và không thể thay đổi sau khi tạo' : 'Mã định danh duy nhất (tự động viết hoa)'}
        {...register('code')}
        onChange={(e) => {
          setValue('code', e.target.value.toUpperCase());
        }}
      />

      {/* Product Name */}
      <Input
        label="Tên sản phẩm"
        placeholder="Ví dụ: Laptop Dell Gaming G15 5530, Bàn phím cơ DareU..."
        startIcon={<PackageIcon size={16} />}
        error={errors.name?.message}
        required
        autoFocus={isEdit}
        {...register('name')}
      />

      {/* Category & Unit Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div className="form-group">
          <label className="form-label">
            Danh mục hàng hóa <span className="form-required">*</span>
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <TagIcon size={16} />
            </span>
            <select
              className={`form-input has-icon-left ${errors.categoryId ? 'is-invalid' : ''}`}
              {...register('categoryId')}
            >
              <option value="">-- Chọn danh mục --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          {errors.categoryId && (
            <span className="form-error">{errors.categoryId.message}</span>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">
            Đơn vị tính <span className="form-required">*</span>
          </label>
          <div className="input-wrapper">
            <span className="input-icon-left">
              <ScaleIcon size={16} />
            </span>
            <select
              className={`form-input has-icon-left ${errors.unitId ? 'is-invalid' : ''}`}
              {...register('unitId')}
            >
              <option value="">-- Chọn đơn vị tính --</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          {errors.unitId && (
            <span className="form-error">{errors.unitId.message}</span>
          )}
        </div>
      </div>

      {/* Price */}
      <Input
        label="Đơn giá niêm yết (VNĐ)"
        type="number"
        step="any"
        min="0"
        placeholder="Ví dụ: 1500000"
        error={errors.price?.message}
        required
        {...register('price')}
      />

      {/* Description */}
      <div className="form-group">
        <label className="form-label">
          Mô tả sản phẩm
        </label>
        <div className="input-wrapper">
          <span className="input-icon-left" style={{ top: 12 }}>
            <FileTextIcon size={16} />
          </span>
          <textarea
            className={`form-input has-icon-left ${errors.description ? 'is-invalid' : ''}`}
            placeholder="Nhập thông số kỹ thuật, bảo hành hoặc ghi chú sản phẩm..."
            rows={3}
            style={{ resize: 'vertical' }}
            {...register('description')}
          />
        </div>
        {errors.description && (
          <span className="form-error">{errors.description.message}</span>
        )}
      </div>

      {/* Status (when Edit) */}
      {isEdit && (
        <div className="form-group" style={{ marginTop: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <input
              type="checkbox"
              style={{
                width: 16,
                height: 16,
                accentColor: 'var(--color-primary)',
                cursor: 'pointer',
              }}
              {...register('active')}
            />
            <div>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-main)' }}>
                Đang kinh doanh (Active)
              </span>
              <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                Sản phẩm ngừng kinh doanh sẽ không thể chọn trong đơn mua hàng hoặc đơn bán hàng mới.
              </p>
            </div>
          </label>
        </div>
      )}

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
          {isEdit ? 'Lưu thay đổi' : 'Tạo mới sản phẩm'}
        </Button>
      </div>
    </form>
  );
}

export function ProductFormModal({
  isOpen,
  onClose,
  product = null,
  categories = [],
  units = [],
  onSubmit,
  isLoading,
}) {
  const isEdit = Boolean(product);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa sản phẩm: ${product?.name}` : 'Thêm mới sản phẩm vào danh mục'}
      size="md"
    >
      <ProductForm
        key={product?.id || 'new'}
        initialData={product}
        categories={categories}
        units={units}
        onSubmit={onSubmit}
        onClose={onClose}
        isLoading={isLoading}
        isEdit={isEdit}
      />
    </Modal>
  );
}
