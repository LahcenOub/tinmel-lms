
import { User, UserRole } from './types';

// Helper to safely get env vars without crashing browser simulator
const getEnv = (key: string, fallback: string) => {
  try {
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env) {
      // @ts-ignore
      return process.env[key] || fallback;
    }
  } catch (e) {
    // Ignore error in browser environment
  }
  return fallback;
};

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  MCQ: 'Choix Multiples (Texte)',
  IMAGE_MCQ: 'Choix Multiples (Image)',
  BOOLEAN: 'Vrai ou Faux',
  ESSAY: 'Question Ouverte / Essai',
  MATCHING: 'Appariement',
  SHORT_ANSWER: 'Réponse Courte',
  FILL_IN_THE_BLANK: 'Texte à trous',
};