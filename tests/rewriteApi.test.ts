/**
 * rewriteField Client API Helper Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { rewriteField } from '@/lib/rewriteApi';

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('rewriteField', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('should call /api/resume/rewrite with correct body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, rewritten: 'Improved text' }),
    });

    await rewriteField('responsibility', 'Built stuff');

    expect(mockFetch).toHaveBeenCalledWith('/api/resume/rewrite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fieldType: 'responsibility',
        currentValue: 'Built stuff',
        context: undefined,
        language: 'en',
      }),
    });
  });

  it('should return the rewritten text on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, rewritten: 'Enhanced bullet point' }),
    });

    const result = await rewriteField('responsibility', 'Did work');
    expect(result).toBe('Enhanced bullet point');
  });

  it('should pass context and language through', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, rewritten: 'Improved' }),
    });

    await rewriteField(
      'job_title',
      'dev',
      { jobTitle: 'Developer', section: 'work' },
      'es'
    );

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.context).toEqual({ jobTitle: 'Developer', section: 'work' });
    expect(body.language).toBe('es');
  });

  it('should return null on non-200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    const result = await rewriteField('responsibility', 'text');
    expect(result).toBeNull();
  });

  it('should return null when API returns success: false', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: false, error: 'Rate limited' }),
    });

    const result = await rewriteField('responsibility', 'text');
    expect(result).toBeNull();
  });

  it('should return null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await rewriteField('responsibility', 'text');
    expect(result).toBeNull();
  });
});
