/**
 * AIChatInput Component
 * Enhanced chat input for AI conversational mode
 * Supports escape phrase detection, quick replies, and natural conversation
 */

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FollowUpIndicator } from './FollowUpIndicator';
import { detectEscapePhrase } from '@/lib/conversationService';
import type { QuestionCategory } from '@/types';

interface AIChatInputProps {
  onSubmit: (value: string) => void;
  onMoveOn?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  currentSection?: QuestionCategory;
  followUpCount?: number;
  maxFollowUps?: number;
  showQuickReplies?: boolean;
  quickReplies?: string[];
  lastAIMessage?: string;  // Used to detect if current question is yes/no
}

// Sections that start with yes/no questions
const YES_NO_SECTIONS: QuestionCategory[] = ['work', 'education', 'volunteering', 'skills', 'references'];

// Quick replies for INITIAL yes/no question (followUpCount === 0)
const YES_NO_QUICK_REPLIES = ['Yes', 'No'];

// Quick replies for FOLLOW-UP questions (followUpCount > 0)
const FOLLOW_UP_QUICK_REPLIES: Record<QuestionCategory, string[]> = {
  language: ['English', 'Espanol', 'Francais', 'Deutsch', 'Portugues', '中文', '日本語', '한국어', 'العربية', 'हिन्दी'],
  intro: [],
  personal: ['Skip for now'],
  work: ['Add another job', 'No more jobs'],
  education: ['Add another', 'No more education'],
  volunteering: ['Add another', 'No more to add'],
  skills: ['Yes', 'No'],  // Skills sub-categories also use yes/no
  references: ['Add reference', 'References upon request'],
  review: ['Looks good', 'Make changes'],
  complete: [],
};

export const AIChatInput: React.FC<AIChatInputProps> = ({
  onSubmit,
  onMoveOn,
  disabled = false,
  isLoading = false,
  placeholder = 'Type your message...',
  currentSection = 'intro',
  followUpCount = 0,
  maxFollowUps = 3,
  showQuickReplies = true,
  quickReplies,
  lastAIMessage = '',
}) => {
  const [value, setValue] = useState('');
  const [showEscapeHint, setShowEscapeHint] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [value]);

  // Focus input when section changes or when AI stops typing
  useEffect(() => {
    if (!isLoading && !disabled) {
      inputRef.current?.focus();
    }
  }, [currentSection, isLoading, disabled]);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Show escape hint after some follow-ups
  useEffect(() => {
    setShowEscapeHint(followUpCount >= 2);
  }, [followUpCount]);

  const handleSubmit = useCallback((e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedValue = value.trim();

    if (!trimmedValue && !disabled) return;

    // Check for escape phrases (context-aware: "no" is not an escape in yes/no question sections)
    if (detectEscapePhrase(trimmedValue, currentSection) && onMoveOn) {
      onMoveOn();
      setValue('');
      return;
    }

    onSubmit(trimmedValue);
    setValue('');

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  }, [value, disabled, onSubmit, onMoveOn, currentSection]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Submit on Enter (without Shift)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }, [handleSubmit]);

  const handleQuickReply = useCallback((reply: string) => {
    // Check if this is an escape-type reply that should trigger move on
    const escapeReplies = ['No more jobs', 'No more education', 'No more to add', 'References upon request'];
    if (escapeReplies.includes(reply)) {
      if (onMoveOn) {
        onMoveOn();
        return;
      }
    }
    onSubmit(reply);
  }, [onSubmit, onMoveOn]);

  // Get quick replies for current section - detect from AI message content
  const availableQuickReplies = useMemo(() => {
    // Allow prop override
    if (quickReplies) return quickReplies;

    // Language section always shows language buttons
    if (currentSection === 'language') {
      return FOLLOW_UP_QUICK_REPLIES['language'] || [];
    }

    // Show Yes/No ONLY if the last AI message actually asks a yes/no question
    // Look for "(Yes or No)" pattern in the message
    const isYesNoQuestion = lastAIMessage.includes('(Yes or No)') ||
                            lastAIMessage.includes('Yes or No');

    if (isYesNoQuestion) {
      return YES_NO_QUICK_REPLIES;
    }

    // Show follow-up replies for subsequent questions in sections
    if (followUpCount > 0) {
      return FOLLOW_UP_QUICK_REPLIES[currentSection] || [];
    }

    return [];
  }, [quickReplies, currentSection, followUpCount, lastAIMessage]);

  return (
    <div className="border-t border-[#27272a] bg-[#0a0a0a]">
      {/* Follow-up indicator */}
      {followUpCount > 0 && onMoveOn && (
        <FollowUpIndicator
          currentCount={followUpCount}
          maxCount={maxFollowUps}
          sectionName={currentSection}
          onMoveOn={onMoveOn}
        />
      )}

      {/* Quick Replies */}
      {showQuickReplies && availableQuickReplies.length > 0 && !isLoading && (
        <div className="px-4 pt-3 flex flex-wrap gap-2">
          {availableQuickReplies.map((reply) => (
            <button
              key={reply}
              onClick={() => handleQuickReply(reply)}
              disabled={disabled}
              className="px-3 py-1.5 text-sm bg-[#1a1a1a] hover:bg-[#27272a] text-[#a1a1aa] hover:text-white rounded-full border border-[#27272a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {reply}
            </button>
          ))}
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled || isLoading}
              rows={1}
              className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-xl text-white placeholder-[#71717a] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50 min-h-[48px] max-h-[120px]"
            />

            {/* Escape hint */}
            {showEscapeHint && !isLoading && (
              <div className="absolute -top-6 left-0 text-xs text-[#71717a]">
                Tip: Say "move on" or "skip" to continue to the next section
              </div>
            )}
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            disabled={disabled || isLoading || !value.trim()}
            className="flex-shrink-0 h-12 w-12 p-0 rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>

        {/* Move on shortcut */}
        {onMoveOn && followUpCount > 0 && (
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={onMoveOn}
              className="text-xs text-[#71717a] hover:text-blue-400 flex items-center gap-1 transition-colors"
            >
              Press to move on
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
