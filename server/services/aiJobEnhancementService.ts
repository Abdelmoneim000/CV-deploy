import { anthropic } from './anthropic';
import { storage } from '../storage';
import { type Job, type InsertJob } from '@shared/schema';

interface JobEnhancementSuggestions {
  improvedDescription: string;
  suggestedSkills: string[];
  salaryRange: {
    min: number;
    max: number;
    currency: string;
    justification: string;
  };
  improvementAreas: string[];
  seoKeywords: string[];
  attractivenessScore: number;
}

interface SalaryAnalysis {
  suggestedMin: number;
  suggestedMax: number;
  currency: string;
  marketData: {
    averageSalary: number;
    salaryRange: { min: number; max: number };
    factors: string[];
  };
  justification: string;
}

interface ApplicationScreeningResult {
  score: number;
  recommendation: 'accept' | 'review' | 'reject';
  strengths: string[];
  concerns: string[];
  questions: string[];
  summary: string;
}

export class AIJobEnhancementService {
  // Enhance job description using AI
  async enhanceJobDescription(
    jobData: Partial<Job> | InsertJob
  ): Promise<JobEnhancementSuggestions> {
    const prompt = `
    Analyze and improve this job posting:

    Title: ${jobData.title}
    Company: ${jobData.companyName}
    Description: ${jobData.description}
    Location: ${jobData.location}
    Work Type: ${jobData.workType}
    Employment Type: ${jobData.employmentType}
    Experience Level: ${jobData.experienceLevel}
    Required Skills: ${Array.isArray(jobData.requiredSkills) ? jobData.requiredSkills.join(', ') : ''}
    Benefits: ${Array.isArray(jobData.benefits) ? jobData.benefits.join(', ') : ''}

    Please provide:
    1. An improved, more engaging job description
    2. Additional relevant skills to consider
    3. Suggested salary range with justification
    4. Areas for improvement
    5. SEO keywords for better visibility
    6. Overall attractiveness score (0-100)

    Return in JSON format:
    {
      "improvedDescription": "enhanced description text",
      "suggestedSkills": ["skill1", "skill2", ...],
      "salaryRange": {
        "min": number,
        "max": number,
        "currency": "USD",
        "justification": "explanation"
      },
      "improvementAreas": ["area1", "area2", ...],
      "seoKeywords": ["keyword1", "keyword2", ...],
      "attractivenessScore": number
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error enhancing job description with AI:', error);
      throw new Error('Failed to enhance job description');
    }
  }

  // Get salary suggestions based on market data
  async suggestSalary(
    jobTitle: string,
    location: string,
    experienceLevel: string,
    skills: string[],
    companySize?: string
  ): Promise<SalaryAnalysis> {
    const prompt = `
    Provide salary analysis for this position:

    Job Title: ${jobTitle}
    Location: ${location}
    Experience Level: ${experienceLevel}
    Required Skills: ${skills.join(', ')}
    Company Size: ${companySize || 'Not specified'}

    Based on current market data (2024), provide:
    1. Suggested salary range
    2. Market analysis and factors affecting salary
    3. Justification for the range

    Consider factors like:
    - Industry standards
    - Location cost of living
    - Experience level requirements
    - Skill demand
    - Company size impact

    Return in JSON format:
    {
      "suggestedMin": number,
      "suggestedMax": number,
      "currency": "USD",
      "marketData": {
        "averageSalary": number,
        "salaryRange": {"min": number, "max": number},
        "factors": ["factor1", "factor2", ...]
      },
      "justification": "detailed explanation"
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing salary with AI:', error);
      throw new Error('Failed to analyze salary');
    }
  }

  // Screen job applications using AI
  async screenApplication(
    jobId: number,
    candidateProfile: any,
    cv: any,
    coverLetter?: string
  ): Promise<ApplicationScreeningResult> {
    const job = await storage.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    const prompt = `
    Screen this job application:

    Job Requirements:
    Title: ${job.title}
    Description: ${job.description}
    Required Skills: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : ''}
    Preferred Skills: ${Array.isArray(job.preferredSkills) ? job.preferredSkills.join(', ') : ''}
    Experience Level: ${job.experienceLevel}
    Required Experience: ${job.requiredExperience} years

    Candidate Application:
    Profile: ${JSON.stringify(candidateProfile, null, 2)}
    CV: ${JSON.stringify(cv, null, 2)}
    Cover Letter: ${coverLetter || 'Not provided'}

    Please analyze:
    1. Overall match score (0-100)
    2. Recommendation (accept/review/reject)
    3. Key strengths that match the role
    4. Areas of concern or gaps
    5. Specific questions for interview
    6. Summary assessment

    Return in JSON format:
    {
      "score": number,
      "recommendation": "accept|review|reject",
      "strengths": ["strength1", "strength2", ...],
      "concerns": ["concern1", "concern2", ...],
      "questions": ["question1", "question2", ...],
      "summary": "detailed assessment"
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error screening application with AI:', error);
      throw new Error('Failed to screen application');
    }
  }

  // Suggest improvements for low-performing job posts
  async analyzeJobPerformance(
    jobId: number
  ): Promise<{
    performanceScore: number;
    issues: string[];
    suggestions: string[];
    optimizations: {
      title: string;
      description: string;
      keywords: string[];
    };
  }> {
    const job = await storage.getJobById(jobId);
    if (!job) {
      throw new Error('Job not found');
    }

    // Get job analytics
    const views = await storage.getJobViewsByJobId(jobId);
    const applications = await storage.getJobApplicationsByJobId(jobId);

    const prompt = `
    Analyze job posting performance:

    Job Details:
    Title: ${job.title}
    Description: ${job.description}
    Posted: ${job.publishedAt}
    Views: ${views.length}
    Applications: ${applications.length}
    
    Performance Metrics:
    - View to Application Ratio: ${applications.length / Math.max(views.length, 1)}
    - Days Active: ${Math.floor((Date.now() - new Date(job.publishedAt || job.createdAt).getTime()) / (1000 * 60 * 60 * 24))}

    Analyze why this job might be underperforming and provide:
    1. Performance score (0-100)
    2. Identified issues
    3. Specific improvement suggestions
    4. Optimized title and description
    5. SEO keywords

    Return in JSON format:
    {
      "performanceScore": number,
      "issues": ["issue1", "issue2", ...],
      "suggestions": ["suggestion1", "suggestion2", ...],
      "optimizations": {
        "title": "optimized title",
        "description": "optimized description",
        "keywords": ["keyword1", "keyword2", ...]
      }
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing job performance with AI:', error);
      throw new Error('Failed to analyze job performance');
    }
  }

  // Generate job posting from basic requirements
  async generateJobPosting(
    basicRequirements: {
      title: string;
      company: string;
      location: string;
      workType: string;
      experienceLevel: string;
      keyRequirements: string[];
    }
  ): Promise<{
    description: string;
    requirements: string[];
    responsibilities: string[];
    benefits: string[];
    skills: string[];
  }> {
    const prompt = `
    Generate a comprehensive job posting from these basic requirements:

    Title: ${basicRequirements.title}
    Company: ${basicRequirements.company}
    Location: ${basicRequirements.location}
    Work Type: ${basicRequirements.workType}
    Experience Level: ${basicRequirements.experienceLevel}
    Key Requirements: ${basicRequirements.keyRequirements.join(', ')}

    Create:
    1. Engaging job description
    2. Detailed requirements list
    3. Key responsibilities
    4. Benefits and perks
    5. Technical and soft skills needed

    Return in JSON format:
    {
      "description": "full job description",
      "requirements": ["req1", "req2", ...],
      "responsibilities": ["resp1", "resp2", ...],
      "benefits": ["benefit1", "benefit2", ...],
      "skills": ["skill1", "skill2", ...]
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const content = response.content[0];
      if (content.type === 'text') {
        const jsonMatch = content.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error generating job posting with AI:', error);
      throw new Error('Failed to generate job posting');
    }
  }
}

// Create and export the service instance
export const aiJobEnhancementService = new AIJobEnhancementService();