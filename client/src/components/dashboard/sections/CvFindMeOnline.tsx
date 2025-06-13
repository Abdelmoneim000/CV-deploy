import { useState, useRef, useEffect } from 'react';
import { useCvContext } from '../../../context/CvContext';
import EditableDiv from '../../ui/EditableDiv';
import { IoMdAdd, IoMdClose } from 'react-icons/io';
import { FiSettings, FiChevronDown } from 'react-icons/fi';
import {
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaFacebook,
  FaXTwitter,
  FaGlobe,
  FaInstagram,
  FaYoutube,
  FaTiktok,
  FaDribbble,
  FaBehance,
  FaMedium,
  FaStackOverflow,
  FaDiscord,
  FaTwitch,
  FaReddit,
  FaPinterest,
  FaSlack,
  FaWhatsapp,
  FaTelegram,
  FaSnapchat,
  FaVimeo,
  FaSoundcloud,
  FaSpotify,
  FaPatreon,
  FaDev,
} from 'react-icons/fa6';

interface CvFindMeOnlineProps {
  showDivider?: boolean;
  dividerWidth?: number;
  textAlign?: 'left' | 'center' | 'right';
  editable?: boolean;
}

const ICON_OPTIONS = {
  linkedin: <FaLinkedin />,
  github: <FaGithub />,
  twitter: <FaTwitter />,
  facebook: <FaFacebook />,
  x: <FaXTwitter />,
  website: <FaGlobe />,
  instagram: <FaInstagram />,
  youtube: <FaYoutube />,
  tiktok: <FaTiktok />,
  dribbble: <FaDribbble />,
  behance: <FaBehance />,
  medium: <FaMedium />,
  stackoverflow: <FaStackOverflow />,
  discord: <FaDiscord />,
  twitch: <FaTwitch />,
  reddit: <FaReddit />,
  pinterest: <FaPinterest />,
  slack: <FaSlack />,
  whatsapp: <FaWhatsapp />,
  telegram: <FaTelegram />,
  snapchat: <FaSnapchat />,
  vimeo: <FaVimeo />,
  soundcloud: <FaSoundcloud />,
  spotify: <FaSpotify />,
  patreon: <FaPatreon />,
  dev: <FaDev />,
};

// Group icons by category for better organization
const ICON_CATEGORIES = {
  Professional: [
    'linkedin',
    'github',
    'dev',
    'stackoverflow',
    'behance',
    'dribbble',
    'medium',
  ],
  Social: [
    'facebook',
    'twitter',
    'x',
    'instagram',
    'reddit',
    'pinterest',
    'snapchat',
  ],
  Video: ['youtube', 'tiktok', 'twitch', 'vimeo'],
  Audio: ['spotify', 'soundcloud'],
  Messaging: ['discord', 'slack', 'whatsapp', 'telegram'],
  Other: ['website', 'patreon'],
};

const iconKeys = Object.keys(ICON_OPTIONS) as Array<keyof typeof ICON_OPTIONS>;

const CvFindMeOnline = ({
  showDivider = false,
  dividerWidth = 3,
  textAlign = 'left',
  editable = true,
}: CvFindMeOnlineProps) => {
  const {
    cvData,
    updateSection,
    updateSectionEntries,
    updateSectionVisibility,
  } = useCvContext();
  const [showToolkit, setShowToolkit] = useState(false);
  const [openIconMenu, setOpenIconMenu] = useState<number | null>(null);
  const [iconSearchQuery, setIconSearchQuery] = useState('');
  const [localEntries, setLocalEntries] = useState<any[]>([]);

  const toolkitRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);
  const iconMenuRefs = useRef<(HTMLDivElement | null)[]>([]);
  const iconButtonRefs = useRef<(HTMLDivElement | null)[]>([]);

  const section = cvData?.data?.sections.find((s) => s.id === 'findMeOnline');
  const TITLE_PLACEHOLDER = 'Find Me Online';

  // Sync local entries with context entries
  useEffect(() => {
    if (section && Array.isArray(section.entries)) {
      setLocalEntries(section.entries);
    }
  }, [section]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Handle settings toolkit
      if (
        toolkitRef.current &&
        !toolkitRef.current.contains(e.target as Node) &&
        !gearRef.current?.contains(e.target as Node)
      ) {
        setShowToolkit(false);
      }

      // Handle icon menu
      if (openIconMenu !== null) {
        // Check if click was inside the icon menu or the button that triggered it
        const clickedInsideMenu = iconMenuRefs.current[openIconMenu]?.contains(
          e.target as Node
        );
        const clickedOnTriggerButton = iconButtonRefs.current[
          openIconMenu
        ]?.contains(e.target as Node);

        // Only close if clicked outside both the menu and its trigger button
        if (!clickedInsideMenu && !clickedOnTriggerButton) {
          setOpenIconMenu(null);
          setIconSearchQuery('');
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openIconMenu]);

  if (!section || !Array.isArray(section.entries)) return null;

  const { id, name, entries, visibility = {} } = section;

  if (visibility.section === false && !showToolkit) {
    return null;
  }

  const handleTitleChange = (newTitle: string) => {
    if (!editable) return; // Prevent changes if not editable
    updateSection(id, newTitle || TITLE_PLACEHOLDER);
  };

  const handleEntryChange = (
    index: number,
    key: 'platform' | 'userName',
    value: string
  ) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = localEntries.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry
    );
    setLocalEntries(updated);
    updateSectionEntries(id, updated);
  };

  const handleIconChange = (index: number, newIcon: string) => {
    if (!editable) return; // Prevent changes if not editable
    // Update local state immediately for responsive UI
    const updated = localEntries.map((entry, i) =>
      i === index ? { ...entry, icon: newIcon } : entry
    );

    setLocalEntries(updated);
    updateSectionEntries(id, updated);
  };

  const handleAddEntry = () => {
    if (!editable) return; // Prevent changes if not editable
    const newEntry = { platform: '', userName: '', icon: 'website' };
    const updated = [...localEntries, newEntry];
    setLocalEntries(updated);
    updateSectionEntries(id, updated);
  };

  const handleRemoveEntry = (index: number) => {
    if (!editable) return; // Prevent changes if not editable
    const updated = localEntries.filter((_, i) => i !== index);
    setLocalEntries(updated);
    updateSectionEntries(id, updated);

    if (openIconMenu === index) {
      setOpenIconMenu(null);
    }
  };

  const toggleVisibility = (field: string) => {
    if (!editable) return; // Prevent changes if not editable
    const newVisibility = {
      ...visibility,
      [field]: !visibility[field],
    };
    updateSectionVisibility(id, newVisibility);
  };

  const isVisible = (field: string) => {
    return visibility[field] !== false;
  };

  const toggleIconMenu = (index: number) => {
    if (!editable) return; // Prevent opening menu if not editable
    setOpenIconMenu(openIconMenu === index ? null : index);
    setIconSearchQuery('');
  };

  // Filter icons based on search query
  const filteredIcons = iconSearchQuery
    ? iconKeys.filter((key) =>
        key.toLowerCase().includes(iconSearchQuery.toLowerCase())
      )
    : iconKeys;

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
            <FiSettings /> Social Links Settings
          </div>

          {/* Visibility Controls - Only icons */}
          <div className="space-y-2">
            {/* Icon Visibility Control */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 capitalize">
                Show Icons
              </span>
              <button
                onClick={() => toggleVisibility('icon')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                  isVisible('icon')
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {isVisible('icon') ? 'Visible' : 'Hidden'}
              </button>
            </div>
          </div>
        </div>
      )}

      <EditableDiv
        value={name}
        placeholder={TITLE_PLACEHOLDER}
        className="text-xl font-semibold mb-4 outline-none"
        style={{
          borderBottomWidth: showDivider ? dividerWidth : 0,
          textAlign: textAlign,
        }}
        onChange={handleTitleChange}
        editable={editable}
      />

      {/* Grid layout - 3 items per row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {localEntries.map((entry, index) => (
          <div
            key={index}
            className="group p-3 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-start gap-3">
              {/* Icon with Dropdown Trigger */}
              {isVisible('icon') && (
                <div className="relative">
                  <div
                    className={`flex items-center gap-1 text-2xl text-blue-600 ${
                      editable ? 'cursor-pointer hover:text-blue-800' : ''
                    } flex-shrink-0`}
                    onClick={(e) => {
                      if (!editable) return; // Prevent opening menu if not editable
                      e.stopPropagation();
                      toggleIconMenu(index);
                    }}
                    ref={(el) => (iconButtonRefs.current[index] = el)}
                  >
                    {ICON_OPTIONS[entry.icon as keyof typeof ICON_OPTIONS] || (
                      <FaGlobe />
                    )}
                    {/* Only show dropdown arrow when editable */}
                    {editable && (
                      <FiChevronDown
                        size={14}
                        className={`transition-transform ${
                          openIconMenu === index ? 'rotate-180' : ''
                        }`}
                      />
                    )}
                  </div>

                  {/* Enhanced Icon Selection Dropdown */}
                  {editable && openIconMenu === index && (
                    <div
                      ref={(el) => (iconMenuRefs.current[index] = el)}
                      className="absolute top-full left-0 mt-1 bg-white border border-gray-200 shadow-lg rounded-md p-3 z-20 animate-fade-in w-72"
                    >
                      {/* Search bar */}
                      <div className="mb-3">
                        <input
                          type="text"
                          placeholder="Search icons..."
                          value={iconSearchQuery}
                          onChange={(e) => setIconSearchQuery(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                        />
                      </div>

                      {/* Icons by category */}
                      {iconSearchQuery ? (
                        <div className="grid grid-cols-4 gap-2">
                          {filteredIcons.map((key) => (
                            <button
                              key={key}
                              onClick={() => handleIconChange(index, key)}
                              className={`p-2 rounded flex flex-col items-center gap-1 ${
                                entry.icon === key
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'text-gray-600 hover:bg-gray-100'
                              } transition-colors`}
                              title={key}
                            >
                              <div className="text-lg">{ICON_OPTIONS[key]}</div>
                              <span className="text-xs truncate max-w-full">
                                {key}
                              </span>
                            </button>
                          ))}
                        </div>
                      ) : (
                        // Show icons by category
                        <div className="space-y-4 max-h-60 overflow-y-auto pr-1">
                          {Object.entries(ICON_CATEGORIES).map(
                            ([category, icons]) => (
                              <div key={category}>
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">
                                  {category}
                                </h4>
                                <div className="grid grid-cols-4 gap-2">
                                  {icons.map((key) => (
                                    <button
                                      key={key}
                                      onClick={() =>
                                        handleIconChange(index, key)
                                      }
                                      className={`p-2 rounded flex flex-col items-center gap-1 ${
                                        entry.icon === key
                                          ? 'bg-blue-100 text-blue-600'
                                          : 'text-gray-600 hover:bg-gray-100'
                                      } transition-colors`}
                                      title={key}
                                    >
                                      <div className="text-lg">
                                        {
                                          ICON_OPTIONS[
                                            key as keyof typeof ICON_OPTIONS
                                          ]
                                        }
                                      </div>
                                      <span className="text-xs truncate max-w-full">
                                        {key}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Platform and Username in vertical layout */}
              <div className="flex flex-col gap-1 flex-grow">
                <EditableDiv
                  value={entry.platform}
                  placeholder="Platform"
                  className="font-semibold text-sm outline-none"
                  onChange={(val) => handleEntryChange(index, 'platform', val)}
                  editable={editable}
                />

                <EditableDiv
                  value={entry.userName}
                  placeholder="Username"
                  className="text-xs text-gray-600 outline-none"
                  onChange={(val) => handleEntryChange(index, 'userName', val)}
                  editable={editable}
                />
              </div>

              {/* Remove button - Only show when editable */}
              {editable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveEntry(index);
                  }}
                  className="text-red-500 hover:text-red-700 transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer"
                >
                  <IoMdClose size={16} />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Add Entry Button - Only show when editable */}
      {editable && (
        <button
          onClick={handleAddEntry}
          className="mt-4 flex items-center gap-1 text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity text-sm cursor-pointer"
        >
          <IoMdAdd />
          Add Social Link
        </button>
      )}
    </section>
  );
};

export default CvFindMeOnline;
