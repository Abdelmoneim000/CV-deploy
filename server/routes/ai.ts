import express from 'express';
import { 
  improveText,  
  translateCV, 
  analyzeCVSections, 
  suggestSectionEmoji,
  generateContentSuggestions,
  ContentSuggestionType
} from '../services/openai';
import { adaptCVToJobOffer } from '../services/anthropic';
import { z } from 'zod';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import * as aiService from '../services/aiService';
import { aiJobMatchingService } from '../services/aiJobMatchingService';
import { aiJobEnhancementService } from '../services/aiJobEnhancementService';
import { storage } from 'server/storage';
import { User } from '@shared/schema';
import { anthropic } from '../services/anthropic';

const  router = express.Router();

// Schéma de validation pour les requêtes d'amélioration de texte
const improveTextSchema = z.object({
  text: z.string().min(1),
  sectionType: z.string(),
  customPrompt: z.string().optional(),
});

// Schéma de validation pour les requêtes d'adaptation de CV
const adaptCVSchema = z.object({
  cv: z.any(),
  jobDescription: z.string().optional().default(''),
  jobUrl: z.string().optional().default('')
}).refine(data => data.jobDescription.length > 0 || data.jobUrl.length > 0, {
  message: "Vous devez fournir une description de poste ou une URL d'offre d'emploi"
});

// Update the translateCVSchema to include Claude option
const translateCVSchema = z.object({
  cv: z.any(),
  targetLanguage: z.string().min(2),
  service: z.enum(['openai', 'gemini', 'claude']).optional(),
});

// Route pour améliorer le texte d'une section
router.post('/improve-text', async (req, res) => {
  try {
    const validation = improveTextSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: validation.error.errors 
      });
    }

    const { text, sectionType, customPrompt } = validation.data;
    const improvedText = await improveText(text, sectionType, customPrompt);
    
    res.json({ improvedText });
  } catch (error: any) {
    console.error('Erreur lors de l\'amélioration du texte:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Route pour adapter le CV à une offre d'emploi
router.post('/adapt-cv', async (req, res) => {
  try {
    const validation = adaptCVSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: validation.error.errors 
      });
    }

    const { cv, jobDescription } = validation.data;
    let finalJobDescription = jobDescription;
    
    // Si nous avons une URL mais pas de description, récupérer le contenu de l'URL
    // if (!jobDescription) {
    //   try {
        // Vérifier que l'URL est valide
    //     new URL(jobUrl);
        
    //     // Récupérer le contenu de l'URL
    //     const response = await fetch(jobUrl);
    //     if (!response.ok) {
    //       throw new Error(`Erreur lors de la récupération de l'URL: ${response.statusText}`);
    //     }
        
    //     const html = await response.text();
        
    //     // Extraire les informations pertinentes
    //     finalJobDescription = await improveText(html, 'default', 
    //       "Extraire les informations pertinentes de cette page d'offre d'emploi. Inclure le titre du poste, l'entreprise, la description et les compétences requises. Ignorer les publicités et autres contenus non pertinents."
    //     );
    //   } catch (error) {
    //     console.error("Erreur lors de la récupération de l'URL:", error);
    //     return res.status(400).json({ message: "Impossible de récupérer le contenu de l'URL fournie" });
    //   }
    // }
    
    // Adapter le CV avec la description obtenue
    const adaptedCV = await adaptCVToJobOffer(cv, finalJobDescription);
    
    res.json({ adaptedCV });
  } catch (error: any) {
    console.error('Erreur lors de l\'adaptation du CV:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Route pour traduire le CV
router.post('/translate-cv', async (req, res) => {
  try {
    const validation = translateCVSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: validation.error.errors 
      });
    }

    const { cv, targetLanguage, service } = validation.data;
    // Use the aiService abstraction instead of direct OpenAI call
    const translatedCV = await aiService.translateCV(cv, targetLanguage, service);
    
    res.json({ translatedCV });
  } catch (error: any) {
    console.error('Erreur lors de la traduction du CV:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Route pour récupérer le contenu d'une URL d'offre d'emploi
router.post('/fetch-job-url', async (req, res) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ message: "URL manquante" });
    }
    
    // Vérifier que l'URL est valide
    try {
      new URL(url);
    } catch (e) {
      return res.status(400).json({ message: "URL invalide" });
    }
    
    // Récupérer le contenu de l'URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération de l'URL: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Utiliser OpenAI pour extraire les informations pertinentes de l'offre d'emploi
    const extractedContent = await improveText(html, 'default', 
      "Extraire les informations pertinentes de cette page d'offre d'emploi. Inclure le titre du poste, l'entreprise, la description et les compétences requises. Ignorer les publicités et autres contenus non pertinents."
    );
    
    res.json({ content: extractedContent });
  } catch (error: any) {
    console.error('Erreur lors de la récupération de l\'URL:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Route générale pour la génération
router.post('/generate', async (req, res) => {
  try {
    const { prompt, cvData, service } = req.body;
    
    // Extract relevant sections from CV data
    const cvText = JSON.stringify(cvData);
    
    // Determine which section we're working with based on the prompt
    const sectionType = determineSectionType(prompt);
    
    // Generate the improved text using the AI service
    const suggestion = await aiService.improveText(
      cvText,
      sectionType,
      prompt,
      service // Optional parameter to force a specific service
    );
    
    res.json({ suggestion });
  } catch (error) {
    console.error('Error generating AI content:', error);
    res.status(500).json({ error: 'Failed to generate AI content' });
  }
});

// Helper function to determine section type from prompt
function determineSectionType(prompt: string): string {
  prompt = prompt.toLowerCase();
  
  if (prompt.includes('summary') || prompt.includes('résumé')) {
    return 'summary';
  } else if (prompt.includes('experience') || prompt.includes('job')) {
    return 'experience';
  } else if (prompt.includes('skill')) {
    return 'skills';
  } else if (prompt.includes('education')) {
    return 'education';
  } else {
    return 'general';
  }
}

// Schéma de validation pour les requêtes d'analyse de CV
const analyzeCVSchema = z.object({
  cv: z.any(),
  jobPosition: z.string().optional(),
  service: z.enum(['openai', 'gemini', 'claude']).optional(),
});

// Route pour analyser les sections du CV et fournir des scores de pertinence
router.post('/analyze-cv', async (req, res) => {
  try {
    const validation = analyzeCVSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: validation.error.errors 
      });
    }

    const { cv, jobPosition, service } = validation.data;
    const analysis = await aiService.analyzeCVSections(cv, jobPosition, service);
    
    res.json({ analysis });
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse du CV:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Schéma de validation pour les suggestions d'emoji de section
const suggestEmojiSchema = z.object({
  sectionType: z.string(),
  sectionTitle: z.string(),
  sectionContent: z.string().optional(),
});

// Route pour obtenir des suggestions d'emoji pour une section
router.post('/suggest-emoji', async (req, res) => {
  try {
    const validation = suggestEmojiSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: validation.error.errors 
      });
    }

    const { sectionType, sectionTitle, sectionContent } = validation.data;
    const emojis = await suggestSectionEmoji(sectionType, sectionTitle, sectionContent);
    
    res.json({ emojis });
  } catch (error: any) {
    console.error('Erreur lors de la suggestion d\'emojis:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Schéma de validation pour les suggestions de contenu
const contentSuggestionSchema = z.object({
  cv: z.any(),
  sectionType: z.string(),
  jobPosition: z.string().optional(),
});

// Route pour générer des suggestions de contenu intelligent
router.post('/content-suggestions', async (req, res) => {
  try {
    const validation = contentSuggestionSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        message: "Données invalides", 
        errors: validation.error.errors 
      });
    }

    const { cv, sectionType, jobPosition } = validation.data;
    
    // Valider le type de section
    const validSectionTypes = [
      'summary', 'experience', 'education', 'skills', 
      'languages', 'achievements', 'strengths'
    ];
    
    if (!validSectionTypes.includes(sectionType)) {
      return res.status(400).json({ 
        message: `Type de section invalide. Valeurs acceptées: ${validSectionTypes.join(', ')}` 
      });
    }
    
    // Générer les suggestions avec un ID unique pour chacune
    const suggestions = await generateContentSuggestions(
      cv, 
      sectionType as ContentSuggestionType,
      jobPosition
    );
    
    // Assurons-nous que chaque suggestion a un ID
    const processedSuggestions = suggestions.map(suggestion => ({
      ...suggestion,
      id: suggestion.id || uuidv4()
    }));
    
    res.json({ suggestions: processedSuggestions });
  } catch (error: any) {
    console.error('Erreur lors de la génération de suggestions de contenu:', error);
    res.status(500).json({ message: error.message || "Erreur serveur" });
  }
});

// Schéma de validation pour la révision de texte de section
const reviewSectionSchema = z.object({
  text: z.string().min(1),
  sectionType: z.string(),
  service: z.enum(['openai', 'gemini', 'claude']).optional(),
});

// Route pour réviser le texte d'une section et suggérer des corrections
router.post('/review-section', async (req, res) => {
  try {
    const validation = reviewSectionSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        message: "Invalid data",
        errors: validation.error.errors
      });
    }
    
    const { text, sectionType, service } = validation.data;
    
    // Call AI service to review text
    const review = await aiService.reviewSection(text, sectionType, service);
    
    // Format the response to ensure backward compatibility
    const response = {
      issues: review.issues || [],
      suggestion: review.suggestion || "Improve text clarity and impact",
      improvedText: review.improvedText || text,
      // For backward compatibility with older frontend code
      improvedDescriptions: [review.improvedText || text]
    };
    
    res.json(response);
  } catch (error: any) {
    console.error('Error during section review:', error);
    res.status(500).json({ 
      message: error.message || "Server error",
      issues: [],
      improvedText: "",
      improvedDescriptions: []
    });
  }
});

// Job-specific CV adaptation
router.post('/adapt-cv-for-job', async (req, res) => {
  try {
    const validation = z.object({
      cvId: z.number(),
      jobId: z.number(),
      service: z.enum(['claude']).optional().default('claude'),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: validation.error.errors
      });
    }

    const { cvId, jobId, service } = validation.data;
    const user = req.user! as User;

    // Get CV and job data
    const cv = await storage.getCVById(cvId);
    const job = await storage.getJobById(jobId);

    if (!cv || cv.userId !== user.id) {
      return res.status(404).json({
        message: "CV non trouvé ou accès non autorisé"
      });
    }

    if (!job) {
      return res.status(404).json({
        message: "Offre d'emploi non trouvée"
      });
    }

    const prompt = `
    Adaptez ce CV pour cette offre d'emploi spécifique:

    OFFRE D'EMPLOI:
    Titre: ${job.title}
    Entreprise: ${job.companyName}
    Description: ${job.description}
    Compétences requises: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : job.requiredSkills || ''}
    Niveau d'expérience: ${job.experienceLevel}

    CV ACTUEL:
    ${JSON.stringify(cv, null, 2)}

    Veuillez:
    1. Réorganiser et prioriser les sections selon la pertinence pour ce poste
    2. Mettre en évidence les compétences et expériences les plus pertinentes
    3. Ajouter des mots-clés pertinents de l'offre d'emploi
    4. Suggérer des améliorations spécifiques pour ce poste
    5. Optimiser le résumé professionnel pour ce rôle

    Retournez le CV adapté dans le même format JSON avec des améliorations ciblées.
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      res.json({
        success: true,
        data: {
          adaptedCV: content.text,
          jobTitle: job.title,
          company: job.companyName,
          adaptationTips: [
            'CV adapté pour mettre en valeur les compétences pertinentes',
            'Mots-clés de l\'offre intégrés',
            'Expériences réorganisées par pertinence'
          ]
        }
      });
    } else {
      throw new Error('Format de réponse inattendu');
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'adaptation du CV:', error);
    res.status(500).json({
      message: "Erreur lors de l'adaptation du CV",
      error: error.message
    });
  }
});

// Analyze job market trends
router.post('/analyze-job-market', async (req, res) => {
  try {
    const validation = z.object({
      skills: z.array(z.string()).optional(),
      location: z.string().optional(),
      jobTitle: z.string().optional(),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: validation.error.errors
      });
    }

    const { skills, location, jobTitle } = validation.data;

    const prompt = `
    Analysez les tendances du marché de l'emploi pour:
    ${jobTitle ? `Poste: ${jobTitle}` : ''}
    ${skills ? `Compétences: ${skills.join(', ')}` : ''}
    ${location ? `Localisation: ${location}` : ''}

    Fournissez une analyse comprenant:
    1. Tendances actuelles du marché (2024)
    2. Compétences les plus demandées
    3. Salaires moyens et évolution
    4. Opportunités de croissance
    5. Conseils pour se démarquer
    6. Secteurs en croissance

    Retournez l'analyse en format JSON:
    {
      "marketTrends": ["tendance1", "tendance2", ...],
      "inDemandSkills": ["compétence1", "compétence2", ...],
      "salaryInsights": {
        "average": number,
        "range": {"min": number, "max": number},
        "growth": "percentage"
      },
      "opportunities": ["opportunité1", "opportunité2", ...],
      "recommendations": ["conseil1", "conseil2", ...],
      "growingSectors": ["secteur1", "secteur2", ...]
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        res.json({
          success: true,
          data: analysis
        });
      } else {
        res.json({
          success: true,
          data: {
            analysis: content.text
          }
        });
      }
    } else {
      throw new Error('Format de réponse inattendu');
    }
  } catch (error: any) {
    console.error('Erreur lors de l\'analyse du marché:', error);
    res.status(500).json({
      message: "Erreur lors de l'analyse du marché de l'emploi",
      error: error.message
    });
  }
});

// Generate interview preparation based on job
router.post('/interview-preparation', async (req, res) => {
  try {
    const validation = z.object({
      jobId: z.number(),
      cvId: z.number().optional(),
    }).safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        message: "Données invalides",
        errors: validation.error.errors
      });
    }

    const { jobId, cvId } = validation.data;
    const user = req.user! as User;

    const job = await storage.getJobById(jobId);
    if (!job) {
      return res.status(404).json({
        message: "Offre d'emploi non trouvée"
      });
    }

    let cv = null;
    if (cvId) {
      cv = await storage.getCVById(cvId);
      if (!cv || cv.userId !== user.id) {
        return res.status(404).json({
          message: "CV non trouvé ou accès non autorisé"
        });
      }
    }

    const prompt = `
    Préparez un guide d'entretien pour cette offre d'emploi:

    OFFRE D'EMPLOI:
    Titre: ${job.title}
    Entreprise: ${job.companyName}
    Description: ${job.description}
    Compétences requises: ${Array.isArray(job.requiredSkills) ? job.requiredSkills.join(', ') : job.requiredSkills || 'Non spécifiées'}

    ${cv ? `PROFIL DU CANDIDAT:
    ${JSON.stringify(cv, null, 2)}` : ''}

    Fournissez:
    1. Questions d'entretien probables
    2. Réponses suggérées basées sur le profil
    3. Questions à poser à l'employeur
    4. Points forts à mettre en avant
    5. Défis potentiels et comment les aborder
    6. Recherche sur l'entreprise

    Format JSON:
    {
      "likelyQuestions": [
        {"question": "string", "suggestedAnswer": "string", "tips": ["tip1", "tip2"]}
      ],
      "questionsToAsk": ["question1", "question2", ...],
      "strengthsToHighlight": ["force1", "force2", ...],
      "potentialChallenges": [
        {"challenge": "string", "approach": "string"}
      ],
      "companyResearch": {
        "keyPoints": ["point1", "point2", ...],
        "cultureInsights": ["insight1", "insight2", ...]
      }
    }
    `;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    });

    const content = response.content[0];
    if (content.type === 'text') {
      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const preparation = JSON.parse(jsonMatch[0]);
        res.json({
          success: true,
          data: preparation
        });
      } else {
        res.json({
          success: true,
          data: {
            guidance: content.text
          }
        });
      }
    } else {
      throw new Error('Format de réponse inattendu');
    }
  } catch (error: any) {
    console.error('Erreur lors de la préparation d\'entretien:', error);
    res.status(500).json({
      message: "Erreur lors de la préparation d'entretien",
      error: error.message
    });
  }
});

export default router;