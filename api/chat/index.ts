/**
 * Conversational AI Chat Endpoint
 * Handles natural language resume building with intelligent field extraction
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { getConversationCompletion, ConversationMessage } from '../lib/openai';
import {
  buildSystemPrompt,
  detectNoEmail,
  detectEscapePhrase,
  detectFrustration,
  detectContradiction,
  detectExportIntent,
  parseExtractedData,
  cleanAIResponse,
  buildContextSummary,
  getNextSection,
  shouldAskFollowUp,
  QuestionCategory,
  // Validation layer imports
  detectUserSaidNoToSection,
  detectUserSaidYesToSection,
  validateAIResponse,
  SECTION_TRANSITION_MESSAGES,
  SECTION_ADVANCE_MAP,
  SECTION_FLAG_MAP,
  // Skills sub-category imports
  detectSkillsSubCategory,
  getNextSkillsSubCategory,
  detectSkillsSubCategoryAnswer,
  SKILLS_SUB_CATEGORY_QUESTIONS,
} from '../lib/conversationAI';
import { getInlineEmailGuide } from '../lib/emailGuide';

// Request validation schema
const chatRequestSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string(),
    })
  ),
  currentResumeData: z.record(z.any()).default({}),
  currentSection: z.enum([
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
  ]),
  userMessage: z.string().min(1),
  language: z.string().default('en'),
  followUpCount: z.number().default(0),
  conversationContext: z
    .object({
      mentionedEntities: z.array(z.string()).default([]),
      answeredTopics: z.array(z.string()).default([]),
      userTone: z.enum(['confident', 'uncertain', 'frustrated', 'neutral']).default('neutral'),
    })
    .optional(),
});

interface ChatResponseBody {
  success: boolean;
  assistantMessage?: string;
  extractedFields?: Array<{
    path: string;
    value: unknown;
    confidence: number;
    needsConfirmation?: boolean;
  }>;
  suggestedSection?: QuestionCategory | null;
  isComplete?: boolean;
  specialContent?: {
    type: 'email_guide' | 'help_link' | 'example';
    content: string;
    expandable?: boolean;
  } | null;
  followUpNeeded?: boolean;
  confidence?: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
}

export async function chatHandler(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors.map((e) => e.message).join(', '),
        } as ChatResponseBody,
      };
    }

    const {
      messages,
      currentResumeData,
      currentSection,
      userMessage,
      language,
      followUpCount,
      conversationContext,
    } = validation.data;

    // Pre-process user message for special patterns
    const needsEmailHelp = detectNoEmail(userMessage);
    const wantsToMoveOn = detectEscapePhrase(userMessage);
    const seemsFrustrated = detectFrustration(userMessage);

    // Detect actual section from last AI message (frontend tracking may be out of sync)
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
    let actualSection = currentSection;

    // Check if last AI message was a yes/no section question
    if (lastAssistantMessage.toLowerCase().includes('do you have any work experience')) {
      actualSection = 'work';
    } else if (lastAssistantMessage.toLowerCase().includes('do you have any education')) {
      actualSection = 'education';
    } else if (lastAssistantMessage.toLowerCase().includes('do you have any volunteer')) {
      actualSection = 'volunteering';
    } else if (lastAssistantMessage.toLowerCase().includes('do you have any technical skills')) {
      actualSection = 'skills';
    } else if (lastAssistantMessage.toLowerCase().includes('add professional references') ||
               lastAssistantMessage.toLowerCase().includes('would you like to add references')) {
      actualSection = 'references';
    }

    context.log(`DEBUG: currentSection from frontend=${currentSection}, actualSection detected=${actualSection}`);

    // CRITICAL: Check if user said "no" to the section's yes/no question FIRST
    // This must happen BEFORE contradiction detection to avoid false positives
    // Use actualSection instead of currentSection since frontend may be out of sync
    const userSaidNoToSection = detectUserSaidNoToSection(
      userMessage,
      actualSection,
      0  // Treat as first question since we detected the yes/no question in the AI message
    );

    // Also detect if user said "yes" to allow AI to proceed to detail questions
    const userSaidYesToSection = detectUserSaidYesToSection(
      userMessage,
      actualSection,
      0
    );

    // DEBUG LOGGING - remove after fixing
    context.log(`DEBUG: userMessage="${userMessage}", currentSection="${currentSection}", followUpCount=${followUpCount}`);
    context.log(`DEBUG: userSaidNoToSection=${userSaidNoToSection}, userSaidYesToSection=${userSaidYesToSection}`);

    // Only check for contradictions if user is NOT answering a yes/no section question
    // When user says "no" to "Do you have work experience?", that's NOT a contradiction
    const contradiction = userSaidNoToSection
      ? { isContradiction: false, section: null, existingData: null, existingDataSummary: null }
      : detectContradiction(userMessage, currentResumeData);

    context.log(`DEBUG: contradiction.isContradiction=${contradiction.isContradiction}`);

    // Check for export intent in review/complete sections
    const wantsToExport =
      (currentSection === 'review' || currentSection === 'complete') &&
      detectExportIntent(userMessage);

    // Build context summary for the AI
    const contextSummary = buildContextSummary(
      {
        mentionedEntities: conversationContext?.mentionedEntities || [],
        answeredTopics: conversationContext?.answeredTopics || [],
        currentSection,
        followUpCounts: { [currentSection]: followUpCount } as Record<QuestionCategory, number>,
        userTone: conversationContext?.userTone || 'neutral',
      },
      currentResumeData
    );

    // Build additional context for edge cases
    let additionalContext = contextSummary;

    if (wantsToMoveOn) {
      additionalContext += '\n\nThe user wants to move on. Acknowledge and proceed to the next logical section.';
    }

    if (seemsFrustrated) {
      additionalContext +=
        '\n\nThe user seems frustrated. Be extra patient and supportive. Offer to skip optional sections or simplify.';
    }

    if (needsEmailHelp) {
      additionalContext +=
        '\n\nThe user needs help creating an email. Set specialContent to "email_guide" in your response.';
    }

    // Handle contradiction - user says "no X" but we have X data
    if (contradiction.isContradiction && contradiction.existingDataSummary) {
      additionalContext += `

## CONTRADICTION DETECTED - MUST ADDRESS:
The user just said they don't have ${contradiction.section} experience, BUT we already have data for this section:
- Existing data: ${contradiction.existingDataSummary}

You MUST:
1. Acknowledge the existing data: "Earlier you mentioned ${contradiction.existingDataSummary}."
2. Ask for clarification: "Would you like to keep this information or remove it from your resume?"
3. Wait for their explicit answer before proceeding
4. Set followUpNeeded: true
5. DO NOT automatically clear the data or move to the next section`;
    }

    // Handle export intent in review/complete sections
    if (wantsToExport) {
      additionalContext += `

## EXPORT INTENT DETECTED:
The user wants to download/export their resume.
You MUST:
1. Respond with: "Your resume is ready! Click the 'View & Download Resume' button below to preview and download it."
2. Set isComplete: true in extracted_data
3. DO NOT give instructions about Word, PDF creation, or other software - we generate it for them`;
    }

    if (!shouldAskFollowUp(currentSection, followUpCount)) {
      additionalContext +=
        '\n\nYou have asked enough follow-ups for this section. Wrap up and move to the next section.';
    }

    // Section entry signal - critical for yes/no questions
    // Only add this when user hasn't already answered the yes/no question
    if (followUpCount === 0 && !userSaidNoToSection && !userSaidYesToSection) {
      const yesNoSections = ['work', 'education', 'volunteering', 'skills', 'references'];
      if (yesNoSections.includes(currentSection)) {
        additionalContext += `

## SECTION ENTRY - FIRST MESSAGE REQUIREMENT:
You are NOW ENTERING the "${currentSection}" section for the FIRST TIME.
This is message #1 (followUpCount = 0).
Your response MUST be ONLY the required yes/no question for this section.
DO NOT summarize previous sections.
DO NOT skip to detail questions.
JUST ask the yes/no question.`;
      }
    }

    // When user says "yes" to a section question, tell AI to ask for details
    if (userSaidYesToSection) {
      additionalContext += `

## USER SAID YES - ASK FOR DETAILS:
The user just said "yes" to the ${actualSection} section question.
Now ask them for the specific details for their first ${actualSection} entry.
DO NOT ask the yes/no question again - they already answered it.`;
    }

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(currentSection, language, additionalContext);

    // Convert messages to OpenAI format
    const conversationMessages: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    // Add the current user message
    conversationMessages.push({
      role: 'user',
      content: userMessage,
    });

    // Get AI response
    const aiResult = await getConversationCompletion(
      systemPrompt,
      conversationMessages,
      0.7, // temperature
      1000 // maxTokens
    );

    // Parse the extracted data from AI response
    const extractedData = parseExtractedData(aiResult.response);
    let cleanResponse = cleanAIResponse(aiResult.response);

    // =========================================================================
    // VALIDATION LAYER - Enforce conversation rules programmatically
    // =========================================================================

    // Validate AI response follows the rules (userSaidNoToSection and userSaidYesToSection already computed above)
    const responseValidation = validateAIResponse(
      cleanResponse,
      currentSection,
      followUpCount,
      userSaidNoToSection,
      userSaidYesToSection
    );

    if (!responseValidation.isValid) {
      context.log(`AI response validation failed: ${responseValidation.violation}`);

      // Use corrected response if available
      if (responseValidation.correctedResponse) {
        cleanResponse = responseValidation.correctedResponse;
      }
    }

    // If user said "no" to a yes/no section question, force correct transition
    // Use actualSection since frontend tracking may be out of sync
    if (userSaidNoToSection && SECTION_TRANSITION_MESSAGES[actualSection]) {
      // Ensure we use the standard transition message
      cleanResponse = SECTION_TRANSITION_MESSAGES[actualSection]!;
      context.log(`User said no to ${actualSection}, using transition message`);
    }

    // Determine suggested section
    let suggestedSection = extractedData?.suggestedSection || null;
    context.log(`DEBUG: extractedData.suggestedSection=${extractedData?.suggestedSection}, final suggestedSection=${suggestedSection}`);

    // If user said "no" to section, auto-advance to next section
    // Use actualSection since frontend tracking may be out of sync
    if (userSaidNoToSection && !suggestedSection) {
      suggestedSection = SECTION_ADVANCE_MAP[actualSection] || null;
      context.log(`Auto-advancing from ${actualSection} to ${suggestedSection}`);
    }

    // If user wants to move on, calculate next section
    if (wantsToMoveOn && !suggestedSection) {
      const hasWork = currentResumeData.hasWorkExperience;
      const hasVol = currentResumeData.hasVolunteering;
      const hasRef = currentResumeData.hasReferences;
      suggestedSection = getNextSection(
        currentSection,
        hasWork as boolean | undefined,
        hasVol as boolean | undefined,
        hasRef as boolean | undefined
      );
    }

    // Build extracted fields - add "has" flag when user says no
    // Use actualSection since frontend tracking may be out of sync
    let extractedFields = extractedData?.fields || [];
    if (userSaidNoToSection && SECTION_FLAG_MAP[actualSection]) {
      // Add flag to indicate user doesn't have this type of content
      extractedFields = [
        ...extractedFields,
        {
          path: SECTION_FLAG_MAP[actualSection]!,
          value: false,
          confidence: 0.95,
        },
      ];
      context.log(`Added ${SECTION_FLAG_MAP[actualSection]} = false to extracted fields`);
    }

    // Force followUpNeeded when user says "yes" to section question
    // This ensures frontend increments followUpCount so next message
    // isn't treated as first message in section
    let followUpNeeded = extractedData?.followUpNeeded || false;
    if (userSaidYesToSection) {
      followUpNeeded = true;
      context.log(`User said yes to ${actualSection}, forcing followUpNeeded=true`);
    }

    // =========================================================================
    // SKILLS SUB-CATEGORY ENFORCEMENT
    // Ensures all 4 skills sub-categories are asked in order
    // =========================================================================
    if (actualSection === 'skills' && !userSaidNoToSection) {
      const lastAISubCategory = detectSkillsSubCategory(lastAssistantMessage);
      context.log(`DEBUG: Skills sub-category detected in last AI message: ${lastAISubCategory}`);

      if (lastAISubCategory) {
        // User just responded to a skills sub-category question
        const userAnswer = detectSkillsSubCategoryAnswer(userMessage);
        context.log(`DEBUG: User answer type: ${userAnswer}`);

        if (userAnswer === 'no' || userAnswer === 'details' || userAnswer === 'yes') {
          // Move to next sub-category
          const nextSubCategory = getNextSkillsSubCategory(lastAISubCategory);
          context.log(`DEBUG: Next skills sub-category: ${nextSubCategory}`);

          if (nextSubCategory === 'done') {
            // All sub-categories done, move to references
            if (!suggestedSection) {
              suggestedSection = 'references';
            }
            // Ensure response transitions to references with the yes/no question
            if (!cleanResponse.toLowerCase().includes('reference')) {
              const acknowledgment = userAnswer === 'no' ? 'No problem!' : 'Great!';
              cleanResponse = `${acknowledgment} **Would you like to add professional references? (Yes or No)**`;
              context.log('Forcing transition to references after all skills sub-categories');
            }
          } else {
            // Force next sub-category question
            const nextQuestion = SKILLS_SUB_CATEGORY_QUESTIONS[nextSubCategory];
            if (!cleanResponse.includes(nextQuestion)) {
              // AI didn't ask the right question, force it
              const acknowledgment = userAnswer === 'no' ? 'No problem!' : 'Great!';
              cleanResponse = `${acknowledgment} ${nextQuestion}`;
              context.log(`Forcing skills sub-category question: ${nextSubCategory}`);
            }
            // Stay in skills section
            followUpNeeded = true;
          }
        }
      }
    }

    // Build special content if needed
    let specialContent: ChatResponseBody['specialContent'] = null;

    if (needsEmailHelp || extractedData?.specialContent === 'email_guide') {
      specialContent = {
        type: 'email_guide',
        content: getInlineEmailGuide(language),
        expandable: true,
      };
    }

    // Calculate response confidence
    const confidence =
      extractedData?.fields && extractedData.fields.length > 0
        ? extractedData.fields.reduce((sum, f) => sum + f.confidence, 0) /
          extractedData.fields.length
        : 0.5;

    const responseTime = Date.now() - startTime;
    context.log(`Chat response generated in ${responseTime}ms`);

    const responseBody: ChatResponseBody = {
      success: true,
      assistantMessage: cleanResponse,
      extractedFields: extractedFields,
      suggestedSection,
      isComplete: extractedData?.isComplete || false,
      specialContent,
      followUpNeeded,
      confidence,
      usage: {
        promptTokens: aiResult.usage.promptTokens,
        completionTokens: aiResult.usage.completionTokens,
        totalTokens: aiResult.usage.totalTokens,
      },
    };

    return {
      status: 200,
      jsonBody: responseBody,
    };
  } catch (error) {
    context.error('Chat endpoint error:', error);

    // Return a fallback response that doesn't break the conversation
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'I encountered an issue processing your response. Please try again.',
        // Include fallback message so conversation can continue
        assistantMessage:
          "I'm sorry, I had trouble understanding that. Could you please rephrase or try again?",
      } as ChatResponseBody,
    };
  }
}

// Register the Azure Function
app.http('chat', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'chat',
  handler: chatHandler,
});

// Also register a streaming endpoint for future use
app.http('chatStream', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'chat/stream',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    // Streaming implementation will be added in Phase 2
    // For now, redirect to non-streaming endpoint
    return chatHandler(request, context);
  },
});
