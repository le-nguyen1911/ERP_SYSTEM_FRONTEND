
import { Link } from 'react-router-dom';
import { AlertCircleIcon, ArrowLeftIcon } from '../../components/ui/Icons';
import { Button } from '../../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="error-page-container">
      <div className="error-page-card">
        <div className="error-code text-muted">404</div>
        <div className="error-icon-wrapper">
          <AlertCircleIcon size={48} className="text-muted" />
        </div>
        <h2 className="error-title">Không tìm thấy trang (Not Found)</h2>
        <p className="error-desc text-muted">
          Đường dẫn bạn yêu cầu không tồn tại hoặc đã bị thay đổi trong hệ thống.
        </p>
        <div className="error-actions">
          <Link to="/dashboard">
            <Button variant="primary" icon={ArrowLeftIcon}>
              Về trang chủ
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
