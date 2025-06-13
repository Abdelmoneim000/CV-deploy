import { useState, useEffect } from 'react';
import Button from '../../ui/button';
import { useCvContext } from '../../../context/CvContext';
import useAuth from '@/hooks/useAuth';

const SharePanel = () => {
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [hasCreatedLink, setHasCreatedLink] = useState(false);
  const [error, setError] = useState('');
  const { cvData } = useCvContext();
  const { tokens } = useAuth();

  // Load previously created share link from localStorage when component mounts
  useEffect(() => {
    const cvId = localStorage.getItem('currentCVId');
    const storedShareUrl = localStorage.getItem(`cv_share_url_${cvId}`);

    if (storedShareUrl) {
      setShareUrl(storedShareUrl);
      setHasCreatedLink(true);
    }
  }, [cvData.userId]);

  const handleCreateShareLink = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Get the CV ID from context, or use a default for testing
      const cvId = localStorage.getItem('currentVersionId');

      const response = await fetch(`/cvs/${cvId}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`, // Use the token from auth context
        },
      });

      if (!response.ok) {
        console.error(response);
        throw new Error('Failed to create share link');
      }

      const data = await response.json();
      console.log('Share link created:', data);

      // The API returns the full URL, but we might want to display a more user-friendly URL
      // Extract the token from the URL
      const token = data.shareUrl.split('/').pop();

      // Create a user-friendly URL that points to our frontend share view
      const fullShareUrl = `${window.location.origin}/shareCv/${token}`;

      // Save to state and localStorage for persistence
      setShareUrl(fullShareUrl);
      console.log(fullShareUrl);
      localStorage.setItem(`cv_share_url_${cvId}`, fullShareUrl);

      setHasCreatedLink(true);
    } catch (error) {
      console.error('Error creating share link:', error);
      setError('Failed to create share link. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      setError('Failed to copy to clipboard');
    }
  };

  const handleGenerateNewLink = async () => {
    // Clear the existing link first
    setShareUrl('');
    setHasCreatedLink(false);
    // Then create a new one
    await handleCreateShareLink();
  };

  return (
    <div className="w-full min-h-full p-4 space-y-4 bg-white">
      <h2 className="text-xl font-semibold">Share your CV</h2>
      <p className="text-sm text-gray-600">
        Create a shareable link to your CV. You can send this link to anyone you
        want to share your CV with.
      </p>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded-md">
          {error}
        </div>
      )}

      {hasCreatedLink ? (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label htmlFor="share-url" className="text-sm font-medium block">
              Shareable link
            </label>
            <button
              onClick={handleGenerateNewLink}
              className="text-xs text-indigo-600 hover:text-indigo-800"
              disabled={isLoading}
            >
              Generate new link
            </button>
          </div>
          <input
            id="share-url"
            type="text"
            value={shareUrl}
            readOnly
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <Button
            onClick={handleCopyLink}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
            disabled={isCopied}
          >
            {isCopied ? 'Copied!' : 'Copy link'}
          </Button>
          <p className="text-xs text-gray-500">
            People with this link can view your CV in read-only mode. The link
            will remain active until you regenerate it.
          </p>
        </div>
      ) : (
        <Button
          onClick={handleCreateShareLink}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Creating link...' : 'Create share link'}
        </Button>
      )}
    </div>
  );
};

export default SharePanel;
