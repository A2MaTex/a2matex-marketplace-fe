import { useState, useId } from "react";
import styles from "./Input.module.css";

/**
 * Custom Input component
 *
 * @param {string}           label        - Label text above the input
 * @param {string}           hint         - Helper text shown top-right of label
 * @param {React.ReactNode}  leftIcon     - Icon rendered inside left side
 * @param {React.ReactNode}  rightIcon    - Static icon on right (overridden when type="password")
 * @param {string}           error        - Error message shown below input
 * @param {"sm"|"md"|"lg"}   size
 * @param {boolean}          fullWidth
 */
const EyeOpenIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M1 12S5 5 12 5s11 7 11 7-4 7-11 7S1 12 1 12z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const EyeClosedIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

const Input = ({
  label,
  hint,
  leftIcon,
  rightIcon,
  error,
  size = "md",
  fullWidth = true,
  type = "text",
  id: idProp,
  className = "",
  disabled = false,
  ...rest
}) => {
  const generatedId = useId();
  const id = idProp || generatedId;

  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  const wrapperClasses = [
    styles.wrapper,
    fullWidth ? styles.fullWidth : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const fieldClasses = [
    styles.field,
    styles[size],
    error ? styles.hasError : "",
    disabled ? styles.disabled : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapperClasses}>
      {(label || hint) && (
        <div className={styles.labelRow}>
          {label && (
            <label htmlFor={id} className={styles.label}>
              {label}
            </label>
          )}
          {hint && <span className={styles.hint}>{hint}</span>}
        </div>
      )}

      <div className={fieldClasses}>
        {leftIcon && (
          <span className={styles.leftIcon} aria-hidden="true">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          type={inputType}
          disabled={disabled}
          className={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />

        {isPassword ? (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            tabIndex={-1}
          >
            {showPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
          </button>
        ) : (
          rightIcon && (
            <span className={styles.rightIcon} aria-hidden="true">
              {rightIcon}
            </span>
          )
        )}
      </div>

      {error && (
        <span id={`${id}-error`} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
