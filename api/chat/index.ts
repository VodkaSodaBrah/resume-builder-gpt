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
  fallbackExtractData,
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
  detectSkillsQuestionPhase,
  SKILLS_SUB_CATEGORY_QUESTIONS,
  SKILLS_DETAIL_QUESTIONS,
  // Multi-entry section imports
  ADD_ANOTHER_QUESTIONS,
  FIRST_DETAIL_QUESTIONS,
  detectAskedForResponsibilities,
  detectProvidedResponsibilities,
  detectAskedAddAnother,
  detectUserWantsAnother,
  detectUserDoneWithEntries,
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

    // Detect actual section from conversation context (frontend tracking may be out of sync)
    // Look at recent messages (last 4) to determine the actual section context
    const recentMessages = messages.slice(-4);
    const recentContext = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
    let actualSection = currentSection;

    // Check if last AI message was a yes/no section question OR a detail question within a section
    const lowerLastMessage = lastAssistantMessage.toLowerCase();

    // Also check recent context for section keywords (helps with generic follow-up questions)
    // NOTE: "organization" alone is too generic (e.g., "organization of the dining area" in job responsibilities)
    // Use more specific patterns like "volunteer organization" or just "volunteer"
    const recentHasVolunteer = recentContext.includes('volunteer') ||
                               recentContext.includes('volunteer organization') ||
                               recentContext.includes('volunteering');
    const recentHasWork = recentContext.includes('company') || recentContext.includes('job title') ||
                          recentContext.includes('worked') || recentContext.includes('work experience') ||
                          recentContext.includes('position') || recentContext.includes('duties') ||
                          recentContext.includes('job') || recentContext.includes('employer');
    const recentHasEducation = recentContext.includes('school') || recentContext.includes('degree') || recentContext.includes('field of study');

    // Volunteering section detection - CHECK FIRST since volunteering questions can contain generic terms
    // that might also match work patterns (like "responsibilities", "what did you do")
    // Uses both current message AND recent context to handle generic follow-up questions
    if (lowerLastMessage.includes('do you have any volunteer') ||
        lowerLastMessage.includes('would you like to include any volunteer') ||
        lowerLastMessage.includes('include any volunteer') ||
        lowerLastMessage.includes('what organization') ||
        lowerLastMessage.includes('volunteer role') ||
        lowerLastMessage.includes('another volunteer') ||
        lowerLastMessage.includes('other volunteer') ||
        lowerLastMessage.includes('as a volunteer') ||
        lowerLastMessage.includes('volunteer experience') ||
        (lowerLastMessage.includes('volunteer') && lowerLastMessage.includes('what did you do')) ||
        (lowerLastMessage.includes('volunteer') && lowerLastMessage.includes('responsibilities')) ||
        (lowerLastMessage.includes('volunteer') && lowerLastMessage.includes('role')) ||
        // Fallback: if recent context has volunteer keywords and this is a generic question
        (recentHasVolunteer && !recentHasWork && !recentHasEducation &&
         (lowerLastMessage.includes('what did you do') || lowerLastMessage.includes('responsibilities') ||
          lowerLastMessage.includes('role') || lowerLastMessage.includes('recorded')))) {
      actualSection = 'volunteering';
    // Work section detection (yes/no OR detail questions)
    // NOTE: Don't include generic terms like "responsibilities" without context
    } else if (lowerLastMessage.includes('do you have any work experience') ||
        lowerLastMessage.includes('would you like to include any work experience') ||
        lowerLastMessage.includes('include any work experience') ||
        lowerLastMessage.includes('what company') ||
        lowerLastMessage.includes('the company') ||
        lowerLastMessage.includes('company where you work') ||
        lowerLastMessage.includes('company you work') ||
        lowerLastMessage.includes('job title') ||
        lowerLastMessage.includes('when did you start') ||
        lowerLastMessage.includes('is it your current') ||
        lowerLastMessage.includes('current job') ||
        lowerLastMessage.includes('still work') ||
        lowerLastMessage.includes('another job') ||
        lowerLastMessage.includes('other jobs') ||
        lowerLastMessage.includes('any other job') ||
        lowerLastMessage.includes('other work experience') ||
        (lowerLastMessage.includes('job') && lowerLastMessage.includes('responsibilities')) ||
        (lowerLastMessage.includes('work') && lowerLastMessage.includes('responsibilities')) ||
        // AI-generated responsibilities detection: when AI offers generated content
        // and the message contains responsibilities without volunteer context
        (!recentHasVolunteer && lowerLastMessage.includes('responsibilities') &&
         (lowerLastMessage.includes('would you like to use') ||
          lowerLastMessage.includes('would you like to include') ||
          lowerLastMessage.includes('from this list') ||
          lowerLastMessage.includes('any of these'))) ||
        // Fallback: if recent context has work keywords and this is a generic question
        (recentHasWork && !recentHasVolunteer && !recentHasEducation &&
         (lowerLastMessage.includes('what did you do') || lowerLastMessage.includes('responsibilities') ||
          lowerLastMessage.includes('recorded')))) {
      actualSection = 'work';
    // Education section detection
    } else if (lowerLastMessage.includes('do you have any education') ||
               lowerLastMessage.includes('would you like to include any education') ||
               lowerLastMessage.includes('include any education') ||
               lowerLastMessage.includes('what school') ||
               lowerLastMessage.includes('what degree') ||
               lowerLastMessage.includes('field of study') ||
               lowerLastMessage.includes('another school') ||
               lowerLastMessage.includes('other education')) {
      actualSection = 'education';
    // Skills section detection - must detect ALL sub-categories
    // technical, certifications, languages, softSkills
    } else if (lowerLastMessage.includes('do you have any technical skills') ||
               lowerLastMessage.includes('software you\'d like to highlight') ||
               lowerLastMessage.includes('programming languages') ||
               lowerLastMessage.includes('software tools') ||
               lowerLastMessage.includes('certifications or licenses') ||
               lowerLastMessage.includes('certifications') ||
               lowerLastMessage.includes('speak any languages') ||
               lowerLastMessage.includes('languages you\'d like to include') ||
               lowerLastMessage.includes('soft skills') ||
               lowerLastMessage.includes('highlight any soft skills') ||
               lowerLastMessage.includes('personal strengths')) {
      actualSection = 'skills';
    // References section detection
    } else if (lowerLastMessage.includes('add professional references') ||
               lowerLastMessage.includes('would you like to add references') ||
               lowerLastMessage.includes('reference name') ||
               lowerLastMessage.includes('reference contact')) {
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

    context.log(`DEBUG: currentSection=${currentSection}, userMessage=${userMessage.substring(0, 50)}, wantsToExport=${wantsToExport}`);

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
    let extractedData = parseExtractedData(aiResult.response);
    context.log(`DEBUG: AI raw response (first 500 chars): ${aiResult.response.substring(0, 500)}`);
    context.log(`DEBUG: extractedData from AI: ${JSON.stringify(extractedData)}`);

    // FALLBACK: If AI didn't include extracted_data tag, extract programmatically
    if (!extractedData) {
      const lastAssistantMsg = messages.filter(m => m.role === 'assistant').pop()?.content || '';
      const fallback = fallbackExtractData(userMessage, actualSection, lastAssistantMsg);
      if (fallback.fields.length > 0 || fallback.suggestedSection) {
        extractedData = {
          fields: fallback.fields,
          suggestedSection: fallback.suggestedSection,
          followUpNeeded: false,
          specialContent: null,
          isComplete: false,
        };
        context.log(`DEBUG: Used fallback extraction: ${JSON.stringify(extractedData)}`);
      }
    }

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
    // SKILLS SUB-CATEGORY ENFORCEMENT - Two-phase flow
    // Phase 1 (gate): Ask yes/no for each sub-category
    // Phase 2 (detail): If yes, ask for specific skills before moving on
    // NOTE: We do NOT check userSaidNoToSection here because saying "no" to a
    // sub-category (e.g., technical skills) should move to next sub-category,
    // not skip the entire skills section.
    // =========================================================================
    if (actualSection === 'skills') {
      const lastAISubCategory = detectSkillsSubCategory(lastAssistantMessage);
      const lastAIPhase = detectSkillsQuestionPhase(lastAssistantMessage);
      context.log(`DEBUG: Skills - subCategory=${lastAISubCategory}, phase=${lastAIPhase}`);

      if (lastAISubCategory && lastAIPhase) {
        const userAnswer = detectSkillsSubCategoryAnswer(userMessage);
        context.log(`DEBUG: User answer type: ${userAnswer}`);

        if (lastAIPhase === 'gate') {
          // User just answered a gate (yes/no) question
          if (userAnswer === 'yes') {
            // User said YES - ask for details (SAME sub-category)
            const detailQuestion = SKILLS_DETAIL_QUESTIONS[lastAISubCategory];
            cleanResponse = `Great! ${detailQuestion}`;
            followUpNeeded = true;
            context.log(`User said YES to ${lastAISubCategory}, asking for details`);
          } else if (userAnswer === 'no') {
            // User said NO - move to NEXT sub-category's gate question
            const nextSubCategory = getNextSkillsSubCategory(lastAISubCategory);

            if (nextSubCategory === 'done') {
              // All sub-categories complete, move to references
              suggestedSection = 'references';
              cleanResponse = "No problem! **Would you like to add professional references? (Yes or No)**";
              context.log('All skills sub-categories done, moving to references');
            } else {
              // Ask next sub-category gate question
              const nextGateQuestion = SKILLS_SUB_CATEGORY_QUESTIONS[nextSubCategory];
              cleanResponse = `No problem! ${nextGateQuestion}`;
              followUpNeeded = true;
              context.log(`Moving to next skills sub-category: ${nextSubCategory}`);
            }
          }
        } else if (lastAIPhase === 'detail') {
          // User just provided skill details - move to NEXT sub-category's gate question
          const nextSubCategory = getNextSkillsSubCategory(lastAISubCategory);

          if (nextSubCategory === 'done') {
            // All sub-categories complete, move to references
            suggestedSection = 'references';
            cleanResponse = "Great! **Would you like to add professional references? (Yes or No)**";
            context.log('All skills sub-categories done, moving to references');
          } else {
            // Ask next sub-category gate question
            const nextGateQuestion = SKILLS_SUB_CATEGORY_QUESTIONS[nextSubCategory];
            cleanResponse = `Great, I've recorded those! ${nextGateQuestion}`;
            followUpNeeded = true;
            context.log(`Skills details collected, moving to: ${nextSubCategory}`);
          }
        }
      }
    }

    // =========================================================================
    // MULTI-ENTRY SECTION ENFORCEMENT (Work, Education, Volunteering)
    // Ensures "add another?" is asked after each complete entry
    // =========================================================================
    const multiEntrySections: QuestionCategory[] = ['work', 'education', 'volunteering'];
    console.log(`[MULTI-ENTRY] Checking section: actualSection=${actualSection}, userSaidNoToSection=${userSaidNoToSection}`);
    if (multiEntrySections.includes(actualSection) && !userSaidNoToSection) {
      const askedResponsibilities = detectAskedForResponsibilities(lastAssistantMessage);
      const providedResponsibilities = detectProvidedResponsibilities(userMessage);
      const askedAddAnother = detectAskedAddAnother(lastAssistantMessage, actualSection);

      console.log(`[MULTI-ENTRY] askedResp=${askedResponsibilities}, providedResp=${providedResponsibilities}, askedAddAnother=${askedAddAnother}`);
      console.log(`[MULTI-ENTRY] lastAssistantMessage (first 200 chars): ${lastAssistantMessage.substring(0, 200)}`);
      console.log(`[MULTI-ENTRY] userMessage: ${userMessage}`);
      context.log(`DEBUG: Multi-entry - askedResp=${askedResponsibilities}, providedResp=${providedResponsibilities}, askedAddAnother=${askedAddAnother}`);

      // Case 1: AI asked for responsibilities and user provided them
      // Force the "add another?" question
      if (askedResponsibilities && providedResponsibilities) {
        const addAnotherQ = ADD_ANOTHER_QUESTIONS[actualSection];
        if (addAnotherQ && !detectAskedAddAnother(cleanResponse, actualSection)) {
          // Build response with summary + add another question
          cleanResponse = `Great! I've recorded that information.\n\n${addAnotherQ}`;
          followUpNeeded = true;
          context.log(`Forced "add another?" question for ${actualSection}`);
        }
      }

      // Case 2: AI asked "add another?" and user said YES
      // Start collecting new entry
      if (askedAddAnother && detectUserWantsAnother(userMessage)) {
        const firstQ = FIRST_DETAIL_QUESTIONS[actualSection];
        if (firstQ) {
          cleanResponse = `Great! ${firstQ}`;
          followUpNeeded = true;
          context.log(`User wants another ${actualSection} entry`);
        }
      }

      // Case 3: AI asked "add another?" and user said NO
      // Move to next section
      if (askedAddAnother && detectUserDoneWithEntries(userMessage)) {
        const nextSectionMap: Partial<Record<QuestionCategory, QuestionCategory>> = {
          work: 'education',
          education: 'volunteering',
          volunteering: 'skills',
        };
        const nextSection = nextSectionMap[actualSection];
        if (nextSection && SECTION_TRANSITION_MESSAGES[actualSection]) {
          suggestedSection = nextSection;
          cleanResponse = SECTION_TRANSITION_MESSAGES[actualSection]!;
          context.log(`User done with ${actualSection}, moving to ${nextSection}`);
        }
      }
    }

    // =========================================================================
    // SMART FIELD SKIPPING - Skip redundant education questions
    // When user provides "degree in field", skip the separate "field of study" question
    // =========================================================================
    if (actualSection === 'education') {
      const lowerCleanResponse = cleanResponse.toLowerCase();

      // Check if NEW AI response is asking about field of study
      // Must have a question mark AND not be our own skip confirmation message
      const isAskingFieldOfStudy = (lowerCleanResponse.includes('study') ||
                                    lowerCleanResponse.includes('major') ||
                                    lowerCleanResponse.includes('field')) &&
                                   lowerCleanResponse.includes('?') &&
                                   !lowerCleanResponse.includes('great, i have');

      // Check BOTH currentResumeData AND extractedFields from THIS request
      const educationData = currentResumeData.education as Array<{ fieldOfStudy?: string }> | undefined;
      let existingFieldOfStudy = educationData?.[0]?.fieldOfStudy;

      // Also check extractedFields (fields extracted in THIS request)
      if (!existingFieldOfStudy) {
        const fieldFromExtraction = extractedFields.find(f => f.path === 'education[0].fieldOfStudy');
        if (fieldFromExtraction) {
          existingFieldOfStudy = fieldFromExtraction.value as string;
        }
      }

      if (isAskingFieldOfStudy && existingFieldOfStudy) {
        // Field was already provided - skip to graduation year question
        cleanResponse = `Great! What year did you graduate from your program? (Or are you still studying?)`;
        context.log(`Skipped fieldOfStudy question - already extracted: ${existingFieldOfStudy}`);
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
      isComplete: wantsToExport || extractedData?.isComplete || false,
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
