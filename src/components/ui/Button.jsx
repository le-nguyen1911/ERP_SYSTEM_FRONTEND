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
  startIcon,
  onClick,
  ...props
}) {
  const baseStyles = 'btn';
  const variantClass = `btn-${variant}`;
  const sizeClass = size !== 'md' ? `btn-${size}` : '';

  const iconSize = size === 'sm' ? 14 : size === 'lg' ? 18 : 16;

  const renderIcon = () => {
    // startIcon được ưu tiên
    if (startIcon) {
      if (isValidElement(startIcon)) {
        return startIcon;
      }

      if (typeof startIcon === 'function') {
        const StartIcon = startIcon;

        return (
          <StartIcon
            size={iconSize}
            className="btn-icon"
          />
        );
      }
    }

    if (!Icon) {
      return null;
    }

    if (isValidElement(Icon)) {
      return Icon;
    }

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