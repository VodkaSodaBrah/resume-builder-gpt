/**
 * Conversation Service
 * Frontend service for communicating with the AI chat endpoint
 */

import type {
  ChatMessage,
  ChatRequest,
  ChatResponse,
  QuestionCategory,
  ResumeData,
  AIConversationContext,
  ExtractedField,
  SpecialContent,
} from '@/types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Error class for conversation service failures
 */
export class ConversationServiceError extends Error {
  code: string;
  recoverable: boolean;

  constructor(message: string, code: string, recoverable: boolean = true) {
    super(message);
    this.name = 'ConversationServiceError';
    this.code = code;
    this.recoverable = recoverable;
  }
}

/**
 * Response from the chat API
 */
interface APIResponse {
  success: boolean;
  assistantMessage?: string;
  extractedFields?: ExtractedField[];
  suggestedSection?: QuestionCategory | null;
  isComplete?: boolean;
  specialContent?: SpecialContent | null;
  followUpNeeded?: boolean;
  confidence?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

/**
 * Send a message to the AI chat endpoint
 */
export async function sendChatMessage(
  userMessage: string,
  messages: ChatMessage[],
  currentResumeData: Partial<ResumeData>,
  currentSection: QuestionCategory,
  language: string = 'en',
  followUpCount: number = 0,
  conversationContext?: Partial<AIConversationContext>
): Promise<ChatResponse> {
  const startTime = Date.now();

  try {
    const requestBody: ChatRequest = {
      userMessage,
      messages: messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        questionId: m.questionId,
      })),
      currentResumeData,
      currentSection,
      language,
      followUpCount,
    };

    // Add conversation context if provided
    if (conversationContext) {
      (requestBody as unknown as Record<string, unknown>).conversationContext = {
        mentionedEntities: conversationContext.mentionedEntities || [],
        answeredTopics: conversationContext.answeredTopics || [],
        userTone: conversationContext.userTone || 'neutral',
      };
    }

    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      // Handle specific error codes
      if (response.status === 429) {
        throw new ConversationServiceError(
          'Too many requests. Please wait a moment and try again.',
          'RATE_LIMIT',
          true
        );
      }

      if (response.status >= 500) {
        throw new ConversationServiceError(
          'The server is temporarily unavailable. Please try again.',
          'SERVER_ERROR',
          true
        );
      }

      throw new ConversationServiceError(
        'Failed to communicate with the chat service.',
        'API_ERROR',
        true
      );
    }

    const data: APIResponse = await response.json();

    if (!data.success) {
      throw new ConversationServiceError(
        data.error || 'An unexpected error occurred.',
        'RESPONSE_ERROR',
        true
      );
    }

    const responseTime = Date.now() - startTime;

    // Build the response object
    const chatResponse: ChatResponse = {
      assistantMessage: data.assistantMessage || '',
      extractedFields: data.extractedFields || [],
      suggestedSection: data.suggestedSection || null,
      isComplete: data.isComplete || false,
      specialContent: data.specialContent || undefined,
      followUpNeeded: data.followUpNeeded || false,
      confidence: data.confidence || 0.5,
    };

    // Log response time for analytics
    if (import.meta.env.DEV) {
      console.log(`[Chat] Response received in ${responseTime}ms`, {
        extractedFields: chatResponse.extractedFields.length,
        suggestedSection: chatResponse.suggestedSection,
        followUpNeeded: chatResponse.followUpNeeded,
        tokenUsage: data.usage,
      });
    }

    return chatResponse;
  } catch (error) {
    if (error instanceof ConversationServiceError) {
      throw error;
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new ConversationServiceError(
        'Unable to connect to the server. Please check your internet connection.',
        'NETWORK_ERROR',
        true
      );
    }

    // Unknown errors
    throw new ConversationServiceError(
      'An unexpected error occurred. Please try again.',
      'UNKNOWN_ERROR',
      true
    );
  }
}

/**
 * Generate a fallback response when AI is unavailable
 */
export function generateFallbackResponse(
  currentSection: QuestionCategory,
  language: string = 'en'
): ChatResponse {
  const fallbackMessages: Record<QuestionCategory, string> = {
    language: "What language would you like your resume to be in?",
    intro: "Hi! I'm here to help you build a professional resume. Let's start with your name - what's your full name?",
    personal: "Let's continue with your contact information. What's your email address?",
    work: "Now let's talk about your work experience. What was your most recent job? Tell me the company name and your job title.",
    education: "Let's discuss your education. What school did you attend, and what degree did you earn?",
    volunteering: "Do you have any volunteer experience you'd like to include on your resume?",
    skills: "What skills would you like to highlight? This can include technical skills, soft skills, certifications, or languages.",
    references: "Would you like to add professional references, or would you prefer to just put 'References available upon request'?",
    review: "Great! I've collected all your information. Would you like to review anything before we generate your resume?",
    complete: "Your resume is ready! Click the button below to preview and download it.",
  };

  return {
    assistantMessage: fallbackMessages[currentSection] || fallbackMessages.intro,
    extractedFields: [],
    suggestedSection: null,
    isComplete: currentSection === 'complete',
    followUpNeeded: false,
    confidence: 1.0, // High confidence for fallback (known good state)
  };
}

/**
 * Sections that start with yes/no questions where "no" is a valid answer, not an escape
 */
const YES_NO_QUESTION_SECTIONS: QuestionCategory[] = ['work', 'education', 'volunteering', 'references'];

/**
 * Detect escape phrases in user message
 * @param message - The user's message
 * @param currentSection - Optional current section for context-aware detection
 */
export function detectEscapePhrase(message: string, currentSection?: QuestionCategory): boolean {
  const trimmed = message.trim();

  // "No" variants are NOT escape phrases in sections with yes/no questions at the start
  // These are valid answers to "Do you have work experience?" etc.
  if (currentSection && YES_NO_QUESTION_SECTIONS.includes(currentSection)) {
    const noVariants = /^(no|nope|nah)\.?$/i;
    if (noVariants.test(trimmed)) {
      return false;  // This is an answer, not an escape request
    }
  }

  const escapePatterns = [
    // Direct escape requests
    /move on/i,
    /skip( this)?/i,
    /next( question| section)?/i,
    /that'?s (enough|all|it)/i,
    /let'?s continue/i,
    /nothing (else|more)/i,
    /no more/i,
    /i'?m done( with this)?/i,
    /can we move/i,

    // Completion indicators
    /that'?s (everything|all i have)/i,
    /i (don'?t|do not) have (any )?more/i,
    /i'?ve (said|told|given) (everything|all)/i,
    /there('?s| is) nothing (else|more)/i,

    // Negative section indicators (but NOT standalone "no" - handled above contextually)
    /i (don'?t|do not) (have|want)( any| to add)?( (this|that|more|any(thing)?|references?))?$/i,
    /not (really|at this time|now)/i,
    /none( to add)?/i,

    // Frustration-based escapes
    /just (move|go) on/i,
    /can'?t we just/i,
    /i (just )?want(ed)? to (finish|move|continue)/i,

    // Time-based escapes
    /in a hurry/i,
    /short on time/i,
    /let'?s (speed|hurry) (this )?up/i,
  ];

  return escapePatterns.some((pattern) => pattern.test(message));
}

/**
 * Detect if user needs email help
 */
export function detectNoEmail(message: string): boolean {
  const noEmailPatterns = [
    // Direct statements
    /don'?t have (an? )?email/i,
    /no email/i,
    /i need (to )?(get|create|make) (an? )?email/i,
    /don'?t (have|use) email/i,
    /never had (an )?email/i,

    // Questions about email
    /what'?s (an )?email/i,
    /what is (an )?email/i,
    /how do i (get|make|create) (an )?email/i,
    /how (can|do) i (set up|get|make) (an )?email/i,
    /i'?m not sure (how|what) email/i,
    /can you help( me)? (with|create|get|make) (an )?email/i,

    // Tech illiterate indicators
    /i (only )?use (my )?phone/i,
    /i (just )?use facebook/i,
    /my (kid|child|grandkid|son|daughter|family) (does|handles) (my |the )?email/i,
    /someone else (does|handles|checks) (my |the )?email/i,

    // Confusion about email
    /confused about email/i,
    /email (is |seems )?(too )?(hard|complicated|confusing)/i,
    /not (good|great) with (technology|tech|computers|email)/i,
  ];

  return noEmailPatterns.some((pattern) => pattern.test(message));
}

/**
 * Detect frustration in user message
 */
export function detectFrustration(message: string): boolean {
  const frustrationPatterns = [
    /i (already|just) (said|told)/i,
    /why (are you|do you keep) asking/i,
    /stop asking/i,
    /this is (taking|too)/i,
    /i don'?t (know|understand)/i,
    /can'?t (you|we) just/i,
    /forget it/i,
    /never ?mind/i,
  ];

  return frustrationPatterns.some((pattern) => pattern.test(message));
}

/**
 * Detect vague or incomplete answers that need follow-up
 */
export function detectVagueAnswer(
  message: string,
  currentSection: QuestionCategory
): { isVague: boolean; suggestedFollowUp?: string } {
  const trimmed = message.trim().toLowerCase();

  // Very short answers (less than 3 words) for sections that need detail
  const detailSections: QuestionCategory[] = ['work', 'education', 'skills'];
  const wordCount = trimmed.split(/\s+/).length;

  if (detailSections.includes(currentSection) && wordCount < 3 && !detectEscapePhrase(message)) {
    const followUps: Record<string, string> = {
      work: "Could you tell me a bit more? What was the company name and your job title?",
      education: "Could you give me a few more details? What school and what degree?",
      skills: "Could you list a few specific skills? For example, software you know, certifications, or languages?",
    };
    return { isVague: true, suggestedFollowUp: followUps[currentSection] };
  }

  // Generic vague patterns
  const vaguePatterns = [
    { pattern: /^(yes|yeah|yep|sure|ok|okay)\.?$/i, followUp: "Great! Could you give me a bit more detail?" },
    { pattern: /^(no|nope|nah)\.?$/i, followUp: null }, // No follow-up needed for negative
    { pattern: /^i (guess|think) so\.?$/i, followUp: "What would you like to include?" },
    { pattern: /^(um+|uh+|hmm+)\.?$/i, followUp: "Take your time! What information would you like to share?" },
    { pattern: /^(idk|dunno|not sure)\.?$/i, followUp: "No worries! Would you like me to give you some examples?" },
    { pattern: /^maybe\.?$/i, followUp: "What are you thinking? I can help you decide." },
  ];

  for (const { pattern, followUp } of vaguePatterns) {
    if (pattern.test(trimmed)) {
      return { isVague: !!followUp, suggestedFollowUp: followUp || undefined };
    }
  }

  return { isVague: false };
}

/**
 * Get section-specific examples for tech-illiterate users
 */
export function getSectionExamples(section: QuestionCategory): string | null {
  const examples: Partial<Record<QuestionCategory, string>> = {
    personal: `For example:
- Full name: "John Smith"
- Email: "john.smith@gmail.com"
- Phone: "(555) 123-4567"
- City: "San Francisco, CA"`,
    work: `For example:
- "I worked at McDonald's as a cashier from 2020 to 2022"
- "I was a delivery driver for Amazon for 6 months"
- "I helped at my family's restaurant as a server"`,
    education: `For example:
- "I graduated from Lincoln High School in 2019"
- "I have an Associate's degree from City College"
- "I completed a certificate in Medical Billing"`,
    skills: `For example:
- Computer skills: "Microsoft Word, Excel, email"
- Languages: "Fluent in Spanish and English"
- Certifications: "Food Handler's License, CPR Certified"
- Soft skills: "Customer service, teamwork, time management"`,
  };

  return examples[section] || null;
}

/**
 * Get the welcome message for starting a conversation
 */
export function getWelcomeMessage(language: string = 'en'): string {
  // First message asks for language selection with all 10 supported languages
  return `**What language would you like to use?**

English | Espanol | Francais | Deutsch | Portugues
中文 | 日本語 | 한국어 | العربية | हिन्दी

Just type your preferred language!`;
}

/**
 * Check if resume data has minimum required fields
 */
export function hasMinimumRequiredFields(resumeData: Partial<ResumeData>): boolean {
  const personalInfo = resumeData.personalInfo;

  // Minimum: name and either email or phone
  if (!personalInfo?.fullName) return false;
  if (!personalInfo.email && !personalInfo.phone) return false;

  return true;
}

/**
 * Calculate completion percentage based on filled fields
 */
export function calculateCompletionPercentage(resumeData: Partial<ResumeData>): number {
  const fields = [
    resumeData.personalInfo?.fullName,
    resumeData.personalInfo?.email,
    resumeData.personalInfo?.phone,
    resumeData.personalInfo?.city,
    resumeData.workExperience?.length,
    resumeData.education?.length,
    resumeData.skills?.technicalSkills?.length,
  ];

  const filledFields = fields.filter(Boolean).length;
  return Math.round((filledFields / fields.length) * 100);
}
