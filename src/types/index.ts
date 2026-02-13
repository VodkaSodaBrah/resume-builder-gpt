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
  personalInfo: PersonalInfo;
  workExperience: WorkExperience[];
  education: Education[];
  volunteering: Volunteering[];
  skills: Skills;
  references: Reference[];
  templateStyle: TemplateStyle;
  language: string;
  // Conversation flow flags
  hasWorkExperience?: boolean;
  hasVolunteering?: boolean;
  hasReferences?: boolean;
  referencesUponRequest?: boolean;
  // Skills gate flags
  hasTechnicalSkills?: boolean;
  hasCertifications?: boolean;
  hasLanguages?: boolean;
  hasSoftSkills?: boolean;
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
  | 'language'
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
  skipCondition?: (data: Partial<ResumeData>, entryIndex?: number) => boolean;
  helpMeWriteEligible?: boolean;
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
  // Guided mode state
  sectionPhase: 'questioning' | 'summary';
  onboardingComplete: boolean;
  helpMeWriteActive: boolean;
  helpMeWriteQuestionId: string | null;
  sectionConfirmed: Record<string, boolean>;
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

// Help Me Write types
export type HelpMeWriteContext =
  | 'work_responsibilities'
  | 'volunteering_responsibilities'
  | 'skills_technical'
  | 'skills_soft';

export interface HelpMeWriteRequest {
  questionContext: HelpMeWriteContext;
  simpleAnswers: string[];
  jobContext?: { jobTitle?: string; companyName?: string };
  language: string;
}

export interface HelpMeWriteResponse {
  generatedContent: string;
}

// AI Conversation types
export interface ExtractedField {
  path: string;                     // e.g., "personalInfo.fullName" or "workExperience[0].jobTitle"
  value: unknown;                   // The extracted value
  confidence: number;               // 0-1 confidence score
  needsConfirmation: boolean;       // If user should confirm
  clear?: boolean;                  // If true, clear/remove this field's data (for contradictions)
}

export type SpecialContentType = 'email_guide' | 'help_link' | 'example';

export interface SpecialContent {
  type: SpecialContentType;
  content: string;
  expandable?: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];          // Full conversation history
  currentResumeData: Partial<ResumeData>;
  currentSection: QuestionCategory;
  userMessage: string;
  language: string;
  followUpCount: number;
}

export interface ChatResponse {
  assistantMessage: string;
  extractedFields: ExtractedField[];
  suggestedSection: QuestionCategory | null;
  isComplete: boolean;
  specialContent?: SpecialContent;
  followUpNeeded: boolean;
  confidence: number;
}

export interface AIConversationContext {
  mentionedEntities: string[];      // Names, companies, etc. mentioned
  answeredTopics: string[];         // What we've covered
  userTone: 'confident' | 'uncertain' | 'frustrated' | 'neutral';
  sessionStartTime: string;
}

export interface AIConversationState extends ConversationState {
  // AI mode controls
  isAIMode: boolean;

  // Context tracking
  conversationContext: AIConversationContext;
  followUpCounts: Record<QuestionCategory, number>;

  // Extraction tracking
  extractedButUnconfirmed: ExtractedField[];
  pendingFollowUp: string | null;

  // Edge case handling
  emailHelpShown: boolean;
  userEscapeRequested: boolean;

  // Performance tracking
  aiResponseTimes: number[];
  tokenUsage: { input: number; output: number; total: number };
}
