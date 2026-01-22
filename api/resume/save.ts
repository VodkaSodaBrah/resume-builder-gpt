import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { authenticateRequest } from '../_lib/auth';
import { getResumesTable, ResumeEntity } from '../_lib/storage';

const resumeDataSchema = z.object({
  personalInfo: z.object({
    fullName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    address: z.string().optional(),
    zipCode: z.string().optional(),
    city: z.string().optional(),
    country: z.string().optional(),
  }),
  workExperience: z.array(
    z.object({
      id: z.string(),
      companyName: z.string(),
      jobTitle: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      isCurrentJob: z.boolean(),
      location: z.string(),
      responsibilities: z.string(),
      enhancedResponsibilities: z.string().optional(),
    })
  ),
  education: z.array(
    z.object({
      id: z.string(),
      schoolName: z.string(),
      degree: z.string(),
      fieldOfStudy: z.string().optional(),
      startYear: z.string(),
      endYear: z.string().optional(),
      isCurrentlyStudying: z.boolean(),
    })
  ),
  volunteering: z.array(
    z.object({
      id: z.string(),
      organizationName: z.string(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string().optional(),
      responsibilities: z.string(),
    })
  ).optional(),
  skills: z.object({
    certifications: z.array(z.string()),
    technicalSkills: z.array(z.string()),
    softSkills: z.array(z.string()),
    languages: z.array(
      z.object({
        language: z.string(),
        proficiency: z.enum(['basic', 'conversational', 'professional', 'native']),
      })
    ),
  }),
  references: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      jobTitle: z.string(),
      company: z.string(),
      phone: z.string(),
      email: z.string(),
      relationship: z.string(),
    })
  ).optional(),
  templateStyle: z.enum(['classic', 'modern', 'professional']),
  language: z.string().default('en'),
});

const saveResumeSchema = z.object({
  resumeId: z.string().optional(),
  data: resumeDataSchema,
});

export async function saveResume(
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
    const validation = saveResumeSchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      };
    }

    const { resumeId, data } = validation.data;
    const resumesTable = await getResumesTable();
    const now = new Date().toISOString();

    const id = resumeId || uuidv4();

    const resumeEntity: ResumeEntity = {
      partitionKey: auth.user.id,
      rowKey: id,
      id,
      userId: auth.user.id,
      data: JSON.stringify(data),
      templateStyle: data.templateStyle,
      language: data.language,
      createdAt: resumeId ? (await getExistingCreatedAt(resumesTable, auth.user.id, id)) || now : now,
      updatedAt: now,
    };

    if (resumeId) {
      await resumesTable.updateEntity(resumeEntity, 'Replace');
    } else {
      await resumesTable.createEntity(resumeEntity);
    }

    return {
      status: resumeId ? 200 : 201,
      jsonBody: {
        success: true,
        resumeId: id,
        message: resumeId ? 'Resume updated' : 'Resume created',
      },
    };
  } catch (error) {
    context.error('Save resume error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred while saving the resume',
      },
    };
  }
}

async function getExistingCreatedAt(
  table: Awaited<ReturnType<typeof getResumesTable>>,
  userId: string,
  resumeId: string
): Promise<string | null> {
  try {
    const existing = await table.getEntity<ResumeEntity>(userId, resumeId);
    return existing.createdAt;
  } catch {
    return null;
  }
}

app.http('saveResume', {
  methods: ['POST', 'PUT'],
  authLevel: 'anonymous',
  route: 'resume/save',
  handler: saveResume,
});
