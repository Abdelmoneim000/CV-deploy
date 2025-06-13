import React from 'react';

interface TabButtonProps {
  id: 'discover' | 'post';
  label: string;
  icon: React.ReactNode;
  isActive: boolean;
  onClick: (id: 'discover' | 'post') => void;
}

const TabButton: React.FC<TabButtonProps> = ({
  id,
  label,
  icon,
  isActive,
  onClick,
}) => {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
};

export default TabButton;
