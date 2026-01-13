/**
 * FollowUpIndicator Component
 * Shows follow-up count and provides a "Move on" button
 * Helps users understand they can skip follow-up questions
 */

import React from 'react';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface FollowUpIndicatorProps {
  currentCount: number;
  maxCount: number;
  sectionName: string;
  onMoveOn: () => void;
  showMoveOn?: boolean;
}

export const FollowUpIndicator: React.FC<FollowUpIndicatorProps> = ({
  currentCount,
  maxCount,
  sectionName,
  onMoveOn,
  showMoveOn = true,
}) => {
  // Only show after at least one follow-up
  if (currentCount < 1) return null;

  const isNearLimit = currentCount >= maxCount - 1;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#111111] border-t border-[#27272a]">
      <div className="flex items-center gap-2">
        <MessageCircle className="w-4 h-4 text-[#71717a]" />
        <span className="text-sm text-[#71717a]">
          Follow-up {currentCount}/{maxCount}
          {isNearLimit && (
            <span className="text-yellow-500 ml-1">(almost done)</span>
          )}
        </span>
      </div>

      {showMoveOn && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveOn}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="text-blue-400 hover:text-blue-300"
        >
          Move on
        </Button>
      )}
    </div>
  );
};

/**
 * Compact version for inline display
 */
export const FollowUpBadge: React.FC<{
  currentCount: number;
  maxCount: number;
}> = ({ currentCount, maxCount }) => {
  if (currentCount < 1) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-[#27272a] text-[#71717a]">
      <MessageCircle className="w-3 h-3" />
      {currentCount}/{maxCount}
    </span>
  );
};
