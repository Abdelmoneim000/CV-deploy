import { useState, useMemo } from 'react';
import { useCvContext } from '../../../context/CvContext';
import Button from '../../ui/Button';
import useAuth from '@/hooks/useAuth';

const ReviseTextPanel = () => {
  const { cvData, updateSectionEntries } = useCvContext();
  const {tokens} = useAuth();
  // Set default to empty string, will be set to first section in useEffect
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviewResult, setReviewResult] = useState<null | {
    issues: string[];
    suggestion: string;
    improvedText: string;
  }>(null);
  // Get the selected section
  const selectedSection = useMemo(
    () => cvData?.data?.sections.find((s) => s.id === selectedSectionId),
    [selectedSectionId, cvData?.data?.sections]
  );

  // Set first section as default when component mounts
  useMemo(() => {
    if (!selectedSectionId && cvData?.data?.sections.length > 0) {
      setSelectedSectionId(cvData?.data?.sections[0].id);
    }
  }, [cvData?.data?.sections, selectedSectionId]);

  const entries = useMemo(
    () => selectedSection?.entries || [],
    [selectedSection]
  );

  const capitalize = (str: string) =>
    str.charAt(0).toUpperCase() + str.slice(1);

  const entriesToText = () => {
    if (!selectedSection) return '';

    if (
      selectedSection.id === 'education' ||
      selectedSection.id === 'experience'
    ) {
      return entries
        .map((entry: any, i) => {
          if (
            typeof entry === 'object' &&
            entry !== null &&
            entry.description
          ) {
            return `${entry.description}`;
          }
          return '';
        })
        .filter((text) => text.length > 0)
        .join('\n\n');
    }

    return entries
      .map((entry, i) => {
        if (typeof entry === 'object' && entry !== null) {
          const formatted = Object.entries(entry)
            .map(([key, value]) => `${capitalize(key)}: ${value}`)
            .join('\n');
          return `Entry ${i + 1}:\n${formatted}`;
        }
        return `Entry ${i + 1}: ${String(entry)}`;
      })
      .join('\n\n');
  };

  const validateBeforeReview = () => {
    if (!selectedSection) {
      setError('No section selected.');
      return false;
    }

    if (!entries || entries.length === 0) {
      setError('No entries found in this section.');
      return false;
    }

    if (
      (selectedSection.id === 'education' ||
        selectedSection.id === 'experience') &&
      !entries.some((e: any) => e.description)
    ) {
      setError('No descriptions found in this section to revise.');
      return false;
    }

    return true;
  };

  const handleReview = async () => {
    if (!validateBeforeReview()) return;

    setLoading(true);
    setError(null);
    setReviewResult(null);

    try {
      const textToReview = entriesToText();

      if (!textToReview.trim()) {
        setError('No text to review.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/ai/review-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokens?.accessToken}` },
        body: JSON.stringify({
          text: textToReview,
          sectionType: 'general',
          service: 'claude',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || 'AI service failed to process the request.'
        );
      }

      const data = await response.json();

      if (!data || !data.improvedText) {
        setError('The AI did not return any suggestions.');
        return;
      }

      setReviewResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
      console.error('Error during text revision:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!reviewResult || !selectedSection) return;

    try {
      if (selectedSection.id === 'summary') {
        // Fix: Update with the correct 'summary' property that CvSummary expects
        updateSectionEntries(selectedSectionId, [
          { summary: reviewResult.improvedText },
        ]);
      } else if (
        selectedSection.id === 'education' ||
        selectedSection.id === 'experience'
      ) {
        const updated = entries.map((entry: any) => {
          if (
            typeof entry === 'object' &&
            entry !== null &&
            entry.description
          ) {
            return {
              ...entry,
              description: reviewResult.improvedText,
            };
          }
          return entry;
        });
        updateSectionEntries(selectedSectionId, updated);
      } else {
        if (entries.length > 0) {
          const firstEntry = entries[0];
          const otherEntries = entries.slice(1);

          let updatedFirstEntry;
          if (typeof firstEntry === 'object' && firstEntry !== null) {
            const mainField =
              Object.keys(firstEntry).find((k) =>
                ['content', 'description', 'text', 'value'].includes(k)
              ) || Object.keys(firstEntry)[0];

            updatedFirstEntry = {
              ...firstEntry,
              [mainField]: reviewResult.improvedText,
            };
          } else {
            // Wrap string in an object with a default key
            updatedFirstEntry = { value: reviewResult.improvedText };
          }

          updateSectionEntries(selectedSectionId, [
            updatedFirstEntry,
            ...otherEntries,
          ]);
        }
      }

      setReviewResult(null);
      setError(null);
    } catch (err) {
      console.error('Error applying suggestions:', err);
      setError('Failed to apply the suggested changes.');
    }
  };

  return (
    <div className="w-full h-full bg-white shadow-lg rounded-lg overflow-y-auto border border-gray-100">
      <div className="p-6 border-b border-gray-150">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg text-xl">✨</div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              AI-Powered Text Revision
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Improve your section content using AI
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Section
            </label>
            <select
              value={selectedSectionId}
              onChange={(e) => {
                setSelectedSectionId(e.target.value);
                setReviewResult(null);
                setError(null);
              }}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              {cvData?.data?.sections.map((section) => (
                <option key={section.id} value={section.id}>
                  {section.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Text Preview
            </label>
            <textarea
              readOnly
              rows={8}
              className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-sm text-gray-700 resize-none"
              value={entriesToText()}
            />
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex gap-2">
              ❗ {error}
            </div>
          )}

          <Button
            className="w-full h-11 flex items-center justify-center gap-2"
            onClick={handleReview}
            disabled={loading}
          >
            {loading ? '🔄 Analyzing...' : '🔍 Review Text'}
          </Button>

          {reviewResult && (
            <div className="space-y-6 border-t border-gray-100 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                ✅ Analysis Results
              </h3>

              <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-orange-700 mb-2">
                  ⚠️ Potential Issues
                </h4>
                <ul className="list-disc pl-5 space-y-1 text-sm text-orange-700">
                  {reviewResult.issues.length === 0 ? (
                    <li>No critical issues detected</li>
                  ) : (
                    reviewResult.issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))
                  )}
                </ul>
              </div>

              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  ✨ Suggested Improvement
                </h4>
                <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm mb-3">
                  {reviewResult.suggestion}
                </div>
                <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 mb-2">
                    Improved Text
                  </div>
                  <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {reviewResult.improvedText}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setReviewResult(null)}
                >
                  🚫 Discard
                </Button>
                <Button className="flex-1" onClick={handleApply}>
                  ✅ Apply
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviseTextPanel;
