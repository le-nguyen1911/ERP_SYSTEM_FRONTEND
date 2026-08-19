
import { AlertCircleIcon, AlertTriangleIcon, CheckCircleIcon } from './Icons';

/**
 * Enterprise Alert Banner
 * Variants: danger, warning, success, info
 */
export function Alert({ children, title, variant = 'danger', className = '', onClose }) {
  const Icon =
    variant === 'danger'
      ? AlertCircleIcon
      : variant === 'warning'
      ? AlertTriangleIcon
      : variant === 'success'
      ? CheckCircleIcon
      : AlertCircleIcon;

  return (
    <div className={`alert alert-${variant} ${className}`.trim()} role="alert">
      <div className="alert-icon">
        <Icon size={20} />
      </div>
      <div className="alert-content">
        {title && <h4 className="alert-title">{title}</h4>}
        <div className="alert-message">{children}</div>
      </div>
      {onClose && (
        <button type="button" className="alert-close-btn" onClick={onClose} aria-label="Đóng">
          ×
        </button>
      )}
    </div>
  );
}
