
import { GoogleGenAI, Type } from "@google/genai";
import { Question, QuestionType, Language } from "../types";

const initAI = () => {
    let apiKey = '';
    try {
        // @ts-ignore
        if (typeof process !== 'undefined' && process.env) {
            // @ts-ignore
            apiKey = process.env.API_KEY || process.env.REACT_APP_GEMINI_API_KEY || '';
        }
    } catch (e) {
        console.warn("Environment variables not available in this context. AI features may not work if API Key is not injected.");
    }
    
    // Fallback for AI Studio simulation if key is injected globally
    // @ts-ignore
    if (!apiKey && typeof window !== 'undefined' && window.GEMINI_API_KEY) {
        // @ts-ignore
        apiKey = window.GEMINI_API_KEY;
    }
    
    return new GoogleGenAI({ apiKey });
};

export const GeminiService = {
  async generateQuizQuestions(topic: string, count: number = 5, language: Language = 'fr'): Promise<Question[]> {
    const ai = initAI();
    
    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                text: { type: Type.STRING },
                type: { 
                    type: Type.STRING, 
                    enum: [
                        QuestionType.MCQ, 
                        QuestionType.BOOLEAN, 
                        QuestionType.SHORT_ANSWER,
                        QuestionType.MATCHING,
                        QuestionType.ESSAY
                    ] 
                },
                points: { type: Type.NUMBER },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                matchingPairs: { 
                    type: Type.ARRAY, 
                    items: { 
                        type: Type.OBJECT, 
                        properties: {
                            left: { type: Type.STRING },
                            right: { type: Type.STRING }
                        }
                    } 
                },
                explanation: { type: Type.STRING }
            },
            required: ["text", "type", "points"]
        }
    };

    const langName = language === 'ar' ? 'Arabe' : 'Français';
    const booleanInstructions = language === 'ar' ? 'Pour BOOLEAN, la réponse doit être "Vrai" ou "Faux" (je traduirai coté client).' : 'Pour BOOLEAN, la réponse doit être "Vrai" ou "Faux".';

    const prompt = `
      Génère un quiz de ${count} questions sur le sujet : "${topic}".
      Le quiz doit être OBLIGATOIREMENT en ${langName}.
      
      Mélange les types de questions suivants : 
      1. Choix Multiples (MCQ) : Fournis 4 options dans 'options'.
      2. Vrai/Faux (BOOLEAN) : ${booleanInstructions}
      3. Réponse Courte (SHORT_ANSWER) : Fournis la réponse attendue dans 'correctAnswer'.
      4. Appariement (MATCHING) : Fournis 4 paires d'éléments liés dans 'matchingPairs'.
      5. Question Ouverte (ESSAY) : Une question de réflexion qui demande une rédaction. Laisser 'correctAnswer' vide ou fournir des mots-clés.
      
      IMPORTANT POUR LE TYPE 'MATCHING':
      - Ne remplis PAS 'options'.
      - Ne remplis PAS 'correctAnswer'.
      - Remplis UNIQUEMENT le tableau 'matchingPairs' avec 4 objets {left: string, right: string}.
      
      Répartis les types de manière équilibrée.
      Assure-toi que le JSON est valide et respecte le schéma.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
      });

      const rawData = JSON.parse(response.text || '[]');
      
      return rawData.map((q: any, idx: number) => ({
        id: `gen-${Date.now()}-${idx}`,
        type: q.type,
        text: q.text,
        points: q.points || 1,
        options: q.options || [],
        correctAnswer: q.type === 'BOOLEAN' ? (String(q.correctAnswer).toLowerCase() === 'vrai' || String(q.correctAnswer).toLowerCase() === 'true') : q.correctAnswer,
        matchingPairs: q.matchingPairs || []
      }));
    } catch (error) {
      console.error("Gemini generation error", error);
      throw new Error("Impossible de générer le quiz. Vérifiez votre clé API.");
    }
  },

  async gradeEssay(questionText: string, studentAnswer: string, correctAnswerContext?: string): Promise<{ score: number; feedback: string }> {
      const ai = initAI();

      const prompt = `
        Agis comme un professeur expert. Évalue la réponse d'un étudiant à la question suivante.
        Question: "${questionText}"
        Réponse de l'étudiant: "${studentAnswer}"
        Contexte/Réponse attendue (optionnel): "${correctAnswerContext || 'N/A'}"
        
        Note sur 10 (où 10 est parfait).
        Retourne un objet JSON avec:
        - score: nombre entier de 0 à 10.
        - feedback: un commentaire constructif (max 30 mots) dans la même langue que la question.
      `;

      try {
          const response = await ai.models.generateContent({
              model: 'gemini-2.5-flash',
              contents: prompt,
              config: {
                  responseMimeType: "application/json",
                  responseSchema: {
                      type: Type.OBJECT,
                      properties: {
                          score: { type: Type.NUMBER },
                          feedback: { type: Type.STRING }
                      }
                  }
              }
          });

          return JSON.parse(response.text || '{"score": 0, "feedback": "Erreur d\'analyse"}');
      } catch (e) {
          console.error(e);
          return { score: 0, feedback: "Erreur lors de la correction automatique." };
      }
  }
};
