

export function LoadingState({ message = 'Đang tải dữ liệu...', minHeight = 240 }) {
  return (
    <div className="state-container" style={{ minHeight }}>
      <div className="spinner-large" />
      <p className="state-message text-muted">{message}</p>
    </div>
  );
}

export function PageLoading() {
  return (
    <div className="page-loader">
      <div className="spinner-large" />
      <h3 className="page-loader-title">Đang khởi tạo hệ thống...</h3>
      <p className="page-loader-desc text-muted">Vui lòng đợi trong giây lát</p>
    </div>
  );
}
