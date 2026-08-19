
import { useToastStore } from '../../stores/useToastStore';
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon, XIcon } from '../ui/Icons';

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircleIcon
            : toast.type === 'error'
            ? AlertCircleIcon
            : toast.type === 'warning'
            ? AlertTriangleIcon
            : AlertCircleIcon;

        return (
          <div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            role="alert"
          >
            <div className="toast-icon">
              <Icon size={18} />
            </div>
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              type="button"
              className="toast-close"
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng"
            >
              <XIcon size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
