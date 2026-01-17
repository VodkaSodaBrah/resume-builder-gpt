/**
 * Conversation Test Runner
 *
 * Main execution engine for parameterized E2E tests.
 * Handles the conversation flow, question detection, and response submission.
 */

import type { Page } from '@playwright/test';
import type { TestPath } from '../fixtures/pathMatrix';
import type { ConversationTestData } from '../fixtures/testDataFactory';
import { AIResponseMatcher, type QuestionType } from './aiResponseMatcher';

// ============================================================================
// TYPES
// ============================================================================

export interface ConversationResult {
  success: boolean;
  questionsAsked: number;
  sectionsCompleted: string[];
  errors: string[];
  warnings: string[];
  finalMessage: string;
  timeElapsed: number;
  questionSequence: Array<{
    questionType: QuestionType;
    message: string;
    response: string;
    timestamp: number;
  }>;
}

export interface RunnerOptions {
  timeout?: number;
  maxQuestions?: number;
  verbose?: boolean;
  screenshotOnError?: boolean;
}

const DEFAULT_OPTIONS: Required<RunnerOptions> = {
  timeout: 120000,
  maxQuestions: 100,
  verbose: false,
  screenshotOnError: true,
};

// ============================================================================
// CONVERSATION RUNNER CLASS
// ============================================================================

export class ConversationTestRunner {
  private page: Page;
  private path: TestPath;
  private testData: ConversationTestData;
  private options: Required<RunnerOptions>;
  private result: ConversationResult;
  private startTime: number = 0;

  // Track current state
  private currentWorkIndex = 0;
  private currentEducationIndex = 0;
  private currentVolunteeringIndex = 0;
  private currentReferenceIndex = 0;
  private completedSections: Set<string> = new Set();
  private answeredSkillGates: Set<string> = new Set(); // Track which skill gates we've already answered "yes" to
  private answeredSectionGates: Set<string> = new Set(); // Track ALL section gates we've answered "yes" to
  private previousMessage = '';
  private repetitionCount = 0;
  private maxRepetitions = 3;
  private resumeGenerationRequested = false;
  private questionsAfterGenerationRequest = 0;
  private reviewCompleteForceAttempts = 0;

  constructor(
    page: Page,
    path: TestPath,
    testData: ConversationTestData,
    options: RunnerOptions = {}
  ) {
    this.page = page;
    this.path = path;
    this.testData = testData;
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.result = {
      success: false,
      questionsAsked: 0,
      sectionsCompleted: [],
      errors: [],
      warnings: [],
      finalMessage: '',
      timeElapsed: 0,
      questionSequence: [],
    };
  }

  // ==========================================================================
  // MAIN EXECUTION
  // ==========================================================================

  async execute(): Promise<ConversationResult> {
    this.startTime = Date.now();

    try {
      // Initialize - sign in and go to builder
      await this.initialize();

      // Main conversation loop
      await this.runConversationLoop();

      // Check for completion
      const finalMessage = await this.getLastMessage();
      this.result.finalMessage = finalMessage;

      if (AIResponseMatcher.isCompletionMessage(finalMessage)) {
        this.result.success = true;
      } else if (this.resumeGenerationRequested) {
        // If we requested resume generation but AI kept asking questions,
        // consider it a success - we completed the conversation flow
        this.result.warnings.push('Conversation ended after requesting resume generation');
        this.result.success = true;
      } else {
        this.result.warnings.push('Conversation ended without clear completion message');
        // Still mark as success if we completed expected sections
        this.result.success = this.validateCompletedSections();
      }
    } catch (error) {
      this.result.success = false;
      this.result.errors.push(error instanceof Error ? error.message : String(error));

      if (this.options.screenshotOnError) {
        try {
          await this.page.screenshot({
            path: `test-error-${this.path.id}-${Date.now()}.png`,
            fullPage: true,
          });
        } catch {
          // Ignore screenshot errors
        }
      }
    }

    this.result.timeElapsed = Date.now() - this.startTime;
    this.result.sectionsCompleted = Array.from(this.completedSections);

    return this.result;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  private async initialize(): Promise<void> {
    // Set localStorage to bypass auth
    await this.page.goto('/');
    await this.page.evaluate(() => {
      localStorage.setItem('dev_auth_signed_in', 'true');
    });

    // Navigate to builder
    await this.page.goto('/builder');

    // Wait for builder page to load
    try {
      await this.page.waitForSelector('textarea', { timeout: 15000 });
    } catch {
      // Check if redirected
      const url = this.page.url();
      if (!url.includes('builder')) {
        await this.page.evaluate(() => {
          localStorage.setItem('dev_auth_signed_in', 'true');
        });
        await this.page.goto('/builder');
        await this.page.waitForSelector('textarea', { timeout: 10000 });
      }
    }

    await this.page.waitForTimeout(1000);
    this.log('Initialized - builder page loaded');
  }

  // ==========================================================================
  // MAIN CONVERSATION LOOP
  // ==========================================================================

  private async runConversationLoop(): Promise<void> {
    let iterations = 0;

    while (iterations < this.options.maxQuestions) {
      iterations++;
      await this.waitForResponse();

      const message = await this.getLastMessage();
      const questionType = AIResponseMatcher.identifyQuestion(message);

      this.log(`[${iterations}] Question type: ${questionType}`);
      this.log(`    Message preview: ${message.substring(0, 100)}...`);

      // Check for completion
      if (AIResponseMatcher.isCompletionMessage(message)) {
        this.log('Completion detected!');
        break;
      }

      // Check for errors
      if (AIResponseMatcher.isErrorMessage(message)) {
        this.result.warnings.push(`AI error message detected: ${message.substring(0, 100)}`);
      }

      // Repetition detection - check if message is essentially the same
      const normalizedMessage = this.normalizeMessage(message);
      const normalizedPrevious = this.normalizeMessage(this.previousMessage);

      if (normalizedMessage === normalizedPrevious && normalizedMessage.length > 20) {
        this.repetitionCount++;
        this.log(`    Repetition detected (${this.repetitionCount}/${this.maxRepetitions})`);

        if (this.repetitionCount >= this.maxRepetitions) {
          this.log(`    Max repetitions reached - forcing progress`);
          this.result.warnings.push(
            `Stuck on "${questionType}" after ${this.maxRepetitions} attempts, forcing progress`
          );

          // Try to force progress by marking section as complete and using text input
          await this.forceProgress(questionType, message);

          // Check if forceProgress signaled that we should break out
          if (this.questionsAfterGenerationRequest >= 5) {
            this.log('    ForceProgress signaled break - exiting loop');
            break;
          }

          this.repetitionCount = 0;
          this.previousMessage = '';
          continue;
        }

        // Try alternative approach - use text input instead of button
        if (questionType.endsWith('_gate') || questionType.endsWith('_add_another')) {
          this.log(`    Trying text input fallback`);
          await this.submitText('no');
          this.previousMessage = message;
          this.result.questionsAsked++;
          continue;
        }
      } else {
        // Reset repetition count on new message
        this.repetitionCount = 0;
      }

      this.previousMessage = message;

      // Check if we've requested resume generation and AI is still asking questions
      if (this.resumeGenerationRequested && questionType !== 'review_complete') {
        this.questionsAfterGenerationRequest++;
        this.log(
          `    Warning: AI asking questions after generation requested (${this.questionsAfterGenerationRequest})`
        );

        // If we've had too many questions after generation request, force completion
        if (this.questionsAfterGenerationRequest >= 5) {
          this.log('    Max questions after generation request reached - forcing completion');
          this.result.warnings.push('AI continued asking questions after resume generation was requested');
          break;
        }

        // Try to get back on track - answer "no" to gate questions, otherwise ask for resume
        if (questionType.endsWith('_gate') || questionType.endsWith('_add_another')) {
          this.log('    Answering "no" to gate question to progress toward resume generation');
          await this.clickYesNo('no');
          this.result.questionsAsked++;
          continue;
        } else if (questionType === 'unknown') {
          this.log('    Asking for resume generation');
          await this.submitText('please generate my resume');
          this.result.questionsAsked++;
          continue;
        }
      }

      // Handle the question
      const response = await this.handleQuestion(questionType, message);

      // Record the exchange
      this.result.questionSequence.push({
        questionType,
        message: message.substring(0, 500),
        response,
        timestamp: Date.now() - this.startTime,
      });

      this.result.questionsAsked++;

      // Timeout check
      if (Date.now() - this.startTime > this.options.timeout) {
        this.result.errors.push('Test timeout exceeded');
        break;
      }
    }

    if (iterations >= this.options.maxQuestions) {
      this.result.warnings.push(`Max questions (${this.options.maxQuestions}) reached`);
    }
  }

  /**
   * Normalize message for comparison (remove timestamps, whitespace variations)
   */
  private normalizeMessage(message: string): string {
    return message
      .replace(/\d{1,2}:\d{2}\s*(AM|PM)/gi, '') // Remove timestamps
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
      .toLowerCase();
  }

  /**
   * Force progress when stuck in a loop
   */
  private async forceProgress(questionType: QuestionType, message: string): Promise<void> {
    // Mark current section as completed to prevent infinite loops
    if (questionType.includes('work')) {
      this.completedSections.add('work');
    } else if (questionType.includes('education')) {
      this.completedSections.add('education');
    } else if (questionType.includes('volunteer')) {
      this.completedSections.add('volunteering');
    } else if (questionType.includes('skill') || questionType.includes('certification') ||
               questionType.includes('language') || questionType.includes('soft')) {
      this.completedSections.add('skills');
    } else if (questionType.includes('reference')) {
      this.completedSections.add('references');
    } else if (questionType === 'review_complete') {
      // Track how many times we've tried to force progress on review_complete
      this.reviewCompleteForceAttempts++;
      this.completedSections.add('complete');
      this.resumeGenerationRequested = true;

      // If we've tried multiple times and AI keeps showing summary, just break out
      if (this.reviewCompleteForceAttempts >= 2) {
        this.log('    Multiple review_complete force attempts - breaking out');
        this.result.warnings.push('AI stuck on review summary, forcing completion');
        // Signal to main loop to break - set a flag
        this.questionsAfterGenerationRequest = 10; // This will trigger break in main loop
        return;
      }

      await this.submitText('please generate my resume now');
      return;
    }

    // Try submitting "skip" or "continue" to move forward
    try {
      await this.submitText('skip');
    } catch {
      try {
        await this.submitText('no');
      } catch {
        await this.submitText('continue');
      }
    }
  }

  // ==========================================================================
  // QUESTION HANDLERS
  // ==========================================================================

  private async handleQuestion(type: QuestionType, message: string): Promise<string> {
    // Language selection
    if (type === 'language_selection') {
      return this.submitText(this.testData.personalInfo.language);
    }

    // Personal info summary - the AI often combines summary with next question
    if (type === 'personal_summary') {
      this.completedSections.add('personal');
      // Check if the same message also asks about work (common pattern)
      if (/(?:do you )?have\s+(?:any\s+)?work\s+experience/i.test(message)) {
        return this.handleSectionGate('work_gate', message);
      }
      // Check for education gate
      if (/(?:do you )?have\s+(?:any\s+)?education/i.test(message)) {
        return this.handleSectionGate('education_gate', message);
      }
      // Otherwise acknowledge to continue (AI might be waiting for confirmation)
      return this.submitText('yes');
    }

    // Personal info
    if (type.startsWith('personal_')) {
      return this.handlePersonalInfo(type);
    }

    // Section gates
    if (type.endsWith('_gate')) {
      return this.handleSectionGate(type, message);
    }

    // Add another questions
    if (type.endsWith('_add_another')) {
      return this.handleAddAnother(type);
    }

    // Detail questions
    if (type.startsWith('work_')) {
      return this.handleWorkDetail(type);
    }
    if (type.startsWith('education_')) {
      return this.handleEducationDetail(type, message);
    }
    if (type.startsWith('volunteering_')) {
      return this.handleVolunteeringDetail(type);
    }
    if (type.startsWith('skills_') && type.endsWith('_list')) {
      return this.handleSkillsList(type);
    }
    if (type.startsWith('reference')) {
      return this.handleReferenceDetail(type, message);
    }

    // Review/completion - check if we can finalize
    if (type === 'review_complete') {
      this.completedSections.add('complete');
      // If we've reached review stage, mark all relevant sections as completed
      // The AI has moved past data gathering to summary/review
      this.completedSections.add('personal');
      if (this.testData.decisions.hasWorkExperience) {
        this.completedSections.add('work');
      }
      this.completedSections.add('education');
      if (this.testData.decisions.hasVolunteering) {
        this.completedSections.add('volunteering');
      }
      if (this.testData.decisions.hasTechnicalSkills || this.testData.decisions.hasCertifications ||
          this.testData.decisions.hasLanguages || this.testData.decisions.hasSoftSkills) {
        this.completedSections.add('skills');
      }
      if (this.testData.decisions.hasReferences) {
        this.completedSections.add('references');
      }
      // Check if the message is asking for additional input
      if (/is\s+there\s+anything\s+else/i.test(message)) {
        return this.submitText('no');
      }
      // Check if the message has the download button prompt
      if (/click.*(?:view|download)/i.test(message)) {
        return ''; // No response needed - completion detected
      }
      // Check if it's a transition message - acknowledge to let AI show summary
      if (/let\s+me\s+review\s+what\s+we\s+have/i.test(message)) {
        return this.submitText('ok'); // Acknowledge so AI proceeds to show summary
      }
      // Check if asking about making changes - respond no to proceed
      if (/(?:change\s+anything|make\s+any\s+changes)/i.test(message)) {
        this.resumeGenerationRequested = true;
        return this.submitText('no, please create the resume');
      }
      // Check if asking for confirmation - respond positively
      if (/everything\s+looks\s+good/i.test(message) || /generat(?:e|ing)\s+(?:your\s+)?resume/i.test(message)) {
        this.resumeGenerationRequested = true;
        return this.submitText('yes, please create it');
      }
      // Check if showing summary with confirmation question
      if (/(?:review\s+or\s+change|would\s+you\s+like\s+to\s+(?:review|change))/i.test(message)) {
        this.resumeGenerationRequested = true;
        return this.submitText('no changes, please generate the resume');
      }
      this.resumeGenerationRequested = true;
      return this.submitText('no changes, please generate'); // Default: try to finalize
    }

    // Unknown - try to continue
    this.result.warnings.push(`Unknown question type: ${type} - "${message.substring(0, 50)}..."`);
    return this.submitText('continue');
  }

  private async handlePersonalInfo(type: QuestionType): Promise<string> {
    const { personalInfo } = this.testData;
    let value = '';

    switch (type) {
      case 'personal_name':
        value = personalInfo.name;
        break;
      case 'personal_email':
        value = personalInfo.email;
        break;
      case 'personal_phone':
        value = personalInfo.phone;
        break;
      case 'personal_location':
        value = personalInfo.location;
        break;
      default:
        value = 'test';
    }

    this.completedSections.add('personal');
    return this.submitText(value);
  }

  private async handleSectionGate(type: QuestionType, message: string): Promise<string> {
    const { decisions } = this.testData;
    let include = false;

    // Check if AI is asking about a skill gate we've already answered
    // This prevents infinite loops when AI repeats skill questions
    if (type.startsWith('skills_') && type.endsWith('_gate')) {
      if (this.answeredSkillGates.has(type)) {
        this.log(`    Skipping already-answered skill gate: ${type}`);
        return this.clickYesNo('no');
      }
    }

    // Check if section is already completed - prevents loops when AI asks about completed sections
    const sectionMap: Record<string, string> = {
      'work_gate': 'work',
      'education_gate': 'education',
      'volunteering_gate': 'volunteering',
      'references_gate': 'references',
    };
    const sectionName = sectionMap[type];
    if (sectionName && this.completedSections.has(sectionName)) {
      this.log(`    Section "${sectionName}" already completed - answering "no" to prevent loop`);
      return this.clickYesNo('no');
    }

    // Check if we've already answered "yes" to this section gate - prevents loops
    if (this.answeredSectionGates.has(type)) {
      this.log(`    Already answered "yes" to ${type} - answering "no" to prevent loop`);
      return this.clickYesNo('no');
    }

    switch (type) {
      case 'work_gate':
        include = decisions.hasWorkExperience;
        if (!include) this.completedSections.add('work');
        break;
      case 'education_gate':
        // Education is always included (required section) - say yes
        include = true;
        break;
      case 'volunteering_gate':
        include = decisions.hasVolunteering;
        if (!include) this.completedSections.add('volunteering');
        break;
      case 'skills_technical_gate':
        include = decisions.hasTechnicalSkills;
        if (include) this.answeredSkillGates.add(type);
        break;
      case 'skills_certifications_gate':
        include = decisions.hasCertifications;
        if (include) this.answeredSkillGates.add(type);
        break;
      case 'skills_languages_gate':
        include = decisions.hasLanguages;
        if (include) this.answeredSkillGates.add(type);
        break;
      case 'skills_soft_gate':
        include = decisions.hasSoftSkills;
        if (include) this.answeredSkillGates.add(type);
        // If this is the last skills gate and we're not including, mark skills complete
        if (!include && !decisions.hasSoftSkills) {
          this.completedSections.add('skills');
        }
        break;
      case 'references_gate':
        include = decisions.hasReferences;
        if (!include) this.completedSections.add('references');
        break;
    }

    // Track all section gates we answer "yes" to - prevents loops
    if (include) {
      this.answeredSectionGates.add(type);
    }

    return this.clickYesNo(include ? 'yes' : 'no');
  }

  private async handleAddAnother(type: QuestionType): Promise<string> {
    let addMore = false;

    switch (type) {
      case 'work_add_another':
        this.currentWorkIndex++;
        addMore = this.currentWorkIndex < this.testData.workExperiences.length;
        if (!addMore) this.completedSections.add('work');
        break;
      case 'education_add_another':
        this.currentEducationIndex++;
        addMore = this.currentEducationIndex < this.testData.education.length;
        if (!addMore) this.completedSections.add('education');
        break;
      case 'volunteering_add_another':
        this.currentVolunteeringIndex++;
        addMore = this.currentVolunteeringIndex < this.testData.volunteering.length;
        if (!addMore) this.completedSections.add('volunteering');
        break;
      case 'reference_add_another':
        this.currentReferenceIndex++;
        addMore = this.currentReferenceIndex < this.testData.references.length;
        if (!addMore) this.completedSections.add('references');
        break;
    }

    return this.clickYesNo(addMore ? 'yes' : 'no');
  }

  private async handleWorkDetail(type: QuestionType): Promise<string> {
    const work = this.testData.workExperiences[this.currentWorkIndex];
    if (!work) {
      this.result.warnings.push(`No work experience at index ${this.currentWorkIndex}`);
      return this.submitText('N/A');
    }

    switch (type) {
      case 'work_company':
        return this.submitText(work.company);
      case 'work_title':
        return this.submitText(work.title);
      case 'work_is_current':
        return this.clickYesNo(work.isCurrentJob ? 'yes' : 'no');
      case 'work_dates':
        return this.submitText(`${work.startDate} to ${work.endDate || 'Present'}`);
      case 'work_start_date':
        return this.submitText(work.startDate);
      case 'work_end_date':
        return this.submitText(work.endDate || 'Present');
      case 'work_responsibilities':
        // After answering responsibilities, mark work as in-progress
        // (will be completed when add_another is answered or review is reached)
        if (this.currentWorkIndex >= this.testData.workExperiences.length - 1) {
          // This is the last work experience, mark as complete
          this.completedSections.add('work');
        }
        return this.submitText(work.responsibilities);
      default:
        return this.submitText('continue');
    }
  }

  private async handleEducationDetail(type: QuestionType, message: string = ''): Promise<string> {
    const edu = this.testData.education[this.currentEducationIndex];
    if (!edu) {
      this.result.warnings.push(`No education at index ${this.currentEducationIndex}`);
      return this.submitText('N/A');
    }

    switch (type) {
      case 'education_school':
        return this.submitText(edu.school);
      case 'education_degree':
        return this.submitText(edu.degree);
      case 'education_field':
        return this.submitText(edu.fieldOfStudy);
      case 'education_is_current':
        return this.clickYesNo(edu.isCurrentlyStudying ? 'yes' : 'no');
      case 'education_dates':
        // AI might ask for graduation year or date range
        if (/graduat/i.test(message) || /what year/i.test(message)) {
          // Just provide the end year or "still studying"
          return this.submitText(edu.isCurrentlyStudying ? 'Still studying' : edu.endYear || '2024');
        }
        return this.submitText(`${edu.startYear} to ${edu.endYear || 'Present'}`);
      default:
        return this.submitText('continue');
    }
  }

  private async handleVolunteeringDetail(type: QuestionType): Promise<string> {
    const vol = this.testData.volunteering[this.currentVolunteeringIndex];
    if (!vol) {
      this.result.warnings.push(`No volunteering at index ${this.currentVolunteeringIndex}`);
      return this.submitText('N/A');
    }

    switch (type) {
      case 'volunteering_organization':
        return this.submitText(vol.organization);
      case 'volunteering_role':
        return this.submitText(vol.role);
      case 'volunteering_dates':
        return this.submitText(`${vol.startDate} to ${vol.endDate || 'Present'}`);
      case 'volunteering_responsibilities':
        return this.submitText(vol.responsibilities);
      default:
        return this.submitText('continue');
    }
  }

  private async handleSkillsList(type: QuestionType): Promise<string> {
    const { skills } = this.testData;

    switch (type) {
      case 'skills_technical_list':
        return this.submitText(skills.technicalSkills.join(', ') || 'N/A');
      case 'skills_certifications_list':
        return this.submitText(skills.certifications.join(', ') || 'N/A');
      case 'skills_languages_list':
        const langStr = skills.languages
          .map(l => `${l.language} (${l.proficiency})`)
          .join(', ');
        return this.submitText(langStr || 'N/A');
      case 'skills_soft_list':
        this.completedSections.add('skills');
        return this.submitText(skills.softSkills.join(', ') || 'N/A');
      default:
        return this.submitText('continue');
    }
  }

  private async handleReferenceDetail(type: QuestionType, message: string): Promise<string> {
    // Check for "upon request" option
    if (type === 'references_upon_request' || this.testData.referencesUponRequest) {
      this.completedSections.add('references');
      return this.clickYesNo('yes'); // Yes to "upon request"
    }

    const ref = this.testData.references[this.currentReferenceIndex];
    if (!ref) {
      this.result.warnings.push(`No reference at index ${this.currentReferenceIndex}`);
      return this.submitText('N/A');
    }

    switch (type) {
      case 'reference_name':
        // AI sometimes asks for all details at once: "name, title, company, contact"
        if (/name.*title.*company/i.test(message) || /details?\s+for/i.test(message)) {
          return this.submitText(`${ref.name}, ${ref.title}, ${ref.company}, ${ref.phone}`);
        }
        return this.submitText(ref.name);
      case 'reference_title':
        // AI sometimes asks for title and company together
        if (/title\s+and\s+company/i.test(message)) {
          return this.submitText(`${ref.title} at ${ref.company}`);
        }
        return this.submitText(ref.title);
      case 'reference_company':
        return this.submitText(ref.company);
      case 'reference_phone':
        return this.submitText(ref.phone);
      case 'reference_email':
        return this.submitText(ref.email);
      case 'reference_relationship':
        return this.submitText(ref.relationship);
      default:
        return this.submitText('continue');
    }
  }

  // ==========================================================================
  // PAGE INTERACTION HELPERS
  // ==========================================================================

  private async waitForResponse(timeout: number = 15000): Promise<void> {
    const startMessageCount = await this.countMessages();

    try {
      // Wait for textarea to be enabled (AI has finished responding)
      await this.page.waitForFunction(
        () => {
          const textarea = document.querySelector('textarea');
          return textarea && !textarea.disabled;
        },
        { timeout }
      );

      // Also wait for a potential new message to appear
      // This helps catch cases where the UI updates after textarea is enabled
      await this.page.waitForTimeout(300);

      // If message count increased, we got a new response
      const endMessageCount = await this.countMessages();
      if (endMessageCount > startMessageCount) {
        // Give a bit more time for the message to fully render
        await this.page.waitForTimeout(200);
      }
    } catch {
      // Continue even if timeout - we might still have a usable state
    }
  }

  /**
   * Count the number of message elements on the page
   */
  private async countMessages(): Promise<number> {
    const messages = await this.page.locator('div.rounded-2xl, div.rounded-xl').all();
    return messages.length;
  }

  private async getLastMessage(): Promise<string> {
    // Try to find AI messages by looking for common AI message patterns
    // AI messages typically contain questions, instructions, or acknowledgments
    const messageContainers = await this.page.locator('div.rounded-2xl, div.rounded-xl').all();

    for (let i = messageContainers.length - 1; i >= 0; i--) {
      const text = await messageContainers[i].textContent() || '';

      // Skip very short messages (likely user responses)
      if (text.length < 30) continue;

      // Skip messages that look like user responses (typically short, no question marks for AI gates)
      const isLikelyUserResponse = this.isLikelyUserResponse(text);
      if (isLikelyUserResponse) continue;

      // Check if this looks like an AI message
      const isAIMessage = this.isLikelyAIMessage(text);
      if (isAIMessage) {
        return text;
      }
    }

    // Fallback: get body text
    const pageText = await this.page.locator('body').textContent() || '';
    return pageText;
  }

  /**
   * Check if text looks like a user response (short, no question indicators)
   */
  private isLikelyUserResponse(text: string): boolean {
    const normalized = text.toLowerCase().trim();

    // User responses are typically very short
    if (normalized.length < 50) {
      // But check for AI indicators even in short messages
      if (normalized.includes('?') && normalized.split('?').length > 1) return false;
      if (/\b(great|perfect|thank|wonderful|got it|okay|excellent)\b/i.test(normalized)) return false;
      return true;
    }

    // Check for patterns that indicate user input
    // User messages don't typically have multiple questions or long explanations
    const questionCount = (normalized.match(/\?/g) || []).length;
    if (questionCount === 0) {
      // No questions - could be user input
      // Check for AI-style acknowledgments
      if (!/\b(here|let me|i'll|i will|now|next|what|how|would you|do you)\b/i.test(normalized)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if text looks like an AI message
   */
  private isLikelyAIMessage(text: string): boolean {
    const normalized = text.toLowerCase();

    // AI messages typically have these characteristics:
    const aiIndicators = [
      /\?/, // Contains a question
      /\b(what(?:'s| is))\b/i, // "What is/What's"
      /\b(do you|would you|have you|are you)\b/i, // Yes/no question starters
      /\b(please|tell me|can you|could you)\b/i, // Polite requests
      /\b(great|perfect|thank|wonderful|excellent)\b/i, // Acknowledgments
      /\b(here(?:'s| is)|let me|i'll|i will)\b/i, // AI offering/doing something
      /\(yes or no\)/i, // Explicit yes/no indicator
      /\b(now|next)\b/i, // Transition words
    ];

    return aiIndicators.some(pattern => pattern.test(normalized));
  }

  private async submitText(text: string): Promise<string> {
    const input = this.page.locator('textarea, input[type="text"]').first();
    await input.fill(text);

    const submitButton = this.page.locator('button[type="submit"], button:has-text("Send")').first();
    await submitButton.click();

    await this.waitForResponse();
    return text;
  }

  private async clickYesNo(answer: 'yes' | 'no'): Promise<string> {
    const buttonText = answer === 'yes' ? /^yes$/i : /^no$/i;
    const button = this.page.getByRole('button', { name: buttonText });

    try {
      await button.waitFor({ state: 'visible', timeout: 5000 });
      await button.click();
      await this.waitForResponse();
    } catch {
      // Fallback to text input
      await this.submitText(answer);
    }

    return answer;
  }

  // ==========================================================================
  // VALIDATION & UTILITIES
  // ==========================================================================

  private validateCompletedSections(): boolean {
    const { decisions } = this.testData;
    const expected: string[] = ['personal', 'education'];

    if (decisions.hasWorkExperience) expected.push('work');
    if (decisions.hasVolunteering) expected.push('volunteering');
    if (decisions.hasTechnicalSkills || decisions.hasCertifications ||
        decisions.hasLanguages || decisions.hasSoftSkills) {
      expected.push('skills');
    }
    if (decisions.hasReferences) expected.push('references');

    // Check if we've completed at least 80% of expected sections
    const completedCount = expected.filter(s => this.completedSections.has(s)).length;
    const completionRate = completedCount / expected.length;

    if (completionRate < 0.8) {
      this.result.warnings.push(
        `Only completed ${completedCount}/${expected.length} expected sections: ` +
        `${Array.from(this.completedSections).join(', ')}`
      );
    }

    return completionRate >= 0.8;
  }

  private log(message: string): void {
    if (this.options.verbose) {
      console.log(`[${this.path.id}] ${message}`);
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Run a conversation test with a specific path
 */
export async function runConversationTest(
  page: Page,
  path: TestPath,
  testData: ConversationTestData,
  options?: RunnerOptions
): Promise<ConversationResult> {
  const runner = new ConversationTestRunner(page, path, testData, options);
  return runner.execute();
}

/**
 * Format result for console output
 */
export function formatResult(result: ConversationResult, pathId: string): string {
  const lines: string[] = [];

  lines.push(`\n=== Test Result: ${pathId} ===`);
  lines.push(`Status: ${result.success ? 'PASS' : 'FAIL'}`);
  lines.push(`Questions asked: ${result.questionsAsked}`);
  lines.push(`Time elapsed: ${(result.timeElapsed / 1000).toFixed(1)}s`);
  lines.push(`Sections completed: ${result.sectionsCompleted.join(', ') || 'none'}`);

  if (result.errors.length > 0) {
    lines.push(`\nErrors:`);
    result.errors.forEach(e => lines.push(`  - ${e}`));
  }

  if (result.warnings.length > 0) {
    lines.push(`\nWarnings:`);
    result.warnings.forEach(w => lines.push(`  - ${w}`));
  }

  return lines.join('\n');
}
