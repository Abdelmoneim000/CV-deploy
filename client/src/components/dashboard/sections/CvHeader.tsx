import { useState, useEffect, useRef } from 'react';
import { useCvContext } from '../../../context/CvContext';
import { MdEmail, MdPhone, MdHome, MdLanguage } from 'react-icons/md';
import { FiSettings } from 'react-icons/fi';

interface CvHeaderProps {
  editable?: boolean;
  alignment?: 'left' | 'center' | 'right';
  imageShape?: 'circle' | 'square';
  showControls?: boolean;
  showImage?: boolean;
  showIcons?: boolean;
  layout?: 'row' | 'column';
  imagePosition?: 'start' | 'end';
}

const iconMap: Record<string, React.ReactNode> = {
  email: <MdEmail className="text-gray-500" />,
  phone: <MdPhone className="text-gray-500" />,
  address: <MdHome className="text-gray-500" />,
  website: <MdLanguage className="text-gray-500" />,
};

const CvHeader = ({
  editable = true,
  alignment = 'left',
  imageShape = 'circle',
  showImage = false,
  showIcons = false,
  layout = 'row',
  imagePosition = 'end',
}: CvHeaderProps) => {
  const { cvData, setPersonalInfo } = useCvContext();

  // Add defensive coding with default values
  const personalInfo = cvData?.data?.personalInfo || {};
  const {
    fullName = '',
    jobTitle = '',
    email = '',
    phone = '',
    address = '',
    website = '',
    image = '',
    visibility: personalInfoVisibility = {
      email: true,
      phone: true,
      address: true,
      website: true,
      image: true,
    },
  } = personalInfo;

  // Track if this is the first render
  const isFirstRender = useRef(true);

  const [formData, setFormData] = useState({
    fullName,
    jobTitle,
    email,
    phone,
    address,
    website,
    image,
  });

  const [headerConfig, setHeaderConfig] = useState({
    editable,
    alignment,
    imageShape,
    showImage,
    layout,
    imagePosition,
  });

  // Initialize visibility with default values
  const [visibility, setVisibility] = useState({
    email: true,
    phone: true,
    address: true,
    website: true,
    image: true,
    ...(personalInfoVisibility || {}),
  });

  const [showToolkit, setShowToolkit] = useState(false);
  const componentRef = useRef<HTMLDivElement>(null);
  const toolkitRef = useRef<HTMLDivElement>(null);
  const gearRef = useRef<HTMLButtonElement>(null);

  // Update form data on external context change
  useEffect(() => {
    setFormData({
      fullName,
      jobTitle,
      email,
      phone,
      address,
      website,
      image,
    });
  }, [fullName, jobTitle, email, phone, address, website, image]);

  // FIX 1: Only update visibility state when personalInfoVisibility changes significantly
  // and not on first render to avoid the circular dependency
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Use functional update to avoid needing visibility in the dependency array
    setVisibility((prev) => {
      // Only update if there's an actual difference to avoid infinite loops
      const visibilityStr = JSON.stringify(prev);
      const newVisibilityStr = JSON.stringify(personalInfoVisibility);

      if (visibilityStr !== newVisibilityStr) {
        // Ensure all required fields are present and are boolean
        return {
          email: personalInfoVisibility?.email ?? true,
          phone: personalInfoVisibility?.phone ?? true,
          address: personalInfoVisibility?.address ?? true,
          website: personalInfoVisibility?.website ?? true,
          image: personalInfoVisibility?.image ?? true,
        };
      }
      return prev;
    });
  }, [personalInfoVisibility]);

  // Handle click outside to save & close toolkit
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolkitRef.current &&
        !toolkitRef.current.contains(event.target as Node) &&
        gearRef.current &&
        !gearRef.current.contains(event.target as Node)
      ) {
        setShowToolkit(false);
        setPersonalInfo(formData);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [formData, setPersonalInfo]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editable) return; // Prevent changes if not editable

    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const updated = { ...formData, image: base64 };
      setFormData(updated);
      setPersonalInfo(updated);
    };
    reader.readAsDataURL(file);
  };

  const handleEditableBlur = (field: keyof typeof formData, value: string) => {
    if (!editable) return; // Prevent changes if not editable

    const updated = { ...formData, [field]: value };
    setFormData(updated);
    setPersonalInfo(updated);
  };

  const toggleVisibility = (field: keyof typeof visibility) => {
    if (!editable) return; // Prevent changes if not editable

    // FIX 2: Create the new visibility object
    const newVisibility = {
      ...visibility,
      [field]: !visibility[field],
    };

    // Update local state first
    setVisibility(newVisibility);

    // FIX 3: Debounce the context update to prevent immediate re-renders
    // causing the infinite loop
    setTimeout(() => {
      // Update the context with new visibility settings
      setPersonalInfo({
        ...personalInfo, // use original personalInfo, not cvData.personalInfo
        visibility: newVisibility,
      });
    }, 0);
  };

  const renderImage = () => {
    if (!visibility.image) return null;
    return (
      <div className="flex-shrink-0">
        {formData.image ? (
          <img
            src={formData.image}
            alt="Profile"
            className={`w-24 h-24 object-cover ${
              headerConfig.imageShape === 'circle'
                ? 'rounded-full'
                : 'rounded-md'
            } bg-gray-100`}
          />
        ) : (
          <div
            className={`w-24 h-24 flex items-center justify-center text-gray-400 text-xs bg-gray-100 ${
              headerConfig.imageShape === 'circle'
                ? 'rounded-full'
                : 'rounded-md'
            }`}
          >
            No Image
          </div>
        )}
      </div>
    );
  };

  const renderEditable = (
    field: keyof typeof formData,
    className: string,
    placeholder = ''
  ) => {
    // Always render fullName and jobTitle, check visibility for other fields
    if (
      field !== 'fullName' &&
      field !== 'jobTitle' &&
      !visibility[field as keyof typeof visibility]
    ) {
      return null;
    }

    const isEmpty = !formData[field];

    // If not editable, just render as static text
    if (!editable) {
      return (
        <div className={className}>
          {isEmpty ? placeholder : formData[field]}
        </div>
      );
    }

    // Otherwise render as editable content
    return (
      <div
        contentEditable={editable}
        suppressContentEditableWarning
        onBlur={(e) => {
          if (!editable) return;
          const value = e.currentTarget.innerText.trim();
          const newValue = value === '' ? placeholder : value;
          handleEditableBlur(field, newValue);
          if (value === '') e.currentTarget.innerText = placeholder;
        }}
        className={`${className} ${
          editable ? 'outline-none focus:outline-none' : ''
        } relative`}
      >
        {isEmpty && editable ? (
          <span className="opacity-40 pointer-events-none">{placeholder}</span>
        ) : (
          formData[field]
        )}
      </div>
    );
  };

  const renderContactInfo = () => {
    // Ensure visibility is defined before using it
    const safeVisibility = visibility || {};

    const contactFields = [
      { key: 'email', value: formData.email },
      { key: 'phone', value: formData.phone },
      { key: 'website', value: formData.website },
      { key: 'address', value: formData.address },
    ].filter(
      ({ key }) =>
        // Safely access visibility properties with fallback to true
        safeVisibility[key as keyof typeof safeVisibility] !== false
    );

    return (
      <div
        className={`text-sm flex flex-wrap gap-2 mt-1 max-w-full ${
          headerConfig.alignment === 'center'
            ? 'justify-center'
            : headerConfig.alignment === 'right'
            ? 'justify-end'
            : 'justify-start'
        }`}
      >
        {contactFields.map(({ key }, index) => (
          <div key={key} className="flex items-center gap-1">
            {index > 0 && <span className="text-gray-400">|</span>}
            {showIcons && iconMap[key]}
            {renderEditable(key as keyof typeof formData, 'truncate', key)}
          </div>
        ))}
      </div>
    );
  };

  const layoutClass =
    headerConfig.layout === 'row' ? 'flex-row gap-4' : 'flex-col gap-2';

  const alignmentClass =
    headerConfig.alignment === 'left'
      ? 'text-left items-start'
      : headerConfig.alignment === 'right'
      ? 'text-right items-end'
      : 'text-center items-center';

  const content = (
    <div className="flex flex-col gap-1 max-w-full">
      {renderEditable(
        'fullName',
        'text-3xl font-bold break-words',
        'Full Name'
      )}
      {renderEditable('jobTitle', 'text-lg italic', 'Job Title')}
      {renderContactInfo()}
    </div>
  );

  const layoutItems =
    headerConfig.layout === 'row'
      ? headerConfig.imagePosition === 'start'
        ? [renderImage(), content]
        : [content, renderImage()]
      : headerConfig.imagePosition === 'start'
      ? [renderImage(), content]
      : [content, renderImage()];

  // Fields that can have their visibility toggled (exclude fullName and jobTitle)
  const controllableFields = Object.entries(visibility).filter(
    ([field]) => !['fullName', 'jobTitle'].includes(field)
  );

  return (
    <section ref={componentRef} className="w-full relative group">
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

      <div className={`flex ${layoutClass} ${alignmentClass} w-full`}>
        {layoutItems.map((item, index) => (
          <div
            key={index}
            className={`min-w-0 ${
              item === content ? 'flex-1' : 'flex-shrink-0'
            }`}
          >
            {item}
          </div>
        ))}
      </div>

      {/* Only show toolkit when editable and showToolkit is true */}
      {editable && showToolkit && (
        <div
          ref={toolkitRef}
          className="absolute top-0 right-4 z-10 bg-white border border-gray-200 shadow-xl rounded-lg px-4 py-3 w-72 space-y-4 text-sm animate-fade-in"
        >
          <div className="font-semibold text-gray-700 flex items-center gap-2">
            <FiSettings /> Header Settings
          </div>

          <div className="space-y-3">
            {/* Show only toggle able fields in toolkit */}
            <div className="mb-2 pb-2 border-b border-gray-100">
              <div className="text-gray-700 font-medium mb-2">Visibility</div>
              {controllableFields.map(([field, visible]) => (
                <div
                  key={field}
                  className="flex items-center justify-between gap-2 mb-1.5"
                >
                  <span className="text-sm text-gray-600 capitalize">
                    {field}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleVisibility(field as keyof typeof visibility);
                    }}
                    className={`px-2 py-1 rounded-md text-xs font-medium transition-colors ${
                      visible
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {visible ? 'Visible' : 'Hidden'}
                  </button>
                </div>
              ))}
            </div>

            <div className="text-gray-700 font-medium mb-2">Layout</div>
            {(
              [
                {
                  label: 'Alignment',
                  key: 'alignment',
                  options: ['left', 'center', 'right'],
                },
                {
                  label: 'Layout',
                  key: 'layout',
                  options: ['row', 'column'],
                },
                {
                  label: 'Image Position',
                  key: 'imagePosition',
                  options: ['start', 'end'],
                },
                {
                  label: 'Image Shape',
                  key: 'imageShape',
                  options: ['circle', 'square'],
                },
              ] as const
            ).map(({ label, key, options }) => (
              <div
                key={key}
                className="flex items-center justify-between gap-2"
              >
                <span className="text-sm text-gray-600">{label}</span>
                <select
                  value={String(headerConfig[key as keyof typeof headerConfig])}
                  onChange={(e) =>
                    setHeaderConfig((prev) => ({
                      ...prev,
                      [key]: e.target.value,
                    }))
                  }
                  className="text-sm border rounded-md px-2 py-1"
                >
                  {options.map((val) => (
                    <option key={val} value={val}>
                      {val.charAt(0).toUpperCase() + val.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            ))}

            {visibility.image && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Upload Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

export default CvHeader;
