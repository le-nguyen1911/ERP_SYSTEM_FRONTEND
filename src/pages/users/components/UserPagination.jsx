import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/ui/Icons';

export function UserPagination({
  currentPage,
  totalPages,
  totalElements,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  if (!totalPages || totalPages <= 0) return null;

  const startRecord = totalElements === 0 ? 0 : currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxButtons = 5;
    let start = Math.max(0, currentPage - 2);
    let end = Math.min(totalPages - 1, start + maxButtons - 1);

    if (end - start < maxButtons - 1) {
      start = Math.max(0, end - maxButtons + 1);
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="pagination-container">
      <div className="pagination-info">
        Hiển thị <strong>{startRecord}</strong> - <strong>{endRecord}</strong> trên tổng số <strong>{totalElements}</strong> người dùng
      </div>

      <div className="pagination-controls">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Mỗi trang:</span>
          <select
            className="pagination-size-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 0}
          title="Trang trước"
          aria-label="Trang trước"
        >
          <ChevronLeftIcon size={14} />
        </button>

        {getPageNumbers().map((pageNum) => (
          <button
            key={pageNum}
            type="button"
            className={`pagination-btn ${pageNum === currentPage ? 'active' : ''}`}
            onClick={() => onPageChange(pageNum)}
          >
            {pageNum + 1}
          </button>
        ))}

        <button
          type="button"
          className="pagination-btn"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages - 1}
          title="Trang tiếp"
          aria-label="Trang tiếp"
        >
          <ChevronRightIcon size={14} />
        </button>
      </div>
    </div>
  );
}
