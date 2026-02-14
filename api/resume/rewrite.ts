/**
 * Resume Field Rewrite Endpoint (Vercel Serverless Function)
 * Handles AI-powered single-field rewriting for inline editing
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { z } from 'zod';
import { rewriteFieldContent } from '../_lib/openai';
import { securityCheck } from '../_lib/vercel-security';

const rewriteSchema = z.object({
  fieldType: z.enum(['responsibility', 'job_title', 'role', 'summary']),
  currentValue: z.string().min(1),
  context: z.object({
    jobTitle: z.string().optional(),
    section: z.string().optional(),
  }).optional(),
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
    const validation = rewriteSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
      return;
    }

    const { fieldType, currentValue, context, language } = validation.data;

    const rewritten = await rewriteFieldContent(
      fieldType,
      currentValue,
      context,
      language
    );

    res.status(200).json({
      success: true,
      rewritten,
    });
  } catch (error) {
    console.error('Rewrite field error:', error);
    res.status(500).json({
      success: false,
      error: 'An error occurred during rewriting',
    });
  }
}
