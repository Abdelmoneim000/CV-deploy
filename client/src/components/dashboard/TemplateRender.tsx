import { useCvContext } from '../../context/CvContext';
import { patterns } from '@/lib/patterns';

/* CV Templates */
import ClassicTemplate from './templates/ClassicTemplate';
import IvyTemplate from './templates/IvyTemplate';
import SingleTemplate from './templates/SingleTemplate';

interface TemplateRenderProps {
  setIsPanelOpen: (isOpen: boolean) => void;
  editable?: boolean; // Add editable prop
}

const TemplateRender: React.FC<TemplateRenderProps> = ({
  setIsPanelOpen,
  editable = true, // Default to true for backward compatibility
}) => {
  const { cvData } = useCvContext();

  // Use optional chaining and provide default values
  const theme = cvData?.data?.theme || {};
  const templateName = theme?.templateName || 'classic';

  const renderTemplate = () => {
    switch (templateName) {
      case 'classic':
        return <ClassicTemplate editable={editable} />;
      case 'single':
        return <SingleTemplate editable={editable} />;
      case 'ivyleague':
        return <IvyTemplate editable={editable} />;
      default:
        return <ClassicTemplate editable={editable} />;
    }
  };

  return (
    <div
      className="ml-12 overflow-y-auto overflow-x-hidden bg-white"
      style={{
        fontFamily: theme?.fontFamily || 'Arial',
        fontSize: theme?.fontSize || '12px',
        backgroundColor: theme?.bgColor || '#FFFFFF',
        color: theme?.textColor || '#000000',
        padding: theme?.pageMargin || '0.5in',
        position: 'relative', // Ensure pattern can be absolutely positioned
      }}
      onClick={() => setIsPanelOpen(false)}
    >
      {/* Render pattern as background if selected */}
      {theme?.pattern && theme.pattern !== 'none' && (
        <div
          className="absolute inset-0 pointer-events-none z-0"
          aria-hidden="true"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            opacity: 0.25,
            zIndex: 0,
          }}
        >
          {patterns.find((p) => p.id === theme.pattern)?.svg}
        </div>
      )}
      <div className="relative z-10">{renderTemplate()}</div>
    </div>
  );
};

export default TemplateRender;
