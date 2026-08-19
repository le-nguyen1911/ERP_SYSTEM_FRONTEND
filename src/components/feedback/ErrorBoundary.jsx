import { Component } from 'react';
import { AlertTriangleIcon, RefreshCwIcon } from '../ui/Icons';
import { Button } from '../ui/Button';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-screen">
          <div className="error-boundary-card">
            <div className="error-boundary-icon">
              <AlertTriangleIcon size={48} />
            </div>
            <h2>Đã xảy ra sự cố không mong muốn</h2>
            <p className="text-muted">
              Hệ thống đã ghi nhận lỗi này. Vui lòng tải lại trang để tiếp tục làm việc.
            </p>
            <div className="error-boundary-actions">
              <Button
                variant="primary"
                icon={RefreshCwIcon}
                onClick={this.handleReload}
              >
                Tải lại trang
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
