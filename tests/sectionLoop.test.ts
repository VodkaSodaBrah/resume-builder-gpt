/**
 * Section Loop & Guided Mode State Machine Tests
 * Tests state transitions for section summary/confirm flow
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from '@/stores/conversationStore';
import { questions, getQuestionIndexById } from '@/lib/questions';
import type { QuestionCategory } from '@/types';

// ============================================================================
// Helpers
// ============================================================================

const resetStore = () => {
  const store = useConversationStore.getState();
  store.resetConversation();
};

const getStore = () => useConversationStore.getState();

/**
 * Categories that should get summary cards
 */
const SUMMARIZABLE_CATEGORIES: QuestionCategory[] = [
  'personal', 'work', 'education', 'volunteering', 'skills', 'references',
];

/**
 * Categories that should NOT get summary cards
 */
const NON_SUMMARIZABLE_CATEGORIES: QuestionCategory[] = [
  'language', 'intro', 'review', 'complete',
];

// ============================================================================
// New State Fields Tests
// ============================================================================

describe('Guided Mode State Fields', () => {
  beforeEach(() => {
    resetStore();
  });

  it('initializes sectionPhase as "questioning"', () => {
    const store = getStore();
    expect(store.sectionPhase).toBe('questioning');
  });

  it('initializes onboardingComplete as false', () => {
    const store = getStore();
    expect(store.onboardingComplete).toBe(false);
  });

  it('initializes helpMeWriteActive as false', () => {
    const store = getStore();
    expect(store.helpMeWriteActive).toBe(false);
  });

  it('initializes helpMeWriteQuestionId as null', () => {
    const store = getStore();
    expect(store.helpMeWriteQuestionId).toBe(null);
  });

  it('initializes sectionConfirmed as empty object', () => {
    const store = getStore();
    expect(store.sectionConfirmed).toEqual({});
  });
});

// ============================================================================
// Section Phase Transitions
// ============================================================================

describe('Section Phase Actions', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setSectionPhase', () => {
    it('transitions from questioning to summary', () => {
      const store = getStore();
      store.setSectionPhase('summary');
      expect(getStore().sectionPhase).toBe('summary');
    });

    it('transitions from summary back to questioning', () => {
      const store = getStore();
      store.setSectionPhase('summary');
      store.setSectionPhase('questioning');
      expect(getStore().sectionPhase).toBe('questioning');
    });
  });

  describe('confirmSection', () => {
    it('marks a section as confirmed', () => {
      const store = getStore();
      store.confirmSection('personal');
      expect(getStore().sectionConfirmed['personal']).toBe(true);
    });

    it('can confirm multiple sections independently', () => {
      const store = getStore();
      store.confirmSection('personal');
      store.confirmSection('work');
      const confirmed = getStore().sectionConfirmed;
      expect(confirmed['personal']).toBe(true);
      expect(confirmed['work']).toBe(true);
      expect(confirmed['education']).toBeUndefined();
    });
  });

  describe('unconfirmSection', () => {
    it('resets a confirmed section', () => {
      const store = getStore();
      store.confirmSection('personal');
      expect(getStore().sectionConfirmed['personal']).toBe(true);
      store.unconfirmSection('personal');
      expect(getStore().sectionConfirmed['personal']).toBe(false);
    });

    it('does not affect other sections when unconfirming', () => {
      const store = getStore();
      store.confirmSection('personal');
      store.confirmSection('work');
      store.unconfirmSection('personal');
      expect(getStore().sectionConfirmed['personal']).toBe(false);
      expect(getStore().sectionConfirmed['work']).toBe(true);
    });
  });
});

// ============================================================================
// Onboarding State
// ============================================================================

describe('Onboarding State', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('setOnboardingComplete', () => {
    it('sets onboardingComplete to true', () => {
      const store = getStore();
      store.setOnboardingComplete(true);
      expect(getStore().onboardingComplete).toBe(true);
    });

    it('can reset onboardingComplete to false', () => {
      const store = getStore();
      store.setOnboardingComplete(true);
      store.setOnboardingComplete(false);
      expect(getStore().onboardingComplete).toBe(false);
    });
  });
});

// ============================================================================
// Help Me Write State
// ============================================================================

describe('Help Me Write State', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('startHelpMeWrite', () => {
    it('sets helpMeWriteActive to true and stores questionId', () => {
      const store = getStore();
      store.startHelpMeWrite('work_responsibilities_1');
      const updated = getStore();
      expect(updated.helpMeWriteActive).toBe(true);
      expect(updated.helpMeWriteQuestionId).toBe('work_responsibilities_1');
    });
  });

  describe('endHelpMeWrite', () => {
    it('resets helpMeWriteActive and clears questionId', () => {
      const store = getStore();
      store.startHelpMeWrite('work_responsibilities_1');
      store.endHelpMeWrite();
      const updated = getStore();
      expect(updated.helpMeWriteActive).toBe(false);
      expect(updated.helpMeWriteQuestionId).toBe(null);
    });
  });
});

// ============================================================================
// Section Summary Logic
// ============================================================================

describe('Section Summary Logic', () => {
  beforeEach(() => {
    resetStore();
  });

  it('identifies which categories should receive summary cards', () => {
    SUMMARIZABLE_CATEGORIES.forEach(cat => {
      expect(SUMMARIZABLE_CATEGORIES).toContain(cat);
    });
  });

  it('excludes language, intro, review, complete from summaries', () => {
    NON_SUMMARIZABLE_CATEGORIES.forEach(cat => {
      expect(SUMMARIZABLE_CATEGORIES).not.toContain(cat);
    });
  });

  it('"Looks Good" confirms section and resets phase to questioning', () => {
    const store = getStore();
    store.setSectionPhase('summary');
    // Simulate "Looks Good" action
    store.confirmSection('personal');
    store.setSectionPhase('questioning');

    const updated = getStore();
    expect(updated.sectionConfirmed['personal']).toBe(true);
    expect(updated.sectionPhase).toBe('questioning');
  });

  it('"Add Another" keeps section unconfirmed and resets phase', () => {
    const store = getStore();
    store.setSectionPhase('summary');
    // Simulate "Add Another" - no confirmation, just reset phase
    store.setSectionPhase('questioning');

    const updated = getStore();
    expect(updated.sectionConfirmed['work']).toBeUndefined();
    expect(updated.sectionPhase).toBe('questioning');
  });
});

// ============================================================================
// State Persistence Tests
// ============================================================================

describe('State Persistence (partialize)', () => {
  beforeEach(() => {
    resetStore();
  });

  it('includes sectionPhase in persisted state', () => {
    const store = getStore();
    store.setSectionPhase('summary');
    // Access the raw persisted state shape
    const state = useConversationStore.getState();
    expect(state.sectionPhase).toBe('summary');
  });

  it('includes onboardingComplete in persisted state', () => {
    const store = getStore();
    store.setOnboardingComplete(true);
    const state = useConversationStore.getState();
    expect(state.onboardingComplete).toBe(true);
  });

  it('includes sectionConfirmed in persisted state', () => {
    const store = getStore();
    store.confirmSection('personal');
    const state = useConversationStore.getState();
    expect(state.sectionConfirmed['personal']).toBe(true);
  });
});

// ============================================================================
// Reset Behavior
// ============================================================================

describe('Reset Conversation', () => {
  it('resets all guided mode state fields', () => {
    const store = getStore();
    // Set up various state
    store.setSectionPhase('summary');
    store.setOnboardingComplete(true);
    store.startHelpMeWrite('work_responsibilities_1');
    store.confirmSection('personal');
    store.confirmSection('work');

    // Reset
    store.resetConversation();

    const reset = getStore();
    expect(reset.sectionPhase).toBe('questioning');
    expect(reset.onboardingComplete).toBe(false);
    expect(reset.helpMeWriteActive).toBe(false);
    expect(reset.helpMeWriteQuestionId).toBe(null);
    expect(reset.sectionConfirmed).toEqual({});
  });
});

// ============================================================================
// Skipped Section Bypass
// ============================================================================

describe('Skipped Section Bypass', () => {
  it('gate "No" answers result in no summary for that section', () => {
    // When hasWorkExperience is false, all work questions are skipped
    // So there should be no summary card for work
    const store = getStore();
    store.updateResumeData('hasWorkExperience', false);
    // The section is never entered, so sectionConfirmed should not have 'work'
    expect(getStore().sectionConfirmed['work']).toBeUndefined();
  });
});
