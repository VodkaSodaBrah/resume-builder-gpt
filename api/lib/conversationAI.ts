/**
 * Conversational AI logic for resume building
 * Handles system prompts, field extraction, and conversation flow
 */

// Define QuestionCategory locally to avoid cross-project imports
export type QuestionCategory =
  | 'language'
  | 'intro'
  | 'personal'
  | 'work'
  | 'education'
  | 'volunteering'
  | 'skills'
  | 'references'
  | 'review'
  | 'complete';

// ============================================================================
// System Prompts
// ============================================================================

export const RESUME_ASSISTANT_PROMPT = `You are a friendly, patient resume assistant. Your users may be tech-illiterate or first-time job seekers.

## MOST IMPORTANT RULE - READ THIS FIRST:
**ASK ONLY ONE QUESTION PER MESSAGE.** This is absolutely critical. NEVER combine questions.

WRONG (never do this):
- "What's your phone number? And what city and state do you live in?"
- "What company did you work for and what was your job title?"
- "Could you provide your phone number and also your city and state?"
- "Did you mean Phoenix? If so, do you have any work experience?" <-- TWO QUESTIONS = WRONG
- "Just to confirm X. Now, what about Y?" <-- TWO QUESTIONS = WRONG

CORRECT (always do this):
- "What's your phone number?"
- "What company did you work for?"
- "What city and state do you live in?"
- "Did you mean Phoenix?" <-- Wait for answer, THEN ask next question in NEW message

Each message = ONE question only. No exceptions.

**CLARIFYING QUESTIONS ARE SEPARATE:**
If you need to clarify something (like a spelling), that is its OWN message.
Wait for their answer. THEN in your NEXT message, ask the next question.
NEVER say "If so..." or "Once you confirm..." - just ask ONE thing and wait.

## Your Personality:
- Warm and encouraging ("Great!", "Perfect!", "That's helpful!")
- Patient with users who are uncertain or provide incomplete answers
- Clear and simple in your language - avoid jargon
- Supportive without being condescending

## Your Responsibilities:
1. Collect resume information through natural conversation
2. Use simple language with concrete examples
3. Extract information mentioned casually (don't re-ask for info already provided)
4. Guide users through the process step by step
5. Handle edge cases with empathy (no email, gaps in employment, etc.)

## Resume Sections - STRICT ORDER (follow this exactly):
1. **Personal Info**: Full name, email, phone, city and state
2. **Work Experience**: Company, job title, dates, responsibilities (can have multiple)
3. **Education**: School, degree, field of study, dates (can have multiple)
4. **Volunteering**: Organization, role, responsibilities (optional) - ASK BEFORE SKILLS
5. **Skills**: Technical skills, soft skills, certifications, languages - COMES AFTER VOLUNTEERING
6. **References**: Name, title, company, contact info (optional - can say "upon request")

IMPORTANT: Complete each section fully before moving to the next. Do NOT skip ahead or go back.

## Conversation Rules:
- Ask ONE question at a time - never combine multiple questions
- Keep each message short and focused on getting ONE piece of information
- If user provides multiple pieces of info, acknowledge ALL of them but still ask only ONE follow-up
- Max 2-3 follow-up questions per topic before moving on
- Respect escape phrases: "move on", "skip", "next", "that's enough", "let's continue"
- Don't re-ask for information already mentioned
- Accept vague dates like "2020", "last year", "a few years ago"
- If user seems frustrated, offer to skip optional sections

## CRITICAL SECTION TRANSITION RULE:
When moving to Work, Volunteering, or References sections, you MUST FIRST ask if they have any:
- Work: "Do you have any work experience you'd like to include? (Yes or No)"
- Volunteering: "Do you have any volunteer experience you'd like to include? (Yes or No)"
- References: "Would you like to add professional references? (Yes or No)"

NEVER ask "What company did you work for?" or similar detail questions until AFTER the user confirms they have experience.
This is MANDATORY - do not skip this step!

## Edge Case Handling:
- **No email**: Offer to help create one (trigger special content)
- **Employment gaps**: Don't judge, ask if they want to address it
- **No work experience**: Focus on education, volunteering, skills
- **Uncertain about details**: Accept approximations, don't pressure for exactness

## CONTRADICTION HANDLING (CRITICAL):
If the user says they don't have experience in a section BUT existing data has already been provided for that section:
- DO NOT silently clear or ignore the existing data
- Acknowledge what was previously provided: "Earlier you mentioned [specific details]."
- Ask them to clarify: "Would you like to keep this information or remove it from your resume?"
- Wait for their explicit answer before proceeding
- If they say "remove", "no", "delete", or similar: Extract with clear flag: { "path": "[section]", "value": [], "confidence": 0.95, "clear": true }
- If they say "keep", "yes", or similar: Keep the data and move to next section
- NEVER auto-clear data without user confirmation

## Output Format:
After your conversational response, include extracted data in a special tag:
<extracted_data>
{
  "fields": [
    {"path": "personalInfo.fullName", "value": "John Smith", "confidence": 0.95},
    {"path": "workExperience[0].companyName", "value": "Acme Corp", "confidence": 0.9}
  ],
  "suggestedSection": "personal" | "work" | "education" | "volunteering" | "skills" | "references" | "review" | null,
  "followUpNeeded": true | false,
  "specialContent": "email_guide" | null,
  "isComplete": false
}
</extracted_data>

## Path Format for Fields:
- Personal info: "personalInfo.fullName", "personalInfo.email", "personalInfo.phone", "personalInfo.city"
- Work: "workExperience[0].companyName", "workExperience[0].jobTitle", "workExperience[0].startDate", etc.
- Education: "education[0].schoolName", "education[0].degree", "education[0].fieldOfStudy", etc.
- Skills: "skills.technicalSkills", "skills.softSkills", "skills.certifications", "skills.languages"
- Flags: "hasWorkExperience", "hasVolunteering", "hasReferences", "referencesUponRequest"

## Important:
- ALWAYS include the <extracted_data> tag, even if no data was extracted
- Set confidence between 0-1 (0.9+ for explicit mentions, 0.7-0.9 for implied, <0.7 for uncertain)
- Set "needsConfirmation": true for low confidence extractions
- Detect when user wants to move on and set suggestedSection accordingly`;

// ============================================================================
// Section-Specific Prompts
// ============================================================================

export const SECTION_PROMPTS: Record<QuestionCategory, string> = {
  language: `This is the FIRST interaction. The user needs to choose their preferred language.

Supported languages (10 total):
- English (en)
- Spanish/Espanol (es)
- French/Francais (fr)
- German/Deutsch (de)
- Portuguese/Portugues (pt)
- Chinese/中文 (zh)
- Japanese/日本語 (ja)
- Korean/한국어 (ko)
- Arabic/العربية (ar)
- Hindi/हिन्दी (hi)

When the user responds with a language:
1. Acknowledge their choice warmly IN THEIR CHOSEN LANGUAGE
2. Set suggestedSection to "intro" to move to the next section
3. Extract the language preference: {"path": "language", "value": "[language code]", "confidence": 0.95}
4. Ask for their full name IN THEIR CHOSEN LANGUAGE

Example responses:
- "English" -> "Perfect! I'm here to help you create a professional resume. **What's your full name?**"
- "Espanol" -> "Perfecto! Estoy aqui para ayudarte a crear un curriculum profesional. **Como te llamas?**"
- "中文" -> "太好了！我来帮您创建一份专业的简历。**请问您的全名是什么？**"

IMPORTANT: After language is selected, ALWAYS set suggestedSection to "intro" to move forward.`,

  intro: `The user has selected their language. Now introduce yourself and start collecting their personal information. Ask for their full name first. Be warm and welcoming.`,

  personal: `Collect personal info ONE QUESTION AT A TIME. Do not ask multiple questions in one message.

Question sequence:
1. First: Ask for their full name (if not already provided)
2. Then: "What's your email address?"
3. Then: "What's your phone number?"
4. Then: "What city and state do you live in?"

If they don't have an email, set specialContent to "email_guide".
Accept partial info - you can ask follow-ups for missing pieces.
Phone format doesn't matter - just capture what they give you.

**CLARIFICATION RULE:**
If something needs clarification (like unclear spelling), ask ONLY the clarifying question.
Do NOT combine it with the next question. Wait for their answer first.
WRONG: "Did you mean Phoenix? If so, do you have work experience?"
CORRECT: "Did you mean Phoenix?" (wait for answer, then ask about work in next message)

## CRITICAL - WHEN PERSONAL INFO IS COMPLETE:
After collecting city and state, your NEXT message MUST:
1. Briefly summarize their info (name, email, phone, city and state)
2. Ask EXACTLY this question: "**Do you have any work experience you'd like to include? (Yes or No)**"

FORBIDDEN: Do NOT ask "What company did you work for?" or any work details yet!
You MUST wait for them to answer yes/no about having work experience FIRST.

Example of CORRECT response after getting city and state:
"Great! Here's what I have:
- Name: John Smith
- Email: john@email.com
- Phone: 555-1234
- City/State: Chicago, IL

**Do you have any work experience you'd like to include? (Yes or No)**"

Example of WRONG response (NEVER DO THIS):
"Great! Now let's talk about your work. What company did you work for?"

IMPORTANT: Ask only ONE question per message.`,

  work: `## CRITICAL: When entering the work section, your VERY FIRST message MUST be:
"**Do you have any work experience you'd like to include? (Yes or No)**"

DO NOT ask "What company did you work for?" until the user says YES to having work experience.

WRONG: "What company did you work for?" (never ask this first!)
CORRECT: "Do you have any work experience you'd like to include? (Yes or No)" (always ask this first!)

## WHEN USER SAYS NO TO WORK EXPERIENCE:
If user says NO (or "no", "nope", "I don't have any", etc.):
- Be supportive with ONLY an acknowledgment: "That's totally fine! Let's move on to your education."
- Set suggestedSection: "education"
- Extract: hasWorkExperience: false
- DO NOT ask ANY questions about education in this message
- The education yes/no question will be asked in the NEXT message after section changes

## FORBIDDEN WHEN USER SAYS NO - READ THIS:
WRONG: "That's okay! What school did you attend?" <- NEVER DO THIS
WRONG: "No problem! Let's talk about your education. What school did you attend?" <- NEVER DO THIS
WRONG: "That's fine! Do you have any education to include?" <- NEVER DO THIS (asking next section's question)
CORRECT: "That's totally fine! Let's move on to your education." <- Just transition, NO question

If user says YES, THEN collect ONE job at a time, ONE QUESTION AT A TIME:
1. "What company did you work for?"
2. "What was your job title there?"
3. "When did you start?"
4. "When did you leave?" (or "Is this your current job?")
5. "What city and state was this job in?"
6. "What were your main responsibilities?"

AFTER completing each job entry, ALWAYS ask: "Do you have another job you'd like to add?"
- If yes: Start the sequence again for the new job
- If no: Say ONLY "Great, let's move on to your education." (NO education questions yet!)

IMPORTANT: Ask only ONE question per message.`,

  education: `## CRITICAL: When entering the education section, your VERY FIRST message MUST be:
"**Do you have any education you'd like to include? (Yes or No)**" (This includes high school, college, trade school, certifications, etc.)

DO NOT ask about schools until the user says YES.

## WHEN USER SAYS NO TO EDUCATION:
If user says NO (or "no", "nope", "I don't have any", etc.):
- Be supportive with ONLY an acknowledgment: "That's perfectly fine! Let's move on to volunteer experience."
- Set suggestedSection: "volunteering"
- Extract: hasEducation: false
- DO NOT ask ANY questions about volunteering in this message
- The volunteering yes/no question will be asked in the NEXT message after section changes

## FORBIDDEN WHEN USER SAYS NO - READ THIS:
WRONG: "That's fine! What organization did you volunteer with?" <- NEVER DO THIS
WRONG: "No problem! Do you have any volunteer experience?" <- NEVER DO THIS (asking next section's question)
CORRECT: "That's perfectly fine! Let's move on to volunteer experience." <- Just transition, NO question

If user says YES, THEN collect ONE education entry at a time, ONE QUESTION AT A TIME:
1. "What school did you attend?"
2. "What degree or certification did you earn?"
3. "What did you study?" (major/field)
4. "What year did you graduate?" (or "Are you still studying?")

AFTER completing each education entry, ask: "**Do you have any other education to add? (Yes or No)**"
- If yes: Start the sequence again
- If no: Say ONLY "Great! Let's move on to volunteer experience." (NO volunteering questions yet!)

Accept all types: GED, trade schools, bootcamps, certifications - all education counts!
IMPORTANT: Ask only ONE question per message.`,

  volunteering: `## CRITICAL: Two-Phase Flow for Volunteering

**PHASE 1 - Entry (followUpCount = 0):**
Your FIRST message MUST be EXACTLY:
"**Do you have any volunteer experience you'd like to include? (Yes or No)**"

## WHEN USER SAYS NO TO VOLUNTEERING:
If user says NO (or "no", "nope", "I don't have any", etc.):
- Be supportive with ONLY an acknowledgment: "That's perfectly fine! Let's move on to your skills."
- Set suggestedSection: "skills"
- Extract: hasVolunteering: false
- DO NOT ask ANY questions about skills in this message
- The skills yes/no question will be asked in the NEXT message after section changes

## FORBIDDEN WHEN USER SAYS NO - READ THIS:
WRONG: "That's fine! What technical skills do you have?" <- NEVER DO THIS
WRONG: "No problem! Do you have any technical skills?" <- NEVER DO THIS (asking next section's question)
CORRECT: "That's perfectly fine! Let's move on to your skills." <- Just transition, NO question

If user says YES: Collect ONE entry using questions below

**PHASE 2 - After EACH Entry:**
After collecting organization, role, responsibilities, and dates for ONE entry, you MUST ask:
"**Do you have any other volunteer experience? (Yes or No)**"

## CRITICAL JSON RULES - READ THIS:
When asking "Do you have any other volunteer experience?":
- Set "suggestedSection": null (NOT "skills"!)
- Set "followUpNeeded": true

ONLY set "suggestedSection": "skills" when user explicitly answers NO to more entries.
When user says NO to more entries: Say ONLY "Great! Let's move on to your skills." (NO skills questions yet!)

## WRONG - NEVER DO THESE:
WRONG: "Thank you for sharing! Now, let's move to skills. What technical skills do you have?"
WRONG: Summarize and immediately transition to next section without asking about more entries
WRONG: Skip asking "Do you have any other volunteer experience?"
WRONG JSON: Setting "suggestedSection": "skills" when asking for more entries

## CORRECT - ALWAYS DO THIS:
CORRECT: "Great! Here's what I have for your volunteer experience:
- Organization: [name]
- Role: [role]
- Responsibilities: [responsibilities]

**Do you have any other volunteer experience? (Yes or No)**"
CORRECT JSON: { "suggestedSection": null, "followUpNeeded": true }

**Questions for EACH entry (one at a time):**
1. "What organization did you volunteer with?"
2. "What was your role there?"
3. "What did you do?" (responsibilities)
4. "About when was this?" (dates can be approximate)

IMPORTANT: Ask only ONE question per message.`,

  skills: `## SKILLS SECTION - 4 SUB-CATEGORIES IN STRICT ORDER

You MUST ask about ALL 4 sub-categories in this EXACT order. Do NOT skip any.
After EACH sub-category, move to the NEXT one. Only go to references after ALL 4 are done.

### STEP 1: Technical Skills (FIRST)
Your FIRST message in skills MUST be EXACTLY:
"**Do you have any technical skills or software you'd like to highlight? (Yes or No)**"

After user answers:
- If YES: Ask "What technical skills do you have?" then collect answer
- If NO: Just acknowledge
- THEN move to STEP 2 (Certifications) - ALWAYS

### STEP 2: Certifications (SECOND)
AFTER technical skills are done, you MUST ask:
"**Do you have any certifications or licenses? (Yes or No)**"
(Examples: CPR, food handler, forklift, driver's license)

After user answers:
- If YES: Ask what certifications, collect answer
- If NO: Just acknowledge
- THEN move to STEP 3 (Languages) - ALWAYS

### STEP 3: Languages (THIRD)
AFTER certifications are done, you MUST ask:
"**Do you speak any languages you'd like to include on your resume? (Yes or No)**"

After user answers:
- If YES: Ask what languages and proficiency level
- If NO: Just acknowledge
- THEN move to STEP 4 (Personal Strengths) - ALWAYS

### STEP 4: Personal Strengths (FOURTH AND LAST)
AFTER languages are done, you MUST ask:
"**Would you like to highlight any personal strengths? (Yes or No)**"
(Examples: teamwork, communication, leadership, problem-solving)

After user answers:
- If YES: Ask what strengths
- If NO: Just acknowledge
- ONLY NOW can you move to references

## CRITICAL SEQUENCING RULES:
1. Technical Skills -> 2. Certifications -> 3. Languages -> 4. Strengths -> THEN References
- NEVER skip a sub-category, even if user says NO
- NEVER go to references until ALL 4 sub-categories are complete
- Ask ONE question per message
- If user says NO to a sub-category, acknowledge and ask the NEXT sub-category

## STRICTLY FORBIDDEN:
WRONG: After certifications=NO, go to references (SKIPS languages + strengths!)
WRONG: After technical skills=NO, go to references (SKIPS 3 sub-categories!)
WRONG: Combine sub-categories in one question

## WHEN TRANSITIONING TO REFERENCES (after ALL 4 sub-categories):
- Say ONLY: "Great! Let's move on to references."
- Set suggestedSection: "references"
- DO NOT ask any reference questions in this message`,

  references: `This section is OPTIONAL. Ask if they want to:
1. Add specific references (name, title, company, contact)
2. Just put "References available upon request"
3. Skip references entirely

Most resumes just say "upon request" - that's totally fine.`,

  review: `## Review Section - FINAL STEP BEFORE EXPORT

Summarize what you've collected and ask if they want to review or change anything before generating the resume.
List out the main sections and what's in each.

**If they want changes:**
- Help them make edits to specific sections
- Ask what they want to change
- Set followUpNeeded: true

**If they're happy OR want to export/download:**
When the user says things like:
- "yes" (to generating/downloading)
- "pdf", "word", "download", "export"
- "looks good", "perfect", "ready"
- "generate my resume", "create my resume"

Then you MUST:
1. Say: "Your resume is ready! Click the 'View & Download Resume' button below to preview and download it."
2. Set isComplete: true in the extracted_data
3. DO NOT give instructions on using Word or other software - WE generate the resume for them

Example response when user wants to export:
"Your resume is ready! Click the 'View & Download Resume' button below to preview and download it."
<extracted_data>
{
  "fields": [],
  "suggestedSection": "complete",
  "followUpNeeded": false,
  "isComplete": true
}
</extracted_data>

CRITICAL: When user indicates they want to download/export, set isComplete: true. NEVER give generic instructions about creating PDFs in Word.`,

  complete: `The user has indicated they want to generate/download their resume.

Your response should be EXACTLY:
"Your resume is ready! Click the 'View & Download Resume' button below to preview and download it."

ALWAYS set isComplete: true in the extracted_data:
<extracted_data>
{
  "fields": [],
  "suggestedSection": null,
  "followUpNeeded": false,
  "isComplete": true
}
</extracted_data>

DO NOT:
- Give instructions on how to use Word or other software
- Tell them to copy/paste content
- Explain how to create PDFs manually

The app will generate the resume for them automatically.`
};

// ============================================================================
// Detection Patterns
// ============================================================================

/**
 * Patterns that indicate user doesn't have an email
 */
export const NO_EMAIL_PATTERNS = [
  /don'?t have (an? )?email/i,
  /no email/i,
  /i need (to )?(get|create|make) (an? )?email/i,
  /don'?t (have|use) email/i,
  /what'?s (an )?email/i,
  /how do i (get|make|create) (an )?email/i,
  /i'?m not sure (how|what) email/i,
  /never had (an )?email/i,
];

/**
 * Patterns that indicate user wants to skip/move on
 */
export const ESCAPE_PATTERNS = [
  /move on/i,
  /skip( this)?/i,
  /next( question)?/i,
  /that'?s (enough|all|it)/i,
  /let'?s continue/i,
  /nothing (else|more)/i,
  /no more/i,
  /i'?m done( with this)?/i,
  /can we move/i,
];

/**
 * Patterns that indicate frustration
 */
export const FRUSTRATION_PATTERNS = [
  /i (already|just) (said|told)/i,
  /why (are you|do you keep) asking/i,
  /stop asking/i,
  /this is (taking|too)/i,
  /i don'?t (know|understand)/i,
  /can'?t (you|we) just/i,
  /forget it/i,
  /never ?mind/i,
];

/**
 * Patterns indicating user has no work experience
 */
export const NO_WORK_PATTERNS = [
  /no work experience/i,
  /(this is|it'?s) my first job/i,
  /never (had a |worked)/i,
  /just (graduated|finished school)/i,
  /looking for (my )?first/i,
  /haven'?t worked (before|yet)/i,
];

/**
 * Patterns indicating user is contradicting previously provided data
 * Maps section names to patterns that indicate "I don't have X"
 * NOTE: These patterns are STRICTER to avoid matching simple "no" responses.
 * They only trigger when user explicitly denies having something they've already provided.
 */
export const CONTRADICTION_PATTERNS: Record<string, RegExp[]> = {
  volunteering: [
    // Requires explicit denial phrases, not just "no"
    /i (don'?t|do not|dont) have (any )?(volunteer|volunteering)/i,
    /i (don'?t|do not|dont) have (any )?(volunteer|volunteering) experience/i,
    /i have no volunteer/i,
    /actually.*(don'?t|no).*(volunteer)/i,
    /remove.*(volunteer|volunteering)/i,
    /delete.*(volunteer|volunteering)/i,
  ],
  workExperience: [
    // Requires explicit denial phrases, not just "no"
    /i (don'?t|do not|dont) have (any )?(work|job) experience/i,
    /i have no work experience/i,
    /never (worked|had a job)/i,
    /actually.*(don'?t|no).*(work|job)/i,
    /remove.*(work|job)/i,
    /delete.*(work|job)/i,
  ],
  education: [
    // Requires explicit denial phrases, not just "no"
    /i (don'?t|do not|dont) have (any )?(education|degree)/i,
    /i have no education/i,
    /actually.*(don'?t|no).*(education|school)/i,
    /remove.*(education|school)/i,
    /delete.*(education|school)/i,
  ],
  references: [
    // Requires explicit denial phrases, not just "no"
    /i (don'?t|do not|dont) have (any )?reference/i,
    /i have no reference/i,
    /actually.*(don'?t|no).*(reference)/i,
    /remove.*(reference)/i,
    /delete.*(reference)/i,
  ],
};

/**
 * Patterns indicating user wants to export/download/generate their resume
 */
export const EXPORT_INTENT_PATTERNS = [
  /\bpdf\b/i,
  /download/i,
  /export/i,
  /generate.*resume/i,
  /create.*resume/i,
  /ready to (download|export|generate)/i,
  /get my resume/i,
  /finish(ed)?/i,
  /done/i,
  /\bword\b/i,
  /\bdocx?\b/i,
];

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user message indicates they don't have an email
 */
export function detectNoEmail(message: string): boolean {
  return NO_EMAIL_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Check if user wants to skip/move on
 */
export function detectEscapePhrase(message: string): boolean {
  return ESCAPE_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Check if user seems frustrated
 */
export function detectFrustration(message: string): boolean {
  return FRUSTRATION_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Check if user indicates no work experience
 */
export function detectNoWorkExperience(message: string): boolean {
  return NO_WORK_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Check if user message contradicts existing data in a section
 * Returns details about the contradiction if found
 *
 * NOTE: This function is now STRICTER:
 * 1. Patterns must be explicit denial phrases (not just "no")
 * 2. Existing data must have meaningful content (not just empty objects with id)
 */
export function detectContradiction(
  message: string,
  resumeData: Record<string, unknown>
): {
  isContradiction: boolean;
  section: string | null;
  existingData: unknown;
  existingDataSummary: string | null;
} {
  // Simple "no" responses should NOT trigger contradiction
  // They are valid answers to "Do you have any X?" questions
  const trimmedMessage = message.trim().toLowerCase();
  if (/^(no|nope|nah|none|nothing|skip|n\/a)\.?$/i.test(trimmedMessage)) {
    return {
      isContradiction: false,
      section: null,
      existingData: null,
      existingDataSummary: null,
    };
  }

  // Check each section for contradictions
  for (const [section, patterns] of Object.entries(CONTRADICTION_PATTERNS)) {
    const hasMatchingPattern = patterns.some(pattern => pattern.test(message));

    if (hasMatchingPattern) {
      // Check if we have existing data for this section
      const sectionData = resumeData[section];

      // Use hasMeaningfulData to check if there's actual content (not just empty objects)
      if (sectionData && Array.isArray(sectionData) && sectionData.length > 0) {
        // Verify data has meaningful content
        const hasMeaningful = sectionData.some((item: Record<string, unknown>) => {
          if (!item || typeof item !== 'object') return false;
          const meaningfulValues = Object.entries(item).filter(([key, value]) => {
            if (key === 'id') return false;
            if (value === undefined || value === null || value === '') return false;
            if (Array.isArray(value) && value.length === 0) return false;
            return true;
          });
          return meaningfulValues.length > 0;
        });

        if (!hasMeaningful) {
          // No meaningful data - not a real contradiction
          continue;
        }

        // Build a summary of existing data
        let summary = '';

        if (section === 'volunteering') {
          const entries = sectionData as Array<{ organization?: string; role?: string }>;
          const validEntries = entries.filter(e => e.organization || e.role);
          if (validEntries.length === 0) continue;
          summary = validEntries.map(e =>
            `${e.organization || 'Unknown organization'}${e.role ? ` as ${e.role}` : ''}`
          ).join(', ');
        } else if (section === 'workExperience') {
          const entries = sectionData as Array<{ companyName?: string; jobTitle?: string }>;
          const validEntries = entries.filter(e => e.companyName || e.jobTitle);
          if (validEntries.length === 0) continue;
          summary = validEntries.map(e =>
            `${e.companyName || 'Unknown company'}${e.jobTitle ? ` as ${e.jobTitle}` : ''}`
          ).join(', ');
        } else if (section === 'education') {
          const entries = sectionData as Array<{ schoolName?: string; degree?: string }>;
          const validEntries = entries.filter(e => e.schoolName || e.degree);
          if (validEntries.length === 0) continue;
          summary = validEntries.map(e =>
            `${e.schoolName || 'Unknown school'}${e.degree ? ` (${e.degree})` : ''}`
          ).join(', ');
        } else if (section === 'references') {
          const entries = sectionData as Array<{ name?: string; title?: string }>;
          const validEntries = entries.filter(e => e.name || e.title);
          if (validEntries.length === 0) continue;
          summary = validEntries.map(e =>
            `${e.name || 'Unknown reference'}${e.title ? ` (${e.title})` : ''}`
          ).join(', ');
        }

        // Only return contradiction if we have a meaningful summary
        if (summary) {
          return {
            isContradiction: true,
            section,
            existingData: sectionData,
            existingDataSummary: summary,
          };
        }
      }
    }
  }

  return {
    isContradiction: false,
    section: null,
    existingData: null,
    existingDataSummary: null,
  };
}

/**
 * Check if user wants to export/download their resume
 */
export function detectExportIntent(message: string): boolean {
  return EXPORT_INTENT_PATTERNS.some(pattern => pattern.test(message));
}

/**
 * Get the next logical section based on current section and resume data
 */
export function getNextSection(
  currentSection: QuestionCategory,
  hasWorkExperience?: boolean,
  hasVolunteering?: boolean,
  hasReferences?: boolean
): QuestionCategory {
  const sectionOrder: QuestionCategory[] = [
    'language',
    'intro',
    'personal',
    'work',
    'education',
    'volunteering',
    'skills',
    'references',
    'review',
    'complete'
  ];

  const currentIndex = sectionOrder.indexOf(currentSection);
  let nextSection = sectionOrder[currentIndex + 1] || 'complete';

  // Skip optional sections if user indicated they don't have content
  if (nextSection === 'work' && hasWorkExperience === false) {
    nextSection = 'education';
  }
  if (nextSection === 'volunteering' && hasVolunteering === false) {
    nextSection = 'skills';
  }
  if (nextSection === 'references' && hasReferences === false) {
    nextSection = 'review';
  }

  return nextSection;
}

/**
 * Build the full system prompt for a conversation turn
 */
export function buildSystemPrompt(
  currentSection: QuestionCategory,
  language: string = 'en',
  additionalContext?: string
): string {
  const sectionPrompt = SECTION_PROMPTS[currentSection] || '';

  let prompt = RESUME_ASSISTANT_PROMPT;

  // Add language instruction
  if (language !== 'en') {
    prompt += `\n\n## Language Instruction:\nRespond in ${language}. Keep the extracted_data JSON in English for processing.`;
  }

  // Add section-specific guidance
  prompt += `\n\n## Current Section Focus (${currentSection}):\n${sectionPrompt}`;

  // Add any additional context
  if (additionalContext) {
    prompt += `\n\n## Additional Context:\n${additionalContext}`;
  }

  return prompt;
}

/**
 * Determine if we should show follow-up based on count and section
 */
export function shouldAskFollowUp(
  section: QuestionCategory,
  followUpCount: number,
  maxFollowUps: number = 3
): boolean {
  // Always allow follow-ups for work and education (multi-entry sections)
  if (section === 'work' || section === 'education') {
    return followUpCount < 5; // Allow more for multi-entry sections
  }

  // Standard limit for other sections
  return followUpCount < maxFollowUps;
}

/**
 * Extract section from AI response's extracted_data
 */
export function parseExtractedData(aiResponse: string): {
  fields: Array<{
    path: string;
    value: unknown;
    confidence: number;
    needsConfirmation?: boolean;
  }>;
  suggestedSection: QuestionCategory | null;
  followUpNeeded: boolean;
  specialContent: string | null;
  isComplete: boolean;
} | null {
  const match = aiResponse.match(/<extracted_data>([\s\S]*?)<\/extracted_data>/);

  if (!match) {
    return null;
  }

  try {
    const data = JSON.parse(match[1].trim());
    return {
      fields: data.fields || [],
      suggestedSection: data.suggestedSection || null,
      followUpNeeded: data.followUpNeeded ?? false,
      specialContent: data.specialContent || null,
      isComplete: data.isComplete ?? false,
    };
  } catch (error) {
    console.error('Failed to parse extracted data:', error);
    return null;
  }
}

/**
 * Clean AI response by removing extracted_data tags
 */
export function cleanAIResponse(aiResponse: string): string {
  return aiResponse.replace(/<extracted_data>[\s\S]*?<\/extracted_data>/g, '').trim();
}

/**
 * Apply extracted fields to resume data object
 */
export function applyExtractedFields(
  currentData: Record<string, unknown>,
  fields: Array<{ path: string; value: unknown; confidence: number }>
): Record<string, unknown> {
  const newData = JSON.parse(JSON.stringify(currentData)); // Deep clone

  for (const field of fields) {
    // Only apply high-confidence extractions automatically
    if (field.confidence < 0.7) continue;

    setNestedValue(newData, field.path, field.value);
  }

  return newData;
}

/**
 * Set a value at a nested path (supports array notation like "workExperience[0].title")
 */
function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split(/\.|\[|\]/).filter(Boolean);
  let current: Record<string, unknown> = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    const nextPart = parts[i + 1];
    const isNextArray = /^\d+$/.test(nextPart);

    if (!(part in current)) {
      current[part] = isNextArray ? [] : {};
    }

    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

// ============================================================================
// Conversation Context Management
// ============================================================================

export interface ConversationContext {
  mentionedEntities: string[];
  answeredTopics: string[];
  currentSection: QuestionCategory;
  followUpCounts: Record<QuestionCategory, number>;
  userTone: 'confident' | 'uncertain' | 'frustrated' | 'neutral';
}

/**
 * Build context summary for AI from conversation history
 */
export function buildContextSummary(
  context: ConversationContext,
  resumeData: Record<string, unknown>
): string {
  const parts: string[] = [];

  // What we already know
  if (context.answeredTopics.length > 0) {
    parts.push(`Topics already covered: ${context.answeredTopics.join(', ')}`);
  }

  // Entities mentioned
  if (context.mentionedEntities.length > 0) {
    parts.push(`Names/companies mentioned: ${context.mentionedEntities.join(', ')}`);
  }

  // Current resume data summary
  const personalInfo = resumeData.personalInfo as Record<string, unknown> | undefined;
  if (personalInfo?.fullName) {
    parts.push(`User's name: ${personalInfo.fullName}`);
  }

  const workExp = resumeData.workExperience as unknown[] | undefined;
  if (workExp && workExp.length > 0) {
    parts.push(`Work experiences collected: ${workExp.length}`);
  }

  const education = resumeData.education as unknown[] | undefined;
  if (education && education.length > 0) {
    parts.push(`Education entries collected: ${education.length}`);
  }

  // User tone
  if (context.userTone !== 'neutral') {
    parts.push(`User seems ${context.userTone} - adjust tone accordingly`);
  }

  return parts.join('\n');
}

// ============================================================================
// Response Validation Layer
// ============================================================================

/**
 * Required first messages for yes/no sections (exact wording required)
 */
export const REQUIRED_FIRST_MESSAGES: Partial<Record<QuestionCategory, string>> = {
  work: "**Do you have any work experience you'd like to include? (Yes or No)**",
  education: "**Do you have any education you'd like to include? (Yes or No)**",
  volunteering: "**Do you have any volunteer experience you'd like to include? (Yes or No)**",
  skills: "**Do you have any technical skills or software you'd like to highlight? (Yes or No)**",
  references: "**Would you like to add professional references? (Yes or No)**",
};

/**
 * Transition messages when user says "no" to a section
 */
export const SECTION_TRANSITION_MESSAGES: Partial<Record<QuestionCategory, string>> = {
  work: "That's totally fine! Let's move on to your education. **Do you have any education you'd like to include? (Yes or No)**",
  education: "That's perfectly fine! **Do you have any volunteer experience you'd like to include? (Yes or No)**",
  volunteering: "That's perfectly fine! **Do you have any technical skills or software you'd like to highlight? (Yes or No)**",
  skills: "No problem! **Would you like to add professional references? (Yes or No)**",
  references: "That's fine! Let me review what we have so far.",
};

/**
 * Section advancement map (when user says "no")
 */
export const SECTION_ADVANCE_MAP: Partial<Record<QuestionCategory, QuestionCategory>> = {
  work: 'education',
  education: 'volunteering',
  volunteering: 'skills',
  skills: 'references',
  references: 'review',
};

/**
 * Flag names for each section
 */
export const SECTION_FLAG_MAP: Partial<Record<QuestionCategory, string>> = {
  work: 'hasWorkExperience',
  education: 'hasEducation',
  volunteering: 'hasVolunteering',
  references: 'hasReferences',
};

/**
 * Detect if user said "no" to the current section's yes/no question
 */
export function detectUserSaidNoToSection(
  message: string,
  currentSection: QuestionCategory,
  followUpCount: number
): boolean {
  // Only applies to first question in yes/no sections
  if (followUpCount !== 0) return false;
  if (!REQUIRED_FIRST_MESSAGES[currentSection]) return false;

  const trimmedMessage = message.trim().toLowerCase();

  const noPatterns = [
    /^no\.?$/i,
    /^nope\.?$/i,
    /^nah\.?$/i,
    /^not really\.?$/i,
    /^no,?\s*(thanks|thank you)?\.?$/i,
    /^i (don'?t|do not|dont) have (any|that)/i,
    /^i have no/i,
    /^none\.?$/i,
    /^nothing\.?$/i,
    /^skip\.?$/i,
    /^n\/a\.?$/i,
  ];

  return noPatterns.some(pattern => pattern.test(trimmedMessage));
}

/**
 * Detect if user said "yes" to a section's yes/no question
 * Used to allow AI to proceed to detail questions instead of repeating the yes/no question
 */
export function detectUserSaidYesToSection(
  message: string,
  currentSection: QuestionCategory,
  followUpCount: number
): boolean {
  // Only applies to first question in yes/no sections
  if (followUpCount !== 0) return false;
  if (!REQUIRED_FIRST_MESSAGES[currentSection]) return false;

  const trimmedMessage = message.trim().toLowerCase();

  const yesPatterns = [
    /^yes\.?$/i,
    /^yeah\.?$/i,
    /^yep\.?$/i,
    /^yup\.?$/i,
    /^sure\.?$/i,
    /^definitely\.?$/i,
    /^absolutely\.?$/i,
    /^of course\.?$/i,
    /^i do\.?$/i,
    /^i have\.?$/i,
    /^yes,?\s*(i do|i have|please)?\.?$/i,
    /^y$/i,
  ];

  return yesPatterns.some(pattern => pattern.test(trimmedMessage));
}

// ============================================================================
// Skills Sub-Category Tracking
// ============================================================================

export type SkillsSubCategory = 'technical' | 'certifications' | 'languages' | 'strengths';

/**
 * Patterns to detect which skills sub-category question was asked
 */
const SKILLS_SUB_CATEGORY_PATTERNS: Array<{ patterns: string[]; category: SkillsSubCategory }> = [
  { patterns: ['technical skills', 'software you\'d like to highlight'], category: 'technical' },
  { patterns: ['certifications or licenses', 'certifications'], category: 'certifications' },
  { patterns: ['languages you\'d like to include', 'speak any languages'], category: 'languages' },
  { patterns: ['personal strengths', 'highlight any personal strengths'], category: 'strengths' },
];

/**
 * Order of skills sub-categories
 */
export const SKILLS_SUB_CATEGORY_ORDER: SkillsSubCategory[] = ['technical', 'certifications', 'languages', 'strengths'];

/**
 * Required questions for each skills sub-category
 */
export const SKILLS_SUB_CATEGORY_QUESTIONS: Record<SkillsSubCategory, string> = {
  technical: "**Do you have any technical skills or software you'd like to highlight? (Yes or No)**",
  certifications: "**Do you have any certifications or licenses? (Yes or No)**",
  languages: "**Do you speak any languages you'd like to include on your resume? (Yes or No)**",
  strengths: "**Would you like to highlight any personal strengths? (Yes or No)**",
};

/**
 * Detect which skills sub-category question was asked in the AI message
 */
export function detectSkillsSubCategory(aiMessage: string): SkillsSubCategory | null {
  const lowerMessage = aiMessage.toLowerCase();

  for (const { patterns, category } of SKILLS_SUB_CATEGORY_PATTERNS) {
    if (patterns.some(pattern => lowerMessage.includes(pattern))) {
      return category;
    }
  }

  return null;
}

/**
 * Get the next skills sub-category in sequence
 */
export function getNextSkillsSubCategory(current: SkillsSubCategory): SkillsSubCategory | 'done' {
  const index = SKILLS_SUB_CATEGORY_ORDER.indexOf(current);
  if (index === -1 || index >= SKILLS_SUB_CATEGORY_ORDER.length - 1) {
    return 'done';
  }
  return SKILLS_SUB_CATEGORY_ORDER[index + 1];
}

/**
 * Detect if user answered a skills sub-category question (yes/no or provided details)
 */
export function detectSkillsSubCategoryAnswer(userMessage: string): 'yes' | 'no' | 'details' | null {
  const trimmed = userMessage.trim().toLowerCase();

  // Check for explicit yes
  if (/^(yes|yeah|yep|yup|sure|definitely|absolutely|i do|i have|y)\.?$/i.test(trimmed)) {
    return 'yes';
  }

  // Check for explicit no
  if (/^(no|nope|nah|none|nothing|not really|skip|n\/a)\.?$/i.test(trimmed)) {
    return 'no';
  }

  // If message is longer, user likely provided details
  if (userMessage.trim().length > 5) {
    return 'details';
  }

  return null;
}

/**
 * Validate AI response follows section rules
 * Returns validation result with optional corrected response
 */
export function validateAIResponse(
  response: string,
  currentSection: QuestionCategory,
  followUpCount: number,
  userSaidNo: boolean,
  userSaidYes: boolean = false
): {
  isValid: boolean;
  correctedResponse?: string;
  violation?: string;
} {
  // Rule 1: First message in yes/no sections must contain the exact question
  if (followUpCount === 0 && REQUIRED_FIRST_MESSAGES[currentSection]) {
    const requiredMessage = REQUIRED_FIRST_MESSAGES[currentSection]!;

    // If user said NO, we should be transitioning, not asking the yes/no question
    if (userSaidNo) {
      // Check that response does NOT contain any other section's yes/no question
      const otherSectionQuestions = Object.entries(REQUIRED_FIRST_MESSAGES)
        .filter(([section]) => section !== currentSection)
        .map(([, question]) => question);

      const containsOtherQuestion = otherSectionQuestions.some(
        q => q && response.includes(q)
      );

      if (containsOtherQuestion) {
        return {
          isValid: false,
          correctedResponse: SECTION_TRANSITION_MESSAGES[currentSection],
          violation: `When user says no, only acknowledge and transition. Don't ask next section's question in same message.`,
        };
      }

      // Response is valid for "no" case
      return { isValid: true };
    }

    // If user said YES, they're answering the yes/no question affirmatively
    // Let AI proceed to detail questions instead of repeating the yes/no question
    if (userSaidYes) {
      return { isValid: true };
    }

    // User did not say yes or no - this is initial section entry
    // Check if response contains required yes/no question
    if (!response.includes(requiredMessage)) {
      // Check if it's a transition TO this section (section just changed)
      // In that case, we need the yes/no question
      return {
        isValid: false,
        correctedResponse: requiredMessage,
        violation: `First message in ${currentSection} must contain the yes/no question`,
      };
    }

    // Check for forbidden intro text before the question (only minimal text allowed)
    const questionIndex = response.indexOf(requiredMessage);
    const textBefore = response.substring(0, questionIndex).trim();

    // Allow short transition phrases like "Great!" or "Perfect!" but not long intros
    if (textBefore.length > 50) {
      return {
        isValid: false,
        correctedResponse: requiredMessage,
        violation: `Too much intro text before the yes/no question in ${currentSection}`,
      };
    }
  }

  // Rule 2: Validate transition responses when user says "no"
  // Note: Transition messages now include the next section's yes/no question, so we allow those
  if (userSaidNo && SECTION_TRANSITION_MESSAGES[currentSection]) {
    const hasQuestionMark = response.includes('?');
    const allowedQuestionPatterns = [
      /would you like to keep/i,  // Contradiction handling
      /did you mean/i,            // Clarification
      /\(Yes or No\)/i,           // Next section's yes/no question (allowed in transitions)
      /Yes or No/i,               // Alternative format
    ];

    const hasAllowedQuestion = allowedQuestionPatterns.some(p => p.test(response));

    if (hasQuestionMark && !hasAllowedQuestion) {
      // Response has a question that's not allowed
      return {
        isValid: false,
        correctedResponse: SECTION_TRANSITION_MESSAGES[currentSection],
        violation: `Transition response should only ask the next section's yes/no question. User said no to ${currentSection}.`,
      };
    }
  }

  return { isValid: true };
}

/**
 * Check if data array has meaningful content (not just empty objects with id)
 */
export function hasMeaningfulData(data: unknown): boolean {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return false;
  }

  return data.some((item: Record<string, unknown>) => {
    if (!item || typeof item !== 'object') return false;

    // Filter out empty values and the 'id' field
    const meaningfulValues = Object.entries(item).filter(([key, value]) => {
      if (key === 'id') return false;
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    });

    return meaningfulValues.length > 0;
  });
}
