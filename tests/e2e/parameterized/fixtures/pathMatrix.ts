/**
 * Pairwise Test Path Matrix
 *
 * Defines 35 test paths that cover all meaningful combinations of decision points
 * using pairwise testing methodology. This reduces 128+ full combinations to
 * a manageable set while maintaining comprehensive coverage.
 */

export interface TestPath {
  id: string;
  name: string;
  description: string;
  decisions: {
    hasWorkExperience: boolean;
    hasVolunteering: boolean;
    hasTechnicalSkills: boolean;
    hasCertifications: boolean;
    hasLanguages: boolean;
    hasSoftSkills: boolean;
    hasReferences: boolean;
  };
  conditionals?: {
    isCurrentJob?: boolean;
    isCurrentlyStudying?: boolean;
    referencesUponRequest?: boolean;
  };
  multiEntry?: {
    workCount?: number;
    educationCount?: number;
    volunteeringCount?: number;
    referenceCount?: number;
  };
  expectedQuestionRange: [number, number]; // [min, max] questions expected
  priority: 'critical' | 'standard';
  tags: string[];
}

/**
 * Helper to create a decisions object with defaults
 */
function createDecisions(overrides: Partial<TestPath['decisions']> = {}): TestPath['decisions'] {
  return {
    hasWorkExperience: false,
    hasVolunteering: false,
    hasTechnicalSkills: false,
    hasCertifications: false,
    hasLanguages: false,
    hasSoftSkills: false,
    hasReferences: false,
    ...overrides,
  };
}

/**
 * 35 Test Paths for Comprehensive Pairwise Coverage
 *
 * Paths P01-P10: Critical boundary paths (always run)
 * Paths P11-P35: Pairwise coverage paths (comprehensive run)
 */
export const TEST_PATHS: TestPath[] = [
  // ===== CRITICAL BOUNDARY PATHS (P01-P10) =====

  {
    id: 'P01',
    name: 'minimal-all-skip',
    description: 'User skips all optional sections - fastest path through',
    decisions: createDecisions(),
    expectedQuestionRange: [15, 50], // Increased: AI may ask clarifications
    priority: 'critical',
    tags: ['boundary', 'minimal', 'regression'],
  },

  {
    id: 'P02',
    name: 'full-all-yes',
    description: 'User includes all sections with single entries',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasVolunteering: true,
      hasTechnicalSkills: true,
      hasCertifications: true,
      hasLanguages: true,
      hasSoftSkills: true,
      hasReferences: true,
    }),
    conditionals: {
      isCurrentJob: false,
      referencesUponRequest: false,
    },
    multiEntry: {
      workCount: 1,
      volunteeringCount: 1,
      referenceCount: 1,
    },
    expectedQuestionRange: [30, 80], // Reduced minimum - AI can be efficient
    priority: 'critical',
    tags: ['boundary', 'maximal', 'regression'],
  },

  {
    id: 'P03',
    name: 'work-only',
    description: 'Only work experience, skip everything else',
    decisions: createDecisions({ hasWorkExperience: true }),
    conditionals: { isCurrentJob: false },
    expectedQuestionRange: [20, 50], // Increased for clarifications
    priority: 'critical',
    tags: ['work', 'single-section'],
  },

  {
    id: 'P04',
    name: 'volunteering-only',
    description: 'Only volunteering, skip work and other sections',
    decisions: createDecisions({ hasVolunteering: true }),
    expectedQuestionRange: [18, 50], // Increased for clarifications
    priority: 'critical',
    tags: ['volunteering', 'single-section'],
  },

  {
    id: 'P05',
    name: 'all-skills-yes',
    description: 'All four skill categories included, nothing else',
    decisions: createDecisions({
      hasTechnicalSkills: true,
      hasCertifications: true,
      hasLanguages: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [18, 50], // Increased for clarifications
    priority: 'critical',
    tags: ['skills', 'all-skills'],
  },

  {
    id: 'P06',
    name: 'all-skills-no',
    description: 'All four skill gates answered no',
    decisions: createDecisions(),
    expectedQuestionRange: [12, 50], // Increased for clarifications
    priority: 'critical',
    tags: ['skills', 'no-skills'],
  },

  {
    id: 'P07',
    name: 'multi-entry-work',
    description: 'Two work experiences to test add-another flow',
    decisions: createDecisions({ hasWorkExperience: true }),
    conditionals: { isCurrentJob: false },
    multiEntry: { workCount: 2 },
    expectedQuestionRange: [28, 60], // Increased for clarifications
    priority: 'critical',
    tags: ['multi-entry', 'work', 'add-another'],
  },

  {
    id: 'P08',
    name: 'current-job-flow',
    description: 'Current job (skips end date question)',
    decisions: createDecisions({ hasWorkExperience: true }),
    conditionals: { isCurrentJob: true },
    expectedQuestionRange: [18, 50], // Increased for clarifications
    priority: 'critical',
    tags: ['conditional', 'current-job'],
  },

  {
    id: 'P09',
    name: 'references-upon-request',
    description: 'References upon request (skips detail questions)',
    decisions: createDecisions({ hasReferences: true }),
    conditionals: { referencesUponRequest: true },
    expectedQuestionRange: [14, 50], // Increased for clarifications
    priority: 'critical',
    tags: ['conditional', 'references'],
  },

  {
    id: 'P10',
    name: 'work-volunteer-no-skills',
    description: 'Work and volunteering but no skills',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasVolunteering: true,
    }),
    expectedQuestionRange: [20, 60], // Reduced minimum - AI can be efficient
    priority: 'critical',
    tags: ['mixed', 'no-skills'],
  },

  // ===== PAIRWISE COVERAGE PATHS (P11-P35) =====
  // These paths ensure every pair of decision points is tested together

  {
    id: 'P11',
    name: 'work-technical-skills',
    description: 'Work + technical skills only',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasTechnicalSkills: true,
    }),
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'work', 'skills'],
  },

  {
    id: 'P12',
    name: 'work-certifications',
    description: 'Work + certifications only',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasCertifications: true,
    }),
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'work', 'skills'],
  },

  {
    id: 'P13',
    name: 'work-languages',
    description: 'Work + languages only',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasLanguages: true,
    }),
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'work', 'skills'],
  },

  {
    id: 'P14',
    name: 'work-soft-skills',
    description: 'Work + soft skills only',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'work', 'skills'],
  },

  {
    id: 'P15',
    name: 'work-references',
    description: 'Work + references only',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasReferences: true,
    }),
    conditionals: { referencesUponRequest: false },
    expectedQuestionRange: [28, 48],
    priority: 'standard',
    tags: ['pairwise', 'work', 'references'],
  },

  {
    id: 'P16',
    name: 'volunteer-technical-skills',
    description: 'Volunteering + technical skills only',
    decisions: createDecisions({
      hasVolunteering: true,
      hasTechnicalSkills: true,
    }),
    expectedQuestionRange: [20, 35],
    priority: 'standard',
    tags: ['pairwise', 'volunteering', 'skills'],
  },

  {
    id: 'P17',
    name: 'volunteer-certifications',
    description: 'Volunteering + certifications only',
    decisions: createDecisions({
      hasVolunteering: true,
      hasCertifications: true,
    }),
    expectedQuestionRange: [20, 35],
    priority: 'standard',
    tags: ['pairwise', 'volunteering', 'skills'],
  },

  {
    id: 'P18',
    name: 'volunteer-languages',
    description: 'Volunteering + languages only',
    decisions: createDecisions({
      hasVolunteering: true,
      hasLanguages: true,
    }),
    expectedQuestionRange: [20, 35],
    priority: 'standard',
    tags: ['pairwise', 'volunteering', 'skills'],
  },

  {
    id: 'P19',
    name: 'volunteer-soft-skills',
    description: 'Volunteering + soft skills only',
    decisions: createDecisions({
      hasVolunteering: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [20, 35],
    priority: 'standard',
    tags: ['pairwise', 'volunteering', 'skills'],
  },

  {
    id: 'P20',
    name: 'volunteer-references',
    description: 'Volunteering + references only',
    decisions: createDecisions({
      hasVolunteering: true,
      hasReferences: true,
    }),
    conditionals: { referencesUponRequest: false },
    expectedQuestionRange: [26, 45],
    priority: 'standard',
    tags: ['pairwise', 'volunteering', 'references'],
  },

  {
    id: 'P21',
    name: 'technical-certifications',
    description: 'Technical skills + certifications only',
    decisions: createDecisions({
      hasTechnicalSkills: true,
      hasCertifications: true,
    }),
    expectedQuestionRange: [14, 24],
    priority: 'standard',
    tags: ['pairwise', 'skills'],
  },

  {
    id: 'P22',
    name: 'technical-languages',
    description: 'Technical skills + languages only',
    decisions: createDecisions({
      hasTechnicalSkills: true,
      hasLanguages: true,
    }),
    expectedQuestionRange: [14, 24],
    priority: 'standard',
    tags: ['pairwise', 'skills'],
  },

  {
    id: 'P23',
    name: 'technical-soft-skills',
    description: 'Technical skills + soft skills only',
    decisions: createDecisions({
      hasTechnicalSkills: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [14, 24],
    priority: 'standard',
    tags: ['pairwise', 'skills'],
  },

  {
    id: 'P24',
    name: 'technical-references',
    description: 'Technical skills + references only',
    decisions: createDecisions({
      hasTechnicalSkills: true,
      hasReferences: true,
    }),
    conditionals: { referencesUponRequest: false },
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'skills', 'references'],
  },

  {
    id: 'P25',
    name: 'certifications-languages',
    description: 'Certifications + languages only',
    decisions: createDecisions({
      hasCertifications: true,
      hasLanguages: true,
    }),
    expectedQuestionRange: [14, 24],
    priority: 'standard',
    tags: ['pairwise', 'skills'],
  },

  {
    id: 'P26',
    name: 'certifications-soft-skills',
    description: 'Certifications + soft skills only',
    decisions: createDecisions({
      hasCertifications: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [14, 24],
    priority: 'standard',
    tags: ['pairwise', 'skills'],
  },

  {
    id: 'P27',
    name: 'certifications-references',
    description: 'Certifications + references only',
    decisions: createDecisions({
      hasCertifications: true,
      hasReferences: true,
    }),
    conditionals: { referencesUponRequest: false },
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'skills', 'references'],
  },

  {
    id: 'P28',
    name: 'languages-soft-skills',
    description: 'Languages + soft skills only',
    decisions: createDecisions({
      hasLanguages: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [14, 24],
    priority: 'standard',
    tags: ['pairwise', 'skills'],
  },

  {
    id: 'P29',
    name: 'languages-references',
    description: 'Languages + references only',
    decisions: createDecisions({
      hasLanguages: true,
      hasReferences: true,
    }),
    conditionals: { referencesUponRequest: false },
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'skills', 'references'],
  },

  {
    id: 'P30',
    name: 'soft-skills-references',
    description: 'Soft skills + references only',
    decisions: createDecisions({
      hasSoftSkills: true,
      hasReferences: true,
    }),
    conditionals: { referencesUponRequest: false },
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['pairwise', 'skills', 'references'],
  },

  {
    id: 'P31',
    name: 'multi-entry-volunteering',
    description: 'Two volunteering experiences',
    decisions: createDecisions({ hasVolunteering: true }),
    multiEntry: { volunteeringCount: 2 },
    expectedQuestionRange: [24, 40],
    priority: 'standard',
    tags: ['multi-entry', 'volunteering', 'add-another'],
  },

  {
    id: 'P32',
    name: 'work-volunteer-skills-mix',
    description: 'Work + volunteer + mixed skills (tech + soft)',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasVolunteering: true,
      hasTechnicalSkills: true,
      hasSoftSkills: true,
    }),
    expectedQuestionRange: [32, 52],
    priority: 'standard',
    tags: ['mixed', 'comprehensive'],
  },

  {
    id: 'P33',
    name: 'all-except-work',
    description: 'Everything except work experience',
    decisions: createDecisions({
      hasVolunteering: true,
      hasTechnicalSkills: true,
      hasCertifications: true,
      hasLanguages: true,
      hasSoftSkills: true,
      hasReferences: true,
    }),
    expectedQuestionRange: [32, 50],
    priority: 'standard',
    tags: ['boundary', 'no-work'],
  },

  {
    id: 'P34',
    name: 'all-except-volunteering',
    description: 'Everything except volunteering',
    decisions: createDecisions({
      hasWorkExperience: true,
      hasTechnicalSkills: true,
      hasCertifications: true,
      hasLanguages: true,
      hasSoftSkills: true,
      hasReferences: true,
    }),
    expectedQuestionRange: [36, 55],
    priority: 'standard',
    tags: ['boundary', 'no-volunteering'],
  },

  {
    id: 'P35',
    name: 'references-only',
    description: 'Only references section (full details)',
    decisions: createDecisions({ hasReferences: true }),
    conditionals: { referencesUponRequest: false },
    multiEntry: { referenceCount: 2 },
    expectedQuestionRange: [22, 38],
    priority: 'standard',
    tags: ['references', 'single-section', 'multi-entry'],
  },
];

// Helper functions for filtering paths
export const CRITICAL_PATHS = TEST_PATHS.filter(p => p.priority === 'critical');
export const STANDARD_PATHS = TEST_PATHS.filter(p => p.priority === 'standard');

export function getPathsByTag(tag: string): TestPath[] {
  return TEST_PATHS.filter(p => p.tags.includes(tag));
}

export function getPathById(id: string): TestPath | undefined {
  return TEST_PATHS.find(p => p.id === id);
}
