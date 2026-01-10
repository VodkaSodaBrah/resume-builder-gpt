import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { z } from 'zod';
import { getUserByEmail, comparePassword, generateToken, updateUser } from '../lib/auth';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function login(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  try {
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
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: 'Invalid email or password',
        },
      };
    }

    // Check password
    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
      return {
        status: 401,
        jsonBody: {
          success: false,
          error: 'Invalid email or password',
        },
      };
    }

    // Check if email is verified
    if (!user.emailVerified) {
      return {
        status: 403,
        jsonBody: {
          success: false,
          error: 'Please verify your email before logging in',
        },
      };
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

    return {
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
    };
  } catch (error) {
    context.error('Login error:', error);
    return {
      status: 500,
      jsonBody: {
        success: false,
        error: 'An error occurred during login',
      },
    };
  }
}

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: login,
});
