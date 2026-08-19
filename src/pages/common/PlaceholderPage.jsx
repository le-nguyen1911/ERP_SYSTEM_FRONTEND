
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { PackageIcon, ArrowLeftIcon } from '../../components/ui/Icons';

export function PlaceholderPage({
  title = 'Module Nghiệp Vụ',
  phase = 'Giai đoạn tiếp theo',
  description = 'Module này thuộc phạm vi của các Phase tiếp theo theo kế hoạch phát triển.',
  requiredPermissions = [],
}) {
  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">{title}</h1>
          <p className="page-subtitle">Thông tin module và tiến độ kế hoạch triển khai</p>
        </div>
        <div className="page-actions">
          <Link to="/dashboard">
            <Button variant="outline" size="sm" icon={ArrowLeftIcon}>
              Về bảng điều khiển
            </Button>
          </Link>
        </div>
      </div>

      <Card className="placeholder-card text-center">
        <div className="placeholder-icon-box">
          <PackageIcon size={48} className="text-primary" />
        </div>
        <h2 className="placeholder-title">{title}</h2>
        <Badge variant="info" size="md" className="mb-3">
          Kế hoạch: {phase}
        </Badge>
        <p className="placeholder-desc text-muted max-w-md mx-auto">
          {description}
        </p>

        {requiredPermissions.length > 0 && (
          <div className="placeholder-permissions mt-4">
            <h4 className="text-xs font-semibold text-muted uppercase tracking-wider mb-2">
              Quyền yêu cầu trên Backend:
            </h4>
            <div className="flex justify-center gap-1 flex-wrap">
              {requiredPermissions.map((p) => (
                <Badge key={p} variant="neutral" size="xs">
                  {p}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-6">
          <Link to="/dashboard">
            <Button variant="primary">Quay lại Tổng quan</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
