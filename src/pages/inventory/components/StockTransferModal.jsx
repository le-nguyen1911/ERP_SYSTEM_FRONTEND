import { useState, useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { stockApi } from '../../../api/stockApi';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { LoadingState } from '../../../components/feedback/LoadingState';
import {
  ArrowRightLeftIcon,
  PackageIcon,
  WarehouseIcon,
  SearchIcon,
  ChevronDownIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  XIcon,
} from '../../../components/ui/Icons';

const transferSchema = z.object({
  productId: z.string().uuid('Vui lòng chọn sản phẩm'),
  fromWarehouseId: z.string().uuid('Vui lòng chọn kho nguồn'),
  toWarehouseId: z.string().uuid('Vui lòng chọn kho đích'),
  quantity: z
    .number({ invalid_type_error: 'Số lượng phải là số' })
    .int('Số lượng phải là số nguyên')
    .min(1, 'Số lượng tối thiểu là 1'),
  note: z.string().max(500, 'Tối đa 500 ký tự').optional().nullable(),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  { message: 'Kho nguồn và kho đích không được giống nhau', path: ['toWarehouseId'] }
);

function StockTransferModalContent({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  products = [],
  warehouses = [],
  stockRecord = null,
  defaultProductId,
  defaultFromWarehouseId,
}) {
  // Direct transfer flow: initiated from a specific product stock row
  const isDirect = Boolean(stockRecord?.product?.id);
  const directProduct = stockRecord?.product;
  const directWarehouse = stockRecord?.warehouse;
  const directAvailableQty = stockRecord?.quantity ?? 0;

  // React Hook Form initialized with default values directly
  const {
    register,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(transferSchema),
    defaultValues: {
      productId: stockRecord?.product?.id || defaultProductId || '',
      fromWarehouseId: stockRecord?.warehouse?.id || defaultFromWarehouseId || '',
      toWarehouseId: '',
      quantity: '',
      note: '',
    },
  });

  const watchedFromWarehouseId = useWatch({ control, name: 'fromWarehouseId' });
  const watchedProductId = useWatch({ control, name: 'productId' });
  const watchedToWarehouseId = useWatch({ control, name: 'toWarehouseId' });
  const watchedQuantity = useWatch({ control, name: 'quantity' });

  // Effective source warehouse ID
  const currentFromWarehouseId = isDirect
    ? directWarehouse?.id
    : watchedFromWarehouseId;

  // Search & Combobox UI states for General flow
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Fetch stocks for the selected warehouse in general flow
  const { data: warehouseStocksData, isLoading: isLoadingWarehouseStocks } = useQuery({
    queryKey: ['stocks-for-transfer', currentFromWarehouseId],
    queryFn: () => stockApi.getStockByWarehouse(currentFromWarehouseId),
    enabled: isOpen && !isDirect && !!currentFromWarehouseId,
  });

  // Filter products: Only active products with available quantity > 0 in this warehouse
  const availableProductStocks = useMemo(() => {
    if (isDirect) return [];
    const list = warehouseStocksData?.data || [];
    return list.filter((s) => s.quantity > 0 && s.product && s.product.active !== false);
  }, [warehouseStocksData, isDirect]);

  // Filtered stocks based on user search query (name or code, case-insensitive)
  const filteredProductStocks = useMemo(() => {
    if (!searchQuery.trim()) return availableProductStocks;
    const q = searchQuery.trim().toLowerCase();
    return availableProductStocks.filter((s) => {
      const name = s.product?.name?.toLowerCase() || '';
      const code = s.product?.code?.toLowerCase() || '';
      return name.includes(q) || code.includes(q);
    });
  }, [availableProductStocks, searchQuery]);

  // Selected product stock derived purely from state and data
  const selectedProductStock = useMemo(() => {
    if (isDirect) return stockRecord;
    return availableProductStocks.find((s) => s.product?.id === watchedProductId) || null;
  }, [isDirect, stockRecord, availableProductStocks, watchedProductId]);

  // Determine current available stock limit
  const availableStock = useMemo(() => {
    if (isDirect) return directAvailableQty;
    if (selectedProductStock) return selectedProductStock.quantity ?? 0;
    return 0;
  }, [isDirect, directAvailableQty, selectedProductStock]);

  // Current product info
  const currentProduct = useMemo(() => {
    if (isDirect) return directProduct;
    if (selectedProductStock?.product) return selectedProductStock.product;
    return products.find((p) => p.id === watchedProductId) || null;
  }, [isDirect, directProduct, selectedProductStock, products, watchedProductId]);

  const currentUnit = currentProduct?.unit?.name || currentProduct?.unitName || '';

  // Filter destination warehouses: exclude source warehouse
  const destinationWarehouses = useMemo(() => {
    return warehouses.filter((w) => w.active && w.id !== currentFromWarehouseId);
  }, [warehouses, currentFromWarehouseId]);

  // Destination warehouse info
  const destinationWarehouse = useMemo(() => {
    return warehouses.find((w) => w.id === watchedToWarehouseId) || null;
  }, [warehouses, watchedToWarehouseId]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isDropdownOpen]);

  // Handle product selection from dropdown
  const handleSelectProduct = (stockItem) => {
    setValue('productId', stockItem.product.id, { shouldValidate: true });
    setIsDropdownOpen(false);
    setSearchQuery('');
    clearErrors('productId');

    // Reset quantity if it exceeds new product stock
    if (watchedQuantity && Number(watchedQuantity) > stockItem.quantity) {
      setValue('quantity', stockItem.quantity, { shouldValidate: true });
    }
  };

  // Form submission with strict stock validation
  const handleFormSubmit = (data) => {
    const qty = Number(data.quantity);

    if (availableStock <= 0) {
      setError('quantity', {
        type: 'manual',
        message: 'Tồn kho khả dụng bằng 0, không thể điều chuyển',
      });
      return;
    }

    if (qty > availableStock) {
      setError('quantity', {
        type: 'manual',
        message: `Số lượng điều chuyển không được vượt quá tồn kho khả dụng (${availableStock})`,
      });
      return;
    }

    if (data.fromWarehouseId === data.toWarehouseId) {
      setError('toWarehouseId', {
        type: 'manual',
        message: 'Kho nguồn và kho đích không được giống nhau',
      });
      return;
    }

    onSubmit({
      productId: data.productId,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      quantity: qty,
      note: data.note || null,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ArrowRightLeftIcon size={18} style={{ color: 'var(--color-primary)' }} />
          Điều chuyển tồn kho giữa các kho
        </span>
      }
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} noValidate>
        <div className="form-grid" style={{ gap: 16 }}>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* FLOW A: DIRECT TRANSFER FROM PRODUCT ROW                      */}
          {/* ───────────────────────────────────────────────────────────── */}
          {isDirect ? (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '14px 16px',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: 'var(--color-primary-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-primary)',
                      flexShrink: 0,
                    }}
                  >
                    <PackageIcon size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--color-text-main)' }}>
                      {directProduct?.name}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                      Mã SP: {directProduct?.code} {currentUnit ? `• ĐVT: ${currentUnit}` : ''}
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>Tồn khả dụng tại kho nguồn</div>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 800,
                      color: directAvailableQty > 0 ? 'var(--color-success)' : 'var(--color-danger)',
                    }}
                  >
                    {directAvailableQty} <span style={{ fontSize: 12, fontWeight: 500 }}>{currentUnit}</span>
                  </div>
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  paddingTop: 10,
                  borderTop: '1px solid #e2e8f0',
                  color: 'var(--color-text-secondary)',
                }}
              >
                <WarehouseIcon size={14} style={{ color: 'var(--color-primary)' }} />
                <span>
                  Kho nguồn (xuất hàng): <strong style={{ color: 'var(--color-text-main)' }}>{directWarehouse?.name}</strong>
                </span>
              </div>

              <input type="hidden" {...register('productId')} value={directProduct?.id || ''} />
              <input type="hidden" {...register('fromWarehouseId')} value={directWarehouse?.id || ''} />
            </div>
          ) : (
            /* ───────────────────────────────────────────────────────────── */
            /* FLOW B: GENERAL TRANSFER (CHOOSE SOURCE & SEARCH PRODUCT)     */
            /* ───────────────────────────────────────────────────────────── */
            <>
              {/* Step 1: Kho nguồn */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">
                  Kho nguồn (xuất hàng) <span className="required">*</span>
                </label>
                <select
                  className={`form-input${errors.fromWarehouseId ? ' is-invalid' : ''}`}
                  {...register('fromWarehouseId')}
                  onChange={(e) => {
                    register('fromWarehouseId').onChange(e);
                    setValue('productId', '');
                    setValue('quantity', '');
                    setSearchQuery('');
                  }}
                >
                  <option value="">-- Chọn kho xuất hàng --</option>
                  {warehouses
                    .filter((w) => w.active)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name}
                      </option>
                    ))}
                </select>
                {errors.fromWarehouseId && (
                  <div className="form-error">{errors.fromWarehouseId.message}</div>
                )}
              </div>

              {/* Step 2: Tìm kiếm & Chọn sản phẩm có tồn kho */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }} ref={dropdownRef}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label className="form-label" style={{ marginBottom: 0 }}>
                    Sản phẩm cần điều chuyển <span className="required">*</span>
                  </label>
                  {currentFromWarehouseId && !isLoadingWarehouseStocks && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                      {availableProductStocks.length} sản phẩm có tồn kho
                    </span>
                  )}
                </div>

                {!currentFromWarehouseId ? (
                  <div
                    style={{
                      padding: '10px 14px',
                      backgroundColor: '#f8fafc',
                      border: '1px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      fontSize: 13,
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    <WarehouseIcon size={16} style={{ opacity: 0.5 }} />
                    Vui lòng chọn kho nguồn trước để xem danh sách sản phẩm có tồn kho khả dụng
                  </div>
                ) : (
                  <div style={{ position: 'relative' }}>
                    {/* Trigger Button */}
                    <div
                      className={`form-input${errors.productId ? ' is-invalid' : ''}`}
                      onClick={() => setIsDropdownOpen((prev) => !prev)}
                      style={{
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        minHeight: 40,
                        backgroundColor: '#fff',
                        userSelect: 'none',
                      }}
                    >
                      {selectedProductStock ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                          <PackageIcon size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                          <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            <strong style={{ color: 'var(--color-text-main)' }}>
                              {selectedProductStock.product?.name}
                            </strong>{' '}
                            <span style={{ fontSize: 11, color: 'var(--color-text-muted)', fontFamily: 'monospace' }}>
                              ({selectedProductStock.product?.code})
                            </span>
                          </div>
                          <span
                            style={{
                              marginLeft: 'auto',
                              padding: '2px 8px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: 'var(--color-success-light)',
                              color: 'var(--color-success)',
                              fontWeight: 700,
                              fontSize: 11,
                              flexShrink: 0,
                            }}
                          >
                            Tồn: {selectedProductStock.quantity} {selectedProductStock.product?.unit?.name || ''}
                          </span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <SearchIcon size={14} />
                          Tìm & chọn sản phẩm có tồn kho...
                        </span>
                      )}
                      <ChevronDownIcon
                        size={16}
                        style={{
                          color: 'var(--color-text-muted)',
                          transform: isDropdownOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          marginLeft: 8,
                          flexShrink: 0,
                        }}
                      />
                    </div>

                    <input type="hidden" {...register('productId')} />

                    {/* Dropdown Panel */}
                    {isDropdownOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 4px)',
                          left: 0,
                          right: 0,
                          zIndex: 1000,
                          backgroundColor: '#ffffff',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--color-border)',
                          boxShadow: 'var(--shadow-lg)',
                          padding: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {/* Search Input Box */}
                        <div style={{ position: 'relative' }}>
                          <SearchIcon
                            size={14}
                            style={{
                              position: 'absolute',
                              left: 10,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--color-text-muted)',
                            }}
                          />
                          <input
                            ref={searchInputRef}
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => e.stopPropagation()}
                            placeholder="Nhập tên hoặc mã sản phẩm..."
                            style={{
                              width: '100%',
                              padding: '8px 28px 8px 32px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--color-border)',
                              fontSize: 13,
                              outline: 'none',
                              boxSizing: 'border-box',
                            }}
                          />
                          {searchQuery && (
                            <button
                              type="button"
                              onClick={() => setSearchQuery('')}
                              style={{
                                position: 'absolute',
                                right: 8,
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: 'var(--color-text-muted)',
                                padding: 2,
                              }}
                            >
                              <XIcon size={14} />
                            </button>
                          )}
                        </div>

                        {/* Dropdown List */}
                        <div
                          style={{
                            maxHeight: 220,
                            overflowY: 'auto',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 2,
                          }}
                        >
                          {isLoadingWarehouseStocks ? (
                            <LoadingState message="Đang kiểm tra tồn kho..." minHeight="100px" />
                          ) : availableProductStocks.length === 0 ? (
                            <div
                              style={{
                                padding: '20px 14px',
                                textAlign: 'center',
                                color: 'var(--color-danger)',
                                fontSize: 13,
                              }}
                            >
                              <AlertTriangleIcon size={24} style={{ marginBottom: 6, opacity: 0.6 }} />
                              <div>Kho này hiện không có sản phẩm nào có tồn kho khả dụng (&gt; 0).</div>
                            </div>
                          ) : filteredProductStocks.length === 0 ? (
                            <div
                              style={{
                                padding: '16px 14px',
                                textAlign: 'center',
                                color: 'var(--color-text-muted)',
                                fontSize: 13,
                              }}
                            >
                              Không tìm thấy sản phẩm khớp với "{searchQuery}".
                            </div>
                          ) : (
                            filteredProductStocks.map((s) => {
                              const isSelected = selectedProductStock?.product?.id === s.product?.id;
                              return (
                                <div
                                  key={s.id}
                                  onClick={() => handleSelectProduct(s)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '8px 10px',
                                    borderRadius: 'var(--radius-sm)',
                                    cursor: 'pointer',
                                    backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                                    transition: 'background-color 0.15s',
                                  }}
                                  onMouseEnter={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = '#f1f5f9';
                                  }}
                                  onMouseLeave={(e) => {
                                    if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                                  }}
                                >
                                  <div style={{ flex: 1, minWidth: 0, marginRight: 10 }}>
                                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text-main)' }}>
                                      {s.product?.name}
                                    </div>
                                    <div style={{ display: 'flex', gap: 6, fontSize: 11, color: 'var(--color-text-muted)' }}>
                                      <span style={{ fontFamily: 'monospace' }}>{s.product?.code}</span>
                                      {s.product?.unit?.name && <span>• ĐVT: {s.product.unit.name}</span>}
                                    </div>
                                  </div>
                                  <span
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 4,
                                      padding: '2px 8px',
                                      borderRadius: 'var(--radius-full)',
                                      backgroundColor: 'var(--color-success-light)',
                                      color: 'var(--color-success)',
                                      fontWeight: 700,
                                      fontSize: 12,
                                      flexShrink: 0,
                                    }}
                                  >
                                    Tồn: {s.quantity} {s.product?.unit?.name || ''}
                                  </span>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
                {errors.productId && <div className="form-error">{errors.productId.message}</div>}
              </div>
            </>
          )}

          {/* ───────────────────────────────────────────────────────────── */}
          {/* COMMON FIELDS: DESTINATION WAREHOUSE, QUANTITY, NOTE          */}
          {/* ───────────────────────────────────────────────────────────── */}

          {/* Kho đích (nhập hàng) */}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">
              Kho đích (nhập hàng) <span className="required">*</span>
            </label>
            <select
              className={`form-input${errors.toWarehouseId ? ' is-invalid' : ''}`}
              {...register('toWarehouseId')}
              disabled={!currentFromWarehouseId || availableStock <= 0}
            >
              <option value="">-- Chọn kho nhận hàng --</option>
              {destinationWarehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
            {errors.toWarehouseId && <div className="form-error">{errors.toWarehouseId.message}</div>}
            {currentFromWarehouseId && destinationWarehouses.length === 0 && (
              <div style={{ fontSize: 12, color: 'var(--color-danger)', marginTop: 4 }}>
                ⚠️ Không có kho đích nào khác đang hoạt động trong hệ thống.
              </div>
            )}
          </div>

          {/* Số lượng điều chuyển */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <label className="form-label" style={{ marginBottom: 0 }}>
                Số lượng điều chuyển <span className="required">*</span>
              </label>
              {availableStock > 0 && (
                <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>
                  Tối đa:{' '}
                  <strong style={{ color: 'var(--color-success)' }}>{availableStock}</strong> {currentUnit}
                  <button
                    type="button"
                    onClick={() => setValue('quantity', availableStock, { shouldValidate: true })}
                    style={{
                      marginLeft: 8,
                      fontSize: 11,
                      padding: '2px 6px',
                      borderRadius: 4,
                      border: '1px solid var(--color-primary-border)',
                      backgroundColor: 'var(--color-primary-light)',
                      color: 'var(--color-primary)',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Tối đa
                  </button>
                </span>
              )}
            </div>

            <input
              type="number"
              min="1"
              max={availableStock || 1}
              disabled={availableStock <= 0}
              className={`form-input${errors.quantity ? ' is-invalid' : ''}`}
              placeholder={availableStock > 0 ? `Nhập số lượng (1 - ${availableStock})...` : 'Không có tồn kho'}
              {...register('quantity', { valueAsNumber: true })}
            />
            {errors.quantity && <div className="form-error">{errors.quantity.message}</div>}
          </div>

          {/* Ghi chú */}
          <div className="form-group">
            <label className="form-label">Ghi chú điều chuyển</label>
            <input
              type="text"
              className={`form-input${errors.note ? ' is-invalid' : ''}`}
              placeholder="Lý do điều chuyển (tuỳ chọn)..."
              {...register('note')}
            />
            {errors.note && <div className="form-error">{errors.note.message}</div>}
          </div>

          {/* Live Transfer Flow Preview Banner */}
          {currentFromWarehouseId && destinationWarehouse && watchedQuantity > 0 && watchedQuantity <= availableStock && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '12px 16px',
                backgroundColor: 'var(--color-primary-light)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-primary-border)',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--color-text-main)' }}>
                <CheckCircleIcon size={16} style={{ color: 'var(--color-primary)' }} />
                <span>
                  Chuyển <strong>{watchedQuantity}</strong> {currentUnit} từ{' '}
                  <strong>{warehouses.find((w) => w.id === currentFromWarehouseId)?.name}</strong> sang{' '}
                  <strong>{destinationWarehouse.name}</strong>
                </span>
              </div>
              <span style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                Tồn sau chuyển: {availableStock - watchedQuantity} {currentUnit}
              </span>
            </div>
          )}

          {/* Zero stock alert */}
          {availableStock <= 0 && currentFromWarehouseId && (
            <div
              style={{
                gridColumn: '1 / -1',
                padding: '10px 14px',
                backgroundColor: 'var(--color-danger-light)',
                borderRadius: 'var(--radius-md)',
                fontSize: 12,
                color: 'var(--color-danger)',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <AlertTriangleIcon size={16} />
              Sản phẩm không có đủ tồn kho khả dụng (&gt; 0) tại kho nguồn đã chọn để điều chuyển.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ margin: '20px -20px -20px -20px', paddingTop: 16 }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isLoading}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={isLoading || availableStock <= 0 || !watchedToWarehouseId || destinationWarehouses.length === 0}
          >
            Xác nhận điều chuyển
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export function StockTransferModal(props) {
  if (!props.isOpen) return null;
  return (
    <StockTransferModalContent
      key={props.stockRecord?.id ? `row-${props.stockRecord.id}` : 'blank-transfer'}
      {...props}
    />
  );
}
