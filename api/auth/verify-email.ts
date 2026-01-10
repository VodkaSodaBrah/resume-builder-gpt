import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { verifyUserEmail, generateToken } from '../lib/auth';

const verifySchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
});

export async function verifyEmail(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const validation = verifySchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      };
    }

    const { token } = validation.data;

    // Verify email
    const user = await verifyUserEmail(token);
    if (!user) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'Invalid or expired verification token',
        },
      };
    }

    // Generate auth token
    const authToken = generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      status: 200,
      jsonBody: {
        success: true,
        message: 'Email verified successfully',
        token: authToken,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: true,
          createdAt: user.createdAt,
        },
      },
    };
  } catch (error) {
    context.error('Verify email error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred during email verification',
      },
    };
  }
}

app.http('verifyEmail', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/verify-email',
  handler: verifyEmail,
});
