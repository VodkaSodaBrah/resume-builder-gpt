import { HttpRequest, HttpResponseInit } from '@azure/functions';

// ============================================================================
// Rate Limiting
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory rate limit store (for Azure Functions, consider using Redis or Table Storage for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Configuration
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX_REQUESTS = 100; // Max requests per window for general endpoints
const AUTH_RATE_LIMIT_MAX_REQUESTS = 5; // Max auth attempts per window (stricter for auth)
const AUTH_RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window for auth

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 60000); // Clean every minute

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

export const checkRateLimit = (
  identifier: string,
  maxRequests: number = RATE_LIMIT_MAX_REQUESTS,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): RateLimitResult => {
  const now = Date.now();
  const key = identifier;
  let entry = rateLimitStore.get(key);

  // Reset if window has passed
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    };
  }

  return {
    allowed: true,
    remaining: maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
};

export const checkAuthRateLimit = (identifier: string): RateLimitResult => {
  return checkRateLimit(
    `auth:${identifier}`,
    AUTH_RATE_LIMIT_MAX_REQUESTS,
    AUTH_RATE_LIMIT_WINDOW_MS
  );
};

export const getClientIdentifier = (request: HttpRequest): string => {
  // Try to get the real IP from various headers (Azure, proxies, etc.)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to connection info (may not be available in all Azure Function scenarios)
  return request.headers.get('x-client-ip') || 'unknown';
};

export const rateLimitResponse = (result: RateLimitResult): HttpResponseInit => {
  return {
    status: 429,
    headers: {
      'Retry-After': String(result.retryAfter || 60),
      'X-RateLimit-Limit': String(AUTH_RATE_LIMIT_MAX_REQUESTS),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    },
    jsonBody: {
      success: false,
      error: 'Too many requests. Please try again later.',
      retryAfter: result.retryAfter,
    },
  };
};

// ============================================================================
// CSRF Protection
// ============================================================================

import { v4 as uuidv4 } from 'uuid';

// CSRF token store (for production, use distributed cache)
const csrfTokenStore = new Map<string, { token: string; expires: number }>();

const CSRF_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export const generateCsrfToken = (sessionId: string): string => {
  const token = uuidv4();
  csrfTokenStore.set(sessionId, {
    token,
    expires: Date.now() + CSRF_TOKEN_EXPIRY_MS,
  });
  return token;
};

export const validateCsrfToken = (sessionId: string, token: string): boolean => {
  const stored = csrfTokenStore.get(sessionId);

  if (!stored) {
    return false;
  }

  if (stored.expires < Date.now()) {
    csrfTokenStore.delete(sessionId);
    return false;
  }

  // Use timing-safe comparison
  if (stored.token.length !== token.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < stored.token.length; i++) {
    result |= stored.token.charCodeAt(i) ^ token.charCodeAt(i);
  }

  return result === 0;
};

// ============================================================================
// Security Headers
// ============================================================================

export const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export const corsHeaders = (origin: string | null): Record<string, string> => {
  // In production, configure allowed origins
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  const isAllowed = !origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin);

  return {
    'Access-Control-Allow-Origin': isAllowed && origin ? origin : allowedOrigins[0] || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400',
  };
};

// ============================================================================
// Input Validation
// ============================================================================

export const sanitizeHtml = (input: string): string => {
  // Basic HTML entity encoding to prevent XSS
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const isValidUuid = (uuid: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

// ============================================================================
// Secure Response Helper
// ============================================================================

export const secureResponse = (
  response: HttpResponseInit,
  request: HttpRequest
): HttpResponseInit => {
  const origin = request.headers.get('origin');

  return {
    ...response,
    headers: {
      ...response.headers,
      ...securityHeaders,
      ...corsHeaders(origin),
    },
  };
};

// ============================================================================
// Security Event Logging
// ============================================================================

export type SecurityEventType =
  | 'AUTH_FAILURE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INVALID_TOKEN'
  | 'SUSPICIOUS_INPUT'
  | 'UNAUTHORIZED_ACCESS'
  | 'CSRF_FAILURE';

export interface SecurityEvent {
  type: SecurityEventType;
  timestamp: string;
  ip: string;
  userAgent?: string;
  details: Record<string, unknown>;
}

export const logSecurityEvent = (
  request: HttpRequest,
  type: SecurityEventType,
  details: Record<string, unknown> = {}
): void => {
  const event: SecurityEvent = {
    type,
    timestamp: new Date().toISOString(),
    ip: getClientIdentifier(request),
    userAgent: request.headers.get('user-agent') || undefined,
    details,
  };

  // In production, send to Azure Monitor, Application Insights, or SIEM
  console.warn('[SECURITY EVENT]', JSON.stringify(event));
};
