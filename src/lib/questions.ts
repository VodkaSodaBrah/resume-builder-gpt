import type { Question, QuestionCategory } from '@/types';
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from './i18n';

// Question flow definition - one question at a time
export const questions: Question[] = [
  // Language Selection - First question, always in English with native language labels
  {
    id: 'language_select',
    category: 'language',
    question: "**What language would you like to use?**\n\nEnglish | Espanol | Francais | Deutsch | Portugues\n中文 | 日本語 | 한국어 | العربية | हिन्दी\n\nJust type your preferred language!",
    field: 'language',
    isRequired: true,
    inputType: 'select',
    options: SUPPORTED_LANGUAGES.map(lang => `${lang.nativeLabel} (${lang.label})`),
  },

  // Introduction
  {
    id: 'intro_welcome',
    category: 'intro',
    question: "Hello! I'm here to help you create a professional resume. I'll ask you some questions one at a time, and I'll help make your experience sound great to employers. Let's start with some basic information about you. Ready to begin?",
    field: 'ready',
    isRequired: true,
    inputType: 'confirm',
  },

  // Personal Information
  {
    id: 'personal_name',
    category: 'personal',
    question: "What is your full name? (This will appear at the top of your resume)",
    field: 'personalInfo.fullName',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., John Smith',
    validation: { minLength: 2, maxLength: 100 },
  },
  {
    id: 'personal_email',
    category: 'personal',
    question: "What is your email address? (Employers will use this to contact you)",
    field: 'personalInfo.email',
    isRequired: true,
    inputType: 'email',
    placeholder: 'e.g., john.smith@email.com',
    validation: { pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$' },
  },
  {
    id: 'personal_phone',
    category: 'personal',
    question: "What is your phone number?",
    field: 'personalInfo.phone',
    isRequired: true,
    inputType: 'phone',
    placeholder: 'e.g., (555) 123-4567',
  },
  {
    id: 'personal_city',
    category: 'personal',
    question: "What city do you live in? (You can skip your full address for privacy)",
    field: 'personalInfo.city',
    isRequired: false,
    inputType: 'text',
    placeholder: 'e.g., New York, NY',
  },
  {
    id: 'personal_zipcode',
    category: 'personal',
    question: "What is your zip code? (Optional - some employers like to know your general area)",
    field: 'personalInfo.zipCode',
    isRequired: false,
    inputType: 'text',
    placeholder: 'e.g., 10001',
  },

  // Work Experience - First Job
  {
    id: 'work_has_experience',
    category: 'work',
    question: "Do you have any work experience you'd like to include? (This can include part-time jobs, internships, or freelance work)",
    field: 'hasWorkExperience',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'work_company_1',
    category: 'work',
    question: "Great! Let's start with your most recent job. What company or organization did you work for?",
    field: 'workExperience[0].companyName',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., ABC Company',
    skipCondition: (data) => data.hasWorkExperience === false,
  },
  {
    id: 'work_title_1',
    category: 'work',
    question: "What was your job title at this company?",
    field: 'workExperience[0].jobTitle',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Sales Associate, Customer Service Rep',
    skipCondition: (data) => data.hasWorkExperience === false,
  },
  {
    id: 'work_location_1',
    category: 'work',
    question: "Where was this job located? (City, State or Country)",
    field: 'workExperience[0].location',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Chicago, IL',
    skipCondition: (data) => data.hasWorkExperience === false,
  },
  {
    id: 'work_start_1',
    category: 'work',
    question: "When did you start this job? (Month and year)",
    field: 'workExperience[0].startDate',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., January 2022 or 01/2022',
    skipCondition: (data) => data.hasWorkExperience === false,
  },
  {
    id: 'work_current_1',
    category: 'work',
    question: "Do you still work here?",
    field: 'workExperience[0].isCurrentJob',
    isRequired: true,
    inputType: 'confirm',
    skipCondition: (data) => data.hasWorkExperience === false,
  },
  {
    id: 'work_end_1',
    category: 'work',
    question: "When did you leave this job? (Month and year)",
    field: 'workExperience[0].endDate',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., December 2023 or 12/2023',
    // Check the most recent/last work experience entry for isCurrentJob
    skipCondition: (data) => {
      if (data.hasWorkExperience === false) return true;
      const lastEntry = data.workExperience?.[data.workExperience.length - 1];
      return lastEntry?.isCurrentJob === true;
    },
  },
  {
    id: 'work_responsibilities_1',
    category: 'work',
    question: "Describe **2-3 key responsibilities** at this job. Try to include:\n\n• What you did (your main tasks)\n• How you did it (tools, methods, or skills used)\n• Results achieved (numbers, improvements, or outcomes if possible)\n\nDon't worry about making it sound perfect - I'll help polish it!",
    field: 'workExperience[0].responsibilities',
    isRequired: true,
    inputType: 'textarea',
    placeholder: 'Example: Served 50+ customers daily, processed cash and card payments accurately, trained 3 new team members on register operations, maintained store displays which increased product visibility',
    skipCondition: (data) => data.hasWorkExperience === false,
  },
  {
    id: 'work_add_more',
    category: 'work',
    question: "Would you like to add another job? (It's recommended to add at least 2-3 jobs if you have them)",
    field: 'addMoreWork',
    isRequired: true,
    inputType: 'confirm',
    skipCondition: (data) => data.hasWorkExperience === false,
  },

  // Education
  {
    id: 'education_school',
    category: 'education',
    question: "Now let's talk about your education. What school did you attend most recently? (High school counts too!)",
    field: 'education[0].schoolName',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Lincoln High School or State University',
  },
  {
    id: 'education_degree',
    category: 'education',
    question: "What degree or diploma did you receive (or are working toward)?",
    field: 'education[0].degree',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., High School Diploma, Associate Degree, Bachelor of Science',
  },
  {
    id: 'education_field',
    category: 'education',
    question: "What was your field of study or major? (You can skip this if it doesn't apply)",
    field: 'education[0].fieldOfStudy',
    isRequired: false,
    inputType: 'text',
    placeholder: 'e.g., Business, Computer Science, General Studies',
  },
  {
    id: 'education_current',
    category: 'education',
    question: "Are you currently studying here?",
    field: 'education[0].isCurrentlyStudying',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'education_start',
    category: 'education',
    question: "What year did you start?",
    field: 'education[0].startYear',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., 2020',
  },
  {
    id: 'education_end',
    category: 'education',
    question: "What year did you graduate (or expect to graduate)?",
    field: 'education[0].endYear',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., 2024',
    // Check the most recent/last education entry for isCurrentlyStudying
    skipCondition: (data) => {
      const lastEntry = data.education?.[data.education.length - 1];
      return lastEntry?.isCurrentlyStudying === true;
    },
  },
  {
    id: 'education_add_more',
    category: 'education',
    question: "Would you like to add another school or degree? (e.g., another college, certification program, or high school)",
    field: 'addMoreEducation',
    isRequired: true,
    inputType: 'confirm',
  },

  // Volunteering
  {
    id: 'volunteering_has',
    category: 'volunteering',
    question: "Have you done any volunteer work? This can look great on a resume, especially if you're just starting your career!",
    field: 'hasVolunteering',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'volunteering_org',
    category: 'volunteering',
    question: "What organization did you volunteer with?",
    field: 'volunteering[0].organizationName',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Local Food Bank, Community Center',
    skipCondition: (data) => data.hasVolunteering === false,
  },
  {
    id: 'volunteering_role',
    category: 'volunteering',
    question: "What was your role or what did you do there?",
    field: 'volunteering[0].role',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Food Distribution Volunteer',
    skipCondition: (data) => data.hasVolunteering === false,
  },
  {
    id: 'volunteering_dates',
    category: 'volunteering',
    question: "When did you volunteer there? (Start date - end date, or just the year)",
    field: 'volunteering[0].startDate',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., 2022 - 2023 or June 2022 - Present',
    skipCondition: (data) => data.hasVolunteering === false,
  },
  {
    id: 'volunteering_responsibilities',
    category: 'volunteering',
    question: "Describe **2-3 things you did** as a volunteer. Include:\n\n• Your main tasks and activities\n• Any impact or results (people helped, events organized, etc.)\n• Skills you used or developed",
    field: 'volunteering[0].responsibilities',
    isRequired: true,
    inputType: 'textarea',
    placeholder: 'Example: Sorted and packed 200+ food boxes weekly for distribution, greeted and assisted 30+ families during food drives, coordinated with team of 10 volunteers to organize community events',
    skipCondition: (data) => data.hasVolunteering === false,
  },
  {
    id: 'volunteering_add_more',
    category: 'volunteering',
    question: "Would you like to add another volunteer experience?",
    field: 'addMoreVolunteering',
    isRequired: true,
    inputType: 'confirm',
    skipCondition: (data) => data.hasVolunteering === false,
  },

  // Skills - with gate questions for modular flow
  {
    id: 'skills_has_technical',
    category: 'skills',
    question: "Do you have any technical or job-related skills? (Computer skills, equipment you can use, software you know, etc.)",
    field: 'hasTechnicalSkills',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'skills_technical',
    category: 'skills',
    question: "List your **top 3-5 technical skills**. These are specific, job-related abilities like:\n\n• Software (Excel, QuickBooks, Photoshop)\n• Equipment (forklift, POS systems, medical devices)\n• Technical abilities (data entry, bookkeeping, programming)\n\nSeparate each skill with a comma.",
    field: 'skills.technicalSkills',
    isRequired: false,
    inputType: 'textarea',
    placeholder: 'Example: Microsoft Excel (advanced), Point of Sale systems, Data entry (60 WPM), QuickBooks, Social media management',
    skipCondition: (data) => data.hasTechnicalSkills === false,
  },
  {
    id: 'skills_has_certifications',
    category: 'skills',
    question: "Do you have any certifications or licenses? (Things like CPR, forklift license, food handler's card, etc.)",
    field: 'hasCertifications',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'skills_certifications',
    category: 'skills',
    question: "What certifications or licenses do you have?",
    field: 'skills.certifications',
    isRequired: false,
    inputType: 'text',
    placeholder: 'e.g., CPR Certified, Food Handler Card, Driver License',
    skipCondition: (data) => data.hasCertifications === false,
  },
  {
    id: 'skills_has_languages',
    category: 'skills',
    question: "Do you speak any languages other than English?",
    field: 'hasLanguages',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'skills_languages',
    category: 'skills',
    question: "What languages do you speak?",
    field: 'skills.languages',
    isRequired: false,
    inputType: 'textarea',
    placeholder: 'e.g., Spanish (fluent), French (conversational)',
    skipCondition: (data) => data.hasLanguages === false,
  },
  {
    id: 'skills_has_soft',
    category: 'skills',
    question: "Would you like to highlight any personal strengths?",
    field: 'hasSoftSkills',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'skills_soft',
    category: 'skills',
    question: "List **3-5 soft skills** (personal strengths that make you good at your job):\n\n• Communication: leadership, teamwork, customer service\n• Work ethic: reliable, punctual, detail-oriented\n• Problem-solving: analytical thinking, adaptability, creativity\n\nSeparate each with a comma.",
    field: 'skills.softSkills',
    isRequired: false,
    inputType: 'textarea',
    placeholder: 'Example: Strong communication, Team leadership, Problem-solving, Time management, Attention to detail',
    skipCondition: (data) => data.hasSoftSkills === false,
  },

  // References
  {
    id: 'references_has',
    category: 'references',
    question: "Would you like to add references? (People who can recommend you, like former bosses or teachers)",
    field: 'hasReferences',
    isRequired: true,
    inputType: 'confirm',
  },
  {
    id: 'references_note',
    category: 'references',
    question: "Note: Many people prefer to write 'References available upon request' instead of listing contacts. Would you like to do that instead?",
    field: 'referencesUponRequest',
    isRequired: true,
    inputType: 'confirm',
    skipCondition: (data) => data.hasReferences === false,
  },
  {
    id: 'reference_name',
    category: 'references',
    question: "What is your reference's name?",
    field: 'references[0].name',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Jane Doe',
    skipCondition: (data) => data.hasReferences === false || data.referencesUponRequest === true,
  },
  {
    id: 'reference_title',
    category: 'references',
    question: "What is their job title?",
    field: 'references[0].jobTitle',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Store Manager',
    skipCondition: (data) => data.hasReferences === false || data.referencesUponRequest === true,
  },
  {
    id: 'reference_company',
    category: 'references',
    question: "What company do they work at?",
    field: 'references[0].company',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., ABC Company',
    skipCondition: (data) => data.hasReferences === false || data.referencesUponRequest === true,
  },
  {
    id: 'reference_contact',
    category: 'references',
    question: "What is their phone number or email?",
    field: 'references[0].phone',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., (555) 123-4567 or jane@email.com',
    skipCondition: (data) => data.hasReferences === false || data.referencesUponRequest === true,
  },
  {
    id: 'reference_relationship',
    category: 'references',
    question: "What is your relationship to this person?",
    field: 'references[0].relationship',
    isRequired: true,
    inputType: 'text',
    placeholder: 'e.g., Former Supervisor, Manager, Teacher',
    skipCondition: (data) => data.hasReferences === false || data.referencesUponRequest === true,
  },
  {
    id: 'references_add_more',
    category: 'references',
    question: "Would you like to add another reference? (Most employers like to see 2-3 references)",
    field: 'addMoreReferences',
    isRequired: true,
    inputType: 'confirm',
    skipCondition: (data) => data.hasReferences === false || data.referencesUponRequest === true,
  },

  // Review
  {
    id: 'review_template',
    category: 'review',
    question: "Great job! Now let's choose how your resume will look. Which style would you prefer?\n\n1. **Classic** - Traditional and professional, works great for any industry\n2. **Modern** - Clean and contemporary with a fresh look\n3. **Professional** - Compact and efficient, fits more information\n\nJust type 1, 2, or 3:",
    field: 'templateStyle',
    isRequired: true,
    inputType: 'select',
    options: ['classic', 'modern', 'professional'],
  },
  {
    id: 'review_confirm',
    category: 'review',
    question: "I'm now going to create your resume! I'll improve the descriptions you gave me to make them sound more professional and attractive to employers. Ready to generate your resume?",
    field: 'confirmGenerate',
    isRequired: true,
    inputType: 'confirm',
  },

  // Complete
  {
    id: 'complete',
    category: 'complete',
    question: "Your resume is ready! You can download it as a PDF or Word document. Would you like to make any changes?",
    field: 'complete',
    isRequired: false,
    inputType: 'confirm',
  },
];

// Map of "add more" question IDs to the first question of that section
export const ADD_MORE_SECTION_MAP: Record<string, { firstQuestionId: string; sectionKey: string }> = {
  'work_add_more': { firstQuestionId: 'work_company_1', sectionKey: 'work' },
  'education_add_more': { firstQuestionId: 'education_school', sectionKey: 'education' },
  'volunteering_add_more': { firstQuestionId: 'volunteering_org', sectionKey: 'volunteering' },
  'references_add_more': { firstQuestionId: 'reference_name', sectionKey: 'references' },
};

// Get the index of a question by its ID
export const getQuestionIndexById = (questionId: string): number => {
  return questions.findIndex(q => q.id === questionId);
};

// Transform a field path to use the correct index for multi-entry sections
export const transformFieldPath = (
  field: string,
  sectionKey: string,
  entryIndex: number
): string => {
  // Match patterns like "workExperience[0].fieldName" or "education[0].fieldName"
  const sectionPatterns: Record<string, RegExp> = {
    'work': /workExperience\[\d+\]/,
    'education': /education\[\d+\]/,
    'volunteering': /volunteering\[\d+\]/,
    'references': /references\[\d+\]/,
  };

  const sectionNames: Record<string, string> = {
    'work': 'workExperience',
    'education': 'education',
    'volunteering': 'volunteering',
    'references': 'references',
  };

  const pattern = sectionPatterns[sectionKey];
  const sectionName = sectionNames[sectionKey];

  if (pattern && sectionName && pattern.test(field)) {
    return field.replace(pattern, `${sectionName}[${entryIndex}]`);
  }

  return field;
};

export const getCategoryProgress = (category: QuestionCategory): { current: number; total: number } => {
  const categoryOrder: QuestionCategory[] = [
    'language',
    'intro',
    'personal',
    'work',
    'education',
    'volunteering',
    'skills',
    'references',
    'review',
    'complete',
  ];
  const current = categoryOrder.indexOf(category) + 1;
  return { current, total: categoryOrder.length };
};

export const getCategoryLabel = (category: QuestionCategory): string => {
  const labels: Record<QuestionCategory, string> = {
    language: 'Language',
    intro: 'Getting Started',
    personal: 'Personal Information',
    work: 'Work Experience',
    education: 'Education',
    volunteering: 'Volunteering',
    skills: 'Skills',
    references: 'References',
    review: 'Review',
    complete: 'Complete',
  };
  return labels[category];
};
