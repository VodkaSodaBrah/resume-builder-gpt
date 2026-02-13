import React, { useState, useCallback } from 'react';
import { Sparkles, ArrowRight, Check, Pencil, RotateCcw, X } from 'lucide-react';
import { getCoachingQuestions, getCoachingContext, sendHelpMeWriteRequest } from '@/lib/helpMeWrite';
import { useConversationStore } from '@/stores/conversationStore';
import type { HelpMeWriteContext } from '@/types';

interface HelpMeWriteFlowProps {
  questionId: string;
  onAccept: (text: string) => void;
  onCancel: () => void;
}

type FlowStep = 'coaching' | 'generating' | 'preview' | 'error';

export const HelpMeWriteFlow: React.FC<HelpMeWriteFlowProps> = ({
  questionId,
  onAccept,
  onCancel,
}) => {
  const context = getCoachingContext(questionId);
  const coachingQuestions = context ? getCoachingQuestions(context) : [];

  const [step, setStep] = useState<FlowStep>('coaching');
  const [currentCoachingIndex, setCurrentCoachingIndex] = useState(0);
  const [coachingAnswers, setCoachingAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [selectedBullets, setSelectedBullets] = useState<boolean[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const { resumeData } = useConversationStore();

  const handleCoachingAnswer = useCallback(() => {
    if (!currentAnswer.trim()) return;

    const newAnswers = [...coachingAnswers, currentAnswer.trim()];
    setCoachingAnswers(newAnswers);
    setCurrentAnswer('');

    if (currentCoachingIndex < coachingQuestions.length - 1) {
      setCurrentCoachingIndex(prev => prev + 1);
    } else {
      // All coaching questions answered -- generate content
      generateContent(newAnswers);
    }
  }, [currentAnswer, coachingAnswers, currentCoachingIndex, coachingQuestions.length]);

  const generateContent = useCallback(async (answers: string[]) => {
    setStep('generating');

    try {
      // Get job context from resume data
      const workEntry = resumeData.workExperience?.[0];
      const jobContext = workEntry
        ? { jobTitle: workEntry.jobTitle, companyName: workEntry.companyName }
        : undefined;

      const response = await sendHelpMeWriteRequest({
        questionContext: context as HelpMeWriteContext,
        simpleAnswers: answers,
        jobContext,
        language: resumeData.language || 'en',
      });

      setGeneratedContent(response.generatedContent);
      // Initialize all bullets as selected
      const items = response.generatedContent
        .split('\n')
        .map((line: string) => line.replace(/^[\s]*[-\u2022*]\s*/, '').trim())
        .filter(Boolean);
      setSelectedBullets(items.map(() => true));
      setStep('preview');
    } catch {
      setErrorMessage('Something went wrong generating your content. You can try again or type it yourself.');
      setStep('error');
    }
  }, [context, resumeData]);

  // Parse bullet items from generated content
  const bulletItems = generatedContent
    .split('\n')
    .map(line => line.replace(/^[\s]*[-\u2022*]\s*/, '').trim())
    .filter(Boolean);

  const toggleBullet = useCallback((index: number) => {
    setSelectedBullets(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  }, []);

  const selectedCount = selectedBullets.filter(Boolean).length;

  const handleTryAgain = useCallback(() => {
    generateContent(coachingAnswers);
  }, [coachingAnswers, generateContent]);

  if (!context || coachingQuestions.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-md bg-[#111111] border border-[#27272a] rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <h3 className="text-white text-sm font-semibold">Help Me Write This</h3>
        </div>
        <button
          onClick={onCancel}
          className="text-[#71717a] hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Coaching Step */}
      {step === 'coaching' && (
        <div className="space-y-3">
          <p className="text-[#a1a1aa] text-xs">
            Answer these simple questions and I'll write it for you:
          </p>

          {/* Show previous answers */}
          {coachingAnswers.map((answer, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[#71717a] text-xs">{coachingQuestions[i]}</p>
              <p className="text-white text-sm bg-[#1a1a1a] rounded px-3 py-2">{answer}</p>
            </div>
          ))}

          {/* Current question */}
          <div className="space-y-2">
            <p className="text-white text-sm font-medium">
              {coachingQuestions[currentCoachingIndex]}
            </p>
            <textarea
              value={currentAnswer}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer..."
              rows={2}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#27272a] rounded-lg text-white text-sm placeholder-[#52525b] resize-none focus:outline-none focus:ring-2 focus:ring-purple-500/50"
              autoFocus
            />
            <button
              onClick={handleCoachingAnswer}
              disabled={!currentAnswer.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentCoachingIndex < coachingQuestions.length - 1 ? (
                <>Next <ArrowRight className="w-3.5 h-3.5" /></>
              ) : (
                <>Generate <Sparkles className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>

          {/* Progress dots */}
          <div className="flex gap-1.5 justify-center">
            {coachingQuestions.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i < currentCoachingIndex ? 'bg-purple-500'
                  : i === currentCoachingIndex ? 'bg-purple-400 ring-2 ring-purple-400/30'
                  : 'bg-[#27272a]'
                }`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Generating Step */}
      {step === 'generating' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-[#a1a1aa] text-sm">Writing your content...</p>
        </div>
      )}

      {/* Preview Step */}
      {step === 'preview' && (
        <div className="space-y-3">
          <p className="text-[#a1a1aa] text-xs">Here's what I came up with -- select the ones you want:</p>
          <div className="bg-[#0a0a0a] border border-[#27272a] rounded-lg p-3 space-y-2">
            {bulletItems.map((bullet, i) => (
              <label key={i} className="flex items-start gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedBullets[i] ?? true}
                  onChange={() => toggleBullet(i)}
                  className="mt-1 accent-purple-500"
                />
                <span className={`text-sm ${selectedBullets[i] ? 'text-white' : 'text-[#52525b] line-through'}`}>
                  {bullet}
                </span>
              </label>
            ))}
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                const selectedText = bulletItems
                  .filter((_, i) => selectedBullets[i])
                  .join('\n');
                onAccept(selectedText);
              }}
              disabled={selectedCount === 0}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white text-sm font-medium rounded-lg hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Use Selected ({selectedCount})
            </button>
            <button
              onClick={() => {
                const selectedText = bulletItems
                  .filter((_, i) => selectedBullets[i])
                  .join('\n');
                onAccept(selectedText);
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg border border-[#27272a] hover:bg-[#27272a] transition-all"
            >
              <Pencil className="w-3.5 h-3.5" />
              Let Me Edit
            </button>
            <button
              onClick={handleTryAgain}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-[#a1a1aa] text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Error Step */}
      {step === 'error' && (
        <div className="space-y-3">
          <p className="text-red-400 text-sm">{errorMessage}</p>
          <div className="flex gap-2">
            <button
              onClick={handleTryAgain}
              className="flex-1 px-4 py-2 bg-[#1a1a1a] text-white text-sm rounded-lg border border-[#27272a] hover:bg-[#27272a] transition-all"
            >
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-[#a1a1aa] text-sm rounded-lg hover:text-white hover:bg-[#1a1a1a] transition-all"
            >
              Type It Myself
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
