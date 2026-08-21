import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/ui/Icons';

export function PurchaseOrderPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (totalPages <= 1 && totalElements <= 10) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: '#fff',
        borderTop: '1px solid var(--color-border)',
        flexWrap: 'wrap',
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
        Hiển thị <strong>{Math.min(totalElements, currentPage * pageSize + 1)}</strong> -{' '}
        <strong>{Math.min(totalElements, (currentPage + 1) * pageSize)}</strong> trong tổng số{' '}
        <strong>{totalElements}</strong> đơn mua hàng
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {onPageSizeChange && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
            <span>Số dòng:</span>
            <select
              className="form-input"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              style={{ width: 70, height: 32, padding: '2px 8px', fontSize: 12 }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 8px' }}
            disabled={currentPage === 0}
            onClick={() => onPageChange(currentPage - 1)}
            title="Trang trước"
          >
            <ChevronLeftIcon size={14} />
          </button>

          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)', minWidth: 80, textAlign: 'center' }}>
            Trang {currentPage + 1} / {Math.max(1, totalPages)}
          </span>

          <button
            type="button"
            className="btn btn-outline btn-sm"
            style={{ padding: '4px 8px' }}
            disabled={currentPage >= totalPages - 1}
            onClick={() => onPageChange(currentPage + 1)}
            title="Trang sau"
          >
            <ChevronRightIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
