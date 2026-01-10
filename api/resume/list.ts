import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { authenticateRequest } from '../lib/auth';
import { getResumesTable, ResumeEntity } from '../lib/storage';

export async function listResumes(
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

    const resumesTable = await getResumesTable();

    const resumes: Array<{
      id: string;
      templateStyle: string;
      language: string;
      createdAt: string;
      updatedAt: string;
      personalInfo?: { fullName: string; email: string };
    }> = [];

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

    return {
      status: 200,
      jsonBody: {
        success: true,
        resumes,
        count: resumes.length,
      },
    };
  } catch (error) {
    context.error('List resumes error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred while fetching resumes',
      },
    };
  }
}

app.http('listResumes', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'resume/list',
  handler: listResumes,
});
