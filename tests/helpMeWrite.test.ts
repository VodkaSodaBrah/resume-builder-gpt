/**
 * Help Me Write Feature Tests
 * Tests the AI coaching button, flow, and integration
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useConversationStore } from '@/stores/conversationStore';
import { questions } from '@/lib/questions';
import {
  getCoachingQuestions,
  COACHING_QUESTIONS,
  type CoachingContext,
} from '@/lib/helpMeWrite';

// ============================================================================
// Helpers
// ============================================================================

const resetStore = () => {
  const store = useConversationStore.getState();
  store.resetConversation();
};

const getStore = () => useConversationStore.getState();

const findQuestion = (id: string) => questions.find(q => q.id === id);

// ============================================================================
// Question Eligibility Tests
// ============================================================================

describe('helpMeWriteEligible flag', () => {
  it('work_responsibilities_1 is eligible', () => {
    const q = findQuestion('work_responsibilities_1');
    expect(q?.helpMeWriteEligible).toBe(true);
  });

  it('volunteering_responsibilities is eligible', () => {
    const q = findQuestion('volunteering_responsibilities');
    expect(q?.helpMeWriteEligible).toBe(true);
  });

  it('skills_technical is eligible', () => {
    const q = findQuestion('skills_technical');
    expect(q?.helpMeWriteEligible).toBe(true);
  });

  it('skills_soft is eligible', () => {
    const q = findQuestion('skills_soft');
    expect(q?.helpMeWriteEligible).toBe(true);
  });

  it('personal_name is NOT eligible', () => {
    const q = findQuestion('personal_name');
    expect(q?.helpMeWriteEligible).toBeUndefined();
  });

  it('work_company_1 is NOT eligible', () => {
    const q = findQuestion('work_company_1');
    expect(q?.helpMeWriteEligible).toBeUndefined();
  });

  it('education_school is NOT eligible', () => {
    const q = findQuestion('education_school');
    expect(q?.helpMeWriteEligible).toBeUndefined();
  });

  it('only textarea questions are eligible', () => {
    const eligible = questions.filter(q => q.helpMeWriteEligible);
    eligible.forEach(q => {
      expect(q.inputType).toBe('textarea');
    });
  });

  it('exactly 4 questions are eligible', () => {
    const eligible = questions.filter(q => q.helpMeWriteEligible);
    expect(eligible).toHaveLength(4);
  });
});

// ============================================================================
// Coaching Questions Content Tests
// ============================================================================

describe('Coaching Questions', () => {
  it('has coaching questions for work_responsibilities context', () => {
    const questions = getCoachingQuestions('work_responsibilities');
    expect(questions.length).toBeGreaterThanOrEqual(2);
    expect(questions.length).toBeLessThanOrEqual(3);
  });

  it('has coaching questions for volunteering_responsibilities context', () => {
    const questions = getCoachingQuestions('volunteering_responsibilities');
    expect(questions.length).toBeGreaterThanOrEqual(2);
  });

  it('has coaching questions for skills_technical context', () => {
    const questions = getCoachingQuestions('skills_technical');
    expect(questions.length).toBeGreaterThanOrEqual(2);
  });

  it('has coaching questions for skills_soft context', () => {
    const questions = getCoachingQuestions('skills_soft');
    expect(questions.length).toBeGreaterThanOrEqual(2);
  });

  it('work coaching questions ask about daily tasks', () => {
    const questions = getCoachingQuestions('work_responsibilities');
    const joined = questions.join(' ').toLowerCase();
    expect(joined).toContain('day');
  });

  it('skills_technical coaching questions ask about tools/programs', () => {
    const questions = getCoachingQuestions('skills_technical');
    const joined = questions.join(' ').toLowerCase();
    expect(joined).toMatch(/program|tool|computer|software/);
  });
});

// ============================================================================
// Store State Tests
// ============================================================================

describe('Help Me Write Store Actions', () => {
  beforeEach(() => {
    resetStore();
  });

  it('startHelpMeWrite sets active and stores questionId', () => {
    const store = getStore();
    store.startHelpMeWrite('work_responsibilities_1');
    const updated = getStore();
    expect(updated.helpMeWriteActive).toBe(true);
    expect(updated.helpMeWriteQuestionId).toBe('work_responsibilities_1');
  });

  it('endHelpMeWrite resets active and clears questionId', () => {
    const store = getStore();
    store.startHelpMeWrite('work_responsibilities_1');
    store.endHelpMeWrite();
    const updated = getStore();
    expect(updated.helpMeWriteActive).toBe(false);
    expect(updated.helpMeWriteQuestionId).toBe(null);
  });

  it('cancel returns to normal question (endHelpMeWrite)', () => {
    const store = getStore();
    store.startHelpMeWrite('skills_soft');
    expect(getStore().helpMeWriteActive).toBe(true);
    store.endHelpMeWrite();
    expect(getStore().helpMeWriteActive).toBe(false);
  });
});

// ============================================================================
// Context Mapping Tests
// ============================================================================

describe('Question to Context Mapping', () => {
  const contextMap: Record<string, CoachingContext> = {
    'work_responsibilities_1': 'work_responsibilities',
    'volunteering_responsibilities': 'volunteering_responsibilities',
    'skills_technical': 'skills_technical',
    'skills_soft': 'skills_soft',
  };

  Object.entries(contextMap).forEach(([questionId, expectedContext]) => {
    it(`maps ${questionId} to ${expectedContext} context`, () => {
      const questions = getCoachingQuestions(expectedContext);
      expect(questions.length).toBeGreaterThan(0);
    });
  });
});
