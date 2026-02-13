/**
 * Onboarding messages and logic for new users
 * Shown before the language selection question for first-time users
 */

export const ONBOARDING_MESSAGES = [
  "Welcome! A resume is a document that tells employers about you -- your work experience, education, and skills. It's one of the most important tools for getting a job.",

  "I'm going to help you build one step by step. I'll ask you simple questions, and together we'll create a professional resume. Don't worry if you've never done this before -- I'll guide you through every part!",

  "Here's what we'll cover: your contact info, work experience, education, skills, and references. It usually takes about 10-15 minutes. Ready to get started?",
];

/**
 * Determine whether to show onboarding messages
 */
export function shouldShowOnboarding(onboardingComplete: boolean): boolean {
  return !onboardingComplete;
}
