import React from 'react';
import Button from '@/components/ui/button';
import { Job } from '@/types/JobBoard';

interface DeleteJobModalProps {
  isOpen: boolean;
  job: Job | null;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteJobModal: React.FC<DeleteJobModalProps> = ({
  isOpen,
  job,
  onClose,
  onConfirm,
}) => {
  if (!isOpen || !job) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-semibold mb-2">Delete Job Posting</h3>
        <p className="text-muted-foreground mb-4">
          Are you sure you want to delete "{job.title}"? This action cannot be
          undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Delete
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteJobModal;
