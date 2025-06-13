import { useState } from 'react';
import { FiSave, FiCheck, FiAlertTriangle } from 'react-icons/fi';
import { useCvContext } from '../../context/CvContext';
import Button from './Button';

interface SaveButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  showLabel?: boolean;
}

const SaveButton = ({ 
  className = '',
  variant = 'default',
  showLabel = true
}: SaveButtonProps) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Get the saveCV function from context
  const { saveCV } = useCvContext();
  
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      // Call the saveCV function from context
      const cvId = await saveCV();
      
      // Show success message
      setSaveSuccess(true);
      
      // Hide success message after 2 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
      console.log('CV saved successfully with ID:', cvId);
    } catch (err) {
      console.error('Error saving CV:', err);
      setSaveError('Failed to save CV');
      
      // Hide error after 3 seconds
      setTimeout(() => {
        setSaveError(null);
      }, 3000);
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="relative">
      <Button
        variant={variant}
        className={`${className} flex items-center gap-2`}
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <>
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {showLabel && "Saving..."}
          </>
        ) : (
          <>
            <FiSave size={18} />
            {showLabel && "Save CV"}
          </>
        )}
      </Button>
      
      {/* Floating notification for success */}
      {saveSuccess && (
        <div className="absolute bottom-full mb-2 right-0 bg-green-50 border border-green-200 rounded-md py-2 px-3 shadow-md whitespace-nowrap z-10">
          <div className="flex items-center text-green-700 text-sm">
            <FiCheck className="mr-2" />
            <span>CV saved successfully!</span>
          </div>
        </div>
      )}
      
      {/* Floating notification for error */}
      {saveError && (
        <div className="absolute bottom-full mb-2 right-0 bg-red-50 border border-red-200 rounded-md py-2 px-3 shadow-md whitespace-nowrap z-10">
          <div className="flex items-center text-red-700 text-sm">
            <FiAlertTriangle className="mr-2" />
            <span>{saveError}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default SaveButton;