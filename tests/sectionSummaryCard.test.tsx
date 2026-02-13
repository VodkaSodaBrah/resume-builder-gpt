/**
 * SectionSummaryCard Component Tests
 * Tests rendering, button callbacks, and data display for each section type
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { SectionSummaryCard } from '@/components/chat/SectionSummaryCard';
import type { ResumeData, QuestionCategory } from '@/types';

// ============================================================================
// Test Data
// ============================================================================

const personalData: Partial<ResumeData> = {
  personalInfo: {
    fullName: 'Jane Smith',
    email: 'jane@example.com',
    phone: '(555) 123-4567',
    city: 'Austin, TX',
    zipCode: '78701',
  },
};

const workData: Partial<ResumeData> = {
  workExperience: [
    {
      id: 'w1',
      companyName: 'Acme Corp',
      jobTitle: 'Software Engineer',
      location: 'Austin, TX',
      startDate: 'January 2022',
      endDate: '',
      isCurrentJob: true,
      responsibilities: 'Built web applications, mentored juniors',
    },
    {
      id: 'w2',
      companyName: 'StartupCo',
      jobTitle: 'Junior Developer',
      location: 'Dallas, TX',
      startDate: 'June 2020',
      endDate: 'December 2021',
      isCurrentJob: false,
      responsibilities: 'Developed frontend components',
    },
  ],
};

const educationData: Partial<ResumeData> = {
  education: [
    {
      id: 'e1',
      schoolName: 'University of Texas',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      startYear: '2016',
      endYear: '2020',
      isCurrentlyStudying: false,
    },
  ],
};

const volunteeringData: Partial<ResumeData> = {
  volunteering: [
    {
      id: 'v1',
      organizationName: 'Local Food Bank',
      role: 'Distribution Volunteer',
      startDate: '2021',
      endDate: '2023',
      responsibilities: 'Sorted and packed food boxes for families',
    },
  ],
};

const skillsData: Partial<ResumeData> = {
  skills: {
    technicalSkills: ['JavaScript', 'React', 'Node.js'],
    softSkills: ['Leadership', 'Communication'],
    certifications: ['AWS Certified'],
    languages: [{ language: 'Spanish', proficiency: 'conversational' }],
  },
};

const referencesData: Partial<ResumeData> = {
  references: [
    {
      id: 'r1',
      name: 'John Doe',
      jobTitle: 'Manager',
      company: 'Acme Corp',
      phone: '(555) 999-8888',
      email: 'john@acme.com',
      relationship: 'Former Supervisor',
    },
  ],
};

const emptyData: Partial<ResumeData> = {};

// ============================================================================
// Multi-entry sections (should show "Add Another" button)
// ============================================================================

const MULTI_ENTRY_SECTIONS: QuestionCategory[] = ['work', 'education', 'volunteering', 'references'];
const SINGLE_ENTRY_SECTIONS: QuestionCategory[] = ['personal', 'skills'];

// ============================================================================
// Rendering Tests
// ============================================================================

describe('SectionSummaryCard', () => {
  const mockOnConfirm = vi.fn();
  const mockOnAddAnother = vi.fn();
  const mockOnEdit = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Personal section', () => {
    it('renders personal info fields', () => {
      render(
        <SectionSummaryCard
          category="personal"
          resumeData={personalData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      expect(screen.getByText(/jane@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/\(555\) 123-4567/)).toBeInTheDocument();
      expect(screen.getByText(/Austin, TX/)).toBeInTheDocument();
    });

    it('does not show "Add Another" button for personal section', () => {
      render(
        <SectionSummaryCard
          category="personal"
          resumeData={personalData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText(/Add Another/)).not.toBeInTheDocument();
    });
  });

  describe('Work section', () => {
    it('renders multiple work experience entries', () => {
      render(
        <SectionSummaryCard
          category="work"
          resumeData={workData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/Software Engineer/)).toBeInTheDocument();
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
      expect(screen.getByText(/Junior Developer/)).toBeInTheDocument();
      expect(screen.getByText(/StartupCo/)).toBeInTheDocument();
    });

    it('shows "Add Another" button for work section', () => {
      render(
        <SectionSummaryCard
          category="work"
          resumeData={workData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/Add Another/)).toBeInTheDocument();
    });
  });

  describe('Education section', () => {
    it('renders education entries', () => {
      render(
        <SectionSummaryCard
          category="education"
          resumeData={educationData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/University of Texas/)).toBeInTheDocument();
      expect(screen.getByText(/Computer Science/)).toBeInTheDocument();
    });
  });

  describe('Volunteering section', () => {
    it('renders volunteering entries', () => {
      render(
        <SectionSummaryCard
          category="volunteering"
          resumeData={volunteeringData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/Local Food Bank/)).toBeInTheDocument();
      expect(screen.getByText(/Distribution Volunteer/)).toBeInTheDocument();
    });
  });

  describe('Skills section', () => {
    it('renders skills sub-lists', () => {
      render(
        <SectionSummaryCard
          category="skills"
          resumeData={skillsData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/JavaScript/)).toBeInTheDocument();
      expect(screen.getByText(/Leadership/)).toBeInTheDocument();
      expect(screen.getByText(/AWS Certified/)).toBeInTheDocument();
      expect(screen.getByText(/Spanish/)).toBeInTheDocument();
    });

    it('does not show "Add Another" button for skills section', () => {
      render(
        <SectionSummaryCard
          category="skills"
          resumeData={skillsData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.queryByText(/Add Another/)).not.toBeInTheDocument();
    });
  });

  describe('References section', () => {
    it('renders reference entries', () => {
      render(
        <SectionSummaryCard
          category="references"
          resumeData={referencesData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      expect(screen.getByText(/Manager/)).toBeInTheDocument();
      expect(screen.getByText(/Acme Corp/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Empty/Missing Data
  // ============================================================================

  describe('Empty data handling', () => {
    it('handles empty/missing personal data gracefully', () => {
      render(
        <SectionSummaryCard
          category="personal"
          resumeData={emptyData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      // Should render without crashing
      expect(screen.getByText(/Looks Good/)).toBeInTheDocument();
    });

    it('handles empty work experience array', () => {
      render(
        <SectionSummaryCard
          category="work"
          resumeData={{ workExperience: [] }}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      expect(screen.getByText(/Looks Good/)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Button Callbacks
  // ============================================================================

  describe('Button callbacks', () => {
    it('"Looks Good, Continue" button fires onConfirm', () => {
      render(
        <SectionSummaryCard
          category="personal"
          resumeData={personalData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByText(/Looks Good/));
      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it('"Add Another" button fires onAddAnother', () => {
      render(
        <SectionSummaryCard
          category="work"
          resumeData={workData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByText(/Add Another/));
      expect(mockOnAddAnother).toHaveBeenCalledTimes(1);
    });

    it('"Edit Something" button fires onEdit', () => {
      render(
        <SectionSummaryCard
          category="personal"
          resumeData={personalData}
          onConfirm={mockOnConfirm}
          onAddAnother={mockOnAddAnother}
          onEdit={mockOnEdit}
        />
      );

      fireEvent.click(screen.getByText(/Edit Something/));
      expect(mockOnEdit).toHaveBeenCalledTimes(1);
    });
  });

  // ============================================================================
  // "Add Another" button visibility
  // ============================================================================

  describe('"Add Another" button visibility', () => {
    MULTI_ENTRY_SECTIONS.forEach(section => {
      it(`shows "Add Another" for ${section} section`, () => {
        const data = section === 'work' ? workData
          : section === 'education' ? educationData
          : section === 'volunteering' ? volunteeringData
          : referencesData;

        render(
          <SectionSummaryCard
            category={section}
            resumeData={data}
            onConfirm={mockOnConfirm}
            onAddAnother={mockOnAddAnother}
            onEdit={mockOnEdit}
          />
        );

        expect(screen.getByText(/Add Another/)).toBeInTheDocument();
      });
    });

    SINGLE_ENTRY_SECTIONS.forEach(section => {
      it(`does not show "Add Another" for ${section} section`, () => {
        const data = section === 'personal' ? personalData : skillsData;

        render(
          <SectionSummaryCard
            category={section}
            resumeData={data}
            onConfirm={mockOnConfirm}
            onAddAnother={mockOnAddAnother}
            onEdit={mockOnEdit}
          />
        );

        expect(screen.queryByText(/Add Another/)).not.toBeInTheDocument();
      });
    });
  });
});
