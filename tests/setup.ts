/**
 * Test Setup File
 * Configures testing environment for Vitest
 */

import '@testing-library/jest-dom';

// Mock import.meta.env
const mockEnv = {
  DEV: true,
  PROD: false,
  VITE_API_URL: '/api',
};

Object.defineProperty(import.meta, 'env', {
  value: mockEnv,
  writable: true,
});

// Mock fetch globally
global.fetch = vi.fn();

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});
