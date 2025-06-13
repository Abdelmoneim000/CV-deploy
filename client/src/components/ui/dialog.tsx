import { type ReactNode, useEffect, useRef } from 'react';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
  overlayClassName?: string;
}

const Dialog = ({
  isOpen,
  onClose,
  title,
  children,
  actions,
  className = '',
  overlayClassName = 'fixed inset-0 bg-black/30 backdrop-blur-sm',
}: DialogProps) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      lastActiveElement.current = document.activeElement as HTMLElement;
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      lastActiveElement.current?.focus();
    };
  }, [isOpen, onClose]);

  // Trap focus inside dialog
  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const focusableElements = dialogRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );

      if (focusableElements.length > 0) {
        (focusableElements[0] as HTMLElement).focus();
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="dialog-title"
      className="fixed inset-0 z-50 overflow-y-auto"
    >
      {/* Overlay */}
      <div
        className={overlayClassName}
        onClick={(e) => e.target === e.currentTarget && onClose()}
      />

      {/* Dialog content */}
      <div className="flex items-center justify-center min-h-screen">
        <div
          ref={dialogRef}
          className={`relative bg-white rounded-lg p-6 mx-4 shadow-xl transform transition-all ${className}`}
          style={{
            maxWidth: 'calc(100% - 2rem)',
            width: '500px',
          }}
        >
          {/* Title */}
          <h2 id="dialog-title" className="text-xl font-semibold mb-4">
            {title}
          </h2>

          {/* Content */}
          <div className="mb-6">{children}</div>

          {/* Actions */}
          {actions && <div className="flex justify-end gap-3">{actions}</div>}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
