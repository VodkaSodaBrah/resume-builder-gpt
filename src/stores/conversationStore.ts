import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ConversationState, ResumeData, QuestionCategory } from '@/types';
import { questions, getSectionKeyForQuestion } from '@/lib/questions';
import { formatFieldValue } from '@/lib/formatters';
import { setNestedValue } from '@/lib/objectUtils';

interface ConversationStore extends ConversationState {
  // Actions
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setTyping: (isTyping: boolean) => void;
  nextQuestion: () => void;
  previousQuestion: () => void;
  goToQuestion: (index: number) => void;
  updateResumeData: (path: string, value: unknown) => void;
  setResumeData: (data: Partial<ResumeData>) => void;
  resetConversation: () => void;
  completeConversation: () => void;

  // Work experience management
  addWorkExperience: () => void;
  addEducation: () => void;
  addVolunteering: () => void;
  addReference: () => void;

  // Guided mode actions
  setSectionPhase: (phase: 'questioning' | 'summary') => void;
  setOnboardingComplete: (val: boolean) => void;
  startHelpMeWrite: (questionId: string) => void;
  endHelpMeWrite: () => void;
  confirmSection: (category: string) => void;
  unconfirmSection: (category: string) => void;

  // Getters
  getCurrentQuestion: () => typeof questions[0] | null;
  getProgress: () => { current: number; total: number; percentage: number };
  shouldSkipCurrentQuestion: () => boolean;
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const initialState: ConversationState = {
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
  // Guided mode state
  sectionPhase: 'questioning',
  onboardingComplete: false,
  helpMeWriteActive: false,
  helpMeWriteQuestionId: null,
  sectionConfirmed: {},
};

export const useConversationStore = create<ConversationStore>()(
  persist(
    (set, get) => ({
      ...initialState,

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

      setTyping: (isTyping) => set({ isTyping }),

      getCurrentQuestion: () => {
        const { currentQuestionIndex } = get();
        return questions[currentQuestionIndex] || null;
      },

      shouldSkipCurrentQuestion: () => {
        const question = get().getCurrentQuestion();
        if (!question || !question.skipCondition) return false;

        // Calculate the correct entry index based on section counters
        const sectionKey = getSectionKeyForQuestion(question.id);
        let entryIndex = 0;

        if (sectionKey) {
          const counts: Record<string, number> = {
            'work': get().workExperienceCount,
            'education': get().educationCount,
            'volunteering': get().volunteeringCount,
            'references': get().referenceCount,
          };
          entryIndex = counts[sectionKey] || 0;
        }

        return question.skipCondition(get().resumeData as Partial<ResumeData>, entryIndex);
      },

      nextQuestion: () => {
        const { currentQuestionIndex, shouldSkipCurrentQuestion } = get();
        let nextIndex = currentQuestionIndex + 1;

        // Skip questions based on conditions
        while (nextIndex < questions.length) {
          const question = questions[nextIndex];
          if (question.skipCondition) {
            // Calculate the correct entry index for this question
            const sectionKey = getSectionKeyForQuestion(question.id);
            let entryIndex = 0;

            if (sectionKey) {
              const counts: Record<string, number> = {
                'work': get().workExperienceCount,
                'education': get().educationCount,
                'volunteering': get().volunteeringCount,
                'references': get().referenceCount,
              };
              entryIndex = counts[sectionKey] || 0;
            }

            if (question.skipCondition(get().resumeData as Partial<ResumeData>, entryIndex)) {
              nextIndex++;
            } else {
              break;
            }
          } else {
            break;
          }
        }

        if (nextIndex >= questions.length) {
          set({ isComplete: true });
        } else {
          const nextQuestion = questions[nextIndex];
          set({
            currentQuestionIndex: nextIndex,
            currentCategory: nextQuestion.category,
          });
        }
      },

      previousQuestion: () => {
        const { currentQuestionIndex } = get();
        if (currentQuestionIndex > 0) {
          let prevIndex = currentQuestionIndex - 1;

          // Skip questions that should be skipped going backwards too
          while (prevIndex > 0) {
            const question = questions[prevIndex];
            if (question.skipCondition) {
              // Calculate the correct entry index for this question
              const sectionKey = getSectionKeyForQuestion(question.id);
              let entryIndex = 0;

              if (sectionKey) {
                const counts: Record<string, number> = {
                  'work': get().workExperienceCount,
                  'education': get().educationCount,
                  'volunteering': get().volunteeringCount,
                  'references': get().referenceCount,
                };
                entryIndex = counts[sectionKey] || 0;
              }

              if (question.skipCondition(get().resumeData as Partial<ResumeData>, entryIndex)) {
                prevIndex--;
              } else {
                break;
              }
            } else {
              break;
            }
          }

          const prevQuestion = questions[prevIndex];
          set({
            currentQuestionIndex: prevIndex,
            currentCategory: prevQuestion.category,
          });
        }
      },

      goToQuestion: (index) => {
        if (index >= 0 && index < questions.length) {
          const question = questions[index];
          set({
            currentQuestionIndex: index,
            currentCategory: question.category,
          });
        }
      },

      updateResumeData: (path, value) => {
        // Apply comprehensive formatting based on field path
        const formattedValue = formatFieldValue(path, value);

        set((state) => ({
          resumeData: setNestedValue(
            state.resumeData as Record<string, unknown>,
            path,
            formattedValue
          ) as Partial<ResumeData>,
        }));
      },

      setResumeData: (data) => {
        set((state) => ({
          resumeData: { ...state.resumeData, ...data },
        }));
      },

      resetConversation: () => {
        set(initialState);
      },

      completeConversation: () => {
        set({ isComplete: true });
      },

      getProgress: () => {
        const { currentQuestionIndex } = get();
        const total = questions.length;
        const current = currentQuestionIndex + 1;
        const percentage = Math.round((current / total) * 100);
        return { current, total, percentage };
      },

      addWorkExperience: () => {
        set((state) => ({
          workExperienceCount: state.workExperienceCount + 1,
        }));
      },

      addEducation: () => {
        set((state) => ({
          educationCount: state.educationCount + 1,
        }));
      },

      addVolunteering: () => {
        set((state) => ({
          volunteeringCount: state.volunteeringCount + 1,
        }));
      },

      addReference: () => {
        set((state) => ({
          referenceCount: state.referenceCount + 1,
        }));
      },

      // Guided mode actions
      setSectionPhase: (phase) => set({ sectionPhase: phase }),

      setOnboardingComplete: (val) => set({ onboardingComplete: val }),

      startHelpMeWrite: (questionId) => set({
        helpMeWriteActive: true,
        helpMeWriteQuestionId: questionId,
      }),

      endHelpMeWrite: () => set({
        helpMeWriteActive: false,
        helpMeWriteQuestionId: null,
      }),

      confirmSection: (category) => set((state) => ({
        sectionConfirmed: { ...state.sectionConfirmed, [category]: true },
      })),

      unconfirmSection: (category) => set((state) => ({
        sectionConfirmed: { ...state.sectionConfirmed, [category]: false },
      })),
    }),
    {
      name: 'resume-builder-conversation',
      version: 1,
      migrate: () => ({}),
      partialize: (state) => ({
        currentQuestionIndex: state.currentQuestionIndex,
        currentCategory: state.currentCategory,
        messages: state.messages,
        resumeData: state.resumeData,
        workExperienceCount: state.workExperienceCount,
        educationCount: state.educationCount,
        volunteeringCount: state.volunteeringCount,
        referenceCount: state.referenceCount,
        sectionPhase: state.sectionPhase,
        onboardingComplete: state.onboardingComplete,
        sectionConfirmed: state.sectionConfirmed,
      }),
    }
  )
);
