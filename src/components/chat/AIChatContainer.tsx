/**
 * AIChatContainer Component
 * AI-powered conversational chat interface for resume building
 * Uses natural language processing for intelligent field extraction
 */

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { ChatBubble, TypingIndicator } from './ChatBubble';
import { AIChatInput } from './AIChatInput';
import { EmailHelpCard } from './EmailHelpCard';
import { InlinePreviewCard } from './InlinePreviewCard';
import { Button } from '@/components/ui/Button';
import { useAIConversationStore, useAIConversation } from '@/stores/aiConversationStore';
import { useAnalyticsStore, AnalyticsEvents } from '@/stores/analyticsStore';
import {
  sendChatMessage,
  generateFallbackResponse,
  getWelcomeMessage,
  ConversationServiceError,
  detectVagueAnswer,
  getSectionExamples,
} from '@/lib/conversationService';
import type { ChatResponse, SpecialContent, ResumeData } from '@/types';

// Constants for error handling
const MAX_CONSECUTIVE_ERRORS = 3;

// Special markers for inline content
const PREVIEW_CARD_MARKER = '__PREVIEW_CARD__';
const EMAIL_HELP_MARKER = '__EMAIL_HELP__';

interface AIChatContainerProps {
  isWidget?: boolean;
  onComplete?: (resumeData: unknown) => void;
}

export const AIChatContainer: React.FC<AIChatContainerProps> = ({
  isWidget = false,
  onComplete,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasInitialized = useRef(false);
  const navigate = useNavigate();

  // AI conversation state
  const {
    messages,
    currentSection,
    resumeData,
    isTyping,
    isComplete,
    isAIMode,
    context,
    unconfirmedFields,
    emailHelpShown,
    addAssistantMessage,
    addUserMessage,
    setTyping,
    handleAIResponse,
    setCurrentSection,
    moveToNextSection,
    setEmailHelpShown,
    setUserEscapeRequested,
    resetConversation,
    completeConversation,
    recordResponseTime,
    updateTokenUsage,
    setAIMode,
  } = useAIConversation();

  const store = useAIConversationStore();
  const { trackEvent } = useAnalyticsStore();

  // Local state
  const [error, setError] = useState<string | null>(null);
  const [specialContent, setSpecialContent] = useState<SpecialContent | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [consecutiveErrors, setConsecutiveErrors] = useState(0);
  const [showFallbackOption, setShowFallbackOption] = useState(false);
  const [inReviewMode, setInReviewMode] = useState(false);

  // Get current follow-up count
  const followUpCount = store.followUpCounts[currentSection] || 0;
  const maxFollowUps = currentSection === 'work' || currentSection === 'education' ? 5 : 3;

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping, specialContent]);

  // Initialize conversation
  useEffect(() => {
    if (!hasInitialized.current && messages.length === 0) {
      hasInitialized.current = true;
      trackEvent(AnalyticsEvents.RESUME_START);

      // Add welcome message
      setTyping(true);
      setTimeout(() => {
        addAssistantMessage(getWelcomeMessage());
        setTyping(false);
      }, 500);
    }
  }, [messages.length, addAssistantMessage, setTyping, trackEvent]);

  // Handle message submission
  const handleSubmit = useCallback(async (userMessage: string) => {
    if (!userMessage.trim()) return;

    // Clear any previous errors
    setError(null);
    setSpecialContent(null);

    // Add user message to chat
    addUserMessage(userMessage);

    // Track the message
    trackEvent(AnalyticsEvents.QUESTION_ANSWERED, {
      section: currentSection,
      messageLength: userMessage.length,
      isAIMode: true,
    });

    // Show typing indicator
    setTyping(true);

    const startTime = Date.now();

    try {
      // Send to AI endpoint
      const response = await sendChatMessage(
        userMessage,
        messages,
        resumeData as Partial<ResumeData>,
        currentSection,
        'en', // TODO: Get from language settings
        followUpCount,
        context
      );

      const responseTime = Date.now() - startTime;
      recordResponseTime(responseTime);

      // Reset error state on success
      setError(null);
      setConsecutiveErrors(0);
      setShowFallbackOption(false);

      // Handle the AI response (this also adds the assistant message to the store)
      handleAIResponse(response);

      // Detect review mode - when AI says "let me review" or similar
      if (response.assistantMessage) {
        const lowerMessage = response.assistantMessage.toLowerCase();
        if ((lowerMessage.includes('review') && lowerMessage.includes('have so far')) ||
            (lowerMessage.includes('review') && lowerMessage.includes('what we'))) {
          setInReviewMode(true);
        }
      }

      // Handle special content (email guide)
      if (response.specialContent) {
        setSpecialContent(response.specialContent);
        if (response.specialContent.type === 'email_guide') {
          setEmailHelpShown(true);
        }
      }

      // Check if resume is complete
      if (response.isComplete) {
        // Set the flag to trigger save and navigation
        completeConversation();

        trackEvent(AnalyticsEvents.RESUME_COMPLETE, {
          totalMessages: messages.length + 2,
          aiMode: true,
        });

        // Show preview card
        addAssistantMessage(PREVIEW_CARD_MARKER);

        if (onComplete) {
          onComplete(resumeData);
        }
      }

      // Track section changes
      if (response.suggestedSection && response.suggestedSection !== currentSection) {
        trackEvent(AnalyticsEvents.CATEGORY_COMPLETED, {
          completedCategory: currentSection,
          newCategory: response.suggestedSection,
        });
      }

    } catch (err) {
      console.error('Chat error:', err);

      // Track consecutive errors
      const newErrorCount = consecutiveErrors + 1;
      setConsecutiveErrors(newErrorCount);

      if (err instanceof ConversationServiceError) {
        setError(err.message);

        if (err.recoverable) {
          // Use fallback response
          const fallback = generateFallbackResponse(currentSection);
          addAssistantMessage(fallback.assistantMessage);
        }

        // Show fallback option after multiple errors
        if (newErrorCount >= MAX_CONSECUTIVE_ERRORS) {
          setShowFallbackOption(true);
          addAssistantMessage(
            "I'm having trouble connecting to my AI features. Would you like to switch to Classic mode? It's a simpler step-by-step approach that doesn't require AI."
          );
        }
      } else {
        setError('Something went wrong. Please try again.');
        // Add a generic fallback
        addAssistantMessage("I'm sorry, I had trouble understanding that. Could you please try again?");

        // Show fallback option after multiple errors
        if (newErrorCount >= MAX_CONSECUTIVE_ERRORS) {
          setShowFallbackOption(true);
        }
      }

      // Track the error
      trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
        type: 'chat_error',
        code: err instanceof ConversationServiceError ? err.code : 'UNKNOWN',
        consecutiveCount: newErrorCount,
      });
    } finally {
      setTyping(false);
    }
  }, [
    messages,
    currentSection,
    resumeData,
    followUpCount,
    context,
    consecutiveErrors,
    addUserMessage,
    addAssistantMessage,
    setTyping,
    handleAIResponse,
    recordResponseTime,
    setEmailHelpShown,
    completeConversation,
    trackEvent,
    onComplete,
  ]);

  // Handle "Move on" action - SIMPLIFIED
  // Let the API handle the response via the validation layer
  // This avoids duplicate messages and inconsistent behavior
  const handleMoveOn = useCallback(async () => {
    setUserEscapeRequested(true);
    setSpecialContent(null);

    // Send "move on" to the API which will:
    // 1. Detect the escape phrase
    // 2. Calculate the next section
    // 3. Return the appropriate transition message
    // 4. Include the suggestedSection for frontend to update
    await handleSubmit("move on");
  }, [handleSubmit, setUserEscapeRequested]);

  // Handle email created
  const handleEmailCreated = useCallback(() => {
    setSpecialContent(null);
    addAssistantMessage("Great! Now that you have an email address, please share it with me.");
  }, [addAssistantMessage]);

  // Handle skip email
  const handleSkipEmail = useCallback(() => {
    setSpecialContent(null);
    addAssistantMessage("No problem, we can add your email later. Let's continue with your phone number.");
  }, [addAssistantMessage]);

  // Handle retry after error
  const handleRetry = useCallback(() => {
    setError(null);
    setIsRetrying(true);
    // Reset consecutive errors on manual retry
    setConsecutiveErrors(0);
    setShowFallbackOption(false);
    setTimeout(() => setIsRetrying(false), 1000);
  }, []);

  // Switch to Classic mode (fallback)
  const handleSwitchToClassic = useCallback(() => {
    trackEvent(AnalyticsEvents.ERROR_OCCURRED, {
      type: 'fallback_to_classic',
      reason: 'user_choice_after_errors',
      errorCount: consecutiveErrors,
    });

    // Clear errors
    setError(null);
    setConsecutiveErrors(0);
    setShowFallbackOption(false);

    // Navigate to classic mode
    navigate('/builder?mode=classic');
  }, [consecutiveErrors, navigate, trackEvent]);

  // Toggle AI mode (for testing/fallback)
  const handleToggleAIMode = useCallback(() => {
    setAIMode(!isAIMode);
  }, [isAIMode, setAIMode]);

  // Calculate progress
  const sectionOrder = ['language', 'intro', 'personal', 'work', 'education', 'volunteering', 'skills', 'references', 'review', 'complete'];
  const currentIndex = sectionOrder.indexOf(currentSection);
  const progress = Math.round(((currentIndex + 1) / sectionOrder.length) * 100);

  return (
    <div className={`flex flex-col h-full bg-[#0a0a0a] ${isWidget ? 'rounded-xl overflow-hidden' : ''}`}>
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-[#27272a] bg-[#111111]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Resume Assistant
              </h2>
              <p className="text-sm text-[#71717a] capitalize">{currentSection.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-[#27272a] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-[#71717a] text-right">{progress}% complete</div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-red-400">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRetry}
              disabled={isRetrying}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />}
            >
              Retry
            </Button>
          </div>

          {/* Fallback option after multiple errors */}
          {showFallbackOption && (
            <div className="mt-3 pt-3 border-t border-red-500/20">
              <p className="text-sm text-[#a1a1aa] mb-2">
                Having trouble? Try our simpler step-by-step mode instead.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleSwitchToClassic}
                className="w-full"
              >
                Switch to Classic Mode
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          // Render preview card
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

          // Render email help card
          if (message.content === EMAIL_HELP_MARKER) {
            return (
              <div key={message.id} className="flex justify-start">
                <EmailHelpCard
                  content={specialContent?.content || ''}
                  onEmailCreated={handleEmailCreated}
                  onSkip={handleSkipEmail}
                />
              </div>
            );
          }

          // Regular message
          return (
            <ChatBubble
              key={message.id}
              role={message.role}
              content={message.content}
              timestamp={message.timestamp}
            />
          );
        })}

        {/* Special content (email guide) */}
        {specialContent?.type === 'email_guide' && (
          <div className="flex justify-start">
            <EmailHelpCard
              content={specialContent.content}
              onEmailCreated={handleEmailCreated}
              onSkip={handleSkipEmail}
            />
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      {!isComplete && (
        <AIChatInput
          onSubmit={handleSubmit}
          onMoveOn={handleMoveOn}
          disabled={isTyping}
          isLoading={isTyping}
          placeholder="Type your message..."
          currentSection={currentSection}
          followUpCount={followUpCount}
          maxFollowUps={maxFollowUps}
          lastAIMessage={messages.filter(m => m.role === 'assistant').pop()?.content || ''}
        />
      )}

      {/* Review mode - Auto-preview and Generate Resume button */}
      {inReviewMode && !isComplete && (
        <div className="border-t border-[#27272a] bg-[#111111]">
          {/* Automatic preview during review */}
          <div className="p-4 pb-2">
            <p className="text-sm text-[#a1a1aa] mb-3">Here's a preview of your resume:</p>
            <InlinePreviewCard
              resumeData={resumeData}
              onViewFull={() => navigate('/preview/new', { state: { resumeData } })}
            />
          </div>
          {/* Generate button */}
          <div className="p-4 pt-2">
            <Button
              variant="primary"
              className="w-full"
              onClick={() => handleSubmit('generate my resume')}
              disabled={isTyping}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Finalize Resume
            </Button>
          </div>
        </div>
      )}

      {/* Complete state */}
      {isComplete && (
        <div className="p-4 border-t border-[#27272a] bg-[#111111]">
          <Button
            variant="primary"
            className="w-full"
            onClick={() => navigate('/preview/new', { state: { resumeData } })}
          >
            View & Download Resume
          </Button>
        </div>
      )}

      {/* Dev mode toggle (only in development) */}
      {import.meta.env.DEV && (
        <div className="absolute bottom-20 right-4">
          <button
            onClick={handleToggleAIMode}
            className="text-xs px-2 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-500"
            title={`AI Mode: ${isAIMode ? 'ON' : 'OFF'}`}
          >
            {isAIMode ? 'AI: ON' : 'AI: OFF'}
          </button>
        </div>
      )}
    </div>
  );
};
