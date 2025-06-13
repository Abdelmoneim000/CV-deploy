import React, { useState, useEffect, useRef } from 'react';
import { AiOutlineClose, AiOutlineFileText } from 'react-icons/ai';
import { Job } from './discover/JobCard';
import { jobApplicationService } from '../../services/jobApplicationService';
import useAuth from '@/hooks/useAuth';

interface JobApplicationModalProps {
  job: Job | null;
  isOpen: boolean;
  onClose: () => void;
  onApplicationSubmitted: (applicationId: string) => void;
}

interface UserCV {
  id: string;
  title: string;
  fileName: string;
  updatedAt: string;
}

const JobApplicationModal: React.FC<JobApplicationModalProps> = ({
  job,
  isOpen,
  onClose,
  onApplicationSubmitted,
}) => {
  const [coverLetter, setCoverLetter] = useState('');
  const [additionalNotes, setAdditionalNotes] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selectedResumeId, setSelectedResumeId] = useState('');
  const [userCVs, setUserCVs] = useState<UserCV[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { tokens } = useAuth();

  // Ref for the modal content
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && job) {
      // Load user's CVs - you'll need to implement this API call
      loadUserCVs();
      // Reset form
      setCoverLetter('');
      setSelectedResumeId('');
      setError('');

      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore body scroll when modal is closed
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, job]);

  // Handle click outside modal
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  const loadUserCVs = async () => {
    try {
      setUserCVs([
        {
          id: '1',
          title: 'Software Developer Resume',
          fileName: 'john_doe_resume.pdf',
          updatedAt: '2024-01-15T10:30:00Z',
        },
        {
          id: '2',
          title: 'Frontend Developer CV',
          fileName: 'john_doe_frontend_cv.pdf',
          updatedAt: '2024-01-10T14:20:00Z',
        },
      ]);
    } catch (error) {
      console.error('Failed to load CVs:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!job || !selectedResumeId) {
      setError('Please select a resume/CV to submit with your application.');
      return;
    }

    // Require at least 50 characters in the cover letter
    if (coverLetter.trim().length < 50) {
      setError('Your cover letter must be at least 50 characters.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Build the request payload as per API docs
      const payload = {
        cvId: selectedResumeId,
        coverLetter: coverLetter.trim(),
        additionalNotes: additionalNotes.trim() || undefined,
        portfolioUrl: portfolioUrl.trim() || undefined,
      };

      const response = await fetch(
        `http://localhost:8888/api/jobs/${job.id}/apply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        onApplicationSubmitted(data.data.id);
        onClose();
      } else {
        setError(
          data.error || 'Failed to submit application. Please try again.'
        );
      }
    } catch (error: any) {
      setError(
        error.response?.data?.error ||
          'Failed to submit application. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render anything if modal is not open or job is null
  if (!isOpen || !job) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300 min-h-screen"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        ref={modalRef}
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-background border border-border rounded-lg shadow-xl z-[70] w-full max-w-2xl max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside modal from closing it
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border bg-card">
          <div>
            <h2 className="text-xl font-semibold">Apply for Position</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {job.title} at {job.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            type="button"
          >
            <AiOutlineClose size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Resume Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Select Resume/CV *
              </label>
              <div className="space-y-2">
                {userCVs.map((cv) => (
                  <label
                    key={cv.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedResumeId === cv.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resumeId"
                      value={cv.id}
                      checked={selectedResumeId === cv.id}
                      onChange={(e) => setSelectedResumeId(e.target.value)}
                      className="text-primary"
                    />
                    <AiOutlineFileText
                      size={20}
                      className="text-muted-foreground"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{cv.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {cv.fileName} • Updated{' '}
                        {new Date(cv.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              {userCVs.length === 0 && (
                <div className="text-center py-8">
                  <AiOutlineFileText
                    size={48}
                    className="mx-auto text-muted-foreground mb-4"
                  />
                  <p className="text-sm text-muted-foreground mb-4">
                    No CVs found. Please create a CV first before applying for
                    jobs.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      // Navigate to CV creation page
                      window.location.href = '/cv-builder';
                    }}
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    Create Your First CV
                  </button>
                </div>
              )}
            </div>

            {/* Cover Letter */}
            {userCVs.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Cover Letter
                </label>
                <textarea
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  placeholder="Write a personalized message to the employer..."
                  rows={6}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {coverLetter.length}/1000 characters
                </p>
                {coverLetter.trim().length < 50 && (
                  <p className="text-xs text-red-500 mt-1">
                    Please enter at least 50 characters in your cover letter.
                  </p>
                )}
              </div>
            )}

            {/* Additional Notes */}
            {userCVs.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="Any extra info for the employer (e.g. availability, preferences)..."
                  rows={3}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {additionalNotes.length}/500 characters
                </p>
              </div>
            )}

            {/* Portfolio URL */}
            {userCVs.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Portfolio URL (Optional)
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://yourportfolio.com"
                  className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  maxLength={200}
                />
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={
                  isSubmitting || !selectedResumeId || userCVs.length === 0
                }
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default JobApplicationModal;
