import {
  createContext,
  useContext,
  useReducer,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { CvData, FlexibleSection } from '../types/cv.ts';
import {
  educationSection,
  experienceSection,
  findMeOnlineSection,
  languagesSection,
  projectsSection,
  skillsSection,
  summarySection,
} from '../lib/sections.ts';
import useAuth from '@/hooks/useAuth.tsx';
import { json } from 'stream/consumers';

type Version = {
  description: string;
  createdAt: string;
  cvId: number;
  data: CvData;
  changes?: Array<{
    type: 'added' | 'modified' | 'removed';
    field: string;
    oldValue?: any;
    newValue?: any;
    timestamp?: string;
  }>;
};

type CvContextType = {
  cvData: CvData;
  setTheme: (theme: CvData['data']['theme']) => void;
  setPersonalInfo: (personalInfo: CvData['data']['personalInfo']) => void;
  addSection: (section: FlexibleSection) => void;
  removeSection: (id: string) => void;
  updateSectionEntries: (
    sectionId: string,
    entries: FlexibleSection['entries']
  ) => void;
  updateSectionVisibility: (
    sectionId: string,
    visibility: FlexibleSection['visibility']
  ) => void;
  updateSection: (sectionId: string, name: string) => void;
  reorderSections: (sourceIndex: number, destinationIndex: number) => void;
  createVersion: (description: string) => Promise<Version | null>;
  getVersions: () => Promise<Version[]>;
  restoreVersion: (versionId: number) => Promise<boolean>;
  currentCVId: number | null;
  isLoading: boolean;
  saveCV: () => Promise<number>;
  loadCV: (cvId: number) => Promise<void>;
  setCvData: (data: CvData) => void;
};

const CvContext = createContext<CvContextType | undefined>(undefined);

const initialCvData: CvData = {
  title: 'My CV',
  data: {
    theme: {
      templateName: 'classic',
      fontFamily: 'Arial',
      fontSize: '12px',
      bgColor: '#FFFFFF',
      textColor: '#000000',
      pageMargin: '0.5in',
      sectionSpacing: '14pt',
      lineSpacing: '1.5',
      pattern: 'none',
    },
    personalInfo: {
      fullName: 'Abdulrahman Moussa',
      jobTitle: 'Software Engineer | Frontend Developer',
      email: 'abdelrahmanmoussa111@gmail.com',
      phone: '+20 101 832 6780',
      address: 'Cairo, Egypt',
      website: 'https://3bdelrahmanmoussa.com',
      image: 'https://avatars.githubusercontent.com/u/103546648?v=4',
      visibility: {
        email: true,
        phone: true,
        address: true,
        website: true,
        image: false,
      },
    },
    sections: [
      summarySection,
      projectsSection,
      educationSection,
      experienceSection,
      languagesSection,
      skillsSection,
      findMeOnlineSection,
    ],
  },
};

type CvAction =
  | { type: 'SET_THEME'; payload: CvData['data']['theme'] }
  | { type: 'SET_PERSONAL_INFO'; payload: CvData['data']['personalInfo'] }
  | { type: 'ADD_SECTION'; payload: FlexibleSection }
  | { type: 'REMOVE_SECTION'; payload: string }
  | {
      type: 'UPDATE_SECTION_ENTRIES';
      payload: { sectionId: string; entries: FlexibleSection['entries'] };
    }
  | {
      type: 'UPDATE_SECTION_VISIBILITY';
      payload: { sectionId: string; visibility: FlexibleSection['visibility'] };
    }
  | {
      type: 'UPDATE_SECTION';
      payload: {
        sectionId: string;
        name: string;
      };
    }
  | {
      type: 'REORDER_SECTIONS';
      payload: { sourceIndex: number; destinationIndex: number };
    }
  | { type: 'SET_CV_DATA'; payload: CvData };

const cvReducer = (state: CvData, action: CvAction): CvData => {
  switch (action.type) {
    case 'SET_THEME':
      return {
        ...state,
        data: {
          ...state.data,
          theme: { ...state.data.theme, ...action.payload },
        },
      };
    case 'SET_PERSONAL_INFO':
      return {
        ...state,
        data: {
          ...state.data,
          personalInfo: { ...state.data.personalInfo, ...action.payload },
        },
      };
    case 'ADD_SECTION':
      return {
        ...state,
        data: {
          ...state.data,
          sections: [...state.data.sections, action.payload],
        },
      };
    case 'REMOVE_SECTION':
      return {
        ...state,
        data: {
          ...state.data,
          sections: state.data.sections.filter(
            (section) => section.id !== action.payload
          ),
        },
      };
    case 'UPDATE_SECTION_ENTRIES':
      return {
        ...state,
        data: {
          ...state.data,
          sections: state.data.sections.map((section) =>
            section.id === action.payload.sectionId
              ? {
                  ...section,
                  entries: action.payload.entries,
                }
              : section
          ),
        },
      };
    case 'UPDATE_SECTION_VISIBILITY':
      return {
        ...state,
        data: {
          ...state.data,
          sections: state.data.sections.map((section) =>
            section.id === action.payload.sectionId
              ? {
                  ...section,
                  visibility: {
                    ...section.visibility,
                    ...action.payload.visibility,
                  },
                }
              : section
          ),
        },
      };
    case 'UPDATE_SECTION':
      return {
        ...state,
        data: {
          ...state.data,
          sections: state.data.sections.map((section) =>
            section.id === action.payload.sectionId
              ? { ...section, name: action.payload.name }
              : section
          ),
        },
      };
    case 'REORDER_SECTIONS': {
      const { sourceIndex, destinationIndex } = action.payload;
      const sections = [...state.data.sections];
      const [movedSection] = sections.splice(sourceIndex, 1);
      sections.splice(destinationIndex, 0, movedSection);
      return {
        ...state,
        data: {
          ...state.data,
          sections,
        },
      };
    }
    case 'SET_CV_DATA': {
      return { ...state, ...action.payload };
    }
    default:
      return state;
  }
};

export const CvProvider = ({ children }: { children: ReactNode }) => {
  const [cvData, dispatch] = useReducer(cvReducer, initialCvData);
  const [currentCVId, setCurrentCVId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { user, tokens } = useAuth();

  const setTheme = (theme: CvData['data']['theme']) => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setPersonalInfo = (personalInfo: CvData['data']['personalInfo']) => {
    dispatch({ type: 'SET_PERSONAL_INFO', payload: personalInfo });
  };

  const addSection = (section: FlexibleSection) => {
    dispatch({ type: 'ADD_SECTION', payload: section });
  };

  const removeSection = (id: string) => {
    dispatch({ type: 'REMOVE_SECTION', payload: id });
  };

  const updateSectionEntries = (
    sectionId: string,
    entries: FlexibleSection['entries']
  ) => {
    dispatch({
      type: 'UPDATE_SECTION_ENTRIES',
      payload: { sectionId, entries },
    });
  };

  const updateSectionVisibility = (
    sectionId: string,
    visibility: FlexibleSection['visibility']
  ) => {
    dispatch({
      type: 'UPDATE_SECTION_VISIBILITY',
      payload: { sectionId, visibility },
    });
  };

  const updateSection = (sectionId: string, name: string) => {
    dispatch({
      type: 'UPDATE_SECTION',
      payload: { sectionId, name },
    });
  };

  const reorderSections = (sourceIndex: number, destinationIndex: number) => {
    dispatch({
      type: 'REORDER_SECTIONS',
      payload: { sourceIndex, destinationIndex },
    });
  };

  const setCvData = (data: CvData) => {
    dispatch({ type: 'SET_CV_DATA', payload: data });
  };

  // useEffect(() => {
  //   // Add a reference to track if the component is still mounted
  //   let isMounted = true;

  //   const loadSavedCV = async () => {
  //     try {
  //       // Don't load if we already have a CV ID in state to prevent infinite loops
  //       if (currentCVId !== null) {
  //         return;
  //       }

  //       const savedCvId = localStorage.getItem('currentCVId');

  //       if (savedCvId) {
  //         const cvId = parseInt(savedCvId);

  //         // Check if parsed value is a valid number
  //         if (isNaN(cvId)) {
  //           console.error('Invalid CV ID in localStorage');
  //           localStorage.removeItem('currentCVId'); // Clear invalid data
  //           return;
  //         }

  //         setIsLoading(true);

  //         try {
  //           const response = await fetch(`/api/cvs/${cvId}`, {
  //             headers: {
  //               'Content-Type': 'application/json',
  //               Authorization: `Bearer ${tokens?.accessToken}`,
  //             },
  //           });

  //           // Guard against setting state after unmount
  //           if (!isMounted) return;

  //           if (response.ok) {
  //             const data = await response.json();

  //             // Important: Set currentCVId first, before dispatching data update
  //             setCurrentCVId(cvId); // Use the ID from localStorage, not from response

  //             if (data.data) {
  //               setCvData(data.data);
  //               console.log('CV data loaded successfully');
  //             } else {
  //               console.warn('CV found but has no data property');
  //             }
  //           } else if (response.status === 404) {
  //             // CV not found - likely deleted or invalid ID
  //             console.warn('CV not found, removing from localStorage');
  //             localStorage.removeItem('currentCVId');
  //           } else {
  //             // Other API errors
  //             console.error('API error:', response.status);
  //             // Don't remove from localStorage on server errors - might be temporary
  //           }
  //         } catch (fetchError) {
  //           console.error('Network error when fetching CV:', fetchError);
  //           // Don't remove on network errors - might be temporary
  //         }
  //       }
  //     } catch (error) {
  //       console.error('Error in loadSavedCV:', error);
  //     } finally {
  //       if (isMounted) {
  //         setIsLoading(false);
  //       }
  //     }
  //   };

  //   if (user && tokens) {
  //     loadSavedCV();
  //   }

  //   // Cleanup function to prevent state updates after unmount
  //   return () => {
  //     isMounted = false;
  //   };
  // }, []); // Keep the empty dependency array

  // const saveCV = async (): Promise<number> => {
  //   setIsLoading(true);
  //   try {
  //     // Prepare the payload with the current cvData structure
  //     const payload = {
  //       userId: user?.id,
  //       title: cvData.title || `${cvData.data.personalInfo.fullName}'s CV`,
  //       data: cvData.data,
  //     };

  //     let response;
  //     console.log('currentCVId ' + currentCVId);
  //     if (currentCVId) {
  //       response = await fetch(`/api/cvs/${currentCVId}`, {
  //         method: 'PUT',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${tokens?.accessToken}`,
  //         },
  //         body: JSON.stringify(payload),
  //       });
  //     } else {
  //       response = await fetch('/api/cvs', {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${tokens?.accessToken}`,
  //         },
  //         body: JSON.stringify(payload),
  //       });
  //     }

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       console.error('Server validation error:', errorData);
  //       throw new Error(
  //         `Failed to save CV: ${errorData.message || response.statusText}`
  //       );
  //     }

  //     const data = await response.json();
  //     setCurrentCVId(data.id);
  //     localStorage.setItem('currentCVId', data.id.toString());

  //     return data.id;
  //   } catch (error) {
  //     console.error('Error saving CV:', error);
  //     throw error;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  useEffect(() => {
    const loadCurrentCV = async () => {
      if (!user || !tokens?.accessToken) return;

      try {
        // Check for saved CV ID in localStorage
        const savedCVId = localStorage.getItem('currentCVId');
        
        if (savedCVId) {
          setIsLoading(true);
          const response = await fetch(`/api/cvs/${savedCVId}`, {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          });

          if (response.ok) {
            const cv = await response.json();
            console.log('Loaded existing CV:', cv);
            
            setCvData({
              title: cv.title,
              data: cv.data,
            });
            setCurrentCVId(cv.id);
            return; // Successfully loaded existing CV
          } else {
            // CV not found or error, clear invalid ID
            localStorage.removeItem('currentCVId');
          }
        }

        // If no saved CV or failed to load, check for user's latest CV
        const response = await fetch('/api/cvs', {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        });

        if (response.ok) {
          const cvs = await response.json();
          if (cvs.length > 0) {
            // Load the most recent CV
            const latestCV = cvs[0];
            setCvData({
              title: latestCV.title,
              data: latestCV.data,
            });
            setCurrentCVId(latestCV.id);
            localStorage.setItem('currentCVId', latestCV.id.toString());
            console.log('Loaded latest CV:', latestCV);
          } else {
            // No CVs exist, use default template
            console.log('No existing CVs, using default template');
            initializeDefaultCV();
          }
        }
      } catch (error) {
        console.error('Error loading CV:', error);
        // Fallback to default if loading fails
        initializeDefaultCV();
      } finally {
        setIsLoading(false);
      }
    };

    loadCurrentCV();
  }, [user, tokens?.accessToken]);

  const initializeDefaultCV = () => {
    setCvData(initialCvData);
  };

  const saveCV = async (): Promise<number> => {
    setIsLoading(true);
    try {
      // Ensure we have the latest state by adding a small delay
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Explicitly prepare the data with current sections
      const currentSections = cvData.data.sections;
      console.log('Saving CV with sections:', currentSections.map(s => s.id));
      
      const payload = {
        userId: user?.id,
        title: cvData.title || `${cvData.data.personalInfo.fullName}'s CV`,
        data: {
          ...cvData.data,
          sections: currentSections // Explicitly set the current sections
        },
      };

      let response;
      console.log('currentCVId ' + currentCVId);
      console.log('Payload sections:', payload.data.sections.map(s => s.id));
      
      if (currentCVId) {
        response = await fetch(`/api/cvs/${currentCVId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      } else {
        response = await fetch('/api/cvs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server validation error:', errorData);
        throw new Error(
          `Failed to save CV: ${errorData.message || response.statusText}`
        );
      }

      const data = await response.json();
      setCurrentCVId(data.id);
      localStorage.setItem('currentCVId', data.id.toString());

      return data.id;
    } catch (error) {
      console.error('Error saving CV:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // const createVersion = async (
  //   description: string
  // ): Promise<Version | null> => {
  //   if (!currentCVId) {
  //     try {
  //       await saveCV();
  //     } catch (error) {
  //       console.error("Couldn't save CV before creating version:", error);
  //       return null;
  //     }
  //   }

  //   setIsLoading(true);
  //   try {
  //     const payload = {
  //       cvId: currentCVId,
  //       description,
  //       data: cvData,
  //       createdBy: user?.id,
  //       changes: [],
  //     };

  //     console.log('Data being versioned:', payload);
      
  //     const response = await fetch('/api/versions', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${tokens?.accessToken}`,
  //       },
  //       body: JSON.stringify(payload),
  //     });

  //     if (!response.ok) {
  //       throw new Error('Failed to create version');
  //     }

  //     const data = await response.json();
  //     localStorage.setItem('currentVersionId', data.id.toString());
  //     return data;
  //   } catch (error) {
  //     console.error('Error creating version:', error);
  //     return null;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const loadCV = async (cvId: number): Promise<void> => {
    if (!tokens?.accessToken) {
      throw new Error('Authentication required');
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cvs/${cvId}`, {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load CV');
      }

      const cv = await response.json();
      console.log('Loaded CV:', cv);

      // ✅ Update the context with the loaded CV data
      setCvData({
        title: cv.title,
        data: cv.data,
      });

      setCurrentCVId(cv.id);
      
      // ✅ Update localStorage
      localStorage.setItem('currentCVId', cv.id.toString());
      
      console.log('CV context updated with:', cv.data);
    } catch (error) {
      console.error('Error loading CV:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const createVersion = async (
    description: string
  ): Promise<Version | null> => {
    if (!currentCVId) {
      try {
        await saveCV();
      } catch (error) {
        console.error("Couldn't save CV before creating version:", error);
        return null;
      }
    }

    setIsLoading(true);
    try {
      // Ensure we have the latest state
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get current sections after any removals
      const currentSections = cvData.data.sections;
      console.log('Creating version with sections:', currentSections.map(s => s.id));
      
      const payload = {
        cvId: currentCVId,
        description,
        data: {
          ...cvData.data, // ✅ Pass only the data portion
          sections: currentSections // ✅ Explicitly ensure current sections
        },
        createdBy: user?.id,
        changes: [],
      };

      console.log('Version payload sections:', payload.data.sections.map(s => s.id));
      
      const response = await fetch('/api/versions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Version creation error:', errorData);
        throw new Error(`Failed to create version: ${errorData.message || response.statusText}`);
      }

      const data = await response.json();
      localStorage.setItem('currentVersionId', data.id.toString());
      return data;
    } catch (error) {
      console.error('Error creating version:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const getVersions = async (): Promise<Version[]> => {
    if (!currentCVId) {
      console.warn('No CV ID available to fetch versions');
      return [];
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cvs/${currentCVId}/versions`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens?.accessToken}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch versions');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching versions:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // const restoreVersion = async (versionId: number): Promise<boolean> => {
  //   if (!currentCVId) {
  //     console.warn('No CV ID available to restore version');
  //     return false;
  //   }

  //   setIsLoading(true);
  //   try {
  //     const response = await fetch(
  //       `/api/cvs/${currentCVId}/restore/${versionId}`,
  //       {
  //         method: 'POST',
  //         headers: {
  //           'Content-Type': 'application/json',
  //           Authorization: `Bearer ${tokens?.accessToken}`,
  //         },
  //       }
  //     );

  //     if (!response.ok) {
  //       throw new Error('Failed to restore version');
  //     }

  //     const restoredCV = await response.json();

  //     if (restoredCV.data) {
  //       dispatch({ type: 'SET_CV_DATA', payload: restoredCV.data });
  //     }

  //     return true;
  //   } catch (error) {
  //     console.error('Error restoring version:', error);
  //     return false;
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  const restoreVersion = async (versionId: number): Promise<boolean> => {
    if (!currentCVId) {
      console.warn('No CV ID available to restore version');
      return false;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/cvs/${currentCVId}/restore/${versionId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokens?.accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore version');
      }

      const restoredCV = await response.json();
      console.log('Restored CV:', restoredCV);

      // ✅ Properly update the CV data structure
      if (restoredCV && restoredCV.data) {
        // Update the CV data with the restored version
        setCvData({
          title: restoredCV.title || cvData.title,
          data: restoredCV.data, // This contains the sections from the version
        });

        // Also reload the CV to ensure consistency
        await loadCV(currentCVId);
        
        return true;
      }

      throw new Error('Invalid restored CV data');
    } catch (error) {
      console.error('Error restoring version:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    cvData,
    setTheme,
    setPersonalInfo,
    addSection,
    removeSection,
    updateSectionEntries,
    updateSectionVisibility,
    updateSection,
    reorderSections,
    saveCV,
    loadCV,
    createVersion,
    getVersions,
    restoreVersion,
    setCvData,
    currentCVId,
    isLoading,
  };

  return <CvContext.Provider value={value}>{children}</CvContext.Provider>;
};

export const useCvContext = () => {
  const context = useContext(CvContext);
  if (!context) {
    throw new Error('useCvContext must be used within a CvProvider');
  }
  return context;
};

export default CvContext;
