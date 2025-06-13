import { useState, useMemo } from 'react';
import { useCvContext } from '../../../context/CvContext';
import type { TemplateName } from '../../../types/cv';

// Importing images for templates
import classic from '../../../assets/cv-templates/Classic.png';
import compact from '../../../assets/cv-templates/Compact.png';
import contemporary from '../../../assets/cv-templates/Contemporary.png';
import double from '../../../assets/cv-templates/Double.png';
import doubleColored from '../../../assets/cv-templates/DoubleColored.png';
import elegant from '../../../assets/cv-templates/Elegant.png';
import highPerformer from '../../../assets/cv-templates/highPerformer.png';
import minimal from '../../../assets/cv-templates/Minimal.png';
import polished from '../../../assets/cv-templates/Polished.png';
import stylish from '../../../assets/cv-templates/Stylish.png';
import timeline from '../../../assets/cv-templates/Timeline.png';
import single from '../../../assets/cv-templates/Single.png';
import ivyleague from '../../../assets/cv-templates/ivyleague.png';
import multicolumn from '../../../assets/cv-templates/Multicolumn.png';
import modern from '../../../assets/cv-templates/Modern.png';

const categories = [
  { id: 'all', name: 'All' },
  { id: 'modern', name: 'Modern' },
  { id: 'professional', name: 'Professional' },
  { id: 'creative', name: 'Creative' },
  { id: 'minimal', name: 'Minimal' },
  { id: 'academic', name: 'Academic' },
];

const templatesList = [
  {
    id: 'classic',
    name: 'Classic',
    category: 'modern',
    image: classic,
  },
  {
    id: 'single',
    name: 'Single',
    category: 'academic',
    image: single,
  },
  {
    id: 'ivyleague',
    name: 'Ivy League',
    category: 'academic',
    image: ivyleague,
  },
  {
    id: 'modern',
    name: 'Modern',
    category: 'modern',
    image: modern,
  },
  {
    id: 'compact',
    name: 'Compact',
    category: 'professional',
    image: compact,
  },
  {
    id: 'contemporary',
    name: 'Contemporary',
    category: 'creative',
    image: contemporary,
  },
  {
    id: 'double',
    name: 'Double',
    category: 'minimal',
    image: double,
  },
  {
    id: 'doubleColored',
    name: 'Double Colored',
    category: 'modern',
    image: doubleColored,
  },
  {
    id: 'elegant',
    name: 'Elegant',
    category: 'professional',
    image: elegant,
  },
  {
    id: 'highPerformer',
    name: 'High Performer',
    category: 'professional',
    image: highPerformer,
  },
  {
    id: 'minimal',
    name: 'Minimal',
    category: 'minimal',
    image: minimal,
  },
  {
    id: 'multicolumn',
    name: 'Multi Column',
    category: 'academic',
    image: multicolumn,
  },
  {
    id: 'polished',
    name: 'Polished',
    category: 'modern',
    image: polished,
  },
  {
    id: 'stylish',
    name: 'Stylish',
    category: 'creative',
    image: stylish,
  },
  {
    id: 'timeline',
    name: 'Timeline',
    category: 'minimal',
    image: timeline,
  },
];

const ModelsPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { cvData, setTheme } = useCvContext();
  // Add a fallback empty object for theme to prevent undefined errors
  const theme = cvData?.data?.theme || {};

  const handleTemplateClick = (templateId: string) => {
    const selectedTemplate = templatesList.find(
      (template) => template.id === templateId
    );
    if (selectedTemplate) {
      setTheme({ ...theme, templateName: selectedTemplate.id as TemplateName });
    }
  };

  const filteredTemplates = useMemo(() => {
    return templatesList.filter((template) => {
      const matchesCategory =
        selectedCategory === 'all' || template.category === selectedCategory;
      const matchesSearch = template.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="space-y-4 w-full min-h-full bg-white p-4">
      <h2 className="text-lg font-semibold">CV Models</h2>

      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
          🔍
        </span>
        <input
          type="text"
          placeholder="Find model..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 pr-8 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-black"
          >
            ❌
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              rounded-full px-4 py-2 text-xs font-semibold cursor-pointer
              ${
                selectedCategory === category.id
                  ? 'bg-primary text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }
                `}
          >
            {category.name}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white shadow hover:shadow-md transition-shadow"
            onClick={() => handleTemplateClick(template.id)}
          >
            <div className="relative">
              <img
                src={template.image}
                alt={template.name}
                className="h-40 w-full object-cover transition-transform duration-300 hover:scale-105"
              />
              <div
                className={`absolute bottom-0 left-0 w-full ${
                  theme?.templateName === template.id
                    ? 'bg-primary/50'
                    : 'bg-gray-800/50'
                } px-2 py-1 text-center text-sm text-white font-semibold`}
              >
                {template.name}
              </div>
            </div>
          </div>
        ))}
        {filteredTemplates.length === 0 && (
          <div className="col-span-2 text-center text-gray-500">
            No templates found.
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelsPanel;
