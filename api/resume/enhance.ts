import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { authenticateRequest } from '../lib/auth';
import {
  enhanceJobDescription,
  enhanceAllWorkExperiences,
  suggestSkills,
  generateProfessionalSummary,
} from '../lib/openai';

const enhanceSchema = z.object({
  type: z.enum(['job_description', 'all_experiences', 'suggest_skills', 'professional_summary']),
  data: z.any(),
  language: z.string().default('en'),
});

export async function enhanceResume(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate
    const auth = await authenticateRequest(request.headers.get('authorization') || undefined);
    if (!auth) {
      return {
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized' },
      };
    }

    const body = await request.json();
    const validation = enhanceSchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      };
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
        return {
          status: 400,
          jsonBody: { success: false, error: 'Invalid enhancement type' },
        };
    }

    return {
      status: 200,
      jsonBody: {
        success: true,
        result,
      },
    };
  } catch (error) {
    context.error('Enhance resume error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred during enhancement',
      },
    };
  }
}

app.http('enhanceResume', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'resume/enhance',
  handler: enhanceResume,
});
