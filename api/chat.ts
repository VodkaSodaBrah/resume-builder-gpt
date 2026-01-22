/**
 * Conversational AI Chat Endpoint (Vercel Serverless Function)
 * Handles natural language resume building with intelligent field extraction
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { getConversationCompletion, ConversationMessage } from './_lib/openai';
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
  detectUserSaidNoToSection,
  detectUserSaidYesToSection,
  validateAIResponse,
  SECTION_TRANSITION_MESSAGES,
  SECTION_ADVANCE_MAP,
  SECTION_FLAG_MAP,
  detectSkillsSubCategory,
  getNextSkillsSubCategory,
  detectSkillsSubCategoryAnswer,
  detectSkillsQuestionPhase,
  SKILLS_SUB_CATEGORY_QUESTIONS,
  SKILLS_DETAIL_QUESTIONS,
  ADD_ANOTHER_QUESTIONS,
  FIRST_DETAIL_QUESTIONS,
  detectAskedForResponsibilities,
  detectProvidedResponsibilities,
  detectAskedAddAnother,
  detectUserWantsAnother,
  detectUserDoneWithEntries,
} from './_lib/conversationAI';
import { getInlineEmailGuide } from './_lib/emailGuide';
import { securityCheck } from './_lib/vercel-security';

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

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
): Promise<void> {
  // Security check (handles CORS and origin validation)
  if (securityCheck(req, res)) {
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  const startTime = Date.now();

  try {
    const body = req.body;
    const validation = chatRequestSchema.safeParse(body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors.map((e) => e.message).join(', '),
      } as ChatResponseBody);
      return;
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

    // Detect actual section from conversation context
    const recentMessages = messages.slice(-4);
    const recentContext = recentMessages.map(m => m.content.toLowerCase()).join(' ');
    const lastAssistantMessage = messages.filter(m => m.role === 'assistant').pop()?.content || '';
    let actualSection = currentSection;

    const lowerLastMessage = lastAssistantMessage.toLowerCase();

    const recentHasVolunteer = recentContext.includes('volunteer') ||
                               recentContext.includes('volunteer organization') ||
                               recentContext.includes('volunteering');
    const recentHasWork = recentContext.includes('company') || recentContext.includes('job title') ||
                          recentContext.includes('worked') || recentContext.includes('work experience') ||
                          recentContext.includes('position') || recentContext.includes('duties') ||
                          recentContext.includes('job') || recentContext.includes('employer');
    const recentHasEducation = recentContext.includes('school') || recentContext.includes('degree') || recentContext.includes('field of study');

    // Section detection logic
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
        (recentHasVolunteer && !recentHasWork && !recentHasEducation &&
         (lowerLastMessage.includes('what did you do') || lowerLastMessage.includes('responsibilities') ||
          lowerLastMessage.includes('role') || lowerLastMessage.includes('recorded')))) {
      actualSection = 'volunteering';
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
        (!recentHasVolunteer && lowerLastMessage.includes('responsibilities') &&
         (lowerLastMessage.includes('would you like to use') ||
          lowerLastMessage.includes('would you like to include') ||
          lowerLastMessage.includes('from this list') ||
          lowerLastMessage.includes('any of these'))) ||
        (recentHasWork && !recentHasVolunteer && !recentHasEducation &&
         (lowerLastMessage.includes('what did you do') || lowerLastMessage.includes('responsibilities') ||
          lowerLastMessage.includes('recorded')))) {
      actualSection = 'work';
    } else if (lowerLastMessage.includes('do you have any education') ||
               lowerLastMessage.includes('would you like to include any education') ||
               lowerLastMessage.includes('include any education') ||
               lowerLastMessage.includes('what school') ||
               lowerLastMessage.includes('what degree') ||
               lowerLastMessage.includes('field of study') ||
               lowerLastMessage.includes('another school') ||
               lowerLastMessage.includes('other education')) {
      actualSection = 'education';
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
    } else if (lowerLastMessage.includes('add professional references') ||
               lowerLastMessage.includes('would you like to add references') ||
               lowerLastMessage.includes('reference name') ||
               lowerLastMessage.includes('reference contact')) {
      actualSection = 'references';
    }

    console.log(`DEBUG: currentSection from frontend=${currentSection}, actualSection detected=${actualSection}`);

    const userSaidNoToSection = detectUserSaidNoToSection(
      userMessage,
      actualSection,
      0
    );

    const userSaidYesToSection = detectUserSaidYesToSection(
      userMessage,
      actualSection,
      0
    );

    console.log(`DEBUG: userMessage="${userMessage}", currentSection="${currentSection}", followUpCount=${followUpCount}`);
    console.log(`DEBUG: userSaidNoToSection=${userSaidNoToSection}, userSaidYesToSection=${userSaidYesToSection}`);

    const contradiction = userSaidNoToSection
      ? { isContradiction: false, section: null, existingData: null, existingDataSummary: null }
      : detectContradiction(userMessage, currentResumeData);

    console.log(`DEBUG: contradiction.isContradiction=${contradiction.isContradiction}`);

    const wantsToExport =
      (currentSection === 'review' || currentSection === 'complete') &&
      detectExportIntent(userMessage);

    console.log(`DEBUG: currentSection=${currentSection}, userMessage=${userMessage.substring(0, 50)}, wantsToExport=${wantsToExport}`);

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

    if (userSaidYesToSection) {
      additionalContext += `

## USER SAID YES - ASK FOR DETAILS:
The user just said "yes" to the ${actualSection} section question.
Now ask them for the specific details for their first ${actualSection} entry.
DO NOT ask the yes/no question again - they already answered it.`;
    }

    const systemPrompt = buildSystemPrompt(currentSection, language, additionalContext);

    const conversationMessages: ConversationMessage[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    conversationMessages.push({
      role: 'user',
      content: userMessage,
    });

    const aiResult = await getConversationCompletion(
      systemPrompt,
      conversationMessages,
      0.7,
      1000
    );

    let extractedData = parseExtractedData(aiResult.response);
    console.log(`DEBUG: AI raw response (first 500 chars): ${aiResult.response.substring(0, 500)}`);
    console.log(`DEBUG: extractedData from AI: ${JSON.stringify(extractedData)}`);

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
        console.log(`DEBUG: Used fallback extraction: ${JSON.stringify(extractedData)}`);
      }
    }

    let cleanResponse = cleanAIResponse(aiResult.response);

    const responseValidation = validateAIResponse(
      cleanResponse,
      currentSection,
      followUpCount,
      userSaidNoToSection,
      userSaidYesToSection
    );

    if (!responseValidation.isValid) {
      console.log(`AI response validation failed: ${responseValidation.violation}`);
      if (responseValidation.correctedResponse) {
        cleanResponse = responseValidation.correctedResponse;
      }
    }

    if (userSaidNoToSection && SECTION_TRANSITION_MESSAGES[actualSection]) {
      cleanResponse = SECTION_TRANSITION_MESSAGES[actualSection]!;
      console.log(`User said no to ${actualSection}, using transition message`);
    }

    let suggestedSection = extractedData?.suggestedSection || null;
    console.log(`DEBUG: extractedData.suggestedSection=${extractedData?.suggestedSection}, final suggestedSection=${suggestedSection}`);

    if (userSaidNoToSection && !suggestedSection) {
      suggestedSection = SECTION_ADVANCE_MAP[actualSection] || null;
      console.log(`Auto-advancing from ${actualSection} to ${suggestedSection}`);
    }

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

    let extractedFields = extractedData?.fields || [];
    if (userSaidNoToSection && SECTION_FLAG_MAP[actualSection]) {
      extractedFields = [
        ...extractedFields,
        {
          path: SECTION_FLAG_MAP[actualSection]!,
          value: false,
          confidence: 0.95,
        },
      ];
      console.log(`Added ${SECTION_FLAG_MAP[actualSection]} = false to extracted fields`);
    }

    let followUpNeeded = extractedData?.followUpNeeded || false;
    if (userSaidYesToSection) {
      followUpNeeded = true;
      console.log(`User said yes to ${actualSection}, forcing followUpNeeded=true`);
    }

    // Skills sub-category enforcement
    if (actualSection === 'skills') {
      const lastAISubCategory = detectSkillsSubCategory(lastAssistantMessage);
      const lastAIPhase = detectSkillsQuestionPhase(lastAssistantMessage);
      console.log(`DEBUG: Skills - subCategory=${lastAISubCategory}, phase=${lastAIPhase}`);

      if (lastAISubCategory && lastAIPhase) {
        const userAnswer = detectSkillsSubCategoryAnswer(userMessage);
        console.log(`DEBUG: User answer type: ${userAnswer}`);

        if (lastAIPhase === 'gate') {
          if (userAnswer === 'yes') {
            const detailQuestion = SKILLS_DETAIL_QUESTIONS[lastAISubCategory];
            cleanResponse = `Great! ${detailQuestion}`;
            followUpNeeded = true;
            console.log(`User said YES to ${lastAISubCategory}, asking for details`);
          } else if (userAnswer === 'no') {
            const nextSubCategory = getNextSkillsSubCategory(lastAISubCategory);

            if (nextSubCategory === 'done') {
              suggestedSection = 'references';
              cleanResponse = "No problem! **Would you like to add professional references? (Yes or No)**";
              console.log('All skills sub-categories done, moving to references');
            } else {
              const nextGateQuestion = SKILLS_SUB_CATEGORY_QUESTIONS[nextSubCategory];
              cleanResponse = `No problem! ${nextGateQuestion}`;
              followUpNeeded = true;
              console.log(`Moving to next skills sub-category: ${nextSubCategory}`);
            }
          }
        } else if (lastAIPhase === 'detail') {
          const nextSubCategory = getNextSkillsSubCategory(lastAISubCategory);

          if (nextSubCategory === 'done') {
            suggestedSection = 'references';
            cleanResponse = "Great! **Would you like to add professional references? (Yes or No)**";
            console.log('All skills sub-categories done, moving to references');
          } else {
            const nextGateQuestion = SKILLS_SUB_CATEGORY_QUESTIONS[nextSubCategory];
            cleanResponse = `Great, I've recorded those! ${nextGateQuestion}`;
            followUpNeeded = true;
            console.log(`Skills details collected, moving to: ${nextSubCategory}`);
          }
        }
      }
    }

    // Multi-entry section enforcement
    const multiEntrySections: QuestionCategory[] = ['work', 'education', 'volunteering'];
    console.log(`[MULTI-ENTRY] Checking section: actualSection=${actualSection}, userSaidNoToSection=${userSaidNoToSection}`);
    if (multiEntrySections.includes(actualSection) && !userSaidNoToSection) {
      const askedResponsibilities = detectAskedForResponsibilities(lastAssistantMessage);
      const providedResponsibilities = detectProvidedResponsibilities(userMessage);
      const askedAddAnother = detectAskedAddAnother(lastAssistantMessage, actualSection);

      console.log(`[MULTI-ENTRY] askedResp=${askedResponsibilities}, providedResp=${providedResponsibilities}, askedAddAnother=${askedAddAnother}`);
      console.log(`[MULTI-ENTRY] lastAssistantMessage (first 200 chars): ${lastAssistantMessage.substring(0, 200)}`);
      console.log(`[MULTI-ENTRY] userMessage: ${userMessage}`);

      if (askedResponsibilities && providedResponsibilities) {
        const addAnotherQ = ADD_ANOTHER_QUESTIONS[actualSection];
        if (addAnotherQ && !detectAskedAddAnother(cleanResponse, actualSection)) {
          cleanResponse = `Great! I've recorded that information.\n\n${addAnotherQ}`;
          followUpNeeded = true;
          console.log(`Forced "add another?" question for ${actualSection}`);
        }
      }

      if (askedAddAnother && detectUserWantsAnother(userMessage)) {
        const firstQ = FIRST_DETAIL_QUESTIONS[actualSection];
        if (firstQ) {
          cleanResponse = `Great! ${firstQ}`;
          followUpNeeded = true;
          console.log(`User wants another ${actualSection} entry`);
        }
      }

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
          console.log(`User done with ${actualSection}, moving to ${nextSection}`);
        }
      }
    }

    // Smart field skipping for education
    if (actualSection === 'education') {
      const lowerCleanResponse = cleanResponse.toLowerCase();

      const isAskingFieldOfStudy = (lowerCleanResponse.includes('study') ||
                                    lowerCleanResponse.includes('major') ||
                                    lowerCleanResponse.includes('field')) &&
                                   lowerCleanResponse.includes('?') &&
                                   !lowerCleanResponse.includes('great, i have');

      const educationData = currentResumeData.education as Array<{ fieldOfStudy?: string }> | undefined;
      let existingFieldOfStudy = educationData?.[0]?.fieldOfStudy;

      if (!existingFieldOfStudy) {
        const fieldFromExtraction = extractedFields.find(f => f.path === 'education[0].fieldOfStudy');
        if (fieldFromExtraction) {
          existingFieldOfStudy = fieldFromExtraction.value as string;
        }
      }

      if (isAskingFieldOfStudy && existingFieldOfStudy) {
        cleanResponse = `Great! What year did you graduate from your program? (Or are you still studying?)`;
        console.log(`Skipped fieldOfStudy question - already extracted: ${existingFieldOfStudy}`);
      }
    }

    let specialContent: ChatResponseBody['specialContent'] = null;

    if (needsEmailHelp || extractedData?.specialContent === 'email_guide') {
      specialContent = {
        type: 'email_guide',
        content: getInlineEmailGuide(language),
        expandable: true,
      };
    }

    const confidence =
      extractedData?.fields && extractedData.fields.length > 0
        ? extractedData.fields.reduce((sum, f) => sum + f.confidence, 0) /
          extractedData.fields.length
        : 0.5;

    const responseTime = Date.now() - startTime;
    console.log(`Chat response generated in ${responseTime}ms`);

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

    res.status(200).json(responseBody);
  } catch (error) {
    console.error('Chat endpoint error:', error);

    res.status(500).json({
      success: false,
      error: 'I encountered an issue processing your response. Please try again.',
      assistantMessage:
        "I'm sorry, I had trouble understanding that. Could you please rephrase or try again?",
    } as ChatResponseBody);
  }
}
