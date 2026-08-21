import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../../../api/stockApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/feedback/LoadingState';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { HistoryIcon, ArrowDownIcon, ArrowUpIcon, ChevronLeftIcon, ChevronRightIcon } from '../../../components/ui/Icons';

const PAGE_SIZE = 10;

function formatVND(val) {
  if (!val && val !== 0) return '—';
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
}

function formatDateTime(str) {
  if (!str) return '—';
  return new Date(str).toLocaleString('vi-VN');
}

/**
 * StockHistoryModal
 * Props: isOpen, onClose, stockRecord (ProductStockResponse)
 */
export function StockHistoryModal({ isOpen, onClose, stockRecord }) {
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['stock-history', stockRecord?.id, page],
    queryFn: () => stockApi.getStockHistory(stockRecord.id, { page, size: PAGE_SIZE, sort: 'createdAt,desc' }),
    enabled: isOpen && !!stockRecord?.id,
  });

  const pageData = data?.data;
  const transactions = pageData?.content || [];
  const totalPages = pageData?.totalPages || 0;
  const totalElements = pageData?.totalElements || 0;

  if (!stockRecord) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HistoryIcon size={18} />
          Lịch sử giao dịch
        </span>
      }
      size="lg"
    >
      {/* Stock record info */}
      <div
        style={{
          padding: '10px 14px',
          backgroundColor: '#f8fafc',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          marginBottom: 16,
          fontSize: 13,
          display: 'flex',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <span>
          <strong>Sản phẩm:</strong> {stockRecord.product?.name} ({stockRecord.product?.code})
        </span>
        <span>
          <strong>Kho:</strong> {stockRecord.warehouse?.name}
        </span>
        <span>
          <strong>Tồn hiện tại:</strong>{' '}
          <span style={{ color: 'var(--color-primary)', fontWeight: 700 }}>
            {stockRecord.quantity}
          </span>
        </span>
        <span style={{ color: 'var(--color-text-muted)', fontSize: 12 }}>
          {totalElements} giao dịch
        </span>
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Đang tải lịch sử..." minHeight="150px" />
      ) : isError ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--color-danger)' }}>
          Không thể tải lịch sử giao dịch.
        </div>
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={HistoryIcon}
          title="Chưa có giao dịch"
          description="Chưa có lịch sử nhập/xuất kho nào cho bản ghi này."
        />
      ) : (
        <>
          <div className="table-container" style={{ marginBottom: 12 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '10%' }}>Loại</th>
                  <th style={{ width: '10%', textAlign: 'right' }}>Số lượng</th>
                  <th style={{ width: '16%', textAlign: 'right' }}>Đơn giá</th>
                  <th style={{ width: '30%' }}>Ghi chú</th>
                  <th style={{ width: '16%' }}>Người thực hiện</th>
                  <th style={{ width: '18%' }}>Thời gian</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td>
                      {tx.type === 'IMPORT' ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--color-success)',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          <ArrowDownIcon size={13} /> Nhập
                        </span>
                      ) : (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            color: 'var(--color-danger)',
                            fontWeight: 600,
                            fontSize: 12,
                          }}
                        >
                          <ArrowUpIcon size={13} /> Xuất
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, fontSize: 13 }}>
                      {tx.type === 'IMPORT' ? '+' : '-'}{tx.quantity}
                    </td>
                    <td style={{ textAlign: 'right', fontSize: 13 }}>{formatVND(tx.unitPrice)}</td>
                    <td
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        maxWidth: 240,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={tx.note || ''}
                    >
                      {tx.note || '—'}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      {tx.createdBy}
                    </td>
                    <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
                      {formatDateTime(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <button
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 8px' }}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
              >
                <ChevronLeftIcon size={14} />
              </button>
              <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                Trang {page + 1} / {totalPages}
              </span>
              <button
                className="btn btn-outline btn-sm"
                style={{ padding: '4px 8px' }}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
              >
                <ChevronRightIcon size={14} />
              </button>
            </div>
          )}
        </>
      )}

      <div className="modal-footer" style={{ margin: '16px -20px -20px -20px' }}>
        <Button variant="secondary" onClick={onClose}>Đóng</Button>
      </div>
    </Modal>
  );
}
