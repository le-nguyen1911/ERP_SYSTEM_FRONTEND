

/**
 * Enterprise Status Badge
 * Variants: primary, success, warning, danger, info, neutral
 */
export function Badge({ children, variant = 'neutral', size = 'sm', className = '', ...props }) {
  return (
    <span className={`badge badge-${variant} badge-${size} ${className}`.trim()} {...props}>
      {children}
    </span>
  );
}
