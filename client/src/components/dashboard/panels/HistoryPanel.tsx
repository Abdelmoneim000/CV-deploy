import { useState, useEffect, useRef, useCallback } from 'react';
import {
  FiClock,
  FiChevronRight,
  FiCalendar,
  FiEdit,
  FiRotateCcw,
  FiEye,
  FiFileText,
  FiX,
  FiPlus,
  FiMinus,
  FiRefreshCw,
  FiSave,
  FiAlertCircle,
  FiCheck,
} from 'react-icons/fi';
import { useCvContext } from '../../../context/CvContext';
import { json } from 'stream/consumers';

// Define Version type to match our context
type Version = {
  id: number;
  description: string;
  createdAt: string;
  cvId: number;
  data: any;
  changes?: Array<{
    type: 'added' | 'modified' | 'removed';
    field: string;
    oldValue?: any;
    newValue?: any;
    timestamp?: string;
  }>;
};

// Modal component for creating a new version
type CreateVersionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (description: string) => Promise<void>;
};

const CreateVersionModal = ({
  isOpen,
  onClose,
  onSave,
}: CreateVersionModalProps) => {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Reset the form when opened
    setDescription('');

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!description.trim()) {
      // Show validation error
      return;
    }

    setIsLoading(true);
    try {
      await onSave(description);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-md w-full shadow-xl transform animate-scaleIn p-6"
      >
        <h2 className="text-lg font-semibold mb-4">Create New Version</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Version for IBM application"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isLoading || !description.trim()}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isLoading ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" /> Saving...
                </>
              ) : (
                <>
                  <FiSave className="mr-2" /> Save Version
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal component for displaying version details
type VersionModalProps = {
  version: Version;
  onClose: () => void;
  onRestore: (versionId: number) => Promise<void>;
};

const VersionModal = ({ version, onClose, onRestore }: VersionModalProps) => {
  const [isRestoring, setIsRestoring] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  if (!version) return null;

  interface FormatDate {
    (dateString: string): string;
  }

  const formatDate: FormatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getChangeIcon = (type) => {
    switch (type) {
      case 'added':
        return <FiPlus className="text-green-500" />;
      case 'removed':
        return <FiMinus className="text-red-500" />;
      case 'modified':
        return <FiRefreshCw className="text-amber-500" />;
      default:
        return null;
    }
  };

  const handleRestore = async () => {
    if (
      window.confirm(
        'Are you sure you want to restore this version? This will replace your current CV.'
      )
    ) {
      setIsRestoring(true);
      try {
        await onRestore(version.id);
        onClose();
      } finally {
        setIsRestoring(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-fadeIn">
      <div
        ref={modalRef}
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-auto shadow-xl transform animate-scaleIn"
      >
        <div className="sticky top-0 bg-white z-10 flex justify-between items-center p-3 border-b">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <FiClock className="text-primary" />{' '}
            {version.description || `Version ${version.id}`}
          </h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <FiCalendar className="text-primary" />
              {formatDate(version.createdAt)}
            </span>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-primary rounded-full p-1 hover:bg-gray-100 transition-colors"
            >
              <FiX size={18} />
            </button>
          </div>
        </div>

        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-5">
            {version.changes && version.changes.length > 0 ? (
              <div className="relative">
                <h3 className="font-medium text-base flex items-center gap-2 mb-3">
                  <FiEdit className="text-primary" /> Changes
                </h3>
                <div className="ml-2 relative">
                  {/* Timeline line */}
                  <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                  {/* Timeline items */}
                  <div className="space-y-4">
                    {version.changes.map((change, idx) => (
                      <div key={idx} className="relative pl-8">
                        {/* Timeline dot */}
                        <div
                          className={`absolute left-0 top-0 mt-1.5 w-6 h-6 rounded-full flex items-center justify-center ${
                            change.type === 'added'
                              ? 'bg-green-100'
                              : change.type === 'removed'
                              ? 'bg-red-100'
                              : 'bg-amber-100'
                          }`}
                        >
                          {getChangeIcon(change.type)}
                        </div>

                        {/* Content */}
                        <div className="bg-white p-2.5 rounded-lg border shadow-sm hover:shadow-md transition-shadow">
                          <div className="font-medium text-sm">
                            {change.field}
                          </div>
                          <div className="text-xs text-gray-600">
                            {change.type === 'added'
                              ? 'Added new content'
                              : change.type === 'removed'
                              ? 'Removed content'
                              : 'Modified content'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 border">
                <div className="flex items-center gap-2 text-gray-500">
                  <FiAlertCircle />
                  <p>
                    No detailed change information available for this version.
                  </p>
                </div>
              </div>
            )}

            <div>
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="w-full bg-primary text-white py-2.5 px-4 rounded-md flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-95 transition-all shadow-sm disabled:opacity-50"
              >
                {isRestoring ? (
                  <>
                    <FiRefreshCw className="animate-spin" /> Restoring...
                  </>
                ) : (
                  <>
                    <FiRotateCcw /> Restore This Version
                  </>
                )}
              </button>
              <p className="text-xs text-gray-500 text-center mt-1.5">
                This will replace your current resume with this version
              </p>
            </div>
          </div>

          <div>
            <h3 className="font-medium text-base flex items-center gap-2 mb-3">
              <FiEye className="text-primary" /> Preview
            </h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
              {/* Here we could show a preview of the CV, but for now we'll use a placeholder */}
              <div className="bg-gray-100 p-6 flex items-center justify-center min-h-[300px]">
                <div className="text-center text-gray-500">
                  <FiFileText className="mx-auto text-4xl mb-2" />
                  <p>Preview not available</p>
                  <p className="text-xs">
                    Version data is stored and can be restored
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryPanel = () => {
  const {
    createVersion,
    getVersions,
    restoreVersion,
    currentCVId,
    saveCV,
    isLoading: contextLoading,
    loadCV, // ✅ Make sure this is available
    cvData, // ✅ Add cvData to track changes
  } = useCvContext();
  const [versions, setVersions] = useState<Version[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<Version | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Memoize the loadVersions function so it doesn't change on each render
  const loadVersions = useCallback(async () => {
    if (!currentCVId) {
      setError('Please save your CV first to view version history.');
      return;
    }

    setIsLoading(true);
    setError('');
    try {
      const loadedVersions = await getVersions();
      setVersions(loadedVersions);
    } catch (err) {
      console.error('Error loading versions:', err);
      setError('Failed to load versions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentCVId]);

  // Use a separate useEffect for the initial load
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handleCreateVersion = async (description: string) => {
    if (!currentCVId) {
      setError('Please save your CV first to create a version.');
      return;
    }

    try {
      // ✅ First save the current CV to ensure latest changes are persisted
      await saveCV();
      
      // ✅ Create the version
      const newVersion = await createVersion(description);
      
      if (newVersion) {
        // ✅ Force reload the CV from database to ensure consistency
        await loadCV(currentCVId);
        
        // ✅ Refresh the versions list
        const updatedVersions = await getVersions();
        setVersions(updatedVersions);
        
        // ✅ Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error('Error creating version:', err);
      setError('Failed to create version. Please try again.');
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      setError('');
      
      // ✅ Restore the version
      const success = await restoreVersion(versionId);
      
      if (success) {
        localStorage.setItem('currentVersionId', `${versionId}`);
        
        // ✅ Force reload the CV to reflect the restored version
        if (currentCVId) {
          await loadCV(currentCVId);
        }
        
        // ✅ Show success message
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
        
        // ✅ Refresh versions list
        await loadVersions();
      }
    } catch (err) {
      console.error('Error restoring version:', err);
      setError('Failed to restore version. Please try again.');
    }
  };

  const handleVersionClick = (version: Version) => {
    setSelectedVersion(version);
  };

  const handleCloseModal = () => {
    setSelectedVersion(null);
  };

  const handleSaveCV = async () => {
    try {
      setIsSaving(true);
      setError('');
      const cvId = await saveCV();

      // Show success message temporarily
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

      // Refresh versions after saving
      if (cvId) {
        const updatedVersions = await getVersions();
        setVersions(updatedVersions);
      }
    } catch (err) {
      console.error('Error saving CV:', err);
      setError('Failed to save CV. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get the change count by type
  const getChangeCounts = (changes) => {
    if (!changes || !Array.isArray(changes))
      return { added: 0, removed: 0, modified: 0 };

    const counts = { added: 0, removed: 0, modified: 0 };
    changes.forEach((change) => {
      if (change.type in counts) {
        counts[change.type]++;
      }
    });
    return counts;
  };

  const isGlobalLoading = isLoading || contextLoading;

  return (
    <div className="w-full min-h-full bg-white p-4">
      <div className="space-y-3">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <FiClock className="text-primary" /> Resume History
          </h2>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveCV}
              // disabled={!!currentCVId || isGlobalLoading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm flex items-center gap-1.5 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? (
                <>
                  <FiRefreshCw className="animate-spin" size={14} />
                  Saving...
                </>
              ) : (
                <>
                  <FiSave size={14} />
                  Save CV
                </>
              )}
            </button>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!currentCVId || isGlobalLoading}
              className="px-3 py-1.5 bg-primary text-white rounded-md text-sm flex items-center gap-1.5 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiSave size={14} />
              Save Current Version
            </button>
          </div>
        </div>

        {saveSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md flex items-start gap-2 animate-fadeIn">
            <FiCheck className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">CV saved successfully!</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!currentCVId && !error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-md flex items-start gap-2">
            <FiAlertCircle className="mt-0.5 flex-shrink-0" />
            <p className="text-sm">
              Please save your CV first to use version history.
            </p>
          </div>
        )}

        <p className="text-sm text-gray-600 mb-3">
          {versions.length > 0
            ? `You have ${versions.length} previous version${
                versions.length !== 1 ? 's' : ''
              } of your resume saved.`
            : 'No versions saved yet. Create a version to keep track of your changes.'}
        </p>

        {isGlobalLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin">
              <FiRefreshCw className="text-primary text-2xl" />
            </div>
          </div>
        ) : versions.length > 0 ? (
          <div className="space-y-2.5 grid grid-cols-1 gap-2.5">
            {versions.map((version) => {
              const counts = getChangeCounts(version.changes);
              return (
                <div
                  key={version.id}
                  onClick={() => handleVersionClick(version)}
                  className="p-3 border border-gray-200 rounded-md hover:border-primary hover:shadow-sm transition-all cursor-pointer flex items-center group"
                >
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-50 rounded-md flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                    <FiFileText className="text-primary" />
                  </div>

                  <div className="flex-grow">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {version.description || `Version ${version.id}`}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <FiCalendar className="text-gray-400" />
                        {formatDate(version.createdAt)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 mt-1">
                      {version.changes && version.changes.length > 0 ? (
                        <>
                          <div className="text-xs text-gray-600">
                            {version.changes.length} changes
                          </div>
                          <div className="flex gap-1.5">
                            {counts.added > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-green-600">
                                <FiPlus size={10} /> {counts.added}
                              </span>
                            )}
                            {counts.removed > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-red-600">
                                <FiMinus size={10} /> {counts.removed}
                              </span>
                            )}
                            {counts.modified > 0 && (
                              <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                                <FiRefreshCw size={10} /> {counts.modified}
                              </span>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-600">
                          Full CV snapshot
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-2 w-6 h-6 flex items-center justify-center rounded-full bg-gray-50 group-hover:bg-primary/10 transition-colors">
                    <FiChevronRight className="text-primary" size={16} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : !error && currentCVId ? (
          <div className="text-center py-8 text-gray-500 border border-dashed rounded-md">
            <FiClock className="mx-auto text-3xl text-gray-300 mb-2" />
            <p>No versions saved yet.</p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-3 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm inline-flex items-center gap-1.5"
            >
              <FiSave size={14} />
              Create your first version
            </button>
          </div>
        ) : null}
      </div>

      {selectedVersion && (
        <VersionModal
          version={selectedVersion}
          onClose={handleCloseModal}
          onRestore={handleRestoreVersion}
        />
      )}

      <CreateVersionModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateVersion}
      />

      {/* Add animation keyframes for the modal */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }
          @keyframes scaleIn {
            from {
              transform: scale(0.95);
              opacity: 0;
            }
            to {
              transform: scale(1);
              opacity: 1;
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
          .animate-scaleIn {
            animation: scaleIn 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default HistoryPanel;
