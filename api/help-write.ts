/**
 * Help Me Write API Endpoint (Vercel Serverless Function)
 * Transforms simple coaching answers into professional resume content
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { generateFromCoaching } from './_lib/openai';

interface HelpWriteRequestBody {
  questionContext: 'work_responsibilities' | 'volunteering_responsibilities' | 'skills_technical' | 'skills_soft';
  simpleAnswers: string[];
  jobContext?: { jobTitle?: string; companyName?: string };
  language: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { questionContext, simpleAnswers, jobContext, language } = req.body as HelpWriteRequestBody;

    if (!questionContext || !simpleAnswers?.length) {
      return res.status(400).json({ error: 'Missing required fields: questionContext, simpleAnswers' });
    }

    const generatedContent = await generateFromCoaching(
      questionContext,
      simpleAnswers,
      jobContext,
      language || 'en'
    );

    return res.status(200).json({
      success: true,
      generatedContent,
    });
  } catch (error) {
    console.error('Help-write error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to generate content. Please try again.',
    });
  }
}
