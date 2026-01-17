/**
 * AI Response Matcher
 *
 * Flexible regex-based pattern matching to handle AI response variability.
 * The AI may phrase the same question in multiple different ways, so tests
 * need to detect the intent rather than exact wording.
 *
 * Lessons from Issue #13:
 * - "Do you have another job?" vs "Would you like to add any other work experience?"
 * - Both are asking the same thing, tests must handle both
 */

// ============================================================================
// QUESTION TYPES - Canonical names for different question types
// ============================================================================

export type QuestionType =
  // Language selection
  | 'language_selection'
  // Personal info questions
  | 'personal_name'
  | 'personal_email'
  | 'personal_phone'
  | 'personal_location'
  | 'personal_summary' // Summary/confirmation of collected info
  // Section gate questions (yes/no)
  | 'work_gate'
  | 'education_gate'
  | 'volunteering_gate'
  | 'skills_technical_gate'
  | 'skills_certifications_gate'
  | 'skills_languages_gate'
  | 'skills_soft_gate'
  | 'references_gate'
  // Work detail questions
  | 'work_company'
  | 'work_title'
  | 'work_is_current'
  | 'work_dates'
  | 'work_start_date'
  | 'work_end_date'
  | 'work_responsibilities'
  | 'work_add_another'
  // Education detail questions
  | 'education_school'
  | 'education_degree'
  | 'education_field'
  | 'education_is_current'
  | 'education_dates'
  | 'education_add_another'
  // Volunteering detail questions
  | 'volunteering_organization'
  | 'volunteering_role'
  | 'volunteering_dates'
  | 'volunteering_responsibilities'
  | 'volunteering_add_another'
  // Skills questions
  | 'skills_technical_list'
  | 'skills_certifications_list'
  | 'skills_languages_list'
  | 'skills_soft_list'
  // References questions
  | 'references_upon_request'
  | 'reference_name'
  | 'reference_title'
  | 'reference_company'
  | 'reference_phone'
  | 'reference_email'
  | 'reference_relationship'
  | 'reference_add_another'
  // Completion/review
  | 'review_complete'
  | 'unknown';

// ============================================================================
// PATTERN DEFINITIONS - Regex patterns for each question type
// ============================================================================

interface PatternGroup {
  type: QuestionType;
  patterns: RegExp[];
  priority: number; // Higher = check first (for disambiguation)
}

const PATTERN_GROUPS: PatternGroup[] = [
  // Language selection (highest priority - first question only)
  // IMPORTANT: This should only match the initial language selection, NOT skills_languages_gate
  {
    type: 'language_selection',
    patterns: [
      /what language would you like to use/i,
      /(?:english|espanol|francais|deutsch).*(?:english|espanol|francais|deutsch)/i, // Multiple language options listed
      /^what language/i, // Only at start of message
    ],
    priority: 100,
  },

  // Personal info summary (check BEFORE personal details - higher priority)
  {
    type: 'personal_summary',
    patterns: [
      // Support both straight and curly apostrophes
      /here(?:['']s| is) what (?:i['']ve|we['']ve|i have|i) (?:collected|gathered|have so far)/i,
      /here(?:['']s| is) what i have so far/i,
      /what i have so far(?!.*resume)/i, // "what i have so far" but NOT about resume
      /(?:name|email|phone).*(?:name|email|phone).*(?:name|email|phone)/i, // Multiple personal fields listed (3+)
      /-\s*name:.*-\s*email:/i, // List format with multiple fields
      /let me (?:confirm|summarize)(?!.*resume)/i, // Confirm/summarize but not resume review
      /here(?:['']s| is) (?:your|the) (?:information|summary)/i,
    ],
    priority: 91, // Lower than review_complete (92) to avoid matching resume review
  },
  // Personal info
  {
    type: 'personal_name',
    patterns: [
      /what(?:'s| is) your (?:full )?name\??/i,
      /may i (?:have|get|know) your name/i,
      /can you (?:tell|give) me your name/i,
    ],
    priority: 90,
  },
  {
    type: 'personal_email',
    patterns: [
      // Must be asking for email, not just mentioning it
      /what(?:['']s| is) your (?:email|e-mail)/i,
      /(?:may i (?:have|get)|can you (?:give|tell) me) your (?:email|e-mail)/i,
      /your email address\?/i, // Question format
    ],
    priority: 90,
  },
  {
    type: 'personal_phone',
    patterns: [
      // Must be asking for phone, not just mentioning it
      /what(?:['']s| is) your (?:phone|telephone)/i,
      /(?:may i (?:have|get)|can you (?:give|tell) me) your (?:phone|telephone)/i,
      /your phone number\?/i, // Question format
    ],
    priority: 90,
  },
  {
    type: 'personal_location',
    patterns: [
      // Must be asking for location, not just mentioning it
      /what(?:['']s| is)?\s+(?:your\s+)?city(?:\s+and\s+state)?/i,
      /where\s+(?:do you|are you)\s+(?:live|located)/i,
      /your\s+(?:city|location|address)\?/i, // Question format
    ],
    priority: 90,
  },

  // Section gates - Must check before detail questions
  {
    type: 'work_gate',
    patterns: [
      /(?:do you )?have\s+(?:any\s+)?work\s+experience/i,
      /any\s+work\s+experience/i,
      /(?:would you )?like to (?:add|include).*work/i,
      /have you worked/i,
    ],
    priority: 85,
  },
  {
    type: 'education_gate',
    patterns: [
      /(?:do you )?have\s+(?:any\s+)?education(?!\s+to\s+add)/i, // Not "any other education to add"
      /any\s+education\s+(?:you'd like|to include)/i,
      /(?:would you )?like to (?:add|include).*education/i,
      /educational\s+background/i,
      /move\s+on\s+to\s+(?:your\s+)?education/i, // "Let's move on to your education"
    ],
    priority: 85,
  },
  {
    type: 'volunteering_gate',
    patterns: [
      /(?:do you )?have\s+(?:any\s+)?volunteer/i,
      /any\s+volunteer(?:ing)?\s+experience/i,
      /(?:would you )?like to (?:add|include).*volunteer/i,
      /community service/i,
    ],
    priority: 85,
  },
  {
    type: 'skills_technical_gate',
    patterns: [
      /(?:do you )?have\s+(?:any\s+)?technical\s+skills/i,
      /any\s+technical\s+skills/i,
      /computer\s+skills/i,
      /programming\s+(?:skills|languages)/i,
      /software\s+skills/i,
    ],
    priority: 85,
  },
  {
    type: 'skills_certifications_gate',
    patterns: [
      /(?:do you )?have\s+(?:any\s+)?certifications?/i,
      /any\s+certifications?\s+or\s+licenses?/i,
      /professional\s+certifications?/i,
    ],
    priority: 85,
  },
  {
    type: 'skills_languages_gate',
    patterns: [
      /(?:do you )?(?:speak|know)\s+(?:any\s+)?(?:other\s+)?languages/i,
      /any\s+languages?\s+(?:you'd like|to include)/i,
      /(?:would you like to )?(?:include|highlight)\s+(?:any\s+)?languages/i, // More specific: include/highlight languages
      /bilingual|multilingual/i,
      /foreign\s+languages?/i,
    ],
    priority: 86, // Slightly higher than other skill gates to catch language questions
  },
  {
    type: 'skills_soft_gate',
    patterns: [
      /(?:do you )?have\s+(?:any\s+)?soft\s+skills/i,
      /any\s+soft\s+skills/i,
      /would you like to\s+(?:highlight|include|add)\s+(?:any\s+)?(?:soft\s+skills|personal\s+strengths)/i,
      /highlight\s+any\s+(?:soft\s+)?skills/i, // Must have "any" to be a gate
    ],
    priority: 85,
  },
  {
    type: 'references_gate',
    patterns: [
      /(?:do you )?(?:have|want to include)\s+(?:any\s+)?references?/i,
      /any\s+(?:professional\s+)?references?/i,
      /(?:would you )?like to (?:add|include|provide).*references?/i,
    ],
    priority: 85,
  },

  // Add another questions - Check before detail questions
  {
    type: 'work_add_another',
    patterns: [
      /(?:do you )?have\s+another\s+job/i,
      /any\s+other\s+(?:work|job|position)/i,
      /(?:do you )?have\s+any\s+other\s+(?:work|job)/i,
      /add\s+(?:another|any other)\s+(?:work|job|position)/i,
      /more\s+work\s+experience/i,
      /additional\s+(?:work|job|employment)/i,
      /another\s+work\s+experience/i,
    ],
    priority: 88, // Higher than work_gate (85) to catch "any other work"
  },
  {
    type: 'education_add_another',
    patterns: [
      /(?:do you )?have\s+another\s+(?:degree|school)/i,
      /any\s+other\s+education/i,
      /(?:do you )?have\s+any\s+other\s+education/i,
      /add\s+(?:another|any other)\s+education/i,
      /more\s+education/i,
      /additional\s+(?:degree|education)/i,
    ],
    priority: 88, // Higher than education_gate (85) to catch "any other education"
  },
  {
    type: 'volunteering_add_another',
    patterns: [
      /(?:do you )?have\s+(?:another|any other)\s+volunteer/i,
      /any\s+other\s+volunteer/i,
      /add\s+(?:another|any other)\s+volunteer/i,
      /more\s+volunteer/i,
      /additional\s+volunteer/i,
    ],
    priority: 88, // Higher than volunteering_gate (85) to catch "any other volunteer"
  },
  {
    type: 'reference_add_another',
    patterns: [
      /(?:do you )?have\s+(?:another|any other)\s+reference/i,
      /any\s+other\s+reference/i,
      /add\s+(?:another|any other)\s+reference/i,
      /more\s+references?/i,
      /additional\s+reference/i,
    ],
    priority: 88, // Higher than references_gate (85) to catch "any other reference"
  },

  // Work detail questions
  {
    type: 'work_company',
    patterns: [
      /(?:what\s+)?company\s+(?:did you|do you)\s+work/i,
      /(?:where\s+)?(?:did you|do you)\s+work/i,
      /employer/i,
      /company\s+name/i,
      /(?:which|what)\s+company/i,
      /(?:what\s+)?(?:was\s+)?(?:the\s+)?name\s+of\s+the\s+company/i, // "What was the name of the company"
      /company\s+you\s+work(?:ed)?\s+for/i, // "company you worked for"
    ],
    priority: 70,
  },
  {
    type: 'work_title',
    patterns: [
      /(?:what\s+(?:was|is))?\s*(?:your\s+)?job\s+title/i,
      /(?:what\s+)?position\s+(?:did you|do you)\s+hold/i,
      /(?:what\s+)?role/i,
      /(?:your\s+)?title\s+(?:at|there)/i,
    ],
    priority: 70,
  },
  {
    type: 'work_is_current',
    patterns: [
      /(?:do you )?(?:still|currently)\s+work/i,
      /(?:is this )?(?:your\s+)?current\s+(?:job|position|role)/i,
      /(?:are you )?still\s+(?:employed|working)/i,
    ],
    priority: 70,
  },
  {
    type: 'work_dates',
    patterns: [
      /(?:what\s+)?dates?\s+(?:did you|were you|you)/i,
      /when\s+(?:did you|were you)\s+(?:work|employed)/i,
      /employment\s+dates?/i,
      /how\s+long\s+(?:did you|were you|have you)/i,
      /dates?\s+you\s+work(?:ed)?/i, // "dates you worked there"
      /(?:provide|give).*dates?/i, // "provide the dates"
      /dates?\s+of\s+(?:your\s+)?employment/i, // "dates of your employment there"
      /(?:what\s+)?(?:were|are)\s+the\s+dates?\s+(?:of|you)/i, // "What were the dates of..."
    ],
    priority: 70,
  },
  {
    type: 'work_start_date',
    patterns: [
      /(?:when\s+did you )?start(?:ed)?/i,
      /start\s+date/i,
      /began\s+(?:work|this\s+job)/i,
    ],
    priority: 70,
  },
  {
    type: 'work_end_date',
    patterns: [
      /(?:when\s+did you )?(?:end|leave|finish)/i,
      /end\s+date/i,
      /(?:last|final)\s+day/i,
    ],
    priority: 70,
  },
  {
    type: 'work_responsibilities',
    patterns: [
      /responsibilities/i,
      /duties/i,
      /what\s+did\s+you\s+do/i,
      /(?:describe|tell me about)\s+(?:your\s+)?(?:role|work|job)/i,
      /main\s+(?:tasks|responsibilities)/i,
      /day-to-day/i,
    ],
    priority: 70,
  },

  // Education detail questions (higher priority than work to avoid conflicts)
  {
    type: 'education_school',
    patterns: [
      /(?:what\s+)?school\s+(?:did you|do you)/i, // "What school did you attend"
      /(?:what\s+)?school/i,
      /(?:what\s+)?(?:college|university|institution)/i,
      /(?:where\s+)?(?:did you|do you)\s+attend/i, // Only "attend" not "study"
      /name\s+of\s+(?:your\s+)?school/i,
    ],
    priority: 72, // Slightly higher than work (70)
  },
  {
    type: 'education_degree',
    patterns: [
      /(?:what\s+)?degree/i,
      /(?:what\s+)?(?:diploma|certificate|qualification)/i,
      /type\s+of\s+degree/i,
    ],
    priority: 70,
  },
  {
    type: 'education_field',
    patterns: [
      /field\s+of\s+study/i,
      /what(?:['']s| is| was)?\s+(?:your\s+)?major/i, // "what's your major"
      /(?:what\s+)?subject\s+(?:did you|do you)/i, // "what subject did you study"
      /area\s+of\s+(?:study|specialization)/i, // Require "area of" prefix
      /what\s+did\s+you\s+study/i, // "What did you study?"
      /\(major\s*\/\s*field\)/i, // "(major/field)" exactly
    ],
    priority: 71, // Lower than education_dates (75) to avoid matching graduation questions
  },
  {
    type: 'education_is_current',
    patterns: [
      /(?:are you )?(?:still|currently)\s+(?:study|attend|enrolled)/i,
      /(?:is this )?current(?:ly)?\s+(?:study|attend|enrolled)/i,
    ],
    priority: 70,
  },
  {
    type: 'education_dates',
    patterns: [
      /what\s+year\s+did\s+you\s+graduat/i, // "What year did you graduate?"
      /when\s+did\s+you\s+graduat/i, // "When did you graduate?"
      /graduation\s+(?:date|year)/i,
      /year\s+(?:you\s+)?graduat/i, // "year you graduated"
      /still\s+studying/i, // "Are you still studying?"
      /years?\s+of\s+(?:study|attendance)/i,
      /when\s+did\s+you\s+(?:attend|start|finish)/i,
    ],
    priority: 75, // Higher than education_field (71) to catch graduation year questions
  },

  // Volunteering detail questions (higher priority than work to avoid conflicts)
  {
    type: 'volunteering_organization',
    patterns: [
      /(?:what\s+)?(?:volunteer\s+)?organization/i,
      /(?:where\s+)?(?:did you|do you)\s+volunteer/i,
      /(?:name\s+of\s+)?(?:the\s+)?(?:charity|nonprofit|organization)/i,
    ],
    priority: 72, // Slightly higher than work (70)
  },
  {
    type: 'volunteering_role',
    patterns: [
      /(?:what\s+(?:was|is)\s+)?(?:your\s+)?(?:volunteer\s+)?role/i,
      /(?:your\s+)?volunteer\s+(?:position|title)/i,
      /what\s+(?:did you|do you)\s+do\s+(?:there|as a volunteer)/i,
      /your\s+role\s+(?:there|at)/i, // "your role there" in volunteer context
    ],
    priority: 72, // Slightly higher than work (70)
  },
  {
    type: 'volunteering_dates',
    patterns: [
      /(?:when\s+)?(?:did you|do you)\s+volunteer/i,
      /volunteer(?:ing)?\s+dates?/i,
      /how\s+long\s+(?:did you|have you)\s+volunteer/i,
    ],
    priority: 70,
  },
  {
    type: 'volunteering_responsibilities',
    patterns: [
      /volunteer(?:ing)?\s+(?:responsibilities|duties)/i,
      /what\s+(?:did you|do you)\s+do\s+(?:there|as a volunteer)/i,
      /describe\s+(?:your\s+)?volunteer(?:ing)?/i,
    ],
    priority: 70,
  },

  // Skills questions
  {
    type: 'skills_technical_list',
    patterns: [
      /(?:what\s+)?technical\s+skills/i,
      /(?:list|tell me about)\s+(?:your\s+)?(?:tech|technical|computer)\s+skills/i,
      /programming\s+(?:skills|languages|experience)/i,
      /software\s+(?:you\s+)?(?:use|know)/i,
    ],
    priority: 70,
  },
  {
    type: 'skills_certifications_list',
    patterns: [
      /(?:what\s+)?certifications?\s+(?:do you|have you|or licenses)/i,
      /(?:list|tell me about)\s+(?:your\s+)?certifications?/i,
      /professional\s+certifications?/i,
      /what\s+certifications?\s+or\s+licenses/i, // "What certifications or licenses do you have?"
    ],
    priority: 70,
  },
  {
    type: 'skills_languages_list',
    patterns: [
      /(?:what\s+)?languages?\s+(?:do you|can you)\s+speak/i,
      /(?:list|tell me about)\s+(?:your\s+)?language\s+skills/i,
      /(?:which|what)\s+languages?/i,
    ],
    priority: 70,
  },
  {
    type: 'skills_soft_list',
    patterns: [
      /what\s+(?:are\s+your\s+)?soft\s+skills/i, // "What are your soft skills" - requires "what"
      /(?:list|tell me about)\s+(?:your\s+)?soft\s+skills/i,
      /(?:what|which)\s+interpersonal\s+(?:skills|abilities)/i, // Requires question word
      /what\s+(?:personal\s+)?strengths/i, // "What strengths would you like to highlight"
      /what\s+strengths\s+would\s+you/i, // "What strengths would you like to highlight"
      /(?:please\s+)?(?:share|provide|list)\s+(?:your\s+)?(?:personal\s+)?strengths/i,
      /need\s+(?:specific|you\s+to\s+(?:name|list))\s+.*strengths/i, // AI clarification requests
    ],
    priority: 70, // Lower than skills_soft_gate (85) - more specific patterns needed
  },

  // References questions
  {
    type: 'references_upon_request',
    patterns: [
      // Only match when AI is asking about this option, not button text
      /would you like.+references?\s+(?:available\s+)?upon\s+request/i,
      /(?:say|state|put|write)\s+.?references?\s+(?:available\s+)?upon\s+request/i,
      /just\s+(?:say|write|put)\s+.*upon\s+request/i,
      /prefer.*upon\s+request/i,
    ],
    priority: 75,
  },
  {
    type: 'reference_name',
    patterns: [
      /reference(?:'s)?\s+(?:full\s+)?name/i,
      /(?:name\s+of\s+)?(?:your\s+)?reference/i,
      /who\s+(?:is|would be)\s+(?:your\s+)?reference/i,
    ],
    priority: 70,
  },
  {
    type: 'reference_title',
    patterns: [
      /reference(?:['']s)?\s+(?:job\s+)?title/i,
      /(?:their|this person['']s)\s+(?:job\s+)?title/i,
      /position\s+(?:of\s+)?(?:your\s+)?reference/i,
      /title\s+and\s+company/i, // Combined question: "title and company"
      /(?:what is|what['']s)\s+[\w\s]+(?:['']s)?\s+title/i, // "What is Linda Anderson's title"
      /what\s+is\s+.+['']s\s+title/i, // More flexible: "What is X's title"
    ],
    priority: 70,
  },
  {
    type: 'reference_company',
    patterns: [
      /reference(?:'s)?\s+company/i,
      /(?:where\s+)?(?:does|did)\s+(?:your\s+)?reference\s+work/i,
      /(?:their|this person's)\s+(?:company|employer)/i,
    ],
    priority: 70,
  },
  {
    type: 'reference_phone',
    patterns: [
      /reference(?:'s)?\s+phone/i,
      /(?:their|this person's)\s+phone/i,
      /contact\s+number\s+for\s+(?:your\s+)?reference/i,
    ],
    priority: 70,
  },
  {
    type: 'reference_email',
    patterns: [
      /reference(?:'s)?\s+email/i,
      /(?:their|this person's)\s+email/i,
      /email\s+(?:address\s+)?for\s+(?:your\s+)?reference/i,
    ],
    priority: 70,
  },
  {
    type: 'reference_relationship',
    patterns: [
      /relationship\s+(?:to|with)\s+(?:this\s+)?(?:reference|person)/i,
      /how\s+(?:do|did)\s+you\s+know\s+(?:this\s+)?(?:person|them)/i,
      /(?:their|this person's)\s+relationship/i,
    ],
    priority: 70,
  },

  // Completion/Resume generation confirmation
  {
    type: 'review_complete',
    patterns: [
      /resume\s+(?:is\s+)?(?:complete|ready|finished|done)/i, // Must have "resume" + complete/ready/etc
      /review\s+(?:your\s+)?resume/i,
      /here(?:['']s|\s+is)\s+(?:your\s+)?(?:final\s+)?resume/i,
      /congratulations.*(?:resume|completed|finished|all done)/i, // Must be about resume completion, not graduation
      /we(?:['']re|\s+are)\s+all\s+(?:done|set|finished)/i, // Must have "we're" or "we are" for all done
      /(?:we|have)\s+completed\s+your\s+resume/i, // "Since we have completed your resume"
      /is\s+there\s+anything\s+else/i, // Common completion phrasing
      /click.*(?:view|download)/i, // "Click the View & Download button"
      /(?:would you like to )?(?:make\s+any\s+changes|change\s+anything)/i, // "Would you like to make any changes" or "change anything"
      /(?:review\s+or\s+)?change\s+anything\s+before/i, // "Would you like to review or change anything before"
      /go\s+ahead\s+and\s+create/i, // "go ahead and create it"
      /everything\s+looks\s+good/i, // "If everything looks good"
      /generat(?:e|ing)\s+(?:your\s+)?resume/i, // "generate your resume" or "generating your resume"
      /before\s+generat(?:e|ing)\s+(?:your\s+)?resume/i, // "before generating your resume"
      /let\s+me\s+review\s+what\s+we\s+have/i, // "Let me review what we have so far"
      /here(?:['']s|\s+is)\s+(?:a\s+)?summary\s+of\s+(?:your\s+)?resume/i, // "Here's a summary of your resume" - requires "resume"
      /summary\s+of\s+(?:your\s+)?resume(?:\s+details)?/i, // "summary of your resume"
    ],
    priority: 92, // Higher priority to catch summary/confirmation before other patterns
  },
];

// Sort by priority (descending) for matching
const SORTED_PATTERN_GROUPS = [...PATTERN_GROUPS].sort((a, b) => b.priority - a.priority);

// ============================================================================
// MAIN MATCHER CLASS
// ============================================================================

export class AIResponseMatcher {
  /**
   * Identify the question type from an AI message
   */
  static identifyQuestion(message: string): QuestionType {
    const lowerMessage = message.toLowerCase();

    for (const group of SORTED_PATTERN_GROUPS) {
      for (const pattern of group.patterns) {
        if (pattern.test(lowerMessage)) {
          return group.type;
        }
      }
    }

    return 'unknown';
  }

  /**
   * Check if message matches any of the given question types
   */
  static matchesAny(message: string, types: QuestionType[]): boolean {
    const detectedType = this.identifyQuestion(message);
    return types.includes(detectedType);
  }

  /**
   * Check if the message is asking about a specific section gate
   */
  static isGateQuestion(message: string): boolean {
    const gateTypes: QuestionType[] = [
      'work_gate',
      'education_gate',
      'volunteering_gate',
      'skills_technical_gate',
      'skills_certifications_gate',
      'skills_languages_gate',
      'skills_soft_gate',
      'references_gate',
    ];
    return this.matchesAny(message, gateTypes);
  }

  /**
   * Check if the message is asking about adding another entry
   */
  static isAddAnotherQuestion(message: string): boolean {
    const addAnotherTypes: QuestionType[] = [
      'work_add_another',
      'education_add_another',
      'volunteering_add_another',
      'reference_add_another',
    ];
    return this.matchesAny(message, addAnotherTypes);
  }

  /**
   * Get the section from a question type
   */
  static getSectionFromType(type: QuestionType): string | null {
    if (type.startsWith('work_')) return 'work';
    if (type.startsWith('education_')) return 'education';
    if (type.startsWith('volunteering_')) return 'volunteering';
    if (type.startsWith('skills_')) return 'skills';
    if (type.startsWith('reference')) return 'references';
    if (type.startsWith('personal_')) return 'personal';
    if (type === 'language_selection') return 'language';
    return null;
  }

  /**
   * Check if we've moved past a certain section
   * Useful for detecting when AI skips ahead
   */
  static hasMovedPastSection(message: string, targetSection: string): boolean {
    const type = this.identifyQuestion(message);
    const currentSection = this.getSectionFromType(type);

    if (!currentSection) return false;

    const sectionOrder = ['language', 'personal', 'work', 'education', 'volunteering', 'skills', 'references'];
    const targetIndex = sectionOrder.indexOf(targetSection);
    const currentIndex = sectionOrder.indexOf(currentSection);

    return currentIndex > targetIndex;
  }

  /**
   * Get all patterns that match a message (for debugging)
   */
  static getAllMatches(message: string): QuestionType[] {
    const lowerMessage = message.toLowerCase();
    const matches: QuestionType[] = [];

    for (const group of PATTERN_GROUPS) {
      for (const pattern of group.patterns) {
        if (pattern.test(lowerMessage)) {
          if (!matches.includes(group.type)) {
            matches.push(group.type);
          }
          break;
        }
      }
    }

    return matches;
  }

  /**
   * Check if message indicates completion or success
   */
  static isCompletionMessage(message: string): boolean {
    const completionPatterns = [
      /resume\s+(?:is\s+)?(?:complete|ready|finished)/i,
      /(?:we(?:'re|\s+are)\s+)?all\s+(?:done|set|finished)\s+(?:with\s+(?:your\s+)?resume|now|here)/i, // Require context, not just "all set"
      /congratulations.*(?:resume|completed|finished|all done)/i, // Must be about resume completion, not graduation
      /here(?:['']s|\s+is)\s+your\s+(?:completed?\s+)?resume/i,
      /successfully\s+(?:created|generated)/i,
      /click.*(?:view|download)\s+resume/i, // "Click the View & Download Resume button"
      /your\s+resume\s+is\s+ready/i, // "Your resume is ready"
    ];

    return completionPatterns.some(p => p.test(message));
  }

  /**
   * Check if message indicates an error or issue
   */
  static isErrorMessage(message: string): boolean {
    const errorPatterns = [
      /(?:i'm sorry|sorry\s+(?:to|about|that|for|but)|apologize)/i, // More specific "sorry" patterns
      /(?:there'?s\s+(?:an\s+)?error|problem\s+(?:with|occurred)|issue\s+(?:with|occurred))/i, // Specific error context
      /(?:couldn't|could not|can't|cannot)\s+(?:process|complete|generate)/i, // Action-specific failures
      /(?:failed|failure)\s+(?:to|in)/i, // Specific failure context
      /(?:try again|please try)/i,
    ];

    return errorPatterns.some(p => p.test(message));
  }

  /**
   * Check if message is requesting AI to generate content
   * (Like asking AI to generate responsibilities)
   */
  static isAIContentRequest(message: string): boolean {
    const requestPatterns = [
      /(?:create|generate|write|suggest)\s+(?:some\s+)?(?:responsibilities|duties)/i,
      /help\s+(?:me\s+)?(?:with|write)/i,
      /(?:what\s+)?should\s+i\s+(?:write|put|say)/i,
      /give\s+(?:me\s+)?(?:some\s+)?(?:examples?|ideas?|suggestions?)/i,
    ];

    return requestPatterns.some(p => p.test(message));
  }

  /**
   * Check if message is AI offering generated content
   * (Important for Issue #13 fix)
   */
  static isAIOfferingContent(message: string): boolean {
    const offeringPatterns = [
      /(?:would you like to )?(?:use|include)\s+(?:these|any of these|all of them)/i,
      /here\s+(?:are\s+)?(?:some\s+)?(?:suggestions?|examples?|responsibilities)/i,
      /(?:common|typical)\s+responsibilities/i,
      /(?:which|any)\s+(?:of\s+)?these/i,
      /modify\s+(?:them|these)/i,
    ];

    return offeringPatterns.some(p => p.test(message));
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a yes/no question expects a specific answer based on context
 */
export function expectsYesNo(message: string): boolean {
  const yesNoIndicators = [
    /\(yes\s+or\s+no\)/i,
    /yes\s+\/\s+no/i,
    /\?\s*$/,
    /(?:do you|would you|have you|are you)/i,
  ];

  return yesNoIndicators.some(p => p.test(message));
}

/**
 * Normalize text for comparison (remove extra whitespace, lowercase)
 */
export function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Extract key phrases from a message for debugging
 */
export function extractKeyPhrases(message: string): string[] {
  const keyPhrasePatterns = [
    /work experience/gi,
    /volunteer(?:ing)?/gi,
    /education/gi,
    /skill/gi,
    /reference/gi,
    /another\s+\w+/gi,
    /add\s+(?:another|any other)/gi,
  ];

  const phrases: string[] = [];
  for (const pattern of keyPhrasePatterns) {
    const matches = message.match(pattern);
    if (matches) {
      phrases.push(...matches);
    }
  }

  return [...new Set(phrases)]; // Remove duplicates
}
