/**
 * LivePreviewPanel Component Tests
 * Tests location rendering, responsibilities list display, and graceful handling of missing data
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { LivePreviewPanel } from '@/components/chat/LivePreviewPanel';
import type { ResumeData } from '@/types';

// Mock useTranslation
vi.mock('@/hooks/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, fallback: string) => fallback,
  }),
}));

// ============================================================================
// Test Data
// ============================================================================

const baseWorkData: Partial<ResumeData> = {
  personalInfo: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(555) 123-4567',
    city: 'Austin, TX',
  },
  workExperience: [
    {
      id: 'w1',
      companyName: 'Acme Corp',
      jobTitle: 'Software Engineer',
      location: 'Bethesda, MD',
      startDate: 'January 2022',
      endDate: '',
      isCurrentJob: true,
      responsibilities: 'Built web apps\nLed team meetings\nDeployed to production',
    },
  ],
};

const workDataNoLocation: Partial<ResumeData> = {
  personalInfo: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(555) 123-4567',
    city: 'Austin, TX',
  },
  workExperience: [
    {
      id: 'w1',
      companyName: 'Acme Corp',
      jobTitle: 'Software Engineer',
      location: '',
      startDate: 'January 2022',
      endDate: '',
      isCurrentJob: true,
      responsibilities: 'Built web apps',
    },
  ],
};

// ============================================================================
// Location Rendering Tests
// ============================================================================

describe('LivePreviewPanel - Work Experience Location', () => {
  it('renders work experience location when present', () => {
    render(
      <LivePreviewPanel
        resumeData={baseWorkData}
        isVisible={true}
      />
    );

    expect(screen.getByText('Bethesda, MD')).toBeDefined();
  });

  it('does not render location text when location is empty', () => {
    render(
      <LivePreviewPanel
        resumeData={workDataNoLocation}
        isVisible={true}
      />
    );

    // Should still show company name
    expect(screen.getByText('Acme Corp')).toBeDefined();
    // Should not have location element
    expect(screen.queryByText('Bethesda, MD')).toBeNull();
  });
});

// ============================================================================
// Responsibilities List Rendering Tests
// ============================================================================

describe('LivePreviewPanel - Responsibilities Display', () => {
  it('renders responsibilities as list items', () => {
    const { container } = render(
      <LivePreviewPanel
        resumeData={baseWorkData}
        isVisible={true}
      />
    );

    // Should render as <li> elements, not a single text blob
    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBeGreaterThanOrEqual(1);
  });

  it('renders individual responsibility lines as separate items', () => {
    render(
      <LivePreviewPanel
        resumeData={baseWorkData}
        isVisible={true}
      />
    );

    // Should show individual lines (up to 3 in the preview)
    expect(screen.getByText('Built web apps')).toBeDefined();
    expect(screen.getByText('Led team meetings')).toBeDefined();
    expect(screen.getByText('Deployed to production')).toBeDefined();
  });

  it('strips bullet prefixes from responsibilities in display', () => {
    const bulletData: Partial<ResumeData> = {
      ...baseWorkData,
      workExperience: [
        {
          id: 'w1',
          companyName: 'Acme Corp',
          jobTitle: 'Software Engineer',
          location: 'Bethesda, MD',
          startDate: 'January 2022',
          endDate: '',
          isCurrentJob: true,
          responsibilities: '- Built web apps\n- Led team meetings',
        },
      ],
    };

    render(
      <LivePreviewPanel
        resumeData={bulletData}
        isVisible={true}
      />
    );

    // Should strip the "- " prefix
    expect(screen.getByText('Built web apps')).toBeDefined();
    expect(screen.getByText('Led team meetings')).toBeDefined();
  });

  it('limits displayed responsibilities to 3 items', () => {
    const manyResponsibilities: Partial<ResumeData> = {
      ...baseWorkData,
      workExperience: [
        {
          id: 'w1',
          companyName: 'Acme Corp',
          jobTitle: 'Software Engineer',
          location: 'Bethesda, MD',
          startDate: 'January 2022',
          endDate: '',
          isCurrentJob: true,
          responsibilities: 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5',
        },
      ],
    };

    const { container } = render(
      <LivePreviewPanel
        resumeData={manyResponsibilities}
        isVisible={true}
      />
    );

    const listItems = container.querySelectorAll('li');
    expect(listItems.length).toBe(3);
  });
});
