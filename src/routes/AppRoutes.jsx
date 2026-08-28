
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
import { WarehouseManagementPage } from '../pages/warehouses/WarehouseManagementPage';
import { ProductManagementPage } from '../pages/products/ProductManagementPage';
import { InventoryManagementPage } from '../pages/inventory/InventoryManagementPage';
import { SupplierManagementPage } from '../pages/suppliers/SupplierManagementPage';
import { PurchaseOrderManagementPage } from '../pages/purchase-orders/PurchaseOrderManagementPage';
import { GoodsReceiptManagementPage } from '../pages/goods-receipts/GoodsReceiptManagementPage';
import { CustomerManagementPage } from '../pages/customers/CustomerManagementPage';
import { AuditLogPage } from '../pages/audit/AuditLogPage';
import { SalesOrderManagementPage } from '../pages/sales-orders/SalesOrderManagementPage';
import { DeliveryManagementPage } from '../pages/deliveries/DeliveryManagementPage';
import { NotificationManagementPage } from '../pages/notifications/NotificationManagementPage';
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

          {/* Warehouse Management Module (Phase 2) */}
          <Route
            path="/warehouses"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.WAREHOUSE_VIEW}>
                <WarehouseManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/audit"
            element={
              <PermissionRoute requiredRole={ROLES.ADMIN}>
                <AuditLogPage />
              </PermissionRoute>
            }
          />

          {/* Product Catalog Management Module (Phase 2) */}
          <Route
            path="/products"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.PRODUCT_VIEW}>
                <ProductManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/inventory"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.STOCK_VIEW}>
                <InventoryManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/suppliers"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.SUPPLIER_VIEW}>
                <SupplierManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/purchase"
            element={
              <PermissionRoute
                requiredPermissions={[PERMISSIONS.PURCHASE_UPDATE, PERMISSIONS.PURCHASE_APPROVE, PERMISSIONS.PURCHASE_CREATE]}
              >
                <PurchaseOrderManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/goods-receipts"
            element={
              <PermissionRoute
                requiredPermissions={[PERMISSIONS.GOODS_RECEIPT_VIEW, PERMISSIONS.GOODS_RECEIPT_CREATE]}
              >
                <GoodsReceiptManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/customers"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.CUSTOMER_VIEW}>
                <CustomerManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.SALES_VIEW}>
                <SalesOrderManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/deliveries"
            element={
              <PermissionRoute requiredPermission={PERMISSIONS.DELIVERY_VIEW}>
                <DeliveryManagementPage />
              </PermissionRoute>
            }
          />

          <Route
            path="/notifications"
            element={<NotificationManagementPage />}
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
