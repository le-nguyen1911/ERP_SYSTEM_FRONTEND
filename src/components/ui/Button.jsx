import { isValidElement } from 'react';


export function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  icon: Icon,
  onClick,
  ...props
}) {
  const baseStyles = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  /**
   * Render icon safely.
   *
   * Supports:
   * icon={RefreshCwIcon}
   * icon={<RefreshCwIcon />}
   */
  const renderIcon = () => {
    if (!Icon) {
      return null;
    }

    // Case 1:
    // icon={<RefreshCwIcon />}
    if (isValidElement(Icon)) {
      return Icon;
    }

    // Case 2:
    // icon={RefreshCwIcon}
    if (typeof Icon === 'function') {
      return (
        <Icon
          size={iconSize}
          className="btn-icon"
        />
      );
    }

    return null;
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span
          className="spinner-inline"
          aria-hidden="true"
        />
      ) : (
        renderIcon()
      )}

      <span>{children}</span>
    </button>
  );
}