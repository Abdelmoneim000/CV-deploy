import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useCvContext } from '../context/CvContext';
import TemplateRender from '@/components/dashboard/TemplateRender';

const TemplatePreview = () => {
  const { token } = useParams();
  const { setCvData } = useCvContext();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedCV = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/cvs/share/${token}`);

        if (!response.ok) {
          throw new Error(
            response.status === 404
              ? 'Shared CV not found'
              : 'Failed to load the shared CV'
          );
        }

        console.log(response);

        const cvData = await response.json();
        console.log('Shared CV data:', cvData);
        setCvData(cvData);
      } catch (err) {
        console.error('Error fetching shared CV:', err);
        setError(
          err instanceof Error ? err.message : 'An unexpected error occurred'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchSharedCV();
    } else {
      setError('Invalid share link');
      setLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with watermark or share info */}
      <div className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-xl font-semibold">Shared CV Preview</h1>
        <div className="text-sm text-gray-500">Read-only mode</div>
      </div>

      {/* CV Display */}
      <div className="max-w-5xl mx-auto my-8 p-4">
        <div className="relative bg-white shadow-lg rounded-lg overflow-hidden">
          <TemplateRender editable={false} setIsPanelOpen={() => {}} />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-gray-100 p-4 text-center text-sm text-gray-600 mt-auto">
        <p>This is a shared CV in read-only mode</p>
        <p className="mt-2">
          <a href="/" className="text-blue-600 hover:underline">
            Create your own CV
          </a>
        </p>
      </div>
    </div>
  );
};

export default TemplatePreview;
