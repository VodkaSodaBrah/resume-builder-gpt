/**
 * Preview Inline Edit Integration Tests
 * Verifies that inline editing works on the Preview page fields
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, screen, within } from '@testing-library/react';
import React from 'react';

// Mock dependencies before importing component
const mockNavigate = vi.fn();
const mockUseParams = vi.fn(() => ({}));
const mockUseLocation = vi.fn(() => ({ state: null }));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useParams: () => mockUseParams(),
  useLocation: () => mockUseLocation(),
}));

const mockTrackEvent = vi.fn();
vi.mock('@/stores/analyticsStore', () => ({
  useAnalyticsStore: () => ({ trackEvent: mockTrackEvent }),
  AnalyticsEvents: {
    AI_ENHANCEMENT_START: 'ai_enhancement_start',
    AI_ENHANCEMENT_COMPLETE: 'ai_enhancement_complete',
    AI_ENHANCEMENT_ERROR: 'ai_enhancement_error',
    DOWNLOAD_PDF: 'download_pdf',
    DOWNLOAD_DOCX: 'download_docx',
    TEMPLATE_SELECTED: 'template_selected',
  },
}));

const mockUpdateResumeData = vi.fn();
vi.mock('@/stores/conversationStore', () => ({
  useConversationStore: Object.assign(
    (selector: (state: unknown) => unknown) => {
      if (typeof selector === 'function') {
        return selector({ resumeData: {} });
      }
      return {};
    },
    {
      getState: () => ({
        updateResumeData: mockUpdateResumeData,
        resumeData: {},
      }),
    }
  ),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: { id: 'test-user' }, isLoaded: true }),
}));

vi.mock('@/lib/supabase', () => ({
  getResume: vi.fn(),
  supabase: {},
}));

vi.mock('@/lib/resumeGenerator', () => ({
  downloadPDF: vi.fn(),
  downloadDOCX: vi.fn(),
  expandDegreeAbbreviation: (d: string) => d,
}));

import { Preview } from '@/pages/Preview';
import type { ResumeData } from '@/types';

const makeResumeData = (): ResumeData => ({
  personalInfo: {
    fullName: 'Alice Johnson',
    email: 'alice@test.com',
    phone: '(555) 123-4567',
    city: 'San Francisco, CA',
  },
  workExperience: [
    {
      id: '1',
      companyName: 'TechCorp',
      jobTitle: 'Software Engineer',
      startDate: 'Jan 2020',
      endDate: 'Dec 2023',
      isCurrentJob: false,
      location: 'Remote',
      responsibilities: 'Built features\nFixed bugs',
      enhancedResponsibilities: 'Engineered key features\nResolved critical defects',
    },
  ],
  education: [
    {
      id: '1',
      schoolName: 'Stanford University',
      degree: 'BS',
      fieldOfStudy: 'Computer Science',
      startYear: '2016',
      endYear: '2020',
      isCurrentlyStudying: false,
    },
  ],
  volunteering: [
    {
      id: '1',
      organizationName: 'Code for All',
      role: 'Mentor',
      startDate: 'Jan 2021',
      endDate: 'Present',
      responsibilities: 'Mentored students',
    },
  ],
  skills: {
    technicalSkills: ['React', 'TypeScript'],
    softSkills: ['Leadership'],
    certifications: ['AWS Certified'],
    languages: [{ language: 'English', proficiency: 'native' }],
  },
  references: [
    {
      id: '1',
      name: 'Bob Smith',
      jobTitle: 'CTO',
      company: 'TechCorp',
      phone: '(555) 999-8888',
      email: 'bob@techcorp.com',
      relationship: 'Former Manager',
    },
  ],
  templateStyle: 'modern',
  language: 'en',
});

describe('Preview Inline Editing', () => {
  beforeEach(() => {
    mockUpdateResumeData.mockClear();
    mockNavigate.mockClear();
  });

  it('should render the name as an editable field', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    // Find the name heading in the resume preview area
    const previewArea = container.querySelector('.text-black');
    expect(previewArea).toBeTruthy();

    const nameEl = previewArea!.querySelector('h1');
    expect(nameEl).toBeTruthy();
    expect(nameEl!.textContent).toBe('Alice Johnson');
  });

  it('should allow editing the name on click', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const nameEl = previewArea!.querySelector('h1')!;
    fireEvent.click(nameEl);

    // Should now have an input
    const input = previewArea!.querySelector('input');
    expect(input).toBeTruthy();
    expect(input!.value).toBe('Alice Johnson');
  });

  it('should persist name edit to store on blur', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const nameEl = previewArea!.querySelector('h1')!;
    fireEvent.click(nameEl);

    const input = previewArea!.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'Alice B. Johnson' } });
    fireEvent.blur(input);

    expect(mockUpdateResumeData).toHaveBeenCalledWith(
      'personalInfo.fullName',
      'Alice B. Johnson'
    );
  });

  it('should render contact fields as editable spans', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    // Contact area spans should contain email, phone, city
    const spans = previewArea!.querySelectorAll('span');
    const spanTexts = Array.from(spans).map((s) => s.textContent);

    expect(spanTexts).toContain('alice@test.com');
    expect(spanTexts).toContain('(555) 123-4567');
    expect(spanTexts).toContain('San Francisco, CA');
  });

  it('should render work experience bullets as editable', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const listItems = previewArea!.querySelectorAll('li');

    // Work experience bullets (enhanced)
    const bulletTexts = Array.from(listItems).map((li) => li.textContent?.trim());
    expect(bulletTexts).toContain('Engineered key features');
    expect(bulletTexts).toContain('Resolved critical defects');
  });

  it('should allow editing a work experience bullet', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const listItems = previewArea!.querySelectorAll('li');

    // Find the first work experience bullet and click its editable span
    const firstBullet = listItems[0];
    const editableSpan = firstBullet.querySelector('span');
    expect(editableSpan).toBeTruthy();
    fireEvent.click(editableSpan!);

    const input = firstBullet.querySelector('input');
    expect(input).toBeTruthy();
    expect(input!.value).toBe('Engineered key features');
  });

  it('should persist bullet edit and reconstruct newline-delimited string', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const listItems = previewArea!.querySelectorAll('li');

    // Edit first bullet
    const firstBullet = listItems[0];
    fireEvent.click(firstBullet.querySelector('span')!);

    const input = firstBullet.querySelector('input')!;
    fireEvent.change(input, { target: { value: 'Led engineering initiatives' } });
    fireEvent.blur(input);

    // Should reconstruct the full responsibilities string with newlines
    expect(mockUpdateResumeData).toHaveBeenCalledWith(
      'workExperience[0].enhancedResponsibilities',
      'Led engineering initiatives\nResolved critical defects'
    );
  });

  it('should render skills as editable comma-separated strings', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    // Find a span containing the comma-separated skills
    const allSpans = previewArea!.querySelectorAll('span');
    const skillsSpan = Array.from(allSpans).find(
      (s) => s.textContent === 'React, TypeScript'
    );
    expect(skillsSpan).toBeTruthy();
  });

  it('should parse comma-separated skills on save', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const allSpans = previewArea!.querySelectorAll('span');
    const skillsSpan = Array.from(allSpans).find(
      (s) => s.textContent === 'React, TypeScript'
    );
    expect(skillsSpan).toBeTruthy();

    fireEvent.click(skillsSpan!);
    // After clicking, the span is replaced by an input in the same container
    // Query for the input that now contains our skills value
    const inputs = previewArea!.querySelectorAll('input');
    const skillsInput = Array.from(inputs).find(
      (inp) => inp.value === 'React, TypeScript'
    );
    expect(skillsInput).toBeTruthy();

    fireEvent.change(skillsInput!, {
      target: { value: 'React, TypeScript, Node.js' },
    });
    fireEvent.blur(skillsInput!);

    expect(mockUpdateResumeData).toHaveBeenCalledWith(
      'skills.technicalSkills',
      ['React', 'TypeScript', 'Node.js']
    );
  });

  it('should render education fields as editable', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const text = previewArea!.textContent;
    expect(text).toContain('Computer Science');
    expect(text).toContain('Stanford University');
  });

  it('should render references as editable', () => {
    mockUseLocation.mockReturnValue({
      state: { resumeData: makeResumeData() },
    });
    const { container } = render(<Preview />);

    const previewArea = container.querySelector('.text-black');
    const text = previewArea!.textContent;
    expect(text).toContain('Bob Smith');
    expect(text).toContain('Former Manager');
  });
});
