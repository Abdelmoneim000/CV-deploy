import * as openaiService from './openai';
import * as geminiService from './gemini';
import * as claudeService from './anthropic';

// The current active AI service
const ACTIVE_SERVICE = 'claude'; // Can be 'openai', 'gemini', or 'claude'

export type ContentSuggestionType = openaiService.ContentSuggestionType;
export interface ContentSuggestion extends openaiService.ContentSuggestion {}

// Proxy function that routes to the appropriate service
export async function improveText(
  text: string,
  sectionType: string,
  customPrompt?: string,
  forceService?: 'openai' | 'gemini' | 'claude'
): Promise<string> {
  const serviceToUse = forceService || ACTIVE_SERVICE;
  
  try {
    if (serviceToUse === 'openai') {
      return await openaiService.improveText(text, sectionType, customPrompt);
    } else if (serviceToUse === 'gemini') {
      return await geminiService.improveText(text, sectionType, customPrompt);
    } else {
      return await claudeService.improveText(text, sectionType, customPrompt);
    }
  } catch (error) {
    // Fallback logic if the primary service fails
    console.error(`Error with ${serviceToUse}:`, error);
    if (!forceService) {
      if (serviceToUse !== 'openai') {
        console.log("Falling back to OpenAI");
        return await openaiService.improveText(text, sectionType, customPrompt);
      } else if (serviceToUse !== 'claude') {
        console.log("Falling back to Claude");
        return await claudeService.improveText(text, sectionType, customPrompt);
      }
    }
    throw error;
  }
}

// Translation proxy function with Claude support
export async function translateCV(
  cv: any,
  targetLanguage: string,
  forceService?: 'openai' | 'gemini' | 'claude'
): Promise<any> {
  const serviceToUse = forceService || ACTIVE_SERVICE;
  
  try {
    if (serviceToUse === 'openai') {
      return await openaiService.translateCV(cv, targetLanguage);
    } else if (serviceToUse === 'gemini') {
      return await geminiService.translateCV(cv, targetLanguage);
    } else {
      return await claudeService.translateCV(cv, targetLanguage);
    }
  } catch (error) {
    // Fallback logic
    console.error(`Error with ${serviceToUse} translation:`, error);
    if (!forceService) {
      if (serviceToUse !== 'openai') {
        console.log("Falling back to OpenAI for translation");
        return await openaiService.translateCV(cv, targetLanguage);
      } else if (serviceToUse !== 'claude') {
        console.log("Falling back to Claude for translation");
        return await claudeService.translateCV(cv, targetLanguage);
      }
    }
    throw error;
  }
}

// Proxy function for analyzing CV sections (scoring/review)
export async function analyzeCVSections(
  cv: any,
  jobPosition?: string,
  forceService?: 'openai' | 'gemini' | 'claude'
): Promise<any> {
  const serviceToUse = forceService || ACTIVE_SERVICE;

  console.log(serviceToUse, forceService);
  try {
    if (serviceToUse === 'openai') {
      return await openaiService.analyzeCVSections(cv, jobPosition);
    } else if (serviceToUse === 'gemini') {
      return await geminiService.analyzeCVSections(cv, jobPosition);
    } else if (serviceToUse === 'claude') {
      return await claudeService.analyzeCVSections(cv, jobPosition);
    } else {
      // Fallback to OpenAI if not implemented
      return await openaiService.analyzeCVSections(cv, jobPosition);
    }
  } catch (error) {
    // Fallback logic
    console.error(`Error with ${serviceToUse} analyzeCVSections:`, error);
    if (!forceService) {
      if (serviceToUse !== 'openai') {
        console.log('Falling back to OpenAI for analyzeCVSections');
        return await openaiService.analyzeCVSections(cv, jobPosition);
      } else if (serviceToUse !== 'claude') {
        console.log('Falling back to Claude for analyzeCVSections');
        return await claudeService.analyzeCVSections(cv, jobPosition);
      }
    }
    throw error;
  }
}

// Proxy function for reviewing a section (detect issues and suggest fixes)
export async function reviewSection(
  text: string,
  sectionType: string,
  forceService?: 'openai' | 'gemini' | 'claude'
): Promise<{ issues: string[]; suggestion: string; improvedText: string }> {
  const serviceToUse = forceService || ACTIVE_SERVICE;
  try {
    if (serviceToUse === 'openai') {
      return await openaiService.reviewSection(text, sectionType);
    } else if (serviceToUse === 'gemini') {
      return await geminiService.reviewSection(text, sectionType);
    } else if (serviceToUse === 'claude') {
      return await claudeService.reviewSection(text, sectionType);
    } else {
      // Fallback to OpenAI if not implemented
      return await openaiService.reviewSection(text, sectionType);
    }
  } catch (error) {
    // Fallback logic
    console.error(`Error with ${serviceToUse} reviewSection:`, error);
    if (!forceService) {
      if (serviceToUse !== 'openai') {
        console.log('Falling back to OpenAI for reviewSection');
        return await openaiService.reviewSection(text, sectionType);
      } else if (serviceToUse !== 'claude') {
        console.log('Falling back to Claude for reviewSection');
        return await claudeService.reviewSection(text, sectionType);
      }
    }
    throw error;
  }
}

// Add additional proxy functions for other AI capabilities as needed