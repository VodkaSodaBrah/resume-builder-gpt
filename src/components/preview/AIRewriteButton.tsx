import React, { useState } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { rewriteField } from '@/lib/rewriteApi';
import { AIRewriteSuggestion } from './AIRewriteSuggestion';

interface AIRewriteButtonProps {
  currentValue: string;
  fieldType: string;
  context?: { jobTitle?: string; section?: string };
  language?: string;
  onRewriteComplete: (newValue: string) => void;
}

export const AIRewriteButton: React.FC<AIRewriteButtonProps> = ({
  currentValue,
  fieldType,
  context,
  language = 'en',
  onRewriteComplete,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  const handleClick = async () => {
    setIsLoading(true);
    setSuggestion(null);

    try {
      const result = await rewriteField(fieldType, currentValue, context, language);
      if (result) {
        setSuggestion(result);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccept = () => {
    if (suggestion) {
      onRewriteComplete(suggestion);
      setSuggestion(null);
    }
  };

  const handleReject = () => {
    setSuggestion(null);
  };

  return (
    <div className="inline-flex flex-col">
      <button
        onClick={handleClick}
        disabled={isLoading}
        className="p-1 text-blue-400 hover:text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Improve with AI"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Sparkles className="w-3.5 h-3.5" />
        )}
      </button>

      {suggestion && (
        <AIRewriteSuggestion
          original={currentValue}
          suggestion={suggestion}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
};
