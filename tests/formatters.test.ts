/**
 * Unit tests for formatting utilities
 * Tests phone number and city/state formatting with various input formats
 */

import { describe, it, expect } from 'vitest';
import { formatPhoneNumber, formatCityState } from '../src/lib/formatters';

describe('formatPhoneNumber', () => {
  describe('10-digit US numbers', () => {
    it('formats plain 10 digits', () => {
      expect(formatPhoneNumber('5551234567')).toBe('(555) 123-4567');
    });

    it('formats number with dashes', () => {
      expect(formatPhoneNumber('555-123-4567')).toBe('(555) 123-4567');
    });

    it('formats number with dots', () => {
      expect(formatPhoneNumber('555.123.4567')).toBe('(555) 123-4567');
    });

    it('formats number with spaces', () => {
      expect(formatPhoneNumber('555 123 4567')).toBe('(555) 123-4567');
    });

    it('formats number with mixed separators', () => {
      expect(formatPhoneNumber('555-123.4567')).toBe('(555) 123-4567');
    });
  });

  describe('11-digit numbers with country code', () => {
    it('formats 11 digits starting with 1', () => {
      expect(formatPhoneNumber('15551234567')).toBe('(555) 123-4567');
    });

    it('formats +1 prefix', () => {
      expect(formatPhoneNumber('+1 555 123 4567')).toBe('(555) 123-4567');
    });

    it('formats 1- prefix', () => {
      expect(formatPhoneNumber('1-555-123-4567')).toBe('(555) 123-4567');
    });
  });

  describe('already formatted numbers', () => {
    it('normalizes already formatted number', () => {
      expect(formatPhoneNumber('(555) 123-4567')).toBe('(555) 123-4567');
    });

    it('normalizes number with extra spaces', () => {
      expect(formatPhoneNumber('( 555 ) 123 - 4567')).toBe('(555) 123-4567');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(formatPhoneNumber('')).toBe('');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatPhoneNumber(null as unknown as string)).toBe('');
      expect(formatPhoneNumber(undefined as unknown as string)).toBe('');
    });

    it('returns original for too few digits', () => {
      expect(formatPhoneNumber('555-1234')).toBe('555-1234');
    });

    it('returns original for too many digits', () => {
      expect(formatPhoneNumber('155512345678')).toBe('155512345678');
    });

    it('returns original for international numbers', () => {
      expect(formatPhoneNumber('+44 20 7946 0958')).toBe('+44 20 7946 0958');
    });

    it('returns original for non-1 country codes', () => {
      expect(formatPhoneNumber('25551234567')).toBe('25551234567');
    });
  });
});

describe('formatCityState', () => {
  describe('lowercase city and full state name', () => {
    it('formats "austin texas"', () => {
      expect(formatCityState('austin texas')).toBe('Austin, TX');
    });

    it('formats "new york new york"', () => {
      expect(formatCityState('new york new york')).toBe('New York, NY');
    });

    it('formats "los angeles california"', () => {
      expect(formatCityState('los angeles california')).toBe('Los Angeles, CA');
    });

    it('formats multi-word state names', () => {
      expect(formatCityState('charlotte north carolina')).toBe('Charlotte, NC');
    });

    it('formats "charleston west virginia"', () => {
      expect(formatCityState('charleston west virginia')).toBe('Charleston, WV');
    });
  });

  describe('city with state abbreviation', () => {
    it('formats "austin tx"', () => {
      expect(formatCityState('austin tx')).toBe('Austin, TX');
    });

    it('formats "new york ny"', () => {
      expect(formatCityState('new york ny')).toBe('New York, NY');
    });

    it('formats "Austin TX" (mixed case)', () => {
      expect(formatCityState('Austin TX')).toBe('Austin, TX');
    });

    it('formats "AUSTIN TX" (all caps)', () => {
      expect(formatCityState('AUSTIN TX')).toBe('Austin, TX');
    });
  });

  describe('already formatted input', () => {
    it('preserves "San Francisco, CA"', () => {
      expect(formatCityState('San Francisco, CA')).toBe('San Francisco, CA');
    });

    it('normalizes "austin, tx" to proper case', () => {
      expect(formatCityState('austin, tx')).toBe('Austin, TX');
    });

    it('handles "New York, NY" with proper formatting', () => {
      expect(formatCityState('New York, NY')).toBe('New York, NY');
    });

    it('normalizes "AUSTIN, TX" to title case', () => {
      expect(formatCityState('AUSTIN, TX')).toBe('Austin, TX');
    });
  });

  describe('comma-separated with full state name', () => {
    it('formats "Austin, Texas"', () => {
      expect(formatCityState('Austin, Texas')).toBe('Austin, TX');
    });

    it('formats "New York, New York"', () => {
      expect(formatCityState('New York, New York')).toBe('New York, NY');
    });

    it('formats "Seattle, Washington"', () => {
      expect(formatCityState('Seattle, Washington')).toBe('Seattle, WA');
    });
  });

  describe('territories and special cases', () => {
    it('formats "washington dc"', () => {
      expect(formatCityState('washington dc')).toBe('Washington, DC');
    });

    it('formats "Washington, District of Columbia"', () => {
      expect(formatCityState('Washington, District of Columbia')).toBe('Washington, DC');
    });

    it('formats "san juan pr"', () => {
      expect(formatCityState('san juan pr')).toBe('San Juan, PR');
    });
  });

  describe('edge cases', () => {
    it('returns empty string for empty input', () => {
      expect(formatCityState('')).toBe('');
    });

    it('returns empty string for whitespace only', () => {
      expect(formatCityState('   ')).toBe('');
    });

    it('returns empty string for null/undefined', () => {
      expect(formatCityState(null as unknown as string)).toBe('');
      expect(formatCityState(undefined as unknown as string)).toBe('');
    });

    it('returns title-cased input for unrecognized format', () => {
      expect(formatCityState('london')).toBe('London');
    });

    it('returns title-cased input for international cities', () => {
      expect(formatCityState('london uk')).toBe('London Uk');
    });

    it('handles extra whitespace', () => {
      expect(formatCityState('  austin   texas  ')).toBe('Austin, TX');
    });
  });

  describe('real-world variations', () => {
    it('handles common typos and variations', () => {
      // These should still work with the state abbreviation
      expect(formatCityState('philly pa')).toBe('Philly, PA');
      expect(formatCityState('vegas nv')).toBe('Vegas, NV');
      expect(formatCityState('la ca')).toBe('La, CA');
    });

    it('handles city names with special characters', () => {
      expect(formatCityState("st. louis missouri")).toBe('St. Louis, MO');
    });
  });
});
