/**
 * Test Data Fixtures for Question Flow Tests
 * Provides consistent test data for various resume scenarios
 */

import type { ResumeData } from '@/types';

/**
 * Minimal resume data - user says "no" to all optional sections
 * Used to test the shortest possible flow path
 */
export const minimalResumeData: Partial<ResumeData> = {
  hasWorkExperience: false,
  hasVolunteering: false,
  hasTechnicalSkills: false,
  hasCertifications: false,
  hasLanguages: false,
  hasSoftSkills: false,
  hasReferences: false,
};

/**
 * Full resume data - user fills in everything
 * Used to test the longest possible flow path
 */
export const fullResumeData: Partial<ResumeData> = {
  personalInfo: {
    fullName: 'John Smith',
    email: 'john@example.com',
    phone: '555-123-4567',
    city: 'New York, NY',
    zipCode: '10001',
  },
  hasWorkExperience: true,
  workExperience: [{
    id: 'work-1',
    companyName: 'Test Company',
    jobTitle: 'Software Developer',
    location: 'Remote',
    startDate: 'January 2020',
    endDate: 'December 2023',
    isCurrentJob: false,
    responsibilities: 'Built web applications and APIs',
  }],
  education: [{
    id: 'edu-1',
    schoolName: 'Test University',
    degree: 'Bachelor of Science',
    fieldOfStudy: 'Computer Science',
    isCurrentlyStudying: false,
    startYear: '2016',
    endYear: '2020',
  }],
  hasVolunteering: true,
  volunteering: [{
    id: 'vol-1',
    organizationName: 'Local Food Bank',
    role: 'Distribution Volunteer',
    startDate: '2021',
    responsibilities: 'Helped distribute food to families',
  }],
  hasTechnicalSkills: true,
  hasCertifications: true,
  hasLanguages: true,
  hasSoftSkills: true,
  skills: {
    technicalSkills: ['JavaScript', 'Python', 'React'],
    certifications: ['AWS Certified Developer'],
    softSkills: ['Leadership', 'Communication'],
    languages: [{ language: 'Spanish', proficiency: 'conversational' }],
  },
  hasReferences: true,
  referencesUponRequest: false,
  references: [{
    id: 'ref-1',
    name: 'Jane Doe',
    jobTitle: 'Engineering Manager',
    company: 'Tech Corp',
    phone: '555-987-6543',
    email: 'jane@techcorp.com',
    relationship: 'Former Supervisor',
  }],
};

/**
 * Current job scenario - user is still employed
 */
export const currentJobResumeData: Partial<ResumeData> = {
  hasWorkExperience: true,
  workExperience: [{
    id: 'work-1',
    companyName: 'Current Company',
    jobTitle: 'Senior Developer',
    location: 'San Francisco, CA',
    startDate: 'January 2022',
    isCurrentJob: true,
    responsibilities: 'Leading development team',
  }],
};

/**
 * Student scenario - currently studying
 */
export const studentResumeData: Partial<ResumeData> = {
  hasWorkExperience: false,
  education: [{
    id: 'edu-1',
    schoolName: 'State University',
    degree: 'Bachelor of Arts',
    fieldOfStudy: 'Business',
    isCurrentlyStudying: true,
    startYear: '2022',
  }],
  hasVolunteering: true,
  volunteering: [{
    id: 'vol-1',
    organizationName: 'Campus Org',
    role: 'Member',
    startDate: '2022',
    responsibilities: 'Participated in events',
  }],
};

/**
 * References upon request scenario
 */
export const referencesUponRequestData: Partial<ResumeData> = {
  hasReferences: true,
  referencesUponRequest: true,
};

/**
 * No references scenario
 */
export const noReferencesData: Partial<ResumeData> = {
  hasReferences: false,
};

/**
 * Work + Education only (no volunteering, minimal skills)
 */
export const workEducationOnlyData: Partial<ResumeData> = {
  hasWorkExperience: true,
  workExperience: [{
    id: 'work-1',
    companyName: 'Company A',
    jobTitle: 'Associate',
    location: 'Chicago, IL',
    startDate: 'June 2021',
    endDate: 'Present',
    isCurrentJob: false,
    responsibilities: 'General duties',
  }],
  education: [{
    id: 'edu-1',
    schoolName: 'Community College',
    degree: 'Associate Degree',
    fieldOfStudy: 'General Studies',
    isCurrentlyStudying: false,
    startYear: '2019',
    endYear: '2021',
  }],
  hasVolunteering: false,
  hasTechnicalSkills: true,
  hasCertifications: false,
  hasLanguages: false,
  hasSoftSkills: true,
  hasReferences: false,
};

/**
 * Edge case: empty strings (should be treated as not provided)
 */
export const emptyStringsData: Partial<ResumeData> = {
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
  },
};

/**
 * Edge case: whitespace only (should be treated as empty)
 */
export const whitespaceOnlyData: Partial<ResumeData> = {
  personalInfo: {
    fullName: '   ',
    email: '   ',
    phone: '   ',
  },
};

/**
 * Edge case: special characters
 */
export const specialCharsData: Partial<ResumeData> = {
  personalInfo: {
    fullName: "O'Brien-Smith",
    email: 'test+tag@example.com',
    phone: '+1 (555) 123-4567',
    city: 'San Jose, CA',
  },
};

/**
 * Edge case: Unicode characters
 */
export const unicodeData: Partial<ResumeData> = {
  personalInfo: {
    fullName: 'Maria Garcia',
    email: 'maria@example.com',
    phone: '555-1234',
  },
  skills: {
    technicalSkills: [],
    certifications: [],
    softSkills: [],
    languages: [{ language: 'Espanol', proficiency: 'native' }],
  },
};

/**
 * All skills "yes" scenario
 */
export const allSkillsYesData: Partial<ResumeData> = {
  hasTechnicalSkills: true,
  hasCertifications: true,
  hasLanguages: true,
  hasSoftSkills: true,
};

/**
 * All skills "no" scenario
 */
export const allSkillsNoData: Partial<ResumeData> = {
  hasTechnicalSkills: false,
  hasCertifications: false,
  hasLanguages: false,
  hasSoftSkills: false,
};

/**
 * Mixed skills scenario
 */
export const mixedSkillsData: Partial<ResumeData> = {
  hasTechnicalSkills: true,
  hasCertifications: false,
  hasLanguages: true,
  hasSoftSkills: false,
};
