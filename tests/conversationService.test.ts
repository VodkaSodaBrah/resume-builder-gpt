/**
 * Unit Tests for Conversation Service
 * Tests field extraction, escape detection, and conversation utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  detectEscapePhrase,
  detectNoEmail,
  detectFrustration,
  detectVagueAnswer,
  getSectionExamples,
  generateFallbackResponse,
  hasMinimumRequiredFields,
  calculateCompletionPercentage,
  getWelcomeMessage,
  sendChatMessage,
  ConversationServiceError,
} from '@/lib/conversationService';
import type { ResumeData } from '@/types';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('detectEscapePhrase', () => {
  describe('direct escape requests', () => {
    it('detects "move on"', () => {
      expect(detectEscapePhrase('move on')).toBe(true);
      expect(detectEscapePhrase('Move On please')).toBe(true);
      expect(detectEscapePhrase("let's move on")).toBe(true);
    });

    it('detects "skip"', () => {
      expect(detectEscapePhrase('skip')).toBe(true);
      expect(detectEscapePhrase('skip this')).toBe(true);
      expect(detectEscapePhrase('Skip this section')).toBe(true);
    });

    it('detects "next"', () => {
      expect(detectEscapePhrase('next')).toBe(true);
      expect(detectEscapePhrase('next question')).toBe(true);
      expect(detectEscapePhrase('next section please')).toBe(true);
    });

    it('detects "that\'s enough"', () => {
      expect(detectEscapePhrase("that's enough")).toBe(true);
      expect(detectEscapePhrase("thats all")).toBe(true);
      expect(detectEscapePhrase("that's it")).toBe(true);
    });
  });

  describe('completion indicators', () => {
    it('detects "that\'s everything"', () => {
      expect(detectEscapePhrase("that's everything")).toBe(true);
      expect(detectEscapePhrase("that's all I have")).toBe(true);
    });

    it('detects "I don\'t have more"', () => {
      expect(detectEscapePhrase("I don't have more")).toBe(true);
      expect(detectEscapePhrase("I do not have any more")).toBe(true);
    });

    it('detects "nothing else"', () => {
      expect(detectEscapePhrase("nothing else")).toBe(true);
      expect(detectEscapePhrase("nothing more")).toBe(true);
      expect(detectEscapePhrase("no more")).toBe(true);
    });
  });

  describe('negative section indicators', () => {
    it('standalone "no" is NOT an escape phrase (it\'s a valid answer to yes/no questions)', () => {
      // Without section context, "no" variants are not escape phrases
      // This prevents misinterpreting "Do you have work experience?" -> "no" as wanting to skip
      expect(detectEscapePhrase('no')).toBe(false);
      expect(detectEscapePhrase('No.')).toBe(false);
      expect(detectEscapePhrase('nope')).toBe(false);
      expect(detectEscapePhrase('nah')).toBe(false);
    });

    it('detects "none"', () => {
      expect(detectEscapePhrase('none')).toBe(true);
      expect(detectEscapePhrase('none to add')).toBe(true);
    });

    it('detects "not really"', () => {
      expect(detectEscapePhrase('not really')).toBe(true);
      expect(detectEscapePhrase('not at this time')).toBe(true);
      expect(detectEscapePhrase('not now')).toBe(true);
    });
  });

  describe('frustration-based escapes', () => {
    it('detects "just move on"', () => {
      expect(detectEscapePhrase('just move on')).toBe(true);
      expect(detectEscapePhrase('just go on')).toBe(true);
    });

    it('detects wanting to finish', () => {
      expect(detectEscapePhrase('I just want to finish')).toBe(true);
      expect(detectEscapePhrase('I wanted to move on')).toBe(true);
    });
  });

  describe('time-based escapes', () => {
    it('detects time pressure', () => {
      expect(detectEscapePhrase("I'm in a hurry")).toBe(true);
      expect(detectEscapePhrase("short on time")).toBe(true);
      expect(detectEscapePhrase("let's speed up")).toBe(true);
      expect(detectEscapePhrase("let's hurry this up")).toBe(true);
    });
  });

  describe('non-escape phrases', () => {
    it('does not detect regular messages', () => {
      expect(detectEscapePhrase('I worked at Google')).toBe(false);
      expect(detectEscapePhrase('My name is John Smith')).toBe(false);
      expect(detectEscapePhrase('I have a degree in Computer Science')).toBe(false);
      expect(detectEscapePhrase('john.smith@gmail.com')).toBe(false);
    });
  });
});

describe('detectNoEmail', () => {
  describe('direct statements', () => {
    it('detects "don\'t have email"', () => {
      expect(detectNoEmail("I don't have an email")).toBe(true);
      expect(detectNoEmail("I dont have email")).toBe(true);
      expect(detectNoEmail('no email')).toBe(true);
    });

    it('detects need to create email', () => {
      expect(detectNoEmail('I need to get an email')).toBe(true);
      expect(detectNoEmail('I need to create an email')).toBe(true);
      expect(detectNoEmail('I need to make email')).toBe(true);
    });
  });

  describe('questions about email', () => {
    it('detects "what is email"', () => {
      expect(detectNoEmail("what's an email")).toBe(true);
      expect(detectNoEmail('what is email')).toBe(true);
    });

    it('detects "how do I get email"', () => {
      expect(detectNoEmail('how do I get an email')).toBe(true);
      expect(detectNoEmail('how can I set up email')).toBe(true);
      expect(detectNoEmail('how do I make an email')).toBe(true);
    });

    it('detects requests for help', () => {
      expect(detectNoEmail('can you help me create an email')).toBe(true);
      expect(detectNoEmail('can you help with email')).toBe(true);
    });
  });

  describe('tech illiterate indicators', () => {
    it('detects phone-only users', () => {
      expect(detectNoEmail('I only use my phone')).toBe(true);
      expect(detectNoEmail('I just use facebook')).toBe(true);
    });

    it('detects family handling email', () => {
      expect(detectNoEmail('my kid does my email')).toBe(true);
      expect(detectNoEmail('my daughter handles the email')).toBe(true);
      expect(detectNoEmail('someone else handles my email')).toBe(true);
    });

    it('detects confusion about email', () => {
      expect(detectNoEmail('confused about email')).toBe(true);
      expect(detectNoEmail('email is too hard')).toBe(true);
      expect(detectNoEmail("I'm not good with technology")).toBe(true);
    });
  });

  describe('normal email responses', () => {
    it('does not flag valid email addresses', () => {
      expect(detectNoEmail('john.smith@gmail.com')).toBe(false);
      expect(detectNoEmail('my email is test@example.com')).toBe(false);
    });
  });
});

describe('detectFrustration', () => {
  it('detects "I already said"', () => {
    expect(detectFrustration('I already said that')).toBe(true);
    expect(detectFrustration('I just told you')).toBe(true);
  });

  it('detects "why are you asking"', () => {
    expect(detectFrustration('why are you asking again')).toBe(true);
    expect(detectFrustration('why do you keep asking')).toBe(true);
    expect(detectFrustration('stop asking')).toBe(true);
  });

  it('detects time complaints', () => {
    expect(detectFrustration('this is taking forever')).toBe(true);
    expect(detectFrustration('this is taking too long')).toBe(true);
  });

  it('detects confusion', () => {
    expect(detectFrustration("I don't know")).toBe(true);
    expect(detectFrustration("I don't understand")).toBe(true);
  });

  it('detects giving up', () => {
    expect(detectFrustration('forget it')).toBe(true);
    expect(detectFrustration('never mind')).toBe(true);
    expect(detectFrustration('nevermind')).toBe(true);
  });

  it('does not flag normal messages', () => {
    expect(detectFrustration('I worked at Google for 3 years')).toBe(false);
    expect(detectFrustration('My skills include Python and JavaScript')).toBe(false);
  });
});

describe('detectVagueAnswer', () => {
  describe('short answers in detail sections', () => {
    it('flags short work answers', () => {
      const result = detectVagueAnswer('yes', 'work');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('company name');
    });

    it('flags short education answers', () => {
      const result = detectVagueAnswer('sure', 'education');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('school');
    });

    it('flags short skills answers', () => {
      const result = detectVagueAnswer('ok', 'skills');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('specific skills');
    });
  });

  describe('vague response patterns', () => {
    it('flags "yes" as vague', () => {
      const result = detectVagueAnswer('yes', 'personal');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('more detail');
    });

    it('flags "okay" as vague', () => {
      const result = detectVagueAnswer('okay', 'personal');
      expect(result.isVague).toBe(true);
    });

    it('handles "no" without follow-up', () => {
      const result = detectVagueAnswer('no', 'personal');
      expect(result.isVague).toBe(false);
    });

    it('flags "I guess so"', () => {
      const result = detectVagueAnswer('i guess so', 'personal');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('include');
    });

    it('flags filler words', () => {
      const result = detectVagueAnswer('um', 'personal');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('Take your time');
    });

    it('flags uncertainty', () => {
      const result = detectVagueAnswer('idk', 'personal');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('examples');
    });

    it('flags "maybe"', () => {
      const result = detectVagueAnswer('maybe', 'personal');
      expect(result.isVague).toBe(true);
      expect(result.suggestedFollowUp).toContain('help you decide');
    });
  });

  describe('specific answers', () => {
    it('does not flag detailed work answers', () => {
      const result = detectVagueAnswer('I worked at Google as a software engineer', 'work');
      expect(result.isVague).toBe(false);
    });

    it('does not flag email addresses', () => {
      const result = detectVagueAnswer('john.smith@gmail.com', 'personal');
      expect(result.isVague).toBe(false);
    });

    it('does not flag escape phrases', () => {
      const result = detectVagueAnswer('skip', 'work');
      expect(result.isVague).toBe(false);
    });
  });
});

describe('getSectionExamples', () => {
  it('returns personal info examples', () => {
    const examples = getSectionExamples('personal');
    expect(examples).toContain('Full name');
    expect(examples).toContain('Email');
    expect(examples).toContain('Phone');
  });

  it('returns work examples', () => {
    const examples = getSectionExamples('work');
    expect(examples).toContain("McDonald's");
    expect(examples).toContain('cashier');
    expect(examples).toContain('delivery driver');
  });

  it('returns education examples', () => {
    const examples = getSectionExamples('education');
    expect(examples).toContain('High School');
    expect(examples).toContain("Associate's degree");
    expect(examples).toContain('certificate');
  });

  it('returns skills examples', () => {
    const examples = getSectionExamples('skills');
    expect(examples).toContain('Microsoft Word');
    expect(examples).toContain('Spanish');
    expect(examples).toContain('CPR Certified');
  });

  it('returns null for sections without examples', () => {
    expect(getSectionExamples('intro')).toBeNull();
    expect(getSectionExamples('review')).toBeNull();
    expect(getSectionExamples('complete')).toBeNull();
  });
});

describe('generateFallbackResponse', () => {
  it('generates intro response', () => {
    const response = generateFallbackResponse('intro');
    expect(response.assistantMessage).toContain("I'm here to help");
    expect(response.assistantMessage).toContain('name');
    expect(response.extractedFields).toHaveLength(0);
    expect(response.isComplete).toBe(false);
  });

  it('generates personal response', () => {
    const response = generateFallbackResponse('personal');
    expect(response.assistantMessage).toContain('contact information');
    expect(response.assistantMessage).toContain('email');
  });

  it('generates work response', () => {
    const response = generateFallbackResponse('work');
    expect(response.assistantMessage).toContain('work experience');
  });

  it('generates education response', () => {
    const response = generateFallbackResponse('education');
    expect(response.assistantMessage).toContain('education');
  });

  it('generates skills response', () => {
    const response = generateFallbackResponse('skills');
    expect(response.assistantMessage).toContain('skills');
  });

  it('marks complete section correctly', () => {
    const response = generateFallbackResponse('complete');
    expect(response.isComplete).toBe(true);
  });

  it('has high confidence for fallback', () => {
    const response = generateFallbackResponse('intro');
    expect(response.confidence).toBe(1.0);
  });
});

describe('hasMinimumRequiredFields', () => {
  it('returns false with empty data', () => {
    expect(hasMinimumRequiredFields({})).toBe(false);
  });

  it('returns false with only name', () => {
    const data: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
      },
    };
    expect(hasMinimumRequiredFields(data)).toBe(false);
  });

  it('returns true with name and email', () => {
    const data: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
        email: 'john@example.com',
      },
    };
    expect(hasMinimumRequiredFields(data)).toBe(true);
  });

  it('returns true with name and phone', () => {
    const data: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
        phone: '555-123-4567',
      },
    };
    expect(hasMinimumRequiredFields(data)).toBe(true);
  });

  it('returns true with name, email, and phone', () => {
    const data: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
        email: 'john@example.com',
        phone: '555-123-4567',
      },
    };
    expect(hasMinimumRequiredFields(data)).toBe(true);
  });
});

describe('calculateCompletionPercentage', () => {
  it('returns 0 for empty data', () => {
    expect(calculateCompletionPercentage({})).toBe(0);
  });

  it('calculates partial completion', () => {
    const data: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
        email: 'john@example.com',
      },
    };
    const percentage = calculateCompletionPercentage(data);
    expect(percentage).toBeGreaterThan(0);
    expect(percentage).toBeLessThan(100);
  });

  it('calculates higher percentage with more fields', () => {
    const partialData: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
      },
    };

    const moreData: Partial<ResumeData> = {
      personalInfo: {
        fullName: 'John Smith',
        email: 'john@example.com',
        phone: '555-123-4567',
        city: 'San Francisco',
      },
      workExperience: [{ company: 'Google', jobTitle: 'Engineer' }],
    };

    expect(calculateCompletionPercentage(moreData)).toBeGreaterThan(
      calculateCompletionPercentage(partialData)
    );
  });
});

describe('getWelcomeMessage', () => {
  it('returns a language selection message', () => {
    const message = getWelcomeMessage();
    expect(message).toContain('language');
    expect(message).toContain('English');
    expect(message).toContain('Espanol');
  });

  it('includes all 10 supported languages', () => {
    const message = getWelcomeMessage();
    expect(message).toContain('English');
    expect(message).toContain('Espanol');
    expect(message).toContain('Francais');
    expect(message).toContain('Deutsch');
    expect(message).toContain('Portugues');
    expect(message).toContain('中文');
    expect(message).toContain('日本語');
    expect(message).toContain('한국어');
    expect(message).toContain('العربية');
    expect(message).toContain('हिन्दी');
  });

  it('includes markdown formatting', () => {
    const message = getWelcomeMessage();
    expect(message).toContain('**');
  });
});

describe('sendChatMessage', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('sends request with correct structure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        assistantMessage: 'Hello!',
        extractedFields: [],
        suggestedSection: null,
        isComplete: false,
        followUpNeeded: false,
        confidence: 0.8,
      }),
    });

    const response = await sendChatMessage(
      'Hello',
      [],
      {},
      'intro',
      'en',
      0
    );

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/chat'),
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    expect(response.assistantMessage).toBe('Hello!');
  });

  it('handles successful response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        assistantMessage: 'Nice to meet you, John!',
        extractedFields: [
          { path: 'personalInfo.fullName', value: 'John', confidence: 0.9 },
        ],
        suggestedSection: 'personal',
        isComplete: false,
        followUpNeeded: true,
        confidence: 0.9,
      }),
    });

    const response = await sendChatMessage(
      'My name is John',
      [],
      {},
      'intro',
      'en',
      0
    );

    expect(response.assistantMessage).toBe('Nice to meet you, John!');
    expect(response.extractedFields).toHaveLength(1);
    expect(response.extractedFields[0].path).toBe('personalInfo.fullName');
    expect(response.suggestedSection).toBe('personal');
    expect(response.followUpNeeded).toBe(true);
  });

  it('throws ConversationServiceError on 429 rate limit', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
    });

    try {
      await sendChatMessage('Hello', [], {}, 'intro', 'en', 0);
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ConversationServiceError);
      expect((error as ConversationServiceError).code).toBe('RATE_LIMIT');
      expect((error as ConversationServiceError).recoverable).toBe(true);
    }
  });

  it('throws ConversationServiceError on 500 server error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });

    try {
      await sendChatMessage('Hello', [], {}, 'intro', 'en', 0);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ConversationServiceError);
      expect((error as ConversationServiceError).code).toBe('SERVER_ERROR');
    }
  });

  it('throws ConversationServiceError on API error response', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Invalid request',
      }),
    });

    try {
      await sendChatMessage('Hello', [], {}, 'intro', 'en', 0);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ConversationServiceError);
      expect((error as ConversationServiceError).code).toBe('RESPONSE_ERROR');
    }
  });

  it('throws ConversationServiceError on network error', async () => {
    mockFetch.mockRejectedValue(new TypeError('fetch failed'));

    try {
      await sendChatMessage('Hello', [], {}, 'intro', 'en', 0);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ConversationServiceError);
      expect((error as ConversationServiceError).code).toBe('NETWORK_ERROR');
    }
  });

  it('throws ConversationServiceError on other errors', async () => {
    mockFetch.mockRejectedValue(new Error('Unknown error'));

    try {
      await sendChatMessage('Hello', [], {}, 'intro', 'en', 0);
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeInstanceOf(ConversationServiceError);
      expect((error as ConversationServiceError).code).toBe('UNKNOWN_ERROR');
    }
  });

  it('includes conversation context when provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        assistantMessage: 'Got it!',
        extractedFields: [],
      }),
    });

    await sendChatMessage(
      'Hello',
      [],
      {},
      'intro',
      'en',
      0,
      { mentionedEntities: ['Google'], answeredTopics: ['name'], userTone: 'confident' }
    );

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.conversationContext).toBeDefined();
    expect(callBody.conversationContext.mentionedEntities).toEqual(['Google']);
    expect(callBody.conversationContext.userTone).toBe('confident');
  });

  it('handles special content in response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        assistantMessage: 'Let me help you create an email!',
        extractedFields: [],
        specialContent: {
          type: 'email_guide',
          content: 'Step 1: Go to gmail.com...',
        },
      }),
    });

    const response = await sendChatMessage(
      "I don't have email",
      [],
      {},
      'personal',
      'en',
      0
    );

    expect(response.specialContent).toBeDefined();
    expect(response.specialContent?.type).toBe('email_guide');
  });

  it('handles complete flag', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        assistantMessage: 'Your resume is complete!',
        extractedFields: [],
        isComplete: true,
      }),
    });

    const response = await sendChatMessage(
      'That looks good',
      [],
      {},
      'review',
      'en',
      0
    );

    expect(response.isComplete).toBe(true);
  });
});

describe('ConversationServiceError', () => {
  it('creates error with correct properties', () => {
    const error = new ConversationServiceError('Test error', 'TEST_CODE', true);

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_CODE');
    expect(error.recoverable).toBe(true);
    expect(error.name).toBe('ConversationServiceError');
  });

  it('defaults to recoverable true', () => {
    const error = new ConversationServiceError('Test error', 'TEST_CODE');
    expect(error.recoverable).toBe(true);
  });

  it('can be set to non-recoverable', () => {
    const error = new ConversationServiceError('Fatal error', 'FATAL', false);
    expect(error.recoverable).toBe(false);
  });
});
