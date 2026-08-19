import { Outlet } from 'react-router-dom';
import { ShieldIcon } from '../components/ui/Icons';

export function AuthLayout() {
  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-brand-side">
          <div className="auth-brand-content">
            <div className="auth-logo-badge">
              <ShieldIcon size={32} />
            </div>
            <h1 className="auth-brand-title">ERP SYSTEM</h1>
            <p className="auth-brand-desc">
              Hệ thống Quản trị Doanh nghiệp Toàn diện: Quản lý Kho, Mua hàng, Bán hàng và Truy vết Audit.
            </p>
            <div className="auth-brand-features">
              <div className="auth-feature-item">
                <div className="feature-dot" />
                <span>Bảo mật JWT 2 lớp & Multi-Device Session Management</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-dot" />
                <span>Phân quyền chi tiết theo RBAC & State Machine chuẩn</span>
              </div>
              <div className="auth-feature-item">
                <div className="feature-dot" />
                <span>Event-Driven Notifications & AOP Audit Trail</span>
              </div>
            </div>
          </div>
          <div className="auth-brand-footer">
            <span>© 2026 Enterprise ERP System • Version 1.0</span>
          </div>
        </div>

        <div className="auth-form-side">
          <div className="auth-form-container">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}
