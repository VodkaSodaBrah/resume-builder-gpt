import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { createUser, getUserByEmail, generateToken } from '../lib/auth';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

export async function signup(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      };
    }

    const { email, password, fullName } = validation.data;

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: 'An account with this email already exists',
        },
      };
    }

    // Create user
    const user = await createUser(email, password, fullName);

    // TODO: Send verification email using SendGrid
    // For now, we'll include the verification token in the response for testing
    context.log(`Verification token for ${email}: ${user.emailVerificationToken}`);

    return {
      status: 201,
      jsonBody: {
        success: true,
        message: 'Account created. Please check your email to verify your account.',
        // Remove this in production - only for testing
        ...(process.env.NODE_ENV === 'development' && {
          verificationToken: user.emailVerificationToken,
        }),
      },
    };
  } catch (error) {
    context.error('Signup error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred during signup',
      },
    };
  }
}

app.http('signup', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/signup',
  handler: signup,
});
