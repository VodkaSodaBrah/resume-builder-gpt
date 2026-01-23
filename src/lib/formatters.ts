/**
 * Formatting utilities for user input normalization
 * Ensures consistent display of phone numbers and city/state across the application
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
  // Common territories
  'district of columbia': 'DC',
  'puerto rico': 'PR',
  'guam': 'GU',
  'virgin islands': 'VI',
};

/**
 * Set of valid state abbreviations for quick lookup
 */
const VALID_ABBREVIATIONS = new Set(Object.values(STATE_ABBREVIATIONS));

/**
 * Convert string to title case (e.g., "new york" -> "New York")
 */
function toTitleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format city/state to "City, ST" format
 * Handles various input formats:
 * - "austin texas" -> "Austin, TX"
 * - "Austin TX" -> "Austin, TX"
 * - "new york ny" -> "New York, NY"
 * - "San Francisco, CA" -> "San Francisco, CA" (already formatted)
 * - "New York, New York" -> "New York, NY"
 *
 * Returns original input if it cannot be parsed
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

  // Check for "City, State Name" format (e.g., "New York, New York")
  const cityStateNameMatch = trimmed.match(/^(.+),\s*(.+)$/);
  if (cityStateNameMatch) {
    const city = toTitleCase(cityStateNameMatch[1].trim());
    const statePart = cityStateNameMatch[2].trim().toLowerCase();

    // Check if it's a full state name
    if (STATE_ABBREVIATIONS[statePart]) {
      return `${city}, ${STATE_ABBREVIATIONS[statePart]}`;
    }

    // Check if it's already an abbreviation
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
    // Start from position 1 (shortest city) to check longest state names first
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

/**
 * ============================================================================
 * COMPREHENSIVE TEXT FORMATTING FOR RESUME DATA
 * ============================================================================
 */

// Dictionary of common company names with correct casing
const COMPANY_DICTIONARY: Record<string, string> = {
  'walmart': 'Walmart',
  'target': 'Target',
  'mcdonalds': "McDonald's",
  'dennys': "Denny's",
  'arbys': "Arby's",
  'wendys': "Wendy's",
  'costco': 'Costco',
  'amazon': 'Amazon',
  'starbucks': 'Starbucks',
  'cvs': 'CVS',
  'walgreens': 'Walgreens',
  'kroger': 'Kroger',
  'home depot': 'Home Depot',
  'lowes': "Lowe's",
  'best buy': 'Best Buy',
  'dollar tree': 'Dollar Tree',
  'dollar general': 'Dollar General',
};

// Dictionary of technical terms with correct casing
const TECH_DICTIONARY: Record<string, string> = {
  'javascript': 'JavaScript',
  'typescript': 'TypeScript',
  'nodejs': 'Node.js',
  'node.js': 'Node.js',
  'reactjs': 'React.js',
  'react.js': 'React.js',
  'react': 'React',
  'vuejs': 'Vue.js',
  'vue.js': 'Vue.js',
  'vue': 'Vue',
  'angular': 'Angular',
  'angularjs': 'AngularJS',
  'mongodb': 'MongoDB',
  'mysql': 'MySQL',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'github': 'GitHub',
  'gitlab': 'GitLab',
  'bitbucket': 'Bitbucket',
  'jquery': 'jQuery',
  'wordpress': 'WordPress',
  'photoshop': 'Photoshop',
  'illustrator': 'Illustrator',
  'indesign': 'InDesign',
  'ms office': 'Microsoft Office',
  'microsoft office': 'Microsoft Office',
  'ms word': 'Microsoft Word',
  'ms excel': 'Microsoft Excel',
  'ms powerpoint': 'Microsoft PowerPoint',
  'excel': 'Excel',
  'word': 'Word',
  'powerpoint': 'PowerPoint',
  'outlook': 'Outlook',
  'quickbooks': 'QuickBooks',
  'salesforce': 'Salesforce',
  'html': 'HTML',
  'css': 'CSS',
  'html5': 'HTML5',
  'css3': 'CSS3',
  'json': 'JSON',
  'xml': 'XML',
  'api': 'API',
  'rest api': 'REST API',
  'graphql': 'GraphQL',
  'sql': 'SQL',
  'nosql': 'NoSQL',
  'aws': 'AWS',
  'azure': 'Azure',
  'google cloud': 'Google Cloud',
  'docker': 'Docker',
  'kubernetes': 'Kubernetes',
  'python': 'Python',
  'java': 'Java',
  'c++': 'C++',
  'c#': 'C#',
  'php': 'PHP',
  'ruby': 'Ruby',
  'swift': 'Swift',
  'kotlin': 'Kotlin',
  'go': 'Go',
  'rust': 'Rust',
};

// Job title abbreviations that should remain uppercase
const JOB_ABBREVIATIONS = new Set([
  'CEO', 'CTO', 'CFO', 'COO', 'VP', 'SVP', 'EVP',
  'IT', 'HR', 'PR', 'QA', 'UI', 'UX', 'RN', 'LPN',
  'EMT', 'CPA', 'CNA', 'MD', 'DDS', 'DVM', 'PA',
]);

/**
 * Format a person's name with proper casing
 * Handles special cases like O'Brien, McDonald, etc.
 */
export function formatName(name: string): string {
  if (!name || typeof name !== 'string') return name;

  const trimmed = name.trim();
  if (!trimmed) return trimmed;

  // Convert to title case first
  let formatted = toTitleCase(trimmed);

  // Handle special prefixes like Mc, Mac, O', etc.
  formatted = formatted.replace(/\bMc([a-z])/g, (match, letter) => `Mc${letter.toUpperCase()}`);
  formatted = formatted.replace(/\bMac([a-z])/g, (match, letter) => `Mac${letter.toUpperCase()}`);
  formatted = formatted.replace(/\bO'([a-z])/g, (match, letter) => `O'${letter.toUpperCase()}`);

  return formatted;
}

/**
 * Format a job title with proper casing
 * Preserves abbreviations like CEO, IT, etc.
 */
export function formatJobTitle(title: string): string {
  if (!title || typeof title !== 'string') return title;

  const trimmed = title.trim();
  if (!trimmed) return trimmed;

  // Split into words and process each
  const words = trimmed.split(' ');
  const formatted = words.map(word => {
    const upperWord = word.toUpperCase();

    // Check if it's a known abbreviation
    if (JOB_ABBREVIATIONS.has(upperWord)) {
      return upperWord;
    }

    // Check if word is already an abbreviation (all caps, 2-4 letters)
    if (word.length >= 2 && word.length <= 4 && word === upperWord) {
      return upperWord;
    }

    // Otherwise, apply title case
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });

  return formatted.join(' ');
}

/**
 * Format a company name with proper casing
 * Uses dictionary for known companies, falls back to title case
 */
export function formatCompanyName(company: string): string {
  if (!company || typeof company !== 'string') return company;

  const trimmed = company.trim();
  if (!trimmed) return trimmed;

  const lowercase = trimmed.toLowerCase();

  // Check dictionary first
  if (COMPANY_DICTIONARY[lowercase]) {
    return COMPANY_DICTIONARY[lowercase];
  }

  // Fall back to title case
  return toTitleCase(trimmed);
}

/**
 * Format an email address (lowercase normalization)
 */
export function formatEmail(email: string): string {
  if (!email || typeof email !== 'string') return email;

  return email.trim().toLowerCase();
}

/**
 * Format a technical skill with proper casing
 * Uses tech terms dictionary for known technologies
 */
export function formatSkill(skill: string): string {
  if (!skill || typeof skill !== 'string') return skill;

  const trimmed = skill.trim();
  if (!trimmed) return trimmed;

  const lowercase = trimmed.toLowerCase();

  // Check tech dictionary first
  if (TECH_DICTIONARY[lowercase]) {
    return TECH_DICTIONARY[lowercase];
  }

  // Check for common patterns
  // Handle .js extensions
  if (lowercase.endsWith('.js')) {
    const base = lowercase.slice(0, -3);
    if (TECH_DICTIONARY[base]) {
      return TECH_DICTIONARY[base] + '.js';
    }
  }

  // Handle "native" suffix
  if (lowercase.includes(' native')) {
    const parts = lowercase.split(' native');
    const base = parts[0].trim();
    if (TECH_DICTIONARY[base]) {
      return TECH_DICTIONARY[base] + ' Native';
    }
  }

  // Fall back to title case
  return toTitleCase(trimmed);
}

/**
 * Format a school name with proper casing
 */
export function formatSchool(school: string): string {
  if (!school || typeof school !== 'string') return school;

  const trimmed = school.trim();
  if (!trimmed) return trimmed;

  return toTitleCase(trimmed);
}

/**
 * Determine which formatter to use based on field path pattern
 */
export function getFormatterForField(fieldPath: string): ((value: string) => string) | null {
  const path = fieldPath.toLowerCase();

  // Name fields
  if (path.includes('fullname') || (path.includes('name') && !path.includes('company') && !path.includes('organization') && !path.includes('school'))) {
    return formatName;
  }

  // Email fields
  if (path.includes('email')) {
    return formatEmail;
  }

  // Phone fields
  if (path.includes('phone')) {
    return formatPhoneNumber;
  }

  // Job title fields
  if (path.includes('jobtitle') || path.includes('role') || path.includes('title')) {
    return formatJobTitle;
  }

  // Company fields
  if (path.includes('companyname') || path.includes('company')) {
    return formatCompanyName;
  }

  // Organization fields (volunteering)
  if (path.includes('organizationname') || path.includes('organization')) {
    return formatCompanyName; // Use same formatter as company
  }

  // School fields
  if (path.includes('schoolname') || path.includes('school') || path.includes('degree') || path.includes('fieldofstudy')) {
    return formatSchool;
  }

  // City fields
  if (path.includes('city') || path.includes('location')) {
    return formatCityState;
  }

  // Skills fields (technical skills, soft skills, certifications)
  if (path.includes('skills') || path.includes('certifications')) {
    return formatSkill;
  }

  return null;
}

/**
 * Apply appropriate formatting to a value based on its field path
 */
export function formatFieldValue(fieldPath: string, value: unknown): unknown {
  if (!value) return value;

  // Handle string values
  if (typeof value === 'string') {
    const formatter = getFormatterForField(fieldPath);
    return formatter ? formatter(value) : value;
  }

  // Handle arrays of strings (e.g., skills arrays)
  if (Array.isArray(value)) {
    const formatter = getFormatterForField(fieldPath);
    if (formatter) {
      return value.map(item =>
        typeof item === 'string' ? formatter(item) : item
      );
    }
  }

  return value;
}
