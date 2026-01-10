import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../lib/auth';
import { getResumesTable, ResumeEntity } from '../lib/storage';

export async function getResume(
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

    const resumeId = request.params.id;
    if (!resumeId) {
      return {
        status: 400,
        jsonBody: { success: false, error: 'Resume ID is required' },
      };
    }

    const resumesTable = await getResumesTable();

    try {
      const entity = await resumesTable.getEntity<ResumeEntity>(auth.user.id, resumeId);

      return {
        status: 200,
        jsonBody: {
          success: true,
          resume: {
            id: entity.id,
            userId: entity.userId,
            data: JSON.parse(entity.data),
            templateStyle: entity.templateStyle,
            language: entity.language,
            createdAt: entity.createdAt,
            updatedAt: entity.updatedAt,
            pdfBlobUrl: entity.pdfBlobUrl,
            docxBlobUrl: entity.docxBlobUrl,
          },
        },
      };
    } catch {
      return {
        status: 404,
        jsonBody: { success: false, error: 'Resume not found' },
      };
    }
  } catch (error) {
    context.error('Get resume error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred while fetching the resume',
      },
    };
  }
}

app.http('getResume', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'resume/{id}',
  handler: getResume,
});
