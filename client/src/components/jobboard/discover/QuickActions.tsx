import React from 'react';
import {
  AiOutlineAppstore,
  AiOutlineUnorderedList,
  AiOutlineHeart,
  AiOutlineStar,
} from 'react-icons/ai';

interface QuickActionsProps {
  activeSection: 'all' | 'recommended' | 'saved';
  setActiveSection: (section: 'all' | 'recommended' | 'saved') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  resultCount: number;
}

const QuickActions: React.FC<QuickActionsProps> = ({
  activeSection,
  setActiveSection,
  viewMode,
  setViewMode,
  resultCount,
}) => {
  return (
    <div className="w-full">
      {/* Mobile & Tablet Layout - Up to lg breakpoint */}
      <div className="block lg:hidden">
        <div className="space-y-4">
          {/* Section Tabs - Full width on mobile/tablet */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg w-full">
            <button
              onClick={() => setActiveSection('all')}
              className={`flex-1 px-2 py-2 text-sm rounded transition-colors ${
                activeSection === 'all'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'hover:bg-background/50 text-muted-foreground'
              }`}
            >
              <span className="hidden sm:inline">All Jobs</span>
              <span className="sm:hidden">All</span>
            </button>
            <button
              onClick={() => setActiveSection('recommended')}
              className={`flex-1 px-2 py-2 text-sm rounded transition-colors flex items-center justify-center gap-1 ${
                activeSection === 'recommended'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'hover:bg-background/50 text-muted-foreground'
              }`}
            >
              <AiOutlineStar size={14} />
              <span className="hidden sm:inline">Recommended</span>
              <span className="sm:hidden">Rec</span>
            </button>
            <button
              onClick={() => setActiveSection('saved')}
              className={`flex-1 px-2 py-2 text-sm rounded transition-colors flex items-center justify-center gap-1 ${
                activeSection === 'saved'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'hover:bg-background/50 text-muted-foreground'
              }`}
            >
              <AiOutlineHeart size={14} />
              Saved
            </button>
          </div>

          {/* Bottom row - Results count and view toggle */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-medium">{resultCount}</span> jobs
            </p>

            {/* View Toggle */}
            <div className="flex items-center bg-muted p-1 rounded-lg">
              <button
                title="List View"
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <AiOutlineUnorderedList size={18} />
              </button>
              <button
                title="Grid View"
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                }`}
              >
                <AiOutlineAppstore size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout - lg breakpoint and above */}
      <div className="hidden lg:flex items-center justify-between">
        <div className="flex items-center gap-4 xl:gap-6">
          {/* Section Tabs */}
          <div className="flex gap-1 bg-muted p-1 rounded-lg">
            <button
              onClick={() => setActiveSection('all')}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeSection === 'all'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'hover:bg-background/50 text-muted-foreground'
              }`}
            >
              All Jobs
            </button>
            <button
              onClick={() => setActiveSection('recommended')}
              className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === 'recommended'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'hover:bg-background/50 text-muted-foreground'
              }`}
            >
              <AiOutlineStar size={14} />
              Recommended
            </button>
            <button
              onClick={() => setActiveSection('saved')}
              className={`px-4 py-2 text-sm rounded transition-colors flex items-center gap-2 ${
                activeSection === 'saved'
                  ? 'bg-background shadow-sm text-foreground'
                  : 'hover:bg-background/50 text-muted-foreground'
              }`}
            >
              <AiOutlineHeart size={14} />
              Saved
            </button>
          </div>

          <p className="text-muted-foreground">
            Showing <span className="font-medium">{resultCount}</span> jobs
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center bg-muted p-1 rounded-lg">
          <button
            title="List View"
            onClick={() => setViewMode('list')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'list'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <AiOutlineUnorderedList size={20} />
          </button>
          <button
            title="Grid View"
            onClick={() => setViewMode('grid')}
            className={`p-2 rounded transition-colors ${
              viewMode === 'grid'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            }`}
          >
            <AiOutlineAppstore size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActions;
