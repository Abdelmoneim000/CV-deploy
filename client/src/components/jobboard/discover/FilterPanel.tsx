import React from 'react';
import { AiOutlineClose } from 'react-icons/ai';

interface FilterPanelProps {
  selectedSalary: string;
  setSelectedSalary: (salary: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedSkills: string[];
  setSelectedSkills: (skills: string[]) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  selectedSalary,
  setSelectedSalary,
  selectedType,
  setSelectedType,
  selectedSkills,
  setSelectedSkills,
}) => {
  const popularSkills = [
    'React',
    'TypeScript',
    'Python',
    'Node.js',
    'AWS',
    'Docker',
    'GraphQL',
    'MongoDB',
  ];

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const clearAllFilters = () => {
    setSelectedSalary('');
    setSelectedType('');
    setSelectedSkills([]);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Advanced Filters</h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Clear All
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Salary Range */}
        <div>
          <label className="block text-sm font-medium mb-2">Salary Range</label>
          <select
            value={selectedSalary}
            onChange={(e) => setSelectedSalary(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Any Salary</option>
            <option value="50-80">$50k - $80k</option>
            <option value="80-120">$80k - $120k</option>
            <option value="120-150">$120k - $150k</option>
            <option value="150+">$150k+</option>
          </select>
        </div>

        {/* Job Type */}
        <div>
          <label className="block text-sm font-medium mb-2">Job Type</label>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Freelance">Freelance</option>
            <option value="Internship">Internship</option>
          </select>
        </div>

        {/* Experience Level */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Experience Level
          </label>
          <select className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary">
            <option value="">Any Level</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead/Principal</option>
          </select>
        </div>
      </div>

      {/* Skills */}
      <div className="mt-6">
        <label className="block text-sm font-medium mb-2">Skills</label>
        <div className="flex flex-wrap gap-2">
          {popularSkills.map((skill) => (
            <button
              key={skill}
              onClick={() => toggleSkill(skill)}
              className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                selectedSkills.includes(skill)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              {skill}
              {selectedSkills.includes(skill) && (
                <AiOutlineClose size={12} className="ml-1 inline" />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
