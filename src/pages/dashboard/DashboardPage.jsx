
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../stores/useAuthStore';
import { usePermission } from '../../hooks/usePermission';
import { ROLES, PERMISSIONS } from '../../utils/constants';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import {
  ShieldIcon,
  UsersIcon,
  PackageIcon,
  WarehouseIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  LaptopIcon,
  KeyIcon,
} from '../../components/ui/Icons';

export function DashboardPage() {
  const { user } = useAuthStore();
  const { hasPermission, isAdmin } = usePermission();

  const systemModules = [
    {
      title: 'Quản trị Người dùng & RBAC',
      desc: 'Quản lý tài khoản nhân viên, phân quyền vai trò và nhật ký hệ thống.',
      icon: UsersIcon,
      path: '/users',
      phase: 'Phase 2',
      visible: hasPermission(PERMISSIONS.USER_VIEW),
      status: 'Sẵn sàng triển khai',
    },
    {
      title: 'Danh mục Sản phẩm & Kho',
      desc: 'Quản lý danh mục hàng hóa, đơn vị tính, kho bãi và thẻ tồn kho.',
      icon: PackageIcon,
      path: '/products',
      phase: 'Phase 2 & 3',
      visible: hasPermission(PERMISSIONS.PRODUCT_VIEW),
      status: 'Sẵn sàng triển khai',
    },
    {
      title: 'Quy trình Mua hàng (Purchase)',
      desc: 'Quản lý Nhà cung cấp, Đơn đặt hàng PO và Phiếu nhận hàng kèm kiểm tra chất lượng QC.',
      icon: ShoppingCartIcon,
      path: '/purchase',
      phase: 'Phase 4',
      visible: hasPermission(PERMISSIONS.PURCHASE_UPDATE) || hasPermission(PERMISSIONS.PURCHASE_APPROVE),
      status: 'Sẵn sàng triển khai',
    },
    {
      title: 'Quy trình Bán hàng (Sales)',
      desc: 'Quản lý Khách hàng, Đơn bán hàng SO và Phiếu giao hàng & xuất kho tự động.',
      icon: TrendingUpIcon,
      path: '/sales',
      phase: 'Phase 5',
      visible: hasPermission(PERMISSIONS.SALES_VIEW),
      status: 'Sẵn sàng triển khai',
    },
  ];

  return (
    <div className="page-container">
      {/* Welcome Banner */}
      <div className="dashboard-welcome-card">
        <div className="welcome-content">
          <div className="welcome-badge">
            <ShieldIcon size={16} />
            <span>ERP Platform • Phase 1 Hoàn tất</span>
          </div>
          <h1 className="welcome-title">
            Xin chào, {user?.fullName || user?.username}!
          </h1>
          <p className="welcome-desc">
            Hệ thống đã xác thực thành công. Bạn đang hoạt động với vai trò{' '}
            <strong>{user?.roles?.join(', ') || 'USER'}</strong>. Toàn bộ nền tảng xác thực JWT, bảo mật phiên đa thiết bị và RBAC đã sẵn sàng.
          </p>
          <div className="welcome-actions">
            <Link to="/profile">
              <Button variant="primary" size="sm" icon={KeyIcon}>
                Hồ sơ & Bảo mật
              </Button>
            </Link>
            <Link to="/sessions">
              <Button variant="outline" size="sm" icon={LaptopIcon}>
                Phiên hoạt động
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* System Status Grid */}
      <div className="dashboard-stats-grid">
        <Card className="stat-card">
          <div className="stat-icon-wrapper text-primary">
            <ShieldIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Trạng thái Xác thực</span>
            <span className="stat-value text-success font-medium">Hoạt động (JWT Active)</span>
            <span className="stat-sub">Cơ chế Refresh Token Rotation bật</span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon-wrapper text-warning">
            <KeyIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Vai trò hiện tại</span>
            <div className="stat-roles-row">
              {user?.roles?.map((r) => (
                <Badge
                  key={r}
                  variant={r === ROLES.ADMIN ? 'danger' : r === ROLES.MANAGER ? 'warning' : 'primary'}
                  size="sm"
                >
                  {r}
                </Badge>
              ))}
            </div>
            <span className="stat-sub">
              {isAdmin ? 'Được cấp toàn bộ quyền hạn' : 'Được cấp quyền hạn theo vai trò'}
            </span>
          </div>
        </Card>

        <Card className="stat-card">
          <div className="stat-icon-wrapper text-info">
            <WarehouseIcon size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Kiến trúc Backend</span>
            <span className="stat-value font-medium">Modular Monolith</span>
            <span className="stat-sub">Spring Boot 3.5.14 + Java 21</span>
          </div>
        </Card>
      </div>

      {/* Modules Roadmap Grid */}
      <div className="dashboard-section-header">
        <h2 className="section-title">Lộ trình Các Module Nghiệp Vụ</h2>
        <p className="section-subtitle">
          Các module nghiệp vụ tiếp theo được thiết kế theo đúng hợp đồng API Backend đã xác minh.
        </p>
      </div>

      <div className="modules-grid">
        {systemModules.map((mod, idx) => (
          <Card key={idx} className="module-card">
            <div className="module-card-header">
              <div className="module-icon-box">
                <mod.icon size={24} />
              </div>
              <Badge variant="neutral" size="xs">
                {mod.phase}
              </Badge>
            </div>
            <h3 className="module-card-title">{mod.title}</h3>
            <p className="module-card-desc">{mod.desc}</p>
            <div className="module-card-footer">
              <Badge variant="info" size="xs">
                {mod.status}
              </Badge>
              <Link to={mod.path} className="module-link text-sm font-medium">
                Xem module →
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
