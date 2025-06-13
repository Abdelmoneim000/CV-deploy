import { useState } from 'react';
import Button from '../../ui/button';
import { useCvContext } from '../../../context/CvContext';
import { omitKeys } from '../../../lib/utilities';
import { FiCheck, FiAlertTriangle, FiLoader } from 'react-icons/fi';
import useAuth from '@/hooks/useAuth';

const languages = [
  { id: 'english', name: 'English' },
  { id: 'spanish', name: 'Spanish' },
  { id: 'french', name: 'French' },
  { id: 'german', name: 'German' },
  { id: 'italian', name: 'Italian' },
  { id: 'portuguese', name: 'Portuguese' },
  { id: 'dutch', name: 'Dutch' },
  { id: 'russian', name: 'Russian' },
  { id: 'chinese', name: 'Chinese' },
  { id: 'japanese', name: 'Japanese' },
  { id: 'arabic', name: 'Arabic' },
];

const TranslatePanel = () => {
  const [language, setLanguage] = useState<string>('spanish'); // Default to Spanish since English is already in use
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [preview, setPreview] = useState<any>(null);
  const { tokens } = useAuth();

  // Context and data preparation
  const { cvData, setPersonalInfo, updateSection, updateSectionEntries } =
    useCvContext();

  // Prepare clean CV data for translation
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

  // Handle translation
  const handleTranslate = async () => {
    // Reset states
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setPreview(null);

    try {
      const cleanedCvData = prepareCleanCvData();

      // Call the API
      const response = await fetch('/api/ai/translate-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`
        },
        body: JSON.stringify({
          cv: cleanedCvData,
          targetLanguage: language,
          service: 'claude',
        }),
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message ||
            `Translation failed with status ${response.status}`
        );
      }

      // Parse the response
      const data = await response.json();

      if (!data.translatedCV) {
        throw new Error('Invalid response from server');
      }

      // Store the preview
      setPreview(data.translatedCV);
      setSuccess(true);
    } catch (err) {
      console.error('Translation error:', err);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Apply the translation to the actual CV
  const handleApplyTranslation = () => {
    if (!preview) return;

    try {
      // Update personal info
      setPersonalInfo({
        ...cvData?.data?.personalInfo,
        ...preview.personalInfo,
      });

      // Update each section individually
      cvData?.data?.sections.forEach((section, index) => {
        if (index < preview.sections.length) {
          // Update section name if it changed
          if (section.name !== preview.sections[index].name) {
            updateSection(section.id, preview.sections[index].name);
          }

          // Update section entries
          updateSectionEntries(section.id, preview.sections[index].entries);
        }
      });

      // Show success message
      setSuccess(true);
      setPreview(null);
    } catch (err) {
      console.error('Error applying translation:', err);
      setError('Failed to apply translation to your CV');
    }
  };

  // Helper function to get language name from ID
  const getLanguageName = (langId: string): string => {
    const lang = languages.find((l) => l.id === langId);
    return lang ? lang.name : langId;
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">
            Translate Your CV
          </h2>
          <p className="text-gray-600 mt-1">
            Translate your entire CV into another language using AI
          </p>
        </div>

        <div className="space-y-6 bg-gray-50 p-6 rounded-lg border border-gray-200">
          <div>
            <label
              htmlFor="language"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Target Language
            </label>
            <select
              id="language"
              name="language"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={language}
              onChange={(e) => {
                setLanguage(e.target.value);
                setSuccess(false);
                setPreview(null);
                setError(null);
              }}
              disabled={isLoading}
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>
                  {lang.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the language you want to translate your CV into
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
              <FiAlertTriangle className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && !preview && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center gap-2">
              <FiCheck className="flex-shrink-0" />
              <span>
                Your CV has been successfully translated to{' '}
                {getLanguageName(language)}!
              </span>
            </div>
          )}

          {preview && (
            <div className="border border-blue-200 rounded-lg overflow-hidden">
              <div className="bg-blue-50 px-4 py-3 border-b border-blue-200">
                <h3 className="font-medium text-blue-700">
                  Translation Preview
                </h3>
              </div>
              <div className="p-4 max-h-60 overflow-y-auto bg-white">
                <h4 className="font-medium mb-2">Personal Information</h4>
                <div className="mb-4 text-sm">
                  <p>
                    <strong>Name:</strong> {preview.personalInfo.fullName}
                  </p>
                  <p>
                    <strong>Job Title:</strong> {preview.personalInfo.jobTitle}
                  </p>
                  {preview.personalInfo.summary && (
                    <p>
                      <strong>Summary:</strong> {preview.personalInfo.summary}
                    </p>
                  )}
                </div>

                <h4 className="font-medium mb-2">Sections</h4>
                <div className="space-y-3 text-sm">
                  {preview.sections.map((section: any, i: number) => (
                    <div key={i} className="border-b border-gray-100 pb-2">
                      <p>
                        <strong>{section.name}</strong>
                      </p>
                      {section.entries && section.entries.length > 0 && (
                        <p className="text-gray-500">
                          {section.entries.length} entries translated
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <Button
                  onClick={handleApplyTranslation}
                  className="w-full justify-center"
                >
                  Apply Translation
                </Button>
              </div>
            </div>
          )}

          <Button
            onClick={handleTranslate}
            disabled={isLoading}
            className="w-full py-2.5 flex justify-center items-center gap-2"
          >
            {isLoading ? (
              <>
                <FiLoader className="animate-spin" /> Translating...
              </>
            ) : (
              `Translate to ${getLanguageName(language)}`
            )}
          </Button>
        </div>

        <div className="mt-6 px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg">
          <h3 className="text-sm font-medium text-blue-800 mb-1">
            About Translation
          </h3>
          <p className="text-sm text-blue-700">
            We use AI to translate your CV content while preserving formatting
            and structure. The quality may vary depending on the language and AI
            service. Always review the translation before using it
            professionally.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TranslatePanel;
