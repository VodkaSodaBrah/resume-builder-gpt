/**
 * Onboarding Flow Tests
 * Tests the welcome onboarding messages for new users
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useConversationStore } from '@/stores/conversationStore';
import { ONBOARDING_MESSAGES, shouldShowOnboarding } from '@/lib/onboarding';

// ============================================================================
// Helpers
// ============================================================================

const resetStore = () => {
  const store = useConversationStore.getState();
  store.resetConversation();
};

const getStore = () => useConversationStore.getState();

// ============================================================================
// Onboarding Content Tests
// ============================================================================

describe('Onboarding Messages', () => {
  it('has exactly 3 onboarding messages', () => {
    expect(ONBOARDING_MESSAGES).toHaveLength(3);
  });

  it('first message explains what a resume is', () => {
    expect(ONBOARDING_MESSAGES[0]).toContain('resume');
    expect(ONBOARDING_MESSAGES[0]).toContain('employers');
  });

  it('second message explains the process', () => {
    expect(ONBOARDING_MESSAGES[1]).toContain('step by step');
  });

  it('third message lists what will be covered', () => {
    expect(ONBOARDING_MESSAGES[2]).toContain('contact info');
    expect(ONBOARDING_MESSAGES[2]).toContain('work experience');
  });
});

// ============================================================================
// shouldShowOnboarding Logic
// ============================================================================

describe('shouldShowOnboarding', () => {
  it('returns true when onboardingComplete is false', () => {
    expect(shouldShowOnboarding(false)).toBe(true);
  });

  it('returns false when onboardingComplete is true', () => {
    expect(shouldShowOnboarding(true)).toBe(false);
  });
});

// ============================================================================
// Store Integration
// ============================================================================

describe('Onboarding Store Integration', () => {
  beforeEach(() => {
    resetStore();
  });

  it('new users have onboardingComplete = false', () => {
    expect(getStore().onboardingComplete).toBe(false);
  });

  it('shouldShowOnboarding returns true for new users', () => {
    const store = getStore();
    expect(shouldShowOnboarding(store.onboardingComplete)).toBe(true);
  });

  it('sets onboardingComplete = true after user confirms', () => {
    const store = getStore();
    store.setOnboardingComplete(true);
    expect(getStore().onboardingComplete).toBe(true);
  });

  it('skips onboarding when onboardingComplete is true', () => {
    const store = getStore();
    store.setOnboardingComplete(true);
    expect(shouldShowOnboarding(getStore().onboardingComplete)).toBe(false);
  });

  it('onboarding state persists across reset only if explicitly preserved', () => {
    const store = getStore();
    store.setOnboardingComplete(true);
    // resetConversation should reset onboardingComplete
    store.resetConversation();
    expect(getStore().onboardingComplete).toBe(false);
  });

  it('onboarding messages appear before language question', () => {
    // The language question is the first question at index 0
    const store = getStore();
    expect(store.currentQuestionIndex).toBe(0);
    // With onboardingComplete = false, onboarding should be shown first
    expect(shouldShowOnboarding(store.onboardingComplete)).toBe(true);
  });
});
