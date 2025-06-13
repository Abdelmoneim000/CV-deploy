import { useCvContext } from '../../../context/CvContext';
import EditableDiv from '../../ui/EditableDiv';

interface CvSummaryProps {
  showDivider?: boolean;
  dividerWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  editable?: boolean;
}

const CvSummary = ({
  showDivider = false,
  dividerWidth = 3,
  textAlign = 'left',
  editable = true,
}: CvSummaryProps) => {
  const { cvData, updateSection, updateSectionEntries } = useCvContext();

  const summarySection = cvData?.data?.sections.find(
    (section) => section.id === 'summary'
  );

  const TITLE_PLACEHOLDER = 'Summary';
  const TEXT_PLACEHOLDER = 'Write a brief summary about yourself...';

  if (!summarySection) return null;

  const { id, name, entries } = summarySection;
  const summaryText = entries.length > 0 ? entries[0].summary : '';

  const handleTitleChange = (newTitle: string) => {
    updateSection(id, newTitle || TITLE_PLACEHOLDER);
  };

  const handleSummaryChange = (newText: string) => {
    updateSectionEntries(id, [{ summary: newText }]);
  };

  return (
    <section className="w-full">
      <EditableDiv
        value={name}
        placeholder={TITLE_PLACEHOLDER}
        className={`text-xl font-semibold mb-2 outline-none`}
        style={{
          borderBottomWidth: showDivider ? dividerWidth : 0,
          textAlign: textAlign,
        }}
        onChange={handleTitleChange}
        editable={editable}
      />
      <EditableDiv
        value={summaryText}
        placeholder={TEXT_PLACEHOLDER}
        className="text-sm text-gray-800 outline-none"
        onChange={handleSummaryChange}
        editable={editable}
      />
    </section>
  );
};

export default CvSummary;
