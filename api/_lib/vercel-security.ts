/**
 * Security middleware for Vercel API routes
 * Validates referrer/origin for widget protection
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

// Allowed origins for the widget and API
const ALLOWED_ORIGINS = [
  'https://childressdigital.com',
  'https://www.childressdigital.com',
];

// Development origins (only in dev mode)
const DEV_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

/**
 * Get allowed origins based on environment
 */
function getAllowedOrigins(): string[] {
  const isDev = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'development';
  return isDev ? [...ALLOWED_ORIGINS, ...DEV_ORIGINS] : ALLOWED_ORIGINS;
}

/**
 * Validate request origin/referrer
 * Returns true if the request is from an allowed origin
 */
export function validateOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const allowedOrigins = getAllowedOrigins();

  // Check origin header first
  if (origin) {
    return allowedOrigins.some(allowed => origin.startsWith(allowed));
  }

  // Fall back to referer header
  if (referer) {
    return allowedOrigins.some(allowed => referer.startsWith(allowed));
  }

  // In development, allow requests without origin/referer (direct API testing)
  const isDev = process.env.NODE_ENV !== 'production' || process.env.VERCEL_ENV === 'development';
  return isDev;
}

/**
 * Handle CORS preflight requests
 */
export function handleCors(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin || '';
  const allowedOrigins = getAllowedOrigins();

  // Set CORS headers
  const allowedOrigin = allowedOrigins.find(allowed => origin.startsWith(allowed));
  if (allowedOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
  } else if (process.env.NODE_ENV !== 'production') {
    // In dev, be more permissive
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Max-Age', '86400');

  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }

  return false;
}

/**
 * Security middleware wrapper
 * Returns an error response if validation fails, null if valid
 */
export function securityCheck(
  req: VercelRequest,
  res: VercelResponse
): boolean {
  // Handle CORS preflight
  if (handleCors(req, res)) {
    return true; // Request handled (OPTIONS)
  }

  // Validate origin
  if (!validateOrigin(req)) {
    res.status(403).json({
      success: false,
      error: 'Forbidden: Invalid origin',
    });
    return true; // Request handled (rejected)
  }

  return false; // Request not handled, continue processing
}
