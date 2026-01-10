import React, { useEffect, useRef, useCallback } from 'react';
import { ChatBubble, TypingIndicator } from './ChatBubble';
import { ChatInput } from './ChatInput';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useConversationStore } from '@/stores/conversationStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';
import { getCategoryLabel } from '@/lib/questions';

interface ChatContainerProps {
  isWidget?: boolean;
  onComplete?: (resumeData: unknown) => void;
}

export const ChatContainer: React.FC<ChatContainerProps> = ({ isWidget = false, onComplete }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);

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
    updateResumeData,
    getCurrentQuestion,
    getProgress,
    shouldSkipCurrentQuestion,
  } = useConversationStore();

  const { trackEvent } = useAnalyticsStore();

  const currentQuestion = getCurrentQuestion();
  const progress = getProgress();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Initialize conversation with first question
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0 && currentQuestion) {
      hasInitialized.current = true;
      trackEvent(AnalyticsEvents.RESUME_START);

      // Add initial assistant message
      setTyping(true);
      setTimeout(() => {
        addMessage({
          role: 'assistant',
          content: currentQuestion.question,
          questionId: currentQuestion.id,
        });
        setTyping(false);
      }, 500);
    }
  }, [currentQuestion, messages.length, addMessage, setTyping, trackEvent]);

  // Handle answer submission
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

    // Process the answer based on input type
    let processedValue: unknown = value;

    if (currentQuestion.inputType === 'confirm') {
      processedValue = value.toLowerCase() === 'yes';
    } else if (currentQuestion.field.includes('Skills') && currentQuestion.inputType === 'textarea') {
      // Split skills by comma
      processedValue = value.split(',').map((s) => s.trim()).filter(Boolean);
    }

    // Update resume data
    if (currentQuestion.field && currentQuestion.field !== 'ready' && currentQuestion.field !== 'confirmGenerate') {
      updateResumeData(currentQuestion.field, processedValue);
    }

    // Show typing indicator and move to next question
    setTyping(true);

    setTimeout(() => {
      nextQuestion();

      // Check if we need to skip the new question
      const store = useConversationStore.getState();
      let nextQ = store.getCurrentQuestion();

      // Skip questions if needed
      while (nextQ && store.shouldSkipCurrentQuestion()) {
        store.nextQuestion();
        nextQ = store.getCurrentQuestion();
      }

      if (nextQ) {
        addMessage({
          role: 'assistant',
          content: nextQ.question,
          questionId: nextQ.id,
        });

        // Track category change
        if (nextQ.category !== currentQuestion.category) {
          trackEvent(AnalyticsEvents.CATEGORY_COMPLETED, {
            completedCategory: currentQuestion.category,
            newCategory: nextQ.category,
          });
        }
      } else {
        // Conversation complete
        addMessage({
          role: 'assistant',
          content: "Congratulations! You've completed all the questions. Let me generate your professional resume now...",
        });
        trackEvent(AnalyticsEvents.RESUME_COMPLETE, {
          totalQuestions: progress.total,
        });

        // Call onComplete callback with resume data (for widget integration)
        if (onComplete) {
          const store = useConversationStore.getState();
          onComplete(store.resumeData);
        }
      }

      setTyping(false);
    }, 800);
  }, [currentQuestion, addMessage, updateResumeData, nextQuestion, setTyping, trackEvent, progress.total]);

  // Handle going back
  const handleBack = useCallback(() => {
    previousQuestion();
    // Remove the last two messages (user answer + assistant question)
    // This is a simplified version - in production you'd want more sophisticated state management
  }, [previousQuestion]);

  // Handle skip
  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;

    trackEvent(AnalyticsEvents.QUESTION_SKIPPED, {
      questionId: currentQuestion.id,
      category: currentQuestion.category,
    });

    handleSubmit('');
  }, [currentQuestion, trackEvent, handleSubmit]);

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0a] ${isWidget ? 'rounded-xl overflow-hidden' : ''}`}>
      {/* Header with progress */}
      <div className="flex-shrink-0 p-4 border-b border-[#27272a] bg-[#111111]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Resume Builder</h2>
            <p className="text-sm text-[#71717a]">{getCategoryLabel(currentCategory)}</p>
          </div>
          {isWidget && (
            <div className="text-xs text-[#71717a]">
              Powered by Childress Digital
            </div>
          )}
        </div>
        <ProgressBar
          current={progress.current}
          total={progress.total}
          showSteps
          showPercentage
        />
      </div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            role={message.role}
            content={message.content}
            timestamp={message.timestamp}
          />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput
        question={currentQuestion}
        onSubmit={handleSubmit}
        onBack={currentQuestionIndex > 0 ? handleBack : undefined}
        onSkip={currentQuestion && !currentQuestion.isRequired ? handleSkip : undefined}
        disabled={isTyping}
        canGoBack={currentQuestionIndex > 0}
      />
    </div>
  );
};
