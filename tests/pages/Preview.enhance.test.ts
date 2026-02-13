/**
 * Preview Enhancement Tests
 * Verifies enhanceWithAI error handling and single-attempt guard behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally (already done in setup.ts, but be explicit)
const mockFetch = vi.fn();
global.fetch = mockFetch;

// We need to import enhanceWithAI -- it will be exported from Preview.tsx
// For now, import the module to get the exported function
import { enhanceWithAI } from '@/pages/Preview';

describe('enhanceWithAI', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should return enhanced data on successful response', async () => {
    const mockResult = [{ enhanced: 'Improved bullet points' }];
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, result: mockResult }),
    });

    const result = await enhanceWithAI(
      [{ jobTitle: 'Engineer', responsibilities: 'Built stuff' }],
      'en'
    );

    expect(result).toEqual(mockResult);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/resume/enhance', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('should return null on non-200 response without parsing JSON', async () => {
    const jsonSpy = vi.fn().mockRejectedValue(new Error('Should not be called'));
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: jsonSpy,
    });

    const result = await enhanceWithAI(
      [{ jobTitle: 'Engineer', responsibilities: 'Built stuff' }],
      'en'
    );

    expect(result).toBeNull();
    // Verify json() was NOT called on the error response
    expect(jsonSpy).not.toHaveBeenCalled();
  });

  it('should return null on 404 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: vi.fn(),
    });

    const result = await enhanceWithAI(
      [{ jobTitle: 'Engineer', responsibilities: 'Built stuff' }],
      'en'
    );

    expect(result).toBeNull();
  });

  it('should return null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Failed to fetch'));

    const result = await enhanceWithAI(
      [{ jobTitle: 'Engineer', responsibilities: 'Built stuff' }],
      'en'
    );

    expect(result).toBeNull();
  });

  it('should return null when API returns success: false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Rate limited' }),
    });

    const result = await enhanceWithAI(
      [{ jobTitle: 'Engineer', responsibilities: 'Built stuff' }],
      'en'
    );

    expect(result).toBeNull();
  });
});
