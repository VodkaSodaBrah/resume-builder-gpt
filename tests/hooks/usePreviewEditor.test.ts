/**
 * usePreviewEditor Hook Tests
 * Manages dual state updates: local resumeData state + conversationStore persistence
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePreviewEditor } from '@/hooks/usePreviewEditor';
import { useConversationStore } from '@/stores/conversationStore';
import type { ResumeData } from '@/types';

// Spy on the store's updateResumeData
const mockUpdateResumeData = vi.fn();

vi.mock('@/stores/conversationStore', () => ({
  useConversationStore: {
    getState: () => ({
      updateResumeData: mockUpdateResumeData,
    }),
  },
}));

const makeResumeData = (overrides: Partial<ResumeData> = {}): ResumeData => ({
  personalInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phone: '5551234567',
    city: 'Austin, TX',
  },
  workExperience: [
    {
      id: '1',
      companyName: 'Acme',
      jobTitle: 'Engineer',
      startDate: 'Jan 2020',
      endDate: 'Dec 2022',
      isCurrentJob: false,
      location: 'Austin, TX',
      responsibilities: 'Built things\nFixed bugs',
      enhancedResponsibilities: 'Engineered solutions\nResolved defects',
    },
  ],
  education: [
    {
      id: '1',
      schoolName: 'MIT',
      degree: 'BS',
      fieldOfStudy: 'CS',
      startYear: '2016',
      endYear: '2020',
      isCurrentlyStudying: false,
    },
  ],
  volunteering: [],
  skills: {
    technicalSkills: ['React', 'TypeScript'],
    softSkills: ['Leadership'],
    certifications: ['AWS'],
    languages: [{ language: 'English', proficiency: 'native' }],
  },
  references: [],
  templateStyle: 'modern',
  language: 'en',
  ...overrides,
});

describe('usePreviewEditor', () => {
  beforeEach(() => {
    mockUpdateResumeData.mockClear();
  });

  it('should initialize with provided resumeData', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    expect(result.current.resumeData.personalInfo.fullName).toBe('John Doe');
  });

  it('should update local state immediately on onFieldSave', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    act(() => {
      result.current.onFieldSave('personalInfo.fullName', 'Jane Smith');
    });

    expect(result.current.resumeData.personalInfo.fullName).toBe('Jane Smith');
  });

  it('should persist to conversation store on onFieldSave', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    act(() => {
      result.current.onFieldSave('personalInfo.email', 'jane@test.com');
    });

    expect(mockUpdateResumeData).toHaveBeenCalledWith('personalInfo.email', 'jane@test.com');
  });

  it('should handle nested array paths (work experience)', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    act(() => {
      result.current.onFieldSave('workExperience[0].jobTitle', 'Senior Engineer');
    });

    expect(result.current.resumeData.workExperience[0].jobTitle).toBe('Senior Engineer');
    expect(mockUpdateResumeData).toHaveBeenCalledWith('workExperience[0].jobTitle', 'Senior Engineer');
  });

  it('should handle skills array replacement', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    const newSkills = ['React', 'TypeScript', 'Node.js'];
    act(() => {
      result.current.onFieldSave('skills.technicalSkills', newSkills);
    });

    expect(result.current.resumeData.skills.technicalSkills).toEqual(newSkills);
    expect(mockUpdateResumeData).toHaveBeenCalledWith('skills.technicalSkills', newSkills);
  });

  it('should handle responsibilities string replacement', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    act(() => {
      result.current.onFieldSave(
        'workExperience[0].enhancedResponsibilities',
        'Led engineering team\nDelivered features'
      );
    });

    expect(result.current.resumeData.workExperience[0].enhancedResponsibilities)
      .toBe('Led engineering team\nDelivered features');
  });

  it('should handle languages array replacement', () => {
    const data = makeResumeData();
    const { result } = renderHook(() => usePreviewEditor(data));

    const newLangs = [
      { language: 'English', proficiency: 'native' as const },
      { language: 'Spanish', proficiency: 'conversational' as const },
    ];
    act(() => {
      result.current.onFieldSave('skills.languages', newLangs);
    });

    expect(result.current.resumeData.skills.languages).toEqual(newLangs);
  });

  it('should update when initialData changes (e.g. after AI enhancement)', () => {
    const data1 = makeResumeData();
    const { result, rerender } = renderHook(
      ({ data }) => usePreviewEditor(data),
      { initialProps: { data: data1 } }
    );

    const data2 = makeResumeData({
      personalInfo: { ...data1.personalInfo, fullName: 'Updated Name' },
    });
    rerender({ data: data2 });

    expect(result.current.resumeData.personalInfo.fullName).toBe('Updated Name');
  });
});
