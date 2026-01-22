/**
 * Formatting utilities for user input normalization (API version)
 * Ensures consistent display of phone numbers and city/state
 */

/**
 * Format phone number to (XXX) XXX-XXXX
 * Handles various input formats: 5551234567, 555-123-4567, 555.123.4567, +1 555 123 4567
 * Returns original input if it cannot be parsed as a US phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return phone || '';
  }

  // Strip all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Handle 11-digit with country code (1)
  if (digits.length === 11 && digits[0] === '1') {
    return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // Return as-is if can't format (international, partial, etc.)
  return phone;
}

/**
 * US State name to abbreviation mapping
 */
const STATE_ABBREVIATIONS: Record<string, string> = {
  'alabama': 'AL',
  'alaska': 'AK',
  'arizona': 'AZ',
  'arkansas': 'AR',
  'california': 'CA',
  'colorado': 'CO',
  'connecticut': 'CT',
  'delaware': 'DE',
  'florida': 'FL',
  'georgia': 'GA',
  'hawaii': 'HI',
  'idaho': 'ID',
  'illinois': 'IL',
  'indiana': 'IN',
  'iowa': 'IA',
  'kansas': 'KS',
  'kentucky': 'KY',
  'louisiana': 'LA',
  'maine': 'ME',
  'maryland': 'MD',
  'massachusetts': 'MA',
  'michigan': 'MI',
  'minnesota': 'MN',
  'mississippi': 'MS',
  'missouri': 'MO',
  'montana': 'MT',
  'nebraska': 'NE',
  'nevada': 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  'ohio': 'OH',
  'oklahoma': 'OK',
  'oregon': 'OR',
  'pennsylvania': 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  'tennessee': 'TN',
  'texas': 'TX',
  'utah': 'UT',
  'vermont': 'VT',
  'virginia': 'VA',
  'washington': 'WA',
  'west virginia': 'WV',
  'wisconsin': 'WI',
  'wyoming': 'WY',
  'district of columbia': 'DC',
  'puerto rico': 'PR',
  'guam': 'GU',
  'virgin islands': 'VI',
};

const VALID_ABBREVIATIONS = new Set(Object.values(STATE_ABBREVIATIONS));

function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format city/state to "City, ST" format
 */
export function formatCityState(input: string): string {
  if (!input || typeof input !== 'string') {
    return input || '';
  }

  const trimmed = input.trim();
  if (!trimmed) {
    return '';
  }

  // Check if already properly formatted (City, ST)
  const alreadyFormattedMatch = trimmed.match(/^(.+),\s*([A-Z]{2})$/);
  if (alreadyFormattedMatch) {
    const city = toTitleCase(alreadyFormattedMatch[1].trim());
    const state = alreadyFormattedMatch[2].toUpperCase();
    if (VALID_ABBREVIATIONS.has(state)) {
      return `${city}, ${state}`;
    }
  }

  // Check for "City, State Name" format
  const cityStateNameMatch = trimmed.match(/^(.+),\s*(.+)$/);
  if (cityStateNameMatch) {
    const city = toTitleCase(cityStateNameMatch[1].trim());
    const statePart = cityStateNameMatch[2].trim().toLowerCase();

    if (STATE_ABBREVIATIONS[statePart]) {
      return `${city}, ${STATE_ABBREVIATIONS[statePart]}`;
    }

    const upperState = statePart.toUpperCase();
    if (VALID_ABBREVIATIONS.has(upperState)) {
      return `${city}, ${upperState}`;
    }
  }

  // Try to parse "city state" or "city st" format (no comma)
  const words = trimmed.toLowerCase().split(/\s+/);

  if (words.length >= 2) {
    // Check if last word is a 2-letter state abbreviation
    const lastWord = words[words.length - 1].toUpperCase();
    if (lastWord.length === 2 && VALID_ABBREVIATIONS.has(lastWord)) {
      const cityWords = words.slice(0, -1);
      const city = toTitleCase(cityWords.join(' '));
      return `${city}, ${lastWord}`;
    }

    // Check if last word(s) match a state name
    // Try matching progressively LONGER suffixes first (for "west virginia" before "virginia")
    for (let i = 1; i < words.length; i++) {
      const potentialState = words.slice(i).join(' ');
      if (STATE_ABBREVIATIONS[potentialState]) {
        const cityWords = words.slice(0, i);
        const city = toTitleCase(cityWords.join(' '));
        return `${city}, ${STATE_ABBREVIATIONS[potentialState]}`;
      }
    }
  }

  // If we can't parse it, just return title-cased version
  return toTitleCase(trimmed);
}
