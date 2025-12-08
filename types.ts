
export enum UserRole {
  ADMIN = 'ADMIN',
  PROFESSOR = 'PROFESSOR',
  STUDENT = 'STUDENT',
  MODERATOR = 'MODERATOR',
  COORDINATOR = 'COORDINATOR', // New Role
}

export type Language = 'fr' | 'ar';

export interface User {
  id: string;
  username: string; // generated ID
  password?: string;
  name: string;
  role: UserRole;
  class?: string; // Primary class (legacy/display)
  enrolledClasses?: string[]; // List of all classes the student belongs to
  email?: string; 
  phone?: string; 
  school?: string; 
  city?: string; // To differentiate schools with same name
  subject?: string; // Subject taught by professor
  schoolType?: string; // Type of school
  accountType?: 'INDIVIDUAL' | 'ESTABLISHMENT';
  assignedSections?: string[]; // New: For Professors, list of classes assigned by Coordinator
  
  // Gamification
  xp?: number;
  level?: number;
  badges?: string[]; // List of Badge IDs
  
  // Activity Tracking
  lastLogin?: string; // ISO Date string
}

export interface SchoolStructure {
    id: string;
    school: string;
    city: string;
    classes: string[]; // List of official class names
}

export enum QuestionType {
  MCQ = 'MCQ', 
  IMAGE_MCQ = 'IMAGE_MCQ', 
  BOOLEAN = 'BOOLEAN', 
  ESSAY = 'ESSAY', 
  MATCHING = 'MATCHING', 
  SHORT_ANSWER = 'SHORT_ANSWER', 
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  imageUrl?: string; 
  points: number;
  options?: string[]; 
  correctAnswer?: string | string[] | boolean | MatchingPair[]; 
  matchingPairs?: MatchingPair[]; 
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  professorId: string;
  questions: Question[];
  createdAt: string;
  assignedClasses: string[]; 
  status: 'DRAFT' | 'PUBLISHED';
  accessCode?: string; 
  timeLimit?: number; 
  startDate?: string; 
  dueDate?: string; 
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  answers: Record<string, any>; 
  score: number;
  maxScore: number;
  submittedAt: string;
  startedAt?: string; 
  timeSpent?: number; 
  feedback?: string; 
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string; // Can be a UserID or a GroupID (e.g., school_chat_id)
  content: string;
  timestamp: string;
  read: boolean;
}

export enum LessonType {
    VIDEO = 'VIDEO',
    DOCUMENT = 'DOCUMENT'
}

export interface Lesson {
    id: string;
    professorId: string;
    title: string;
    description: string;
    assignedClasses: string[];
    type: LessonType;
    contentUrl: string; 
    createdAt: string;
    status: 'DRAFT' | 'PUBLISHED'; 
}

export interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

export interface PartnerRequest {
    id: string;
    orgName: string;
    contactName: string;
    email: string;
    phone: string;
    date: string;
    status: 'PENDING' | 'CONTACTED';
}
