import React from 'react';
import {
  AiOutlinePlus,
  AiOutlineMessage,
  AiOutlineQuestionCircle,
} from 'react-icons/ai';

const FloatingActions: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3">
      {/* Help Button */}
      <button className="p-3 bg-muted text-muted-foreground rounded-full shadow-lg hover:bg-card hover:text-foreground transition-colors">
        <AiOutlineQuestionCircle size={20} />
      </button>

      {/* Messages Button */}
      <button className="p-3 bg-muted text-muted-foreground rounded-full shadow-lg hover:bg-card hover:text-foreground transition-colors">
        <AiOutlineMessage size={20} />
      </button>

      {/* Quick Post Button */}
      <button className="p-4 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-colors">
        <AiOutlinePlus size={24} />
      </button>
    </div>
  );
};

export default FloatingActions;
