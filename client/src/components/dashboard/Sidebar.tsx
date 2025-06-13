import {
  FiPlus,
  FiList,
  FiLayout,
  FiEdit,
  FiActivity,
  FiBriefcase,
  FiGlobe,
  FiDownload,
  FiShare2,
  FiClock,
  FiStar,
} from 'react-icons/fi';

interface SidebarProps {
  currentPanel: string;
  setCurrentPanel: (panel: string) => void;
  isPanelOpen: boolean;
  setIsPanelOpen: (isOpen: boolean) => void;
}

const menuItems = [
  { key: 'add-section', label: 'Add a section', icon: <FiPlus /> },
  { key: 'reorganize', label: 'Reorganize', icon: <FiList /> },
  { key: 'models', label: 'Templates', icon: <FiStar /> },
  { key: 'design', label: 'Design', icon: <FiLayout /> },
  { key: 'revise-text', label: 'Revise Text', icon: <FiEdit /> },
  { key: 'analysis-score', label: 'Analysis & Score', icon: <FiActivity /> },
  { key: 'adapt-job', label: 'Adapt for Job', icon: <FiBriefcase /> },
  { key: 'translate', label: 'Translate CV', icon: <FiGlobe /> },
  { key: 'download', label: 'Download', icon: <FiDownload /> },
  { key: 'share', label: 'Share', icon: <FiShare2 /> },
  { key: 'history', label: 'History', icon: <FiClock /> },
];

const Sidebar: React.FC<SidebarProps> = ({
  currentPanel,
  setCurrentPanel,
  isPanelOpen,
  setIsPanelOpen,
}) => {
  const handlePanelToggle = (key: string) => {
    if (currentPanel === key) {
      // If clicking the same panel, toggle it closed
      setIsPanelOpen(!isPanelOpen);
    } else {
      // Open and switch to new panel
      setCurrentPanel(key);
      if (!isPanelOpen) setIsPanelOpen(true);
    }
  };

  return (
    <div className="w-60 shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-y-auto">
      {/* Logo/Header Section */}
      <div className="p-6 pb-4 flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">CV Builder Pro</h2>

        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          className="text-primary cursor-pointer hover:text-primary/80 transition-all duration-200"
        >
          {isPanelOpen ? (
            <FiList className="text-2xl" />
          ) : (
            <FiLayout className="text-2xl" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 px-3 py-2 space-y-1">
        {menuItems.map((item, idx) => (
          <div key={item.key}>
            <button
              onClick={() => handlePanelToggle(item.key)}
              className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 flex items-center cursor-pointer
                ${
                  currentPanel === item.key && isPanelOpen
                    ? 'bg-primary-foreground text-primary ring-2 ring-primary'
                    : 'text-gray-600 hover:bg-primary-foreground hover:text-gray-900'
                }`}
            >
              <span
                className={`text-lg mr-3 ${
                  currentPanel === item.key && isPanelOpen
                    ? 'text-primary'
                    : 'text-gray-400'
                }`}
              >
                {item.icon}
              </span>
              {item.label}
            </button>

            {(idx + 1) % 4 === 0 && idx !== menuItems.length - 1 && (
              <div className="border-t border-gray-200 my-3 mx-4" />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500">Powered by AI • v2.4.1</div>
      </div>
    </div>
  );
};

export default Sidebar;
