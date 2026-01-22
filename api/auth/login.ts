import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { getUserByEmail, comparePassword, generateToken, updateUser } from '../_lib/auth';
import {
  checkAuthRateLimit,
  getClientIdentifier,
  rateLimitResponse,
  secureResponse,
  logSecurityEvent,
} from '../_lib/security';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
    // SECURITY: Rate limiting to prevent brute force attacks
    const clientId = getClientIdentifier(request);
    const rateLimitResult = checkAuthRateLimit(clientId);

    if (!rateLimitResult.allowed) {
      logSecurityEvent(request, 'RATE_LIMIT_EXCEEDED', { endpoint: 'login' });
      return secureResponse(rateLimitResponse(rateLimitResult), request);
    }

    const body = await request.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return {
        status: 400,
        jsonBody: {
          success: false,
          error: validation.error.errors[0].message,
        },
      };
    }

    const { email, password } = validation.data;

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      // SECURITY: Log failed login attempt
      logSecurityEvent(request, 'AUTH_FAILURE', { reason: 'user_not_found', email });
      return secureResponse({
        status: 401,
        jsonBody: {
          success: false,
          error: 'Invalid email or password',
        },
      }, request);
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      // SECURITY: Log failed login attempt
      logSecurityEvent(request, 'AUTH_FAILURE', { reason: 'invalid_password', email });
      return secureResponse({
        status: 401,
        jsonBody: {
          success: false,
          error: 'Invalid email or password',
        },
      }, request);
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return secureResponse({
        status: 403,
        jsonBody: {
          success: false,
          error: 'Please verify your email before logging in',
        },
      }, request);
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    // Update last login
    await updateUser(user.email, {
      lastLoginAt: new Date().toISOString(),
    });

    return secureResponse({
      status: 200,
      jsonBody: {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          emailVerified: user.emailVerified,
          createdAt: user.createdAt,
          lastLoginAt: new Date().toISOString(),
        },
      },
    }, request);
  } catch (error) {
    context.error('Login error:', error);
    return secureResponse({
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred during login',
      },
    }, request);
  }
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
