/**
 * Default Mode Tests
 * Tests that Guided mode is the default, and AI mode is accessible via ?mode=ai
 */

import { describe, it, expect } from 'vitest';

/**
 * Helper to simulate the mode selection logic from Builder.tsx
 * This tests the core logic without needing full React rendering
 */
function determineMode(modeParam: string | null): boolean {
  // New logic: default to Guided (classic) mode. AI mode only via ?mode=ai
  return modeParam === 'ai';
}

describe('Default Mode Selection', () => {
  it('no URL param defaults to Guided (Classic) mode (useAIMode = false)', () => {
    const useAIMode = determineMode(null);
    expect(useAIMode).toBe(false);
  });

  it('?mode=ai activates AI mode', () => {
    const useAIMode = determineMode('ai');
    expect(useAIMode).toBe(true);
  });

  it('?mode=classic stays in Guided mode', () => {
    const useAIMode = determineMode('classic');
    expect(useAIMode).toBe(false);
  });

  it('?mode=anything-else stays in Guided mode', () => {
    const useAIMode = determineMode('other');
    expect(useAIMode).toBe(false);
  });

  it('empty string mode param stays in Guided mode', () => {
    const useAIMode = determineMode('');
    expect(useAIMode).toBe(false);
  });
});
