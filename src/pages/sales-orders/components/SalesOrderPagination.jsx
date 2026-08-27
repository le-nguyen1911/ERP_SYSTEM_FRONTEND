import { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/ui/Icons';

export function SalesOrderPagination({ page, totalPages, totalElements, pageSize, onPageChange, onPageSizeChange }) {
  const [inputPage, setInputPage] = useState('');

  const handlePrev = () => { if (page > 0) onPageChange(page - 1); };
  const handleNext = () => { if (page < totalPages - 1) onPageChange(page + 1); };
  const handleGoTo = (e) => {
    e.preventDefault();
    const p = parseInt(inputPage, 10) - 1;
    if (!isNaN(p) && p >= 0 && p < totalPages) { onPageChange(p); setInputPage(''); }
  };

  const start = totalElements === 0 ? 0 : page * pageSize + 1;
  const end = Math.min((page + 1) * pageSize, totalElements);

  return (
    <div className="pagination-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
        <span>Hiển thị</span>
        <select
          value={pageSize}
          onChange={(e) => { onPageSizeChange(Number(e.target.value)); onPageChange(0); }}
          style={{ border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px', fontSize: 13 }}
        >
          {[10, 20, 50].map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <span>/ {totalElements} đơn bán hàng</span>
        {totalElements > 0 && <span>({start}–{end})</span>}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button
          onClick={handlePrev} disabled={page === 0}
          style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: page === 0 ? '#f8fafc' : '#fff', cursor: page === 0 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronLeftIcon size={14} />
        </button>

        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          let p = i;
          if (totalPages > 5) {
            if (page < 3) p = i;
            else if (page > totalPages - 4) p = totalPages - 5 + i;
            else p = page - 2 + i;
          }
          return (
            <button
              key={p} onClick={() => onPageChange(p)}
              style={{
                padding: '5px 10px', border: '1px solid', borderRadius: 6, fontSize: 13, fontWeight: 600,
                borderColor: p === page ? '#6366f1' : '#e2e8f0',
                background: p === page ? '#6366f1' : '#fff',
                color: p === page ? '#fff' : '#374151',
                cursor: 'pointer',
              }}
            >{p + 1}</button>
          );
        })}

        <button
          onClick={handleNext} disabled={page >= totalPages - 1}
          style={{ padding: '5px 8px', border: '1px solid #e2e8f0', borderRadius: 6, background: page >= totalPages - 1 ? '#f8fafc' : '#fff', cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer' }}
        >
          <ChevronRightIcon size={14} />
        </button>

        {totalPages > 5 && (
          <form onSubmit={handleGoTo} style={{ display: 'flex', gap: 4 }}>
            <input
              value={inputPage} onChange={(e) => setInputPage(e.target.value)}
              placeholder="Trang" style={{ width: 55, padding: '4px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
            />
            <button type="submit" style={{ padding: '4px 10px', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13 }}>
              Đến
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
