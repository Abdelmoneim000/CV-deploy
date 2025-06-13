# Frontend Architecture

## Overview

The frontend of CvCraftPro is built with React, TypeScript, and Tailwind CSS following a component-based architecture. It provides a seamless UI for building, editing, and exporting professional CVs with multiple template options and design controls.

## Core Components

### Template System

The template system is the heart of the CV builder, consisting of:

1. **TemplatesPanel**: A grid display of available templates with visual previews, allowing users to browse and select from various design styles.

2. **TemplateRenderer**: A router component that dynamically renders the appropriate template based on the user's selection from the CV context.

3. **Individual Templates**: Specialized components for each template style:
   - **ModernTemplate**: Clean, contemporary design with customizable sidebar
   - **MinimalTemplate**: Elegant, simplified layout with focus on typography
   - **CreativeTemplate**: Bold, distinctive design with accent colors and visual elements
   - **ProfessionalTemplate**: Traditional, business-oriented design
   - Additional specialized templates (Chronological, Academic, etc.)

Each template implements a consistent interface that accepts ordered sections and applies styling based on user design preferences.

### Design System

The design system provides controls for customizing the visual aspects of templates:

1. **DesignPanel**: Controls for template selection and customization
2. **ColorPicker**: For selecting primary and accent colors
3. **FontSelector**: For choosing heading and body fonts
4. **LayoutControls**: For adjusting spacing, sidebar width, and other layout properties

### Section Components

CV sections are represented by specialized editor components:

1. **HeaderSection**: For editing personal information (name, title, contact details)
2. **SummarySection**: For professional summary/objective statement
3. **ExperienceSection**: For work history entries with company, role, dates, and bullet points
4. **EducationSection**: For academic background
5. **LanguageSection**: For language proficiency
6. **CompetenciesSection**: For skills and competencies
7. **CustomSection**: For user-defined sections

Each section implements both an edit mode and a display mode for the final CV.

### AI Integration

AI features are integrated throughout the UI:

1. **AIAssistantPanel**: General AI assistance for CV creation
2. **AIEnhancedSection**: Section-specific AI enhancement for text
3. **CVScorePanel**: AI analysis and scoring of the overall CV
4. **AdaptCVPanel**: Job-specific CV optimization

### Version Control

Version management components:

1. **VersionHistoryPanel**: Displays saved versions with timestamps and descriptions
2. **ChangeTracking**: Shows detailed changes between versions

## State Management

The application uses React Context API for state management:

### CVContext

The CVContext provides a central store for all CV data:

```typescript
interface CVContextType {
  cv: CVData;                // Current CV data
  loading: boolean;          // Loading state
  updatePersonalInfo: (field: string, value: string) => void;
  updateContactInfo: (field: string, value: string) => void;
  updateSummary: (summary: string) => void;
  updateExperience: (index: number, field: string, value: any) => void;
  // Additional update methods for each section
  updateDesign: (field: string, value: any) => void;
  saveCV: () => Promise<void>;
  createVersion: (description: string) => Promise<void>;
  getVersions: () => Promise<Version[]>;
  restoreVersion: (versionId: string) => Promise<void>;
}
```

### Toast Context

Provides application-wide toast notifications for user feedback.

## Routing

The application uses a simple routing structure:

- `/` - Home/landing page
- `/builder` - CV Builder interface
- `/templates` - Template browsing page
- `/account` - User account management

## Styling Approach

The application uses a hybrid styling approach:

1. **Tailwind CSS**: For consistent, utility-based styling
2. **Styled Components**: For complex, dynamic styling needs
3. **CSS Variables**: For theme control and customization
4. **Inline Styles**: For dynamic template styling based on user preferences

## Key UI Patterns

1. **In-place Editing**: Content is edited directly in position
2. **Real-time Preview**: Changes are immediately reflected in the CV preview
3. **Drag and Drop**: Used for section reordering
4. **Contextual Controls**: UI controls appear based on the current context
5. **Responsive Design**: Adapts to various screen sizes while maintaining print-friendly proportions

## UI Components Library

The application uses a custom component library built on top of shadcn/ui, providing:

- Standardized form controls (buttons, inputs, dropdowns)
- Modal dialogs
- Tooltips and popovers
- Toast notifications
- Skeleton loading states