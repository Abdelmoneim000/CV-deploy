import { useState, useRef, useEffect } from 'react';
import { useCvContext } from '../../../context/CvContext';
import EditableDiv from '../../ui/EditableDiv';
import { FiSettings } from 'react-icons/fi';
import { IoMdAdd, IoMdClose } from 'react-icons/io';

interface CvLanguagesProps {
  showDivider?: boolean;
  dividerWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  layout?: 'list' | 'grid';
  editable?: boolean;
}

const MAX_PROFICIENCY = 5;

const CvLanguages = ({
  showDivider = false,
  dividerWidth = 3,
  textAlign = 'left',
  layout = 'list',
  editable = true,
}: CvLanguagesProps) => {
  const { cvData, updateSection, updateSectionEntries } = useCvContext();
  const [showToolkit, setShowToolkit] = useState(false);
  const [viewStyle, setViewStyle] = useState<'bullets' | 'progress' | 'dashed'>(
    'bullets'
  );
  const [layoutStyle, setLayoutStyle] = useState<'list' | 'grid'>(layout);

  const toolkitRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);

  const section = cvData?.data?.sections.find((s) => s.id === 'languages');
  const TITLE_PLACEHOLDER = 'Languages';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        toolkitRef.current &&
        !toolkitRef.current.contains(e.target as Node) &&
        !gearRef.current?.contains(e.target as Node)
      ) {
        setShowToolkit(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!section || !Array.isArray(section.entries)) return null;
  const { id, name, entries } = section;

  const handleTitleChange = (newName: string) => {
    if (!editable) return; // Prevent changes if not editable
    updateSection(id, newName || TITLE_PLACEHOLDER);
  };

  const handleEntryChange = (
    index: number,
    key: 'name' | 'proficiency',
    value: string
  ) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.map((entry, i) =>
      i === index ? { ...(entry || {}), [key]: value } : entry
    );
    updateSectionEntries(id, updated);
  };

  const handleProficiencyChange = (index: number, level: number) => {
    if (!editable) return; // Prevent changes if not editable
    handleEntryChange(index, 'proficiency', String(level));
  };

  const handleAddEntry = () => {
    if (!editable) return; // Prevent changes if not editable
    const newEntry = { name: '', proficiency: '0' };
    updateSectionEntries(id, [...entries, newEntry]);
  };

  const handleRemoveEntry = (index: number) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.filter((_, i) => i !== index);
    updateSectionEntries(id, updated);
  };

  const renderProficiency = (level: number, index: number) => {
    // For bullets and dashed styles, render clickable elements only when editable
    switch (viewStyle) {
      case 'bullets':
        return (
          <div className="flex gap-1 mt-1">
            {Array.from({ length: MAX_PROFICIENCY }).map((_, i) => (
              <div
                key={i}
                onClick={() =>
                  editable && handleProficiencyChange(index, i + 1)
                }
                className={`w-3 h-3 rounded-full ${
                  editable ? 'cursor-pointer' : ''
                } transition-colors ${
                  i < level ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        );

      case 'progress':
        return (
          <div
            className={`w-full h-2 bg-gray-300 rounded mt-1 relative ${
              editable ? 'cursor-pointer' : ''
            }`}
            onClick={(e) => {
              if (!editable) return;
              const rect = (
                e.currentTarget as HTMLDivElement
              ).getBoundingClientRect();
              const clickX = e.clientX - rect.left;
              const newLevel = Math.ceil(
                (clickX / rect.width) * MAX_PROFICIENCY
              );
              handleProficiencyChange(
                index,
                Math.min(newLevel, MAX_PROFICIENCY)
              );
            }}
          >
            <div
              className="h-full bg-blue-500 rounded"
              style={{ width: `${(level / MAX_PROFICIENCY) * 100}%` }}
            />
          </div>
        );

      case 'dashed':
        return (
          <div className="flex gap-1 mt-1">
            {Array.from({ length: MAX_PROFICIENCY }).map((_, i) => (
              <div
                key={i}
                onClick={() =>
                  editable && handleProficiencyChange(index, i + 1)
                }
                className={`w-5 h-1 ${editable ? 'cursor-pointer' : ''} ${
                  i < level ? 'bg-blue-500' : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <section className="w-full relative group">
      {/* Gear Icon - Only show when editable */}
      {editable && (
        <button
          ref={gearRef}
          onClick={() => setShowToolkit((prev) => !prev)}
          className="absolute top-0 right-0 text-gray-500 hover:text-gray-800 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
        >
          <FiSettings size={18} />
        </button>
      )}

      {/* Toolkit - Only show when editable and showToolkit is true */}
      {editable && showToolkit && (
        <div
          ref={toolkitRef}
          className="absolute top-0 right-4 z-10 bg-white border border-gray-200 shadow-xl rounded-lg px-4 py-3 w-72 space-y-4 text-sm animate-fade-in"
        >
          <div className="font-semibold text-gray-700 flex items-center gap-2">
            <FiSettings /> Languages Settings
          </div>

          <div>
            <div className="text-gray-600 mb-1">Proficiency Style</div>
            <div className="grid grid-cols-3 gap-2">
              {(['bullets', 'progress', 'dashed'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => setViewStyle(style)}
                  className={`text-xs px-2 py-1 rounded border transition-colors capitalize ${
                    viewStyle === style
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-gray-600 mb-1">Layout Style</div>
            <div className="flex gap-2">
              {(['list', 'grid'] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => setLayoutStyle(layout)}
                  className={`text-xs px-2 py-1 rounded border transition-colors capitalize ${
                    layoutStyle === layout
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                  }`}
                >
                  {layout}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Title */}
      <EditableDiv
        value={name}
        placeholder={TITLE_PLACEHOLDER}
        className={`text-xl font-semibold mb-3 outline-none`}
        style={{
          borderBottomWidth: showDivider ? dividerWidth : 0,
          textAlign: textAlign,
        }}
        onChange={handleTitleChange}
        editable={editable}
      />

      {/* List/Grid entries */}
      <ul
        className={`${
          layoutStyle === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'
            : 'flex flex-col space-y-4'
        }`}
      >
        {entries.map((entry, index) => {
          const proficiencyValue =
            typeof entry.proficiency === 'string' ? entry.proficiency : '0';
          const level = parseInt(proficiencyValue);

          return (
            <li key={index} className="flex items-center justify-between group">
              <div className="flex flex-col w-full">
                <EditableDiv
                  value={
                    typeof entry.name === 'string'
                      ? entry.name
                      : Array.isArray(entry.name)
                      ? entry.name.join(', ')
                      : entry.name && typeof entry.name === 'object'
                      ? JSON.stringify(entry.name)
                      : ''
                  }
                  placeholder="Language Name"
                  className="text-sm font-medium outline-none bg-transparent"
                  onChange={(val) => handleEntryChange(index, 'name', val)}
                  editable={editable}
                />
                {renderProficiency(level, index)}
              </div>

              {/* Hover Remove - Only show when editable */}
              {editable && (
                <button
                  onClick={() => handleRemoveEntry(index)}
                  className="text-red-500 hover:text-red-700 transition-opacity opacity-0 group-hover:opacity-100 ml-2 cursor-pointer"
                >
                  <IoMdClose size={16} />
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Hover Add - Only show when editable */}
      {editable && (
        <button
          onClick={handleAddEntry}
          className="mt-3 flex items-center gap-1 text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer"
        >
          <IoMdAdd />
          Add Language
        </button>
      )}
    </section>
  );
};

export default CvLanguages;
