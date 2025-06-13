# AI Services Architecture

## Overview

The AI Services system in CvCraftPro integrates multiple AI providers (OpenAI, Anthropic Claude, Google Gemini) to offer intelligent content generation, improvement, analysis, and optimization features for resume creation.

## AI Provider Integration

### OpenAI Integration

Integration with OpenAI's GPT models:

```typescript
// OpenAI service initialization
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Using GPT-4o for text improvement
export async function improveText(
  text: string,
  sectionType: string,
  customPrompt?: string
): Promise<string> {
  const prompt = customPrompt || getPromptForSection(sectionType);
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "You are an expert CV assistant." },
      { role: "user", content: `${prompt}\n\nOriginal text:\n${text}` }
    ],
    temperature: 0.7,
  });
  
  return response.choices[0].message.content || text;
}
```

### Claude Integration

Integration with Anthropic's Claude models:

```typescript
// Anthropic service initialization
const anthropic = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
});

// Using Claude 3.5 Sonnet for content analysis
export async function analyzeCVSections(cv: any): Promise<any> {
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20240620",
    max_tokens: 4000,
    system: "You are an expert CV reviewer.",
    messages: [
      {
        role: "user",
        content: `Analyze this CV and provide detailed feedback:\n${JSON.stringify(cv, null, 2)}`
      }
    ]
  });
  
  return JSON.parse(message.content[0].text);
}
```

### Gemini Integration

Integration with Google's Gemini models:

```typescript
// Gemini service initialization
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Using Gemini 1.5 Pro for section review
export async function reviewSection(
  text: string,
  sectionType: string
): Promise<any> {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const result = await model.generateContent(`Review this CV section:\n${text}`);
  return result.response.text();
}
```

## Core AI Features

### Content Enhancement

AI-powered improvement of CV content:

1. **Text Improvement**: Enhance the quality, impact, and clarity of text in various CV sections
2. **Grammar Correction**: Fix grammatical and spelling errors
3. **Style Enhancement**: Improve the tone and style for professional impact
4. **Content Expansion**: Elaborate on brief entries with more detail
5. **Content Condensation**: Trim verbose sections while preserving key information

### CV Analysis

Comprehensive analysis of CV content:

1. **Section Scoring**: Rate each section of the CV on relevance, impact, and completeness
2. **Optimization Tips**: Provide actionable recommendations for improvement
3. **ATS Compatibility**: Analyze how well the CV will perform with Applicant Tracking Systems
4. **Industry Alignment**: Evaluate content against industry standards and expectations

### Job Matching

Tailoring CV content to specific job opportunities:

1. **Keyword Optimization**: Identify and incorporate relevant keywords from job descriptions
2. **Skills Alignment**: Highlight skills that match job requirements
3. **Content Prioritization**: Reorder and emphasize experiences most relevant to the target position
4. **Gap Identification**: Identify missing qualifications or experiences for targeted roles

### Content Generation

AI-powered generation of new content:

1. **Summary Creation**: Generate professional summary statements based on CV content
2. **Bullet Point Generation**: Create achievement-focused bullet points for experience sections
3. **Skills Extraction**: Automatically identify and extract skills from experience descriptions
4. **Achievement Quantification**: Add metrics and quantifiable results to achievements

## AI Service Orchestration

The AI service layer coordinates between different AI providers based on:

1. **Task Suitability**: Matching providers to tasks they excel at
2. **User Preference**: Allowing users to select their preferred AI provider
3. **Availability**: Falling back to alternative providers when needed
4. **Cost Optimization**: Using less expensive models for simpler tasks

## Prompt Engineering

Specialized prompts are crafted for different CV sections:

```typescript
// Prompt selection based on section type
function getPromptForSection(sectionType: string): string {
  const prompts: Record<string, string> = {
    summary: "Improve this professional summary to be more impactful and concise...",
    experience: "Enhance this work experience description using strong action verbs...",
    education: "Optimize this education entry to highlight relevant achievements...",
    skills: "Refine this skills list to be more targeted and impactful...",
    // Additional section-specific prompts
  };
  
  return prompts[sectionType] || "Improve this text to be more professional and impactful.";
}
```

## Response Processing

AI responses undergo processing for consistent formatting and quality:

1. **JSON Extraction**: Parsing structured data from AI responses
2. **Formatting Normalization**: Ensuring consistent text formatting
3. **Quality Checking**: Validating AI outputs meet quality standards
4. **Fallback Handling**: Managing cases where AI responses don't meet expectations

## Error Handling and Resilience

The AI services implement robust error handling:

1. **Rate Limit Management**: Handling API rate limits with backoff strategies
2. **Timeout Handling**: Managing API timeouts with appropriate fallbacks
3. **Service Fallbacks**: Redirecting requests to alternative providers when primary fails
4. **Graceful Degradation**: Maintaining core functionality when AI services are unavailable

## API Design

The AI services expose a consistent API interface:

```typescript
// Sample API endpoints for AI services
export interface AIService {
  improveText(text: string, sectionType: string, options?: any): Promise<string>;
  reviewSection(text: string, sectionType: string): Promise<ReviewResult>;
  generateSuggestions(sectionType: string, context: any): Promise<string[]>;
  analyzeCV(cv: any, targetJob?: string): Promise<AnalysisResult>;
  adaptToJobDescription(cv: any, jobDescription: string): Promise<AdaptationResult>;
}
```

## Security and Privacy

AI service integration includes security measures:

1. **Data Minimization**: Sending only necessary data to AI providers
2. **API Key Security**: Secure storage and rotation of API keys
3. **User Consent**: Clear indication when AI services are being used
4. **Provider Policies**: Adherence to AI provider's data usage policies