
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthLayout } from '../layouts/AuthLayout';
import { MainLayout } from '../layouts/MainLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { PublicOnlyRoute } from './PublicOnlyRoute';
import { PermissionRoute } from './PermissionRoute';
import { PERMISSIONS, ROLES } from '../utils/constants';

// Pages
import { LoginPage } from '../pages/auth/LoginPage';
import { RegisterPage } from '../pages/auth/RegisterPage';
import { ActiveSessionsPage } from '../pages/auth/ActiveSessionsPage';
import { ProfilePage } from '../pages/profile/ProfilePage';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import { UserManagementPage } from '../pages/users/UserManagementPage';
import { RoleManagementPage } from '../pages/roles/RoleManagementPage';
import { CategoryManagementPage } from '../pages/categories/CategoryManagementPage';
import { UnitManagementPage } from '../pages/units/UnitManagementPage';
import { PlaceholderPage } from '../pages/common/PlaceholderPage';
import { ForbiddenPage } from '../pages/errors/ForbiddenPage';
import { NotFoundPage } from '../pages/errors/NotFoundPage';

export function AppRoutes() {
  return (
    <Routes>
      {/* Public Auth Routes */}
      <Route element={<PublicOnlyRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
      </Route>

      {/* Protected ERP Application Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sessions" element={<ActiveSessionsPage />} />

          {/* User Management & RBAC Module (Phase 2) */}
          <Route
            path="/users"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.USER_VIEW}>
                <UserManagementPage />
              </PermissionRoute>
            }
          />

          {/* Role & Permission Management Module */}
          <Route
            path="/roles"
            element={
              <PermissionRoute requiredRole={ROLES.ADMIN}>
                <RoleManagementPage />
              </PermissionRoute>
            }
          />

          {/* Category Management Module (Phase 2) */}
          <Route
            path="/categories"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.CATEGORY_VIEW}>
                <CategoryManagementPage />
              </PermissionRoute>
            }
          />

          {/* Unit Management Module (Phase 2) */}
          <Route
            path="/units"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.UNIT_VIEW}>
                <UnitManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/audit"
            element={
              <PermissionRoute requiredRole={ROLES.ADMIN}>
                <PlaceholderPage
                  title="Nhật ký Hệ thống (Audit Log)"
                  phase="Phase 6"
                  description="Truy vết chi tiết mọi thay đổi dữ liệu (old_value và new_value dạng JSONB), phục vụ kiểm toán và giám sát hệ thống."
                  requiredPermissions={['ROLE_ADMIN']}
                />
              </PermissionRoute>
            }
          />

          <Route
            path="/products"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.PRODUCT_VIEW}>
                <PlaceholderPage
                  title="Danh mục Sản phẩm"
                  phase="Phase 2"
                  description="Quản lý danh mục hàng hóa, đơn vị tính, mã SKU, giá bán và trạng thái kích hoạt."
                  requiredPermissions={[PERMISSIONS.PRODUCT_VIEW, PERMISSIONS.PRODUCT_CREATE, PERMISSIONS.PRODUCT_UPDATE]}
                />
              </PermissionRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.STOCK_VIEW}>
                <PlaceholderPage
                  title="Quản lý Tồn kho & Điều chuyển"
                  phase="Phase 3"
                  description="Theo dõi số lượng tồn theo kho vật lý, cảnh báo tồn kho tối thiểu, điều chuyển giữa các kho và lịch sử giao dịch thẻ kho."
                  requiredPermissions={[PERMISSIONS.STOCK_VIEW, PERMISSIONS.STOCK_IMPORT, PERMISSIONS.STOCK_EXPORT, PERMISSIONS.STOCK_TRANSFER]}
                />
              </PermissionRoute>
            }
          />

          <Route
            path="/purchase"
            element={
              <PermissionRoute
                requiredPermissions={[PERMISSIONS.PURCHASE_UPDATE, PERMISSIONS.PURCHASE_APPROVE, PERMISSIONS.PURCHASE_CREATE]}
              >
                <PlaceholderPage
                  title="Quy trình Mua hàng (Purchase Order & Goods Receipt)"
                  phase="Phase 4"
                  description="Quản lý Nhà cung cấp, Đơn mua hàng PO đa trạng thái và Phiếu nhận hàng GR kèm quy trình kiểm tra chất lượng (QC)."
                  requiredPermissions={[PERMISSIONS.PURCHASE_CREATE, PERMISSIONS.PURCHASE_APPROVE, PERMISSIONS.GOODS_RECEIPT_CREATE]}
                />
              </PermissionRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.SALES_VIEW}>
                <PlaceholderPage
                  title="Quy trình Bán hàng (Sales Order & Delivery)"
                  phase="Phase 5"
                  description="Quản lý Khách hàng, Đơn bán hàng SO, xác nhận giao hàng và tự động xuất kho theo đơn hàng."
                  requiredPermissions={[PERMISSIONS.SALES_VIEW, PERMISSIONS.SALES_CREATE, PERMISSIONS.DELIVERY_CREATE]}
                />
              </PermissionRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <PlaceholderPage
                title="Trung tâm Thông báo"
                phase="Phase 6"
                description="Nhận thông báo tự động từ sự kiện duyệt đơn mua hàng, duyệt đơn bán hàng, cảnh báo tồn kho thấp và lỗi xuất nhập kho."
              />
            }
          />
        </Route>
      </Route>

      {/* Standalone Error Routes */}
      <Route path="/403" element={<ForbiddenPage />} />
      <Route path="/404" element={<NotFoundPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
