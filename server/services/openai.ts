import OpenAI from "openai";

// Le modèle OpenAI le plus récent est "gpt-4o" qui a été publié le 13 mai 2024.
// Ne pas changer sauf si explicitement demandé par l'utilisateur
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "MY API KEY",
});

// Types pour les suggestions de contenu
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

// Améliorer le texte d'une section spécifique
export async function improveText(
  text: string,
  sectionType: string,
  customPrompt?: string
): Promise<string> {
  const defaultPrompt = getPromptForSection(sectionType);
  const prompt = customPrompt || defaultPrompt;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Vous êtes un expert en rédaction de CV professionnels. Votre tâche est d'améliorer le texte fourni pour un CV."
        },
        {
          role: "user",
          content: `${prompt}\n\nTexte original:\n${text}`
        }
      ],
      temperature: 0.7,
    });

    return response.choices[0].message.content || text;
  } catch (error) {
    console.error("Erreur lors de l'amélioration du texte avec OpenAI:", error);
    throw new Error("Impossible d'améliorer le texte. Veuillez réessayer plus tard.");
  }
}

// Adapter le CV à une offre d'emploi
export async function adaptCVToJobOffer(
  cv: any,
  jobDescription: string
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Vous êtes un expert en recrutement et en adaptation de CV. Votre tâche est d'analyser une offre d'emploi et de proposer des modifications au CV pour maximiser ses chances d'être retenu."
        },
        {
          role: "user",
          content: `Voici une description de poste:\n\n${jobDescription}\n\nVoici le CV actuel:\n${JSON.stringify(cv, null, 2)}\n\nAnalysez cette offre d'emploi et modifiez directement le CV pour l'adapter à cette offre. Changez uniquement ce qui est nécessaire pour mettre en valeur les compétences et expériences pertinentes. Retournez le CV complet modifié au format JSON avec exactement la même structure, mais avec les sections adaptées.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    // Analyser et retourner directement le CV adapté
    const content = response.choices[0].message.content;
    const adaptedCV = content ? JSON.parse(content) : {};
    return adaptedCV;
  } catch (error) {
    console.error("Erreur lors de l'adaptation du CV avec OpenAI:", error);
    throw new Error("Impossible d'adapter le CV. Veuillez réessayer plus tard.");
  }
}

// Traduire le CV
export async function translateCV(
  cv: any,
  targetLanguage: string
): Promise<any> {
  try {
    // Création d'une version du CV avec tous les textes traduits
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Vous êtes un traducteur professionnel spécialisé dans les CV. Votre tâche est de traduire tout le contenu textuel d'un CV en ${targetLanguage} tout en conservant la structure JSON.`
        },
        {
          role: "user",
          content: `Traduisez tous les textes de ce CV en ${targetLanguage}. Conservez la structure exacte du JSON, modifiez uniquement les valeurs textuelles.\n\n${JSON.stringify(cv, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const content = response.choices[0].message.content;
    const translatedCV = content ? JSON.parse(content) : {};
    return translatedCV;
  } catch (error) {
    console.error("Erreur lors de la traduction du CV avec OpenAI:", error);
    throw new Error(`Impossible de traduire le CV en ${targetLanguage}. Veuillez réessayer plus tard.`);
  }
}

// Fonction utilitaire pour obtenir le prompt adapté à chaque type de section
// Analyser le CV complet et fournir des scores de pertinence et des conseils
export async function analyzeCVSections(cv: any, jobPosition?: string): Promise<any> {
  try {
    let jobContext = "";
    if (jobPosition) {
      jobContext = `Le poste visé est : ${jobPosition}. Analysez le CV en fonction de ce poste spécifique.`;
    } else {
      jobContext = "Analysez le CV en fonction des meilleures pratiques générales pour les CV professionnels.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Vous êtes un expert en recrutement et en rédaction de CV. Votre tâche est d'analyser objectivement chaque section d'un CV et de fournir un score de pertinence ainsi que des conseils d'optimisation précis."
        },
        {
          role: "user",
          content: `${jobContext}\n\nVoici le CV à analyser :\n${JSON.stringify(cv, null, 2)}\n\nPour chaque section du CV, fournissez :\n1. Un score de pertinence sur 10\n2. Au moins 2 conseils d'optimisation spécifiques et actionnables\n3. Une explication brève de ce qui pourrait être amélioré\n\nPrésentez les résultats au format JSON avec la structure suivante :\n{\n  "sections": [\n    {\n      "section": "Le nom de la section",\n      "score": 7,\n      "tips": ["Conseil 1", "Conseil 2"],\n      "explanation": "Explication brève"\n    },\n    ...\n  ],\n  "overallScore": 7.5,\n  "topRecommendations": ["Recommandation principale 1", "Recommandation principale 2", "Recommandation principale 3"]\n}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : {};
  } catch (error) {
    console.error("Erreur lors de l'analyse du CV avec OpenAI:", error);
    throw new Error("Impossible d'analyser le CV. Veuillez réessayer plus tard.");
  }
}

// Fonction pour suggérer des icônes emoji pour une section de CV
export async function suggestSectionEmoji(
  sectionType: string,
  sectionTitle: string,
  sectionContent?: string
): Promise<string[]> {
  try {
    let contentDescription = "";
    if (sectionContent) {
      // Limiter la taille du contenu pour économiser des tokens
      contentDescription = `Contenu de la section: ${sectionContent.slice(0, 300)}...`;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Vous êtes un assistant spécialisé dans la conception de CV. Votre tâche est de suggérer des emojis pertinents qui pourraient être utilisés comme icône pour une section spécifique d'un CV."
        },
        {
          role: "user",
          content: `Suggérez 5 emojis pertinents et professionnels qui pourraient représenter une section de CV de type "${sectionType}" intitulée "${sectionTitle}". ${contentDescription}\n\nLes emojis doivent être visuellement distincts, professionnels et en rapport avec le contenu de la section. Retournez uniquement les emojis séparés par des virgules, sans texte supplémentaire.`
        }
      ],
      temperature: 0.7,
    });

    // Nettoyer et parser la réponse pour extraire uniquement les emojis
    const emojiText = response.choices[0].message.content || "";
    const emojis = emojiText
      .split(',')
      .map(emoji => emoji.trim())
      .filter(emoji => emoji.length > 0);

    return emojis.length > 0 ? emojis : ["📄", "📋", "📝", "📊", "📈"]; // Emojis par défaut
  } catch (error) {
    console.error("Erreur lors de la suggestion d'emojis avec OpenAI:", error);
    // En cas d'erreur, retourner des emojis génériques liés aux CV
    return ["📄", "📋", "📝", "📊", "📈"];
  }
}

// Générer des suggestions de contenu intelligent
export async function generateContentSuggestions(
  cv: any,
  sectionType: ContentSuggestionType,
  jobPosition?: string
): Promise<ContentSuggestion[]> {
  try {
    let jobContext = jobPosition 
      ? `Le poste visé est : ${jobPosition}. Générez des suggestions adaptées à ce poste.` 
      : "";

    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Vous êtes un expert en rédaction de CV professionnels. Votre tâche est de générer des suggestions pertinentes et bien formulées pour améliorer un CV."
        },
        {
          role: "user",
          content: `${jobContext}\n\nVoici le CV actuel :\n${JSON.stringify(cv, null, 2)}\n\nGénérez 3 suggestions de qualité pour la section "${sectionType}" de ce CV. Chaque suggestion doit être autonome, professionnelle et prête à être intégrée directement dans le CV. Pour chaque suggestion, fournissez un niveau de confiance entre 0 et 1 indiquant à quel point vous pensez que cette suggestion améliore le CV existant.\n\nRetournez les résultats au format JSON avec la structure suivante :\n[\n  {\n    "id": "uniqueId1",\n    "text": "Le texte de la suggestion",\n    "type": "${sectionType}",\n    "confidence": 0.85\n  },\n  ...\n]`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    const suggestions = content ? JSON.parse(content) : [];
    return suggestions;
  } catch (error) {
    console.error("Erreur lors de la génération de suggestions avec OpenAI:", error);
    throw new Error("Impossible de générer des suggestions de contenu. Veuillez réessayer plus tard.");
  }
}

function getPromptForSection(sectionType: string): string {
  const prompts: Record<string, string> = {
    summary: "Améliorez ce résumé professionnel pour qu'il soit plus percutant, clair et professionnel. Mettez en valeur les forces et les expériences les plus pertinentes. Restez concis (maximum 4-5 phrases) et direct.",
    
    experience: "Améliorez cette description d'expérience professionnelle pour la rendre plus impactante. Utilisez des verbes d'action, quantifiez les réalisations lorsque possible, et mettez en évidence les compétences et réalisations. Conservez le même niveau de détail mais rendez-le plus efficace.",
    
    education: "Améliorez cette description de formation pour mettre en valeur les aspects les plus pertinents pour un recruteur. Rendez-la plus précise et professionnelle.",
    
    skills: "Reformulez cette liste de compétences pour qu'elle soit plus précise, avec des termes plus professionnels et adaptés au marché de l'emploi actuel.",
    
    languages: "Reformulez cette description de compétences linguistiques de manière plus professionnelle et précise.",
    
    // Par défaut
    default: "Améliorez ce texte pour un CV professionnel. Rendez-le plus concis, précis et impactant tout en conservant les informations essentielles."
  };
  
  return prompts[sectionType] || prompts.default;
}

// Review a section: detect issues and suggest fixes
export async function reviewSection(
  text: string,
  sectionType: string
): Promise<{ issues: string[]; suggestion: string; improvedText: string }> {
  const prompt = `You are an expert CV reviewer. Analyze the following text for spelling, grammar, clarity, and style issues. List all detected issues. Then suggest a single improved version of the text. Respond in JSON with the following fields: issues (array of strings), suggestion (string, a summary of the main fix), improvedText (string, the improved version).\n\nSection type: ${sectionType}\n\nText:\n${text}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert CV reviewer."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });
    const content = response.choices[0].message.content;
    if (!content) throw new Error("No response from OpenAI");
    return JSON.parse(content);
  } catch (error) {
    console.error("Error in OpenAI reviewSection:", error);
    throw new Error("Unable to review section. Please try again later.");
  }
}