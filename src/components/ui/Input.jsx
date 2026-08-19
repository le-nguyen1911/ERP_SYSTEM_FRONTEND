import { forwardRef, useState } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons';

/**
 * Enterprise Form Input with Error Message and Password Reveal
 */
export const Input = forwardRef(function Input(
  {
    label,
    name,
    type = 'text',
    error,
    helperText,
    icon: Icon,
    required = false,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`form-group ${containerClassName}`.trim()}>
      {label && (
        <label htmlFor={name} className="form-label">
          {label} {required && <span className="text-danger">*</span>}
        </label>
      )}

      <div className="input-wrapper">
        {Icon && <Icon size={16} className="input-icon-left" />}

        <input
          ref={ref}
          id={name}
          name={name}
          type={inputType}
          className={`form-input ${Icon ? 'has-icon-left' : ''} ${
            isPassword ? 'has-icon-right' : ''
          } ${error ? 'is-invalid' : ''} ${className}`.trim()}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            className="input-icon-right-btn"
            onClick={() => setShowPassword(!showPassword)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiển thị mật khẩu'}
          >
            {showPassword ? <EyeOffIcon size={16} /> : <EyeIcon size={16} />}
          </button>
        )}
      </div>

      {error && <p className="form-error">{error}</p>}
      {!error && helperText && <p className="form-helper">{helperText}</p>}
    </div>
  );
});
