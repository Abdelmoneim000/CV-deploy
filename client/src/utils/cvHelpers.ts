// New utility file for CV-related helper functions

/**
 * Determines the most appropriate field to modify for a given section type
 */
export const getMainFieldForSection = (sectionType: string): string => {
  switch (sectionType) {
    case 'summary':
      return 'content';
    case 'experience':
    case 'education':
    case 'projects':
      return 'description';
    case 'skills':
      return 'name';
    case 'languages':
      return 'language';
    default:
      return 'content';
  }
};

/**
 * Formats section entries into a string for AI processing
 */
export const formatSectionEntries = (
  entries: any[],
  sectionType: string
): string => {
  if (!entries || entries.length === 0) return '';
  
  // For simple string entries
  if (typeof entries[0] === 'string') {
    return entries.join('\n\n');
  }
  
  // For object entries
  switch (sectionType) {
    case 'experience':
    case 'education':
      // Format just the descriptions
      return entries
        .map((entry) => entry.description || '')
        .filter(Boolean)
        .join('\n\n');
      
    case 'skills':
      // Format skill names
      return entries
        .map((entry) => entry.name || '')
        .filter(Boolean)
        .join(', ');
        
    default:
      // Generic object formatting
      return entries
        .map((entry, i) => {
          if (typeof entry === 'object' && entry !== null) {
            return Object.entries(entry)
              .map(([key, value]) => `${key}: ${value}`)
              .join('\n');
          }
          return String(entry);
        })
        .join('\n\n');
  }
};