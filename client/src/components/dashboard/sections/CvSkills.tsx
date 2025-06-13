import { useState, useRef, useEffect } from 'react';
import { useCvContext } from '../../../context/CvContext';
import EditableDiv from '../../ui/EditableDiv';
import { IoMdAdd, IoMdClose } from 'react-icons/io';
import { FiSettings } from 'react-icons/fi';

interface CvSkillsProps {
  showDivider?: boolean;
  dividerWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  editable?: boolean; // Add editable prop
}

const CvSkills = ({
  showDivider = false,
  dividerWidth = 3,
  textAlign = 'left',
  editable = true, // Default to true for backward compatibility
}: CvSkillsProps) => {
  const {
    cvData,
    updateSection,
    updateSectionEntries,
    updateSectionVisibility,
  } = useCvContext();
  const [showToolkit, setShowToolkit] = useState(false);

  const toolkitRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);

  const section = cvData?.data?.sections.find((s) => s.id === 'skills');
  const TITLE_PLACEHOLDER = 'Skills';

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
  const { id, name, entries, visibility = {} } = section;

  // If the section is not visible and we're not showing the toolkit, don't render
  if (visibility.section === false && !showToolkit) {
    return null;
  }

  const handleTitleChange = (newName: string) => {
    if (!editable) return; // Prevent changes if not editable
    updateSection(id, newName || TITLE_PLACEHOLDER);
  };

  const handleEntryTitleChange = (index: number, newTitle: string) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, title: newTitle } : entry
    );
    updateSectionEntries(id, updated);
  };

  const handleSkillChange = (
    entryIndex: number,
    skillIndex: number,
    newSkill: string
  ) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.map((entry, i) => {
      if (i !== entryIndex) return entry;
      const skillsArray = Array.isArray(entry.skills) ? entry.skills : [];
      const updatedSkills = [...skillsArray];
      updatedSkills[skillIndex] = newSkill;
      return { ...entry, skills: updatedSkills };
    });
    updateSectionEntries(id, updated);
  };

  const handleAddCategory = () => {
    if (!editable) return; // Prevent changes if not editable
    const newEntry = { title: '', skills: [] };
    updateSectionEntries(id, [...entries, newEntry]);
  };

  const handleRemoveCategory = (index: number) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.filter((_, i) => i !== index);
    updateSectionEntries(id, updated);
  };

  const handleAddSkill = (entryIndex: number) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.map((entry, i) =>
      i === entryIndex
        ? {
            ...entry,
            skills: [...(Array.isArray(entry.skills) ? entry.skills : []), ''],
          }
        : entry
    );
    updateSectionEntries(id, updated);
  };

  const handleRemoveSkill = (entryIndex: number, skillIndex: number) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.map((entry, i) => {
      if (i !== entryIndex) return entry;
      const skillsArray = Array.isArray(entry.skills) ? entry.skills : [];
      const updatedSkills = skillsArray.filter((_, si) => si !== skillIndex);
      return { ...entry, skills: updatedSkills };
    });
    updateSectionEntries(id, updated);
  };

  const toggleVisibility = (field: string) => {
    if (!editable) return; // Prevent changes if not editable
    const newVisibility = {
      ...visibility,
      [field]: !visibility[field],
    };
    updateSectionVisibility(id, newVisibility);
  };

  // Get field visibility value with default to true if not explicitly set
  const isVisible = (field: string) => {
    return visibility[field] !== false; // Default to true if not set
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
            <FiSettings /> Skills Settings
          </div>

          {/* Visibility Controls */}
          <div className="space-y-2">
            {/* Field Visibility Controls */}
            {['categories'].map((field) => (
              <div key={field} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {field}
                </span>
                <button
                  onClick={() => toggleVisibility(field)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                    isVisible(field)
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {isVisible(field) ? 'Visible' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Title */}
      <EditableDiv
        value={name}
        placeholder={TITLE_PLACEHOLDER}
        className="text-xl font-semibold mb-3 outline-none"
        style={{
          borderBottomWidth: showDivider ? dividerWidth : 0,
          textAlign: textAlign,
        }}
        onChange={handleTitleChange}
        editable={editable}
      />

      {/* Skill Categories */}
      <div className="space-y-6">
        {entries.map((entry, entryIndex) => (
          <div key={entryIndex} className="group flex flex-col gap-2">
            {isVisible('categories') && (
              <div className="flex items-center justify-between">
                <EditableDiv
                  value={typeof entry.title === 'string' ? entry.title : ''}
                  placeholder="Category Title"
                  className="text-md font-semibold outline-none"
                  onChange={(val) => handleEntryTitleChange(entryIndex, val)}
                  editable={editable}
                />
                {/* Remove category button - Only show when editable */}
                {editable && (
                  <button
                    onClick={() => handleRemoveCategory(entryIndex)}
                    className="text-red-500 hover:text-red-700 transition-opacity opacity-0 group-hover:opacity-100 ml-2 cursor-pointer"
                  >
                    <IoMdClose size={16} />
                  </button>
                )}
              </div>
            )}

            {isVisible('skills') && (
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(entry.skills) ? entry.skills : []).map(
                  (skill, skillIndex) => (
                    <div
                      key={skillIndex}
                      className="flex items-center gap-1 bg-gray-100 px-2 py-1 rounded group/skill"
                    >
                      <EditableDiv
                        value={skill}
                        placeholder="Skill"
                        className="text-xs outline-none"
                        onChange={(val) =>
                          handleSkillChange(entryIndex, skillIndex, val)
                        }
                        editable={editable}
                      />
                      {/* Remove skill button - Only show when editable */}
                      {editable && (
                        <button
                          onClick={() =>
                            handleRemoveSkill(entryIndex, skillIndex)
                          }
                          className="text-red-400 hover:text-red-600 transition-opacity opacity-0 group-hover/skill:opacity-100"
                        >
                          <IoMdClose size={12} />
                        </button>
                      )}
                    </div>
                  )
                )}
                {/* Add skill button - Only show when editable */}
                {editable && (
                  <button
                    onClick={() => handleAddSkill(entryIndex)}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <IoMdAdd size={14} />
                    Add Skill
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Category Button - Only show when editable */}
      {editable && (
        <button
          onClick={handleAddCategory}
          className="mt-3 flex items-center gap-1 text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer"
        >
          <IoMdAdd />
          Add Category
        </button>
      )}
    </section>
  );
};

export default CvSkills;
