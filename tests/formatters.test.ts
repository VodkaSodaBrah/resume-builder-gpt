/**
 * Unit tests for formatting utilities
 * Tests phone number and city/state formatting with various input formats
 */

import { describe, it, expect } from 'vitest';
import {
  formatPhoneNumber,
  formatCityState,
  cleanBulletText,
  formatDate,
  formatFieldValue,
} from '../src/lib/formatters';

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

// ============================================================================
// cleanBulletText Tests
// ============================================================================

describe('cleanBulletText', () => {
  it('strips bullet character from single line', () => {
    expect(cleanBulletText('• Managed a team of 5')).toBe('Managed a team of 5');
  });

  it('strips dash prefix from single line', () => {
    expect(cleanBulletText('- Led daily standups')).toBe('Led daily standups');
  });

  it('strips asterisk prefix from single line', () => {
    expect(cleanBulletText('* Implemented new features')).toBe('Implemented new features');
  });

  it('handles multi-line bullet text', () => {
    const input = '• Line one\n• Line two\n• Line three';
    expect(cleanBulletText(input)).toBe('Line one\nLine two\nLine three');
  });

  it('handles mixed bullet prefixes', () => {
    const input = '• First item\n- Second item\n* Third item';
    expect(cleanBulletText(input)).toBe('First item\nSecond item\nThird item');
  });

  it('preserves text without bullet prefixes', () => {
    expect(cleanBulletText('Just plain text')).toBe('Just plain text');
  });

  it('handles leading whitespace before bullet character', () => {
    expect(cleanBulletText('  • Indented bullet')).toBe('Indented bullet');
  });

  it('filters out empty lines', () => {
    const input = '• Line one\n\n• Line two';
    expect(cleanBulletText(input)).toBe('Line one\nLine two');
  });

  it('returns empty string for empty input', () => {
    expect(cleanBulletText('')).toBe('');
  });

  it('handles null/undefined gracefully', () => {
    expect(cleanBulletText(null as unknown as string)).toBe('');
    expect(cleanBulletText(undefined as unknown as string)).toBe('');
  });
});

// ============================================================================
// formatDate Tests
// ============================================================================

describe('formatDate', () => {
  it('capitalizes lowercase month name', () => {
    expect(formatDate('may 2023')).toBe('May 2023');
  });

  it('capitalizes "january 2020"', () => {
    expect(formatDate('january 2020')).toBe('January 2020');
  });

  it('passes through already capitalized date', () => {
    expect(formatDate('May 2023')).toBe('May 2023');
  });

  it('passes through year-only input', () => {
    expect(formatDate('2022')).toBe('2022');
  });

  it('trims whitespace', () => {
    expect(formatDate('  may 2023  ')).toBe('May 2023');
  });

  it('handles empty string', () => {
    expect(formatDate('')).toBe('');
  });

  it('handles null/undefined gracefully', () => {
    expect(formatDate(null as unknown as string)).toBe('');
    expect(formatDate(undefined as unknown as string)).toBe('');
  });

  it('capitalizes "december 2025"', () => {
    expect(formatDate('december 2025')).toBe('December 2025');
  });
});

// ============================================================================
// formatFieldValue routing for new formatters
// ============================================================================

describe('formatFieldValue routing', () => {
  it('applies cleanBulletText for responsibilities path', () => {
    const result = formatFieldValue('workExperience[0].responsibilities', '• Built APIs\n• Led team');
    expect(result).toBe('Built APIs\nLed team');
  });

  it('applies formatDate for startDate path', () => {
    const result = formatFieldValue('workExperience[0].startDate', 'may 2023');
    expect(result).toBe('May 2023');
  });

  it('applies formatDate for endDate path', () => {
    const result = formatFieldValue('workExperience[0].endDate', 'december 2024');
    expect(result).toBe('December 2024');
  });

  it('applies formatDate for volunteering startDate', () => {
    const result = formatFieldValue('volunteering[0].startDate', 'june 2021');
    expect(result).toBe('June 2021');
  });

  it('applies cleanBulletText for volunteering responsibilities', () => {
    const result = formatFieldValue('volunteering[0].responsibilities', '- Organized events');
    expect(result).toBe('Organized events');
  });
});
