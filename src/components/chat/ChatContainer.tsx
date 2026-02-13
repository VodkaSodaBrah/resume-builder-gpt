import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChatBubble, TypingIndicator } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { InlinePreviewCard } from './InlinePreviewCard';
import { ExportOptionsCard } from './ExportOptionsCard';
import { GmailGuideCard } from './GmailGuideCard';
import { LivePreviewPanel } from './LivePreviewPanel';
import { SectionSummaryCard } from './SectionSummaryCard';
import { HelpMeWriteFlow } from './HelpMeWriteFlow';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SectionProgressBar, getSectionIntroMessage, getSectionCompletionMessage } from '@/components/ui/SectionProgressBar';
import { useConversationStore } from '@/stores/conversationStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';
import { questions as allQuestions, getCategoryLabel, ADD_MORE_SECTION_MAP, getQuestionIndexById, transformFieldPath, getQuestionTextForEntry, getSectionKeyForQuestion } from '@/lib/questions';
import { useTranslation } from '@/hooks/useTranslation';
import { parseAnswer, applyExtractedFields, shouldSkipQuestion } from '@/lib/answerParser';
import { ONBOARDING_MESSAGES, shouldShowOnboarding } from '@/lib/onboarding';

// Special markers for inline cards
const PREVIEW_CARD_MARKER = '__PREVIEW_CARD__';
const EXPORT_OPTIONS_MARKER = '__EXPORT_OPTIONS__';
const GMAIL_GUIDE_MARKER = '__GMAIL_GUIDE__';
const SECTION_SUMMARY_MARKER = '__SECTION_SUMMARY__';

// Categories that get summary cards
const SUMMARIZABLE_CATEGORIES = new Set(['personal', 'work', 'education', 'volunteering', 'skills', 'references']);

interface ChatContainerProps {
  isWidget?: boolean;
  onComplete?: (resumeData: unknown) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ isWidget = false, onComplete }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const navigate = useNavigate();
  // Track fields that were extracted from combined answers (to skip their questions)
  const [extractedFieldsToSkip, setExtractedFieldsToSkip] = useState<string[]>([]);
  // Live preview panel state
  const [showPreview, setShowPreview] = useState(false);
  // Track if we're in onboarding confirm phase (waiting for Yes/No after onboarding messages)
  const [awaitingOnboardingConfirm, setAwaitingOnboardingConfirm] = useState(false);

  const {
    messages,
    isTyping,
    currentQuestionIndex,
    currentCategory,
    resumeData,
    addMessage,
    setTyping,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    updateResumeData,
    getCurrentQuestion,
    getProgress,
    shouldSkipCurrentQuestion,
    workExperienceCount,
    educationCount,
    volunteeringCount,
    referenceCount,
    addWorkExperience,
    addEducation,
    addVolunteering,
    addReference,
    sectionPhase,
    setSectionPhase,
    confirmSection,
    sectionConfirmed,
    onboardingComplete,
    setOnboardingComplete,
    helpMeWriteActive,
    helpMeWriteQuestionId,
    startHelpMeWrite,
    endHelpMeWrite,
  } = useConversationStore();

  const { trackEvent } = useAnalyticsStore();
  const { t, language } = useTranslation();

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Get translated question text - skip translation for language selection question
  // Also handles dynamic text for multi-entry sections based on entry count
  const getQuestionText = useCallback((question: typeof currentQuestion) => {
    if (!question) return '';
    // Language selection question is always shown as-is (multi-lingual)
    if (question.id === 'language_select') {
      return question.question;
    }

    // Get the entry index for multi-entry sections
    const sectionKey = getSectionKeyForQuestion(question.id);
    let entryIndex = 0;
    if (sectionKey) {
      const sectionCounts: Record<string, number> = {
        'work': workExperienceCount,
        'education': educationCount,
        'volunteering': volunteeringCount,
        'references': referenceCount,
      };
      entryIndex = sectionCounts[sectionKey] || 0;
    }

    // Get the appropriate question text for the entry index
    const questionText = getQuestionTextForEntry(question, entryIndex);

    // Try to get translated question, fall back to question text
    const translationKey = `questions.${question.id.replace(/_/g, '_')}`;
    const translated = t(translationKey);
    // If translation key is returned (not found), use question text (possibly dynamic for subsequent entries)
    // Note: For subsequent entries, we use the dynamic text since translations may not exist for those
    if (entryIndex > 0) {
      return questionText;
    }
    return translated === translationKey ? questionText : translated;
  }, [t, workExperienceCount, educationCount, volunteeringCount, referenceCount]);

  // Get translated category label
  const getTranslatedCategoryLabel = useCallback((category: typeof currentCategory) => {
    const translated = t(`categories.${category}`);
    // If translation not found, fall back to English label
    return translated === `categories.${category}` ? getCategoryLabel(category) : translated;
  }, [t]);

  // Scroll to bottom when new messages arrive
  // Use block: 'nearest' to prevent scrolling the parent page in embedded mode
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [messages, isTyping]);

  // Initialize conversation with first question (and onboarding for new users)
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0 && currentQuestion) {
      hasInitialized.current = true;
      trackEvent(AnalyticsEvents.RESUME_START);

      if (shouldShowOnboarding(onboardingComplete)) {
        // Show onboarding messages with typing delays
        setTyping(true);
        let delay = 500;
        ONBOARDING_MESSAGES.forEach((msg, i) => {
          setTimeout(() => {
            addMessage({ role: 'assistant', content: msg });
            // After the last onboarding message, show a confirm (Yes/No via the normal input)
            if (i === ONBOARDING_MESSAGES.length - 1) {
              setTyping(false);
              setAwaitingOnboardingConfirm(true);
            }
          }, delay);
          delay += 800;
        });
      } else {
        // Skip onboarding, show first question directly
        setTyping(true);
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: getQuestionText(currentQuestion),
            questionId: currentQuestion.id,
          });
          setTyping(false);
        }, 500);
      }
    }
  }, [currentQuestion, messages.length, addMessage, setTyping, trackEvent, getQuestionText, onboardingComplete]);

  // Handle answer submission
  // Handle onboarding confirm submission
  const handleOnboardingConfirm = useCallback((confirmed: boolean) => {
    addMessage({ role: 'user', content: confirmed ? 'yes' : 'no' });
    setAwaitingOnboardingConfirm(false);
    setOnboardingComplete(true);

    // Now show the first question
    setTyping(true);
    setTimeout(() => {
      const store = useConversationStore.getState();
      const question = store.getCurrentQuestion();
      if (question) {
        addMessage({
          role: 'assistant',
          content: getQuestionText(question),
          questionId: question.id,
        });
      }
      setTyping(false);
    }, 500);
  }, [addMessage, setOnboardingComplete, setTyping, getQuestionText]);

  const handleSubmit = useCallback((value: string) => {
    if (!currentQuestion) return;

    // Add user message
    addMessage({
      role: 'user',
      content: value,
    });

    // Track the answer
    trackEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
      field: currentQuestion.field,
    });

    // Use intelligent answer parsing to extract multiple pieces of info from combined answers
    const parsedAnswer = parseAnswer(value, currentQuestion.field, currentQuestion.id);

    // Process the answer based on input type
    let processedValue: unknown = parsedAnswer.primaryValue;

    if (currentQuestion.inputType === 'confirm') {
      processedValue = value.toLowerCase() === 'yes';
    } else if (currentQuestion.field === 'skills.languages') {
      // Parse "English (native), Spanish (conversational)" into [{language, proficiency}]
      processedValue = value.split(',').map((s) => s.trim()).filter(Boolean).map((entry) => {
        const match = entry.match(/^(.+?)\s*\((.+?)\)\s*$/);
        if (match) {
          return { language: match[1].trim(), proficiency: match[2].trim() };
        }
        return { language: entry.trim(), proficiency: 'conversational' };
      });
    } else if (
      currentQuestion.field.startsWith('skills.') &&
      (currentQuestion.inputType === 'textarea' || currentQuestion.inputType === 'text')
    ) {
      // Split comma-separated skills/certifications into arrays
      processedValue = value.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Special handling for the 'complete' question - "Would you like to make any changes?"
    if (currentQuestion.id === 'complete') {
      const wantsChanges = value.toLowerCase() === 'yes' ||
                          value.toLowerCase().includes('yes') ||
                          value.toLowerCase().includes('change') ||
                          value.toLowerCase().includes('edit');

      if (wantsChanges) {
        // User wants to make changes - go back to personal info section
        setTyping(true);
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: t('messages.goBackToEdit', "No problem! Let's go back and make some changes. I'll take you back to your personal information - you can update anything from there."),
          });
          setTyping(false);
          // Go back to personal_name question (index 2 - after language and intro)
          goToQuestion(2);
          // Show the question
          setTimeout(() => {
            const store = useConversationStore.getState();
            const question = store.getCurrentQuestion();
            if (question) {
              addMessage({
                role: 'assistant',
                content: getQuestionText(question),
                questionId: question.id,
              });
            }
          }, 500);
        }, 800);
        return; // Don't proceed with normal flow
      }

      // User says "No" (no changes needed) - show export options and complete
      setTyping(true);
      setTimeout(() => {
        const store = useConversationStore.getState();
        store.completeConversation();

        addMessage({
          role: 'assistant',
          content: t('messages.exportReady', "Your resume is complete and ready to download! You can get it as a PDF for most job applications, or as a Word document if you need to make further edits."),
        });

        // Add the export options card
        addMessage({
          role: 'assistant',
          content: EXPORT_OPTIONS_MARKER,
        });

        trackEvent(AnalyticsEvents.RESUME_COMPLETE, {
          totalQuestions: progress.total,
        });

        // Call onComplete callback with resume data (for widget integration)
        if (onComplete) {
          onComplete(store.resumeData);
        }

        setTyping(false);
      }, 800);
      return; // Don't proceed with normal flow
    }

    // Handle email question - detect if user doesn't have an email
    if (currentQuestion.id === 'personal_email') {
      const noEmailPhrases = [
        "don't have",
        "dont have",
        "no email",
        "none",
        "i don't",
        "i dont",
        "no i don't",
        "need to create",
        "don't know",
        "dont know",
        "no",
      ];

      const userHasNoEmail = noEmailPhrases.some(phrase =>
        value.toLowerCase().trim() === phrase ||
        value.toLowerCase().includes(phrase)
      );

      if (userHasNoEmail) {
        setTyping(true);
        setTimeout(() => {
          addMessage({
            role: 'assistant',
            content: t('messages.noEmailHelp', "No problem! Having a professional email is important for job applications. Let me help you create one - it's free and only takes a few minutes."),
          });

          // Show the Gmail guide card
          addMessage({
            role: 'assistant',
            content: GMAIL_GUIDE_MARKER,
          });

          addMessage({
            role: 'assistant',
            content: t('messages.emailAfterGuide', "Once you've created your email, come back and type it here:"),
          });

          setTyping(false);
        }, 500);
        return; // Don't proceed - wait for them to enter an actual email
      }
    }

    // Handle "add more" questions for multi-entry sections
    const addMoreConfig = ADD_MORE_SECTION_MAP[currentQuestion.id];
    if (addMoreConfig) {
      const wantsMore = value.toLowerCase() === 'yes' ||
                        value.toLowerCase().includes('yes') ||
                        value.toLowerCase().includes('another') ||
                        value.toLowerCase().includes('add');

      if (wantsMore) {
        // Increment the appropriate counter
        const incrementFns: Record<string, () => void> = {
          'work': addWorkExperience,
          'education': addEducation,
          'volunteering': addVolunteering,
          'references': addReference,
        };

        const sectionLabels: Record<string, string> = {
          'work': t('sections.workExperience', 'work experience'),
          'education': t('sections.education', 'education'),
          'volunteering': t('sections.volunteering', 'volunteer experience'),
          'references': t('sections.references', 'reference'),
        };

        const incrementFn = incrementFns[addMoreConfig.sectionKey];
        if (incrementFn) {
          incrementFn();
        }

        // Go back to the first question of this section
        const firstQuestionIndex = getQuestionIndexById(addMoreConfig.firstQuestionId);

        setTyping(true);
        setTimeout(() => {
          const sectionLabel = sectionLabels[addMoreConfig.sectionKey] || 'entry';
          addMessage({
            role: 'assistant',
            content: t('messages.addingAnother', `Great! Let's add another ${sectionLabel}.`).replace('${sectionLabel}', sectionLabel),
          });

          goToQuestion(firstQuestionIndex);

          // Show the first question of the section
          setTimeout(() => {
            const store = useConversationStore.getState();
            const question = store.getCurrentQuestion();
            if (question) {
              addMessage({
                role: 'assistant',
                content: getQuestionText(question),
                questionId: question.id,
              });
            }
            setTyping(false);
          }, 300);
        }, 500);

        return; // Don't proceed with normal flow
      }
      // User said no - continue with normal flow to next section
    }

    // Update resume data with the primary value
    // Transform field path for multi-entry sections based on current count
    if (currentQuestion.field && currentQuestion.field !== 'ready' && currentQuestion.field !== 'confirmGenerate') {
      let fieldPath = currentQuestion.field;

      // Get the current entry index for multi-entry sections
      const sectionCounts: Record<string, number> = {
        'work': workExperienceCount,
        'education': educationCount,
        'volunteering': volunteeringCount,
        'references': referenceCount,
      };

      // Check if this field belongs to a multi-entry section and transform the path
      if (fieldPath.includes('workExperience[')) {
        fieldPath = transformFieldPath(fieldPath, 'work', sectionCounts['work']);
      } else if (fieldPath.includes('education[')) {
        fieldPath = transformFieldPath(fieldPath, 'education', sectionCounts['education']);
      } else if (fieldPath.includes('volunteering[')) {
        fieldPath = transformFieldPath(fieldPath, 'volunteering', sectionCounts['volunteering']);
      } else if (fieldPath.includes('references[')) {
        fieldPath = transformFieldPath(fieldPath, 'references', sectionCounts['references']);
      }

      updateResumeData(fieldPath, processedValue);
    }

    // Apply any additional fields extracted from the combined answer
    if (Object.keys(parsedAnswer.extractedFields).length > 0) {
      const store = useConversationStore.getState();
      const updatedData = applyExtractedFields(
        store.resumeData as Record<string, unknown>,
        currentQuestion.field,
        parsedAnswer.extractedFields
      );

      // Update each extracted field in the store
      for (const [fieldName, fieldValue] of Object.entries(parsedAnswer.extractedFields)) {
        // Get the base path (e.g., "workExperience[0]" from "workExperience[0].companyName")
        const basePath = currentQuestion.field.split('.').slice(0, -1).join('.');
        const fullPath = basePath ? `${basePath}.${fieldName}` : fieldName;
        updateResumeData(fullPath, fieldValue);
      }

      // Track fields to skip for subsequent questions
      if (parsedAnswer.fieldsToSkip.length > 0) {
        setExtractedFieldsToSkip(prev => [...prev, ...parsedAnswer.fieldsToSkip]);
      }
    }

    // Show typing indicator and move to next question
    setTyping(true);

    setTimeout(() => {
      // If we extracted additional fields, show a confirmation message
      if (Object.keys(parsedAnswer.extractedFields).length > 0) {
        // Build a confirmation message showing what was extracted
        const extractedInfo = Object.entries(parsedAnswer.extractedFields)
          .map(([field, value]) => {
            // Convert field names to readable labels
            const fieldLabels: Record<string, string> = {
              'jobTitle': t('messages.jobTitle', 'job title'),
              'companyName': t('messages.company', 'company'),
              'endDate': t('messages.endDate', 'end date'),
            };
            return `${fieldLabels[field] || field}: ${value}`;
          })
          .join(', ');

        const confirmMessage = t(
          'messages.extractedInfo',
          `Got it! I also noted your ${extractedInfo}. Let me continue with the next question.`
        ).replace('${extractedInfo}', extractedInfo);

        addMessage({
          role: 'assistant',
          content: confirmMessage,
        });
      }

      nextQuestion();

      // Check if we need to skip the new question
      const store = useConversationStore.getState();
      let nextQ = store.getCurrentQuestion();

      // Skip questions if needed (including those whose fields were already extracted)
      while (nextQ) {
        const shouldSkipViaCondition = store.shouldSkipCurrentQuestion();

        // Transform the field path to the correct entry index before checking
        // so that multi-entry sections don't skip based on stale data at index 0
        let fieldPathForSkipCheck = nextQ.field;
        const storeState = store;
        const skipSectionCounts: Record<string, number> = {
          'work': storeState.workExperienceCount,
          'education': storeState.educationCount,
          'volunteering': storeState.volunteeringCount,
          'references': storeState.referenceCount,
        };
        if (fieldPathForSkipCheck.includes('workExperience[')) {
          fieldPathForSkipCheck = transformFieldPath(fieldPathForSkipCheck, 'work', skipSectionCounts['work']);
        } else if (fieldPathForSkipCheck.includes('education[')) {
          fieldPathForSkipCheck = transformFieldPath(fieldPathForSkipCheck, 'education', skipSectionCounts['education']);
        } else if (fieldPathForSkipCheck.includes('volunteering[')) {
          fieldPathForSkipCheck = transformFieldPath(fieldPathForSkipCheck, 'volunteering', skipSectionCounts['volunteering']);
        } else if (fieldPathForSkipCheck.includes('references[')) {
          fieldPathForSkipCheck = transformFieldPath(fieldPathForSkipCheck, 'references', skipSectionCounts['references']);
        }

        const shouldSkipViaExtraction = shouldSkipQuestion(
          fieldPathForSkipCheck,
          extractedFieldsToSkip.concat(parsedAnswer.fieldsToSkip),
          store.resumeData as Record<string, unknown>
        );

        if (shouldSkipViaCondition || shouldSkipViaExtraction) {
          store.nextQuestion();
          nextQ = store.getCurrentQuestion();
        } else {
          break;
        }
      }

      if (nextQ) {
        // Check if we're transitioning to a new section
        const isNewSection = nextQ.category !== currentQuestion.category;

        // After review_confirm is answered with Yes, show the preview card before the complete question
        if (currentQuestion.id === 'review_confirm' && processedValue === true && nextQ.id === 'complete') {
          // First add a message introducing the preview
          addMessage({
            role: 'assistant',
            content: t('messages.previewReady', "Here's a preview of your resume! Take a look at how it turned out:"),
          });
          // Add the preview card marker
          addMessage({
            role: 'assistant',
            content: PREVIEW_CARD_MARKER,
          });
          // Then show the complete question after a brief delay
          setTimeout(() => {
            addMessage({
              role: 'assistant',
              content: getQuestionText(nextQ),
              questionId: nextQ.id,
            });
          }, 500);
        } else if (isNewSection) {
          // Check if the completed section should get a summary card
          if (SUMMARIZABLE_CATEGORIES.has(currentQuestion.category)) {
            // Show section summary card instead of immediately transitioning
            setSectionPhase('summary');
            addMessage({
              role: 'assistant',
              content: SECTION_SUMMARY_MARKER,
            });
          } else {
            // Non-summarizable sections transition directly
            const completionMsg = getSectionCompletionMessage(currentQuestion.category);
            if (completionMsg) {
              addMessage({
                role: 'assistant',
                content: `${completionMsg}`,
              });
            }

            const introMsg = getSectionIntroMessage(nextQ.category);
            if (introMsg) {
              addMessage({
                role: 'assistant',
                content: introMsg,
              });
            }

            addMessage({
              role: 'assistant',
              content: getQuestionText(nextQ),
              questionId: nextQ.id,
            });
          }
        } else {
          addMessage({
            role: 'assistant',
            content: getQuestionText(nextQ),
            questionId: nextQ.id,
          });
        }

        // Track category change
        if (isNewSection) {
          trackEvent(AnalyticsEvents.CATEGORY_COMPLETED, {
            completedCategory: currentQuestion.category,
            newCategory: nextQ.category,
          });
        }
      } else {
        // Conversation complete - set the flag to trigger save and navigation
        const store = useConversationStore.getState();
        store.completeConversation();

        const completeMessage = t('messages.resumeComplete', "Congratulations! You've completed all the questions. Let me generate your professional resume now...");
        addMessage({
          role: 'assistant',
          content: completeMessage,
        });
        trackEvent(AnalyticsEvents.RESUME_COMPLETE, {
          totalQuestions: progress.total,
        });

        // Call onComplete callback with resume data (for widget integration)
        if (onComplete) {
          onComplete(store.resumeData);
        }
      }

      setTyping(false);
    }, 800);
  }, [currentQuestion, addMessage, updateResumeData, nextQuestion, setTyping, trackEvent, progress.total, getQuestionText, t, extractedFieldsToSkip]);

  // Handle going back
  const handleBack = useCallback(() => {
    previousQuestion();
    // Remove the last two messages (user answer + assistant question)
    // This is a simplified version - in production you'd want more sophisticated state management
  }, [previousQuestion]);

  // Summary card: "Looks Good, Continue"
  const handleSummaryConfirm = useCallback(() => {
    if (!currentQuestion) return;
    const cat = currentQuestion.category;
    confirmSection(cat);
    setSectionPhase('questioning');

    // Now proceed with existing section transition logic
    const store = useConversationStore.getState();
    let nextQ = store.getCurrentQuestion();

    if (nextQ) {
      // Show completion + intro messages for the next section
      const completionMsg = getSectionCompletionMessage(cat);
      if (completionMsg) {
        addMessage({ role: 'assistant', content: `${completionMsg}` });
      }

      const introMsg = getSectionIntroMessage(nextQ.category);
      if (introMsg) {
        addMessage({ role: 'assistant', content: introMsg });
      }

      addMessage({
        role: 'assistant',
        content: getQuestionText(nextQ),
        questionId: nextQ.id,
      });
    }
  }, [currentQuestion, confirmSection, setSectionPhase, addMessage, getQuestionText]);

  // Summary card: "Add Another"
  const handleSummaryAddAnother = useCallback(() => {
    if (!currentQuestion) return;

    setSectionPhase('questioning');

    // Find the "add more" question for the current category and trigger the same logic
    const sectionKey = currentQuestion.category;
    const incrementFns: Record<string, () => void> = {
      'work': addWorkExperience,
      'education': addEducation,
      'volunteering': addVolunteering,
      'references': addReference,
    };

    const addMoreMap: Record<string, string> = {
      'work': 'work_company_1',
      'education': 'education_school',
      'volunteering': 'volunteering_org',
      'references': 'reference_name',
    };

    const incrementFn = incrementFns[sectionKey];
    if (incrementFn) incrementFn();

    const firstQuestionId = addMoreMap[sectionKey];
    if (firstQuestionId) {
      const firstQuestionIndex = getQuestionIndexById(firstQuestionId);
      goToQuestion(firstQuestionIndex);

      setTyping(true);
      setTimeout(() => {
        const store = useConversationStore.getState();
        const question = store.getCurrentQuestion();
        if (question) {
          addMessage({
            role: 'assistant',
            content: getQuestionText(question),
            questionId: question.id,
          });
        }
        setTyping(false);
      }, 300);
    }
  }, [currentQuestion, setSectionPhase, addWorkExperience, addEducation, addVolunteering, addReference, goToQuestion, setTyping, addMessage, getQuestionText]);

  // Summary card: "Edit Something"
  const handleSummaryEdit = useCallback(() => {
    // For now, go back to the first question of the current section
    if (!currentQuestion) return;
    setSectionPhase('questioning');

    // Find first question in current category
    const cat = currentQuestion.category;
    const firstInSection = allQuestions.findIndex(q => q.category === cat);
    if (firstInSection >= 0) {
      goToQuestion(firstInSection);

      setTyping(true);
      setTimeout(() => {
        const store = useConversationStore.getState();
        const question = store.getCurrentQuestion();
        if (question) {
          addMessage({
            role: 'assistant',
            content: t('messages.editSection', "Let's update this section. Here's the first question:"),
          });
          addMessage({
            role: 'assistant',
            content: getQuestionText(question),
            questionId: question.id,
          });
        }
        setTyping(false);
      }, 300);
    }
  }, [currentQuestion, setSectionPhase, goToQuestion, setTyping, addMessage, getQuestionText, t]);

  // Help Me Write: trigger
  const handleHelpMeWrite = useCallback(() => {
    if (!currentQuestion) return;
    startHelpMeWrite(currentQuestion.id);
  }, [currentQuestion, startHelpMeWrite]);

  // Help Me Write: accept generated content
  const handleHelpMeWriteAccept = useCallback((text: string) => {
    endHelpMeWrite();
    // Submit the generated text as the answer
    handleSubmit(text);
  }, [endHelpMeWrite, handleSubmit]);

  // Help Me Write: cancel
  const handleHelpMeWriteCancel = useCallback(() => {
    endHelpMeWrite();
  }, [endHelpMeWrite]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;

    trackEvent(AnalyticsEvents.QUESTION_SKIPPED, {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
    });

    handleSubmit('');
  }, [currentQuestion, trackEvent, handleSubmit]);

  // Check if personal info is complete to enable preview
  const hasPersonalInfo = resumeData.personalInfo?.fullName && resumeData.personalInfo?.email;
  const canShowPreview = hasPersonalInfo && !isWidget; // Don't show in widget mode

  return (
    <div className={`flex h-full bg-[#0a0a0a] ${isWidget ? 'rounded-xl overflow-hidden' : ''}`}>
      {/* Main Chat Container */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header with progress */}
        <div className="flex-shrink-0 p-4 border-b border-[#27272a] bg-[#111111]">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-semibold text-white">Resume Builder</h2>
              <p className="text-sm text-[#71717a]">{getTranslatedCategoryLabel(currentCategory)}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Preview Toggle Button */}
              {canShowPreview && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    showPreview
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                      : 'bg-[#1a1a1a] text-[#a1a1aa] hover:bg-[#27272a]'
                  }`}
                  title={showPreview ? 'Hide Preview' : 'Show Preview'}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span className="hidden sm:inline">
                    {showPreview ? 'Hide Preview' : 'Preview'}
                  </span>
                </button>
              )}
              {isWidget && (
                <div className="text-xs text-[#71717a]">
                  Powered by Childress Digital
                </div>
              )}
            </div>
          </div>
        {/* Section-based progress indicator */}
        <SectionProgressBar currentCategory={currentCategory} sectionConfirmed={sectionConfirmed} />
        {/* Detailed step progress */}
        <div className="mt-2 flex items-center justify-between text-xs text-[#52525b]">
          <span>Question {progress.current} of {progress.total}</span>
          <span className="text-green-500">{Math.round((progress.current / progress.total) * 100)}%</span>
        </div>
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          if (message.content === PREVIEW_CARD_MARKER) {
            return (
              <div key={message.id} className="flex justify-start">
                <InlinePreviewCard
                  resumeData={resumeData}
                  onViewFull={() => navigate('/preview/new', { state: { resumeData } })}
                />
              </div>
            );
          }
          if (message.content === EXPORT_OPTIONS_MARKER) {
            return (
              <div key={message.id} className="flex justify-start">
                <ExportOptionsCard
                  resumeData={resumeData}
                  onViewPreview={() => navigate('/preview/new', { state: { resumeData } })}
                />
              </div>
            );
          }
          if (message.content === SECTION_SUMMARY_MARKER) {
            return (
              <div key={message.id} className="flex justify-start">
                <SectionSummaryCard
                  category={currentCategory}
                  resumeData={resumeData}
                  onConfirm={handleSummaryConfirm}
                  onAddAnother={handleSummaryAddAnother}
                  onEdit={handleSummaryEdit}
                />
              </div>
            );
          }
          if (message.content === GMAIL_GUIDE_MARKER) {
            const personalInfo = resumeData?.personalInfo as { fullName?: string } | undefined;
            return (
              <div key={message.id} className="flex justify-start">
                <GmailGuideCard
                  suggestedUsername={personalInfo?.fullName}
                />
              </div>
            );
          }
          return (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          );
        })}
        {helpMeWriteActive && helpMeWriteQuestionId && (
          <div className="flex justify-start">
            <HelpMeWriteFlow
              questionId={helpMeWriteQuestionId}
              onAccept={handleHelpMeWriteAccept}
              onCancel={handleHelpMeWriteCancel}
            />
          </div>
        )}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

        {/* Input area */}
        {awaitingOnboardingConfirm ? (
          /* Onboarding confirm buttons */
          <div className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => handleOnboardingConfirm(true)}
                disabled={isTyping}
                className="px-4 py-2.5 text-sm font-medium bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50"
              >
                Yes, let's go!
              </button>
            </div>
            <button
              onClick={() => handleOnboardingConfirm(true)}
              className="mt-2 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
            >
              Skip Intro
            </button>
          </div>
        ) : sectionPhase !== 'summary' ? (
          <ChatInput
            question={currentQuestion}
            onSubmit={handleSubmit}
            onBack={currentQuestionIndex > 0 ? handleBack : undefined}
            onSkip={currentQuestion && !currentQuestion.isRequired ? handleSkip : undefined}
            onHelpMeWrite={currentQuestion?.helpMeWriteEligible ? handleHelpMeWrite : undefined}
            disabled={isTyping || helpMeWriteActive}
            canGoBack={currentQuestionIndex > 0}
          />
        ) : null}
      </div>

      {/* Live Preview Panel */}
      {canShowPreview && (
        <div
          className={`${
            showPreview
              ? 'w-full md:w-[40%] lg:w-[35%] xl:w-[30%]'
              : 'hidden'
          } transition-all duration-300`}
        >
          <LivePreviewPanel
            resumeData={resumeData}
            onTemplateChange={(template) => {
              updateResumeData('templateStyle', template);
            }}
            isVisible={showPreview}
          />
        </div>
      )}
    </div>
  );
};
