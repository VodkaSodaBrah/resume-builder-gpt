/**
 * AI Conversation Store
 * Enhanced store for conversational AI resume building with intelligent field extraction
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatMessage,
  ResumeData,
  QuestionCategory,
  ExtractedField,
  AIConversationContext,
  AIConversationState,
  ChatResponse,
} from '@/types';
import { formatPhoneNumber, formatCityState } from '@/lib/formatters';

// Generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

// Initial AI conversation context
const initialContext: AIConversationContext = {
  mentionedEntities: [],
  answeredTopics: [],
  userTone: 'neutral',
  sessionStartTime: new Date().toISOString(),
};

// Initial follow-up counts for each category
const initialFollowUpCounts: Record<QuestionCategory, number> = {
  language: 0,
  intro: 0,
  personal: 0,
  work: 0,
  education: 0,
  volunteering: 0,
  skills: 0,
  references: 0,
  review: 0,
  complete: 0,
};

// Initial state
const initialState: Omit<AIConversationState, keyof AIConversationStore['actions']> = {
  // Base conversation state
  currentQuestionIndex: 0,
  currentCategory: 'language',
  messages: [],
  resumeData: {},
  isTyping: false,
  isComplete: false,
  workExperienceCount: 0,
  educationCount: 0,
  volunteeringCount: 0,
  referenceCount: 0,

  // AI mode controls
  isAIMode: true, // Start in AI mode by default

  // Context tracking
  conversationContext: initialContext,
  followUpCounts: initialFollowUpCounts,

  // Extraction tracking
  extractedButUnconfirmed: [],
  pendingFollowUp: null,

  // Edge case handling
  emailHelpShown: false,
  userEscapeRequested: false,

  // Performance tracking
  aiResponseTimes: [],
  tokenUsage: { input: 0, output: 0, total: 0 },
};

interface AIConversationActions {
  // Message management
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  addAssistantMessage: (content: string, questionId?: string) => void;
  addUserMessage: (content: string) => void;
  setTyping: (isTyping: boolean) => void;

  // AI response handling
  handleAIResponse: (response: ChatResponse) => void;
  applyExtractedFields: (fields: ExtractedField[]) => void;
  confirmExtractedField: (path: string) => void;
  rejectExtractedField: (path: string) => void;

  // Section management
  setCurrentSection: (section: QuestionCategory) => void;
  moveToNextSection: () => void;
  incrementFollowUpCount: (section: QuestionCategory) => void;
  resetFollowUpCount: (section: QuestionCategory) => void;

  // Context management
  updateContext: (updates: Partial<AIConversationContext>) => void;
  addMentionedEntity: (entity: string) => void;
  addAnsweredTopic: (topic: string) => void;
  setUserTone: (tone: AIConversationContext['userTone']) => void;

  // Special content handling
  setEmailHelpShown: (shown: boolean) => void;
  setUserEscapeRequested: (requested: boolean) => void;

  // Performance tracking
  recordResponseTime: (ms: number) => void;
  updateTokenUsage: (usage: { input: number; output: number; total: number }) => void;

  // Resume data management
  updateResumeData: (path: string, value: unknown) => void;
  setResumeData: (data: Partial<ResumeData>) => void;

  // Mode management
  setAIMode: (enabled: boolean) => void;
  toggleAIMode: () => void;

  // Lifecycle
  resetConversation: () => void;
  completeConversation: () => void;

  // Getters
  getCurrentFollowUpCount: () => number;
  getAverageResponseTime: () => number;
  shouldContinueFollowUp: () => boolean;
}

interface AIConversationStore extends AIConversationState {
  actions: AIConversationActions;
}

// Section order for progression
const SECTION_ORDER: QuestionCategory[] = [
  'language',
  'intro',
  'personal',
  'work',
  'education',
  'volunteering',
  'skills',
  'references',
  'review',
  'complete',
];

// Helper to set nested object value by path
const setNestedValue = (
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> => {
  const keys = path.split('.');
  const result = JSON.parse(JSON.stringify(obj)); // Deep clone
  let current: Record<string, unknown> = result;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const match = key.match(/(\w+)\[(\d+)\]/);

    if (match) {
      const [, arrayName, indexStr] = match;
      const index = parseInt(indexStr, 10);
      if (!Array.isArray(current[arrayName])) {
        current[arrayName] = [];
      }
      const arr = current[arrayName] as Record<string, unknown>[];
      if (!arr[index]) {
        arr[index] = { id: generateId() };
      }
      current = arr[index];
    } else {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }
  }

  const lastKey = keys[keys.length - 1];
  const match = lastKey.match(/(\w+)\[(\d+)\]/);

  if (match) {
    const [, arrayName, indexStr] = match;
    const index = parseInt(indexStr, 10);
    if (!Array.isArray(current[arrayName])) {
      current[arrayName] = [];
    }
    (current[arrayName] as unknown[])[index] = value;
  } else {
    current[lastKey] = value;
  }

  return result;
};

export const useAIConversationStore = create<AIConversationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      actions: {
        // Message management
        addMessage: (message) => {
          const newMessage: ChatMessage = {
            ...message,
            id: generateId(),
            timestamp: new Date().toISOString(),
          };
          set((state) => ({
            messages: [...state.messages, newMessage],
          }));
        },

        addAssistantMessage: (content, questionId) => {
          get().actions.addMessage({
            role: 'assistant',
            content,
            questionId,
          });
        },

        addUserMessage: (content) => {
          get().actions.addMessage({
            role: 'user',
            content,
          });
        },

        setTyping: (isTyping) => set({ isTyping }),

        // AI response handling
        handleAIResponse: (response) => {
          const { actions } = get();

          // Add assistant message
          actions.addAssistantMessage(response.assistantMessage);

          // Apply extracted fields
          if (response.extractedFields.length > 0) {
            actions.applyExtractedFields(response.extractedFields);
          }

          // Update section if suggested
          if (response.suggestedSection) {
            actions.setCurrentSection(response.suggestedSection);
          }

          // Increment follow-up count if continuing in same section
          if (response.followUpNeeded) {
            actions.incrementFollowUpCount(get().currentCategory);
          }

          // Handle completion
          if (response.isComplete) {
            actions.completeConversation();
          }

          // Update token usage
          if (response.confidence !== undefined) {
            // Track confidence for analytics if needed
          }
        },

        applyExtractedFields: (fields) => {
          const state = get();

          // Separate fields with clear flag from regular fields
          const clearFields = fields.filter((f) => f.clear === true);
          const regularFields = fields.filter((f) => f.clear !== true);

          const highConfidenceFields = regularFields.filter((f) => f.confidence >= 0.7);
          const lowConfidenceFields = regularFields.filter((f) => f.confidence < 0.7);

          // Apply high-confidence fields directly
          let updatedData = { ...state.resumeData } as Record<string, unknown>;

          // Handle clear fields first (remove data for contradictions)
          for (const field of clearFields) {
            const section = field.path.split('[')[0].split('.')[0]; // Get base section name
            updatedData[section] = field.value; // Usually [] for arrays

            // Update corresponding "has" flag
            const flagMap: Record<string, string> = {
              volunteering: 'hasVolunteering',
              workExperience: 'hasWorkExperience',
              education: 'hasEducation',
              references: 'hasReferences',
            };
            if (flagMap[section]) {
              updatedData[flagMap[section]] = false;
            }

            // Update count
            const countMap: Record<string, keyof typeof state> = {
              volunteering: 'volunteeringCount',
              workExperience: 'workExperienceCount',
              education: 'educationCount',
              references: 'referenceCount',
            };
            if (countMap[section]) {
              set({ [countMap[section]]: 0 } as Partial<typeof state>);
            }
          }

          // Apply regular high-confidence fields
          for (const field of highConfidenceFields) {
            // Apply formatting for phone and city fields
            let formattedValue = field.value;
            if (field.path === 'personalInfo.phone' && typeof field.value === 'string') {
              formattedValue = formatPhoneNumber(field.value);
            } else if (field.path === 'personalInfo.city' && typeof field.value === 'string') {
              formattedValue = formatCityState(field.value);
            }

            updatedData = setNestedValue(updatedData, field.path, formattedValue);

            // Track as answered topic
            const topic = field.path.split('.')[0];
            if (!state.conversationContext.answeredTopics.includes(topic)) {
              get().actions.addAnsweredTopic(topic);
            }
          }

          // Store low-confidence fields for confirmation
          set({
            resumeData: updatedData as Partial<ResumeData>,
            extractedButUnconfirmed: [
              ...state.extractedButUnconfirmed.filter(
                (e) => !lowConfidenceFields.some((f) => f.path === e.path)
              ),
              ...lowConfidenceFields,
            ],
          });
        },

        confirmExtractedField: (path) => {
          const state = get();
          const field = state.extractedButUnconfirmed.find((f) => f.path === path);

          if (field) {
            const updatedData = setNestedValue(
              state.resumeData as Record<string, unknown>,
              path,
              field.value
            );

            set({
              resumeData: updatedData as Partial<ResumeData>,
              extractedButUnconfirmed: state.extractedButUnconfirmed.filter(
                (f) => f.path !== path
              ),
            });
          }
        },

        rejectExtractedField: (path) => {
          set((state) => ({
            extractedButUnconfirmed: state.extractedButUnconfirmed.filter(
              (f) => f.path !== path
            ),
          }));
        },

        // Section management
        setCurrentSection: (section) => {
          set({
            currentCategory: section,
            userEscapeRequested: false, // Reset escape flag on section change
          });

          // Reset follow-up count for new section
          get().actions.resetFollowUpCount(section);
        },

        moveToNextSection: () => {
          const { currentCategory, resumeData } = get();
          const currentIndex = SECTION_ORDER.indexOf(currentCategory);

          if (currentIndex < SECTION_ORDER.length - 1) {
            let nextIndex = currentIndex + 1;
            let nextSection = SECTION_ORDER[nextIndex];

            // Skip optional sections if user indicated they don't have content
            while (nextIndex < SECTION_ORDER.length - 1) {
              const data = resumeData as Record<string, unknown>;
              if (nextSection === 'work' && data.hasWorkExperience === false) {
                nextIndex++;
              } else if (nextSection === 'education' && data.hasEducation === false) {
                nextIndex++;
              } else if (nextSection === 'volunteering' && data.hasVolunteering === false) {
                nextIndex++;
              } else if (nextSection === 'references' && data.hasReferences === false) {
                nextIndex++;
              } else {
                break;
              }
              nextSection = SECTION_ORDER[nextIndex];
            }

            get().actions.setCurrentSection(nextSection);
          } else {
            get().actions.completeConversation();
          }
        },

        incrementFollowUpCount: (section) => {
          set((state) => ({
            followUpCounts: {
              ...state.followUpCounts,
              [section]: state.followUpCounts[section] + 1,
            },
          }));
        },

        resetFollowUpCount: (section) => {
          set((state) => ({
            followUpCounts: {
              ...state.followUpCounts,
              [section]: 0,
            },
          }));
        },

        // Context management
        updateContext: (updates) => {
          set((state) => ({
            conversationContext: {
              ...state.conversationContext,
              ...updates,
            },
          }));
        },

        addMentionedEntity: (entity) => {
          set((state) => ({
            conversationContext: {
              ...state.conversationContext,
              mentionedEntities: [
                ...state.conversationContext.mentionedEntities.filter((e) => e !== entity),
                entity,
              ],
            },
          }));
        },

        addAnsweredTopic: (topic) => {
          set((state) => ({
            conversationContext: {
              ...state.conversationContext,
              answeredTopics: [
                ...state.conversationContext.answeredTopics.filter((t) => t !== topic),
                topic,
              ],
            },
          }));
        },

        setUserTone: (tone) => {
          set((state) => ({
            conversationContext: {
              ...state.conversationContext,
              userTone: tone,
            },
          }));
        },

        // Special content handling
        setEmailHelpShown: (shown) => set({ emailHelpShown: shown }),
        setUserEscapeRequested: (requested) => set({ userEscapeRequested: requested }),

        // Performance tracking
        recordResponseTime: (ms) => {
          set((state) => ({
            aiResponseTimes: [...state.aiResponseTimes.slice(-19), ms], // Keep last 20
          }));
        },

        updateTokenUsage: (usage) => {
          set((state) => ({
            tokenUsage: {
              input: state.tokenUsage.input + usage.input,
              output: state.tokenUsage.output + usage.output,
              total: state.tokenUsage.total + usage.total,
            },
          }));
        },

        // Resume data management
        updateResumeData: (path, value) => {
          set((state) => ({
            resumeData: setNestedValue(
              state.resumeData as Record<string, unknown>,
              path,
              value
            ) as Partial<ResumeData>,
          }));
        },

        setResumeData: (data) => {
          set((state) => ({
            resumeData: { ...state.resumeData, ...data },
          }));
        },

        // Mode management
        setAIMode: (enabled) => set({ isAIMode: enabled }),
        toggleAIMode: () => set((state) => ({ isAIMode: !state.isAIMode })),

        // Lifecycle
        resetConversation: () => {
          set({
            ...initialState,
            conversationContext: {
              ...initialContext,
              sessionStartTime: new Date().toISOString(),
            },
          });
        },

        completeConversation: () => {
          set({
            isComplete: true,
            currentCategory: 'complete',
          });
        },

        // Getters
        getCurrentFollowUpCount: () => {
          const state = get();
          return state.followUpCounts[state.currentCategory];
        },

        getAverageResponseTime: () => {
          const { aiResponseTimes } = get();
          if (aiResponseTimes.length === 0) return 0;
          return aiResponseTimes.reduce((a, b) => a + b, 0) / aiResponseTimes.length;
        },

        shouldContinueFollowUp: () => {
          const state = get();
          const count = state.followUpCounts[state.currentCategory];

          // Allow more follow-ups for multi-entry sections
          if (state.currentCategory === 'work' || state.currentCategory === 'education') {
            return count < 5;
          }

          // Standard limit for other sections
          return count < 3;
        },
      },
    }),
    {
      name: 'resume-builder-ai-conversation',
      partialize: (state) => ({
        currentCategory: state.currentCategory,
        messages: state.messages,
        resumeData: state.resumeData,
        workExperienceCount: state.workExperienceCount,
        educationCount: state.educationCount,
        volunteeringCount: state.volunteeringCount,
        referenceCount: state.referenceCount,
        isAIMode: state.isAIMode,
        conversationContext: state.conversationContext,
        followUpCounts: state.followUpCounts,
        tokenUsage: state.tokenUsage,
        emailHelpShown: state.emailHelpShown,
      }),
    }
  )
);

// Helper hooks for common operations
export const useAIConversation = () => {
  const store = useAIConversationStore();
  return {
    // State
    messages: store.messages,
    currentSection: store.currentCategory,
    resumeData: store.resumeData,
    isTyping: store.isTyping,
    isComplete: store.isComplete,
    isAIMode: store.isAIMode,
    context: store.conversationContext,
    unconfirmedFields: store.extractedButUnconfirmed,
    emailHelpShown: store.emailHelpShown,

    // Actions
    ...store.actions,
  };
};
