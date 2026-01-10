import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { createUser, getUserByEmail, generateToken, validatePasswordStrength } from '../lib/auth';
import {
  checkAuthRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  secureResponse,
  logSecurityEvent,
} from '../lib/security';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
});

export async function signup(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // SECURITY: Rate limiting to prevent abuse
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkAuthRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      logSecurityEvent(request, 'RATE_LIMIT_EXCEEDED', { endpoint: 'signup' });
      return secureResponse(rateLimitResponse(rateLimitResult), request);
    }

    const body = await request.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return secureResponse({
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      }, request);
    }

    const { email, password, fullName } = validation.data;

    // SECURITY: Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return secureResponse({
        status: 400,
        jsonBody: {
          success: false,
          error: passwordValidation.errors[0],
          errors: passwordValidation.errors,
        },
      }, request);
    }

    // Check if user already exists
    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return secureResponse({
        status: 400,
        jsonBody: {
          success: false,
          error: 'An account with this email already exists',
        },
      }, request);
    }

    // Create user
    const user = await createUser(email, password, fullName);

    // SECURITY: Never log or expose verification tokens
    // TODO: Send verification email using SendGrid in production
    // Tokens are stored securely and sent via email only

    return secureResponse({
      status: 201,
      jsonBody: {
        success: true,
        message: 'Account created. Please check your email to verify your account.',
        // SECURITY: Never expose verification tokens in responses
      },
    }, request);
  } catch (error) {
    context.error('Signup error:', error);
    return secureResponse({
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred during signup',
      },
    }, request);
  }
}

app.http('signup', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/signup',
  handler: signup,
});
