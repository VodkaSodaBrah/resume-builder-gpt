/**
 * Help Me Write - AI Coaching module
 * Provides coaching questions and context mapping for the "Help Me Write This" feature
 */

import type { HelpMeWriteContext, HelpMeWriteRequest, HelpMeWriteResponse } from '@/types';

export type CoachingContext = HelpMeWriteContext;

/**
 * Coaching questions per context -- simple questions to help non-technical users
 * articulate their experience in plain language
 */
export const COACHING_QUESTIONS: Record<CoachingContext, string[]> = {
  work_responsibilities: [
    "What did you do on a typical day at work?",
    "Did you work with customers or as part of a team?",
    "Did anything you did save time, money, or make things better?",
  ],
  volunteering_responsibilities: [
    "What did you usually do when you volunteered?",
    "How many people did you help or work with?",
  ],
  skills_technical: [
    "What computer programs or tools do you use?",
    "What machines or equipment can you operate?",
  ],
  skills_soft: [
    "What are you really good at?",
    "What do people compliment you on at work?",
  ],
};

/**
 * Get coaching questions for a given context
 */
export function getCoachingQuestions(context: CoachingContext): string[] {
  return COACHING_QUESTIONS[context] || [];
}

/**
 * Map a question ID to a coaching context
 */
export function getCoachingContext(questionId: string): CoachingContext | null {
  const map: Record<string, CoachingContext> = {
    'work_responsibilities_1': 'work_responsibilities',
    'volunteering_responsibilities': 'volunteering_responsibilities',
    'skills_technical': 'skills_technical',
    'skills_soft': 'skills_soft',
  };
  return map[questionId] || null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * Send coaching answers to the API to generate professional content
 */
export async function sendHelpMeWriteRequest(
  request: HelpMeWriteRequest
): Promise<HelpMeWriteResponse> {
  const response = await fetch(`${API_BASE_URL}/help-write`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    throw new Error(`Help Me Write API error: ${response.status}`);
  }

  const data = await response.json();
  return { generatedContent: data.generatedContent || '' };
}
