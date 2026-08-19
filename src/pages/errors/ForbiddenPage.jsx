
import { Link } from 'react-router-dom';
import { ShieldIcon, ArrowLeftIcon } from '../../components/ui/Icons';
import { Button } from '../../components/ui/Button';

export function ForbiddenPage() {
  return (
    <div className="error-page-container">
      <div className="error-page-card">
        <div className="error-code text-danger">403</div>
        <div className="error-icon-wrapper">
          <ShieldIcon size={48} className="text-danger" />
        </div>
        <h2 className="error-title">Truy cập bị từ chối (Forbidden)</h2>
        <p className="error-desc text-muted">
          Bạn không có đủ quyền hạn (Permissions/Roles) cần thiết để truy cập tài nguyên hoặc thực hiện hành động này trên hệ thống.
        </p>
        <div className="error-actions">
          <Link to="/dashboard">
            <Button variant="primary" icon={ArrowLeftIcon}>
              Về bảng điều khiển
            </Button>
          </Link>
          <Link to="/profile">
            <Button variant="outline">
              Kiểm tra quyền tài khoản
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
