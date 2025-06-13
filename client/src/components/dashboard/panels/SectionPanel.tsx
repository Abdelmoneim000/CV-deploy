import { useCvContext } from '../../../context/CvContext';
import { useState } from 'react';
import { FiEdit, FiTrash, FiPlus, FiSave } from 'react-icons/fi';
import Button from '../../ui/button';
import Dialog from '../../ui/dialog';

import {
  summarySection,
  projectsSection,
  educationSection,
  experienceSection,
  languagesSection,
  skillsSection,
  findMeOnlineSection,
} from '../../../lib/sections';

const predefinedSections = [
  summarySection,
  experienceSection,
  educationSection,
  languagesSection,
  projectsSection,
  skillsSection,
  findMeOnlineSection,
];

const SectionPanel = () => {
  const { cvData, addSection, removeSection, updateSection } = useCvContext();
  const sections = cvData?.data?.sections;

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [deletingSection, setDeletingSection] = useState<string | null>(null);
  const [creatingSection, setCreatingSection] = useState(false);

  const [tempName, setTempName] = useState('');

  const handleEditSave = () => {
    if (editingSection && tempName.trim()) {
      updateSection(editingSection, tempName.trim());
      setEditingSection(null);
    }
  };

  const isAlreadyAdded = (name: string) =>
    sections.some((section) => section.name === name);

  console.log(cvData);

  return (
    <div className="p-4 bg-white shadow h-full w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Sections</h2>
        <Button onClick={() => setCreatingSection(true)} variant="default">
          Add Section <FiPlus />
        </Button>
      </div>

      {/* Existing Sections List */}
      <div className="space-y-2 mb-6">
        {sections.map((section) => (
          <div
            key={section.id}
            className="flex justify-between items-center p-2 rounded hover:bg-gray-100"
          >
            <span className="truncate">{section.name}</span>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setEditingSection(section.id);
                  setTempName(section.name);
                }}
                variant="ghost"
                aria-label="Edit section"
              >
                <FiEdit className="text-gray-600" />
              </Button>
              <Button
                onClick={() => setDeletingSection(section.id)}
                variant="ghost"
                aria-label="Delete section"
              >
                <FiTrash className="text-red-600" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Section Dialog */}
      <Dialog
        isOpen={creatingSection}
        onClose={() => setCreatingSection(false)}
        title="Add New Section"
      >
        <div className="space-y-6">
          {/* Sections to Add */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Sections to add:</h3>
            {predefinedSections.some((s) => !isAlreadyAdded(s.name)) ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {predefinedSections.map((section) => {
                  if (isAlreadyAdded(section.name)) return null;
                  return (
                    <Button
                      key={section.id}
                      onClick={() => {
                        addSection(section);
                        setCreatingSection(false);
                      }}
                      variant="default"
                      className="w-full"
                    >
                      {section.name}
                    </Button>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 italic">No more sections to add.</p>
            )}
          </div>

          {/* Sections Already Added */}
          <div>
            <h3 className="mb-2 text-sm font-semibold">Sections added:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {predefinedSections
                .filter((section) => isAlreadyAdded(section.name))
                .map((section) => (
                  <Button
                    key={section.id}
                    variant="ghost"
                    disabled
                    className="w-full opacity-70 cursor-not-allowed"
                  >
                    {section.name}
                  </Button>
                ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <Button
              onClick={() => setCreatingSection(false)}
              variant="secondary"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Edit Section Dialog */}
      <Dialog
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        title="Edit Section"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={tempName}
            onChange={(e) => setTempName(e.target.value)}
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button onClick={() => setEditingSection(null)} variant="secondary">
              Cancel
            </Button>
            <Button onClick={handleEditSave} variant="default">
              Save <FiSave />
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!deletingSection}
        onClose={() => setDeletingSection(null)}
        title="Delete Section"
      >
        <div className="space-y-4">
          <p>Are you sure you want to delete this section?</p>
          <div className="flex justify-end gap-2">
            <Button
              onClick={() => setDeletingSection(null)}
              variant="secondary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (deletingSection) {
                  removeSection(deletingSection);
                  setDeletingSection(null);
                }
              }}
              variant="destructive"
            >
              Delete <FiTrash />
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default SectionPanel;
