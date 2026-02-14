/**
 * AIRewriteButton Component Tests
 * Sparkle icon button that triggers AI rewrite and shows suggestion popover
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { AIRewriteButton } from '@/components/preview/AIRewriteButton';

// Mock the rewrite API
vi.mock('@/lib/rewriteApi', () => ({
  rewriteField: vi.fn(),
}));

import { rewriteField } from '@/lib/rewriteApi';
const mockRewriteField = vi.mocked(rewriteField);

describe('AIRewriteButton', () => {
  beforeEach(() => {
    mockRewriteField.mockReset();
  });

  it('should render a button', () => {
    const { container } = render(
      <AIRewriteButton
        currentValue="Built things"
        fieldType="responsibility"
        onRewriteComplete={vi.fn()}
      />
    );

    const button = container.querySelector('button');
    expect(button).toBeTruthy();
  });

  it('should call rewriteField API on click', async () => {
    mockRewriteField.mockResolvedValueOnce('Engineered solutions');

    const { container } = render(
      <AIRewriteButton
        currentValue="Built things"
        fieldType="responsibility"
        context={{ jobTitle: 'Engineer', section: 'work' }}
        onRewriteComplete={vi.fn()}
      />
    );

    fireEvent.click(container.querySelector('button')!);

    await waitFor(() => {
      expect(mockRewriteField).toHaveBeenCalledWith(
        'responsibility',
        'Built things',
        { jobTitle: 'Engineer', section: 'work' },
        'en'
      );
    });
  });

  it('should show suggestion popover after successful API call', async () => {
    mockRewriteField.mockResolvedValueOnce('Engineered solutions');

    const { container } = render(
      <AIRewriteButton
        currentValue="Built things"
        fieldType="responsibility"
        onRewriteComplete={vi.fn()}
      />
    );

    fireEvent.click(container.querySelector('button')!);

    await waitFor(() => {
      expect(screen.getByText('Engineered solutions')).toBeTruthy();
    });
  });

  it('should call onRewriteComplete when Accept is clicked', async () => {
    mockRewriteField.mockResolvedValueOnce('Improved text');

    const onRewriteComplete = vi.fn();
    const { container } = render(
      <AIRewriteButton
        currentValue="Original text"
        fieldType="responsibility"
        onRewriteComplete={onRewriteComplete}
      />
    );

    fireEvent.click(container.querySelector('button')!);

    await waitFor(() => {
      expect(screen.getByText('Accept')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Accept'));
    expect(onRewriteComplete).toHaveBeenCalledWith('Improved text');
  });

  it('should dismiss popover when Reject is clicked', async () => {
    mockRewriteField.mockResolvedValueOnce('Improved text');

    const onRewriteComplete = vi.fn();
    const { container } = render(
      <AIRewriteButton
        currentValue="Original text"
        fieldType="responsibility"
        onRewriteComplete={onRewriteComplete}
      />
    );

    fireEvent.click(container.querySelector('button')!);

    await waitFor(() => {
      expect(screen.getByText('Reject')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Reject'));
    expect(onRewriteComplete).not.toHaveBeenCalled();

    // Suggestion should be dismissed
    await waitFor(() => {
      expect(screen.queryByText('Improved text')).toBeNull();
    });
  });

  it('should not show suggestion when API returns null', async () => {
    mockRewriteField.mockResolvedValueOnce(null);

    const { container } = render(
      <AIRewriteButton
        currentValue="text"
        fieldType="responsibility"
        onRewriteComplete={vi.fn()}
      />
    );

    fireEvent.click(container.querySelector('button')!);

    // Wait briefly, then verify no suggestion appeared
    await new Promise((r) => setTimeout(r, 100));
    expect(screen.queryByText('Accept')).toBeNull();
  });

  it('should show loading state while API is in flight', async () => {
    // Create a promise that we control
    let resolvePromise: (v: string | null) => void;
    const apiPromise = new Promise<string | null>((resolve) => {
      resolvePromise = resolve;
    });
    mockRewriteField.mockReturnValueOnce(apiPromise);

    const { container } = render(
      <AIRewriteButton
        currentValue="text"
        fieldType="responsibility"
        onRewriteComplete={vi.fn()}
      />
    );

    fireEvent.click(container.querySelector('button')!);

    // Should show loading indicator
    await waitFor(() => {
      const spinner = container.querySelector('.animate-spin');
      expect(spinner).toBeTruthy();
    });

    // Resolve and clean up
    resolvePromise!('done');
  });
});
