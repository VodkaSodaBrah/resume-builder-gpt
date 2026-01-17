import React from 'react';
import type { QuestionCategory } from '@/types';

interface SectionProgressBarProps {
  currentCategory: QuestionCategory;
  className?: string;
}

// Define the main sections (excluding intro/language/complete which are transitional)
const SECTIONS: { id: QuestionCategory; label: string; icon: string }[] = [
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'work', label: 'Work', icon: '💼' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'volunteering', label: 'Volunteer', icon: '🤝' },
  { id: 'skills', label: 'Skills', icon: '⭐' },
  { id: 'references', label: 'References', icon: '📋' },
  { id: 'review', label: 'Review', icon: '✨' },
];

// Map categories to their section index
const CATEGORY_TO_SECTION_INDEX: Record<QuestionCategory, number> = {
  'language': -1,
  'intro': -1,
  'personal': 0,
  'work': 1,
  'education': 2,
  'volunteering': 3,
  'skills': 4,
  'references': 5,
  'review': 6,
  'complete': 7,
};

export const SectionProgressBar: React.FC<SectionProgressBarProps> = ({
  currentCategory,
  className = '',
}) => {
  const currentIndex = CATEGORY_TO_SECTION_INDEX[currentCategory];

  return (
    <div className={`w-full ${className}`}>
      {/* Section dots/pills */}
      <div className="flex items-center justify-between gap-1">
        {SECTIONS.map((section, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={section.id} className="flex-1 flex flex-col items-center">
              {/* Dot/Circle */}
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs
                  transition-all duration-300
                  ${isCompleted
                    ? 'bg-green-500/20 text-green-500'
                    : isCurrent
                    ? 'bg-blue-500/20 text-blue-500 ring-2 ring-blue-500/50'
                    : 'bg-[#1a1a1a] text-[#52525b]'
                  }
                `}
              >
                {isCompleted ? '✓' : section.icon}
              </div>
              {/* Label (hidden on small screens) */}
              <span
                className={`
                  mt-1 text-[10px] font-medium hidden sm:block
                  ${isCurrent ? 'text-blue-400' : isCompleted ? 'text-green-500' : 'text-[#52525b]'}
                `}
              >
                {section.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="mt-3 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${Math.max(0, ((currentIndex + 1) / SECTIONS.length) * 100)}%` }}
        />
      </div>
    </div>
  );
};

export const getSectionIntroMessage = (category: QuestionCategory): string | null => {
  const intros: Partial<Record<QuestionCategory, string>> = {
    'personal': "Let's start with your contact information. This will appear at the top of your resume.",
    'work': "Now let's talk about your work experience. This is often the most important part of a resume!",
    'education': "Great progress! Now let's add your education background.",
    'volunteering': "Volunteer work can really make your resume stand out. Let's see if you have any to add!",
    'skills': "Almost there! Let's highlight your skills and qualifications.",
    'references': "We're almost done! Would you like to add references to your resume?",
    'review': "Excellent work! You've completed all the sections. Let's review and finalize your resume!",
  };
  return intros[category] || null;
};

export const getSectionCompletionMessage = (category: QuestionCategory): string | null => {
  const completions: Partial<Record<QuestionCategory, string>> = {
    'personal': "Your contact information is all set!",
    'work': "Work experience section complete!",
    'education': "Education section done!",
    'volunteering': "Volunteer section finished!",
    'skills': "Skills section complete!",
    'references': "References section done!",
  };
  return completions[category] || null;
};
