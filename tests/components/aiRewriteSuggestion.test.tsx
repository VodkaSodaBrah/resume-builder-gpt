/**
 * AIRewriteSuggestion Component Tests
 * Inline popover showing AI suggestion with Accept/Reject buttons
 */

import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { AIRewriteSuggestion } from '@/components/preview/AIRewriteSuggestion';

describe('AIRewriteSuggestion', () => {
  it('should display the original text', () => {
    render(
      <AIRewriteSuggestion
        original="Built stuff"
        suggestion="Engineered solutions"
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Built stuff')).toBeTruthy();
  });

  it('should display the suggested text', () => {
    render(
      <AIRewriteSuggestion
        original="Built stuff"
        suggestion="Engineered solutions"
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Engineered solutions')).toBeTruthy();
  });

  it('should call onAccept when Accept is clicked', () => {
    const onAccept = vi.fn();
    render(
      <AIRewriteSuggestion
        original="old"
        suggestion="new"
        onAccept={onAccept}
        onReject={vi.fn()}
      />
    );

    fireEvent.click(screen.getByText('Accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
  });

  it('should call onReject when Reject is clicked', () => {
    const onReject = vi.fn();
    render(
      <AIRewriteSuggestion
        original="old"
        suggestion="new"
        onAccept={vi.fn()}
        onReject={onReject}
      />
    );

    fireEvent.click(screen.getByText('Reject'));
    expect(onReject).toHaveBeenCalledTimes(1);
  });

  it('should show "Original" and "Suggestion" labels', () => {
    render(
      <AIRewriteSuggestion
        original="old"
        suggestion="new"
        onAccept={vi.fn()}
        onReject={vi.fn()}
      />
    );

    expect(screen.getByText('Original:')).toBeTruthy();
    expect(screen.getByText('Suggestion:')).toBeTruthy();
  });
});
