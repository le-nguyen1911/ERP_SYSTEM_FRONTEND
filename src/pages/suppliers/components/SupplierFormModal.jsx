import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { BuildingIcon, UserIcon, CreditCardIcon } from '../../../components/ui/Icons';

const createSupplierSchema = z.object({
  supplierCode: z
    .string()
    .min(1, 'Mã nhà cung cấp không được để trống')
    .max(50, 'Mã nhà cung cấp tối đa 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã nhà cung cấp chỉ gồm chữ cái, số, dấu gạch ngang hoặc gạch dưới'),
  supplierName: z
    .string()
    .min(1, 'Tên nhà cung cấp không được để trống')
    .max(255, 'Tên nhà cung cấp tối đa 255 ký tự'),
  contactPerson: z
    .string()
    .min(1, 'Người liên hệ không được để trống')
    .max(100, 'Người liên hệ tối đa 100 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng')
    .max(100, 'Email tối đa 100 ký tự'),
  phone: z
    .string()
    .min(8, 'Số điện thoại tối thiểu 8 ký tự')
    .max(20, 'Số điện thoại tối đa 20 ký tự'),
  address: z
    .string()
    .min(1, 'Địa chỉ không được để trống'),
  city: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  country: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  bankName: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  bankAccountNo: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  bankAccountHolder: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  paymentTerms: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  rating: z.enum(['A+', 'A', 'B', 'C', 'D']).default('B'),
  taxId: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
});

const updateSupplierSchema = z.object({
  supplierName: z
    .string()
    .min(1, 'Tên nhà cung cấp không được để trống')
    .max(255, 'Tên nhà cung cấp tối đa 255 ký tự'),
  contactPerson: z
    .string()
    .min(1, 'Người liên hệ không được để trống')
    .max(100, 'Người liên hệ tối đa 100 ký tự'),
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không đúng định dạng')
    .max(100, 'Email tối đa 100 ký tự'),
  phone: z
    .string()
    .min(8, 'Số điện thoại tối thiểu 8 ký tự')
    .max(20, 'Số điện thoại tối đa 20 ký tự'),
  address: z
    .string()
    .min(1, 'Địa chỉ không được để trống'),
  city: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  country: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  bankName: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  bankAccountNo: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  bankAccountHolder: z.string().max(100, 'Tối đa 100 ký tự').optional().or(z.literal('')),
  paymentTerms: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  rating: z.enum(['A+', 'A', 'B', 'C', 'D']).default('B'),
  taxId: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export function SupplierFormModal({ isOpen, onClose, onSubmit, supplier, isLoading }) {
  const isEdit = !!supplier;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? updateSupplierSchema : createSupplierSchema),
    defaultValues: {
      supplierCode: '',
      supplierName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Việt Nam',
      bankName: '',
      bankAccountNo: '',
      bankAccountHolder: '',
      paymentTerms: 'NET 30',
      rating: 'B',
      taxId: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (supplier) {
        reset({
          supplierCode: supplier.supplierCode || '',
          supplierName: supplier.supplierName || '',
          contactPerson: supplier.contactPerson || '',
          email: supplier.email || '',
          phone: supplier.phone || '',
          address: supplier.address || '',
          city: supplier.city || '',
          country: supplier.country || 'Việt Nam',
          bankName: supplier.bankName || '',
          bankAccountNo: supplier.bankAccountNo || '',
          bankAccountHolder: supplier.bankAccountHolder || '',
          paymentTerms: supplier.paymentTerms || 'NET 30',
          rating: supplier.rating || 'B',
          taxId: supplier.taxId || '',
          status: supplier.status || 'ACTIVE',
        });
      } else {
        reset({
          supplierCode: '',
          supplierName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: 'Việt Nam',
          bankName: '',
          bankAccountNo: '',
          bankAccountHolder: '',
          paymentTerms: 'NET 30',
          rating: 'B',
          taxId: '',
          status: 'ACTIVE',
        });
      }
    }
  }, [isOpen, supplier, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      city: data.city || null,
      country: data.country || null,
      bankName: data.bankName || null,
      bankAccountNo: data.bankAccountNo || null,
      bankAccountHolder: data.bankAccountHolder || null,
      paymentTerms: data.paymentTerms || null,
      taxId: data.taxId || null,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <BuildingIcon size={18} className="text-primary" />
          {isEdit ? `Chỉnh sửa nhà cung cấp: ${supplier.supplierName}` : 'Thêm mới nhà cung cấp'}
        </span>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <BuildingIcon size={15} /> THÔNG TIN CƠ BẢN
          </h4>
          <div className="form-grid">
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">
                  Mã nhà cung cấp <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input${errors.supplierCode ? ' is-invalid' : ''}`}
                  placeholder="VD: SUP-VINASUN, NCC-001"
                  {...register('supplierCode')}
                />
                {errors.supplierCode && <div className="form-error">{errors.supplierCode.message}</div>}
              </div>
            )}

            <div className="form-group" style={{ gridColumn: isEdit ? '1 / -1' : undefined }}>
              <label className="form-label">
                Tên nhà cung cấp <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.supplierName ? ' is-invalid' : ''}`}
                placeholder="VD: Công ty Cổ phần Công nghệ ABC"
                {...register('supplierName')}
              />
              {errors.supplierName && <div className="form-error">{errors.supplierName.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Mã số thuế (MST)</label>
              <input
                type="text"
                className={`form-input${errors.taxId ? ' is-invalid' : ''}`}
                placeholder="VD: 0101234567"
                {...register('taxId')}
              />
              {errors.taxId && <div className="form-error">{errors.taxId.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Đánh giá xếp hạng</label>
              <select className={`form-input${errors.rating ? ' is-invalid' : ''}`} {...register('rating')}>
                <option value="A+">Hạng A+ (Xuất sắc)</option>
                <option value="A">Hạng A (Rất tốt)</option>
                <option value="B">Hạng B (Tiêu chuẩn)</option>
                <option value="C">Hạng C (Cần cải thiện)</option>
                <option value="D">Hạng D (Kém / Rủi ro)</option>
              </select>
              {errors.rating && <div className="form-error">{errors.rating.message}</div>}
            </div>

            {isEdit && (
              <div className="form-group">
                <label className="form-label">Trạng thái hợp tác</label>
                <select className={`form-input${errors.status ? ' is-invalid' : ''}`} {...register('status')}>
                  <option value="ACTIVE">Đang hợp tác (ACTIVE)</option>
                  <option value="INACTIVE">Ngừng hợp tác (INACTIVE)</option>
                </select>
                {errors.status && <div className="form-error">{errors.status.message}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserIcon size={15} /> LIÊN HỆ & ĐỊA CHỈ
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Người liên hệ chính <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.contactPerson ? ' is-invalid' : ''}`}
                placeholder="VD: Nguyễn Văn A"
                {...register('contactPerson')}
              />
              {errors.contactPerson && <div className="form-error">{errors.contactPerson.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Email liên hệ <span className="required">*</span>
              </label>
              <input
                type="email"
                className={`form-input${errors.email ? ' is-invalid' : ''}`}
                placeholder="VD: contact@supplier.com"
                {...register('email')}
              />
              {errors.email && <div className="form-error">{errors.email.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Số điện thoại <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.phone ? ' is-invalid' : ''}`}
                placeholder="VD: 0912345678"
                {...register('phone')}
              />
              {errors.phone && <div className="form-error">{errors.phone.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Thành phố / Tỉnh</label>
              <input
                type="text"
                className={`form-input${errors.city ? ' is-invalid' : ''}`}
                placeholder="VD: Hà Nội, TP.HCM"
                {...register('city')}
              />
              {errors.city && <div className="form-error">{errors.city.message}</div>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Địa chỉ chi tiết <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.address ? ' is-invalid' : ''}`}
                placeholder="VD: Số 123 Đường Cầu Giấy, Phường Quan Hoa, Quận Cầu Giấy"
                {...register('address')}
              />
              {errors.address && <div className="form-error">{errors.address.message}</div>}
            </div>
          </div>
        </div>

        {/* Section 3: Banking & Payment Terms */}
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCardIcon size={15} /> THANH TOÁN & NGÂN HÀNG
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Ngân hàng</label>
              <input
                type="text"
                className={`form-input${errors.bankName ? ' is-invalid' : ''}`}
                placeholder="VD: Vietcombank, Techcombank"
                {...register('bankName')}
              />
              {errors.bankName && <div className="form-error">{errors.bankName.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Số tài khoản ngân hàng</label>
              <input
                type="text"
                className={`form-input${errors.bankAccountNo ? ' is-invalid' : ''}`}
                placeholder="VD: 0011001234567"
                {...register('bankAccountNo')}
              />
              {errors.bankAccountNo && <div className="form-error">{errors.bankAccountNo.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Tên chủ tài khoản</label>
              <input
                type="text"
                className={`form-input${errors.bankAccountHolder ? ' is-invalid' : ''}`}
                placeholder="VD: CONG TY CP CONG NGHE ABC"
                {...register('bankAccountHolder')}
              />
              {errors.bankAccountHolder && <div className="form-error">{errors.bankAccountHolder.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Điều khoản thanh toán</label>
              <select className={`form-input${errors.paymentTerms ? ' is-invalid' : ''}`} {...register('paymentTerms')}>
                <option value="NET 15">NET 15 (Thanh toán sau 15 ngày)</option>
                <option value="NET 30">NET 30 (Thanh toán sau 30 ngày)</option>
                <option value="NET 45">NET 45 (Thanh toán sau 45 ngày)</option>
                <option value="NET 60">NET 60 (Thanh toán sau 60 ngày)</option>
                <option value="COD">COD (Thanh toán khi nhận hàng)</option>
                <option value="PREPAID">Trả trước 100%</option>
              </select>
              {errors.paymentTerms && <div className="form-error">{errors.paymentTerms.message}</div>}
            </div>
          </div>
        </div>

        <div className="modal-footer" style={{ margin: '20px -20px -20px -20px', paddingTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading} disabled={isLoading}>
            {isEdit ? 'Lưu thay đổi' : 'Tạo nhà cung cấp'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
