import { useState, useEffect } from 'react';
import { useCvContext } from '../../../context/CvContext';
import { omitKeys } from '../../../lib/utilities';
import Button from '../../ui/button';
import { FiCheckCircle, FiAlertTriangle, FiCheck, FiX } from 'react-icons/fi';
import useAuth from '@/hooks/useAuth';

type AdaptedChanges = {
  section: string;
  field: string;
  before: string;
  after: string;
  applied: boolean;
};

const AdaptPanel = () => {
  const { cvData, setPersonalInfo, updateSection, updateSectionEntries } =
    useCvContext();

  const [jobDescription, setJobDescription] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // State to hold the adapted CV
  const [adaptedCV, setAdaptedCV] = useState<any>(null);
  // State to track the changes made by the adaptation
  const [changes, setChanges] = useState<AdaptedChanges[]>([]);
  // State to track which changes to apply
  const [selectedChanges, setSelectedChanges] = useState<
    Record<string, boolean>
  >({});
  const {tokens} = useAuth();

  // Clean the CV data for API call
  const prepareCleanCvData = () => {
    if (!cvData || !cvData.data) {
      throw new Error('CV data is not properly loaded');
    }

    const topLevelClean = omitKeys(cvData, ['userId']);
    const dataClean = omitKeys(topLevelClean.data, ['theme']);
    const sectionsClean = dataClean.sections.map((section: any) =>
      omitKeys(section, ['id'])
    );

    // Return flatter structure expected by the backend
    return {
      ...topLevelClean,
      personalInfo: dataClean.personalInfo,
      sections: sectionsClean,
      title: cvData.title,
    };
  };

  // Initialize selected changes when changes array updates
  useEffect(() => {
    // Only set initial selection state when changes first load or count changes
    if (Object.keys(selectedChanges).length !== changes.length) {
      const initialSelections: Record<string, boolean> = {};
      changes.forEach((change, index) => {
        // Keep previous selection if it exists, otherwise default to true
        initialSelections[`${index}`] =
          selectedChanges[`${index}`] !== undefined
            ? selectedChanges[`${index}`]
            : true;
      });
      setSelectedChanges(initialSelections);
    }
  }, [changes, selectedChanges]);

  const toggleChangeSelection = (index: string) => {
    setSelectedChanges((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleAdapt = async () => {
    if (!jobDescription.trim()) {
      setErrorMessage('Please enter a job description');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');
    setAdaptedCV(null);
    setChanges([]);

    try {
      const cleanedCvData = prepareCleanCvData();

      const response = await fetch('/api/ai/adapt-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`, // Use the token from auth context
        },
        body: JSON.stringify({
          cv: cleanedCvData,
          jobDescription: jobDescription,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to adapt CV');
      }

      const data = await response.json();

      if (!data.adaptedCV) {
        throw new Error('Invalid response from server');
      }

      setAdaptedCV(data.adaptedCV);
      setSuccessMessage('CV adaptation completed! Review changes below.');

      // Generate change records by comparing original and adapted CV
      const detectedChanges = detectChanges(cleanedCvData, data.adaptedCV);
      setChanges(detectedChanges);
    } catch (error) {
      console.error('Error adapting CV:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to adapt CV'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const detectChanges = (originalCV: any, adaptedCV: any): AdaptedChanges[] => {
    const changes: AdaptedChanges[] = [];

    // Check personal info changes
    const personalInfoFields = ['fullName', 'jobTitle', 'summary'];
    personalInfoFields.forEach((field) => {
      if (
        originalCV.personalInfo?.[field] !== adaptedCV.personalInfo?.[field] &&
        originalCV.personalInfo?.[field] &&
        adaptedCV.personalInfo?.[field]
      ) {
        changes.push({
          section: 'Personal Information',
          field,
          before: originalCV.personalInfo[field],
          after: adaptedCV.personalInfo[field],
          applied: false,
        });
      }
    });

    // Check each section's entries
    if (originalCV.sections && adaptedCV.sections) {
      originalCV.sections.forEach((origSection: any, sectionIndex: number) => {
        const adaptedSection = adaptedCV.sections[sectionIndex];
        if (!adaptedSection) return;

        // Compare section fields
        if (origSection.name !== adaptedSection.name) {
          changes.push({
            section: origSection.name,
            field: 'section name',
            before: origSection.name,
            after: adaptedSection.name,
            applied: false,
          });
        }

        // Compare entries
        if (origSection.entries && adaptedSection.entries) {
          origSection.entries.forEach((origEntry: any, entryIndex: number) => {
            const adaptedEntry = adaptedSection.entries[entryIndex];
            if (!adaptedEntry) return;

            // For text entries
            if (
              typeof origEntry === 'string' &&
              typeof adaptedEntry === 'string'
            ) {
              if (origEntry !== adaptedEntry) {
                changes.push({
                  section: origSection.name,
                  field: `Entry ${entryIndex + 1}`,
                  before: origEntry,
                  after: adaptedEntry,
                  applied: false,
                });
              }
            }
            // For object entries like experience, education, etc.
            else if (
              typeof origEntry === 'object' &&
              typeof adaptedEntry === 'object'
            ) {
              Object.keys(origEntry).forEach((key) => {
                if (
                  origEntry[key] !== adaptedEntry[key] &&
                  origEntry[key] &&
                  adaptedEntry[key]
                ) {
                  // Focus on content fields like description
                  if (['description', 'content', 'text'].includes(key)) {
                    changes.push({
                      section: origSection.name,
                      field: `${key} (${entryIndex + 1})`,
                      before: origEntry[key],
                      after: adaptedEntry[key],
                      applied: false,
                    });
                  }
                }
              });
            }
          });
        }
      });
    }

    return changes;
  };

  const applySelectedChanges = () => {
    if (!adaptedCV || changes.length === 0) return;

    // Create a deep copy of the current CV data
    const updatedCV = JSON.parse(JSON.stringify(cvData));

    // Apply each selected change
    changes.forEach((change, index) => {
      if (!selectedChanges[`${index}`]) return; // Skip unselected changes

      // Update personal info - remove the unnecessary check
      if (change.section === 'Personal Information') {
        // Just use the setPersonalInfo directly
        const updatedPersonalInfo = {
          ...cvData?.data?.personalInfo,
          [change.field]: change.after,
        };
        setPersonalInfo(updatedPersonalInfo);
      }
      // Update sections
      else {
        // Fix: Access sections through the data property
        const sectionIndex = updatedCV.data.sections.findIndex(
          (s: any) => s.name === change.section
        );

        if (sectionIndex !== -1) {
          const section = cvData?.data?.sections[sectionIndex];

          // Handle section name change
          if (change.field === 'section name') {
            updateSection(section.id, change.after);
          }
          // Handle entry changes
          else {
            const match = change.field.match(/(\w+) \((\d+)\)/);
            if (match) {
              const [, fieldName, entryNumberStr] = match;
              const entryIndex = parseInt(entryNumberStr) - 1;

              if (section.entries && entryIndex < section.entries.length) {
                // Create a new entries array with the updated entry
                const updatedEntries = [...section.entries];
                updatedEntries[entryIndex] = {
                  ...updatedEntries[entryIndex],
                  [fieldName]: change.after,
                };

                // Use the updateSectionEntries method
                updateSectionEntries(section.id, updatedEntries);
              }
            } else if (change.field.startsWith('Entry ')) {
              const entryIndex =
                parseInt(change.field.replace('Entry ', '')) - 1;

              if (section.entries && entryIndex < section.entries.length) {
                // Create a new entries array with the updated entry
                const updatedEntries = [...section.entries];
                // Ensure the entry is an object if required by your data structure
                updatedEntries[entryIndex] = {
                  ...updatedEntries[entryIndex],
                  value: change.after,
                };

                // Use the updateSectionEntries method
                updateSectionEntries(section.id, updatedEntries);
              }
            }
          }
        }
      }
    });

    // Mark changes as applied and show success message
    setChanges((prev) =>
      prev.map((change, index) => ({
        ...change,
        applied: selectedChanges[`${index}`] ? true : change.applied,
      }))
    );

    setSuccessMessage('Selected changes have been applied to your CV!');
  };

  const selectAllChanges = () => {
    const allSelected: Record<string, boolean> = {};
    changes.forEach((_, index) => {
      allSelected[`${index}`] = true;
    });
    setSelectedChanges(allSelected);
  };

  const deselectAllChanges = () => {
    const allDeselected: Record<string, boolean> = {};
    changes.forEach((_, index) => {
      allDeselected[`${index}`] = false;
    });
    setSelectedChanges(allDeselected);
  };

  const loadExample = () => {
    setJobDescription(`Example Job Description:
We are seeking a skilled React developer with experience in TypeScript and modern frontend frameworks. Key responsibilities include:
- Developing responsive user interfaces
- Collaborating with cross-functional teams
- Optimizing application performance
- Maintaining code quality and best practices

Requirements:
- 3+ years of React experience
- Proficiency in TypeScript
- Experience with state management (Redux/MobX)
- Familiarity with REST APIs and modern tooling`);
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800">CV Adaptation</h2>
        <p className="text-gray-600 mt-2">
          Optimize your CV for specific job applications by tailoring it to
          match job requirements.
        </p>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">
            Job Description
          </h3>
          <button
            onClick={loadExample}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Load Example
          </button>
        </div>

        <textarea
          className="w-full h-64 p-4 border border-gray-300 rounded-lg 
              focus:ring-2 focus:ring-blue-500 focus:border-transparent
              transition-all resize-none prose"
          placeholder="Paste the job description here..."
          value={jobDescription}
          onChange={(e) => {
            setJobDescription(e.target.value);
            setErrorMessage('');
          }}
        />
        <div className="flex justify-between mt-2">
          <span className="text-sm text-gray-500">
            {jobDescription.length}/2000 characters
          </span>
          {errorMessage && (
            <span className="text-red-600 text-sm">{errorMessage}</span>
          )}
        </div>
      </div>

      <div className="mt-8">
        <Button
          className="w-full py-3"
          onClick={handleAdapt}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Adapting CV...
            </span>
          ) : (
            'Analyze & Adapt CV'
          )}
        </Button>

        {/* Changes Display */}
        {changes.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                <FiCheckCircle className="text-green-500 mr-2" />
                Suggested Adaptations
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={selectAllChanges}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Select All
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={deselectAllChanges}
                  className="text-blue-600 text-sm hover:underline"
                >
                  Deselect All
                </button>
              </div>
            </div>

            <div className="border border-gray-200 rounded-lg mb-6">
              {changes.map((change, index) => (
                <div
                  key={index}
                  className={`border-b border-gray-200 p-4 ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                  } ${change.applied ? 'bg-green-50' : ''}`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="font-semibold text-gray-800">
                        {change.section}
                      </span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-gray-600">{change.field}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {change.applied ? (
                        <span className="text-green-500 flex items-center gap-1 text-sm">
                          <FiCheckCircle /> Applied
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault(); // Prevent default behavior
                            toggleChangeSelection(`${index}`);
                          }}
                          className="flex items-center gap-2 py-1 px-2 rounded hover:bg-gray-100 focus:outline-none"
                        >
                          <div
                            className={`w-5 h-5 flex items-center justify-center border rounded transition-colors ${
                              selectedChanges[`${index}`]
                                ? 'bg-blue-500 border-blue-500'
                                : 'border-gray-300'
                            }`}
                          >
                            {selectedChanges[`${index}`] && (
                              <FiCheck className="text-white" size={14} />
                            )}
                          </div>
                          <span className="text-sm text-gray-700">
                            {selectedChanges[`${index}`]
                              ? 'Selected'
                              : 'Select'}
                          </span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-2 space-y-2">
                    <div className="bg-red-50 p-3 rounded-md text-sm">
                      <div className="font-medium text-red-700 mb-1">
                        Original
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {change.before}
                      </div>
                    </div>
                    <div className="bg-green-50 p-3 rounded-md text-sm">
                      <div className="font-medium text-green-700 mb-1">
                        Adapted
                      </div>
                      <div className="text-gray-800 whitespace-pre-wrap">
                        {change.after}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={applySelectedChanges}
                disabled={
                  Object.values(selectedChanges).every(
                    (selected) => !selected
                  ) || changes.every((change) => change.applied)
                }
              >
                Apply Selected Changes
              </Button>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && changes.length === 0 && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
            <FiAlertTriangle className="text-yellow-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-gray-700">{successMessage}</p>
              <p className="text-sm text-gray-600 mt-1">
                The AI couldn't find any specific changes to suggest for your
                CV. This might mean your CV is already well-aligned with the job
                description, or the job description doesn't contain enough
                specific requirements to suggest changes.
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <FiX className="text-red-500 mt-1 mr-3 flex-shrink-0" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdaptPanel;
