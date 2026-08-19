

/**
 * Enterprise Button Component
 * Variants: primary, secondary, danger, outline, ghost
 * Sizes: sm, md, lg
 */
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

  return (
    <button
      type={type}
      className={`${baseStyles} ${variantClass} ${sizeClass} ${className}`.trim()}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <span className="spinner-inline" />
      ) : Icon ? (
        <Icon size={size === 'sm' ? 14 : 16} className="btn-icon" />
      ) : null}
      <span>{children}</span>
    </button>
  );
}
