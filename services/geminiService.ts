
import { Question, QuestionType, Language } from "../types";

// Le service n'utilise plus le SDK directement pour ne pas exposer la clé API
export const GeminiService = {
  
  async generateQuizQuestions(topic: string, count: number = 5, language: Language = 'fr'): Promise<Question[]> {
    try {
        const response = await fetch('/api/ai/generate-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic, count, language })
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Erreur serveur");
        }

        const data = await response.json();
        const rawData = data.questions || [];

        // Mapping local pour garantir le format ID et types
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
        throw new Error("Impossible de générer le quiz. Vérifiez la connexion serveur.");
    }
  },

  async gradeEssay(questionText: string, studentAnswer: string, correctAnswerContext?: string): Promise<{ score: number; feedback: string }> {
      try {
          const response = await fetch('/api/ai/grade-essay', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  question: questionText, 
                  answer: studentAnswer, 
                  context: correctAnswerContext 
              })
          });

          if (!response.ok) throw new Error("Erreur grading");
          
          return await response.json();
      } catch (e) {
          console.error(e);
          return { score: 0, feedback: "Erreur lors de la correction automatique (Serveur)." };
      }
  }
};
