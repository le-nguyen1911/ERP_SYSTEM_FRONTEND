/**
 * Permission Grouping and Formatting Utilities
 */

export const MODULE_CONFIG = {
  USER: {
    label: 'Quản lý Người dùng & Phân quyền',
    color: '#3b82f6',
    bgColor: '#eff6ff',
  },
  CATEGORY: {
    label: 'Danh mục Hàng hóa',
    color: '#10b981',
    bgColor: '#ecfdf5',
  },
  UNIT: {
    label: 'Đơn vị tính',
    color: '#f59e0b',
    bgColor: '#fffbeb',
  },
  PRODUCT: {
    label: 'Danh mục Sản phẩm',
    color: '#8b5cf6',
    bgColor: '#f5f3ff',
  },
  WAREHOUSE: {
    label: 'Quản lý Kho vật lý',
    color: '#06b6d4',
    bgColor: '#ecfeff',
  },
  STOCK: {
    label: 'Tồn kho & Điều chuyển',
    color: '#6366f1',
    bgColor: '#eef2ff',
  },
  SUPPLIER: {
    label: 'Nhà cung cấp',
    color: '#ec4899',
    bgColor: '#fdf2f8',
  },
  PURCHASE: {
    label: 'Đơn mua hàng (PO)',
    color: '#14b8a6',
    bgColor: '#f0fdfa',
  },
  GOODS_RECEIPT: {
    label: 'Phiếu nhập kho (GR)',
    color: '#0ea5e9',
    bgColor: '#f0f9ff',
  },
  CUSTOMER: {
    label: 'Khách hàng',
    color: '#f97316',
    bgColor: '#fff7ed',
  },
  SALES: {
    label: 'Đơn bán hàng (SO)',
    color: '#84cc16',
    bgColor: '#f7fee7',
  },
  DELIVERY: {
    label: 'Giao hàng & Xuất kho',
    color: '#a855f7',
    bgColor: '#faf5ff',
  },
  REPORT: {
    label: 'Báo cáo & Thống kê',
    color: '#64748b',
    bgColor: '#f8fafc',
  },
  OTHER: {
    label: 'Quyền khác',
    color: '#94a3b8',
    bgColor: '#f8fafc',
  },
};

/**
 * Group list of permission objects or string names by functional module
 * @param {Array<PermissionResponse | string>} permissions
 * @returns {Record<string, Array<PermissionResponse | { name: string, description?: string }>>}
 */
export function groupPermissionsByModule(permissions = []) {
  const groups = {};

  permissions.forEach((item) => {
    const permObj = typeof item === 'string' ? { name: item, description: item } : item;
    const name = permObj.name || '';

    let moduleKey = 'OTHER';
    if (name.startsWith('USER_')) moduleKey = 'USER';
    else if (name.startsWith('CATEGORY_')) moduleKey = 'CATEGORY';
    else if (name.startsWith('UNIT_')) moduleKey = 'UNIT';
    else if (name.startsWith('PRODUCT_')) moduleKey = 'PRODUCT';
    else if (name.startsWith('WAREHOUSE_')) moduleKey = 'WAREHOUSE';
    else if (name.startsWith('STOCK_')) moduleKey = 'STOCK';
    else if (name.startsWith('SUPPLIER_')) moduleKey = 'SUPPLIER';
    else if (name.startsWith('PURCHASE_')) moduleKey = 'PURCHASE';
    else if (name.startsWith('GOODS_RECEIPT_')) moduleKey = 'GOODS_RECEIPT';
    else if (name.startsWith('CUSTOMER_')) moduleKey = 'CUSTOMER';
    else if (name.startsWith('SALES_')) moduleKey = 'SALES';
    else if (name.startsWith('DELIVERY_')) moduleKey = 'DELIVERY';
    else if (name.startsWith('REPORT_')) moduleKey = 'REPORT';

    if (!groups[moduleKey]) {
      groups[moduleKey] = [];
    }
    groups[moduleKey].push(permObj);
  });

  return groups;
}
