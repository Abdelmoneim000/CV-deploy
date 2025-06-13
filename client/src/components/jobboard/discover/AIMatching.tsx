import React from 'react';
import {
  AiOutlineRobot,
  AiOutlineStar,
  AiOutlineArrowRight,
} from 'react-icons/ai';

const AIMatching: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-lg">
          <AiOutlineRobot className="text-primary text-xl" />
        </div>
        <div>
          <h3 className="font-semibold">AI-Powered Job Matching</h3>
          <p className="text-sm text-muted-foreground">
            Get personalized job recommendations based on your profile
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">95%</div>
          <div className="text-sm text-muted-foreground">Match Accuracy</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">2.5x</div>
          <div className="text-sm text-muted-foreground">
            Higher Success Rate
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">50%</div>
          <div className="text-sm text-muted-foreground">Time Saved</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <AiOutlineStar className="text-yellow-500" />
          <span>Complete your profile to unlock AI matching</span>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
          Enable AI Matching
          <AiOutlineArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default AIMatching;
