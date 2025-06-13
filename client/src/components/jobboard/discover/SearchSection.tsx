import React from 'react';
import {
  AiOutlineSearch,
  AiOutlineFilter,
  AiOutlineClose,
} from 'react-icons/ai';
import Input from '@/components/ui/Input';

interface SearchSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedLocation: string;
  setSelectedLocation: (location: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  searchQuery,
  setSearchQuery,
  selectedLocation,
  setSelectedLocation,
  showFilters,
  setShowFilters,
}) => {
  const handleClearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className="bg-gradient-to-r from-primary/10 to-blue-500/10 border border-primary/20 rounded-lg p-6">
      <div className="mb-4">
        <h2 className="text-2xl font-bold mb-2">Find Your Dream Job</h2>
        <p className="text-muted-foreground">
          Discover opportunities that match your skills and career goals
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        {/* Search Input */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search jobs, companies, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<AiOutlineSearch size={20} />}
            rightIcon={
              searchQuery ? (
                <AiOutlineClose
                  size={18}
                  className="text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
                />
              ) : undefined
            }
            onRightIconClick={searchQuery ? handleClearSearch : undefined}
            inputSize="lg"
            variant="default"
            className="text-base"
          />
        </div>

        {/* Location and Filters */}
        <div className="flex gap-2">
          {/* Location Select */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="px-4 py-3 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background min-w-[160px]"
          >
            <option value="">All Locations</option>
            <option value="Remote">Remote</option>
            <option value="San Francisco, CA">San Francisco, CA</option>
            <option value="New York, NY">New York, NY</option>
            <option value="Los Angeles, CA">Los Angeles, CA</option>
            <option value="Austin, TX">Austin, TX</option>
          </select>

          {/* Filters Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-3 border rounded-lg transition-colors flex items-center gap-2 min-w-[100px] ${
              showFilters
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border hover:bg-muted'
            }`}
          >
            <AiOutlineFilter size={20} />
            Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default SearchSection;
