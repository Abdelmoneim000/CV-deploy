import { useRef, useEffect } from 'react';

const PLACEHOLDER_STYLE = 'opacity: 0.5; pointer-events: none;';

const isPlaceholder = (el: HTMLElement | null, placeholder: string) =>
  el?.innerText.trim() === placeholder &&
  el?.querySelector('span')?.style.opacity === '0.5';

const applyPlaceholder = (
  ref: React.RefObject<HTMLDivElement | null>,
  value: string | undefined,
  placeholder: string
) => {
  if (!ref.current) return;
  // Fix: Add null check before calling trim()
  if (!value || value.trim() === '') {
    ref.current.innerHTML = `<span style="${PLACEHOLDER_STYLE}">${placeholder}</span>`;
  } else {
    ref.current.innerText = value;
  }
};

interface EditableDivProps {
  value: string;
  placeholder: string;
  className?: string;
  onChange: (value: string) => void;
  style?: React.CSSProperties;
  editable?: boolean;
}

const EditableDiv = ({
  value,
  placeholder,
  className = '',
  onChange,
  style,
  editable = true, // Default to true for backward compatibility
}: EditableDivProps) => {
  const divRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    applyPlaceholder(divRef, value, placeholder);
  }, [value, placeholder]);

  const handleFocus = () => {
    if (editable && isPlaceholder(divRef.current, placeholder)) {
      divRef.current!.innerText = '';
    }
  };

  const handleBlur = () => {
    if (!editable) return;

    const newValue = divRef.current?.innerText.trim() || '';
    if (newValue === '') {
      applyPlaceholder(divRef, '', placeholder);
    }
    onChange(newValue);
  };

  return (
    <div
      ref={divRef}
      contentEditable={editable}
      suppressContentEditableWarning
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={className}
      style={{
        ...style,
        cursor: editable ? 'text' : 'default',
        userSelect: editable ? 'text' : 'none',
      }}
    />
  );
};

export default EditableDiv;
