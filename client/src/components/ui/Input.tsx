import React, { forwardRef } from 'react';
import clsx from 'clsx';
import {
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
} from 'react-icons/ai';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string | React.ReactNode;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconClick?: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  inputSize?: 'sm' | 'md' | 'lg';
  isValid?: boolean;
  showValidation?: boolean;
  loading?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      onRightIconClick,
      variant = 'default',
      inputSize = 'md',
      disabled,
      isValid = false,
      showValidation = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const sizeClasses = {
      sm: 'px-2 py-1.5 text-sm',
      md: 'px-3 py-3 text-sm',
      lg: 'px-4 py-4 text-base',
    };

    const variantClasses = {
      default: 'border border-border bg-background',
      outline: 'border border-border bg-transparent',
      ghost: 'border-transparent bg-muted',
    };

    // Memoize validation icon to prevent unnecessary re-renders
    const getValidationIcon = React.useMemo(() => {
      if (loading) {
        return (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        );
      }
      if (error) {
        return (
          <AiOutlineExclamationCircle className="text-destructive" size={16} />
        );
      }
      if (isValid && showValidation && props.value) {
        return <AiOutlineCheckCircle className="text-green-600" size={16} />;
      }
      return null;
    }, [loading, error, isValid, showValidation, props.value]);

    const hasValidationIcon = getValidationIcon && !rightIcon;

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-foreground mb-1">
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <div className="text-muted-foreground">{leftIcon}</div>
            </div>
          )}
          <input
            type={type}
            className={clsx(
              'flex w-full rounded-md transition-all duration-200',
              'placeholder:text-muted-foreground/60',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'disabled:cursor-not-allowed disabled:opacity-50',
              sizeClasses[inputSize],
              variantClasses[variant],
              leftIcon && 'pl-10',
              (rightIcon || hasValidationIcon) && 'pr-10',
              // Dynamic border colors based on state
              error
                ? 'border-destructive focus:ring-destructive/20 bg-destructive/5'
                : isValid && showValidation && props.value
                ? 'border-green-500 focus:ring-green-500/20 bg-green-50/50'
                : 'text-foreground focus:ring-ring hover:border-ring/50',
              loading && 'opacity-75',
              className
            )}
            ref={ref}
            disabled={disabled || loading}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error
                ? `${props.name}-error`
                : helperText
                ? `${props.name}-helper`
                : undefined
            }
            {...props}
          />
          {(rightIcon || hasValidationIcon) && (
            <div
              className={clsx(
                'absolute inset-y-0 right-0 pr-3 flex items-center',
                onRightIconClick
                  ? 'cursor-pointer text-muted-foreground hover:text-foreground transition-colors'
                  : 'pointer-events-none'
              )}
              onClick={onRightIconClick}
            >
              {rightIcon || getValidationIcon}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${props.name}-error`}
            className="mt-1 text-xs text-destructive flex items-center gap-1 animate-in slide-in-from-top-1 duration-200"
          >
            <AiOutlineExclamationCircle size={12} />
            {error}
          </p>
        )}

        {/* Helper Text */}
        {helperText && !error && (
          <div
            id={`${props.name}-helper`}
            className="mt-1 text-xs animate-in slide-in-from-top-1 duration-200"
          >
            {helperText}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
