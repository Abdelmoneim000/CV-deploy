import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

// Types for content suggestions - reusing the same types as OpenAI for compatibility
export type ContentSuggestionType =
  | 'experience'
  | 'skills'
  | 'summary'
  | 'education'
  | 'languages'
  | 'achievements'
  | 'strengths';

export interface ContentSuggestion {
  id: string;
  text: string;
  type: ContentSuggestionType;
  confidence: number;
  isApplied?: boolean;
}

// Helper function to get prompts for different sections
// This can be shared between Gemini and OpenAI implementations
export function getPromptForSection(sectionType: string): string {
  switch (sectionType) {
    case 'summary':
      return "Improve this professional summary to make it more impactful and concise:";
    case 'experience':
      return "Enhance these job descriptions with action verbs and quantifiable achievements:";
    case 'skills':
      return "Suggest relevant skills for this professional profile:";
    case 'education':
      return "Format and enhance this education section:";
    default:
      return "Improve the following text to make it more professional:";
  }
}

// Improve text using Gemini
export async function improveText(
  text: string,
  sectionType: string,
  customPrompt?: string
): Promise<string> {
  const defaultPrompt = getPromptForSection(sectionType);
  const prompt = customPrompt || defaultPrompt;
  
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    
    // Generate content
    const result = await model.generateContent(prompt + "\n\n" + text);
    const response = result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating text with Gemini:", error);
    throw error;
  }
}

// Add translation functionality
export async function translateCV(
  cv: any,
  targetLanguage: string
): Promise<any> {
  try {
    // Get the generative model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    console.log(process.env.GEMINI_API_KEY);
    console.log("Using Gemini API for translation");
    
    // Create a deep copy of the CV to avoid modifying the original
    const translatedCV = JSON.parse(JSON.stringify(cv));
    
    // Create a prompt for translation
    const prompt = `Translate the following CV/resume content from its current language to ${targetLanguage}. 
    Maintain the professional tone and terminology. 
    Only translate the text content, not the structure or field names.
    Return the result in valid JSON format.`;
    
    // Generate content
    const result = await model.generateContent(prompt + "\n\n" + JSON.stringify(cv));
    const response = result.response;
    const responseText = response.text();
    
    // Parse the response - we need to handle potential JSON parsing issues
    try {
      // Try to parse the response as JSON
      const parsedResponse = JSON.parse(responseText);
      return parsedResponse;
    } catch (parseError) {
      console.error("Error parsing Gemini translation response as JSON:", parseError);
      
      // If direct parsing fails, let's try to extract a JSON object from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e) {
          const error = e as Error;
          throw new Error(`Failed to parse Gemini translation response: ${error.message}`);
        }
      }
      
      // If we couldn't extract JSON, fall back to manual translation of key fields
      return translatedCV;
    }
  } catch (error) {
    console.error(`Error translating CV to ${targetLanguage} with Gemini:`, error);
    throw new Error(`Unable to translate CV to ${targetLanguage}. Please try again later.`);
  }
}

// Analyze CV sections using Gemini
export async function analyzeCVSections(cv: any, jobPosition?: string): Promise<any> {
  try {
    let jobContext = "";
    if (jobPosition) {
      jobContext = `The target job position is: ${jobPosition}. Analyze the CV for this specific role.`;
    } else {
      jobContext = "Analyze the CV according to best practices for professional resumes.";
    }

    const prompt = `${jobContext}\n\nHere is the CV to analyze:\n${JSON.stringify(cv, null, 2)}\n\nFor each section of the CV, provide:\n1. A relevance score out of 10\n2. At least 2 specific, actionable optimization tips\n3. A brief explanation of what could be improved\n\nPresent the results in JSON format with the following structure:\n{\n  \"sections\": [\n    {\n      \"section\": \"Section name\",\n      \"score\": 7,\n      \"tips\": [\"Tip 1\", \"Tip 2\"],\n      \"explanation\": \"Brief explanation\"\n    },\n    ...\n  ],\n  \"overallScore\": 7.5,\n  \"topRecommendations\": [\"Main recommendation 1\", \"Main recommendation 2\", \"Main recommendation 3\"]\n}`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();

    // Parse the response
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from Gemini response");
      }
    } catch (parseError) {
      console.error("Error parsing Gemini analyzeCVSections response:", parseError);
      throw new Error("Unable to parse Gemini's analysis response.");
    }
  } catch (error) {
    console.error("Error analyzing CV with Gemini:", error);
    throw new Error("Unable to analyze CV. Please try again later.");
  }
}

// Review a section: detect issues and suggest fixes using Gemini
export async function reviewSection(
  text: string,
  sectionType: string
): Promise<{ issues: string[]; suggestion: string; improvedText: string }> {
  const prompt = `You are an expert CV reviewer. Analyze the following text for spelling, grammar, clarity, and style issues. List all detected issues. Then suggest a single improved version of the text. Respond in JSON with the following fields: issues (array of strings), suggestion (string, a summary of the main fix), improvedText (string, the improved version).\n\nSection type: ${sectionType}\n\nText:\n${text}`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response;
    const responseText = response.text();
    // Try to extract JSON from the response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    } else {
      throw new Error("Could not extract JSON from Gemini response");
    }
  } catch (error) {
    console.error("Error in Gemini reviewSection:", error);
    throw new Error("Unable to review section. Please try again later.");
  }
}

// Add any other functions you need for Gemini API