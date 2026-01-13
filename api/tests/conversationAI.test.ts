/**
 * Integration Tests for Conversation AI Module
 * Tests detection functions, parsing, and conversation flow logic
 */

import {
  detectNoEmail,
  detectEscapePhrase,
  detectFrustration,
  detectNoWorkExperience,
  getNextSection,
  buildSystemPrompt,
  shouldAskFollowUp,
  parseExtractedData,
  cleanAIResponse,
  applyExtractedFields,
  buildContextSummary,
  RESUME_ASSISTANT_PROMPT,
  SECTION_PROMPTS,
  QuestionCategory,
  // Validation layer imports
  detectUserSaidNoToSection,
  validateAIResponse,
  detectContradiction,
  REQUIRED_FIRST_MESSAGES,
  SECTION_TRANSITION_MESSAGES,
  SECTION_ADVANCE_MAP,
  hasMeaningfulData,
} from '../lib/conversationAI';

// ============================================================================
// Detection Functions
// ============================================================================

describe('detectNoEmail', () => {
  it('detects "don\'t have email"', () => {
    expect(detectNoEmail("I don't have an email")).toBe(true);
    expect(detectNoEmail("I dont have email")).toBe(true);
    expect(detectNoEmail('no email')).toBe(true);
  });

  it('detects need to create email', () => {
    expect(detectNoEmail('I need to get an email')).toBe(true);
    expect(detectNoEmail('I need to create email')).toBe(true);
    expect(detectNoEmail('I need to make an email')).toBe(true);
  });

  it('detects confusion about email', () => {
    expect(detectNoEmail("what's email")).toBe(true);
    expect(detectNoEmail("what's an email")).toBe(true);
    expect(detectNoEmail('how do I get email')).toBe(true);
    expect(detectNoEmail('how do I make an email')).toBe(true);
  });

  it('detects never had email', () => {
    expect(detectNoEmail('never had an email')).toBe(true);
    expect(detectNoEmail('never had email')).toBe(true);
  });

  it('does not flag normal email responses', () => {
    expect(detectNoEmail('john.smith@gmail.com')).toBe(false);
    expect(detectNoEmail('My email is test@example.com')).toBe(false);
    expect(detectNoEmail('I use email every day')).toBe(false);
  });
});

describe('detectEscapePhrase', () => {
  it('detects move on phrases', () => {
    expect(detectEscapePhrase('move on')).toBe(true);
    expect(detectEscapePhrase('can we move on')).toBe(true);
    expect(detectEscapePhrase("let's continue")).toBe(true);
  });

  it('detects skip phrases', () => {
    expect(detectEscapePhrase('skip')).toBe(true);
    expect(detectEscapePhrase('skip this')).toBe(true);
    expect(detectEscapePhrase('next question')).toBe(true);
  });

  it('detects completion phrases', () => {
    expect(detectEscapePhrase("that's enough")).toBe(true);
    expect(detectEscapePhrase("that's all")).toBe(true);
    expect(detectEscapePhrase("that's it")).toBe(true);
    expect(detectEscapePhrase('nothing else')).toBe(true);
    expect(detectEscapePhrase('nothing more')).toBe(true);
    expect(detectEscapePhrase('no more')).toBe(true);
  });

  it('detects done phrases', () => {
    expect(detectEscapePhrase("I'm done")).toBe(true);
    expect(detectEscapePhrase("I'm done with this")).toBe(true);
  });

  it('does not flag normal responses', () => {
    expect(detectEscapePhrase('I worked at Google')).toBe(false);
    expect(detectEscapePhrase('My name is John')).toBe(false);
    expect(detectEscapePhrase('I have a degree')).toBe(false);
  });
});

describe('detectFrustration', () => {
  it('detects repetition frustration', () => {
    expect(detectFrustration('I already said that')).toBe(true);
    expect(detectFrustration('I just told you')).toBe(true);
    expect(detectFrustration('why are you asking again')).toBe(true);
    expect(detectFrustration('why do you keep asking')).toBe(true);
    expect(detectFrustration('stop asking')).toBe(true);
  });

  it('detects time frustration', () => {
    expect(detectFrustration('this is taking forever')).toBe(true);
    expect(detectFrustration('this is taking too long')).toBe(true);
  });

  it('detects confusion', () => {
    expect(detectFrustration("I don't know")).toBe(true);
    expect(detectFrustration("I don't understand")).toBe(true);
    expect(detectFrustration("can't you just do it")).toBe(true);
    expect(detectFrustration("can't we just finish")).toBe(true);
  });

  it('detects giving up', () => {
    expect(detectFrustration('forget it')).toBe(true);
    expect(detectFrustration('never mind')).toBe(true);
    expect(detectFrustration('nevermind')).toBe(true);
  });

  it('does not flag normal responses', () => {
    expect(detectFrustration('I worked at Google for 3 years')).toBe(false);
    expect(detectFrustration('My skills include Python')).toBe(false);
    expect(detectFrustration('Let me tell you about my education')).toBe(false);
  });
});

describe('detectNoWorkExperience', () => {
  it('detects no experience statements', () => {
    expect(detectNoWorkExperience('no work experience')).toBe(true);
    expect(detectNoWorkExperience("this is my first job")).toBe(true);
    expect(detectNoWorkExperience("it's my first job")).toBe(true);
    expect(detectNoWorkExperience("I've never worked before")).toBe(true);
    expect(detectNoWorkExperience('never had a job')).toBe(true);
  });

  it('detects first-time job seekers', () => {
    expect(detectNoWorkExperience('just graduated')).toBe(true);
    expect(detectNoWorkExperience('just finished school')).toBe(true);
    expect(detectNoWorkExperience('looking for my first job')).toBe(true);
    expect(detectNoWorkExperience("I haven't worked yet")).toBe(true);
    expect(detectNoWorkExperience("haven't worked before")).toBe(true);
  });

  it('does not flag normal work descriptions', () => {
    expect(detectNoWorkExperience('I worked at McDonald\'s')).toBe(false);
    expect(detectNoWorkExperience('I was a cashier for 2 years')).toBe(false);
    expect(detectNoWorkExperience('My last job was at Amazon')).toBe(false);
  });
});

// ============================================================================
// Section Navigation
// ============================================================================

describe('getNextSection', () => {
  it('returns next section in order', () => {
    expect(getNextSection('language')).toBe('intro');
    expect(getNextSection('intro')).toBe('personal');
    expect(getNextSection('personal')).toBe('work');
    expect(getNextSection('work')).toBe('education');
    expect(getNextSection('education')).toBe('volunteering');
    expect(getNextSection('volunteering')).toBe('skills');
    expect(getNextSection('skills')).toBe('references');
    expect(getNextSection('references')).toBe('review');
    expect(getNextSection('review')).toBe('complete');
    expect(getNextSection('complete')).toBe('complete');
  });

  it('skips work section when user has no experience', () => {
    expect(getNextSection('personal', false)).toBe('education');
  });

  it('skips volunteering section when user has none', () => {
    expect(getNextSection('education', true, false)).toBe('skills');
  });

  it('skips references section when user has none', () => {
    expect(getNextSection('skills', true, true, false)).toBe('review');
  });

  it('does not skip sections when user has content', () => {
    expect(getNextSection('personal', true)).toBe('work');
    expect(getNextSection('education', true, true)).toBe('volunteering');
    expect(getNextSection('skills', true, true, true)).toBe('references');
  });
});

// ============================================================================
// Follow-up Logic
// ============================================================================

describe('shouldAskFollowUp', () => {
  it('allows follow-ups within limit for regular sections', () => {
    expect(shouldAskFollowUp('personal', 0)).toBe(true);
    expect(shouldAskFollowUp('personal', 1)).toBe(true);
    expect(shouldAskFollowUp('personal', 2)).toBe(true);
  });

  it('blocks follow-ups at limit for regular sections', () => {
    expect(shouldAskFollowUp('personal', 3)).toBe(false);
    expect(shouldAskFollowUp('skills', 3)).toBe(false);
    expect(shouldAskFollowUp('references', 3)).toBe(false);
  });

  it('allows more follow-ups for multi-entry sections', () => {
    expect(shouldAskFollowUp('work', 4)).toBe(true);
    expect(shouldAskFollowUp('education', 4)).toBe(true);
  });

  it('blocks follow-ups at higher limit for multi-entry sections', () => {
    expect(shouldAskFollowUp('work', 5)).toBe(false);
    expect(shouldAskFollowUp('education', 5)).toBe(false);
  });

  it('respects custom max follow-ups', () => {
    expect(shouldAskFollowUp('personal', 1, 2)).toBe(true);
    expect(shouldAskFollowUp('personal', 2, 2)).toBe(false);
  });
});

// ============================================================================
// System Prompt Building
// ============================================================================

describe('buildSystemPrompt', () => {
  it('includes base resume assistant prompt', () => {
    const prompt = buildSystemPrompt('personal');
    expect(prompt).toContain('resume assistant');
    expect(prompt).toContain('friendly');
    expect(prompt).toContain('patient');
  });

  it('includes section-specific guidance', () => {
    const personalPrompt = buildSystemPrompt('personal');
    expect(personalPrompt).toContain('full name');
    expect(personalPrompt).toContain('email');
    expect(personalPrompt).toContain('phone');

    const workPrompt = buildSystemPrompt('work');
    expect(workPrompt).toContain('company');
    expect(workPrompt).toContain('job title');
    expect(workPrompt).toContain('responsibilities');
  });

  it('adds language instruction for non-English', () => {
    const spanishPrompt = buildSystemPrompt('personal', 'es');
    expect(spanishPrompt).toContain('Respond in es');
    expect(spanishPrompt).toContain('extracted_data JSON in English');
  });

  it('includes additional context when provided', () => {
    const prompt = buildSystemPrompt('personal', 'en', 'User is frustrated');
    expect(prompt).toContain('User is frustrated');
    expect(prompt).toContain('Additional Context');
  });
});

// ============================================================================
// Response Parsing
// ============================================================================

describe('parseExtractedData', () => {
  it('parses valid extracted data', () => {
    const response = `Great! Let me help you.
<extracted_data>
{
  "fields": [{"path": "personalInfo.fullName", "value": "John Smith", "confidence": 0.95}],
  "suggestedSection": "work",
  "followUpNeeded": false,
  "specialContent": null,
  "isComplete": false
}
</extracted_data>`;

    const result = parseExtractedData(response);
    expect(result).not.toBeNull();
    expect(result?.fields).toHaveLength(1);
    expect(result?.fields[0].path).toBe('personalInfo.fullName');
    expect(result?.fields[0].value).toBe('John Smith');
    expect(result?.fields[0].confidence).toBe(0.95);
    expect(result?.suggestedSection).toBe('work');
    expect(result?.followUpNeeded).toBe(false);
    expect(result?.isComplete).toBe(false);
  });

  it('handles response without extracted data', () => {
    const response = 'Just a normal response without any special tags.';
    const result = parseExtractedData(response);
    expect(result).toBeNull();
  });

  it('handles malformed JSON gracefully', () => {
    const response = `<extracted_data>{ invalid json }</extracted_data>`;
    const result = parseExtractedData(response);
    expect(result).toBeNull();
  });

  it('handles empty fields array', () => {
    const response = `<extracted_data>{"fields": [], "suggestedSection": null, "followUpNeeded": true, "isComplete": false}</extracted_data>`;
    const result = parseExtractedData(response);
    expect(result?.fields).toHaveLength(0);
    expect(result?.followUpNeeded).toBe(true);
  });

  it('parses special content flags', () => {
    const response = `<extracted_data>{"fields": [], "specialContent": "email_guide", "isComplete": false}</extracted_data>`;
    const result = parseExtractedData(response);
    expect(result?.specialContent).toBe('email_guide');
  });
});

describe('cleanAIResponse', () => {
  it('removes extracted data tags', () => {
    const response = `Hello there!
<extracted_data>{"fields": []}</extracted_data>
How can I help?`;

    const cleaned = cleanAIResponse(response);
    expect(cleaned).not.toContain('extracted_data');
    expect(cleaned).toContain('Hello there!');
    expect(cleaned).toContain('How can I help?');
  });

  it('handles multiple extracted data blocks', () => {
    const response = `Part 1 <extracted_data>{"a": 1}</extracted_data> Part 2 <extracted_data>{"b": 2}</extracted_data> Part 3`;
    const cleaned = cleanAIResponse(response);
    expect(cleaned).toBe('Part 1  Part 2  Part 3');
  });

  it('handles response without extracted data', () => {
    const response = 'Just a normal response.';
    const cleaned = cleanAIResponse(response);
    expect(cleaned).toBe('Just a normal response.');
  });

  it('trims whitespace', () => {
    const response = `  Hello!  <extracted_data>{}</extracted_data>  `;
    const cleaned = cleanAIResponse(response);
    expect(cleaned).toBe('Hello!');
  });
});

// ============================================================================
// Field Application
// ============================================================================

describe('applyExtractedFields', () => {
  it('applies high confidence fields', () => {
    const currentData = {};
    const fields = [
      { path: 'personalInfo.fullName', value: 'John Smith', confidence: 0.95 },
      { path: 'personalInfo.email', value: 'john@example.com', confidence: 0.9 },
    ];

    const result = applyExtractedFields(currentData, fields);
    expect((result.personalInfo as Record<string, unknown>).fullName).toBe('John Smith');
    expect((result.personalInfo as Record<string, unknown>).email).toBe('john@example.com');
  });

  it('ignores low confidence fields', () => {
    const currentData = {};
    const fields = [
      { path: 'personalInfo.fullName', value: 'John Smith', confidence: 0.5 },
    ];

    const result = applyExtractedFields(currentData, fields);
    expect(result.personalInfo).toBeUndefined();
  });

  it('handles array paths', () => {
    const currentData = {};
    const fields = [
      { path: 'workExperience[0].companyName', value: 'Google', confidence: 0.9 },
      { path: 'workExperience[0].jobTitle', value: 'Engineer', confidence: 0.9 },
    ];

    const result = applyExtractedFields(currentData, fields);
    const workExp = result.workExperience as unknown[];
    expect(workExp).toBeDefined();
    expect((workExp[0] as Record<string, unknown>).companyName).toBe('Google');
    expect((workExp[0] as Record<string, unknown>).jobTitle).toBe('Engineer');
  });

  it('does not mutate original data', () => {
    const currentData = { personalInfo: { fullName: 'Original' } };
    const fields = [
      { path: 'personalInfo.fullName', value: 'New Name', confidence: 0.95 },
    ];

    const result = applyExtractedFields(currentData, fields);
    expect((currentData.personalInfo as Record<string, unknown>).fullName).toBe('Original');
    expect((result.personalInfo as Record<string, unknown>).fullName).toBe('New Name');
  });
});

// ============================================================================
// Context Building
// ============================================================================

describe('buildContextSummary', () => {
  it('includes answered topics', () => {
    const context = {
      mentionedEntities: [],
      answeredTopics: ['name', 'email'],
      currentSection: 'personal' as QuestionCategory,
      followUpCounts: {} as Record<QuestionCategory, number>,
      userTone: 'neutral' as const,
    };

    const summary = buildContextSummary(context, {});
    expect(summary).toContain('name');
    expect(summary).toContain('email');
    expect(summary).toContain('Topics already covered');
  });

  it('includes mentioned entities', () => {
    const context = {
      mentionedEntities: ['Google', 'John'],
      answeredTopics: [],
      currentSection: 'work' as QuestionCategory,
      followUpCounts: {} as Record<QuestionCategory, number>,
      userTone: 'neutral' as const,
    };

    const summary = buildContextSummary(context, {});
    expect(summary).toContain('Google');
    expect(summary).toContain('John');
    expect(summary).toContain('Names/companies mentioned');
  });

  it('includes user name from resume data', () => {
    const context = {
      mentionedEntities: [],
      answeredTopics: [],
      currentSection: 'work' as QuestionCategory,
      followUpCounts: {} as Record<QuestionCategory, number>,
      userTone: 'neutral' as const,
    };

    const summary = buildContextSummary(context, {
      personalInfo: { fullName: 'Jane Doe' },
    });
    expect(summary).toContain('Jane Doe');
    expect(summary).toContain("User's name");
  });

  it('includes work experience count', () => {
    const context = {
      mentionedEntities: [],
      answeredTopics: [],
      currentSection: 'education' as QuestionCategory,
      followUpCounts: {} as Record<QuestionCategory, number>,
      userTone: 'neutral' as const,
    };

    const summary = buildContextSummary(context, {
      workExperience: [{}, {}, {}],
    });
    expect(summary).toContain('3');
    expect(summary).toContain('Work experiences collected');
  });

  it('includes non-neutral user tone', () => {
    const context = {
      mentionedEntities: [],
      answeredTopics: [],
      currentSection: 'personal' as QuestionCategory,
      followUpCounts: {} as Record<QuestionCategory, number>,
      userTone: 'frustrated' as const,
    };

    const summary = buildContextSummary(context, {});
    expect(summary).toContain('frustrated');
    expect(summary).toContain('adjust tone');
  });

  it('returns empty string for empty context', () => {
    const context = {
      mentionedEntities: [],
      answeredTopics: [],
      currentSection: 'intro' as QuestionCategory,
      followUpCounts: {} as Record<QuestionCategory, number>,
      userTone: 'neutral' as const,
    };

    const summary = buildContextSummary(context, {});
    expect(summary).toBe('');
  });
});

// ============================================================================
// Constants Validation
// ============================================================================

describe('RESUME_ASSISTANT_PROMPT', () => {
  it('contains key instructions', () => {
    expect(RESUME_ASSISTANT_PROMPT).toContain('resume');
    expect(RESUME_ASSISTANT_PROMPT).toContain('extracted_data');
    expect(RESUME_ASSISTANT_PROMPT).toContain('confidence');
    expect(RESUME_ASSISTANT_PROMPT).toContain('escape phrases');
  });

  it('defines output format', () => {
    expect(RESUME_ASSISTANT_PROMPT).toContain('<extracted_data>');
    expect(RESUME_ASSISTANT_PROMPT).toContain('</extracted_data>');
    expect(RESUME_ASSISTANT_PROMPT).toContain('fields');
    expect(RESUME_ASSISTANT_PROMPT).toContain('suggestedSection');
  });
});

describe('SECTION_PROMPTS', () => {
  const requiredSections: QuestionCategory[] = [
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

  it('has prompts for all sections', () => {
    requiredSections.forEach((section) => {
      expect(SECTION_PROMPTS[section]).toBeDefined();
      expect(typeof SECTION_PROMPTS[section]).toBe('string');
      expect(SECTION_PROMPTS[section].length).toBeGreaterThan(0);
    });
  });

  it('personal section mentions contact info', () => {
    expect(SECTION_PROMPTS.personal).toContain('email');
    expect(SECTION_PROMPTS.personal).toContain('phone');
  });

  it('work section mentions job details', () => {
    expect(SECTION_PROMPTS.work).toContain('company');
    expect(SECTION_PROMPTS.work).toContain('job title');
    expect(SECTION_PROMPTS.work).toContain('start');
  });

  it('skills section mentions skill types', () => {
    expect(SECTION_PROMPTS.skills).toContain('Technical');
    expect(SECTION_PROMPTS.skills).toContain('Soft Skills');
    expect(SECTION_PROMPTS.skills).toContain('Certifications');
  });

  it('references section indicates it is optional', () => {
    // References is explicitly marked as optional in the prompt
    expect(SECTION_PROMPTS.references.toLowerCase()).toContain('optional');
  });
});

// ============================================================================
// Validation Layer Tests
// ============================================================================

describe('detectUserSaidNoToSection', () => {
  it('detects simple "no" responses', () => {
    expect(detectUserSaidNoToSection('no', 'work', 0)).toBe(true);
    expect(detectUserSaidNoToSection('No', 'work', 0)).toBe(true);
    expect(detectUserSaidNoToSection('no.', 'work', 0)).toBe(true);
    expect(detectUserSaidNoToSection('nope', 'work', 0)).toBe(true);
    expect(detectUserSaidNoToSection('nah', 'work', 0)).toBe(true);
  });

  it('detects explicit denial phrases', () => {
    expect(detectUserSaidNoToSection('I dont have any', 'work', 0)).toBe(true);
    expect(detectUserSaidNoToSection("I don't have that", 'volunteering', 0)).toBe(true);
    expect(detectUserSaidNoToSection('none', 'skills', 0)).toBe(true);
    expect(detectUserSaidNoToSection('nothing', 'education', 0)).toBe(true);
    expect(detectUserSaidNoToSection('skip', 'references', 0)).toBe(true);
  });

  it('does not trigger on follow-up messages (followUpCount > 0)', () => {
    expect(detectUserSaidNoToSection('no', 'work', 1)).toBe(false);
    expect(detectUserSaidNoToSection('no', 'work', 2)).toBe(false);
    expect(detectUserSaidNoToSection('nope', 'education', 3)).toBe(false);
  });

  it('does not trigger on non-yes/no sections', () => {
    expect(detectUserSaidNoToSection('no', 'personal', 0)).toBe(false);
    expect(detectUserSaidNoToSection('no', 'intro', 0)).toBe(false);
    expect(detectUserSaidNoToSection('no', 'language', 0)).toBe(false);
    expect(detectUserSaidNoToSection('no', 'review', 0)).toBe(false);
  });

  it('does not trigger on positive or content responses', () => {
    expect(detectUserSaidNoToSection('yes', 'work', 0)).toBe(false);
    expect(detectUserSaidNoToSection('I worked at Google', 'work', 0)).toBe(false);
    expect(detectUserSaidNoToSection('Sure, I have some', 'skills', 0)).toBe(false);
  });
});

describe('validateAIResponse', () => {
  it('accepts valid first message with yes/no question', () => {
    const response = REQUIRED_FIRST_MESSAGES.work!;
    const result = validateAIResponse(response, 'work', 0, false);
    expect(result.isValid).toBe(true);
  });

  it('accepts valid first message with short intro', () => {
    const response = `Great! ${REQUIRED_FIRST_MESSAGES.skills!}`;
    const result = validateAIResponse(response, 'skills', 0, false);
    expect(result.isValid).toBe(true);
  });

  it('rejects first message without required yes/no question', () => {
    const response = "What company did you work for?";
    const result = validateAIResponse(response, 'work', 0, false);
    expect(result.isValid).toBe(false);
    expect(result.correctedResponse).toBe(REQUIRED_FIRST_MESSAGES.work);
  });

  it('rejects first message with too much intro text', () => {
    const longIntro = 'A'.repeat(60); // More than 50 chars
    const response = `${longIntro} ${REQUIRED_FIRST_MESSAGES.skills!}`;
    const result = validateAIResponse(response, 'skills', 0, false);
    expect(result.isValid).toBe(false);
  });

  it('rejects transition with next section question when user said no', () => {
    const response = `That's fine! ${REQUIRED_FIRST_MESSAGES.education!}`;
    const result = validateAIResponse(response, 'work', 0, true);
    expect(result.isValid).toBe(false);
    expect(result.correctedResponse).toBe(SECTION_TRANSITION_MESSAGES.work);
  });

  it('accepts valid transition when user said no', () => {
    const response = "That's totally fine! Let's move on to your education.";
    const result = validateAIResponse(response, 'work', 0, true);
    expect(result.isValid).toBe(true);
  });

  it('accepts any response for follow-up messages (followUpCount > 0)', () => {
    const response = "What were your responsibilities?";
    const result = validateAIResponse(response, 'work', 1, false);
    expect(result.isValid).toBe(true);
  });
});

describe('detectContradiction - improved', () => {
  it('does NOT trigger on simple "no" response without existing data', () => {
    const result = detectContradiction('no', {});
    expect(result.isContradiction).toBe(false);
  });

  it('does NOT trigger on "no" with empty array', () => {
    const result = detectContradiction('no', { workExperience: [] });
    expect(result.isContradiction).toBe(false);
  });

  it('does NOT trigger on "no" with empty objects in array', () => {
    const result = detectContradiction('no', {
      workExperience: [{ id: '123' }]
    });
    expect(result.isContradiction).toBe(false);
  });

  it('does NOT trigger on simple "nope" or "none"', () => {
    expect(detectContradiction('nope', { workExperience: [] }).isContradiction).toBe(false);
    expect(detectContradiction('none', { volunteering: [] }).isContradiction).toBe(false);
    expect(detectContradiction('n/a', { education: [] }).isContradiction).toBe(false);
  });

  it('DOES trigger with meaningful existing data and explicit denial', () => {
    const result = detectContradiction("I don't have any work experience", {
      workExperience: [{ id: '123', companyName: 'Google', jobTitle: 'Engineer' }]
    });
    expect(result.isContradiction).toBe(true);
    expect(result.section).toBe('workExperience');
    expect(result.existingDataSummary).toContain('Google');
  });

  it('DOES trigger for volunteering with meaningful data', () => {
    const result = detectContradiction("I don't have any volunteering", {
      volunteering: [{ id: '1', organization: 'Red Cross', role: 'Helper' }]
    });
    expect(result.isContradiction).toBe(true);
    expect(result.section).toBe('volunteering');
    expect(result.existingDataSummary).toContain('Red Cross');
  });

  it('DOES trigger for education with meaningful data', () => {
    const result = detectContradiction("I don't have any education", {
      education: [{ id: '1', schoolName: 'MIT', degree: 'BS' }]
    });
    expect(result.isContradiction).toBe(true);
    expect(result.section).toBe('education');
    expect(result.existingDataSummary).toContain('MIT');
  });

  it('DOES NOT trigger when only id field exists', () => {
    const result = detectContradiction("I don't have any work experience", {
      workExperience: [{ id: '123' }]
    });
    expect(result.isContradiction).toBe(false);
  });
});

describe('hasMeaningfulData', () => {
  it('returns false for null/undefined', () => {
    expect(hasMeaningfulData(null)).toBe(false);
    expect(hasMeaningfulData(undefined)).toBe(false);
  });

  it('returns false for empty array', () => {
    expect(hasMeaningfulData([])).toBe(false);
  });

  it('returns false for array with only id fields', () => {
    expect(hasMeaningfulData([{ id: '123' }])).toBe(false);
    expect(hasMeaningfulData([{ id: '123' }, { id: '456' }])).toBe(false);
  });

  it('returns false for array with empty values', () => {
    expect(hasMeaningfulData([{ id: '123', name: '', title: null }])).toBe(false);
    expect(hasMeaningfulData([{ id: '123', items: [] }])).toBe(false);
  });

  it('returns true for array with meaningful data', () => {
    expect(hasMeaningfulData([{ id: '123', companyName: 'Google' }])).toBe(true);
    expect(hasMeaningfulData([{ name: 'John' }])).toBe(true);
  });
});

describe('REQUIRED_FIRST_MESSAGES', () => {
  it('has messages for yes/no sections', () => {
    expect(REQUIRED_FIRST_MESSAGES.work).toBeDefined();
    expect(REQUIRED_FIRST_MESSAGES.education).toBeDefined();
    expect(REQUIRED_FIRST_MESSAGES.volunteering).toBeDefined();
    expect(REQUIRED_FIRST_MESSAGES.skills).toBeDefined();
    expect(REQUIRED_FIRST_MESSAGES.references).toBeDefined();
  });

  it('messages contain Yes or No', () => {
    Object.values(REQUIRED_FIRST_MESSAGES).forEach(msg => {
      if (msg) {
        expect(msg).toContain('Yes or No');
      }
    });
  });
});

describe('SECTION_TRANSITION_MESSAGES', () => {
  it('has transition messages for yes/no sections', () => {
    expect(SECTION_TRANSITION_MESSAGES.work).toBeDefined();
    expect(SECTION_TRANSITION_MESSAGES.education).toBeDefined();
    expect(SECTION_TRANSITION_MESSAGES.volunteering).toBeDefined();
    expect(SECTION_TRANSITION_MESSAGES.skills).toBeDefined();
    expect(SECTION_TRANSITION_MESSAGES.references).toBeDefined();
  });

  it('transition messages mention next section', () => {
    expect(SECTION_TRANSITION_MESSAGES.work).toContain('education');
    expect(SECTION_TRANSITION_MESSAGES.education).toContain('volunteer');
    expect(SECTION_TRANSITION_MESSAGES.volunteering).toContain('skills');
    expect(SECTION_TRANSITION_MESSAGES.skills).toContain('references');
    expect(SECTION_TRANSITION_MESSAGES.references).toContain('review');
  });
});

describe('SECTION_ADVANCE_MAP', () => {
  it('maps to next logical section', () => {
    expect(SECTION_ADVANCE_MAP.work).toBe('education');
    expect(SECTION_ADVANCE_MAP.education).toBe('volunteering');
    expect(SECTION_ADVANCE_MAP.volunteering).toBe('skills');
    expect(SECTION_ADVANCE_MAP.skills).toBe('references');
    expect(SECTION_ADVANCE_MAP.references).toBe('review');
  });
});
