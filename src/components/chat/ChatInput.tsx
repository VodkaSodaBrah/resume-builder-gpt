import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { Question } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';

interface ChatInputProps {
  question: Question | null;
  onSubmit: (value: string) => void;
  onBack?: () => void;
  onSkip?: () => void;
  disabled?: boolean;
  canGoBack?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  question,
  onSubmit,
  onBack,
  onSkip,
  disabled = false,
  canGoBack = false,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Focus on input when question changes
    if (question?.inputType === 'textarea') {
      textareaRef.current?.focus();
    } else {
      inputRef.current?.focus();
    }
    setValue('');
  }, [question?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question?.inputType === 'confirm') {
      return; // Handled by buttons
    }
    if (value.trim() || !question?.isRequired) {
      onSubmit(value.trim());
      setValue('');
    }
  };

  const handleConfirm = (confirmed: boolean) => {
    onSubmit(confirmed ? 'yes' : 'no');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && question?.inputType !== 'textarea') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  if (!question) return null;

  // Confirmation/Yes-No input
  if (question.inputType === 'confirm') {
    return (
      <div className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
        <div className="flex items-center justify-between gap-3">
          {canGoBack && onBack && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              {t('ui.back', 'Back')}
            </Button>
          )}
          <div className="flex gap-3 ml-auto">
            <Button
              variant="secondary"
              onClick={() => handleConfirm(false)}
              disabled={disabled}
            >
              {t('ui.no', 'No')}
            </Button>
            <Button
              variant="primary"
              onClick={() => handleConfirm(true)}
              disabled={disabled}
            >
              {t('ui.yes', 'Yes')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Select input
  if (question.inputType === 'select' && question.options) {
    return (
      <div className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
        <div className="flex flex-wrap gap-2 mb-3">
          {question.options.map((option, index) => (
            <Button
              key={option}
              variant="secondary"
              onClick={() => onSubmit(option)}
              disabled={disabled}
            >
              {index + 1}. {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
        {canGoBack && onBack && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            {t('ui.back', 'Back')}
          </Button>
        )}
      </div>
    );
  }

  // Text area input
  if (question.inputType === 'textarea') {
    return (
      <form onSubmit={handleSubmit} className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
        <div className="flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={question.placeholder || 'Type your answer...'}
            disabled={disabled}
            rows={3}
            className="w-full px-4 py-3 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#71717a] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50"
          />
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {canGoBack && onBack && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                >
                  {t('ui.back', 'Back')}
                </Button>
              )}
              {!question.isRequired && onSkip && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  rightIcon={<SkipForward className="w-4 h-4" />}
                >
                  {t('ui.skip', 'Skip')}
                </Button>
              )}
            </div>
            <Button
              type="submit"
              variant="primary"
              disabled={disabled || (question.isRequired && !value.trim())}
              rightIcon={<Send className="w-4 h-4" />}
            >
              {t('ui.send', 'Send')}
            </Button>
          </div>
        </div>
      </form>
    );
  }

  // Standard text input
  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-[#27272a] bg-[#0a0a0a]">
      <div className="flex items-center gap-3">
        {canGoBack && onBack && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        )}
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type={question.inputType === 'email' ? 'email' : question.inputType === 'phone' ? 'tel' : 'text'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={question.placeholder || 'Type your answer...'}
            disabled={disabled}
            className="w-full px-4 py-3 pr-12 bg-[#111111] border border-[#27272a] rounded-lg text-white placeholder-[#71717a] focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 disabled:opacity-50"
          />
        </div>
        {!question.isRequired && onSkip && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onSkip}
            className="flex-shrink-0"
          >
            {t('ui.skip', 'Skip')}
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          disabled={disabled || (question.isRequired && !value.trim())}
          className="flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </form>
  );
};
