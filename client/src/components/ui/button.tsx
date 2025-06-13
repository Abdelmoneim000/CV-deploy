import * as React from 'react';
import { Loader2 } from 'lucide-react';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      inline-flex items-center justify-center gap-2
      whitespace-nowrap rounded-md text-sm font-medium
      transition-colors focus:outline-none focus:ring-2
      focus:ring-ring focus:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50 cursor-pointer
    `;

    const variantClasses = {
      default: 'bg-primary text-primary-foreground hover:bg-primary/90',
      destructive:
        'bg-destructive text-destructive-foreground hover:bg-destructive/90',
      outline:
        'border border-border bg-transparent text-foreground hover:bg-muted',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      ghost: 'bg-transparent text-foreground hover:bg-muted',
      link: 'text-primary underline-offset-4 hover:underline',
    };

    const sizeClasses = {
      default: 'h-10 px-4 py-2',
      sm: 'h-9 px-3',
      lg: 'h-11 px-8',
      icon: 'h-10 w-10',
    };

    const getSpinnerSize = () => {
      switch (size) {
        case 'sm':
          return 'w-3 h-3';
        case 'lg':
          return 'w-5 h-5';
        case 'icon':
          return 'w-4 h-4';
        default:
          return 'w-4 h-4';
      }
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        className={`
          ${baseStyles}
          ${variantClasses[variant]}
          ${sizeClasses[size]}
          ${className || ''}
        `}
        disabled={isDisabled}
        {...props}
      >
        {loading && <Loader2 className={`${getSpinnerSize()} animate-spin`} />}
        {loading ? loadingText || children : children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
