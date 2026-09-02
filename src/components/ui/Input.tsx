import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  hint,
  error,
  leftIcon,
  className = '',
  id,
  required,
  ...props
}) => {
  const inputId = id ?? `input-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      {label && (
        <label className="form-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="form-field__required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="form-field__wrapper">
        {leftIcon && <span className="form-field__icon">{leftIcon}</span>}
        <input
          id={inputId}
          className={`form-field__input ${leftIcon ? 'form-field__input--has-icon' : ''}`}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          required={required}
          {...props}
        />
      </div>
      {error && (
        <p className="form-field__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
      {hint && !error && (
        <p className="form-field__hint" id={`${inputId}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
};

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea: React.FC<TextareaProps> = ({
  label,
  hint,
  error,
  className = '',
  id,
  rows = 3,
  required,
  ...props
}) => {
  const inputId = id ?? `textarea-${Math.random().toString(36).slice(2, 9)}`;

  return (
    <div className={`form-field ${error ? 'form-field--error' : ''} ${className}`}>
      {label && (
        <label className="form-field__label" htmlFor={inputId}>
          {label}
          {required && <span className="form-field__required" aria-hidden="true">*</span>}
        </label>
      )}
      <textarea
        id={inputId}
        className="form-field__textarea"
        rows={rows}
        aria-invalid={!!error}
        aria-describedby={error ? `${inputId}-error` : undefined}
        required={required}
        {...props}
      />
      {error && (
        <p className="form-field__error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
      {hint && !error && <p className="form-field__hint">{hint}</p>}
    </div>
  );
};
