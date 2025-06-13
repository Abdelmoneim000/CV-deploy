# Job Board & AI Job Features API Documentation

## Table of Contents

1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Job Management API](#job-management-api)
4. [Job Discovery API](#job-discovery-api)
5. [Job Application API](#job-application-api)
6. [Job Alerts API](#job-alerts-api)
7. [AI Job Matching API](#ai-job-matching-api)
8. [AI Job Enhancement API](#ai-job-enhancement-api)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)
11. [Examples](#examples)

---

## Overview

The Job Board & AI Job Features API provides comprehensive functionality for job posting, job discovery, application management, and AI-powered job matching and enhancement. The API supports two main user types:

- **Candidates**: Search and apply for jobs, receive AI-powered recommendations
- **HR Users**: Post jobs, manage applications, use AI for job enhancement and candidate screening

### Base URL
```
https://api.cvbuilder.com/api
```

### API Version
```
v1
```

---

## Authentication

All authenticated endpoints require a valid JWT token in the Authorization header.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

### User Roles
- **candidate**: Can search jobs, apply, save jobs, receive recommendations
- **hr**: Can post jobs, manage applications, screen candidates
- **admin**: Full system access

---

## Job Management API

### Create Job Posting

**POST** `/jobs`

Creates a new job posting (HR users only).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
Content-Type: application/json
```

**Request Body:**
```json
{
  "title": "Senior React Developer",
  "description": "We are looking for an experienced React developer...",
  "shortDescription": "Join our tech team as a Senior React Developer",
  "companyName": "TechCorp Inc.",
  "companyLogo": "https://example.com/logo.png",
  "companyWebsite": "https://techcorp.com",
  "location": "San Francisco, CA",
  "workType": "hybrid",
  "country": "USA",
  "city": "San Francisco",
  "categoryId": 1,
  "employmentType": "full-time",
  "experienceLevel": "senior",
  "salaryMin": 120000,
  "salaryMax": 180000,
  "salaryCurrency": "USD",
  "salaryPeriod": "yearly",
  "salaryNegotiable": true,
  "showSalary": true,
  "requiredSkills": ["React", "TypeScript", "Node.js"],
  "preferredSkills": ["GraphQL", "AWS", "Docker"],
  "requiredEducation": "Bachelor's degree in Computer Science",
  "requiredExperience": 5,
  "languages": [
    {
      "language": "English",
      "level": "advanced",
      "required": true
    }
  ],
  "benefits": ["Health Insurance", "401k", "Remote Work"],
  "perks": ["Free Lunch", "Gym Membership", "Learning Budget"],
  "applicationDeadline": "2024-03-01T23:59:59Z",
  "startDate": "2024-03-15T09:00:00Z",
  "applicationInstructions": "Please include your portfolio",
  "isUrgent": false,
  "isFeatured": true,
  "tags": ["frontend", "react", "javascript"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Senior React Developer",
    "status": "draft",
    "slug": "senior-react-developer-techcorp",
    "publishedAt": null,
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z",
    "hrUserId": 456,
    // ... all other job fields
  }
}
```

**Rate Limit:** 10 job posts per hour

---

### Update Job Posting

**PUT** `/jobs/:id`

Updates an existing job posting (HR users only, own jobs only).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
Content-Type: application/json
```

**Path Parameters:**
- `id` (integer): Job ID

**Request Body:** (All fields optional)
```json
{
  "title": "Updated Job Title",
  "description": "Updated description...",
  "status": "published",
  "salaryMax": 200000
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "title": "Updated Job Title",
    "status": "published",
    "publishedAt": "2024-01-15T11:00:00Z",
    "updatedAt": "2024-01-15T11:00:00Z"
    // ... updated job data
  }
}
```

---

### Get Job Details

**GET** `/jobs/:id/details`

Retrieves detailed job information with related data.

**Path Parameters:**
- `id` (integer): Job ID

**Query Parameters:**
```
includeCompanyJobs=true    # Include other jobs from same company
includeSimilarJobs=true    # Include similar job recommendations
```

**Response:**
```json
{
  "success": true,
  "data": {
    "job": {
      "id": 123,
      "title": "Senior React Developer",
      "description": "Detailed job description...",
      "companyName": "TechCorp Inc.",
      "location": "San Francisco, CA",
      "workType": "hybrid",
      "employmentType": "full-time",
      "experienceLevel": "senior",
      "salaryMin": 120000,
      "salaryMax": 180000,
      "requiredSkills": ["React", "TypeScript"],
      "benefits": ["Health Insurance", "401k"],
      "viewCount": 234,
      "applicationCount": 15,
      "status": "published",
      "publishedAt": "2024-01-15T11:00:00Z",
      "applicationDeadline": "2024-03-01T23:59:59Z"
    },
    "similarJobs": [
      {
        "id": 124,
        "title": "Frontend Developer",
        "companyName": "StartupXYZ",
        "location": "Remote",
        "salaryMin": 100000,
        "salaryMax": 140000
      }
    ],
    "companyJobs": [
      {
        "id": 125,
        "title": "Backend Developer",
        "location": "San Francisco, CA",
        "employmentType": "full-time"
      }
    ],
    "applicationStatus": {
      "hasApplied": true,
      "status": "reviewing",
      "appliedAt": "2024-01-16T09:00:00Z"
    },
    "isSaved": false
  }
}
```

---

### Manage Job Status

**PATCH** `/jobs/:id/status`

Updates job status (publish, pause, close).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Path Parameters:**
- `id` (integer): Job ID

**Request Body:**
```json
{
  "action": "publish",  // publish, pause, close, reopen
  "reason": "Ready for applications"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "status": "published",
    "publishedAt": "2024-01-15T12:00:00Z",
    "message": "Job successfully published"
  }
}
```

---

### Get HR Job Listings

**GET** `/jobs/my-jobs`

Retrieves job postings for the authenticated HR user.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Query Parameters:**
```
status=published          # Filter by status (draft, published, paused, closed)
search=developer         # Search in title and description
categoryId=1             # Filter by job category
page=1                   # Page number (default: 1)
limit=20                 # Results per page (default: 20, max: 100)
sortBy=createdAt         # Sort by: createdAt, updatedAt, title, applicationCount
sortOrder=desc           # Sort order: asc, desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 123,
        "title": "Senior React Developer",
        "status": "published",
        "applicationCount": 15,
        "viewCount": 234,
        "publishedAt": "2024-01-15T11:00:00Z",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "stats": {
      "totalJobs": 5,
      "publishedJobs": 3,
      "draftJobs": 1,
      "pausedJobs": 1,
      "totalApplications": 45,
      "totalViews": 1250
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "pages": 1
  }
}
```

---

### Delete Job Posting

**DELETE** `/jobs/:id`

Deletes a job posting (only drafts and closed jobs).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Path Parameters:**
- `id` (integer): Job ID

**Response:**
```json
{
  "success": true,
  "message": "Job posting deleted successfully"
}
```

---

## Job Discovery API

### Search Jobs

**GET** `/jobs`

Advanced job search with filters and personalization.

**Query Parameters:**
```
query=react developer        # General search term
location=san francisco      # Location filter
workType=remote,hybrid      # Work type filter (remote, hybrid, onsite)
employmentType=full-time    # Employment type filter
experienceLevel=senior      # Experience level filter
categoryId=1                # Category filter
salaryMin=100000           # Minimum salary filter
salaryMax=200000           # Maximum salary filter
skills=react,typescript     # Skills filter (comma-separated)
benefits=health,401k       # Benefits filter (comma-separated)
companySize=large          # Company size filter
posted=week                # Posted timeframe (today, week, month)
sortBy=relevance           # Sort by: relevance, date, salary
sortOrder=desc             # Sort order: asc, desc
page=1                     # Page number (default: 1)
limit=20                   # Results per page (default: 20, max: 50)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": 123,
        "title": "Senior React Developer",
        "companyName": "TechCorp Inc.",
        "companyLogo": "https://example.com/logo.png",
        "location": "San Francisco, CA",
        "workType": "hybrid",
        "employmentType": "full-time",
        "experienceLevel": "senior",
        "salaryMin": 120000,
        "salaryMax": 180000,
        "salaryCurrency": "USD",
        "requiredSkills": ["React", "TypeScript"],
        "benefits": ["Health Insurance", "401k"],
        "shortDescription": "Join our tech team...",
        "publishedAt": "2024-01-15T11:00:00Z",
        "applicationDeadline": "2024-03-01T23:59:59Z",
        "isUrgent": false,
        "isFeatured": true,
        "matchScore": 85,
        "applicationCount": 15,
        "saved": false
      }
    ],
    "facets": {
      "locations": [
        { "location": "San Francisco, CA", "count": 45 },
        { "location": "New York, NY", "count": 38 }
      ],
      "workTypes": [
        { "type": "remote", "count": 123 },
        { "type": "hybrid", "count": 87 }
      ],
      "salaryRanges": [
        { "range": "$100k-$150k", "count": 34 },
        { "range": "$150k-$200k", "count": 28 }
      ],
      "experienceLevels": [
        { "level": "senior", "count": 56 },
        { "level": "mid", "count": 78 }
      ]
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  }
}
```

---

### Get Personalized Recommendations

**GET** `/jobs/recommendations`

AI-powered job recommendations based on candidate profile.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Query Parameters:**
```
limit=10                   # Number of recommendations (default: 10, max: 50)
includeSkillGaps=true     # Include skill gap analysis
```

**Response:**
```json
{
  "success": true,
  "data": {
    "recommendations": [
      {
        "job": {
          "id": 123,
          "title": "Senior React Developer",
          "companyName": "TechCorp Inc.",
          "location": "San Francisco, CA",
          "salaryMin": 120000,
          "salaryMax": 180000,
          "requiredSkills": ["React", "TypeScript"]
        },
        "matchScore": 92,
        "matchReasons": [
          "Strong skill match with React and TypeScript",
          "Salary aligns with expectations",
          "Location preference matches"
        ],
        "skillGaps": [
          {
            "skill": "GraphQL",
            "importance": "important",
            "description": "Would enhance backend integration capabilities"
          }
        ]
      }
    ],
    "totalRecommendations": 25,
    "profileCompleteness": 85,
    "improvementTips": [
      "Add more details to your experience section",
      "Include portfolio links for better matches"
    ]
  }
}
```

---

### Get Trending Jobs

**GET** `/jobs/trending`

Retrieves currently trending job postings.

**Query Parameters:**
```
limit=10                   # Number of trending jobs (default: 10, max: 20)
timeframe=week            # Trending timeframe (day, week, month)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trendingJobs": [
      {
        "id": 123,
        "title": "Senior React Developer",
        "companyName": "TechCorp Inc.",
        "location": "San Francisco, CA",
        "viewCount": 1250,
        "applicationCount": 45,
        "trendingScore": 95,
        "publishedAt": "2024-01-15T11:00:00Z"
      }
    ],
    "trendingSkills": [
      "React", "TypeScript", "Python", "AWS"
    ],
    "trendingLocations": [
      "San Francisco, CA", "New York, NY", "Remote"
    ]
  }
}
```

---

## Job Application API

### Apply for Job

**POST** `/jobs/:id/apply`

Submit an application for a specific job.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Path Parameters:**
- `id` (integer): Job ID

**Request Body:**
```json
{
  "cvId": 456,
  "coverLetter": "I am excited to apply for this position...",
  "additionalNotes": "Available to start immediately",
  "portfolioUrl": "https://myportfolio.com"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application submitted successfully",
  "data": {
    "id": 789,
    "jobId": 123,
    "candidateUserId": 456,
    "cvId": 456,
    "status": "pending",
    "appliedAt": "2024-01-16T09:00:00Z",
    "applicationNumber": "APP-2024-001"
  }
}
```

---

### Get My Applications

**GET** `/applications/my-applications`

Retrieves all applications for the authenticated candidate.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Query Parameters:**
```
status=pending            # Filter by status
search=developer         # Search in job title/company
page=1                   # Page number
limit=20                 # Results per page
sortBy=appliedAt         # Sort by: appliedAt, updatedAt, status
sortOrder=desc           # Sort order: asc, desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": 789,
        "jobId": 123,
        "status": "reviewing",
        "appliedAt": "2024-01-16T09:00:00Z",
        "updatedAt": "2024-01-17T10:00:00Z",
        "job": {
          "id": 123,
          "title": "Senior React Developer",
          "companyName": "TechCorp Inc.",
          "location": "San Francisco, CA",
          "companyLogo": "https://example.com/logo.png"
        },
        "timeline": [
          {
            "status": "pending",
            "timestamp": "2024-01-16T09:00:00Z",
            "description": "Application submitted"
          },
          {
            "status": "reviewing",
            "timestamp": "2024-01-17T10:00:00Z",
            "description": "Application under review"
          }
        ]
      }
    ],
    "stats": {
      "totalApplications": 12,
      "pendingApplications": 5,
      "reviewingApplications": 4,
      "rejectedApplications": 2,
      "interviewsScheduled": 1
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "pages": 1
  }
}
```

---

### Withdraw Application

**PUT** `/applications/:id/withdraw`

Withdraw a submitted application.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Path Parameters:**
- `id` (integer): Application ID

**Request Body:**
```json
{
  "reason": "Found another opportunity"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application withdrawn successfully",
  "data": {
    "id": 789,
    "status": "withdrawn",
    "withdrawnAt": "2024-01-18T14:30:00Z"
  }
}
```

---

### Get Job Applications (HR)

**GET** `/jobs/:id/applications`

Retrieves applications for a specific job (HR users only).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Path Parameters:**
- `id` (integer): Job ID

**Query Parameters:**
```
status=pending            # Filter by application status
rating=5                 # Filter by HR rating
aiScore=80               # Filter by AI score (minimum)
search=john              # Search in candidate name
page=1                   # Page number
limit=20                 # Results per page
sortBy=appliedAt         # Sort by: appliedAt, aiScore, hrRating
sortOrder=desc           # Sort order: asc, desc
```

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "id": 789,
        "candidateUserId": 456,
        "status": "pending",
        "appliedAt": "2024-01-16T09:00:00Z",
        "aiScore": 85,
        "hrRating": null,
        "candidate": {
          "firstName": "John",
          "lastName": "Doe",
          "title": "React Developer",
          "location": "San Francisco, CA",
          "email": "john.doe@example.com",
          "avatar": "https://example.com/avatar.jpg"
        },
        "cv": {
          "id": 456,
          "title": "John Doe - React Developer CV"
        },
        "coverLetter": "I am excited to apply...",
        "portfolioUrl": "https://johndoe.dev"
      }
    ],
    "stats": {
      "totalApplications": 45,
      "pendingApplications": 20,
      "reviewingApplications": 15,
      "shortlistedApplications": 5,
      "averageAiScore": 78
    }
  },
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

---

### Update Application Status (HR)

**PUT** `/applications/:id/status`

Update the status of a job application (HR users only).

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Path Parameters:**
- `id` (integer): Application ID

**Request Body:**
```json
{
  "status": "shortlisted",
  "hrNotes": "Strong technical background, good culture fit",
  "hrRating": 4,
  "interviewScheduledAt": "2024-01-20T14:00:00Z",
  "interviewType": "video",
  "responseDeadline": "2024-01-25T17:00:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Application status updated successfully",
  "data": {
    "id": 789,
    "status": "shortlisted",
    "hrRating": 4,
    "updatedAt": "2024-01-18T10:00:00Z",
    "interviewScheduledAt": "2024-01-20T14:00:00Z"
  }
}
```

---

## Job Alerts API

### Create Job Alert

**POST** `/job-alerts`

Create a new job alert for personalized notifications.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Request Body:**
```json
{
  "keywords": "react developer",
  "location": "San Francisco, CA",
  "workType": "remote",
  "employmentType": "full-time",
  "experienceLevel": "senior",
  "salaryMin": 120000,
  "categoryId": 1,
  "skills": ["React", "TypeScript"],
  "frequency": "daily"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "keywords": "react developer",
    "location": "San Francisco, CA",
    "frequency": "daily",
    "isActive": true,
    "createdAt": "2024-01-15T10:00:00Z"
  }
}
```

---

### Get Job Alerts

**GET** `/job-alerts`

Retrieves all job alerts for the authenticated candidate.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "alerts": [
      {
        "id": 123,
        "keywords": "react developer",
        "location": "San Francisco, CA",
        "workType": "remote",
        "frequency": "daily",
        "isActive": true,
        "lastSentAt": "2024-01-17T08:00:00Z",
        "matchingJobsCount": 15,
        "createdAt": "2024-01-15T10:00:00Z"
      }
    ],
    "totalAlerts": 3,
    "activeAlerts": 2
  }
}
```

---

### Update Job Alert

**PUT** `/job-alerts/:id`

Update an existing job alert.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Path Parameters:**
- `id` (integer): Job alert ID

**Request Body:**
```json
{
  "keywords": "senior react developer",
  "salaryMin": 140000,
  "frequency": "weekly",
  "isActive": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "keywords": "senior react developer",
    "salaryMin": 140000,
    "frequency": "weekly",
    "updatedAt": "2024-01-18T10:00:00Z"
  }
}
```

---

### Delete Job Alert

**DELETE** `/job-alerts/:id`

Delete a job alert.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Path Parameters:**
- `id` (integer): Job alert ID

**Response:**
```json
{
  "success": true,
  "message": "Job alert deleted successfully"
}
```

---

## AI Job Matching API

### Get AI Job Matches

**GET** `/ai/job-matches/:candidateId`

Get AI-powered job recommendations for a specific candidate.

**Headers:**
```
Authorization: Bearer <access_token>
```

**Path Parameters:**
- `candidateId` (integer): Candidate user ID

**Query Parameters:**
```
limit=10                  # Number of matches (default: 10, max: 50)
includeSkillGaps=true    # Include skill gap analysis
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "job": {
        "id": 123,
        "title": "Senior React Developer",
        "companyName": "TechCorp Inc.",
        "location": "San Francisco, CA",
        "salaryMin": 120000,
        "salaryMax": 180000,
        "requiredSkills": ["React", "TypeScript", "Node.js"],
        "workType": "hybrid"
      },
      "matchScore": 92,
      "skillsMatch": {
        "matching": ["React", "TypeScript", "JavaScript"],
        "missing": ["GraphQL", "AWS"],
        "percentage": 75
      },
      "experienceMatch": {
        "score": 88,
        "analysis": "Candidate has 6 years of experience which exceeds the 5-year requirement"
      },
      "salaryMatch": {
        "score": 95,
        "analysis": "Salary range aligns perfectly with candidate expectations"
      },
      "locationMatch": {
        "score": 100,
        "analysis": "Perfect location match with hybrid work preference"
      },
      "overallAnalysis": "Excellent match based on technical skills, experience level, and location preferences. The candidate's React and TypeScript expertise aligns perfectly with job requirements.",
      "recommendations": [
        "Highlight your React component architecture experience",
        "Consider learning GraphQL to strengthen your backend integration skills",
        "Emphasize your TypeScript proficiency in your application"
      ],
      "skillGaps": [
        {
          "skill": "GraphQL",
          "importance": "important",
          "description": "Would enhance API development capabilities",
          "learningResources": [
            "GraphQL official documentation",
            "Apollo GraphQL tutorial",
            "The Road to GraphQL book"
          ]
        },
        {
          "skill": "AWS",
          "importance": "nice-to-have",
          "description": "Cloud deployment knowledge would be beneficial",
          "learningResources": [
            "AWS Free Tier tutorials",
            "AWS Certified Developer course"
          ]
        }
      ]
    }
  ]
}
```

**Rate Limit:** 20 requests per hour

---

### Get Skill Gap Analysis

**POST** `/ai/skill-gap-analysis`

Analyze skill gaps for specific target jobs.

**Headers:**
```
Authorization: Bearer <access_token> (Candidate role required)
```

**Request Body:**
```json
{
  "targetJobIds": [123, 124, 125]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "overallGaps": [
      {
        "skill": "GraphQL",
        "importance": "critical",
        "description": "Essential for modern API development in target roles",
        "learningResources": [
          "GraphQL official documentation",
          "Apollo GraphQL tutorial",
          "Full Stack GraphQL course on Udemy"
        ]
      },
      {
        "skill": "Docker",
        "importance": "important",
        "description": "Containerization skills needed for DevOps integration",
        "learningResources": [
          "Docker official tutorial",
          "Docker Mastery course",
          "Kubernetes basics"
        ]
      }
    ],
    "jobSpecificGaps": {
      "123": [
        {
          "skill": "GraphQL",
          "importance": "critical",
          "description": "Required for this specific role's API architecture"
        }
      ],
      "124": [
        {
          "skill": "Vue.js",
          "importance": "important",
          "description": "Alternative framework used in this position"
        }
      ]
    },
    "recommendations": [
      "Focus on learning GraphQL first as it appears in multiple target roles",
      "Consider Docker certification to strengthen DevOps skills",
      "Build a portfolio project showcasing GraphQL integration",
      "Practice with Apollo Client for frontend GraphQL integration"
    ]
  }
}
```

**Rate Limit:** 10 requests per hour

---

## AI Job Enhancement API

### Enhance Job Description

**POST** `/ai/enhance-job-description`

Improve job posting content using AI analysis.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Request Body:**
```json
{
  "title": "React Developer",
  "companyName": "TechCorp Inc.",
  "description": "We need a React developer to build our web app.",
  "location": "San Francisco, CA",
  "workType": "hybrid",
  "employmentType": "full-time",
  "experienceLevel": "senior",
  "requiredSkills": ["React", "JavaScript"],
  "benefits": ["Health Insurance"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "improvedDescription": "Join TechCorp Inc. as a Senior React Developer and lead the development of cutting-edge web applications. You'll work with a dynamic team to create scalable, high-performance user interfaces that serve thousands of users daily. This hybrid role offers the perfect balance of collaborative in-office work and flexible remote time.\n\nKey Responsibilities:\n• Develop and maintain complex React applications\n• Collaborate with cross-functional teams including designers and backend developers\n• Implement modern frontend architectures and best practices\n• Mentor junior developers and contribute to technical decisions",
    "suggestedSkills": [
      "TypeScript",
      "Redux",
      "Jest",
      "Webpack",
      "CSS-in-JS",
      "GraphQL",
      "Node.js"
    ],
    "salaryRange": {
      "min": 130000,
      "max": 180000,
      "currency": "USD",
      "justification": "Based on senior React developer market rates in San Francisco for companies of similar size and industry"
    },
    "improvementAreas": [
      "Add specific project examples or technologies used",
      "Include company culture and growth opportunities",
      "Specify team size and reporting structure",
      "Add information about the product and user base"
    ],
    "seoKeywords": [
      "senior react developer",
      "frontend engineer",
      "javascript developer",
      "react jobs san francisco",
      "hybrid work",
      "web development"
    ],
    "attractivenessScore": 78
  }
}
```

**Rate Limit:** 20 requests per hour

---

### Suggest Salary Range

**POST** `/ai/suggest-salary`

Get AI-powered salary recommendations based on market data.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Request Body:**
```json
{
  "jobTitle": "Senior React Developer",
  "location": "San Francisco, CA",
  "experienceLevel": "senior",
  "skills": ["React", "TypeScript", "Node.js", "GraphQL"],
  "companySize": "medium"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "suggestedMin": 140000,
    "suggestedMax": 200000,
    "currency": "USD",
    "marketData": {
      "averageSalary": 170000,
      "salaryRange": {
        "min": 130000,
        "max": 220000
      },
      "factors": [
        "High demand for React developers in San Francisco",
        "Premium location with high cost of living",
        "Senior level experience commands higher compensation",
        "TypeScript and GraphQL skills add 10-15% premium",
        "Medium company size typically offers competitive packages"
      ]
    },
    "justification": "The suggested range reflects current market conditions for senior React developers in San Francisco. The high-demand skills like TypeScript and GraphQL justify the upper range. Consider the total compensation package including equity and benefits when making final decisions."
  }
}
```

**Rate Limit:** 15 requests per hour

---

### Screen Applications with AI

**POST** `/ai/screen-applications`

Use AI to automatically screen job applications.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Request Body:**
```json
{
  "jobId": 123,
  "applicationId": 789
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "score": 87,
    "recommendation": "accept",
    "strengths": [
      "Strong technical background with 6+ years React experience",
      "Relevant project experience in similar industry",
      "Good communication skills evident in cover letter",
      "Educational background aligns with role requirements",
      "Portfolio demonstrates advanced React patterns and best practices"
    ],
    "concerns": [
      "Limited experience with GraphQL (mentioned in job requirements)",
      "No mention of testing frameworks experience",
      "Gap in employment history from 2022-2023 needs clarification"
    ],
    "questions": [
      "Can you explain the employment gap in 2022-2023?",
      "What is your experience with GraphQL and would you be comfortable learning it?",
      "Tell us about your approach to testing React components",
      "How do you handle state management in large applications?",
      "Describe a challenging technical problem you solved recently"
    ],
    "summary": "This candidate presents a strong profile for the Senior React Developer position. Their extensive React experience, relevant project portfolio, and clear communication make them an excellent fit. The main areas to explore in an interview would be their GraphQL experience and the employment gap. Overall, this is a highly recommended candidate who should proceed to the interview stage."
  }
}
```

**Rate Limit:** 30 requests per hour

---

### Batch Screen Applications

**POST** `/ai/batch-screen-applications`

Screen multiple applications at once using AI.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Request Body:**
```json
{
  "jobId": 123,
  "applicationIds": [789, 790, 791, 792]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "applicationId": 789,
        "score": 87,
        "recommendation": "accept",
        "summary": "Strong candidate with excellent React skills..."
      },
      {
        "applicationId": 790,
        "score": 72,
        "recommendation": "review",
        "summary": "Good candidate but needs clarification on experience..."
      },
      {
        "applicationId": 791,
        "score": 45,
        "recommendation": "reject",
        "summary": "Insufficient experience for senior role requirements..."
      }
    ],
    "errors": [
      "Failed to screen application 792: Application not found"
    ],
    "screened": 3,
    "failed": 1
  }
}
```

**Rate Limit:** 10 requests per hour

---

### Analyze Job Performance

**GET** `/ai/job-performance/:jobId`

Get AI analysis of job posting performance.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Path Parameters:**
- `jobId` (integer): Job ID

**Response:**
```json
{
  "success": true,
  "data": {
    "performanceScore": 68,
    "issues": [
      "Low application rate (2.3%) compared to industry average (4.5%)",
      "High view count but low engagement suggests title/description mismatch",
      "Salary range may be below market expectations",
      "Job description lacks specific technical requirements"
    ],
    "suggestions": [
      "Revise job title to be more specific and searchable",
      "Increase salary range by 15-20% to match market rates",
      "Add specific technology stack and project details",
      "Include company culture and growth opportunities",
      "Optimize for relevant keywords in tech job searches"
    ],
    "optimizations": {
      "title": "Senior React Developer - Frontend Engineer",
      "description": "Join our innovative team as a Senior React Developer and build the next generation of web applications that impact millions of users...",
      "keywords": [
        "senior react developer",
        "frontend engineer",
        "typescript developer",
        "remote react jobs",
        "startup engineer"
      ]
    }
  }
}
```

**Rate Limit:** 10 requests per hour

---

### Generate Job Posting

**POST** `/ai/generate-job-posting`

Generate a complete job posting from basic requirements.

**Headers:**
```
Authorization: Bearer <access_token> (HR role required)
```

**Request Body:**
```json
{
  "title": "Senior React Developer",
  "company": "TechCorp Inc.",
  "location": "San Francisco, CA",
  "workType": "hybrid",
  "experienceLevel": "senior",
  "keyRequirements": [
    "5+ years React experience",
    "TypeScript proficiency",
    "Team leadership experience"
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "description": "TechCorp Inc. is seeking an exceptional Senior React Developer to join our dynamic engineering team in San Francisco. You'll play a pivotal role in building scalable, high-performance web applications that serve our growing user base of over 1 million customers.\n\nAs a Senior React Developer, you'll work in a collaborative hybrid environment, spending 3 days in our modern downtown office and 2 days working remotely. You'll have the opportunity to mentor junior developers, influence technical decisions, and contribute to our product roadmap.\n\nWe're looking for someone passionate about creating exceptional user experiences and staying current with the latest frontend technologies.",
    "requirements": [
      "5+ years of professional React development experience",
      "Strong proficiency in TypeScript and modern JavaScript (ES6+)",
      "Experience leading and mentoring development teams",
      "Solid understanding of React ecosystem (Redux, React Router, etc.)",
      "Experience with testing frameworks (Jest, React Testing Library)",
      "Knowledge of modern build tools (Webpack, Vite) and CI/CD pipelines",
      "Strong communication skills and ability to collaborate effectively",
      "Bachelor's degree in Computer Science or equivalent experience"
    ],
    "responsibilities": [
      "Design and develop complex React applications and components",
      "Lead technical discussions and architectural decisions",
      "Mentor junior developers and conduct code reviews",
      "Collaborate with designers, product managers, and backend engineers",
      "Optimize application performance and ensure cross-browser compatibility",
      "Implement and maintain comprehensive testing strategies",
      "Stay current with React ecosystem and frontend best practices",
      "Contribute to technical documentation and development processes"
    ],
    "benefits": [
      "Competitive salary range: $140,000 - $200,000",
      "Comprehensive health, dental, and vision insurance",
      "401(k) with company matching up to 6%",
      "Flexible hybrid work arrangement",
      "Professional development budget ($3,000 annually)",
      "Top-tier equipment and home office setup allowance",
      "Unlimited PTO policy",
      "Stock options with high growth potential",
      "Free lunch and snacks in the office",
      "Gym membership reimbursement"
    ],
    "skills": [
      "React",
      "TypeScript",
      "JavaScript",
      "Redux",
      "React Router",
      "Jest",
      "React Testing Library",
      "Webpack",
      "CSS-in-JS",
      "GraphQL",
      "RESTful APIs",
      "Git",
      "Agile methodologies"
    ]
  }
}
```

**Rate Limit:** 15 requests per hour

---

## Error Handling

### Standard Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {
    "field": "Specific field error",
    "validation": ["Array of validation errors"]
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "path": "/api/jobs/123"
}
```

### Common Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication token |
| `FORBIDDEN` | 403 | Insufficient permissions for the requested action |
| `NOT_FOUND` | 404 | Requested resource not found |
| `VALIDATION_ERROR` | 400 | Request data validation failed |
| `RATE_LIMIT_EXCEEDED` | 429 | API rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `AI_SERVICE_ERROR` | 503 | AI service temporarily unavailable |
| `DUPLICATE_APPLICATION` | 409 | Candidate has already applied for this job |
| `JOB_EXPIRED` | 410 | Job posting has expired |
| `INSUFFICIENT_CREDITS` | 402 | Not enough AI credits for the requested operation |

### Validation Errors

Validation errors include detailed field-level information:

```json
{
  "success": false,
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "title": "Title is required",
    "salaryMin": "Minimum salary must be greater than 0",
    "requiredSkills": "At least one skill is required"
  }
}
```

---

## Rate Limiting

### Rate Limits by Endpoint Category

| Category | Limit | Window |
|----------|-------|--------|
| Job Search | 100 requests | 1 hour |
| Job Creation/Update | 10 requests | 1 hour |
| Applications | 50 requests | 1 hour |
| AI Job Matching | 20 requests | 1 hour |
| AI Enhancement | 20 requests | 1 hour |
| AI Screening | 30 requests | 1 hour |

### Rate Limit Headers

All responses include rate limiting information:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642248000
X-RateLimit-Window: 3600
```

### Rate Limit Exceeded Response

```json
{
  "success": false,
  "error": "Rate limit exceeded",
  "code": "RATE_LIMIT_EXCEEDED",
  "details": {
    "limit": 20,
    "window": 3600,
    "resetAt": "2024-01-15T11:30:00Z"
  }
}
```

---

## Examples

### Complete Job Posting Flow

#### 1. Create Draft Job
```bash
curl -X POST https://api.cvbuilder.com/api/jobs \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior React Developer",
    "description": "We are looking for an experienced React developer...",
    "companyName": "TechCorp Inc.",
    "location": "San Francisco, CA",
    "workType": "hybrid",
    "employmentType": "full-time",
    "experienceLevel": "senior",
    "salaryMin": 140000,
    "salaryMax": 200000,
    "requiredSkills": ["React", "TypeScript", "Node.js"]
  }'
```

#### 2. Enhance with AI
```bash
curl -X POST https://api.cvbuilder.com/api/ai/enhance-job-description \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Senior React Developer",
    "companyName": "TechCorp Inc.",
    "description": "We are looking for an experienced React developer...",
    "location": "San Francisco, CA",
    "workType": "hybrid",
    "employmentType": "full-time",
    "experienceLevel": "senior",
    "requiredSkills": ["React", "TypeScript", "Node.js"]
  }'
```

#### 3. Update and Publish Job
```bash
curl -X PUT https://api.cvbuilder.com/api/jobs/123 \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Enhanced description from AI...",
    "requiredSkills": ["React", "TypeScript", "Node.js", "GraphQL"],
    "status": "published"
  }'
```

---

### Candidate Job Search Flow

#### 1. Search Jobs
```bash
curl -X GET "https://api.cvbuilder.com/api/jobs?query=react%20developer&location=san%20francisco&workType=remote,hybrid&salaryMin=120000" \
  -H "Authorization: Bearer YOUR_CANDIDATE_TOKEN"
```

#### 2. Get AI Recommendations
```bash
curl -X GET "https://api.cvbuilder.com/api/ai/job-matches/456?limit=10&includeSkillGaps=true" \
  -H "Authorization: Bearer YOUR_CANDIDATE_TOKEN"
```

#### 3. Apply for Job
```bash
curl -X POST https://api.cvbuilder.com/api/jobs/123/apply \
  -H "Authorization: Bearer YOUR_CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cvId": 789,
    "coverLetter": "I am excited to apply for this position...",
    "portfolioUrl": "https://myportfolio.com"
  }'
```

#### 4. Create Job Alert
```bash
curl -X POST https://api.cvbuilder.com/api/job-alerts \
  -H "Authorization: Bearer YOUR_CANDIDATE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": "senior react developer",
    "location": "San Francisco, CA",
    "workType": "remote",
    "salaryMin": 140000,
    "frequency": "daily"
  }'
```

---

### AI-Powered Application Screening

#### 1. Get Job Applications
```bash
curl -X GET "https://api.cvbuilder.com/api/jobs/123/applications?status=pending&limit=20" \
  -H "Authorization: Bearer YOUR_HR_TOKEN"
```

#### 2. Screen Applications with AI
```bash
curl -X POST https://api.cvbuilder.com/api/ai/batch-screen-applications \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": 123,
    "applicationIds": [789, 790, 791]
  }'
```

#### 3. Update Application Status
```bash
curl -X PUT https://api.cvbuilder.com/api/applications/789/status \
  -H "Authorization: Bearer YOUR_HR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "shortlisted",
    "hrRating": 4,
    "hrNotes": "Strong technical background, good culture fit",
    "interviewScheduledAt": "2024-01-20T14:00:00Z"
  }'
```

---

This comprehensive API documentation covers all the job board and AI job features, providing detailed information about endpoints, request/response formats, error handling, and practical examples. The API is designed to support both candidates and HR users with powerful AI-enhanced functionality for job matching, application screening, and job posting optimization.