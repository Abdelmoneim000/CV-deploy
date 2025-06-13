import React, { forwardRef } from 'react';
import clsx from 'clsx';
import {
  AiOutlineCheckCircle,
  AiOutlineExclamationCircle,
  AiOutlineInfoCircle,
} from 'react-icons/ai';

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  title?: string;
  subtitle?: string;
  error?: string;
  success?: string;
  info?: string;
  spacing?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Form = forwardRef<HTMLFormElement, FormProps>(
  (
    {
      className,
      title,
      subtitle,
      error,
      success,
      info,
      spacing = 'md',
      isLoading = false,
      children,
      ...props
    },
    ref
  ) => {
    const spacingClasses = {
      sm: 'space-y-3',
      md: 'space-y-4',
      lg: 'space-y-6',
    };

    return (
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        {(title || subtitle) && (
          <div className="text-center mb-8">
            {title && (
              <h2 className="text-3xl font-bold text-foreground">{title}</h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
            )}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md text-sm mb-6 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <AiOutlineCheckCircle size={16} className="flex-shrink-0" />
            {success}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm mb-6 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <AiOutlineExclamationCircle size={16} className="flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Info Message */}
        {info && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-md text-sm mb-6 flex items-center gap-2 animate-in slide-in-from-top-2 duration-300">
            <AiOutlineInfoCircle size={16} className="flex-shrink-0" />
            {info}
          </div>
        )}

        {/* Form */}
        <form
          ref={ref}
          className={clsx(
            'w-full',
            spacingClasses[spacing],
            isLoading && 'opacity-75 pointer-events-none',
            className
          )}
          {...props}
        >
          {children}
        </form>
      </div>
    );
  }
);

Form.displayName = 'Form';

// Enhanced Form field wrapper
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
  error?: boolean;
}

export const FormField = ({ children, className, error }: FormFieldProps) => {
  return (
    <div
      className={clsx(
        'w-full transition-all duration-200',
        error && 'animate-pulse',
        className
      )}
    >
      {children}
    </div>
  );
};

// Enhanced Form actions wrapper
interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export const FormActions = ({
  children,
  className,
  align = 'left',
}: FormActionsProps) => {
  const alignClasses = {
    left: 'justify-start',
    center: 'justify-center',
    right: 'justify-end',
  };

  return (
    <div className={clsx('w-full flex gap-3', alignClasses[align], className)}>
      {children}
    </div>
  );
};

export default Form;
