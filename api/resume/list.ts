import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../_lib/auth';
import { getResumesTable, ResumeEntity } from '../_lib/storage';
import { secureResponse, isValidUuid } from '../_lib/security';

export async function listResumes(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // Authenticate
    const auth = await authenticateRequest(request.headers.get('authorization') || undefined);
    if (!auth) {
      return secureResponse({
        status: 401,
        jsonBody: { success: false, error: 'Unauthorized' },
      }, request);
    }

    // SECURITY: Validate user ID format to prevent injection
    if (!isValidUuid(auth.user.id)) {
      return secureResponse({
        status: 400,
        jsonBody: { success: false, error: 'Invalid user identifier' },
      }, request);
    }

    const resumesTable = await getResumesTable();

    const resumes: Array<{
      id: string;
      templateStyle: string;
      language: string;
      createdAt: string;
      updatedAt: string;
      personalInfo?: { fullName: string; email: string };
    }> = [];

    // SECURITY: User ID is validated above, safe to use in query
    // List all resumes for this user
    const entities = resumesTable.listEntities<ResumeEntity>({
      queryOptions: {
        filter: `PartitionKey eq '${auth.user.id}'`,
      },
    });

    for await (const entity of entities) {
      const data = JSON.parse(entity.data);
      resumes.push({
        id: entity.id,
        templateStyle: entity.templateStyle,
        language: entity.language,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        personalInfo: data.personalInfo
          ? {
              fullName: data.personalInfo.fullName,
              email: data.personalInfo.email,
            }
          : undefined,
      });
    }

    // Sort by updatedAt descending
    resumes.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return secureResponse({
      status: 200,
      jsonBody: {
        success: true,
        resumes,
        count: resumes.length,
      },
    }, request);
  } catch (error) {
    context.error('List resumes error:', error);
    return secureResponse({
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred while fetching resumes',
      },
    }, request);
  }
}

app.http('listResumes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'resume/list',
  handler: listResumes,
});
