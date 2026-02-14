import { useState, useEffect, useCallback } from 'react';
import type { ResumeData } from '@/types';
import { setNestedValue } from '@/lib/objectUtils';
import { useConversationStore } from '@/stores/conversationStore';

/**
 * Manages dual state updates for inline editing on the Preview page:
 * 1. Local state for immediate UI feedback
 * 2. Conversation store for persistence across navigation
 */
export function usePreviewEditor(initialData: ResumeData) {
  const [resumeData, setResumeData] = useState<ResumeData>(initialData);

  // Sync when external data changes (e.g. AI enhancement completes)
  useEffect(() => {
    setResumeData(initialData);
  }, [initialData]);

  const onFieldSave = useCallback((path: string, value: unknown) => {
    // Update local state immediately
    setResumeData((prev) => {
      const updated = setNestedValue(
        prev as unknown as Record<string, unknown>,
        path,
        value
      );
      return updated as unknown as ResumeData;
    });

    // Persist to conversation store
    useConversationStore.getState().updateResumeData(path, value);
  }, []);

  return { resumeData, onFieldSave };
}
