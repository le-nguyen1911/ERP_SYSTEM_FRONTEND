import { useState, useRef, useEffect, Fragment } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/useAuthStore';
import { usePermission } from '../hooks/usePermission';
import { authApi } from '../api/authApi';
import { toast } from '../stores/useToastStore';
import { PERMISSIONS, ROLES } from '../utils/constants';
import {
  ShieldIcon,
  ShieldCheckIcon,
  LayoutDashboardIcon,
  UsersIcon,
  PackageIcon,
  TagIcon,
  ScaleIcon,
  WarehouseIcon,
  TruckIcon,
  ShoppingCartIcon,
  InboxIcon,
  TrendingUpIcon,
  BellIcon,
  FileTextIcon,
  LogOutIcon,
  LaptopIcon,
  KeyIcon,
  MenuIcon,
  XIcon,
  ChevronDownIcon,
} from '../components/ui/Icons';
import { Badge } from '../components/ui/Badge';
import { ConfirmModal } from '../components/ui/Modal';

export function MainLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logoutAllModalOpen, setLogoutAllModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const { user, clearAuth } = useAuthStore();
  const { hasPermission, hasRole } = usePermission();
  const location = useLocation();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      await authApi.logout();
      toast.success('Đăng xuất thành công');
    } catch {
      // Ignore error and clear local auth regardless
    } finally {
      clearAuth();
      setIsLoggingOut(false);
      navigate('/login');
    }
  };

  const handleLogoutAll = async () => {
    try {
      setIsLoggingOut(true);
      await authApi.logoutAll();
      toast.success('Đã đăng xuất khỏi tất cả thiết bị');
    } catch (err) {
      toast.error(err.message || 'Lỗi khi đăng xuất tất cả thiết bị');
    } finally {
      clearAuth();
      setIsLoggingOut(false);
      setLogoutAllModalOpen(false);
      navigate('/login');
    }
  };

  // Nav items definition with RBAC checks
  const navGroups = [
    {
      title: 'TỔNG QUAN',
      items: [
        {
          label: 'Bảng điều khiển',
          path: '/dashboard',
          icon: LayoutDashboardIcon,
          visible: true,
        },
      ],
    },
    {
      title: 'QUẢN TRỊ HỆ THỐNG',
      items: [
        {
          label: 'Người dùng',
          path: '/users',
          icon: UsersIcon,
          visible: hasPermission(PERMISSIONS.USER_VIEW),
          badge: 'Phase 2',
        },
        {
          label: 'Vai trò & Phân quyền',
          path: '/roles',
          icon: ShieldCheckIcon,
          visible: hasRole(ROLES.ADMIN),
          badge: 'Admin',
        },
        {
          label: 'Nhật ký Audit',
          path: '/audit',
          icon: FileTextIcon,
          visible: hasRole(ROLES.ADMIN),
          badge: 'Admin',
        },
      ],
    },
    {
      title: 'QUẢN LÝ KHO & SẢN PHẨM',
      items: [
        {
          label: 'Danh mục hàng hóa',
          path: '/categories',
          icon: TagIcon,
          visible: hasPermission(PERMISSIONS.CATEGORY_VIEW),
          badge: 'Phase 2',
        },
        {
          label: 'Đơn vị tính',
          path: '/units',
          icon: ScaleIcon,
          visible: hasPermission(PERMISSIONS.UNIT_VIEW),
          badge: 'Phase 2',
        },
        {
          label: 'Quản lý kho',
          path: '/warehouses',
          icon: WarehouseIcon,
          visible: hasPermission(PERMISSIONS.WAREHOUSE_VIEW),
          badge: 'Phase 2',
        },
        {
          label: 'Danh mục sản phẩm',
          path: '/products',
          icon: PackageIcon,
          visible: hasPermission(PERMISSIONS.PRODUCT_VIEW),
          badge: 'Phase 2',
        },
        {
          label: 'Tồn kho & Điều chuyển',
          path: '/inventory',
          icon: WarehouseIcon,
          visible: hasPermission(PERMISSIONS.STOCK_VIEW),
          badge: 'Phase 3',
        },
      ],
    },
    {
      title: 'CHUỖI CUNG ỨNG',
      items: [
        {
          label: 'Nhà cung cấp',
          path: '/suppliers',
          icon: TruckIcon,
          visible: hasPermission(PERMISSIONS.SUPPLIER_VIEW),
          badge: 'Phase 4',
        },
        {
          label: 'Đơn mua hàng (PO)',
          path: '/purchase',
          icon: ShoppingCartIcon,
          visible: hasPermission(PERMISSIONS.PURCHASE_UPDATE) || hasPermission(PERMISSIONS.PURCHASE_APPROVE) || hasPermission(PERMISSIONS.PURCHASE_CREATE),
        },
        {
          label: 'Nhận hàng (GR)',
          path: '/goods-receipts',
          icon: InboxIcon,
          visible: hasPermission(PERMISSIONS.GOODS_RECEIPT_VIEW) || hasPermission(PERMISSIONS.GOODS_RECEIPT_CREATE),
        },
        {
          label: 'Khách hàng',
          path: '/customers',
          icon: UsersIcon,
          visible: hasPermission(PERMISSIONS.CUSTOMER_VIEW),
          badge: 'Phase 5',
        },
        {
          label: 'Bán hàng & Giao hàng',
          path: '/sales',
          icon: TrendingUpIcon,
          visible: hasPermission(PERMISSIONS.SALES_VIEW),
          badge: 'Phase 5',
        },
      ],
    },
    {
      title: 'CÁ NHÂN',
      items: [
        {
          label: 'Hồ sơ & Đổi mật khẩu',
          path: '/profile',
          icon: KeyIcon,
          visible: true,
        },
        {
          label: 'Phiên hoạt động',
          path: '/sessions',
          icon: LaptopIcon,
          visible: true,
        },
      ],
    },
  ];

  // Generate breadcrumb items
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbNames = {
    dashboard: 'Bảng điều khiển',
    users: 'Người dùng',
    roles: 'Vai trò & Phân quyền',
    categories: 'Danh mục hàng hóa',
    units: 'Đơn vị tính',
    warehouses: 'Quản lý kho',
    audit: 'Nhật ký Audit',
    products: 'Sản phẩm',
    inventory: 'Tồn kho',
    purchase: 'Mua hàng',
    'goods-receipts': 'Nhận hàng (GR)',
    customers: 'Khách hàng',
    sales: 'Bán hàng',
    notifications: 'Thông báo',
    profile: 'Hồ sơ tài khoản',
    sessions: 'Phiên hoạt động',
    '403': 'Truy cập bị từ chối',
    '404': 'Không tìm thấy trang',
  };

  return (
    <div className="layout-root">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''} ${
          mobileMenuOpen ? 'mobile-open' : ''
        }`}
      >
        <div className="sidebar-header">
          <Link to="/dashboard" className="sidebar-brand">
            <div className="sidebar-logo">
              <ShieldIcon size={24} />
            </div>
            {!sidebarCollapsed && (
              <div className="sidebar-brand-text">
                <span className="brand-name">ERP SYSTEM</span>
                <span className="brand-badge">Enterprise</span>
              </div>
            )}
          </Link>
          <button
            type="button"
            className="sidebar-toggle-btn mobile-only"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Đóng menu"
          >
            <XIcon size={20} />
          </button>
        </div>

        <div className="sidebar-nav">
          {navGroups.map((group, gIdx) => {
            const visibleItems = group.items.filter((item) => item.visible);
            if (visibleItems.length === 0) return null;

            return (
              <div key={gIdx} className="nav-group">
                {!sidebarCollapsed && (
                  <div className="nav-group-title">{group.title}</div>
                )}
                <div className="nav-group-items">
                  {visibleItems.map((item, iIdx) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={iIdx}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={({ isActive }) =>
                          `nav-item ${isActive ? 'active' : ''}`
                        }
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <div className="nav-item-icon">
                          <Icon size={18} />
                        </div>
                        {!sidebarCollapsed && (
                          <>
                            <span className="nav-item-label">{item.label}</span>
                            {item.badge && (
                              <span className="nav-item-badge">{item.badge}</span>
                            )}
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* User Card on Sidebar bottom */}
        {!sidebarCollapsed && (
          <div className="sidebar-footer">
            <div className="sidebar-user-card">
              <div className="user-avatar-small">
                {user?.fullName ? user.fullName[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name" title={user?.fullName || user?.username}>
                  {user?.fullName || user?.username}
                </div>
                <div className="sidebar-user-role">
                  {user?.roles?.map((r) => (
                    <Badge key={r} variant={r === ROLES.ADMIN ? 'danger' : r === ROLES.MANAGER ? 'warning' : 'primary'} size="xs">
                      {r}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              type="button"
              className="header-icon-btn mobile-only"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Mở menu"
            >
              <MenuIcon size={20} />
            </button>
            <button
              type="button"
              className="header-icon-btn desktop-only"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label="Thu gọn Sidebar"
            >
              <MenuIcon size={18} />
            </button>

            {/* Breadcrumb trail */}
            <nav className="breadcrumbs" aria-label="Breadcrumb">
              <Link to="/dashboard" className="breadcrumb-item">
                Trang chủ
              </Link>
              {pathSegments.map((segment, idx) => {
                const url = `/${pathSegments.slice(0, idx + 1).join('/')}`;
                const isLast = idx === pathSegments.length - 1;
                const displayName = breadcrumbNames[segment] || segment;

                return (
                  <Fragment key={url}>
                    <span className="breadcrumb-separator">/</span>
                    {isLast ? (
                      <span className="breadcrumb-item active" aria-current="page">
                        {displayName}
                      </span>
                    ) : (
                      <Link to={url} className="breadcrumb-item">
                        {displayName}
                      </Link>
                    )}
                  </Fragment>
                );
              })}
            </nav>
          </div>

          <div className="header-right">
            {/* Notification placeholder */}
            <Link to="/notifications" className="header-icon-btn" title="Thông báo">
              <BellIcon size={18} />
              <span className="notification-dot" />
            </Link>

            {/* User Profile Dropdown */}
            <div className="user-dropdown-wrapper" ref={dropdownRef}>
              <button
                type="button"
                className="user-dropdown-trigger"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                aria-expanded={userDropdownOpen}
              >
                <div className="user-avatar-header">
                  {user?.fullName ? user.fullName[0].toUpperCase() : user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="user-header-text desktop-only">
                  <span className="user-header-name">{user?.fullName || user?.username}</span>
                  <span className="user-header-email">{user?.email}</span>
                </div>
                <ChevronDownIcon size={14} className="dropdown-arrow" />
              </button>

              {userDropdownOpen && (
                <div className="user-dropdown-menu">
                  <div className="user-dropdown-header">
                    <div className="dropdown-user-name">{user?.fullName || user?.username}</div>
                    <div className="dropdown-user-email">{user?.email}</div>
                    <div className="dropdown-roles">
                      {user?.roles?.map((r) => (
                        <Badge key={r} variant={r === ROLES.ADMIN ? 'danger' : r === ROLES.MANAGER ? 'warning' : 'primary'} size="xs">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="user-dropdown-divider" />

                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <KeyIcon size={16} />
                    <span>Hồ sơ & Đổi mật khẩu</span>
                  </Link>

                  <Link
                    to="/sessions"
                    className="dropdown-item"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <LaptopIcon size={16} />
                    <span>Quản lý phiên đăng nhập</span>
                  </Link>

                  <div className="user-dropdown-divider" />

                  <button
                    type="button"
                    className="dropdown-item text-warning"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setLogoutAllModalOpen(true);
                    }}
                  >
                    <ShieldIcon size={16} />
                    <span>Đăng xuất tất cả thiết bị</span>
                  </button>

                  <button
                    type="button"
                    className="dropdown-item text-danger"
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                  >
                    <LogOutIcon size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="content-container">
          <Outlet />
        </main>
      </div>

      {/* Logout All Confirm Modal */}
      <ConfirmModal
        isOpen={logoutAllModalOpen}
        onClose={() => setLogoutAllModalOpen(false)}
        onConfirm={handleLogoutAll}
        title="Đăng xuất khỏi tất cả thiết bị?"
        message="Hành động này sẽ hủy tất cả các phiên đăng nhập đang hoạt động của bạn trên mọi thiết bị và trình duyệt. Bạn sẽ cần đăng nhập lại."
        confirmText="Đăng xuất tất cả"
        cancelText="Hủy bỏ"
        variant="danger"
        isLoading={isLoggingOut}
      />
    </div>
  );
}
