import { useState, useEffect, useMemo } from 'react';
import Button from '../../ui/button';
import { useCvContext } from '../../../context/CvContext';
import { omitKeys } from '../../../lib/utilities';
import useAuth from '@/hooks/useAuth';

interface SectionAnalysis {
  section: string;
  score: number;
  tips: string[];
  explanation: string;
}

interface AnalysisResult {
  sections: SectionAnalysis[];
  overallScore: number;
  topRecommendations: string[];
}

interface AnalysisState {
  targetPosition: string;
  cvData: object;
  result: AnalysisResult | null;
  error: string | null;
}

const AnalysisPanel = () => {
  const { cvData } = useCvContext();
  const {tokens} = useAuth();

  // Get the actual section names from the CV
  const existingSectionNames = useMemo(() => {
    return cvData?.data?.sections?.map((section) => section.name) || [];
  }, [cvData?.data?.sections]);

  // Clean CV data for API (remove unnecessary fields like IDs)
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

  const [state, setState] = useState<AnalysisState>({
    targetPosition: '',
    cvData: prepareCleanCvData(),
    result: null,
    error: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  // Update clean CV data when cvData changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      cvData: prepareCleanCvData(),
    }));
  }, [cvData]);

  const handleTargetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setState((prev) => ({ ...prev, targetPosition: e.target.value }));
    // Reset results when changing target position
    if (hasAnalyzed) {
      setState((prev) => ({ ...prev, result: null }));
      setHasAnalyzed(false);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setState((prev) => ({ ...prev, error: null }));

    try {
      // Validate that there's enough data to analyze
      if (
        !cvData?.data?.personalInfo ||
        !cvData?.data?.sections ||
        cvData?.data?.sections.length === 0
      ) {
        throw new Error(
          'Your CV needs more content before it can be analyzed. Add your personal information and at least one section.'
        );
      }

      const response = await fetch('/api/ai/analyze-cv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`, // Use the token from auth context
        },
        body: JSON.stringify({
          cv: state.cvData,
          jobPosition: state.targetPosition.trim() || undefined,
          service: 'claude',
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to analyze CV: ${response.status} ${response.statusText}${
            errorText ? ` - ${errorText}` : ''
          }`
        );
      }

      const data = await response.json();
      console.log('AI Analysis Result:', data);

      if (!data.analysis || !data.analysis.sections) {
        throw new Error('Invalid response from the server');
      }

      setState((prev) => ({ ...prev, result: data.analysis }));
      setHasAnalyzed(true);
    } catch (error) {
      console.error('Error:', error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to analyze CV',
      }));
    } finally {
      setIsLoading(false);
    }
  };

  // Filter the analysis results to only show existing sections
  const filteredResults = useMemo(() => {
    if (!state.result) return null;

    return {
      ...state.result,
      sections: state.result.sections.filter((section) => {
        // Keep sections that exist in the CV or Personal Information which is always included
        return (
          section.section === 'Personal Information' ||
          existingSectionNames.includes(section.section)
        );
      }),
    };
  }, [state.result, existingSectionNames]);

  // Helper functions for UI display
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-green-100 text-green-600';
    if (score >= 6) return 'bg-yellow-100 text-yellow-600';
    return 'bg-red-100 text-red-600';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Average';
    return 'Needs Improvement';
  };

  const getProgressColor = (score: number) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Generate a section title hint
  const getSectionHint = (section: string): string => {
    const sectionMap: Record<string, string> = {
      'Personal Information': 'Contact details and basic info',
      Summary: 'Your professional overview',
      Experience: 'Work history and roles',
      Education: 'Academic background',
      Skills: 'Technical and soft skills',
      Projects: 'Personal or professional projects',
      Languages: 'Language proficiency',
    };

    return sectionMap[section] || '';
  };

  // Helper function to detect missing critical sections
  const getMissingSections = (): string[] => {
    const criticalSections = ['Summary', 'Experience', 'Education', 'Skills'];
    return criticalSections.filter(
      (section) => !existingSectionNames.includes(section)
    );
  };

  return (
    <div className="w-full h-full bg-white overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold mb-2">Analyze your CV</h2>
        <p className="text-gray-700 mb-4">
          Our AI analysis assesses the quality of your CV and gives you
          personalized advice to improve it.
        </p>

        {/* Target Position Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Target position (optional)
          </label>
          <input
            type="text"
            value={state.targetPosition}
            onChange={handleTargetChange}
            placeholder="Ex: Front-end Web Developer"
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            Providing a target position helps tailor the analysis to specific
            job requirements
          </p>
        </div>

        {/* Add a warning about missing sections */}
        {getMissingSections().length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-yellow-700">
            <p className="text-sm font-medium mb-1">
              Missing recommended sections:
            </p>
            <ul className="text-sm list-disc pl-5">
              {getMissingSections().map((section) => (
                <li key={section}>
                  {section} - {getSectionHint(section)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button
          variant="default"
          className="w-full py-3"
          disabled={isLoading}
          onClick={handleSubmit}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
              Analyzing your CV...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z"
                  clipRule="evenodd"
                />
              </svg>
              Analyze CV
            </span>
          )}
        </Button>

        {state.error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center text-red-700">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2 flex-shrink-0"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{state.error}</span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-6 space-y-6">
          <div className="animate-pulse">
            <div className="flex justify-center">
              <div className="w-24 h-24 bg-gray-200 rounded-full mb-4"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-6"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      ) : filteredResults ? (
        <div>
          {/* Overall Score */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col items-center mb-6">
              <div
                className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-2 ${getScoreColor(
                  filteredResults.overallScore
                )}`}
              >
                {filteredResults.overallScore.toFixed(1)}
              </div>
              <span className="text-sm font-medium text-gray-600">
                {getScoreLabel(filteredResults.overallScore)}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
              <div
                className={`h-2.5 rounded-full ${getProgressColor(
                  filteredResults.overallScore
                )}`}
                style={{ width: `${filteredResults.overallScore * 10}%` }}
              ></div>
            </div>
          </div>

          {/* Section Scores - Now using filteredResults */}
          <div className="p-6 space-y-6">
            <h3 className="font-semibold text-gray-900 mb-4">Section Scores</h3>

            {filteredResults.sections.length > 0 ? (
              filteredResults.sections.map((section, index) => (
                <div
                  key={index}
                  className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
                >
                  <div className="flex justify-between items-center mb-1">
                    <div>
                      <span className="font-medium text-gray-800">
                        {section.section}
                      </span>
                      {getSectionHint(section.section) && (
                        <span className="text-xs text-gray-500 ml-2 inline-block">
                          {getSectionHint(section.section)}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold ${
                        section.score >= 8
                          ? 'text-green-600'
                          : section.score >= 6
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {section.score}/10
                    </span>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full ${getProgressColor(
                        section.score
                      )}`}
                      style={{ width: `${section.score * 10}%` }}
                    ></div>
                  </div>

                  <p className="text-sm text-gray-600 italic mb-3">
                    {section.explanation}
                  </p>

                  <div className="space-y-2 mt-2">
                    {section.tips.map((tip, tipIndex) => (
                      <div
                        key={tipIndex}
                        className="flex p-3 bg-white rounded-md border border-gray-100 shadow-sm"
                      >
                        <span className="text-blue-500 mr-2 flex-shrink-0">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z"
                              clipRule="evenodd"
                            />
                            <path
                              fillRule="evenodd"
                              d="M10 5a1 1 0 011 1v8a1 1 0 11-2 0V6a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                        <span className="text-sm text-gray-700">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-center text-gray-500">
                No sections to analyze. Add some sections to your CV first.
              </div>
            )}
          </div>

          {/* Top Recommendations */}
          <div className="p-6 bg-blue-50 border-t border-gray-200">
            <div className="flex items-center mb-4">
              <h3 className="font-semibold text-blue-800">
                Top Recommendations
              </h3>
            </div>

            <ul className="space-y-3 pl-6">
              {filteredResults.topRecommendations.map(
                (recommendation, index) => (
                  <li
                    key={index}
                    className="text-sm text-gray-700 relative before:content-['•'] before:absolute before:left-[-1rem] before:text-blue-500 before:text-lg before:font-bold"
                  >
                    {recommendation}
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Download Report Button */}
          <div className="p-6 border-t border-gray-200 flex justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => {
                // Create report content using filteredResults
                const reportContent = `
                  CV ANALYSIS REPORT
                  -----------------
                  Overall Score: ${filteredResults.overallScore.toFixed(
                    1
                  )}/10 - ${getScoreLabel(filteredResults.overallScore)}
                  
                  SECTION SCORES:
                  ${filteredResults.sections
                    .map(
                      (section) =>
                        `- ${section.section}: ${section.score}/10
                     ${section.explanation}
                     Tips:
                     ${section.tips.map((tip) => `• ${tip}`).join('\n')}
                    `
                    )
                    .join('\n\n')}
                  
                  TOP RECOMMENDATIONS:
                  ${filteredResults.topRecommendations
                    .map((rec, i) => `${i + 1}. ${rec}`)
                    .join('\n')}
                `;

                // Create blob and download
                const blob = new Blob([reportContent], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'CV_Analysis_Report.txt';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              Download Analysis Report
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-center text-gray-500">
          <div className="w-32 h-32 mb-6 text-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <h3 className="text-xl font-medium text-gray-700 mb-2">
            CV Analysis
          </h3>
          <p className="mb-4 text-gray-500 max-w-md">
            Click "Analyze CV" to get detailed feedback on your resume. Our AI
            will score each section and provide personalized improvement tips.
          </p>
          <div className="text-sm text-gray-400 border border-gray-200 rounded-lg p-4 bg-gray-50 max-w-md">
            <p>
              <strong>Tip:</strong> For more accurate results, specify your
              target position in the field above. This helps tailor
              recommendations to your desired role.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalysisPanel;
