/**
 * Test Data Factory
 *
 * Generates appropriate test data for each TestPath configuration.
 * Uses realistic but varied data to test different conversation flows.
 */

import type { TestPath } from './pathMatrix';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface PersonalInfoData {
  language: string;
  name: string;
  email: string;
  phone: string;
  location: string;
}

export interface WorkExperienceData {
  company: string;
  title: string;
  isCurrentJob: boolean;
  startDate: string;
  endDate?: string;
  responsibilities: string;
}

export interface EducationData {
  school: string;
  degree: string;
  fieldOfStudy: string;
  isCurrentlyStudying: boolean;
  startYear: string;
  endYear?: string;
}

export interface VolunteeringData {
  organization: string;
  role: string;
  startDate: string;
  endDate?: string;
  responsibilities: string;
}

export interface SkillsData {
  technicalSkills: string[];
  certifications: string[];
  languages: Array<{ language: string; proficiency: string }>;
  softSkills: string[];
}

export interface ReferenceData {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  relationship: string;
}

export interface ConversationTestData {
  personalInfo: PersonalInfoData;
  workExperiences: WorkExperienceData[];
  education: EducationData[];
  volunteering: VolunteeringData[];
  skills: SkillsData;
  references: ReferenceData[];
  decisions: TestPath['decisions'];
  conditionals: TestPath['conditionals'];
  referencesUponRequest: boolean;
}

// ============================================================================
// DATA POOLS - Varied realistic test data
// ============================================================================

const NAMES = [
  'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'James Williams',
  'Rachel Green', 'David Kim', 'Amanda Foster', 'Christopher Lee',
  'Jessica Martinez', 'Daniel Thompson', 'Sophia Patel', 'Matthew Garcia',
  'Olivia Brown', 'Andrew Wilson', 'Emma Davis', 'Ryan Mitchell'
];

const LOCATIONS = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX',
  'Phoenix, AZ', 'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA',
  'Dallas, TX', 'San Jose, CA', 'Austin, TX', 'Denver, CO',
  'Seattle, WA', 'Boston, MA', 'Portland, OR', 'Miami, FL'
];

const COMPANIES = [
  'Tech Solutions Inc', 'Global Innovations LLC', 'Dynamic Systems Corp',
  'Creative Minds Agency', 'Digital Horizons Ltd', 'Strategic Partners Group',
  'Apex Technologies', 'Bright Future Consulting', 'Core Systems International',
  'Elevate Software', 'Frontier Analytics', 'Integrated Solutions Co'
];

const JOB_TITLES = [
  'Software Developer', 'Marketing Manager', 'Data Analyst', 'Project Coordinator',
  'Sales Representative', 'HR Specialist', 'Financial Analyst', 'Operations Manager',
  'Customer Service Lead', 'Quality Assurance Engineer', 'Business Analyst', 'Account Executive'
];

const RESPONSIBILITIES_SETS = [
  'Developed and maintained web applications using modern frameworks. Collaborated with cross-functional teams to deliver projects on time.',
  'Managed marketing campaigns across digital channels. Analyzed campaign performance and optimized strategies for better ROI.',
  'Analyzed large datasets to identify trends and insights. Created dashboards and reports for executive decision-making.',
  'Coordinated project timelines and resources. Facilitated communication between stakeholders and development teams.',
  'Generated leads and closed sales deals with enterprise clients. Maintained strong client relationships and exceeded quarterly targets.',
  'Implemented HR policies and conducted employee onboarding. Managed recruitment processes and employee relations.',
];

const SCHOOLS = [
  'State University', 'City College', 'Technical Institute',
  'Community College', 'National University', 'Metropolitan College'
];

const DEGREES = [
  'Bachelor of Science', 'Bachelor of Arts', 'Associate Degree',
  'Master of Business Administration', 'Bachelor of Engineering', 'Master of Science'
];

const FIELDS_OF_STUDY = [
  'Computer Science', 'Business Administration', 'Marketing',
  'Information Technology', 'Communications', 'Engineering'
];

const VOLUNTEER_ORGANIZATIONS = [
  'Local Food Bank', 'Community Center', 'Youth Mentorship Program',
  'Environmental Conservation Group', 'Animal Shelter', 'Literacy Foundation'
];

const VOLUNTEER_ROLES = [
  'Volunteer Coordinator', 'Event Organizer', 'Mentor',
  'Administrative Assistant', 'Outreach Volunteer', 'Team Leader'
];

const VOLUNTEER_RESPONSIBILITIES = [
  'Organized weekly food distribution events. Coordinated volunteer schedules and managed inventory.',
  'Led youth mentoring sessions. Developed educational materials and tracked participant progress.',
  'Assisted with community outreach programs. Managed social media presence and event promotion.',
];

const TECHNICAL_SKILLS_SETS = [
  ['JavaScript', 'TypeScript', 'React', 'Node.js', 'SQL'],
  ['Python', 'Data Analysis', 'Excel', 'Tableau', 'SQL'],
  ['Java', 'Spring Boot', 'AWS', 'Docker', 'Kubernetes'],
  ['HTML', 'CSS', 'WordPress', 'SEO', 'Google Analytics'],
];

const CERTIFICATIONS_SETS = [
  ['AWS Certified Developer', 'Scrum Master Certified'],
  ['Google Analytics Certified', 'HubSpot Marketing Certified'],
  ['PMP Certification', 'Six Sigma Green Belt'],
  ['Microsoft Azure Fundamentals', 'CompTIA Security+'],
];

const LANGUAGES_DATA = [
  { language: 'Spanish', proficiency: 'professional' },
  { language: 'French', proficiency: 'conversational' },
  { language: 'Mandarin', proficiency: 'basic' },
  { language: 'German', proficiency: 'professional' },
  { language: 'Portuguese', proficiency: 'conversational' },
];

const SOFT_SKILLS_SETS = [
  ['Leadership', 'Communication', 'Problem-solving', 'Time Management'],
  ['Team Collaboration', 'Critical Thinking', 'Adaptability', 'Creativity'],
  ['Customer Service', 'Negotiation', 'Conflict Resolution', 'Public Speaking'],
];

const REFERENCE_NAMES = [
  'John Smith', 'Patricia Brown', 'Robert Taylor', 'Linda Anderson',
  'William Thomas', 'Barbara Jackson', 'Richard White', 'Susan Harris'
];

const REFERENCE_TITLES = [
  'Senior Manager', 'Team Lead', 'Director', 'Department Head',
  'Supervisor', 'Vice President', 'Chief of Staff', 'Principal'
];

const RELATIONSHIPS = [
  'Former Manager', 'Direct Supervisor', 'Team Lead', 'Department Director',
  'Mentor', 'Project Manager', 'Senior Colleague', 'HR Director'
];

// ============================================================================
// RANDOM SELECTION HELPERS
// ============================================================================

let seedCounter = 0;

/**
 * Simple seeded random for reproducible test data
 */
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickRandom<T>(array: T[], pathId: string, index: number = 0): T {
  const seed = pathId.charCodeAt(1) * 100 + pathId.charCodeAt(2) + index + seedCounter++;
  const idx = Math.floor(seededRandom(seed) * array.length);
  return array[idx];
}

function generateEmail(name: string): string {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  return `${cleanName}@example.com`;
}

function generatePhone(): string {
  const area = 555;
  const prefix = Math.floor(Math.random() * 900) + 100;
  const suffix = Math.floor(Math.random() * 9000) + 1000;
  return `${area}${prefix}${suffix}`;
}

// ============================================================================
// DATA GENERATORS
// ============================================================================

function generatePersonalInfo(pathId: string): PersonalInfoData {
  const name = pickRandom(NAMES, pathId);
  return {
    language: 'English',
    name,
    email: generateEmail(name),
    phone: generatePhone(),
    location: pickRandom(LOCATIONS, pathId, 1),
  };
}

function generateWorkExperience(pathId: string, index: number, isCurrentJob: boolean = false): WorkExperienceData {
  const currentYear = 2024;
  const startYear = currentYear - 3 - index;
  const endYear = isCurrentJob ? undefined : currentYear - 1 - index;

  return {
    company: pickRandom(COMPANIES, pathId, index),
    title: pickRandom(JOB_TITLES, pathId, index + 10),
    isCurrentJob,
    startDate: `January ${startYear}`,
    endDate: endYear ? `December ${endYear}` : undefined,
    responsibilities: pickRandom(RESPONSIBILITIES_SETS, pathId, index + 20),
  };
}

function generateEducation(pathId: string, index: number, isCurrentlyStudying: boolean = false): EducationData {
  const currentYear = 2024;
  const startYear = currentYear - 4 - index;
  const endYear = isCurrentlyStudying ? undefined : currentYear - index;

  return {
    school: pickRandom(SCHOOLS, pathId, index),
    degree: pickRandom(DEGREES, pathId, index + 10),
    fieldOfStudy: pickRandom(FIELDS_OF_STUDY, pathId, index + 20),
    isCurrentlyStudying,
    startYear: startYear.toString(),
    endYear: endYear?.toString(),
  };
}

function generateVolunteering(pathId: string, index: number): VolunteeringData {
  const currentYear = 2024;
  const startYear = currentYear - 2 - index;

  return {
    organization: pickRandom(VOLUNTEER_ORGANIZATIONS, pathId, index),
    role: pickRandom(VOLUNTEER_ROLES, pathId, index + 10),
    startDate: `March ${startYear}`,
    endDate: `Present`,
    responsibilities: pickRandom(VOLUNTEER_RESPONSIBILITIES, pathId, index + 20),
  };
}

function generateSkills(pathId: string, decisions: TestPath['decisions']): SkillsData {
  return {
    technicalSkills: decisions.hasTechnicalSkills ? pickRandom(TECHNICAL_SKILLS_SETS, pathId) : [],
    certifications: decisions.hasCertifications ? pickRandom(CERTIFICATIONS_SETS, pathId, 1) : [],
    languages: decisions.hasLanguages ? [pickRandom(LANGUAGES_DATA, pathId, 2)] : [],
    softSkills: decisions.hasSoftSkills ? pickRandom(SOFT_SKILLS_SETS, pathId, 3) : [],
  };
}

function generateReference(pathId: string, index: number): ReferenceData {
  const name = pickRandom(REFERENCE_NAMES, pathId, index);
  return {
    name,
    title: pickRandom(REFERENCE_TITLES, pathId, index + 10),
    company: pickRandom(COMPANIES, pathId, index + 20),
    phone: generatePhone(),
    email: generateEmail(name),
    relationship: pickRandom(RELATIONSHIPS, pathId, index + 30),
  };
}

// ============================================================================
// MAIN FACTORY FUNCTION
// ============================================================================

/**
 * Creates complete test data for a given test path
 */
export function createTestDataForPath(path: TestPath): ConversationTestData {
  const { decisions, conditionals, multiEntry } = path;

  // Reset seed counter for reproducibility within a path
  seedCounter = 0;

  // Generate work experiences
  const workCount = multiEntry?.workCount ?? (decisions.hasWorkExperience ? 1 : 0);
  const workExperiences: WorkExperienceData[] = [];
  for (let i = 0; i < workCount; i++) {
    const isCurrentJob = i === 0 && (conditionals?.isCurrentJob ?? false);
    workExperiences.push(generateWorkExperience(path.id, i, isCurrentJob));
  }

  // Generate education (always at least one - it's required)
  const educationCount = multiEntry?.educationCount ?? 1;
  const education: EducationData[] = [];
  for (let i = 0; i < educationCount; i++) {
    const isCurrentlyStudying = i === 0 && (conditionals?.isCurrentlyStudying ?? false);
    education.push(generateEducation(path.id, i, isCurrentlyStudying));
  }

  // Generate volunteering
  const volunteeringCount = multiEntry?.volunteeringCount ?? (decisions.hasVolunteering ? 1 : 0);
  const volunteering: VolunteeringData[] = [];
  for (let i = 0; i < volunteeringCount; i++) {
    volunteering.push(generateVolunteering(path.id, i));
  }

  // Generate references
  const referenceCount = multiEntry?.referenceCount ?? (decisions.hasReferences ? 1 : 0);
  const references: ReferenceData[] = [];
  if (!conditionals?.referencesUponRequest) {
    for (let i = 0; i < referenceCount; i++) {
      references.push(generateReference(path.id, i));
    }
  }

  return {
    personalInfo: generatePersonalInfo(path.id),
    workExperiences,
    education,
    volunteering,
    skills: generateSkills(path.id, decisions),
    references,
    decisions,
    conditionals: conditionals ?? {},
    referencesUponRequest: conditionals?.referencesUponRequest ?? false,
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a human-readable description of test data for debugging
 */
export function describeTestData(data: ConversationTestData): string {
  const parts: string[] = [];

  parts.push(`Personal: ${data.personalInfo.name} (${data.personalInfo.location})`);

  if (data.workExperiences.length > 0) {
    parts.push(`Work: ${data.workExperiences.length} job(s)`);
    if (data.workExperiences[0].isCurrentJob) {
      parts.push('  (current job)');
    }
  } else {
    parts.push('Work: None');
  }

  parts.push(`Education: ${data.education.length} entry/entries`);

  if (data.volunteering.length > 0) {
    parts.push(`Volunteering: ${data.volunteering.length} org(s)`);
  } else {
    parts.push('Volunteering: None');
  }

  const skillsCount = [
    data.skills.technicalSkills.length > 0 ? 'tech' : null,
    data.skills.certifications.length > 0 ? 'certs' : null,
    data.skills.languages.length > 0 ? 'langs' : null,
    data.skills.softSkills.length > 0 ? 'soft' : null,
  ].filter(Boolean);

  if (skillsCount.length > 0) {
    parts.push(`Skills: ${skillsCount.join(', ')}`);
  } else {
    parts.push('Skills: None');
  }

  if (data.referencesUponRequest) {
    parts.push('References: Upon request');
  } else if (data.references.length > 0) {
    parts.push(`References: ${data.references.length} contact(s)`);
  } else {
    parts.push('References: None');
  }

  return parts.join(' | ');
}

/**
 * Validate that test data matches expected decisions
 */
export function validateTestData(data: ConversationTestData, path: TestPath): boolean {
  const { decisions } = path;

  // Validate work experience
  if (decisions.hasWorkExperience && data.workExperiences.length === 0) {
    console.error(`Path ${path.id}: Expected work experience but none generated`);
    return false;
  }
  if (!decisions.hasWorkExperience && data.workExperiences.length > 0) {
    console.error(`Path ${path.id}: Unexpected work experience generated`);
    return false;
  }

  // Validate volunteering
  if (decisions.hasVolunteering && data.volunteering.length === 0) {
    console.error(`Path ${path.id}: Expected volunteering but none generated`);
    return false;
  }
  if (!decisions.hasVolunteering && data.volunteering.length > 0) {
    console.error(`Path ${path.id}: Unexpected volunteering generated`);
    return false;
  }

  // Validate skills
  if (decisions.hasTechnicalSkills && data.skills.technicalSkills.length === 0) {
    console.error(`Path ${path.id}: Expected technical skills but none generated`);
    return false;
  }
  if (decisions.hasCertifications && data.skills.certifications.length === 0) {
    console.error(`Path ${path.id}: Expected certifications but none generated`);
    return false;
  }
  if (decisions.hasLanguages && data.skills.languages.length === 0) {
    console.error(`Path ${path.id}: Expected languages but none generated`);
    return false;
  }
  if (decisions.hasSoftSkills && data.skills.softSkills.length === 0) {
    console.error(`Path ${path.id}: Expected soft skills but none generated`);
    return false;
  }

  // Validate references
  if (decisions.hasReferences && !data.referencesUponRequest && data.references.length === 0) {
    console.error(`Path ${path.id}: Expected references but none generated`);
    return false;
  }

  return true;
}
