/**
 * Resume Enhancement Endpoint (Vercel Serverless Function)
 * Handles AI-powered job description enhancement
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import {
  enhanceJobDescription,
  enhanceAllWorkExperiences,
  suggestSkills,
  generateProfessionalSummary,
} from '../_lib/openai';
import { securityCheck } from '../_lib/vercel-security';

const enhanceSchema = z.object({
  type: z.enum(['job_description', 'all_experiences', 'suggest_skills', 'professional_summary']),
  data: z.any(),
  language: z.string().default('en'),
});

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

  try {
    const body = req.body;
    const validation = enhanceSchema.safeParse(body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const { type, data, language } = validation.data;

    let result: unknown;

    switch (type) {
      case 'job_description': {
        const { description, jobTitle } = data;
        result = await enhanceJobDescription(description, jobTitle, language);
        break;
      }

      case 'all_experiences': {
        const { workExperiences } = data;
        result = await enhanceAllWorkExperiences(workExperiences, language);
        break;
      }

      case 'suggest_skills': {
        const { workExperience, existingSkills } = data;
        result = await suggestSkills(workExperience, existingSkills);
        break;
      }

      case 'professional_summary': {
        const { personalInfo, workExperience, skills } = data;
        result = await generateProfessionalSummary(
          personalInfo,
          workExperience,
          skills,
          language
        );
        break;
      }

      default:
        res.status(400).json({ success: false, error: 'Invalid enhancement type' });
        return;
    }

    res.status(200).json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Enhance resume error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during enhancement',
    });
  }
}
