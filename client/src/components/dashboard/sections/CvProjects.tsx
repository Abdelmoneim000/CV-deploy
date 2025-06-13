import { useState, useRef, useEffect } from 'react';
import { useCvContext } from '../../../context/CvContext';
import EditableDiv from '../../ui/EditableDiv';
import { IoMdAdd, IoMdClose } from 'react-icons/io';
import { FiSettings } from 'react-icons/fi';

interface CvProjectsProps {
  showDivider?: boolean;
  dividerWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  editable?: boolean;
}

const CvProjects = ({
  showDivider = false,
  dividerWidth = 3,
  textAlign = 'left',
  editable = true,
}: CvProjectsProps) => {
  const {
    cvData,
    updateSection,
    updateSectionEntries,
    updateSectionVisibility,
  } = useCvContext();
  const [showToolkit, setShowToolkit] = useState(false);

  const toolkitRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);

  const section = cvData?.data?.sections.find((s) => s.id === 'projects');
  const TITLE_PLACEHOLDER = 'Projects';

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

  const handleEntryChange = (
    index: number,
    field: 'title' | 'description' | 'url',
    value: string
  ) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.map((entry, i) =>
      i === index ? { ...entry, [field]: value } : entry
    );
    updateSectionEntries(id, updated);
  };

  const handleAddProject = () => {
    if (!editable) return; // Prevent changes if not editable
    const newEntry = { title: '', description: '', url: '' };
    updateSectionEntries(id, [...entries, newEntry]);
  };

  const handleRemoveProject = (index: number) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = entries.filter((_, i) => i !== index);
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
          className="absolute -top-28 right-0 z-10 bg-white border border-gray-200 shadow-xl rounded-lg px-4 py-3 w-72 space-y-4 text-sm animate-fade-in"
        >
          <div className="font-semibold text-gray-700 flex items-center gap-2">
            <FiSettings /> Projects Settings
          </div>

          {/* Visibility Controls */}
          <div className="space-y-2">
            {['title', 'description', 'url'].map((field) => (
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

      {/* Entries */}
      <ul className="space-y-4">
        {entries.map((entry, index) => (
          <li key={index} className="group">
            {isVisible('title') && (
              <div className="flex justify-between gap-2">
                <EditableDiv
                  value={typeof entry?.title === 'string' ? entry.title : ''}
                  placeholder="Project Title"
                  className="text-md font-semibold w-full outline-none bg-transparent"
                  onChange={(val) => handleEntryChange(index, 'title', val)}
                  editable={editable}
                />
                {/* Remove button - Only show when editable */}
                {editable && (
                  <button
                    onClick={() => handleRemoveProject(index)}
                    className="text-red-500 hover:text-red-700 transition-opacity opacity-0 group-hover:opacity-100 ml-2 cursor-pointer"
                  >
                    <IoMdClose size={16} />
                  </button>
                )}
              </div>
            )}

            {isVisible('description') && (
              <EditableDiv
                value={
                  typeof entry.description === 'string' ? entry.description : ''
                }
                placeholder="Description"
                className="w-full text-sm text-gray-700 bg-transparent outline-none"
                onChange={(val) => handleEntryChange(index, 'description', val)}
                editable={editable}
              />
            )}

            {isVisible('url') && (
              <>
                {editable ? (
                  <EditableDiv
                    value={typeof entry.url === 'string' ? entry.url : ''}
                    placeholder="https://example.com"
                    className="text-sm text-blue-600 w-full bg-transparent outline-none"
                    onChange={(val) => handleEntryChange(index, 'url', val)}
                    editable={true}
                  />
                ) : (
                  typeof entry.url === 'string' &&
                  entry.url && (
                    <a
                      href={
                        entry.url.startsWith('http')
                          ? entry.url
                          : `https://${entry.url}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate block"
                    >
                      {entry.url}
                    </a>
                  )
                )}
              </>
            )}
          </li>
        ))}
      </ul>

      {/* Hover Add - Only show when editable */}
      {editable && (
        <button
          onClick={handleAddProject}
          className="mt-3 flex items-center gap-1 text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer"
        >
          <IoMdAdd />
          Add Project
        </button>
      )}
    </section>
  );
};

export default CvProjects;
