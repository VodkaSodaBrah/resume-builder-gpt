/**
 * Comprehensive Question Flow Tests
 * Tests all branching logic and input combinations for the resume builder
 */

import { describe, it, expect } from 'vitest';
import { questions } from '@/lib/questions';
import type { ResumeData } from '@/types';
import {
  minimalResumeData,
  fullResumeData,
  currentJobResumeData,
  studentResumeData,
  referencesUponRequestData,
  noReferencesData,
  workEducationOnlyData,
  allSkillsYesData,
  allSkillsNoData,
  mixedSkillsData,
} from './fixtures/resumeData.fixtures';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a question by its ID
 */
const findQuestion = (id: string) => questions.find(q => q.id === id);

/**
 * Check if a question should be skipped based on resume data
 */
const shouldSkip = (questionId: string, data: Partial<ResumeData>): boolean => {
  const question = findQuestion(questionId);
  if (!question?.skipCondition) return false;
  return question.skipCondition(data as ResumeData);
};

/**
 * Get all questions that would be asked given the resume data
 * (i.e., questions that are not skipped)
 */
const getAskedQuestions = (data: Partial<ResumeData>) => {
  return questions.filter(q => !q.skipCondition || !q.skipCondition(data as ResumeData));
};

/**
 * Get questions for a specific category
 */
const getQuestionsInCategory = (category: string) => {
  return questions.filter(q => q.category === category);
};

/**
 * Get the index of a question by ID
 */
const getQuestionIndex = (id: string): number => {
  return questions.findIndex(q => q.id === id);
};

// ============================================================================
// Work Experience Section Tests
// ============================================================================

describe('Work Experience Branching', () => {
  describe('when hasWorkExperience is false', () => {
    const data = { hasWorkExperience: false };

    it('skips company name question', () => {
      expect(shouldSkip('work_company_1', data)).toBe(true);
    });

    it('skips job title question', () => {
      expect(shouldSkip('work_title_1', data)).toBe(true);
    });

    it('skips location question', () => {
      expect(shouldSkip('work_location_1', data)).toBe(true);
    });

    it('skips start date question', () => {
      expect(shouldSkip('work_start_1', data)).toBe(true);
    });

    it('skips current job question', () => {
      expect(shouldSkip('work_current_1', data)).toBe(true);
    });

    it('skips end date question', () => {
      expect(shouldSkip('work_end_1', data)).toBe(true);
    });

    it('skips responsibilities question', () => {
      expect(shouldSkip('work_responsibilities_1', data)).toBe(true);
    });

    it('skips add more work question', () => {
      expect(shouldSkip('work_add_more', data)).toBe(true);
    });
  });

  describe('when hasWorkExperience is true', () => {
    const data = { hasWorkExperience: true };

    it('asks company name question', () => {
      expect(shouldSkip('work_company_1', data)).toBe(false);
    });

    it('asks job title question', () => {
      expect(shouldSkip('work_title_1', data)).toBe(false);
    });

    it('asks responsibilities question', () => {
      expect(shouldSkip('work_responsibilities_1', data)).toBe(false);
    });
  });

  describe('current job logic', () => {
    it('skips end date when isCurrentJob is true', () => {
      const data = {
        hasWorkExperience: true,
        workExperience: [{ isCurrentJob: true }],
      };
      expect(shouldSkip('work_end_1', data)).toBe(true);
    });

    it('asks end date when isCurrentJob is false', () => {
      const data = {
        hasWorkExperience: true,
        workExperience: [{ isCurrentJob: false }],
      };
      expect(shouldSkip('work_end_1', data)).toBe(false);
    });

    it('asks end date when workExperience array is empty', () => {
      const data = {
        hasWorkExperience: true,
        workExperience: [],
      };
      expect(shouldSkip('work_end_1', data)).toBe(false);
    });
  });
});

// ============================================================================
// Education Section Tests
// ============================================================================

describe('Education Branching', () => {
  describe('currently studying logic', () => {
    it('skips end year when isCurrentlyStudying is true', () => {
      const data = {
        education: [{ isCurrentlyStudying: true }],
      };
      expect(shouldSkip('education_end', data)).toBe(true);
    });

    it('asks end year when isCurrentlyStudying is false', () => {
      const data = {
        education: [{ isCurrentlyStudying: false }],
      };
      expect(shouldSkip('education_end', data)).toBe(false);
    });

    it('asks end year when education array is empty', () => {
      const data = { education: [] };
      expect(shouldSkip('education_end', data)).toBe(false);
    });
  });

  describe('education questions exist', () => {
    it('has school name question', () => {
      expect(findQuestion('education_school')).toBeDefined();
    });

    it('has degree question', () => {
      expect(findQuestion('education_degree')).toBeDefined();
    });

    it('has field of study question', () => {
      expect(findQuestion('education_field')).toBeDefined();
    });

    it('has currently studying question', () => {
      expect(findQuestion('education_current')).toBeDefined();
    });
  });
});

// ============================================================================
// Volunteering Section Tests
// ============================================================================

describe('Volunteering Branching', () => {
  describe('when hasVolunteering is false', () => {
    const data = { hasVolunteering: false };

    it('skips organization question', () => {
      expect(shouldSkip('volunteering_org', data)).toBe(true);
    });

    it('skips role question', () => {
      expect(shouldSkip('volunteering_role', data)).toBe(true);
    });

    it('skips dates question', () => {
      expect(shouldSkip('volunteering_dates', data)).toBe(true);
    });

    it('skips responsibilities question', () => {
      expect(shouldSkip('volunteering_responsibilities', data)).toBe(true);
    });
  });

  describe('when hasVolunteering is true', () => {
    const data = { hasVolunteering: true };

    it('asks organization question', () => {
      expect(shouldSkip('volunteering_org', data)).toBe(false);
    });

    it('asks role question', () => {
      expect(shouldSkip('volunteering_role', data)).toBe(false);
    });

    it('asks dates question', () => {
      expect(shouldSkip('volunteering_dates', data)).toBe(false);
    });

    it('asks responsibilities question', () => {
      expect(shouldSkip('volunteering_responsibilities', data)).toBe(false);
    });
  });
});

// ============================================================================
// Skills Section Tests
// ============================================================================

describe('Skills Branching', () => {
  describe('technical skills gate', () => {
    it('skips technical skills detail when hasTechnicalSkills is false', () => {
      const data = { hasTechnicalSkills: false };
      expect(shouldSkip('skills_technical', data)).toBe(true);
    });

    it('asks technical skills detail when hasTechnicalSkills is true', () => {
      const data = { hasTechnicalSkills: true };
      expect(shouldSkip('skills_technical', data)).toBe(false);
    });

    it('has gate question for technical skills', () => {
      const gateQuestion = findQuestion('skills_has_technical');
      expect(gateQuestion).toBeDefined();
      expect(gateQuestion?.inputType).toBe('confirm');
    });
  });

  describe('certifications gate', () => {
    it('skips certifications detail when hasCertifications is false', () => {
      const data = { hasCertifications: false };
      expect(shouldSkip('skills_certifications', data)).toBe(true);
    });

    it('asks certifications detail when hasCertifications is true', () => {
      const data = { hasCertifications: true };
      expect(shouldSkip('skills_certifications', data)).toBe(false);
    });

    it('has gate question for certifications', () => {
      const gateQuestion = findQuestion('skills_has_certifications');
      expect(gateQuestion).toBeDefined();
      expect(gateQuestion?.inputType).toBe('confirm');
    });
  });

  describe('languages gate', () => {
    it('skips languages detail when hasLanguages is false', () => {
      const data = { hasLanguages: false };
      expect(shouldSkip('skills_languages', data)).toBe(true);
    });

    it('asks languages detail when hasLanguages is true', () => {
      const data = { hasLanguages: true };
      expect(shouldSkip('skills_languages', data)).toBe(false);
    });

    it('has gate question for languages', () => {
      const gateQuestion = findQuestion('skills_has_languages');
      expect(gateQuestion).toBeDefined();
      expect(gateQuestion?.inputType).toBe('confirm');
    });
  });

  describe('soft skills gate', () => {
    it('skips soft skills detail when hasSoftSkills is false', () => {
      const data = { hasSoftSkills: false };
      expect(shouldSkip('skills_soft', data)).toBe(true);
    });

    it('asks soft skills detail when hasSoftSkills is true', () => {
      const data = { hasSoftSkills: true };
      expect(shouldSkip('skills_soft', data)).toBe(false);
    });

    it('has gate question for soft skills', () => {
      const gateQuestion = findQuestion('skills_has_soft');
      expect(gateQuestion).toBeDefined();
      expect(gateQuestion?.inputType).toBe('confirm');
    });
  });

  describe('all skills combinations', () => {
    it('skips all detail questions when all gates are false', () => {
      expect(shouldSkip('skills_technical', allSkillsNoData)).toBe(true);
      expect(shouldSkip('skills_certifications', allSkillsNoData)).toBe(true);
      expect(shouldSkip('skills_languages', allSkillsNoData)).toBe(true);
      expect(shouldSkip('skills_soft', allSkillsNoData)).toBe(true);
    });

    it('asks all detail questions when all gates are true', () => {
      expect(shouldSkip('skills_technical', allSkillsYesData)).toBe(false);
      expect(shouldSkip('skills_certifications', allSkillsYesData)).toBe(false);
      expect(shouldSkip('skills_languages', allSkillsYesData)).toBe(false);
      expect(shouldSkip('skills_soft', allSkillsYesData)).toBe(false);
    });

    it('handles mixed skills correctly', () => {
      expect(shouldSkip('skills_technical', mixedSkillsData)).toBe(false);
      expect(shouldSkip('skills_certifications', mixedSkillsData)).toBe(true);
      expect(shouldSkip('skills_languages', mixedSkillsData)).toBe(false);
      expect(shouldSkip('skills_soft', mixedSkillsData)).toBe(true);
    });
  });
});

// ============================================================================
// References Section Tests
// ============================================================================

describe('References Branching', () => {
  describe('when hasReferences is false', () => {
    it('skips references upon request question', () => {
      expect(shouldSkip('references_note', noReferencesData)).toBe(true);
    });

    it('skips reference name question', () => {
      expect(shouldSkip('reference_name', noReferencesData)).toBe(true);
    });

    it('skips reference title question', () => {
      expect(shouldSkip('reference_title', noReferencesData)).toBe(true);
    });

    it('skips reference company question', () => {
      expect(shouldSkip('reference_company', noReferencesData)).toBe(true);
    });

    it('skips reference contact question', () => {
      expect(shouldSkip('reference_contact', noReferencesData)).toBe(true);
    });

    it('skips reference relationship question', () => {
      expect(shouldSkip('reference_relationship', noReferencesData)).toBe(true);
    });
  });

  describe('when hasReferences is true and referencesUponRequest is true', () => {
    it('asks references upon request question', () => {
      expect(shouldSkip('references_note', referencesUponRequestData)).toBe(false);
    });

    it('skips all reference detail questions', () => {
      expect(shouldSkip('reference_name', referencesUponRequestData)).toBe(true);
      expect(shouldSkip('reference_title', referencesUponRequestData)).toBe(true);
      expect(shouldSkip('reference_company', referencesUponRequestData)).toBe(true);
      expect(shouldSkip('reference_contact', referencesUponRequestData)).toBe(true);
      expect(shouldSkip('reference_relationship', referencesUponRequestData)).toBe(true);
    });
  });

  describe('when hasReferences is true and referencesUponRequest is false', () => {
    const data = { hasReferences: true, referencesUponRequest: false };

    it('asks all reference detail questions', () => {
      expect(shouldSkip('reference_name', data)).toBe(false);
      expect(shouldSkip('reference_title', data)).toBe(false);
      expect(shouldSkip('reference_company', data)).toBe(false);
      expect(shouldSkip('reference_contact', data)).toBe(false);
      expect(shouldSkip('reference_relationship', data)).toBe(false);
    });
  });
});

// ============================================================================
// Complete Flow Path Tests
// ============================================================================

describe('Complete Flow Paths', () => {
  describe('all-no path (minimal resume)', () => {
    it('skips the maximum number of questions', () => {
      const askedQuestions = getAskedQuestions(minimalResumeData);
      // Should only ask: language, intro, personal info (5), education (6),
      // gate questions for work/volunteering/skills/references, review (2)
      // Approximately 20-25 questions for minimal path
      expect(askedQuestions.length).toBeLessThan(30);
    });

    it('does not include any work detail questions', () => {
      const askedQuestions = getAskedQuestions(minimalResumeData);
      const workDetailIds = ['work_company_1', 'work_title_1', 'work_responsibilities_1'];
      workDetailIds.forEach(id => {
        expect(askedQuestions.find(q => q.id === id)).toBeUndefined();
      });
    });

    it('does not include any volunteering detail questions', () => {
      const askedQuestions = getAskedQuestions(minimalResumeData);
      const volunteerDetailIds = ['volunteering_org', 'volunteering_role'];
      volunteerDetailIds.forEach(id => {
        expect(askedQuestions.find(q => q.id === id)).toBeUndefined();
      });
    });

    it('does not include any skill detail questions', () => {
      const askedQuestions = getAskedQuestions(minimalResumeData);
      const skillDetailIds = ['skills_technical', 'skills_certifications', 'skills_languages', 'skills_soft'];
      skillDetailIds.forEach(id => {
        expect(askedQuestions.find(q => q.id === id)).toBeUndefined();
      });
    });
  });

  describe('all-yes path (full resume)', () => {
    it('asks significantly more questions than minimal path', () => {
      const fullAskedQuestions = getAskedQuestions(fullResumeData);
      const minAskedQuestions = getAskedQuestions(minimalResumeData);

      expect(fullAskedQuestions.length).toBeGreaterThan(minAskedQuestions.length);
    });

    it('includes work detail questions', () => {
      const askedQuestions = getAskedQuestions(fullResumeData);
      expect(askedQuestions.find(q => q.id === 'work_company_1')).toBeDefined();
      expect(askedQuestions.find(q => q.id === 'work_title_1')).toBeDefined();
    });

    it('includes volunteering detail questions', () => {
      const askedQuestions = getAskedQuestions(fullResumeData);
      expect(askedQuestions.find(q => q.id === 'volunteering_org')).toBeDefined();
    });

    it('includes skill detail questions', () => {
      const askedQuestions = getAskedQuestions(fullResumeData);
      expect(askedQuestions.find(q => q.id === 'skills_technical')).toBeDefined();
      expect(askedQuestions.find(q => q.id === 'skills_certifications')).toBeDefined();
    });

    it('includes reference detail questions', () => {
      const askedQuestions = getAskedQuestions(fullResumeData);
      expect(askedQuestions.find(q => q.id === 'reference_name')).toBeDefined();
    });
  });

  describe('current job path', () => {
    it('skips end date question', () => {
      expect(shouldSkip('work_end_1', currentJobResumeData)).toBe(true);
    });

    it('asks all other work questions', () => {
      expect(shouldSkip('work_company_1', currentJobResumeData)).toBe(false);
      expect(shouldSkip('work_title_1', currentJobResumeData)).toBe(false);
      expect(shouldSkip('work_responsibilities_1', currentJobResumeData)).toBe(false);
    });
  });

  describe('student path', () => {
    it('skips end year for currently studying', () => {
      expect(shouldSkip('education_end', studentResumeData)).toBe(true);
    });

    it('skips work questions', () => {
      expect(shouldSkip('work_company_1', studentResumeData)).toBe(true);
    });

    it('asks volunteering questions', () => {
      expect(shouldSkip('volunteering_org', studentResumeData)).toBe(false);
    });
  });

  describe('work + education only path', () => {
    it('skips volunteering detail questions', () => {
      expect(shouldSkip('volunteering_org', workEducationOnlyData)).toBe(true);
    });

    it('asks work questions', () => {
      expect(shouldSkip('work_company_1', workEducationOnlyData)).toBe(false);
    });

    it('handles mixed skills correctly', () => {
      expect(shouldSkip('skills_technical', workEducationOnlyData)).toBe(false);
      expect(shouldSkip('skills_certifications', workEducationOnlyData)).toBe(true);
      expect(shouldSkip('skills_soft', workEducationOnlyData)).toBe(false);
    });

    it('skips reference questions', () => {
      expect(shouldSkip('reference_name', workEducationOnlyData)).toBe(true);
    });
  });
});

// ============================================================================
// Question Structure Tests
// ============================================================================

describe('Question Structure Validation', () => {
  describe('all questions have required fields', () => {
    it('every question has an id', () => {
      questions.forEach(q => {
        expect(q.id).toBeDefined();
        expect(q.id.length).toBeGreaterThan(0);
      });
    });

    it('every question has a category', () => {
      questions.forEach(q => {
        expect(q.category).toBeDefined();
      });
    });

    it('every question has a question text', () => {
      questions.forEach(q => {
        expect(q.question).toBeDefined();
        expect(q.question.length).toBeGreaterThan(0);
      });
    });

    it('every question has a field', () => {
      questions.forEach(q => {
        expect(q.field).toBeDefined();
      });
    });

    it('every question has an inputType', () => {
      questions.forEach(q => {
        expect(q.inputType).toBeDefined();
      });
    });
  });

  describe('question ordering', () => {
    it('language question comes first', () => {
      expect(questions[0].id).toBe('language_select');
    });

    it('intro question comes after language', () => {
      const introIndex = getQuestionIndex('intro_welcome');
      const langIndex = getQuestionIndex('language_select');
      expect(introIndex).toBeGreaterThan(langIndex);
    });

    it('personal info comes before work experience', () => {
      const personalIndex = getQuestionIndex('personal_name');
      const workIndex = getQuestionIndex('work_has_experience');
      expect(personalIndex).toBeLessThan(workIndex);
    });

    it('review comes near the end', () => {
      const reviewIndex = getQuestionIndex('review_template');
      expect(reviewIndex).toBeGreaterThan(questions.length - 5);
    });
  });

  describe('category grouping', () => {
    it('has expected categories', () => {
      const categories = [...new Set(questions.map(q => q.category))];
      expect(categories).toContain('personal');
      expect(categories).toContain('work');
      expect(categories).toContain('education');
      expect(categories).toContain('volunteering');
      expect(categories).toContain('skills');
      expect(categories).toContain('references');
      expect(categories).toContain('review');
    });

    it('questions within a category are grouped together', () => {
      const workQuestions = getQuestionsInCategory('work');
      const firstWorkIndex = getQuestionIndex(workQuestions[0].id);
      const lastWorkIndex = getQuestionIndex(workQuestions[workQuestions.length - 1].id);

      // All work questions should be between first and last
      workQuestions.forEach(q => {
        const index = getQuestionIndex(q.id);
        expect(index).toBeGreaterThanOrEqual(firstWorkIndex);
        expect(index).toBeLessThanOrEqual(lastWorkIndex);
      });
    });
  });
});

// ============================================================================
// Gate Question Pattern Tests
// ============================================================================

describe('Gate Question Pattern', () => {
  const gateQuestions = [
    { gate: 'work_has_experience', field: 'hasWorkExperience' },
    { gate: 'volunteering_has', field: 'hasVolunteering' },
    { gate: 'skills_has_technical', field: 'hasTechnicalSkills' },
    { gate: 'skills_has_certifications', field: 'hasCertifications' },
    { gate: 'skills_has_languages', field: 'hasLanguages' },
    { gate: 'skills_has_soft', field: 'hasSoftSkills' },
    { gate: 'references_has', field: 'hasReferences' },
  ];

  gateQuestions.forEach(({ gate, field }) => {
    describe(`${gate}`, () => {
      it('exists and is a confirm type', () => {
        const question = findQuestion(gate);
        expect(question).toBeDefined();
        expect(question?.inputType).toBe('confirm');
      });

      it(`maps to field ${field}`, () => {
        const question = findQuestion(gate);
        expect(question?.field).toBe(field);
      });

      it('is marked as required', () => {
        const question = findQuestion(gate);
        expect(question?.isRequired).toBe(true);
      });
    });
  });
});

// ============================================================================
// Skip Condition Tests
// ============================================================================

describe('Skip Condition Edge Cases', () => {
  it('handles undefined resume data gracefully', () => {
    const data = {};
    // These should not throw errors
    expect(() => shouldSkip('work_company_1', data)).not.toThrow();
    expect(() => shouldSkip('skills_technical', data)).not.toThrow();
  });

  it('handles null values in arrays', () => {
    const data = {
      hasWorkExperience: true,
      workExperience: [null as unknown],
    };
    // Should not throw
    expect(() => shouldSkip('work_end_1', data)).not.toThrow();
  });

  it('handles empty arrays', () => {
    const data = {
      hasWorkExperience: true,
      workExperience: [],
    };
    // Should default to asking the question
    expect(shouldSkip('work_end_1', data)).toBe(false);
  });

  it('handles undefined nested properties', () => {
    const data = {
      hasWorkExperience: true,
      // workExperience is undefined
    };
    expect(() => shouldSkip('work_end_1', data)).not.toThrow();
  });
});
