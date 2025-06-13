import { storage } from '../storage';
import { 
  type Job, 
  type CandidateProfile, 
  type CV, 
  type JobApplication
} from '@shared/schema';
import { anthropic } from './anthropic';

interface SkillGap {
  skill: string;
  importance: 'critical' | 'important' | 'nice-to-have';
  description: string;
  learningResources?: string[];
}

interface JobMatch {
  job: Job;
  matchScore: number;
  skillsMatch: {
    matching: string[];
    missing: string[];
    percentage: number;
  };
  experienceMatch: {
    score: number;
    analysis: string;
  };
  salaryMatch: {
    score: number;
    analysis: string;
  };
  locationMatch: {
    score: number;
    analysis: string;
  };
  overallAnalysis: string;
  recommendations: string[];
  skillGaps: SkillGap[];
}

interface CandidateAnalysis {
  skills: string[];
  experience: {
    totalYears: number;
    domains: string[];
    seniority: 'entry' | 'mid' | 'senior' | 'executive';
  };
  education: {
    level: string;
    fields: string[];
  };
  preferences: {
    workType?: 'remote' | 'hybrid' | 'onsite';
    salaryRange?: { min: number; max: number };
    locations?: string[];
    industries?: string[];
  };
  strengths: string[];
  improvementAreas: string[];
}

export class AIJobMatchingService {
  // Main job matching function with AI-powered analysis
  async matchCandidateToJobs(
    candidateUserId: number,
    limit: number = 10,
    includeSkillGaps: boolean = true
  ): Promise<JobMatch[]> {
    // Get candidate data
    const candidateProfile = await storage.getCandidateProfileByUserId(candidateUserId);
    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    const cvs = await storage.getCVsByUserId(candidateUserId);
    const applications = await storage.getJobApplicationsByCandidateId(candidateUserId);

    // Analyze candidate using AI
    const candidateAnalysis = await this.analyzeCandidateWithAI(candidateProfile, cvs);

    // Get potential job matches
    const availableJobs = await this.getAvailableJobs(candidateUserId, limit * 3);

    // Score and analyze each job match using AI
    const jobMatches: JobMatch[] = [];
    
    for (const job of availableJobs) {
      const match = await this.analyzeJobMatchWithAI(
        candidateAnalysis,
        job,
        candidateProfile,
        includeSkillGaps
      );
      
      if (match.matchScore >= 30) { // Only include decent matches
        jobMatches.push(match);
      }
    }

    // Sort by match score and return top matches
    return jobMatches
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, limit);
  }

  // AI-powered candidate analysis
  private async analyzeCandidateWithAI(
    profile: CandidateProfile,
    cvs: CV[]
  ): Promise<CandidateAnalysis> {
    const prompt = `
    Analyze this candidate's profile and CVs to extract key information for job matching:

    Profile: ${JSON.stringify(profile, null, 2)}
    CVs: ${JSON.stringify(cvs, null, 2)}

    Please provide a comprehensive analysis including:
    1. Skills (technical and soft skills)
    2. Experience analysis (years, domains, seniority level)
    3. Education background
    4. Work preferences if available
    5. Key strengths
    6. Areas for improvement

    Return the analysis in this JSON format:
    {
      "skills": ["skill1", "skill2", ...],
      "experience": {
        "totalYears": number,
        "domains": ["domain1", "domain2", ...],
        "seniority": "entry|mid|senior|executive"
      },
      "education": {
        "level": "string",
        "fields": ["field1", "field2", ...]
      },
      "preferences": {
        "workType": "remote|hybrid|onsite",
        "salaryRange": {"min": number, "max": number},
        "locations": ["location1", ...],
        "industries": ["industry1", ...]
      },
      "strengths": ["strength1", "strength2", ...],
      "improvementAreas": ["area1", "area2", ...]
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
      console.error('Error analyzing candidate with AI:', error);
      // Fallback analysis
      return this.createFallbackCandidateAnalysis(profile, cvs);
    }
  }

  // AI-powered job match analysis
  private async analyzeJobMatchWithAI(
    candidateAnalysis: CandidateAnalysis,
    job: Job,
    candidateProfile: CandidateProfile,
    includeSkillGaps: boolean
  ): Promise<JobMatch> {
    const prompt = `
    Analyze the match between this candidate and job posting:

    Candidate Analysis:
    ${JSON.stringify(candidateAnalysis, null, 2)}

    Job Posting:
    Title: ${job.title}
    Company: ${job.companyName}
    Description: ${job.description}
    Required Skills: ${job.requiredSkills}
    Preferred Skills: ${job.preferredSkills}
    Experience Level: ${job.experienceLevel}
    Location: ${job.location}
    Work Type: ${job.workType}
    Salary Range: ${job.salaryMin}-${job.salaryMax} ${job.salaryCurrency}

    Please analyze:
    1. Skills match (matching vs missing skills, percentage)
    2. Experience match (score 0-100, analysis)
    3. Salary match (score 0-100, analysis)
    4. Location match (score 0-100, analysis)
    5. Overall match score (0-100)
    6. Detailed analysis and recommendations
    ${includeSkillGaps ? '7. Skill gaps with importance levels and learning suggestions' : ''}

    Return in this JSON format:
    {
      "matchScore": number,
      "skillsMatch": {
        "matching": ["skill1", ...],
        "missing": ["skill1", ...],
        "percentage": number
      },
      "experienceMatch": {
        "score": number,
        "analysis": "string"
      },
      "salaryMatch": {
        "score": number,
        "analysis": "string"
      },
      "locationMatch": {
        "score": number,
        "analysis": "string"
      },
      "overallAnalysis": "detailed analysis string",
      "recommendations": ["recommendation1", ...],
      "skillGaps": [
        {
          "skill": "string",
          "importance": "critical|important|nice-to-have",
          "description": "string",
          "learningResources": ["resource1", ...]
        }
      ]
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
          const aiAnalysis = JSON.parse(jsonMatch[0]);
          return {
            job,
            ...aiAnalysis
          };
        }
      }
      
      throw new Error('Failed to parse AI response');
    } catch (error) {
      console.error('Error analyzing job match with AI:', error);
      // Fallback analysis
      return this.createFallbackJobMatch(job, candidateAnalysis, candidateProfile);
    }
  }

  // Get skill gap analysis
  async getSkillGapAnalysis(
    candidateUserId: number,
    targetJobIds: number[]
  ): Promise<{
    overallGaps: SkillGap[];
    jobSpecificGaps: { [jobId: number]: SkillGap[] };
    recommendations: string[];
  }> {
    const candidateProfile = await storage.getCandidateProfileByUserId(candidateUserId);
    if (!candidateProfile) {
      throw new Error('Candidate profile not found');
    }

    const cvs = await storage.getCVsByUserId(candidateUserId);
    const candidateAnalysis = await this.analyzeCandidateWithAI(candidateProfile, cvs);

    const jobs = await Promise.all(
      targetJobIds.map(id => storage.getJobById(id))
    );

    const prompt = `
    Analyze skill gaps for this candidate across multiple target jobs:

    Candidate Skills: ${JSON.stringify(candidateAnalysis.skills)}
    Candidate Experience: ${JSON.stringify(candidateAnalysis.experience)}

    Target Jobs:
    ${jobs.map((job, index) => `
    Job ${index + 1} (ID: ${job?.id}):
    - Title: ${job?.title}
    - Required Skills: ${job?.requiredSkills}
    - Preferred Skills: ${job?.preferredSkills}
    - Experience Level: ${job?.experienceLevel}
    `).join('\n')}

    Provide:
    1. Overall skill gaps across all jobs
    2. Job-specific gaps for each position
    3. Learning recommendations prioritized by importance

    Return in JSON format:
    {
      "overallGaps": [
        {
          "skill": "string",
          "importance": "critical|important|nice-to-have",
          "description": "string",
          "learningResources": ["resource1", ...]
        }
      ],
      "jobSpecificGaps": {
        "jobId": [skill gaps array]
      },
      "recommendations": ["recommendation1", ...]
    }
    `;

    try {
      const response = await anthropic.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 4000,
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
      console.error('Error analyzing skill gaps with AI:', error);
      throw new Error('Failed to analyze skill gaps');
    }
  }

  // Private helper methods
  private async getAvailableJobs(candidateUserId: number, limit: number): Promise<Job[]> {
    const applications = await storage.getJobApplicationsByCandidateId(candidateUserId);
    const appliedJobIds = applications.map(app => app.jobId);

    const searchResult = await storage.searchJobs({}, 1, limit);
    
    return searchResult.jobs.filter(job => 
      !appliedJobIds.includes(job.id) && 
      job.status === 'published'
    );
  }

  private createFallbackCandidateAnalysis(
    profile: CandidateProfile,
    cvs: CV[]
  ): CandidateAnalysis {
    return {
      skills: (profile.skills as string[]) || [],
      experience: {
        totalYears: (profile.yearsOfExperience as number) || 0,
        domains: [],
        seniority: 'entry'
      },
      education: {
        level: 'Bachelor',
        fields: []
      },
      preferences: {
        workType: undefined,
        salaryRange: profile.expectedSalary ? 
          { min: profile.expectedSalary * 0.8, max: profile.expectedSalary * 1.2 } : 
          undefined,
        locations: profile.location ? [profile.location] : [],
        industries: []
      },
      strengths: [],
      improvementAreas: []
    };
  }

  private createFallbackJobMatch(
    job: Job,
    candidateAnalysis: CandidateAnalysis,
    candidateProfile: CandidateProfile
  ): JobMatch {
    const candidateSkills = candidateAnalysis.skills;
    const jobSkills = [
      ...(Array.isArray(job.requiredSkills) ? job.requiredSkills : []),
      ...(Array.isArray(job.preferredSkills) ? job.preferredSkills : [])
    ];

    const matchingSkills = candidateSkills.filter(skill => 
      jobSkills.some(jobSkill => 
        jobSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(jobSkill.toLowerCase())
      )
    );

    const skillsPercentage = jobSkills.length > 0 ? 
      (matchingSkills.length / jobSkills.length) * 100 : 0;

    return {
      job,
      matchScore: Math.min(skillsPercentage + 20, 85), // Basic calculation
      skillsMatch: {
        matching: matchingSkills,
        missing: jobSkills.filter(skill => !matchingSkills.includes(skill)),
        percentage: skillsPercentage
      },
      experienceMatch: {
        score: 70,
        analysis: 'Basic experience match calculation'
      },
      salaryMatch: {
        score: 80,
        analysis: 'Salary expectations alignment'
      },
      locationMatch: {
        score: job.workType === 'remote' ? 100 : 75,
        analysis: 'Location compatibility'
      },
      overallAnalysis: 'This is a potential match based on skills and experience.',
      recommendations: [
        'Review the job requirements carefully',
        'Tailor your CV to highlight relevant experience'
      ],
      skillGaps: []
    };
  }
}

// Create and export the service instance
export const aiJobMatchingService = new AIJobMatchingService();