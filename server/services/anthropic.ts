import Anthropic from '@anthropic-ai/sdk';

// Initialize the Anthropic API client
export const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY || "",
});

// Use the latest Claude model instead of the deprecated one
const CLAUDE_MODEL = "claude-3-5-sonnet-20240620"; // or "claude-3-haiku-20240307" for faster/cheaper responses

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

// Improve text using Claude
export async function improveText(
  text: string,
  sectionType: string,
  customPrompt?: string
): Promise<string> {
  const defaultPrompt = getPromptForSection(sectionType);
  const prompt = customPrompt || defaultPrompt;
  
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      system: "You are an expert CV writer. Your task is to improve the provided text for a professional CV/resume.",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n${text}`
        }
      ]
    });
    
    return message.content[0].text;
  } catch (error) {
    console.error("Error generating text with Claude:", error);
    throw error;
  }
}

// Translate CV using Claude
export async function translateCV(
  cv: any,
  targetLanguage: string
): Promise<any> {
  try {
    console.log("Using Claude API for translation");
    
    // Create a deep copy of the CV to avoid modifying the original
    const translatedCV = JSON.parse(JSON.stringify(cv));
    
    // Create the prompt for translation
    const prompt = `Translate the following CV/resume content from its current language to ${targetLanguage}. 
    Maintain the professional tone and terminology. 
    Only translate the text content, not the structure or field names.
    Return the result in valid JSON format.`;
    
    // Generate content
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "You are a professional translator specializing in CV/resume translation. Provide accurate translations while maintaining the original format and structure.",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\n${JSON.stringify(cv, null, 2)}`
        }
      ]
    });
    
    // Parse the response
    try {
      // Look for JSON content in the response
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // If we couldn't extract JSON, fall back to the original CV
        console.error("Couldn't extract JSON from Claude response");
        return translatedCV;
      }
    } catch (parseError) {
      console.error("Error parsing Claude translation response:", parseError);
      return translatedCV;
    }
  } catch (error) {
    console.error(`Error translating CV to ${targetLanguage} with Claude:`, error);
    throw new Error(`Unable to translate CV to ${targetLanguage}. Please try again later.`);
  }
}

export async function adaptCVToJobOffer(
  cv: any,
  jobDescription: string
): Promise<any> {
  try {
    console.log("Using Claude API for CV adaptation");

    // Create a deep copy of the CV to avoid modifying the original
    const adaptedCV = JSON.parse(JSON.stringify(cv));

    // Create the prompt for adaptation
    const prompt = `Adapt the following CV/resume content to align with the provided job description. 
    Focus on highlighting relevant skills and experiences that match the job requirements. 
    Modify only the text content, keeping the structure and field names unchanged.
    Return the result in valid JSON format.`;

    // Generate content
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "You are a professional career advisor specializing in tailoring CVs to specific job descriptions. Provide precise adaptations while maintaining the original format and structure.",
      messages: [
        {
          role: "user",
          content: `${prompt}\n\nJob Description:\n${jobDescription}\n\nCV:\n${JSON.stringify(cv, null, 2)}`
        }
      ]
    });

    // Parse the response
    try {
      // Look for JSON content in the response
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        // If we couldn't extract JSON, fall back to the original CV
        console.error("Couldn't extract JSON from Claude response");
        return adaptedCV;
      }
    } catch (parseError) {
      console.error("Error parsing Claude adaptation response:", parseError);
      return adaptedCV;
    }
  } catch (error) {
    console.error("Error adapting CV with Claude:", error);
    throw new Error("Unable to adapt CV. Please try again later.");
  }
}

// Analyze CV sections using Claude
export async function analyzeCVSections(cv: any, jobPosition?: string): Promise<any> {
  try {
    let jobContext = "";
    if (jobPosition) {
      jobContext = `The target job position is: ${jobPosition}. Analyze the CV for this specific role.`;
    } else {
      jobContext = "Analyze the CV according to best practices for professional resumes.";
    }

    const prompt = `${jobContext}\n\nHere is the CV to analyze:\n${JSON.stringify(cv, null, 2)}\n\nFor each section of the CV, provide:\n1. A relevance score out of 10\n2. At least 2 specific, actionable optimization tips\n3. A brief explanation of what could be improved\n\nPresent the results in JSON format with the following structure:\n{\n  \"sections\": [\n    {\n      \"section\": \"Section name\",\n      \"score\": 7,\n      \"tips\": [\"Tip 1\", \"Tip 2\"],\n      \"explanation\": \"Brief explanation\"\n    },\n    ...\n  ],\n  \"overallScore\": 7.5,\n  \"topRecommendations\": [\"Main recommendation 1\", \"Main recommendation 2\", \"Main recommendation 3\"]\n}`;

    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4000,
      system: "You are an expert recruiter and resume writer. Your task is to objectively analyze each section of a CV and provide a relevance score and precise optimization advice.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    });

    // Parse the response
    try {
      const responseText = message.content[0].text;
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("Could not extract JSON from Claude response");
      }
    } catch (parseError) {
      console.error("Error parsing Claude analyzeCVSections response:", parseError);
      throw new Error("Unable to parse Claude's analysis response.");
    }
  } catch (error) {
    console.error("Error analyzing CV with Claude:", error);
    throw new Error("Unable to analyze CV. Please try again later.");
  }
}

// Review a section: detect issues and suggest fixes using Claude
export async function reviewSection(
  text: string,
  sectionType: string
): Promise<{ issues: string[]; suggestion: string; improvedText: string }> {
  // Customize the prompt based on section type
  const getPromptForSectionReview = (type: string, text: string): string => {
    const basePrompt = "You are an expert CV reviewer. Analyze the following text for spelling, grammar, clarity, and style issues.";
    
    switch (type) {
      case 'summary':
        return `${basePrompt} This is a professional summary section. Make it concise, impactful, and highlight key strengths and experiences. Aim for 3-5 sentences maximum.\n\nSummary:\n${text}`;
      
      case 'experience':
        return `${basePrompt} This is a job experience description. Use strong action verbs, emphasize achievements with metrics when possible, and make it relevant to the candidate's career goals.\n\nExperience Description:\n${text}`;
      
      case 'education':
        return `${basePrompt} This is an education section entry. Format it clearly with degree, institution, and dates. Highlight relevant coursework or achievements if included.\n\nEducation Entry:\n${text}`;
      
      case 'skills':
        return `${basePrompt} These are professional skills. Organize them effectively, use industry-standard terminology, and ensure relevance.\n\nSkills:\n${text}`;
      
      default:
        return `${basePrompt} List all detected issues. Then suggest a single improved version of the text.\n\nSection type: ${sectionType}\n\nText:\n${text}`;
    }
  };

  const customPrompt = getPromptForSectionReview(sectionType, text);
  
  try {
    const message = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 2000,
      system: "You are an expert CV reviewer. Your job is to improve CV content to be more professional, impactful, and tailored to modern resume standards.",
      messages: [
        {
          role: "user",
          content: `${customPrompt}\n\nRespond in JSON with the following fields: issues (array of strings - list all problems found), suggestion (string - a short summary of the main improvement needed), improvedText (string - your completely revised version that fixes all issues).`
        }
      ]
    });
    
    // Try to extract JSON from the response
    const responseText = message.content[0].text;
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          suggestion: parsed.suggestion || "Improved text clarity and impact",
          improvedText: parsed.improvedText || text
        };
      } catch (parseError) {
        console.error("Error parsing JSON from Claude response:", parseError);
        // Extract as much as possible from the text if JSON parsing fails
        return {
          issues: ["Error parsing response"],
          suggestion: "AI suggested improvements but had formatting issues",
          improvedText: responseText.replace(/```json|```/g, '').trim() || text
        };
      }
    } else {
      // If no JSON is found, use the raw text as the improved version
      return {
        issues: ["No structured response found"],
        suggestion: "Improved text format",
        improvedText: responseText.trim() || text
      };
    }
  } catch (error) {
    console.error("Error in Claude reviewSection:", error);
    throw new Error("Unable to review section. Please try again later.");
  }
}

// Add any other functions needed for Claude API