// User types
export interface User {
  id: string;
  email: string;
  fullName?: string;
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  lastLoginAt?: string;
  language?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Resume types
export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  address?: string;
  zipCode?: string;
  city?: string;
  country?: string;
}

export interface WorkExperience {
  id: string;
  companyName: string;
  jobTitle: string;
  startDate: string;
  endDate?: string;
  isCurrentJob: boolean;
  location: string;
  responsibilities: string;
  enhancedResponsibilities?: string; // AI-improved version
}

export interface Education {
  id: string;
  schoolName: string;
  degree: string;
  fieldOfStudy?: string;
  startYear: string;
  endYear?: string;
  isCurrentlyStudying: boolean;
}

export interface Volunteering {
  id: string;
  organizationName: string;
  role: string;
  startDate: string;
  endDate?: string;
  responsibilities: string;
}

export interface Skills {
  certifications: string[];
  technicalSkills: string[];
  softSkills: string[];
  languages: Array<{
    language: string;
    proficiency: 'basic' | 'conversational' | 'professional' | 'native';
  }>;
}

export interface Reference {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface ResumeData {
  id: string;
  userId: string;
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  volunteering: Volunteering[];
  skills: Skills;
  references: Reference[];
  createdAt: string;
  updatedAt: string;
  templateStyle: TemplateStyle;
  language: string;
  // Conversation flow flags
  hasWorkExperience?: boolean;
  hasVolunteering?: boolean;
  hasReferences?: boolean;
  referencesUponRequest?: boolean;
}

export type TemplateStyle = 'classic' | 'modern' | 'professional';

// Chat/Conversation types
export type MessageRole = 'assistant' | 'user' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  questionId?: string;
}

export type QuestionCategory =
  | 'intro'
  | 'personal'
  | 'work'
  | 'education'
  | 'volunteering'
  | 'skills'
  | 'references'
  | 'review'
  | 'complete';

export interface Question {
  id: string;
  category: QuestionCategory;
  question: string;
  field: string;
  isRequired: boolean;
  inputType: 'text' | 'email' | 'phone' | 'textarea' | 'date' | 'select' | 'multiselect' | 'confirm';
  placeholder?: string;
  options?: string[];
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
  };
  followUp?: string[];
  skipCondition?: (data: Partial<ResumeData>) => boolean;
}

export interface ConversationState {
  currentQuestionIndex: number;
  currentCategory: QuestionCategory;
  messages: ChatMessage[];
  resumeData: Partial<ResumeData>;
  isTyping: boolean;
  isComplete: boolean;
  workExperienceCount: number;
  educationCount: number;
  volunteeringCount: number;
  referenceCount: number;
}

// Analytics types
export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, unknown>;
  timestamp: string;
  sessionId: string;
  userAgent?: string;
  language?: string;
}

export interface UserAnalytics {
  userId: string;
  totalSessions: number;
  totalResumesCreated: number;
  totalResumesDownloaded: number;
  averageCompletionTime: number;
  lastActiveAt: string;
  preferredTemplate: TemplateStyle;
  preferredLanguage: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}
