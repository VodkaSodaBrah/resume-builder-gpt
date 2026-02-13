/**
 * HelpMeWriteFlow Component Tests
 * Tests the selectable bullet UI in the preview step
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { HelpMeWriteFlow } from '@/components/chat/HelpMeWriteFlow';

// Mock the helpMeWrite module
vi.mock('@/lib/helpMeWrite', () => ({
  getCoachingContext: (id: string) => {
    if (id === 'work_responsibilities_1') return 'work_responsibilities';
    return null;
  },
  getCoachingQuestions: (context: string) => {
    if (context === 'work_responsibilities') {
      return ['What did you do?', 'Any achievements?'];
    }
    return [];
  },
  sendHelpMeWriteRequest: vi.fn().mockResolvedValue({
    generatedContent: '• Managed a team of 10 engineers\n• Increased revenue by 25%\n• Implemented CI/CD pipelines',
  }),
}));

// Mock the conversation store
vi.mock('@/stores/conversationStore', () => ({
  useConversationStore: () => ({
    resumeData: {
      workExperience: [{ jobTitle: 'Engineer', companyName: 'Acme' }],
      language: 'en',
    },
  }),
}));

// ============================================================================
// Helpers
// ============================================================================

/**
 * Advance the HelpMeWriteFlow through coaching questions to reach the preview step.
 */
async function advanceToPreview(onAccept = vi.fn(), onCancel = vi.fn()) {
  const result = render(
    <HelpMeWriteFlow
      questionId="work_responsibilities_1"
      onAccept={onAccept}
      onCancel={onCancel}
    />
  );

  // Answer first coaching question
  const textarea = screen.getByPlaceholderText('Type your answer...');
  fireEvent.change(textarea, { target: { value: 'I managed the engineering team' } });
  fireEvent.click(screen.getByText(/Next/));

  // Answer second coaching question
  await waitFor(() => {
    expect(screen.getByText('Any achievements?')).toBeDefined();
  });
  const textarea2 = screen.getByPlaceholderText('Type your answer...');
  fireEvent.change(textarea2, { target: { value: 'Increased team velocity' } });
  fireEvent.click(screen.getByText(/Generate/));

  // Wait for preview step
  await waitFor(() => {
    expect(screen.getByText(/Use Selected/)).toBeDefined();
  });

  return { ...result, onAccept, onCancel };
}

// ============================================================================
// Selectable Bullet Tests
// ============================================================================

describe('HelpMeWriteFlow - Selectable Bullets', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders checkboxes for each generated bullet', async () => {
    const { container } = await advanceToPreview();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    expect(checkboxes.length).toBe(3);
  });

  it('all bullets are selected by default', async () => {
    const { container } = await advanceToPreview();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => {
      expect((cb as HTMLInputElement).checked).toBe(true);
    });
  });

  it('displays bullet text without bullet prefixes', async () => {
    await advanceToPreview();

    expect(screen.getByText('Managed a team of 10 engineers')).toBeDefined();
    expect(screen.getByText('Increased revenue by 25%')).toBeDefined();
    expect(screen.getByText('Implemented CI/CD pipelines')).toBeDefined();
  });

  it('toggling a checkbox deselects that bullet', async () => {
    const { container } = await advanceToPreview();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]); // Deselect second bullet

    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[2] as HTMLInputElement).checked).toBe(true);
  });

  it('deselected bullets show strikethrough styling', async () => {
    const { container } = await advanceToPreview();

    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[0]); // Deselect first bullet

    // The span next to the unchecked checkbox should have line-through class
    const labels = container.querySelectorAll('label');
    const firstLabelSpan = labels[0].querySelector('span');
    expect(firstLabelSpan?.className).toContain('line-through');
  });

  it('"Use Selected" sends only checked bullets joined by newline', async () => {
    const onAccept = vi.fn();
    const { container } = await advanceToPreview(onAccept);

    // Deselect the second bullet
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[1]);

    // Click "Use Selected"
    fireEvent.click(screen.getByText(/Use Selected/));

    expect(onAccept).toHaveBeenCalledWith(
      'Managed a team of 10 engineers\nImplemented CI/CD pipelines'
    );
  });

  it('"Use Selected" button shows count of selected bullets', async () => {
    const { container } = await advanceToPreview();

    // All 3 selected initially
    expect(screen.getByText(/Use Selected \(3\)/)).toBeDefined();

    // Deselect one
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    fireEvent.click(checkboxes[0]);

    expect(screen.getByText(/Use Selected \(2\)/)).toBeDefined();
  });

  it('"Try Again" button is still available', async () => {
    await advanceToPreview();

    expect(screen.getByText('Try Again')).toBeDefined();
  });
});
