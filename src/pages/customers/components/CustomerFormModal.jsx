import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { UserIcon, MapPinIcon, CreditCardIcon } from '../../../components/ui/Icons';

const createCustomerSchema = z.object({
  customerCode: z
    .string()
    .min(1, 'Mã khách hàng không được để trống')
    .max(50, 'Mã khách hàng tối đa 50 ký tự')
    .regex(/^[A-Za-z0-9_-]+$/, 'Mã khách hàng chỉ gồm chữ cái, số, dấu gạch ngang hoặc gạch dưới'),
  customerName: z
    .string()
    .min(1, 'Tên khách hàng không được để trống')
    .max(255, 'Tên khách hàng tối đa 255 ký tự'),
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
  taxId: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  paymentTerms: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
});

const updateCustomerSchema = z.object({
  customerName: z
    .string()
    .min(1, 'Tên khách hàng không được để trống')
    .max(255, 'Tên khách hàng tối đa 255 ký tự'),
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
  taxId: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  paymentTerms: z.string().max(50, 'Tối đa 50 ký tự').optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export function CustomerFormModal({ isOpen, onClose, onSubmit, customer, isLoading }) {
  const isEdit = !!customer;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(isEdit ? updateCustomerSchema : createCustomerSchema),
    defaultValues: {
      customerCode: '',
      customerName: '',
      contactPerson: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Việt Nam',
      taxId: '',
      paymentTerms: 'NET 30',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        reset({
          customerCode: customer.customerCode || '',
          customerName: customer.customerName || '',
          contactPerson: customer.contactPerson || '',
          email: customer.email || '',
          phone: customer.phone || '',
          address: customer.address || '',
          city: customer.city || '',
          country: customer.country || 'Việt Nam',
          taxId: customer.taxId || '',
          paymentTerms: customer.paymentTerms || 'NET 30',
          status: customer.status || 'ACTIVE',
        });
      } else {
        reset({
          customerCode: '',
          customerName: '',
          contactPerson: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: 'Việt Nam',
          taxId: '',
          paymentTerms: 'NET 30',
          status: 'ACTIVE',
        });
      }
    }
  }, [isOpen, customer, reset]);

  const handleFormSubmit = (data) => {
    const payload = {
      ...data,
      city: data.city || null,
      country: data.country || null,
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
          <UserIcon size={18} className="text-primary" />
          {isEdit ? `Chỉnh sửa khách hàng: ${customer.customerName}` : 'Thêm mới khách hàng'}
        </span>
      }
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        {/* Section 1: Basic Information */}
        <div style={{ marginBottom: 16 }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <UserIcon size={15} /> THÔNG TIN CƠ BẢN
          </h4>
          <div className="form-grid">
            {!isEdit && (
              <div className="form-group">
                <label className="form-label">
                  Mã khách hàng <span className="required">*</span>
                </label>
                <input
                  type="text"
                  className={`form-input${errors.customerCode ? ' is-invalid' : ''}`}
                  placeholder="VD: CUST-VINASUN, KH-001"
                  {...register('customerCode')}
                />
                {errors.customerCode && <div className="form-error">{errors.customerCode.message}</div>}
              </div>
            )}

            <div className="form-group" style={{ gridColumn: isEdit ? '1 / -1' : undefined }}>
              <label className="form-label">
                Tên khách hàng / Doanh nghiệp <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.customerName ? ' is-invalid' : ''}`}
                placeholder="VD: Công ty TNHH Giải Pháp Công Nghệ XYZ"
                {...register('customerName')}
              />
              {errors.customerName && <div className="form-error">{errors.customerName.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">
                Người liên hệ chính <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.contactPerson ? ' is-invalid' : ''}`}
                placeholder="VD: Nguyễn Văn B"
                {...register('contactPerson')}
              />
              {errors.contactPerson && <div className="form-error">{errors.contactPerson.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Mã số thuế (Tax ID)</label>
              <input
                type="text"
                className={`form-input${errors.taxId ? ' is-invalid' : ''}`}
                placeholder="VD: 0312345678"
                {...register('taxId')}
              />
              {errors.taxId && <div className="form-error">{errors.taxId.message}</div>}
            </div>

            {isEdit && (
              <div className="form-group">
                <label className="form-label">Trạng thái</label>
                <select className={`form-input${errors.status ? ' is-invalid' : ''}`} {...register('status')}>
                  <option value="ACTIVE">Đang hoạt động (ACTIVE)</option>
                  <option value="INACTIVE">Ngừng hoạt động (INACTIVE)</option>
                </select>
                {errors.status && <div className="form-error">{errors.status.message}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Contact & Address */}
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPinIcon size={15} /> LIÊN HỆ & ĐỊA CHỈ
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">
                Email liên hệ <span className="required">*</span>
              </label>
              <input
                type="email"
                className={`form-input${errors.email ? ' is-invalid' : ''}`}
                placeholder="VD: contact@company.com"
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
                placeholder="VD: 0987654321"
                {...register('phone')}
              />
              {errors.phone && <div className="form-error">{errors.phone.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Thành phố / Tỉnh</label>
              <input
                type="text"
                className={`form-input${errors.city ? ' is-invalid' : ''}`}
                placeholder="VD: TP. Hồ Chí Minh, Hà Nội"
                {...register('city')}
              />
              {errors.city && <div className="form-error">{errors.city.message}</div>}
            </div>

            <div className="form-group">
              <label className="form-label">Quốc gia</label>
              <input
                type="text"
                className={`form-input${errors.country ? ' is-invalid' : ''}`}
                placeholder="VD: Việt Nam"
                {...register('country')}
              />
              {errors.country && <div className="form-error">{errors.country.message}</div>}
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">
                Địa chỉ chi tiết <span className="required">*</span>
              </label>
              <input
                type="text"
                className={`form-input${errors.address ? ' is-invalid' : ''}`}
                placeholder="VD: Tòa nhà Bitexco, Số 2 Hải Triều, Bến Nghé, Quận 1"
                {...register('address')}
              />
              {errors.address && <div className="form-error">{errors.address.message}</div>}
            </div>
          </div>
        </div>

        {/* Section 3: Commercial & Payment Terms */}
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid var(--color-border)' }}>
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-main)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CreditCardIcon size={15} /> ĐIỀU KHOẢN THANH TOÁN
          </h4>
          <div className="form-grid">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Điều khoản thanh toán</label>
              <select className={`form-input${errors.paymentTerms ? ' is-invalid' : ''}`} {...register('paymentTerms')}>
                <option value="NET 15">NET 15 (Thanh toán trong 15 ngày)</option>
                <option value="NET 30">NET 30 (Thanh toán trong 30 ngày)</option>
                <option value="NET 45">NET 45 (Thanh toán trong 45 ngày)</option>
                <option value="NET 60">NET 60 (Thanh toán trong 60 ngày)</option>
                <option value="COD">COD (Thanh toán ngay khi nhận hàng)</option>
                <option value="PREPAID">Trả trước 100% khi đặt hàng</option>
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
            {isEdit ? 'Lưu thay đổi' : 'Tạo khách hàng'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
