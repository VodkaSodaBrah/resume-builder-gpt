import { describe, it, expect } from 'vitest';
import { shouldSkipQuestion } from '../src/lib/answerParser';
import { transformFieldPath } from '../src/lib/questions';

/**
 * Tests for the shouldSkipQuestion function with multi-entry field paths.
 *
 * Bug fix: When checking whether to skip a question for entry N (N > 0),
 * the field path must be transformed to use the correct index. Otherwise,
 * the raw path (e.g., workExperience[0].jobTitle) still has data from entry 0,
 * causing entry 1+ questions to be incorrectly skipped.
 */
describe('shouldSkipQuestion with multi-entry field paths', () => {
  const resumeDataWithOneWorkEntry = {
    workExperience: [
      {
        companyName: 'Acme Corp',
        jobTitle: 'Senior Developer',
        location: 'Austin, TX',
        startDate: 'January 2021',
        isCurrentJob: true,
        responsibilities: 'Led development',
      },
    ],
  };

  it('should NOT skip entry 1 jobTitle when only entry 0 has data (transformed path)', () => {
    // Transform the path for entry index 1
    const transformedField = transformFieldPath('workExperience[0].jobTitle', 'work', 1);
    expect(transformedField).toBe('workExperience[1].jobTitle');

    const result = shouldSkipQuestion(
      transformedField,
      [],
      resumeDataWithOneWorkEntry as Record<string, unknown>,
    );
    expect(result).toBe(false);
  });

  it('WOULD incorrectly skip entry 1 jobTitle when using raw path (the bug)', () => {
    // Using the raw, untransformed path - this demonstrates the bug
    const rawField = 'workExperience[0].jobTitle';
    const result = shouldSkipQuestion(
      rawField,
      [],
      resumeDataWithOneWorkEntry as Record<string, unknown>,
    );
    // With the raw path, entry 0 already has 'Senior Developer', so it returns true
    expect(result).toBe(true);
  });

  it('should NOT skip entry 1 location when only entry 0 has data', () => {
    const transformedField = transformFieldPath('workExperience[0].location', 'work', 1);
    const result = shouldSkipQuestion(
      transformedField,
      [],
      resumeDataWithOneWorkEntry as Record<string, unknown>,
    );
    expect(result).toBe(false);
  });

  it('should NOT skip entry 1 startDate when only entry 0 has data', () => {
    const transformedField = transformFieldPath('workExperience[0].startDate', 'work', 1);
    const result = shouldSkipQuestion(
      transformedField,
      [],
      resumeDataWithOneWorkEntry as Record<string, unknown>,
    );
    expect(result).toBe(false);
  });

  it('should skip when field name is in fieldsToSkip list', () => {
    const transformedField = transformFieldPath('workExperience[0].jobTitle', 'work', 1);
    const result = shouldSkipQuestion(
      transformedField,
      ['jobTitle'],
      resumeDataWithOneWorkEntry as Record<string, unknown>,
    );
    expect(result).toBe(true);
  });

  it('should skip entry 0 jobTitle when it already has data', () => {
    const result = shouldSkipQuestion(
      'workExperience[0].jobTitle',
      [],
      resumeDataWithOneWorkEntry as Record<string, unknown>,
    );
    expect(result).toBe(true);
  });

  it('should work correctly for education multi-entry', () => {
    const resumeData = {
      education: [
        { schoolName: 'UT Austin', degree: 'BS', fieldOfStudy: 'CS' },
      ],
    };

    // Entry 1 should NOT be skipped
    const transformedField = transformFieldPath('education[0].schoolName', 'education', 1);
    expect(transformedField).toBe('education[1].schoolName');

    const result = shouldSkipQuestion(
      transformedField,
      [],
      resumeData as Record<string, unknown>,
    );
    expect(result).toBe(false);
  });

  it('should work correctly for references multi-entry', () => {
    const resumeData = {
      references: [
        { name: 'Bob Manager', jobTitle: 'Director' },
      ],
    };

    const transformedField = transformFieldPath('references[0].name', 'references', 1);
    expect(transformedField).toBe('references[1].name');

    const result = shouldSkipQuestion(
      transformedField,
      [],
      resumeData as Record<string, unknown>,
    );
    expect(result).toBe(false);
  });
});
